# Handoff

## Current Phase

Complete vertical slice implemented.

## Current State

The approved vertical slice has been implemented as a Next.js full-stack app. PostgreSQL 18 migrations and seed were verified against a running `postgres:18` container. Playwright smoke tests passed across desktop and mobile in the final run.

Update on 2026-06-10: the city page Sky Moment form now supports real GCS direct uploads when server-side GCS env vars are configured. The mock/demo checkbox is only shown when GCS is not configured.

Update on 2026-06-10: dashboard timeline now displays real private GCS photos through `/api/photos/[id]`, labels real photos as `Uploaded photo`, keeps `Mock photo` only for mock rows, and hides media placeholders for moments without `photo_id`.

Update on 2026-06-11: landing and city weather pages now use curated public atmospheric backgrounds. The landing page defaults to `landing-poster.webp` with an optional desktop-only `landing-loop.mp4` toggle stored in `localStorage`; mobile and reduced-motion users remain in image mode. City pages resolve a weather mood server-side and render one selected background image behind readable weather and save-moment content.

Update on 2026-06-11: the landing page now uses `landing-poster-mobile.webp` below 768px while desktop/tablet continue to use `landing-poster.webp`. Mobile remains image-only; the desktop video toggle is unchanged.

Update on 2026-06-11: the landing and city pages received a design rescue pass. Landing is now a single dark cinematic hero with integrated search, subtle Image/Video toggle, and one Sky Journal preview. City pages now lead with an atmospheric weather hero band, then use solid/semi-solid panels for metrics, forecast, and Save Moment. The global header is a restrained midnight bar for readability across landing, city, dashboard, and auth pages.

Update on 2026-06-12: auth and weather now degrade more cleanly when the local database is unavailable. Login/register return structured `503` JSON errors instead of crashing, and city weather pages can still render live/mock weather even if cache/persist database writes fail.

## Completed Work

- Created planning and continuity docs.
- Scaffolded Next.js App Router with TypeScript and Tailwind.
- Added PostgreSQL 18 schema, raw SQL migration, Drizzle schema, and seed.
- Implemented mock/server-side weather lookup.
- Implemented credentials auth with hashed passwords and HttpOnly sessions.
- Implemented mock/GCS-ready upload architecture.
- Implemented save sky moment and dashboard timeline.
- Added Sentry scaffolding and security headers.
- Added Playwright smoke tests.
- Sanitized the old hardcoded OpenWeather key from legacy static files.
- Added real GCS direct-upload flow from the Sky Moment form with client/server file validation and uploaded-photo attachment.
- Added protected server-side display for private GCS photos without making the bucket public.
- Added atmospheric landing/weather backgrounds using public curated assets and backward-compatible weather mood resolution.
- Redesigned landing and city weather pages around a premium cinematic weather/Sky Journal composition while preserving search, save, upload, auth, dashboard, and API behavior.
- Hardened auth and weather behavior for local Postgres outages without changing schema, auth model, or API shapes for successful requests.

## Files Created

- `PRODUCT.md`
- `ARCHITECTURE.md`
- `DESIGN.md`
- `DATABASE_NOTES.md`
- `SECURITY.md`
- `DEPLOYMENT.md`
- `TODO.md`
- `BUILD_LOG.md`
- `HANDOFF.md`
- `package.json`
- `app/**`
- `components/**`
- `lib/**`
- `migrations/0001_initial.sql`
- `scripts/migrate.ts`
- `scripts/seed.ts`
- `tests/e2e/vertical-slice.spec.ts`
- `public/backgrounds/**`
- `.env.example`
- `docker-compose.yml`
- `playwright.config.ts`
- `REBUILD_REPORT.md`

## Files Modified

- `README.md`
- `.gitignore`
- `index.html`
- `script.js`
- `config.prod.js`
- `TODO.md`
- `BUILD_LOG.md`
- `HANDOFF.md`
- `DATABASE_NOTES.md`
- `SECURITY.md`
- `DEPLOYMENT.md`

