import { z } from "zod";
import { emailVerificationRequiredResponse, isEmailVerified } from "@/lib/auth/email-verification";
import { getCurrentUser } from "@/lib/auth/session";
import {
  defaultGroqModel,
  requestGroqChatCompletion,
  safeParseGroqJsonContent,
  sanitizeModelContentPreview,
  sanitizeProviderMessage,
} from "@/lib/ai/groq";
import {
  buildJournalInsightPrompt,
  buildJournalInsightSystemInstruction,
  isAcceptableJournalInsightTitle,
  isAcceptableMoodTags,
  journalInsightRequestSchema,
  journalInsightResponseSchema,
  normalizeJournalInsightTitle,
  normalizeMoodTags,
} from "@/lib/ai/journal-insights";
import { checkOptionalRateLimit } from "@/lib/cache/rate-limit";
import { journalEnhancementStyles } from "@/lib/ai/journal-styles";
import { jsonError } from "@/lib/security/validation";
import { formatTemperature } from "@/lib/utils";

const journalInsightsRequestSchema = journalInsightRequestSchema.extend({
  style: z.enum(journalEnhancementStyles).optional(),
});

function configuredModels() {
  const primary = process.env.GROQ_MODEL?.trim() || defaultGroqModel;
  const fallback = process.env.GROQ_FALLBACK_MODEL?.trim();
  return fallback && fallback !== primary ? [primary, fallback] : [primary];
}

function providerError(status: number) {
  if (status === 429) {
    return Response.json({ error: "AI is busy right now. Try again in a moment." }, { status: 429 });
  }

  return Response.json({ error: "AI provider failed. Please try again later." }, { status: 502 });
}

export async function POST(request: Request) {
  const user = await getCurrentUser().catch(() => null);
  if (!user) return jsonError("Sign in to suggest a title and mood tags.", 401);
  if (!isEmailVerified(user)) return emailVerificationRequiredResponse("Verify your email to use AI journal tools.");

  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) {
    return jsonError("AI enhancement is not configured yet.", 503);
  }

  const rateLimit = await checkOptionalRateLimit({
    scope: "ai:journal-insights",
    identifier: user.id,
    limit: 10,
    duration: "10 m",
  });
  if (!rateLimit.allowed) {
    return Response.json({ error: "AI is busy right now. Try again in a moment." }, { status: 429 });
  }

  const parsed = journalInsightsRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("Check the journal insight details.", 422);

  const input = parsed.data;
  const prompt = buildJournalInsightPrompt({
    note: input.note,
    style: input.style ?? "Aesthetic",
    city: input.city,
    condition: input.condition,
    temperature: formatTemperature(input.temperature, input.units),
    units: input.units,
    capturedAt: input.capturedAt,
    favoriteLabel: input.favoriteLabel ?? null,
    hasPhoto: input.hasPhoto,
  });
  const systemInstruction = buildJournalInsightSystemInstruction(input.style ?? "Aesthetic");
  const models = configuredModels();

  try {
    for (const [index, model] of models.entries()) {
      console.info(`[ai/journal-insights] using Groq model: ${model}`);
      const attempt = await requestGroqChatCompletion({
        apiKey: groqApiKey,
        model,
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: prompt },
        ],
        temperature: 0.45,
        maxCompletionTokens: 120,
      });

      if (!attempt.response.ok) {
        console.error("[ai/journal-insights] Groq provider failure", {
          model,
          status: attempt.response.status,
          statusText: attempt.response.statusText,
          providerMessage: sanitizeProviderMessage(attempt.responseText) || "No provider message returned.",
        });

        if (index < models.length - 1 && attempt.response.status !== 429) continue;
        return providerError(attempt.response.status);
      }

      const parsedPayload = safeParseGroqJsonContent(attempt.responseText, journalInsightResponseSchema);
      if (!parsedPayload.success) {
        console.error("[ai/journal-insights] Groq content failed schema validation", {
          model,
          preview: parsedPayload.content
            ? sanitizeModelContentPreview(parsedPayload.content)
            : "No model content returned.",
          reason: parsedPayload.error,
          issues: parsedPayload.issues?.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        });
        if (index < models.length - 1) continue;
        return Response.json({ error: "AI provider failed. Please try again later." }, { status: 502 });
      }

      const normalizedTitle = normalizeJournalInsightTitle(parsedPayload.data.title);
      const normalizedTags = normalizeMoodTags(parsedPayload.data.moodTags);

      if (!isAcceptableJournalInsightTitle(normalizedTitle) || !isAcceptableMoodTags(normalizedTags, input.note)) {
        console.error("[ai/journal-insights] Groq output failed quality safeguards", {
          model,
          titleWordCount: normalizedTitle.split(/\s+/).filter(Boolean).length,
          tagCount: normalizedTags.length,
          preview: sanitizeModelContentPreview(parsedPayload.content),
        });
        if (index < models.length - 1) continue;
        return Response.json({ error: "AI provider failed. Please try again later." }, { status: 502 });
      }

      return Response.json({
        title: normalizedTitle,
        moodTags: normalizedTags,
      });
    }

    return Response.json({ error: "AI provider failed. Please try again later." }, { status: 502 });
  } catch (error) {
    console.error("[ai/journal-insights] Groq request failed", {
      model: models[0] ?? defaultGroqModel,
      message: error instanceof Error ? sanitizeProviderMessage(error.message) : "Unknown request failure",
    });
    return Response.json({ error: "AI provider failed. Please try again later." }, { status: 502 });
  }
}
