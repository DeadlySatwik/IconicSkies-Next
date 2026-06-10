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
