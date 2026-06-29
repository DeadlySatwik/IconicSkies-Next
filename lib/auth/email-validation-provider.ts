import "server-only";

export type EmailValidationProviderStatus =
  | "disabled"
  | "valid"
  | "invalid"
  | "disposable"
  | "undeliverable"
  | "unknown";

export type EmailValidationProviderResult =
  | {
      ok: true;
      provider: "disabled" | "abstract" | "zerobounce" | "mock";
      status: EmailValidationProviderStatus;
    }
  | {
      ok: false;
      provider: "abstract" | "zerobounce" | "mock" | "disabled";
      reason: "not-configured" | "provider-error" | "unsupported-provider";
      message?: string;
    };

function sanitizeProviderMessage(message: string) {
  const compact = message.replace(/\s+/g, " ").trim();
  return compact.length > 240 ? `${compact.slice(0, 240)}...` : compact;
}

function isStrictMode() {
  return process.env.EMAIL_VALIDATION_STRICT === "true";
}

async function validateWithAbstract(email: string, apiKey: string): Promise<EmailValidationProviderResult> {
  try {
    const response = await fetch(`https://emailvalidation.abstractapi.com/v1/?api_key=${encodeURIComponent(apiKey)}&email=${encodeURIComponent(email)}`, {
      method: "GET",
      cache: "no-store",
    });
    const payload = (await response.json().catch(() => null)) as
      | {
          deliverability?: string;
          is_disposable_email?: { value?: boolean | null };
          is_valid_format?: { value?: boolean | null };
        }
      | null;

    if (!response.ok) {
      return {
        ok: false,
        provider: "abstract",
        reason: "provider-error",
        message: `HTTP ${response.status}`,
      };
    }

    if (payload?.is_disposable_email?.value) {
      return { ok: true, provider: "abstract", status: "disposable" };
    }
    if (payload?.is_valid_format?.value === false) {
      return { ok: true, provider: "abstract", status: "invalid" };
    }
    if (payload?.deliverability === "UNDELIVERABLE") {
      return { ok: true, provider: "abstract", status: "undeliverable" };
    }
    if (payload?.deliverability === "DELIVERABLE") {
      return { ok: true, provider: "abstract", status: "valid" };
    }

    return { ok: true, provider: "abstract", status: "unknown" };
  } catch (error) {
    return {
      ok: false,
      provider: "abstract",
      reason: "provider-error",
      message: error instanceof Error ? sanitizeProviderMessage(error.message) : "Unknown provider error",
    };
  }
}

async function validateWithZeroBounce(email: string, apiKey: string): Promise<EmailValidationProviderResult> {
  try {
    const response = await fetch(`https://api.zerobounce.net/v2/validate?api_key=${encodeURIComponent(apiKey)}&email=${encodeURIComponent(email)}`, {
      method: "GET",
      cache: "no-store",
    });
    const payload = (await response.json().catch(() => null)) as
      | {
          status?: string;
          sub_status?: string;
        }
      | null;

    if (!response.ok) {
      return {
        ok: false,
        provider: "zerobounce",
        reason: "provider-error",
        message: `HTTP ${response.status}`,
      };
    }

    if (payload?.status === "valid") {
      return { ok: true, provider: "zerobounce", status: "valid" };
    }
    if (payload?.status === "invalid") {
      return { ok: true, provider: "zerobounce", status: "invalid" };
    }
    if (payload?.status === "do_not_mail" || payload?.sub_status === "disposable") {
      return { ok: true, provider: "zerobounce", status: "disposable" };
    }

    return { ok: true, provider: "zerobounce", status: "unknown" };
  } catch (error) {
    return {
      ok: false,
      provider: "zerobounce",
      reason: "provider-error",
      message: error instanceof Error ? sanitizeProviderMessage(error.message) : "Unknown provider error",
    };
  }
}

export async function validateEmailWithOptionalProvider(email: string): Promise<EmailValidationProviderResult> {
  const provider = (process.env.EMAIL_VALIDATION_PROVIDER?.trim().toLowerCase() || "disabled") as
    | "disabled"
    | "abstract"
    | "zerobounce"
    | "mock";

  if (provider === "disabled") {
    return { ok: true, provider: "disabled", status: "disabled" };
  }

  if (provider === "mock") {
    return { ok: true, provider: "mock", status: "unknown" };
  }

  const apiKey = process.env.EMAIL_VALIDATION_API_KEY?.trim();
  if (!apiKey) {
    return {
      ok: false,
      provider,
      reason: "not-configured",
      message: "EMAIL_VALIDATION_API_KEY is missing.",
    };
  }

  if (provider === "abstract") {
    return validateWithAbstract(email, apiKey);
  }

  if (provider === "zerobounce") {
    return validateWithZeroBounce(email, apiKey);
  }

  return {
    ok: false,
    provider,
    reason: "unsupported-provider",
    message: `Unsupported provider: ${provider}`,
  };
}

export function shouldBlockOnValidationProviderFailure() {
  return isStrictMode();
}
