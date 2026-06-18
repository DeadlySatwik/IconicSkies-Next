# Build Log

## 2026-06-06T02:05:41+05:30 - Phase 1 Started

- Files created: `PRODUCT.md`, `ARCHITECTURE.md`, `DESIGN.md`, `DATABASE_NOTES.md`, `SECURITY.md`, `DEPLOYMENT.md`, `TODO.md`, `BUILD_LOG.md`, `HANDOFF.md`.
- Files modified: none yet.
- Major decisions: prioritize the complete Sky Journal vertical slice over broad optional features.
- Blockers: none.
- Commands run: `date -Iseconds`.

## 2026-06-06T02:22:02+05:30 - Vertical Slice Implemented

- Files created: Next.js app routes, UI components, auth/weather/upload/sky services, Drizzle schema, raw PostgreSQL 18 migration, seed script, Playwright tests, Sentry scaffolding, `.env.example`, `docker-compose.yml`, `playwright.config.ts`, `REBUILD_REPORT.md`.
- Files modified: sanitized legacy OpenWeather key from `index.html`, `script.js`, and `config.prod.js`; replaced `README.md`; updated `TODO.md`, `HANDOFF.md`, and docs.
- Major decisions: full credentials auth, mock weather without `OPENWEATHER_API_KEY`, mock upload fallback without GCS credentials, Sky Journal timeline as dashboard primary surface.
- Blockers encountered: Docker Compose CLI is unavailable in this environment, so PostgreSQL 18 was verified with raw `docker run`; Playwright browsers were missing and were installed into project-local `.cache/ms-playwright`.
- Commands run: `npm install`, `npm run typecheck`, `npm run lint`, `npm run build`, `docker run ... postgres:18`, `npm run db:migrate`, `npm run db:seed`, `npm run test:e2e:install`, `npm run test:e2e`.
- Quality results: typecheck passed, lint passed after source-only scope, build passed, Playwright passed 6/6 tests across desktop and mobile.

## 2026-06-06T02:24:36+05:30 - Final Verification

- Files modified: `.gitignore`, `app/page.tsx`, docs.
- Commands run: `npm run typecheck`, `npm run lint`, `npm run build`, `npm run db:migrate`, `npm run db:seed`, `npm run test:e2e`.
- Quality results: typecheck passed, lint passed, production build passed, migration and seed were idempotent, Playwright passed 6/6 tests.
- Notes: Next dev server prints an LCP hint for `/assets/bg.jpg`; the hero image is already eager-loaded and this does not affect tests or production build.

## 2026-06-10T13:05:20+05:30 - Real GCS Uploads From Sky Moment Form

- Files modified: `components/sky/save-moment-form.tsx`, `app/city/[slug]/page.tsx`, `lib/gcs/service.ts`, `lib/security/validation.ts`, `lib/sky/service.ts`, `app/api/uploads/sign/route.ts`, `app/api/uploads/complete/route.ts`, `app/api/sky-moments/route.ts`.
- Major decisions: the browser receives only a `gcsEnabled` boolean and signed upload metadata, never GCS project id, client email, or private key. Demo-photo checkbox now appears only when GCS is not configured.
- Upload behavior: when GCS is configured, the save form shows a real file input, validates JPG/JPEG/PNG/WebP/GIF under 8 MB, requests `/api/uploads/sign`, uploads directly to GCS, calls `/api/uploads/complete`, then attaches the returned `photoId` to the saved sky moment.
- Security hardening: `/api/uploads/complete` rejects non-mock object paths outside the signed-in user's `sky-photos/<userId>/` prefix; `/api/sky-moments` verifies the uploaded photo belongs to the user and matches the city/weather snapshot before attaching it.
- Commands run: `npm run typecheck`, `npm run lint`, `npm run build`, `npm run test:e2e`.
- Quality results: typecheck passed, lint passed, production build passed after sandbox escalation for Turbopack, Playwright passed 6/6 after clearing the generated `.next` cache.

## 2026-06-10T13:48:39+05:30 - Dashboard Private Photo Display

- Files modified: `components/sky/timeline.tsx`, `lib/sky/service.ts`, `lib/gcs/service.ts`, `app/api/photos/[id]/route.ts`, `SECURITY.md`, `HANDOFF.md`, `BUILD_LOG.md`.
- Major decisions: real uploaded photos display through a protected server-side route instead of public bucket URLs. The bucket remains private, and GCS service account values stay server-only.
- Dashboard behavior: moments with real uploaded photos are labeled `Uploaded photo`; demo photos are labeled `Mock photo`; moments without `photo_id` no longer render image placeholders.
- Display behavior: timeline images use responsive containers and `object-fit: cover`; private photos use `next/image` with `unoptimized` so the browser requests the authenticated local route directly.
- Schema inspection: `sky_photos` currently has `bucket`, `object_path`, `public_url`, `content_type`, `size_bytes`, and `is_mock`; there are no `signed_url` or `original_filename` columns.
- Commands run: `npm run typecheck`, `npm run lint`, `npm run build`, `npm run test:e2e`.
- Quality results: typecheck passed, lint passed, build passed after sandbox escalation for Turbopack, Playwright passed 6/6 on rerun.

