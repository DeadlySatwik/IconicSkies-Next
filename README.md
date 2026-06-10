# IconicSkies

IconicSkies is a full-stack weather and Sky Journal app.

Core identity: "Remember the sky, not just the weather."

The app lets users search weather by city, view current conditions, register/login, save a sky moment with a journal note, attach a mock or GCS-ready sky photo, and revisit saved moments in a dashboard timeline.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- PostgreSQL 18
- Drizzle ORM plus raw SQL migrations
- Docker for local PostgreSQL
- Google Cloud Storage signed upload architecture with mock fallback
- Playwright smoke tests
- Sentry scaffolding

## Quick Start

```bash
npm install

# Start PostgreSQL 18. If Docker Compose is available:
docker compose up -d postgres

# If this Docker install has no Compose plugin, use raw Docker:
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

Open `http://localhost:3000`.

Demo login:

- Email: `demo@iconicskies.local`
- Password: `IconicSkiesDemo123!`

## Environment

Copy `.env.example` to `.env.local` and fill values as needed. Leaving `OPENWEATHER_API_KEY` and GCS variables blank enables mock weather/upload behavior.

Do not put secrets in `NEXT_PUBLIC_*` variables.

## Google Cloud Storage

The sky photo bucket should remain private. Keep public access prevention enforced, and do not make the bucket or objects public.

The server-side GCS service account needs these bucket-level roles:

- `roles/storage.objectCreator` for signed uploads.
- `roles/storage.objectViewer` for private server-side photo display.

The browser must never receive service account credentials. Keep `GCS_PROJECT_ID`, `GCS_CLIENT_EMAIL`, and `GCS_PRIVATE_KEY` in server-side environment variables only.

Bucket CORS must allow direct signed uploads:

- Include local development, for example `http://localhost:3000`.
- Include the deployed production app domain.
- Allow `PUT` requests with the `Content-Type` header.
- Do not use public bucket access as a workaround for CORS or photo display.

## Scripts

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run typecheck`
- `npm run db:migrate`
- `npm run db:seed`
- `npm run test:e2e:install`
- `npm run test:e2e`

## Documentation

- `PRODUCT.md`
- `ARCHITECTURE.md`
- `DESIGN.md`
- `DATABASE_NOTES.md`
- `SECURITY.md`
- `DEPLOYMENT.md`
- `TODO.md`
- `BUILD_LOG.md`
- `HANDOFF.md`
- `REBUILD_REPORT.md`
