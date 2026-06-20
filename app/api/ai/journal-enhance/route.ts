import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { jsonError, unitsSchema } from "@/lib/security/validation";
import {
  buildJournalEnhancementPrompt,
  buildJournalEnhancementSystemInstruction,
  isWeakEnhancedJournalNote,
  journalEnhancementStyleSchema,
  normalizeEnhancedJournalNote,
} from "@/lib/ai/journal-enhancer";
import { formatTemperature } from "@/lib/utils";

const groqEndpoint = "https://api.groq.com/openai/v1/chat/completions";
const defaultGroqModel = "llama-3.3-70b-versatile";

const journalEnhanceSchema = z.object({
  note: z.string().trim().min(1).max(1200),
  style: journalEnhancementStyleSchema,
  city: z.string().trim().min(1).max(160),
  condition: z.string().trim().min(1).max(120),
  temperature: z.number().finite().min(-100).max(200),
  units: unitsSchema,
  capturedAt: z.string().trim().min(1).max(64).refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "Invalid date",
  }),
  favoriteLabel: z.string().trim().max(120).optional().nullable(),
  hasPhoto: z.boolean().optional().default(false),
});

const requestWindowMs = 60_000;
const requestLimit = 6;
const requestLog = new Map<string, number[]>();

type GroqPayload = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
};

function assertLightRateLimit(userId: string) {
  const now = Date.now();
  const recent = (requestLog.get(userId) ?? []).filter((timestamp) => now - timestamp < requestWindowMs);
  if (recent.length >= requestLimit) {
    return false;
  }

  recent.push(now);
  requestLog.set(userId, recent);
  return true;
}

function sanitizeProviderMessage(message: string) {
  const compact = message.replace(/\s+/g, " ").trim();
  return compact.length > 500 ? `${compact.slice(0, 500)}...` : compact;
}

function sanitizePreview(text: string) {
  const compact = text.replace(/\s+/g, " ").trim();
  return compact.length > 160 ? `${compact.slice(0, 160)}...` : compact;
}

function parseGroqPayload(rawText: string) {
  if (!rawText.trim()) return null;
  try {
    return JSON.parse(rawText) as GroqPayload;
  } catch {
    return null;
  }
}

function extractGroqText(payload: GroqPayload | null) {
  return payload?.choices?.[0]?.message?.content?.trim() ?? "";
}

function configuredModels() {
  const primary = process.env.GROQ_MODEL?.trim() || defaultGroqModel;
  const fallback = process.env.GROQ_FALLBACK_MODEL?.trim();
  return fallback && fallback !== primary ? [primary, fallback] : [primary];
}

async function requestGroq({
  apiKey,
  model,
  systemInstruction,
  prompt,
}: {
  apiKey: string;
  model: string;
  systemInstruction: string;
  prompt: string;
}) {
  const response = await fetch(groqEndpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: prompt },
      ],
      temperature: 0.65,
      max_completion_tokens: 90,
    }),
  });

  const responseText = await response.text().catch(() => "");
  return { response, responseText };
}

function providerError(status: number) {
  if (status === 429) {
    return Response.json({ error: "AI is busy right now. Try again in a moment." }, { status: 429 });
  }

  return Response.json({ error: "AI provider failed. Please try again later." }, { status: 502 });
}

export async function POST(request: Request) {
  const user = await getCurrentUser().catch(() => null);
  if (!user) return jsonError("Sign in to enhance a sky note.", 401);

  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) {
    return jsonError("AI enhancement is not configured yet.", 503);
  }

  if (!assertLightRateLimit(user.id)) {
    return Response.json({ error: "AI is busy right now. Try again in a moment." }, { status: 429 });
  }

  const parsed = journalEnhanceSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("Check the journal note details.", 422);

  const input = parsed.data;
  const prompt = buildJournalEnhancementPrompt({
    note: input.note,
    style: input.style,
    city: input.city,
    condition: input.condition,
    temperature: formatTemperature(input.temperature, input.units),
    units: input.units,
    capturedAt: input.capturedAt,
    favoriteLabel: input.favoriteLabel ?? null,
    hasPhoto: input.hasPhoto,
  });
  const systemInstruction = buildJournalEnhancementSystemInstruction(input.style);
  const models = configuredModels();

  try {
    for (const [index, model] of models.entries()) {
      console.info(`[ai/journal-enhance] using Groq model: ${model}`);
      const attempt = await requestGroq({
        apiKey: groqApiKey,
        model,
        systemInstruction,
        prompt,
      });

      if (!attempt.response.ok) {
        const providerMessage = sanitizeProviderMessage(attempt.responseText);
        console.error("[ai/journal-enhance] Groq provider failure", {
          model,
          status: attempt.response.status,
          statusText: attempt.response.statusText,
          providerMessage: providerMessage || "No provider message returned.",
        });

        const hasFallback = index < models.length - 1;
        if (hasFallback && attempt.response.status !== 429) continue;
        return providerError(attempt.response.status);
      }

      const payload = parseGroqPayload(attempt.responseText);
      if (!payload) {
        console.error("[ai/journal-enhance] Groq response was not valid JSON", {
          model,
          preview: sanitizeProviderMessage(attempt.responseText),
        });
        const hasFallback = index < models.length - 1;
        if (hasFallback) continue;
        return Response.json({ error: "AI provider failed. Please try again later." }, { status: 502 });
      }

      const enhancedNote = normalizeEnhancedJournalNote(extractGroqText(payload));
      const quality = isWeakEnhancedJournalNote(enhancedNote, input.note);
      if (quality.weak) {
        console.error("[ai/journal-enhance] Groq returned weak note", {
          model,
          wordCount: enhancedNote ? enhancedNote.split(/\s+/).filter(Boolean).length : 0,
          reason: quality.reason,
          preview: sanitizePreview(enhancedNote),
        });
        return Response.json({ error: "AI provider failed. Please try again later." }, { status: 502 });
      }

      return Response.json({ enhancedNote });
    }

    return Response.json({ error: "AI provider failed. Please try again later." }, { status: 502 });
  } catch (error) {
    console.error("[ai/journal-enhance] Groq request failed", {
      model: models[0] ?? defaultGroqModel,
      message: error instanceof Error ? sanitizeProviderMessage(error.message) : "Unknown request failure",
    });
    return Response.json({ error: "AI provider failed. Please try again later." }, { status: 502 });
  }
}
