# Architecture

## Overview

IconicSkies is a single Next.js App Router application. The browser renders product UI, while all sensitive work happens server-side: weather API access, database writes, credentials auth, sessions, and GCS signing.

## Runtime Components

- Next.js App Router pages for public weather search, city weather, auth, and protected Sky Journal timeline.
- Route handlers for weather lookup, sky moments, auth, and upload signing/completion.
- PostgreSQL 18 for users, sessions, cities, weather snapshots, search history, sky photos, and sky moments.
- Drizzle ORM for typed database access, with raw SQL migrations for PostgreSQL 18-specific features.
- OpenWeather server adapter with mock fallback.
- GCS upload service with signed URL support and mock fallback.

## Trust Boundaries

- Browser to Next.js: untrusted form input, search terms, credentials, notes, upload metadata.
- Next.js to PostgreSQL: server-only database credentials and parameterized queries.
- Next.js to OpenWeather: server-side API key, never exposed to the browser.
- Next.js to GCS: server-side service account material, never exposed to the browser.
- Browser to GCS signed URL: short-lived upload permissions only when configured.

## Route Shape

- `/`: homepage weather search and product entry.
- `/city/[slug]`: city weather detail and save sky moment flow.
- `/register`, `/login`: credentials auth.
- `/dashboard`: protected Sky Journal timeline.
- `/journal`, `/gallery`, `/settings`: protected supporting surfaces as scope permits.
- `/api/weather`: server-side weather lookup.
- `/api/weather/preview`: explicit current-location weather preview from browser-provided coordinates.
- `/api/sky-moments`: create and list user moments.
- `/api/ai/journal-enhance`: authenticated, server-side note polishing powered by Groq when configured.
- `/api/ai/journal-insights`: authenticated, server-side title and mood-tag suggestions powered by Groq when configured.
- `/api/ai/monthly-recap`: authenticated, on-demand monthly recap generation powered by Groq when configured.
- `/api/favorites`: list and create favorite locations.
- `/api/favorites/[id]`: update label or delete a favorite location.
- `/api/favorites/[id]/weather`: preview a single favorite location.
- `/api/uploads/sign`, `/api/uploads/complete`: upload handshake.

## Local Development

Local PostgreSQL runs through Docker Compose with `postgres:18`. The app supports mock weather and mock upload when external credentials are missing.
Favorite locations are private to the authenticated user. Current-location preview stays ephemeral until the user explicitly saves it as a favorite, and rounded coordinates are stored only after that save action.
Legacy `favorite_cities` remains untouched. `favorite_locations` is the source of truth for this feature slice.
AI journal enhancement is server-only. The browser receives only the polished note result, never `GROQ_API_KEY` or raw provider credentials. The route uses the user note plus weather context, and it avoids sending private photo URLs or user identity details beyond what the prompt needs. The Groq model defaults to `llama-3.3-70b-versatile`, with `GROQ_MODEL` available as an override.
AI journal insights and monthly recap reuse the same Groq transport and stay server-only. Title/tag suggestions are optional, monthly recap is on-demand only, and neither flow stores recap drafts in the database.
The dashboard and save form share a reusable client-side collapsible section primitive so optional UI can stay compact without hiding stateful content or triggering network work on open. Monthly journal archive grouping is computed server-side from captured timestamps, then rendered into collapsible month sections with the current month opened first.
Redis/Upstash is an optional, fail-open cache and throttling layer for derived data only. Monthly recap cache entries are versioned by user/month/journal version, weather cache entries are short-lived and keyed by city or rounded coordinates, and AI rate limiting is enforced server-side when Redis is available but skipped cleanly when it is not.
OTP validation is additive and password-first. Challenges live only in Redis, identifiers are hashed before they reach any Redis key, OTP codes are HMAC-hashed before storage, and the default login/register path stays unchanged unless a user is explicitly marked `otp_required`.

## Environment

- `GROQ_API_KEY`: enables the optional journal note enhancement flow. When missing, the UI disables the action gracefully and the route returns a configuration error.
- `GROQ_MODEL`: optional Groq model override for the journal enhancer. Defaults to `llama-3.3-70b-versatile`.
- `GROQ_FALLBACK_MODEL`: optional fallback model used only when the primary Groq model fails before returning a usable response.
- `OTP_SECRET`: optional HMAC secret for Redis OTP challenges. Falls back to `AUTH_SECRET` if present.
- `OTP_TTL_SECONDS`: optional OTP lifetime in seconds. Defaults to `240`.
- `OTP_RESEND_COOLDOWN_SECONDS`: optional cooldown between OTP sends in seconds. Defaults to `60`.
- `OTP_MAX_VERIFY_ATTEMPTS`: optional limit before a challenge is locked. Defaults to `5`.
- `OTP_DEV_LOG_CODES`: optional dev-only flag that logs OTP codes when set to `true`.
- `RESEND_API_KEY` / `EMAIL_FROM`: optional email delivery configuration for OTP messages.
- `SMS_OTP_PROVIDER` / `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_FROM`: optional SMS delivery configuration stub for future phone OTP support.
- `UPSTASH_REDIS_REST_URL`: optional Upstash Redis REST URL for derived-data caching and AI rate limiting.
- `UPSTASH_REDIS_REST_TOKEN`: optional Upstash Redis REST token for derived-data caching and AI rate limiting.
- `PLAYWRIGHT_SKIP_WEBSERVER`: optional test-only flag that skips Playwright's web-server bootstrap when a local dev server is already running.

## Deployment

The intended deployment target is Vercel for the Next.js app, Cloud SQL PostgreSQL 18 for production data, and Google Cloud Storage for sky photos. No separate Render backend is needed for the vertical slice.
