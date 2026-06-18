-- Favorite locations for personalized weather previews and journal markers.

CREATE TABLE IF NOT EXISTS favorite_locations (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  city_id uuid REFERENCES cities(id) ON DELETE SET NULL,
  label varchar(120) NOT NULL,
  city_name varchar(160) NOT NULL,
  country varchar(80),
  region varchar(120),
  normalized_city_key varchar(220) NOT NULL,
  latitude numeric(9, 3),
  longitude numeric(9, 3),
  units_preference varchar(16),
  location_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS favorite_locations_user_location_unique
  ON favorite_locations (user_id, location_key);

CREATE INDEX IF NOT EXISTS favorite_locations_user_recent_idx
  ON favorite_locations (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS favorite_locations_user_city_key_idx
  ON favorite_locations (user_id, normalized_city_key);
