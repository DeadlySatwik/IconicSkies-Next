import "server-only";

import { and, desc, eq } from "drizzle-orm";
import { getDb, isDatabaseConnectionError } from "@/lib/db/client";
import {
  createFallbackMoment,
  hasFallbackUser,
  listFallbackMoments,
} from "@/lib/dev/fallback-store";
import {
  cities,
  skyMoments,
  skyPhotos,
  weatherSnapshots,
} from "@/lib/db/schema";
import { createMockPhotoForMoment } from "@/lib/gcs/service";
import { toNumber } from "@/lib/utils";

function rawPayloadObject(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function optionalNumber(value: unknown) {
  const number = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(number) ? number : null;
}

function optionalIsoDate(value: unknown) {
  if (typeof value === "string") {
    const time = new Date(value).getTime();
    return Number.isFinite(time) ? value : null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const milliseconds = value > 10_000_000_000 ? value : value * 1000;
    return new Date(milliseconds).toISOString();
  }

  return null;
}

function weatherMetadataFromRawPayload(value: unknown) {
  const payload = rawPayloadObject(value);
  return {
    weatherId: optionalNumber(payload.weatherId),
    cloudiness: optionalNumber(payload.cloudiness),
    timezoneOffset: optionalNumber(payload.timezoneOffset),
    sunrise: optionalIsoDate(payload.sunrise),
    sunset: optionalIsoDate(payload.sunset),
  };
}

export async function createSkyMoment(input: {
  userId: string;
  cityId: string;
  weatherSnapshotId: string;
  photoId?: string;
  title?: string | null;
  moodTags?: string[] | null;
  note: string;
  attachMockPhoto: boolean;
  capturedAt?: Date;
}) {
  if (hasFallbackUser(input.userId)) {
    return createFallbackMoment({
      userId: input.userId,
      cityId: input.cityId,
      weatherSnapshotId: input.weatherSnapshotId,
      photoId: input.photoId,
      title: input.title,
      moodTags: input.moodTags,
      note: input.note,
      capturedAt: input.capturedAt,
    });
  }

  try {
    const uploadedPhoto = input.photoId
      ? await getDb().query.skyPhotos.findFirst({
          where: and(
            eq(skyPhotos.id, input.photoId),
            eq(skyPhotos.uploaderUserId, input.userId),
          ),
        })
      : null;

    if (input.photoId && !uploadedPhoto) {
      throw new Error("Photo not found for this sky moment.");
    }

    const attachedPhoto =
      uploadedPhoto &&
      (uploadedPhoto.cityId !== input.cityId ||
        uploadedPhoto.weatherSnapshotId !== input.weatherSnapshotId)
        ? (
            await getDb()
              .update(skyPhotos)
              .set({
                cityId: input.cityId,
                weatherSnapshotId: input.weatherSnapshotId,
              })
              .where(
                and(
                  eq(skyPhotos.id, uploadedPhoto.id),
                  eq(skyPhotos.uploaderUserId, input.userId),
                ),
              )
              .returning()
          )[0]
        : uploadedPhoto;

    const mockPhoto = !uploadedPhoto && input.attachMockPhoto
      ? await createMockPhotoForMoment({
          userId: input.userId,
          cityId: input.cityId,
          weatherSnapshotId: input.weatherSnapshotId,
        })
      : null;

    const photoId = attachedPhoto?.id ?? mockPhoto?.id;

    const [moment] = await getDb()
      .insert(skyMoments)
      .values({
        userId: input.userId,
        cityId: input.cityId,
        weatherSnapshotId: input.weatherSnapshotId,
        photoId,
        title: input.title?.trim() || null,
        moodTags: input.moodTags && input.moodTags.length > 0 ? input.moodTags : null,
        note: input.note,
        capturedAt: input.capturedAt ?? new Date(),
      })
      .returning();

    return moment;
  } catch (error) {
    if (!isDatabaseConnectionError(error)) throw error;
    return createFallbackMoment({
      userId: input.userId,
      cityId: input.cityId,
      weatherSnapshotId: input.weatherSnapshotId,
      photoId: input.photoId,
      title: input.title,
      moodTags: input.moodTags,
      note: input.note,
      capturedAt: input.capturedAt,
    });
  }
}

export async function listSkyMoments(userId: string) {
  if (hasFallbackUser(userId)) return listFallbackMoments(userId);

  try {
    const rows = await getDb()
      .select({
        id: skyMoments.id,
        note: skyMoments.note,
        title: skyMoments.title,
        moodTags: skyMoments.moodTags,
        capturedAt: skyMoments.capturedAt,
        createdAt: skyMoments.createdAt,
        updatedAt: skyMoments.updatedAt,
        photoId: skyMoments.photoId,
        cityName: cities.name,
      country: cities.country,
        temperature: weatherSnapshots.temperature,
        units: weatherSnapshots.units,
        condition: weatherSnapshots.condition,
        description: weatherSnapshots.description,
        iconCode: weatherSnapshots.iconCode,
        comfortLabel: weatherSnapshots.comfortLabel,
        rawPayload: weatherSnapshots.rawPayload,
        photoUrl: skyPhotos.publicUrl,
        photoContentType: skyPhotos.contentType,
        isMockPhoto: skyPhotos.isMock,
      })
      .from(skyMoments)
      .innerJoin(cities, eq(cities.id, skyMoments.cityId))
      .innerJoin(weatherSnapshots, eq(weatherSnapshots.id, skyMoments.weatherSnapshotId))
      .leftJoin(skyPhotos, eq(skyPhotos.id, skyMoments.photoId))
      .where(eq(skyMoments.userId, userId))
      .orderBy(desc(skyMoments.capturedAt))
      .limit(50);

    return rows.map((row) => {
      const { rawPayload: _rawPayload, ...rest } = row;
      return {
        ...rest,
        ...weatherMetadataFromRawPayload(_rawPayload),
        temperature: toNumber(row.temperature) ?? 0,
        moodTags: Array.isArray(row.moodTags)
          ? row.moodTags.filter((tag): tag is string => typeof tag === "string")
          : null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      };
    });
  } catch (error) {
    if (!isDatabaseConnectionError(error)) throw error;
    return listFallbackMoments(userId);
  }
}
