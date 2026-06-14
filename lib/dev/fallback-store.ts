import { createHash, randomUUID } from "node:crypto";

type FallbackUser = {
  id: string;
  email: string;
  emailNormalized: string;
  name: string;
  passwordHash: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
};

type FallbackSession = {
  tokenHash: string;
  userId: string;
  expiresAt: Date;
};

type FallbackCity = {
  id: string;
  name: string;
  country: string | null;
  region: string | null;
  lat: number | null;
  lon: number | null;
  source: "openweather" | "mock";
  normalizedName: string;
};

type FallbackSnapshot = {
  id: string;
  cityId: string;
  source: "openweather" | "mock";
  units: "metric" | "imperial";
  temperature: number;
  feelsLike: number | null;
  humidity: number | null;
  windSpeed: number | null;
  condition: string;
  description: string | null;
  iconCode: string | null;
  weatherId: number | null;
  cloudiness: number | null;
  timezoneOffset: number | null;
  sunrise: string | null;
  sunset: string | null;
  comfortLabel: string | null;
  capturedAt: string;
};

type FallbackMoment = {
  id: string;
  userId: string;
  cityId: string;
  weatherSnapshotId: string;
  photoId: string | null;
  note: string | null;
  capturedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

type FallbackState = {
  usersById: Map<string, FallbackUser>;
  usersByEmail: Map<string, string>;
  sessionsByTokenHash: Map<string, FallbackSession>;
  citiesById: Map<string, FallbackCity>;
  cityIdByKey: Map<string, string>;
  snapshotsById: Map<string, FallbackSnapshot>;
  snapshotIdByKey: Map<string, string>;
  momentsByUserId: Map<string, FallbackMoment[]>;
};

const stateKey = Symbol.for("iconicskies.fallback-store");

function getState(): FallbackState {
  const globalObject = globalThis as typeof globalThis & Record<symbol, FallbackState | undefined>;
  if (!globalObject[stateKey]) {
    globalObject[stateKey] = {
      usersById: new Map(),
      usersByEmail: new Map(),
      sessionsByTokenHash: new Map(),
      citiesById: new Map(),
      cityIdByKey: new Map(),
      snapshotsById: new Map(),
      snapshotIdByKey: new Map(),
      momentsByUserId: new Map(),
    };
  }

  return globalObject[stateKey];
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function createFallbackUser(input: { email: string; name: string; passwordHash: string }) {
  const state = getState();
  const emailNormalized = normalizeEmail(input.email);
  const existingId = state.usersByEmail.get(emailNormalized);
  if (existingId) return state.usersById.get(existingId) ?? null;

  const now = new Date();
  const user: FallbackUser = {
    id: randomUUID(),
    email: input.email,
    emailNormalized,
    name: input.name,
    passwordHash: input.passwordHash,
    role: "user",
    createdAt: now,
    updatedAt: now,
  };

  state.usersById.set(user.id, user);
  state.usersByEmail.set(emailNormalized, user.id);
  return user;
}

export function findFallbackUserByEmail(email: string) {
  const state = getState();
  const userId = state.usersByEmail.get(normalizeEmail(email));
  return userId ? state.usersById.get(userId) ?? null : null;
}

export function findFallbackUserById(userId: string) {
  return getState().usersById.get(userId) ?? null;
}

export function hasFallbackUser(userId: string) {
  return getState().usersById.has(userId);
}

export function createFallbackSession(userId: string) {
  const state = getState();
  const token = randomUUID().replaceAll("-", "") + randomUUID().replaceAll("-", "");
  const tokenHash = hashToken(token);
  const session: FallbackSession = {
    tokenHash,
    userId,
    expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
  };

  state.sessionsByTokenHash.set(tokenHash, session);
  return { token, expiresAt: session.expiresAt };
}

export function findFallbackSessionByToken(token: string) {
  const session = getState().sessionsByTokenHash.get(hashToken(token));
  if (!session || session.expiresAt <= new Date()) return null;
  return session;
}

export function destroyFallbackSession(token: string) {
  getState().sessionsByTokenHash.delete(hashToken(token));
}

export function recordFallbackWeather(input: {
  snapshot: Omit<FallbackSnapshot, "cityId">;
  city: Omit<FallbackCity, "id" | "normalizedName">;
  cityKey: string;
}) {
  const state = getState();
  const existingCityId = state.cityIdByKey.get(input.cityKey);
  const cityId = existingCityId ?? randomUUID();

  const city: FallbackCity = {
    id: cityId,
    normalizedName: input.cityKey,
    ...input.city,
  };

  const snapshot: FallbackSnapshot = {
    ...input.snapshot,
    cityId,
  };

  state.citiesById.set(cityId, city);
  state.cityIdByKey.set(input.cityKey, cityId);
  state.snapshotsById.set(snapshot.id, snapshot);
  state.snapshotIdByKey.set(`${cityId}:${snapshot.units}`, snapshot.id);

  return {
    city,
    snapshot,
  };
}

export function findFallbackWeatherByCityKey(cityKey: string, units: "metric" | "imperial") {
  const state = getState();
  const cityId = state.cityIdByKey.get(cityKey);
  if (!cityId) return null;
  const snapshotId = state.snapshotIdByKey.get(`${cityId}:${units}`);
  if (!snapshotId) return null;
  const city = state.citiesById.get(cityId);
  const snapshot = state.snapshotsById.get(snapshotId);
  if (!city || !snapshot) return null;
  return { city, snapshot };
}

export function createFallbackMoment(input: {
  userId: string;
  cityId: string;
  weatherSnapshotId: string;
  photoId?: string;
  note: string;
}) {
  const state = getState();
  const now = new Date();
  const moment: FallbackMoment = {
    id: randomUUID(),
    userId: input.userId,
    cityId: input.cityId,
    weatherSnapshotId: input.weatherSnapshotId,
    photoId: input.photoId ?? null,
    note: input.note,
    capturedAt: now,
    createdAt: now,
    updatedAt: now,
  };

  const moments = state.momentsByUserId.get(input.userId) ?? [];
  moments.unshift(moment);
  state.momentsByUserId.set(input.userId, moments.slice(0, 50));
  return moment;
}

export function listFallbackMoments(userId: string) {
  const state = getState();
  const moments = state.momentsByUserId.get(userId) ?? [];

  return moments.map((moment) => {
    const city = state.citiesById.get(moment.cityId);
    const snapshot = state.snapshotsById.get(moment.weatherSnapshotId);
    return {
      ...moment,
      cityName: city?.name ?? "Unknown city",
      country: city?.country ?? null,
      temperature: snapshot?.temperature ?? 0,
      units: snapshot?.units ?? "metric",
      condition: snapshot?.condition ?? "Clouds",
      description: snapshot?.description ?? null,
      iconCode: snapshot?.iconCode ?? null,
      comfortLabel: snapshot?.comfortLabel ?? null,
      photoUrl: null,
      photoContentType: null,
      isMockPhoto: null,
    };
  });
}