## 2026-06-11 - Atmospheric Weather Backgrounds

- Files created: `lib/weather/backgrounds.ts`, `lib/weather/resolve-weather-background.ts`, `components/weather/weather-background.tsx`, `components/layout/landing-background.tsx`, curated assets under `public/backgrounds/`.
- Files modified: `lib/weather/types.ts`, `lib/weather/service.ts`, `lib/weather/mock.ts`, `app/page.tsx`, `app/city/[slug]/page.tsx`, `tests/e2e/vertical-slice.spec.ts`, `DESIGN.md`, `TODO.md`, `HANDOFF.md`.
- Major decisions: curated UI backgrounds stay in `public/` instead of GCS because they are app assets, not user content. `default-day` and `default-night` are manifest aliases to existing clear-sky assets, so no extra physical files are required.
- Compatibility: new weather metadata is optional and stored/read through `weather_snapshots.raw_payload`; no migration was added, and old cached snapshots continue to resolve from condition, description, icon code, and captured time.
- Landing behavior: image poster loads by default; desktop users can opt into the loop video with a `localStorage` preference; mobile and reduced-motion contexts stay in image mode.
- Commands run: `npm run typecheck`, `npm run lint`, `npm run build`, `npm run test:e2e`.
- Quality results: typecheck passed, lint passed, build passed after sandbox escalation for the known Turbopack port-binding restriction, Playwright passed 7/8 with the desktop-only landing video test intentionally skipped on the mobile project.

## 2026-06-11 - Mobile Landing Poster

- Files modified: `components/layout/landing-background.tsx`, `tests/e2e/vertical-slice.spec.ts`, `DESIGN.md`, `BUILD_LOG.md`, `HANDOFF.md`.
- Landing behavior: screens below 768px now use `/backgrounds/landing/landing-poster-mobile.webp`; desktop and tablet keep `/backgrounds/landing/landing-poster.webp`, and the desktop video toggle remains unchanged.
- Mobile behavior: mobile continues to force image mode and uses a cover background with a mobile-specific focal position to avoid awkward cropping.
- Commands run: `npm run typecheck`, `npm run lint`, `npm run build`, `npm run test:e2e`.
- Quality results: typecheck passed, lint passed, build passed after sandbox escalation for Turbopack, Playwright passed 7/8 with the desktop-only video toggle test intentionally skipped on the mobile project.

## 2026-06-11 - Design Rescue Critique Before Coding

- Visual critique: the landing page still reads as a pale default app layout placed over strong artwork. The typography is large but not elegant, the text shadow muddies the headline, the search bar and Image/Video toggle feel disconnected from the hero, and the saved-moment card uses a washed-out surface that fights the cinematic background.
- City critique: the mood image is technically present but emotionally sidelined. The current weather card and save form cover most of the page with bulky blocks, so clear, cloud, rain, and mist moods do not register as the page's primary experience.
- Replacement approach: use fewer, better-composed sections. The landing page becomes one dark cinematic hero with integrated search and a single premium Sky Journal preview. The city page becomes an atmospheric hero band with the key weather reading in the image, followed by solid/semi-solid panels for forecast, metrics, and Save Moment.

## 2026-06-11 - Design Rescue Implementation

- Files modified: `app/page.tsx`, `app/city/[slug]/page.tsx`, `components/layout/site-header.tsx`, `components/layout/landing-background.tsx`, `components/weather/search-panel.tsx`, `components/weather/weather-card.tsx`, `components/sky/save-moment-form.tsx`, `DESIGN.md`, `BUILD_LOG.md`, `HANDOFF.md`.
- Landing redesign: replaced the pale hero treatment with a dark cinematic composition, integrated the Image/Video toggle into the hero, preserved the functional city search/units/action controls, and reduced the right side to one premium Sky Journal preview.
- City redesign: moved temperature, condition, location, time, and search into an atmospheric hero band; moved metrics and forecast into elevated solid/semi-solid panels below; kept Save Moment readable with clear textarea, upload/mock fallback, and submit states.
- Header adjustment: changed the global header to a restrained solid midnight bar so it stays readable on landing/city pages without making dashboard/auth pages depend on translucent artwork.
- Security/API scope: no database schema, migration, secret, Neon, OpenWeather, GCS upload, private photo display, auth, dashboard data, or API files were changed.
- Browser inspection: reviewed landing image mode, landing video mode, mobile landing, and city pages for Darjeeling/Tokyo. Iterated once after the first pass because the header was too pale and the city metrics card was too tall.
- Commands run: pending final verification in this turn.

## 2026-06-12 - DB Outage Fallback Fixes

