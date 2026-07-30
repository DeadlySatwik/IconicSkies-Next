export type OtpStoreProvider = "redis" | "memory";

export function getOtpStoreProvider(): OtpStoreProvider {
  const provider = process.env.OTP_STORE_PROVIDER?.trim().toLowerCase() || "redis";
  if (provider !== "redis" && provider !== "memory") {
    throw new Error(`Unsupported OTP_STORE_PROVIDER: ${provider}`);
  }

  if (provider === "memory" && process.env.NODE_ENV === "production") {
    throw new Error("Memory OTP storage is not allowed in production.");
  }

  return provider;
}
