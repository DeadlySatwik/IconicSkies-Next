# IconicSkies Full-Stack Rebuild Report

## What Was Built

IconicSkies was rebuilt into a Next.js full-stack weather and Sky Journal app. The working vertical slice includes homepage weather search, city weather pages, register/login, save sky moment, dashboard timeline, PostgreSQL 18 migrations, mock weather mode, mock/GCS-ready upload architecture, Playwright smoke tests, and documentation.

## Architecture

- Next.js App Router handles public pages, protected pages, and route handlers.
- PostgreSQL 18 stores users, sessions, cities, weather snapshots, uploads, and sky moments.
- Drizzle provides typed data access; raw SQL migrations provide PostgreSQL 18-specific schema features.
- Weather and upload integrations are server-side with mock fallbacks.

## Main Features

- Search a city from the homepage.
- View current weather and forecast notes on `/city/[slug]`.
- Register/login with credentials.
- Save a sky moment from a weather page.
- Add a journal note.
- Attach a mock sky photo when GCS is not configured.
- Revisit saved moments in a protected dashboard timeline.

## PostgreSQL 18 Usage

- `uuidv7()` primary keys.
- Generated columns for normalized city/email lookup and weather comfort label.
- Multicolumn indexes for snapshot cache, search history, favorites, and Sky Journal timeline.
- SQL comments documenting PostgreSQL 18-specific choices.

## Google Cloud Storage Usage

The app includes GCS signed upload URL scaffolding. If GCS env vars are missing, upload signing returns mock metadata and saved moments can attach a demo sky photo.

## Security Decisions

- Removed the old exposed OpenWeather key from legacy files.
- Kept OpenWeather and GCS credentials server-only.
- Used password hashing for credentials auth.
- Stored hashed session tokens in PostgreSQL.
- Used HttpOnly SameSite cookies.
- Added validation with Zod.
- Added security headers through Next config.

## Design Decisions

- Dashboard is a Sky Journal timeline, not an admin dashboard.
- Weather search leads directly into saving a memory.
- Original weather assets and sky imagery are reused for continuity.
- UI uses restrained atmospheric colors, accessible forms, and clear empty states.

## Tests Added

- Homepage loads and searches a city.
- Register/login flow.
- Save sky moment and see it in the timeline.
- Protected dashboard redirects signed-out users.
- Tests run on desktop Chromium and mobile viewport.

## Commands Run

- `npm install`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `docker run --name iconicskies-postgres ... postgres:18`
- `npm run db:migrate`
- `npm run db:seed`
- `npm run test:e2e:install`
- `npm run test:e2e`

Final quality result: all listed quality gates passed. Playwright passed 6/6 smoke tests.

## Commands That Failed And Why

- `docker compose up -d postgres`: this Docker install does not include the Compose plugin.
- First `npm run test:e2e`: Playwright browsers were not installed. Fixed by installing Chromium into `.cache/ms-playwright`.
- Early e2e run: forms submitted before hydration. Fixed with progressive form fallbacks.
- Next dev server prints an LCP hint for the hero background image. Production build is clean and tests pass.

## Environment Variables Needed

See `.env.example`.

## How To Run Locally

```bash
npm install
docker run --name iconicskies-postgres \
  -e POSTGRES_DB=iconicskies \
  -e POSTGRES_USER=iconicskies \
  -e POSTGRES_PASSWORD=iconicskies \
  -p 5432:5432 \
  -d postgres:18
npm run db:migrate
npm run db:seed
npm run dev
```

## How To Deploy

Deploy the Next.js app to Vercel, point `DATABASE_URL` at Cloud SQL PostgreSQL 18, configure GCS service account variables, and set Sentry DSNs if monitoring is desired.

## Manual Setup Still Needed

- Real OpenWeather key.
- Production `AUTH_SECRET`.
- Cloud SQL PostgreSQL 18 instance.
- GCS bucket and service account.
- Sentry project DSNs.
- Dependency audit follow-up.

## Recommended Next Improvements

- Add rate limiting for auth and weather endpoints.
- Add real private-photo serving for GCS objects.
- Add unit tests for weather normalization and auth.
- Build favorites and recent searches views.
- Add production observability dashboards.
