import type { ZodIssue, ZodType } from "zod";

export const groqChatEndpoint = "https://api.groq.com/openai/v1/chat/completions";
export const defaultGroqModel = "llama-3.3-70b-versatile";

export type GroqChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export function sanitizeProviderMessage(message: string) {
  const compact = message.replace(/\s+/g, " ").trim();
  return compact.length > 500 ? `${compact.slice(0, 500)}...` : compact;
}

export function sanitizeModelContentPreview(message: string, maxLength = 300) {
  const compact = message.replace(/\s+/g, " ").trim();
  return compact.length > maxLength ? `${compact.slice(0, maxLength)}...` : compact;
}

export function parseGroqJson<T>(rawText: string) {
  if (!rawText.trim()) return null;

  try {
    return JSON.parse(rawText) as T;
  } catch {
    return null;
  }
}

type GroqChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: unknown;
    };
  }>;
};

export type GroqJsonParseResult<T> =
  | { success: true; content: string; data: T }
  | {
      success: false;
      content: string;
      error: string;
      issues?: ZodIssue[];
    };

function stripJsonFences(text: string) {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function extractFirstJsonObject(text: string) {
  const start = text.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < text.length; index += 1) {
    const char = text[index];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    if (char === "\"") {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === "{") depth += 1;
    if (char === "}") depth -= 1;

    if (depth === 0) return text.slice(start, index + 1);
  }

  return null;
}

export function parseJsonFromModelContent(content: string) {
  const cleaned = stripJsonFences(content);
  const normalized = cleaned.replace(/[\u0000-\u001F]+/g, " ");

  try {
    return JSON.parse(normalized) as unknown;
  } catch {
    const objectText = extractFirstJsonObject(normalized);
    if (!objectText) throw new Error("Model content did not contain a JSON object.");
    return JSON.parse(objectText.replace(/[\u0000-\u001F]+/g, " ")) as unknown;
  }
}

export function extractGroqMessageContent(responseText: string) {
  const payload = parseGroqJson<GroqChatCompletionResponse>(responseText);
  const content = payload?.choices?.[0]?.message?.content;

  if (typeof content !== "string" || !content.trim()) {
    throw new Error("Groq returned no message content.");
  }

  return content.trim();
}

export function safeParseGroqJsonContent<T>(responseText: string, schema: ZodType<T>): GroqJsonParseResult<T> {
  let content = "";

  try {
    content = extractGroqMessageContent(responseText);
  } catch (error) {
    return {
      success: false,
      content,
      error: error instanceof Error ? error.message : "Unable to extract Groq message content.",
    };
  }

  try {
    const parsed = parseJsonFromModelContent(content);
    const validated = schema.safeParse(parsed);

    if (!validated.success) {
      return {
        success: false,
        content,
        error: "Model JSON failed schema validation.",
        issues: validated.error.issues,
      };
    }

    return { success: true, content, data: validated.data };
  } catch (error) {
    return {
      success: false,
      content,
      error: error instanceof Error ? error.message : "Unable to parse model JSON content.",
    };
  }
}

export async function requestGroqChatCompletion({
  apiKey,
  model,
  messages,
  temperature,
  maxCompletionTokens,
  responseFormat,
}: {
  apiKey: string;
  model: string;
  messages: GroqChatMessage[];
  temperature: number;
  maxCompletionTokens: number;
  responseFormat?: { type: "json_object" };
}) {
  const response = await fetch(groqChatEndpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_completion_tokens: maxCompletionTokens,
      ...(responseFormat ? { response_format: responseFormat } : {}),
    }),
  });

  const responseText = await response.text().catch(() => "");
  return { response, responseText };
}