## Commands Run

- `date -Iseconds`
- `npm install`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `docker run --name iconicskies-postgres ... postgres:18`
- `npm run db:migrate`
- `npm run db:seed`
- `npm run test:e2e:install`
- `npm run test:e2e`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm run test:e2e`

## Known Constraints

- Work must stay inside `/mnt/windows/Project/IconicSkies_cskills`.
- Do not push to GitHub, use sudo, hardcode secrets, delete parent folders, or modify files outside this project.
- `psql` is not installed locally; use Docker for database checks.
- Vercel CLI is not installed.
- Docker Compose CLI is not available here, though `docker-compose.yml` is present.
- npm reported 12 moderate transitive audit findings after install; no forced audit fix was run.
- Next dev server prints an LCP hint for `/assets/bg.jpg`; production build is clean.
- GCS bucket CORS must allow browser `PUT` requests from the app origin for direct signed uploads to succeed in production/local browser use.
- `sky_photos` does not currently store `signed_url` or `original_filename`; display uses stored `bucket`, `object_path`, `content_type`, `is_mock`, and `public_url` for mock rows.
- GCS bucket remains private. Public access prevention should stay enforced.
- The GCS service account needs `roles/storage.objectCreator` for uploads and `roles/storage.objectViewer` for private server-side photo display.
- GCS CORS must include the local app origin, for example `http://localhost:3000`, plus the deployed production domain.
- Never expose GCS service account credentials to the browser and do not make the bucket public.
- Curated UI backgrounds are app assets under `public/backgrounds/`, not GCS objects. Do not move them into user-upload storage unless the product explicitly needs remotely managed editorial assets.
- Landing poster paths: desktop/tablet uses `/backgrounds/landing/landing-poster.webp`; mobile below 768px uses `/backgrounds/landing/landing-poster-mobile.webp`; desktop video still uses `/backgrounds/landing/landing-loop.mp4`.
- Weather background metadata fields are optional in `WeatherResult.snapshot`; old cached weather rows may lack `weatherId`, `cloudiness`, `timezoneOffset`, `sunrise`, and `sunset`.
- Latest verification on 2026-06-11: `npm run typecheck`, `npm run lint`, escalated `npm run build`, and escalated `npm run test:e2e` passed. Playwright reported 7 passed and 1 skipped because the landing video toggle is desktop-only.
- Latest mobile poster verification on 2026-06-11: `npm run typecheck`, `npm run lint`, escalated `npm run build`, and escalated `npm run test:e2e` passed. Playwright reported 7 passed and 1 skipped because the landing video toggle is desktop-only.
- Design rescue browser inspection used local Playwright screenshots for landing image mode, landing video mode, mobile landing, and city weather pages. First pass was iterated because the header blended too pale and city metric cards were too tall above the fold.
- Local auth still requires a reachable PostgreSQL instance to sign in, register, create sessions, and save moments. The new behavior improves failure handling; it does not replace the database requirement for authenticated flows.

## Exact Next Steps

1. Run `npm run dev` and open `http://localhost:3000`.
2. Use demo login `demo@iconicskies.local` / `IconicSkiesDemo123!`.
3. For production, configure real `DATABASE_URL`, `OPENWEATHER_API_KEY`, GCS values, `AUTH_SECRET`, and Sentry DSNs.
4. Add production rate limiting and dependency audit follow-up.
5. Configure GCS bucket CORS for direct browser uploads if it is not already set.
6. If original filenames should appear in the UI later, add an explicit migration for `sky_photos.original_filename`.
7. Add focused unit coverage for weather mood resolution edge cases if the resolver grows more complex.

## Resume Prompt

Continue the IconicSkies full-stack rebuild from HANDOFF.md. First read HANDOFF.md, PRODUCT.md, ARCHITECTURE.md, DESIGN.md, DATABASE_NOTES.md, SECURITY.md, DEPLOYMENT.md, TODO.md, then inspect the current file tree and continue from the next unfinished phase. Do not redo completed work unless necessary.
