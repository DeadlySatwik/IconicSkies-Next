# IconicSkies

IconicSkies is a full-stack weather and Sky Journal app built around one idea: remember the sky, not just the forecast. Users can search live weather, save a Sky Moment with notes and photos, revisit a timeline of saved skies, and generate AI-assisted journal content without exposing private media or secrets to the browser.

## Live Links

- Production app: `https://iconicskies.deadlys.tech`
- Local development: `http://localhost:3000`

## Features

- City weather search with current conditions and forecast
- Sky Journal timeline with notes, photos, titles, mood tags, and favorite-location markers
- Favorite locations and Current Sky preview
- Past Sky Moment capture for up to 14 days with selected captured time and location
- Historical weather lookup with Open-Meteo fallback for backdated moments
- Mood view and Photo view switching for saved Sky Moment visuals
- Private Google Cloud Storage photo uploads through signed URLs and an authenticated media route
- Redis-backed email OTP verification and optional email OTP sign-in protection
- Groq-powered note enhancement, title and mood tag suggestions, and monthly recap generation
- Upstash Redis caching for recap and weather-derived responses, plus AI route rate limiting
- Playwright smoke coverage for core weather, journal, and auth flows

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- PostgreSQL / Neon
- Drizzle ORM
- OpenWeather API
- Open-Meteo historical weather fallback
- Google Cloud Storage
- Upstash Redis and Upstash Ratelimit
- Groq AI
- Playwright
- Vercel

## Architecture Summary

The app uses server-rendered Next.js routes for weather, dashboard, and auth surfaces, with API routes handling uploads, AI workflows, OTP verification, and Sky Moment persistence. PostgreSQL is the source of truth for users, weather snapshots, photos, favorites, and journal entries. Redis is used only for derived or short-lived data such as OTP challenges, AI rate limiting, monthly recap cache entries, and weather cache responses. Private photos stay in a non-public GCS bucket and are served only through an authenticated server route.

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create a local database and copy env values:

```bash
cp .env.example .env.local
```

3. Start PostgreSQL locally. Example with Docker:

```bash
docker run --name iconicskies-postgres \
  -e POSTGRES_DB=iconicskies \
  -e POSTGRES_USER=iconicskies \
  -e POSTGRES_PASSWORD=iconicskies \
  -p 5432:5432 \
  -d postgres:18
```

4. Run the database setup and start the app:

```bash
npm run db:migrate
npm run db:seed
npm run dev
```

Some features degrade cleanly in local development when optional services are not configured:

- Weather can fall back to mock/demo behavior without `OPENWEATHER_API_KEY`
- GCS uploads can fall back to mock paths without GCS credentials
- Email OTP is unavailable without an email provider
- Redis caching and rate limiting are skipped when Upstash env vars are missing

## Environment Variables

Copy `.env.example` to `.env.local` and set only the services you need.

### Core app

- `DATABASE_URL`
- `NEXT_PUBLIC_APP_URL`
- `AUTH_SECRET`

### Weather

- `OPENWEATHER_API_KEY`

### Storage

- `GCS_PROJECT_ID`
- `GCS_BUCKET_NAME`
- `GCS_CLIENT_EMAIL`
- `GCS_PRIVATE_KEY`

### Redis and rate limiting

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

### AI

- `GROQ_API_KEY`
- `GROQ_MODEL`
- `GROQ_FALLBACK_MODEL`

### Email OTP

- `OTP_SECRET`
- `OTP_TTL_SECONDS`
- `OTP_RESEND_COOLDOWN_SECONDS`
- `OTP_MAX_VERIFY_ATTEMPTS`
- `OTP_DEV_LOG_CODES`
- `RESEND_API_KEY`
- `EMAIL_FROM`

### Optional and non-current SMS placeholders

- `SMS_OTP_PROVIDER`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_FROM`

SMS OTP is not a current product feature. These values exist only as provider placeholders for future extension.

### Optional observability

- `SENTRY_DSN`
- `NEXT_PUBLIC_SENTRY_DSN`

## Common Commands

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run test:e2e:install
npm run db:migrate
npm run db:seed
npm run db:studio
```

## Deployment Notes

- Designed for Vercel with server-only secrets configured in the project environment
- PostgreSQL is expected to run on Neon or another managed Postgres provider
- GCS bucket should remain private with signed uploads and server-side media reads only
- Upstash Redis is optional in development and recommended in production for OTP, caching, and AI throttling
- Groq, OpenWeather, email provider, and storage credentials must never be exposed in `NEXT_PUBLIC_*` variables

## Privacy and Security Highlights

- Password auth remains the default sign-in path
- Email OTP challenges are stored only in Redis, HMAC-hashed, short-lived, and never persisted in PostgreSQL
- Private sky photos are served through `/api/photos/[id]` after ownership checks
- AI routes send only minimal journal context and never send GCS object paths or private media URLs
- Historical weather for past moments uses validated captured time and selected location instead of silently reusing current weather
- Secrets, OTP codes, and service credentials should never be logged in production
