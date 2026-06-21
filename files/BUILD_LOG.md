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

## 2026-06-20 - AI Journal Enhancement

- Files created: `app/api/ai/journal-enhance/route.ts`, `lib/ai/journal-enhancer.ts`, `lib/ai/journal-styles.ts`.
- Files modified: `components/sky/save-moment-form.tsx`, `app/city/[slug]/page.tsx`, `files/DESIGN.md`, `files/ARCHITECTURE.md`, `files/BUILD_LOG.md`, `files/HANDOFF.md`, `files/TODO.md`.
- Major decisions: add an optional Gemini-powered polishing helper inside the Sky Moment form, keep the user’s original note intact until they explicitly accept the suggestion, and keep all AI work server-side.
- Privacy behavior: only the note text and minimal weather context are sent to Gemini. No secrets, user email, private photo URLs, or raw GCS object paths are exposed to the browser.
- UX behavior: the form now shows a small style picker, an enhancement button, and a compact preview card with accept/regenerate/copy/keep-original actions. If `GEMINI_API_KEY` is missing, the button is disabled with a calm explanatory message.
- Commands run: `npm run typecheck`, `npm run lint`, `npm run build`, `npm run test:e2e` with sandbox escalation for the local web-server startup.
- Quality results: typecheck passed, lint passed, production build passed, and Playwright passed 7/8 with the desktop-only landing video check skipped on the mobile project.

## 2026-06-20 - AI Route Contract Cleanup

- Files modified: `app/api/ai/journal-enhance/route.ts`, `components/sky/save-moment-form.tsx`.
- Major decisions: simplify the API response to return only `enhancedNote`, and keep the client check focused on the HTTP status plus the returned note text.
- Commands run: `npm run typecheck`, `npm run lint`, `npm run build`.
- Quality results: typecheck passed, lint passed, and the production build passed.

## 2026-06-20 - AI Journal Polish Pass

- Files modified: `components/sky/save-moment-form.tsx`, `lib/ai/journal-enhancer.ts`, `app/api/ai/journal-enhance/route.ts`, `files/DESIGN.md`, `files/ARCHITECTURE.md`.
- Major decisions: replace the style chip row with a readable writing-style dropdown, raise assistant-panel contrast, and strengthen the prompt so it preserves concrete note details like DSA, dev work, travel, or weather context.
- Model behavior: default Gemini model is now `gemini-2.5-flash`, with `GEMINI_MODEL` override support.
- Safety behavior: the route rejects weak Gemini fragments that are too short or clearly incomplete, instead of surfacing a blunt fragment to the user.

## 2026-06-21 - AI Journal Groq Provider Switch

- Files modified: `app/api/ai/journal-enhance/route.ts`, `lib/ai/journal-enhancer.ts`, `components/sky/save-moment-form.tsx`, `app/city/[slug]/page.tsx`, `.env.example`, `files/DESIGN.md`, `files/ARCHITECTURE.md`, `files/HANDOFF.md`.
- Major decisions: replace the Gemini provider path with Groq's OpenAI-compatible chat completions endpoint and keep the existing dropdown/preview UI.
- Model behavior: default Groq model is `llama-3.3-70b-versatile`; `GROQ_MODEL` can override it and `GROQ_FALLBACK_MODEL` is attempted only when the primary provider response fails before producing a usable response.
- Prompt behavior: the system prompt is now style-specific and explicitly preserves non-weather activity context, weather mood, and technical terms such as DSA.
- Safety behavior: validation rejects only empty output, very short output, punctuation fragments, unfinished phrases, or output that drops all meaningful original context.

## 2026-06-21 - AI Journal V2 and V3

- Files created: `app/api/ai/journal-insights/route.ts`, `app/api/ai/monthly-recap/route.ts`, `lib/ai/monthly-recap.ts`, `lib/sky/monthly-recap.ts`, `components/sky/monthly-sky-recap.tsx`, `migrations/0003_ai_journal_insights.sql`.
- Files modified: `lib/db/schema.ts`, `lib/security/validation.ts`, `lib/dev/fallback-store.ts`, `lib/sky/service.ts`, `components/sky/save-moment-form.tsx`, `components/sky/timeline.tsx`, `app/api/sky-moments/route.ts`, `app/dashboard/page.tsx`, `app/page.tsx`, `tests/e2e/vertical-slice.spec.ts`, `files/DATABASE_NOTES.md`, `files/ARCHITECTURE.md`, `files/DESIGN.md`, `files/HANDOFF.md`, `files/TODO.md`.
- Major decisions: add nullable `title` and JSONB `mood_tags` columns to `sky_moments`; keep title/tag suggestions optional and user-approved in the save form; host monthly recap on the dashboard as an on-demand card with month navigation; reuse the existing Groq transport for both new AI routes.
- Prompt behavior: journal insights return strict JSON for a compact title plus mood tags, while monthly recap summarizes at most 20 moments with truncated excerpts and no stored recap history.
- UX behavior: the save form now includes a compact "Title & mood" block with AI suggestions, while the dashboard gets a new monthly recap card with month navigation, summary chips, and a generate button.
- Commands run: `npm run typecheck`, `npm run lint`, `npm run build`, `npm run test:e2e`.
- Quality results: typecheck passed, lint passed, production build passed, and Playwright e2e could not start because the configured web server exited early.

