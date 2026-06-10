import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().default(sql`uuidv7()`),
    email: varchar("email", { length: 320 }).notNull(),
    emailNormalized: varchar("email_normalized", { length: 320 }),
    name: varchar("name", { length: 120 }),
    passwordHash: text("password_hash").notNull(),
    role: varchar("role", { length: 24 }).notNull().default("user"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    emailUnique: uniqueIndex("users_email_normalized_unique").on(table.emailNormalized),
  }),
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().default(sql`uuidv7()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tokenUnique: uniqueIndex("sessions_token_hash_unique").on(table.tokenHash),
    userExpiryIdx: index("sessions_user_expiry_idx").on(table.userId, table.expiresAt),
  }),
);

export const cities = pgTable(
  "cities",
  {
    id: uuid("id").primaryKey().default(sql`uuidv7()`),
    name: varchar("name", { length: 160 }).notNull(),
    normalizedName: varchar("normalized_name", { length: 180 }),
    country: varchar("country", { length: 80 }),
    region: varchar("region", { length: 120 }),
    lat: numeric("lat", { precision: 9, scale: 6 }),
    lon: numeric("lon", { precision: 9, scale: 6 }),
    source: varchar("source", { length: 40 }).notNull().default("openweather"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    sourceNameUnique: uniqueIndex("cities_source_normalized_name_unique").on(
      table.source,
      table.normalizedName,
    ),
    lookupIdx: index("cities_lookup_idx").on(table.normalizedName, table.country, table.region),
    sourceIdx: index("cities_source_name_idx").on(table.source, table.normalizedName),
  }),
);

export const weatherSnapshots = pgTable(
  "weather_snapshots",
  {
    id: uuid("id").primaryKey().default(sql`uuidv7()`),
    cityId: uuid("city_id")
      .notNull()
      .references(() => cities.id, { onDelete: "cascade" }),
    source: varchar("source", { length: 40 }).notNull(),
    units: varchar("units", { length: 16 }).notNull().default("metric"),
    temperature: numeric("temperature", { precision: 6, scale: 2 }).notNull(),
    feelsLike: numeric("feels_like", { precision: 6, scale: 2 }),
    humidity: integer("humidity"),
    windSpeed: numeric("wind_speed", { precision: 6, scale: 2 }),
    condition: varchar("condition", { length: 80 }).notNull(),
    description: varchar("description", { length: 160 }),
    iconCode: varchar("icon_code", { length: 20 }),
    comfortLabel: varchar("comfort_label", { length: 32 }),
    capturedAt: timestamp("captured_at", { withTimezone: true }).notNull(),
    rawPayload: jsonb("raw_payload"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    cacheIdx: index("weather_snapshots_cache_idx").on(
      table.cityId,
      table.units,
      table.source,
      table.capturedAt,
    ),
  }),
);

export const searchHistory = pgTable(
  "search_history",
  {
    id: uuid("id").primaryKey().default(sql`uuidv7()`),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    cityId: uuid("city_id").references(() => cities.id, { onDelete: "set null" }),
    query: varchar("query", { length: 180 }).notNull(),
    units: varchar("units", { length: 16 }).notNull().default("metric"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userRecentIdx: index("search_history_user_recent_idx").on(table.userId, table.createdAt),
    queryIdx: index("search_history_query_idx").on(table.query, table.createdAt),
  }),
);

export const favoriteCities = pgTable(
  "favorite_cities",
  {
    id: uuid("id").primaryKey().default(sql`uuidv7()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    cityId: uuid("city_id")
      .notNull()
      .references(() => cities.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    uniqueFavorite: uniqueIndex("favorite_cities_user_city_unique").on(
      table.userId,
      table.cityId,
    ),
    userRecentIdx: index("favorite_cities_user_recent_idx").on(table.userId, table.createdAt),
  }),
);

export const userPreferences = pgTable("user_preferences", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  units: varchar("units", { length: 16 }).notNull().default("metric"),
  theme: varchar("theme", { length: 24 }).notNull().default("system"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const skyPhotos = pgTable(
  "sky_photos",
  {
    id: uuid("id").primaryKey().default(sql`uuidv7()`),
    uploaderUserId: uuid("uploader_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    cityId: uuid("city_id").references(() => cities.id, { onDelete: "set null" }),
    weatherSnapshotId: uuid("weather_snapshot_id").references(() => weatherSnapshots.id, {
      onDelete: "set null",
    }),
    bucket: varchar("bucket", { length: 160 }),
    objectPath: text("object_path").notNull(),
    publicUrl: text("public_url"),
    contentType: varchar("content_type", { length: 120 }).notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    isMock: boolean("is_mock").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    uploaderRecentIdx: index("sky_photos_uploader_recent_idx").on(
      table.uploaderUserId,
      table.createdAt,
    ),
  }),
);

export const skyMoments = pgTable(
  "sky_moments",
  {
    id: uuid("id").primaryKey().default(sql`uuidv7()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    cityId: uuid("city_id")
      .notNull()
      .references(() => cities.id, { onDelete: "cascade" }),
    weatherSnapshotId: uuid("weather_snapshot_id")
      .notNull()
      .references(() => weatherSnapshots.id, { onDelete: "cascade" }),
    photoId: uuid("photo_id").references(() => skyPhotos.id, { onDelete: "set null" }),
    note: text("note"),
    capturedAt: timestamp("captured_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    timelineIdx: index("sky_moments_user_timeline_idx").on(table.userId, table.capturedAt),
    cityTimelineIdx: index("sky_moments_city_timeline_idx").on(table.cityId, table.capturedAt),
  }),
);

export const uploadEvents = pgTable(
  "upload_events",
  {
    id: uuid("id").primaryKey().default(sql`uuidv7()`),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    photoId: uuid("photo_id").references(() => skyPhotos.id, { onDelete: "set null" }),
    status: varchar("status", { length: 32 }).notNull(),
    detail: jsonb("detail"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userStatusIdx: index("upload_events_user_status_idx").on(table.userId, table.status),
  }),
);

export const auditEvents = pgTable(
  "audit_events",
  {
    id: uuid("id").primaryKey().default(sql`uuidv7()`),
    actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),
    action: varchar("action", { length: 80 }).notNull(),
    targetType: varchar("target_type", { length: 80 }),
    targetId: uuid("target_id"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    actionRecentIdx: index("audit_events_action_recent_idx").on(table.action, table.createdAt),
  }),
);
