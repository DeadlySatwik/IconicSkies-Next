# Handoff

## Current Phase

Complete vertical slice implemented.

## Current State

The approved vertical slice has been implemented as a Next.js full-stack app. PostgreSQL 18 migrations and seed were verified against a running `postgres:18` container. Playwright smoke tests passed across desktop and mobile in the final run.

Update on 2026-06-10: the city page Sky Moment form now supports real GCS direct uploads when server-side GCS env vars are configured. The mock/demo checkbox is only shown when GCS is not configured.

Update on 2026-06-10: dashboard timeline now displays real private GCS photos through `/api/photos/[id]`, labels real photos as `Uploaded photo`, keeps `Mock photo` only for mock rows, and hides media placeholders for moments without `photo_id`.

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

## Exact Next Steps

1. Run `npm run dev` and open `http://localhost:3000`.
2. Use demo login `demo@iconicskies.local` / `IconicSkiesDemo123!`.
3. For production, configure real `DATABASE_URL`, `OPENWEATHER_API_KEY`, GCS values, `AUTH_SECRET`, and Sentry DSNs.
4. Add production rate limiting and dependency audit follow-up.
5. Configure GCS bucket CORS for direct browser uploads if it is not already set.
6. If original filenames should appear in the UI later, add an explicit migration for `sky_photos.original_filename`.

## Resume Prompt

Continue the IconicSkies full-stack rebuild from HANDOFF.md. First read HANDOFF.md, PRODUCT.md, ARCHITECTURE.md, DESIGN.md, DATABASE_NOTES.md, SECURITY.md, DEPLOYMENT.md, TODO.md, then inspect the current file tree and continue from the next unfinished phase. Do not redo completed work unless necessary.
