import "server-only";

import { randomUUID } from "node:crypto";
import { Storage } from "@google-cloud/storage";
import { getDb } from "@/lib/db/client";
import { skyPhotos, uploadEvents } from "@/lib/db/schema";

type SignUploadInput = {
  userId: string;
  fileName: string;
  contentType: "image/jpeg" | "image/png" | "image/webp" | "image/gif";
  sizeBytes: number;
  cityId?: string;
  weatherSnapshotId?: string;
};

export function isGcsConfigured() {
  return Boolean(
    process.env.GCS_PROJECT_ID &&
      process.env.GCS_BUCKET_NAME &&
      process.env.GCS_CLIENT_EMAIL &&
      process.env.GCS_PRIVATE_KEY,
  );
}

function getStorage() {
  return new Storage({
    projectId: process.env.GCS_PROJECT_ID,
    credentials: {
      client_email: process.env.GCS_CLIENT_EMAIL,
      private_key: process.env.GCS_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
  });
}

export async function downloadPrivatePhoto(input: {
  bucket: string;
  objectPath: string;
}) {
  const [buffer] = await getStorage().bucket(input.bucket).file(input.objectPath).download();
  return buffer;
}

function extensionFor(contentType: string) {
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  if (contentType === "image/gif") return "gif";
  return "jpg";
}

export async function signUpload(input: SignUploadInput) {
  const objectPath = `sky-photos/${input.userId}/${Date.now()}-${randomUUID()}.${extensionFor(
    input.contentType,
  )}`;

  if (!isGcsConfigured()) {
    return {
      mode: "mock" as const,
      uploadUrl: null,
      method: "mock",
      bucket: "mock-iconicskies-local",
      objectPath,
      publicUrl: "/assets/bg.jpg",
    };
  }

  const bucketName = process.env.GCS_BUCKET_NAME!;
  const file = getStorage().bucket(bucketName).file(objectPath);
  const [uploadUrl] = await file.getSignedUrl({
    version: "v4",
    action: "write",
    expires: Date.now() + 10 * 60 * 1000,
    contentType: input.contentType,
  });

  return {
    mode: "gcs" as const,
    uploadUrl,
    method: "PUT",
    bucket: bucketName,
    objectPath,
    publicUrl: null,
  };
}

export async function completeUpload(input: SignUploadInput & {
  objectPath: string;
  bucket?: string;
  publicUrl?: string;
  isMock?: boolean;
}) {
  if (!input.isMock && !input.objectPath.startsWith(`sky-photos/${input.userId}/`)) {
    throw new Error("Invalid upload object path.");
  }

  const db = getDb();
  const [photo] = await db
    .insert(skyPhotos)
    .values({
      uploaderUserId: input.userId,
      cityId: input.cityId,
      weatherSnapshotId: input.weatherSnapshotId,
      bucket: input.bucket ?? process.env.GCS_BUCKET_NAME ?? "mock-iconicskies-local",
      objectPath: input.objectPath,
      publicUrl: input.publicUrl ?? (input.isMock ? "/assets/bg.jpg" : null),
      contentType: input.contentType,
      sizeBytes: input.sizeBytes,
      isMock: input.isMock ?? !isGcsConfigured(),
    })
    .returning();

  await db.insert(uploadEvents).values({
    userId: input.userId,
    photoId: photo.id,
    status: photo.isMock ? "mock-complete" : "complete",
    detail: {
      objectPath: photo.objectPath,
      contentType: photo.contentType,
      sizeBytes: photo.sizeBytes,
    },
  });

  return photo;
}

export async function createMockPhotoForMoment(input: {
  userId: string;
  cityId: string;
  weatherSnapshotId: string;
}) {
  return completeUpload({
    userId: input.userId,
    cityId: input.cityId,
    weatherSnapshotId: input.weatherSnapshotId,
    fileName: "mock-sky.jpg",
    contentType: "image/jpeg",
    sizeBytes: 512000,
    objectPath: `mock/sky-photos/${input.userId}/${randomUUID()}.jpg`,
    bucket: "mock-iconicskies-local",
    publicUrl: "/assets/bg.jpg",
    isMock: true,
  });
}