- Files modified: `app/api/auth/login/route.ts`, `app/api/auth/register/route.ts`, `components/auth/auth-form.tsx`, `lib/db/client.ts`, `lib/weather/service.ts`.
- Auth fix: login and register now catch local Postgres connection refusal and return clean `503` JSON errors instead of crashing the route and leaving the browser with an empty response body.
- Weather fix: live weather lookup now keeps rendering weather results even when cache/persist writes cannot reach Postgres, so city pages do not collapse into the generic lookup-failed state just because the database is offline.
- Browser behavior: verified `/api/auth/login` returns a structured `503` response when `127.0.0.1:5432` is unavailable, and verified `/city/alipurduar?units=metric` still renders weather content instead of the lookup-failed panel.

## 2026-06-18 - Favorite Locations

- Files modified: `lib/db/schema.ts`, `migrations/0002_favorite_locations.sql`, `lib/security/validation.ts`, `lib/weather/service.ts`, `lib/favorites/service.ts`, `app/api/favorites/route.ts`, `app/api/favorites/[id]/route.ts`, `app/api/favorites/[id]/weather/route.ts`, `app/api/weather/preview/route.ts`, `app/city/[slug]/page.tsx`, `app/dashboard/page.tsx`, `components/favorites/current-location-card.tsx`, `components/favorites/favorite-location-control.tsx`, `components/favorites/favorite-location-actions.tsx`, `components/favorites/favorite-locations-grid.tsx`, `components/sky/timeline.tsx`, `files/DESIGN.md`, `files/ARCHITECTURE.md`, `files/DATABASE_NOTES.md`, `files/HANDOFF.md`, `files/TODO.md`.
- Major decisions: keep `favorite_cities` legacy-only; introduce `favorite_locations` as the source of truth; allow multiple labels for the same city identity by including label in the unique location key; store rounded current-location coordinates only after an explicit save action.
- Dashboard behavior: added a compact "Current Sky" card that previews weather near the user only after clicking a button, a "My Places" grid with up to 6 live weather previews, per-card fallback states, and edit/remove controls.
- City behavior: added a subtle favorite save control that lets signed-in users add or update labels such as Home, Hostel, or Work without disturbing the atmospheric weather layout.
- Timeline behavior: matching saved moments now show a small favorite pill when they belong to one of the user's favorite locations.
- Privacy behavior: current-location preview is ephemeral until explicitly saved, raw coordinates are never shown in the UI, and stored favorite coordinates are rounded to roughly 3 decimals.
- Commands run: `npm run typecheck`, `npm run lint`, `npm run build`, `npm run test:e2e`.
- Quality results: typecheck passed, lint passed, production build passed, Playwright passed 7/8 after a sandbox escalation was needed for the local web server bind during the e2e run. One desktop-only landing video test remains intentionally skipped on the mobile project.

## 2026-06-18 - Favorite Locations Polish Pass

- Files modified: `lib/weather/service.ts`, `lib/weather/current-location.ts`, `app/api/weather/preview/route.ts`, `components/favorites/current-location-card.tsx`, `components/favorites/favorite-location-control.tsx`, `components/favorites/favorite-location-actions.tsx`, `components/favorites/favorite-locations-grid.tsx`, `components/layout/current-location-entry.tsx`, `app/page.tsx`, `app/dashboard/page.tsx`, `files/BUILD_LOG.md`, `files/HANDOFF.md`.
- Major decisions: improve dashboard contrast with slightly denser surfaces and stronger text colors; resolve current-location labels against the nearest searchable city when confidence is good, otherwise fall back to "Near your location"; keep the landing current-location entry point compact and subordinate to the hero search.
- Privacy behavior: current-location preview remains ephemeral, and the preview endpoint still exposes no coordinates or secrets to the browser.
- Commands run: `npm run typecheck`, `npm run lint`, `npm run build`.
- Quality results: typecheck passed, lint passed after renaming the current-location click handler, and the production build passed.

## 2026-06-18 - Dashboard and Error-State Atmospheric Shell

- Files modified: `components/layout/atmospheric-page-shell.tsx`, `app/dashboard/page.tsx`, `app/city/[slug]/page.tsx`, `components/sky/timeline.tsx`, `files/DESIGN.md`, `files/BUILD_LOG.md`, `files/HANDOFF.md`.
- Major decisions: unify dashboard, journal, and failed city-search states under a dark atmospheric shell so the app reads as one system; keep the failed-search state calm, compact, and searchable instead of a pale empty page.
- Visual behavior: dashboard hero, My Places, and timeline cards now use dark premium surfaces; the failed search page uses a centered error card with quick city suggestions and the existing search panel.
- Commands run: `npm run typecheck`, `npm run lint`, `npm run build`, `npm run test:e2e` with sandbox escalation for local web-server startup.
- Quality results: typecheck passed, lint passed, production build passed, and Playwright passed 7/8 with the desktop-only landing video check skipped on the mobile project.