## 2026-06-21 - Groq JSON Parser Fix

- Files modified: `lib/ai/groq.ts`, `app/api/ai/journal-insights/route.ts`, `app/api/ai/monthly-recap/route.ts`, `components/sky/save-moment-form.tsx`, `tests/e2e/vertical-slice.spec.ts`, `files/HANDOFF.md`.
- Parser fix: journal insights and monthly recap now extract `choices[0].message.content` from the Groq chat-completion wrapper before parsing JSON and validating with Zod.
- Robustness behavior: the shared Groq helper now accepts raw JSON, fenced JSON, or a JSON object embedded in surrounding text; route logs include only sanitized model-content previews and Zod issue summaries.
- Provider behavior: strict provider JSON mode was removed from the two JSON routes so fallback models do not fail before app-side parsing and validation.
- UI/test fix: successful title/tag suggestions clear stale error text, and the Playwright duplicate-text assertion is scoped to the `Sky Journal timeline` region.
- Commands run: `npm run typecheck`, `npm run lint`, `npm run build`, `npm run test:e2e`.
- Quality results: typecheck passed, lint passed, production build passed, and Playwright passed 7/8 with the desktop-only landing video check skipped on the mobile project. The e2e run required sandbox escalation because the local Next dev server bind is blocked in the normal sandbox.

## 2026-06-21 - Monthly Recap JSON Tolerance

- Files modified: `lib/ai/groq.ts`, `lib/ai/monthly-recap.ts`, `app/api/ai/monthly-recap/route.ts`.
- Parser fix: control characters are normalized out of extracted JSON text before `JSON.parse`, which prevents the `Bad control character in string literal` failure seen in monthly recap content.
- Schema fix: monthly recap now accepts `highlights` and `dominantMoods` as either arrays or comma/newline-delimited strings, then normalizes both to capped string arrays before validation.
- Provider behavior: monthly recap now uses the primary Groq model only and does not fall back to `qwen/qwen3-32b`; if the first pass is malformed, the route performs one compact repair pass on the same primary model.
- Prompt behavior: the monthly recap prompt now explicitly asks for JSON-only output, no newlines inside string values, and array-typed `highlights` / `dominantMoods`, with an exact example payload.
- Commands run: `npm run typecheck`, `npm run lint`, `npm run build`, `npm run test:e2e`.
- Quality results: typecheck passed, lint passed, production build passed, and Playwright passed 7/8 with one expected mobile skip.

## 2026-06-21 - Progressive Disclosure Pass

- Files created: `components/ui/collapsible-section.tsx`.
- Files modified: `app/dashboard/page.tsx`, `components/sky/monthly-sky-recap.tsx`, `components/sky/save-moment-form.tsx`, `components/sky/timeline.tsx`, `components/favorites/favorite-locations-grid.tsx`, `lib/sky/monthly-recap.ts`, `playwright.config.ts`, `tests/e2e/vertical-slice.spec.ts`, `files/DESIGN.md`, `files/ARCHITECTURE.md`, `files/TODO.md`, `files/BUILD_LOG.md`, `files/HANDOFF.md`.
- Major decisions: use a reusable accessible disclosure primitive for optional product surfaces, keep `Current Sky` visible, collapse `Monthly Sky Recap` and `Favorite skies` by default, and group the journal archive by month with the current month open first.
- Save-form behavior: move AI note enhancement and AI title/mood tools into optional collapsible panels that preserve state and never fetch on open.
- Dashboard behavior: wrap monthly recap and favorite locations in collapsible sections, and render the timeline as month-grouped collapsible archives with counts in the headers.
- Test behavior: the Playwright config now supports `PLAYWRIGHT_SKIP_WEBSERVER=1` for environments where an already-running localhost dev server should be reused.
- Commands run: `npm run typecheck`, `npm run lint`, `npm run build`, `PLAYWRIGHT_SKIP_WEBSERVER=1 PLAYWRIGHT_BASE_URL=http://localhost:3000 npm run test:e2e`.
- Quality results: typecheck passed, lint passed, production build passed, and Playwright passed 7/8 with the desktop-only landing video check skipped on the mobile project.
