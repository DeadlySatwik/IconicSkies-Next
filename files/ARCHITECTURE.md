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

## Environment

- `GROQ_API_KEY`: enables the optional journal note enhancement flow. When missing, the UI disables the action gracefully and the route returns a configuration error.
- `GROQ_MODEL`: optional Groq model override for the journal enhancer. Defaults to `llama-3.3-70b-versatile`.
- `GROQ_FALLBACK_MODEL`: optional fallback model used only when the primary Groq model fails before returning a usable response.
- `PLAYWRIGHT_SKIP_WEBSERVER`: optional test-only flag that skips Playwright's web-server bootstrap when a local dev server is already running.

## Deployment

The intended deployment target is Vercel for the Next.js app, Cloud SQL PostgreSQL 18 for production data, and Google Cloud Storage for sky photos. No separate Render backend is needed for the vertical slice.
