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

export async function createSkyMoment(input: {
  userId: string;
  cityId: string;
  weatherSnapshotId: string;
  photoId?: string;
  note: string;
  attachMockPhoto: boolean;
}) {
  if (hasFallbackUser(input.userId)) {
    return createFallbackMoment({
      userId: input.userId,
      cityId: input.cityId,
      weatherSnapshotId: input.weatherSnapshotId,
      photoId: input.photoId,
      note: input.note,
    });
  }

  try {
    const uploadedPhoto = input.photoId
      ? await getDb().query.skyPhotos.findFirst({
          where: and(
            eq(skyPhotos.id, input.photoId),
            eq(skyPhotos.uploaderUserId, input.userId),
            eq(skyPhotos.cityId, input.cityId),
            eq(skyPhotos.weatherSnapshotId, input.weatherSnapshotId),
          ),
        })
      : null;

    if (input.photoId && !uploadedPhoto) {
      throw new Error("Photo not found for this sky moment.");
    }

    const mockPhoto = !uploadedPhoto && input.attachMockPhoto
      ? await createMockPhotoForMoment({
          userId: input.userId,
          cityId: input.cityId,
          weatherSnapshotId: input.weatherSnapshotId,
        })
      : null;

    const photoId = uploadedPhoto?.id ?? mockPhoto?.id;

    const [moment] = await getDb()
      .insert(skyMoments)
      .values({
        userId: input.userId,
        cityId: input.cityId,
        weatherSnapshotId: input.weatherSnapshotId,
        photoId,
        note: input.note,
        capturedAt: new Date(),
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
      note: input.note,
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
        capturedAt: skyMoments.capturedAt,
        photoId: skyMoments.photoId,
        cityName: cities.name,
        country: cities.country,
        temperature: weatherSnapshots.temperature,
        units: weatherSnapshots.units,
        condition: weatherSnapshots.condition,
        description: weatherSnapshots.description,
        iconCode: weatherSnapshots.iconCode,
        comfortLabel: weatherSnapshots.comfortLabel,
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

    return rows.map((row) => ({
      ...row,
      temperature: toNumber(row.temperature) ?? 0,
    }));
  } catch (error) {
    if (!isDatabaseConnectionError(error)) throw error;
    return listFallbackMoments(userId);
  }
}
