import { z } from "zod";

export const unitsSchema = z.enum(["metric", "imperial"]).default("metric");

export const citySearchSchema = z.object({
  city: z.string().trim().min(2).max(120),
  units: unitsSchema,
});

export const registerSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(320),
  password: z.string().min(10).max(128),
});

export const loginSchema = z.object({
  email: z.string().trim().email().max(320),
  password: z.string().min(1).max(128),
});

export const otpChannelSchema = z.enum(["email", "sms"]);
export const otpPurposeSchema = z.enum(["register", "login", "verify-contact"]);
export type OtpChannel = z.infer<typeof otpChannelSchema>;
export type OtpPurpose = z.infer<typeof otpPurposeSchema>;

export const otpRequestSchema = z.object({
  channel: otpChannelSchema,
  identifier: z.string().trim().min(3).max(320),
  purpose: otpPurposeSchema,
});

export const otpVerifySchema = otpRequestSchema.extend({
  code: z.string().trim().regex(/^\d{6}$/, "Code must be a 6-digit number."),
});

export const skyMomentSchema = z.object({
  cityId: z.string().uuid(),
  weatherSnapshotId: z.string().uuid(),
  photoId: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(80).optional().nullable(),
  moodTags: z.array(z.string().trim().min(1).max(24)).max(5).optional().nullable(),
  note: z.string().trim().max(1200).optional().default(""),
  attachMockPhoto: z.boolean().optional().default(false),
  units: unitsSchema.optional().nullable(),
  capturedAt: z.string().trim().min(1).max(64).optional().nullable(),
  capturedLocation: z
    .object({
      name: z.string().trim().min(1).max(160),
      country: z.string().trim().max(80).optional().nullable(),
      region: z.string().trim().max(120).optional().nullable(),
      latitude: z.number().finite().min(-90).max(90).optional().nullable(),
      longitude: z.number().finite().min(-180).max(180).optional().nullable(),
    })
    .optional()
    .nullable(),
});

export const allowedUploadContentTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export const maxUploadSizeBytes = 8 * 1024 * 1024;

export const uploadSignSchema = z.object({
  fileName: z.string().trim().min(1).max(180),
  contentType: z.enum(allowedUploadContentTypes),
  sizeBytes: z.number().int().positive().max(maxUploadSizeBytes),
  cityId: z.string().uuid().optional(),
  weatherSnapshotId: z.string().uuid().optional(),
});

export const uploadCompleteSchema = uploadSignSchema.extend({
  objectPath: z.string().trim().min(1).max(400),
  bucket: z.string().trim().max(160).optional(),
  publicUrl: z.string().url().optional(),
  isMock: z.boolean().optional().default(false),
});

export const favoriteLocationCreateSchema = z.object({
  label: z.string().trim().max(120).optional(),
  cityId: z.string().uuid().optional(),
  cityName: z.string().trim().min(1).max(160),
  country: z.string().trim().max(80).optional().nullable(),
  region: z.string().trim().max(120).optional().nullable(),
  latitude: z.number().finite().min(-90).max(90).optional().nullable(),
  longitude: z.number().finite().min(-180).max(180).optional().nullable(),
  unitsPreference: unitsSchema.optional().nullable(),
});

export const favoriteLocationUpdateSchema = z.object({
  label: z.string().trim().min(1).max(120),
});

export const geoWeatherPreviewSchema = z.object({
  latitude: z.number().finite().min(-90).max(90),
  longitude: z.number().finite().min(-180).max(180),
  units: unitsSchema.optional().default("metric"),
});

export function jsonError(message: string, status = 400) {
  return Response.json({ ok: false, error: message }, { status });
}
