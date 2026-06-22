"use client";

import { useRouter } from "next/navigation";
import { OtpVerificationForm } from "./otp-verification-form";

export function OtpVerificationBanner({
  purpose,
  channel,
  identifier,
  title,
  description,
  compact = false,
  tone = "dark",
}: {
  purpose: "register" | "login" | "verify-contact";
  channel: "email" | "sms";
  identifier: string;
  title: string;
  description?: string;
  compact?: boolean;
  tone?: "dark" | "light";
}) {
  const router = useRouter();

  return (
    <OtpVerificationForm
      purpose={purpose}
      channel={channel}
      identifier={identifier}
      title={title}
      description={description}
      compact={compact}
      tone={tone}
      onVerified={() => {
        router.refresh();
      }}
    />
  );
}
