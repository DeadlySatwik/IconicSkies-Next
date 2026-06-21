import { getCurrentUser } from "@/lib/auth/session";
import {
  buildMonthlyRecapPrompt,
  buildMonthlyRecapSystemInstruction,
  monthlyRecapRequestSchema,
  monthlyRecapResponseSchema,
} from "@/lib/ai/monthly-recap";
import {
  defaultGroqModel,
  requestGroqChatCompletion,
  safeParseGroqJsonContent,
  sanitizeModelContentPreview,
  sanitizeProviderMessage,
} from "@/lib/ai/groq";
import { getJsonCache, setJsonCache } from "@/lib/cache/json-cache";
import { monthlyRecapCacheKey } from "@/lib/cache/keys";
import { isRedisConfigured } from "@/lib/cache/redis";
import { checkOptionalRateLimit } from "@/lib/cache/rate-limit";
import { favoriteLabelForMoment, listFavoriteLocations } from "@/lib/favorites/service";
import { jsonError } from "@/lib/security/validation";
import {
  buildMonthlyRecapRequestMoments,
  filterMomentsForMonth,
  getMonthKey,
  summarizeMonthlyMoments,
} from "@/lib/sky/monthly-recap";
import { buildMonthlyRecapJournalVersion } from "@/lib/sky/monthly-recap-version";
import { listSkyMoments } from "@/lib/sky/service";

type MonthlyRecapPayload = {
  headline: string;
  recap: string;
  highlights: string[];
  dominantMoods: string[];
  source?: "cache" | "generated";
};

const MONTHLY_RECAP_CACHE_TTL_SECONDS = 60 * 60 * 24 * 30;

function logMonthlyRecap(message: string, details: Record<string, unknown> = {}) {
  if (process.env.NODE_ENV === "production") return;
  console.info(`[ai/monthly-recap] ${message}`, details);
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

  const parsed = monthlyRecapRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("Check the monthly recap details.", 422);

  const monthKey = parsed.data.month ?? getMonthKey();
  const moments = await listSkyMoments(user.id).catch(() => []);
  const monthMoments = filterMomentsForMonth(moments, monthKey);
  const redisConfigured = isRedisConfigured();

  if (monthMoments.length === 0) {
    return jsonError("No saved sky moments for that month.", 404);
  }

  const journalVersion = buildMonthlyRecapJournalVersion(monthMoments);
  const cacheKey = monthlyRecapCacheKey(user.id, monthKey, journalVersion);
  logMonthlyRecap("redis status", {
    redisConfigured,
    monthKey,
    journalVersion,
    cacheKey,
    momentCount: monthMoments.length,
  });
  const cached = await getJsonCache<MonthlyRecapPayload>(cacheKey).catch(() => null);

  if (cached) {
    logMonthlyRecap("cache hit", {
      redisConfigured,
      monthKey,
      journalVersion,
      cacheKey,
      momentCount: monthMoments.length,
    });
    return Response.json({ ...cached, source: "cache" as const });
  }

  logMonthlyRecap("cache miss", {
    redisConfigured,
    monthKey,
    journalVersion,
    cacheKey,
    momentCount: monthMoments.length,
  });

  const rateLimit = await checkOptionalRateLimit({
    scope: "ai:monthly-recap",
    identifier: user.id,
    limit: 3,
    duration: "1 h",
  });
  if (!rateLimit.allowed) {
    logMonthlyRecap("rate limited", {
      redisConfigured,
      monthKey,
      journalVersion,
      cacheKey,
      momentCount: monthMoments.length,
    });
    return Response.json(
      {
        error: "You’ve used a lot of recap requests recently. Try again later.",
        code: "RATE_LIMITED",
      },
      { status: 429 },
    );
  }

  const favorites = await listFavoriteLocations(user.id).catch(() => []);
  const requestMoments = buildMonthlyRecapRequestMoments(monthMoments, monthKey).map((moment, index) => {
    const sourceMoment = monthMoments[index];
    return {
      ...moment,
      favoriteLabel: favoriteLabelForMoment(sourceMoment, favorites) ?? moment.favoriteLabel ?? null,
    };
  });

  const summary = summarizeMonthlyMoments(monthMoments, monthKey);

  const prompt = buildMonthlyRecapPrompt({
    monthLabel: summary.monthLabel,
    moments: requestMoments,
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

      const payload: MonthlyRecapPayload = {
        ...validated.data,
      };
      const stored = await setJsonCache(cacheKey, payload, MONTHLY_RECAP_CACHE_TTL_SECONDS).catch(() => false);
      if (process.env.NODE_ENV === "development") {
        const readBack = await getJsonCache<MonthlyRecapPayload>(cacheKey).catch(() => null);
        console.info("[ai/monthly-recap] cache write verification", {
          monthKey,
          journalVersion,
          cacheKey,
          stored,
          readBack: Boolean(readBack),
        });
      }
      logMonthlyRecap("generated and cached", {
        redisConfigured,
        monthKey,
        journalVersion,
        cacheKey,
        momentCount: monthMoments.length,
        model,
        cacheSetSuccess: stored,
      });
      return Response.json({ ...payload, source: "generated" as const });
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
