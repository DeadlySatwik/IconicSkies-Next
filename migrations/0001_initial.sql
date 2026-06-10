-- IconicSkies PostgreSQL 18 schema.
-- PostgreSQL 18 provides uuidv7(), used below for sortable public-safe primary keys.

CREATE TABLE IF NOT EXISTS migrations (
  id text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  email varchar(320) NOT NULL,
  email_normalized varchar(320) GENERATED ALWAYS AS (lower(trim(email))) STORED,
  name varchar(120),
  password_hash text NOT NULL,
  role varchar(24) NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_normalized_unique
  ON users (email_normalized);

CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS sessions_token_hash_unique
  ON sessions (token_hash);

CREATE INDEX IF NOT EXISTS sessions_user_expiry_idx
  ON sessions (user_id, expires_at DESC);

CREATE TABLE IF NOT EXISTS cities (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  name varchar(160) NOT NULL,
  normalized_name varchar(180)
    GENERATED ALWAYS AS (lower(regexp_replace(trim(name), '\s+', ' ', 'g'))) STORED,
  country varchar(80),
  region varchar(120),
  lat numeric(9, 6),
  lon numeric(9, 6),
  source varchar(40) NOT NULL DEFAULT 'openweather',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cities_lookup_idx
  ON cities (normalized_name, country, region);

CREATE UNIQUE INDEX IF NOT EXISTS cities_source_normalized_name_unique
  ON cities (source, normalized_name);

CREATE INDEX IF NOT EXISTS cities_source_name_idx
  ON cities (source, normalized_name);

CREATE TABLE IF NOT EXISTS weather_snapshots (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  city_id uuid NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  source varchar(40) NOT NULL,
  units varchar(16) NOT NULL DEFAULT 'metric',
  temperature numeric(6, 2) NOT NULL,
  feels_like numeric(6, 2),
  humidity integer,
  wind_speed numeric(6, 2),
  condition varchar(80) NOT NULL,
  description varchar(160),
  icon_code varchar(20),
  comfort_label varchar(32) GENERATED ALWAYS AS (
    CASE
      WHEN temperature <= 5 THEN 'crisp'
      WHEN temperature >= 32 THEN 'hot'
      WHEN humidity >= 80 THEN 'humid'
      WHEN wind_speed >= 12 THEN 'windy'
      ELSE 'comfortable'
    END
  ) STORED,
  captured_at timestamptz NOT NULL,
  raw_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS weather_snapshots_cache_idx
  ON weather_snapshots (city_id, units, source, captured_at DESC);

CREATE TABLE IF NOT EXISTS search_history (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  city_id uuid REFERENCES cities(id) ON DELETE SET NULL,
  query varchar(180) NOT NULL,
  units varchar(16) NOT NULL DEFAULT 'metric',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS search_history_user_recent_idx
  ON search_history (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS search_history_query_idx
  ON search_history (query, created_at DESC);

CREATE TABLE IF NOT EXISTS favorite_cities (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  city_id uuid NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT favorite_cities_user_city_unique UNIQUE (user_id, city_id)
);

CREATE INDEX IF NOT EXISTS favorite_cities_user_recent_idx
  ON favorite_cities (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  units varchar(16) NOT NULL DEFAULT 'metric',
  theme varchar(24) NOT NULL DEFAULT 'system',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sky_photos (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  uploader_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  city_id uuid REFERENCES cities(id) ON DELETE SET NULL,
  weather_snapshot_id uuid REFERENCES weather_snapshots(id) ON DELETE SET NULL,
  bucket varchar(160),
  object_path text NOT NULL,
  public_url text,
  content_type varchar(120) NOT NULL,
  size_bytes integer NOT NULL,
  is_mock boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sky_photos_uploader_recent_idx
  ON sky_photos (uploader_user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS sky_moments (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  city_id uuid NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  weather_snapshot_id uuid NOT NULL REFERENCES weather_snapshots(id) ON DELETE CASCADE,
  photo_id uuid REFERENCES sky_photos(id) ON DELETE SET NULL,
  note text,
  captured_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sky_moments_user_timeline_idx
  ON sky_moments (user_id, captured_at DESC);

CREATE INDEX IF NOT EXISTS sky_moments_city_timeline_idx
  ON sky_moments (city_id, captured_at DESC);

CREATE TABLE IF NOT EXISTS upload_events (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  photo_id uuid REFERENCES sky_photos(id) ON DELETE SET NULL,
  status varchar(32) NOT NULL,
  detail jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS upload_events_user_status_idx
  ON upload_events (user_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS audit_events (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action varchar(80) NOT NULL,
  target_type varchar(80),
  target_id uuid,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_events_action_recent_idx
  ON audit_events (action, created_at DESC);

COMMENT ON COLUMN users.id IS 'PostgreSQL 18 uuidv7() primary key for sortable, non-sequential public IDs.';
COMMENT ON COLUMN cities.normalized_name IS 'Generated column for stable city search and deduplication.';
COMMENT ON COLUMN weather_snapshots.comfort_label IS 'Generated comfort metadata derived from captured weather values.';
COMMENT ON INDEX sky_moments_user_timeline_idx IS 'Primary Sky Journal timeline query path.';
