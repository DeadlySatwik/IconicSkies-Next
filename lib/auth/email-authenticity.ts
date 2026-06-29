import "server-only";

import { promises as dns } from "node:dns";
import { z } from "zod";
import { normalizeEmail } from "@/lib/utils";
import {
  shouldBlockOnValidationProviderFailure,
  validateEmailWithOptionalProvider,
} from "./email-validation-provider";

export type EmailAuthenticityFailureReason =
  | "INVALID_FORMAT"
  | "BLOCKED_DOMAIN"
  | "DISPOSABLE_DOMAIN"
  | "NO_MX"
  | "DNS_TEMPORARY_FAILURE"
  | "VALIDATION_PROVIDER_REJECTED";

export type EmailAuthenticityResult =
  | {
      ok: true;
      normalizedEmail: string;
    }
  | {
      ok: false;
      normalizedEmail?: string;
      reason: EmailAuthenticityFailureReason;
    };

const emailSchema = z.string().trim().email().max(320);
const blockedDomains = new Set([
  "example.com",
  "example.org",
  "example.net",
  "test.com",
  "test.net",
  "invalid",
  "localhost",
  "local",
  "fake.com",
]);
const disposableDomains = new Set([
  "mailinator.com",
  "10minutemail.com",
  "temp-mail.org",
  "guerrillamail.com",
  "yopmail.com",
  "throwawaymail.com",
  "getnada.com",
  "sharklasers.com",
  "trashmail.com",
]);
const trustedCatchAllDomains = new Set([
  "gmail.com",
  "googlemail.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "yahoo.com",
  "icloud.com",
  "proton.me",
  "protonmail.com",
]);
const MX_TIMEOUT_MS = 4000;

function domainFromEmail(email: string) {
  return email.split("@")[1] ?? "";
}

function isDisposableDomain(domain: string) {
  return disposableDomains.has(domain);
}

function isBlockedDomain(domain: string) {
  return blockedDomains.has(domain);
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("MX lookup timed out.")), timeoutMs);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

async function hasMxRecord(domain: string) {
  try {
    const records = await withTimeout(dns.resolveMx(domain), MX_TIMEOUT_MS);
    return records.some((record) => Boolean(record.exchange));
  } catch (error) {
    if (error && typeof error === "object" && "code" in error) {
      const code = String((error as { code?: unknown }).code ?? "");
      if (code === "ENOTFOUND" || code === "ENODATA" || code === "ESERVFAIL" || code === "NXDOMAIN") {
        return false;
      }
    }

    throw error;
  }
}

export function emailAuthenticityMessage(reason: EmailAuthenticityFailureReason) {
  if (reason === "DNS_TEMPORARY_FAILURE") {
    return "We could not verify this email domain right now. Please try again.";
  }

  return "Please use a real email address you can access.";
}

export async function verifyEmailAuthenticity(inputEmail: string): Promise<EmailAuthenticityResult> {
  const parsed = emailSchema.safeParse(inputEmail);
  if (!parsed.success) {
    return { ok: false, reason: "INVALID_FORMAT" };
  }

  const normalizedEmail = normalizeEmail(parsed.data);
  const domain = domainFromEmail(normalizedEmail);
  if (!domain) {
    return { ok: false, reason: "INVALID_FORMAT" };
  }

  if (isBlockedDomain(domain)) {
    return { ok: false, normalizedEmail, reason: "BLOCKED_DOMAIN" };
  }

  if (isDisposableDomain(domain)) {
    return { ok: false, normalizedEmail, reason: "DISPOSABLE_DOMAIN" };
  }

  try {
    const hasMx = await hasMxRecord(domain);
    if (!hasMx) {
      return { ok: false, normalizedEmail, reason: "NO_MX" };
    }
  } catch {
    return { ok: false, normalizedEmail, reason: "DNS_TEMPORARY_FAILURE" };
  }

  const providerResult = await validateEmailWithOptionalProvider(normalizedEmail);
  if (!providerResult.ok) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[auth/email-authenticity] external validation provider warning", {
        provider: providerResult.provider,
        reason: providerResult.reason,
        message: providerResult.message,
      });
    }

    if (shouldBlockOnValidationProviderFailure()) {
      return { ok: false, normalizedEmail, reason: "DNS_TEMPORARY_FAILURE" };
    }

    return { ok: true, normalizedEmail };
  }

  if (providerResult.status === "invalid" || providerResult.status === "disposable" || providerResult.status === "undeliverable") {
    return { ok: false, normalizedEmail, reason: "VALIDATION_PROVIDER_REJECTED" };
  }

  if (providerResult.status === "unknown" && !trustedCatchAllDomains.has(domain)) {
    return { ok: true, normalizedEmail };
  }

  return { ok: true, normalizedEmail };
}
