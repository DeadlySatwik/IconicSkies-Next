import { getCurrentUser } from "@/lib/auth/session";
import { buildMonthlyRecapPrompt, buildMonthlyRecapSystemInstruction, monthlyRecapRequestSchema, monthlyRecapResponseSchema } from "@/lib/ai/monthly-recap";
import {
  defaultGroqModel,
  requestGroqChatCompletion,
  safeParseGroqJsonContent,
  sanitizeModelContentPreview,
  sanitizeProviderMessage,
} from "@/lib/ai/groq";
import { favoriteLabelForMoment, listFavoriteLocations } from "@/lib/favorites/service";
import { jsonError } from "@/lib/security/validation";
import { filterMomentsForMonth, getMonthKey, summarizeMonthlyMoments } from "@/lib/sky/monthly-recap";
import { listSkyMoments } from "@/lib/sky/service";

const requestWindowMs = 60_000;
const requestLimit = 4;
const requestLog = new Map<string, number[]>();

function assertLightRateLimit(userId: string) {
  const now = Date.now();
  const recent = (requestLog.get(userId) ?? []).filter((timestamp) => now - timestamp < requestWindowMs);
  if (recent.length >= requestLimit) return false;
  recent.push(now);
  requestLog.set(userId, recent);
  return true;
}

function configuredModels() {
  const primary = process.env.GROQ_MODEL?.trim() || defaultGroqModel;
  return [primary];
}

function providerError(status: number) {
  if (status === 429) {
    return Response.json({ error: "AI is busy right now. Try again in a moment." }, { status: 429 });
  }

  return Response.json({ error: "AI provider failed. Please try again later." }, { status: 502 });
}

function buildMonthlyRecapRepairPrompt(content: string) {
  return [
    "Convert this text into valid JSON matching the exact schema.",
    "Return JSON only.",
    "Do not use markdown.",
    "Do not use <think>.",
    "Keep highlights and dominantMoods as arrays.",
    "Input text:",
    content,
  ].join("\n");
}

export async function POST(request: Request) {
  const user = await getCurrentUser().catch(() => null);
  if (!user) return jsonError("Sign in to generate a monthly recap.", 401);

  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) {
    return jsonError("AI enhancement is not configured yet.", 503);
  }

  if (!assertLightRateLimit(user.id)) {
    return Response.json({ error: "AI is busy right now. Try again in a moment." }, { status: 429 });
  }

  const parsed = monthlyRecapRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("Check the monthly recap details.", 422);

  const monthKey = parsed.data.month ?? getMonthKey();
  const [moments, favorites] = await Promise.all([
    listSkyMoments(user.id).catch(() => []),
    listFavoriteLocations(user.id).catch(() => []),
  ]);

  const monthMoments = filterMomentsForMonth(moments, monthKey).slice(0, 20).map((moment) => ({
    city: moment.country ? `${moment.cityName}, ${moment.country}` : moment.cityName,
    condition: moment.condition,
    temperature: `${moment.temperature.toFixed(1)} ${moment.units === "imperial" ? "°F" : "°C"}`,
    capturedAt: moment.capturedAt instanceof Date ? moment.capturedAt.toISOString() : moment.capturedAt,
    title: moment.title?.trim() || null,
    moodTags: Array.isArray(moment.moodTags) ? moment.moodTags.slice(0, 5) : [],
    noteExcerpt: moment.note?.trim()
      ? moment.note.trim().replace(/\s+/g, " ").slice(0, 160)
      : null,
    hasPhoto: Boolean(moment.photoId),
    favoriteLabel: favoriteLabelForMoment(moment, favorites) ?? null,
  }));

  if (monthMoments.length === 0) {
    return jsonError("No saved sky moments for that month.", 404);
  }

  const summary = summarizeMonthlyMoments(
    monthMoments.map((moment) => ({
      id: moment.capturedAt,
      cityName: moment.city,
      country: null,
      condition: moment.condition,
      temperature: Number.parseFloat(moment.temperature),
      units: moment.temperature.endsWith("°F") ? "imperial" : "metric",
      note: moment.noteExcerpt,
      title: moment.title,
      moodTags: moment.moodTags,
      capturedAt: moment.capturedAt,
      photoId: moment.hasPhoto ? "photo" : null,
      favoriteLabel: moment.favoriteLabel,
    })),
    monthKey,
  );

  const prompt = buildMonthlyRecapPrompt({
    monthLabel: summary.monthLabel,
    moments: monthMoments,
  });
  const systemInstruction = buildMonthlyRecapSystemInstruction();
  const models = configuredModels();

  try {
    for (const model of models) {
      console.info(`[ai/monthly-recap] using Groq model: ${model}`);
      const attempt = await requestGroqChatCompletion({
        apiKey: groqApiKey,
        model,
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: prompt },
        ],
        temperature: 0.55,
        maxCompletionTokens: 220,
      });

      if (!attempt.response.ok) {
        console.error("[ai/monthly-recap] Groq provider failure", {
          model,
          status: attempt.response.status,
          statusText: attempt.response.statusText,
          providerMessage: sanitizeProviderMessage(attempt.responseText) || "No provider message returned.",
        });

        return providerError(attempt.response.status);
      }

      let validated = safeParseGroqJsonContent(attempt.responseText, monthlyRecapResponseSchema);
      if (!validated.success) {
        console.error("[ai/monthly-recap] Groq content failed schema validation", {
          model,
          preview: validated.content ? sanitizeModelContentPreview(validated.content) : "No model content returned.",
          reason: validated.error,
          issues: validated.issues?.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        });
        const repairAttempt = await requestGroqChatCompletion({
          apiKey: groqApiKey,
          model,
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: buildMonthlyRecapRepairPrompt(validated.content || attempt.responseText) },
          ],
          temperature: 0.2,
          maxCompletionTokens: 220,
        });

        if (!repairAttempt.response.ok) {
          console.error("[ai/monthly-recap] Groq repair failure", {
            model,
            status: repairAttempt.response.status,
            statusText: repairAttempt.response.statusText,
            providerMessage: sanitizeProviderMessage(repairAttempt.responseText) || "No provider message returned.",
          });
          return providerError(repairAttempt.response.status);
        }

        validated = safeParseGroqJsonContent(repairAttempt.responseText, monthlyRecapResponseSchema);
        if (!validated.success) {
          console.error("[ai/monthly-recap] Groq repair failed schema validation", {
            model,
            preview: validated.content ? sanitizeModelContentPreview(validated.content) : "No model content returned.",
            reason: validated.error,
            issues: validated.issues?.map((issue) => ({
              path: issue.path.join("."),
              message: issue.message,
            })),
          });
          return Response.json({ error: "AI provider failed. Please try again later." }, { status: 502 });
        }
      }

      return Response.json(validated.data);
    }

    return Response.json({ error: "AI provider failed. Please try again later." }, { status: 502 });
  } catch (error) {
    console.error("[ai/monthly-recap] Groq request failed", {
      model: models[0] ?? defaultGroqModel,
      message: error instanceof Error ? sanitizeProviderMessage(error.message) : "Unknown request failure",
    });
    return Response.json({ error: "AI provider failed. Please try again later." }, { status: 502 });
  }
}
