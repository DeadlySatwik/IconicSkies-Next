<div align="center">
  <img src="./public/assets/icon.png" alt="IconicSkies logo" width="118" />

  # IconicSkies

  **Remember the sky, not just the forecast.**

  A full-stack weather journal for turning live conditions, personal notes, and private photos into a timeline of skies worth remembering.

  <p>
    <a href="https://iconicskies.deadlys.tech"><strong>Live Demo</strong></a>
    ·
    <a href="#-core-features">Features</a>
    ·
    <a href="#-architecture-overview">Architecture</a>
    ·
    <a href="#-local-setup">Setup</a>
    ·
    <a href="#-privacy-and-security">Security</a>
    ·
    <a href="#-testing-guide">Testing</a>
  </p>

  [![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
  [![Drizzle ORM](https://img.shields.io/badge/Drizzle-ORM-C5F74F?logo=drizzle&logoColor=111111)](https://orm.drizzle.team/)
  [![Upstash Redis](https://img.shields.io/badge/Upstash-Redis-00E9A3?logo=redis&logoColor=111111)](https://upstash.com/)
  [![Google Cloud Storage](https://img.shields.io/badge/Google_Cloud-Storage-4285F4?logo=googlecloud&logoColor=white)](https://cloud.google.com/storage)
  [![Groq](https://img.shields.io/badge/Groq-AI-F55036)](https://groq.com/)
  [![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?logo=vercel&logoColor=white)](https://vercel.com/)
  [![License: MIT](https://img.shields.io/badge/License-MIT-2EA44F.svg)](./LICENSE)
</div>

---

<p align="center">
  <img src="./public/backgrounds/landing/landing-poster.webp" alt="IconicSkies atmospheric landing artwork" width="100%" />
</p>

## 🔴 Live Deployment

| Environment | URL |
| :--- | :--- |
| **Production** | [iconicskies.deadlys.tech](https://iconicskies.deadlys.tech) |
| **Local development** | [localhost:3000](http://localhost:3000) |

IconicSkies is deployed as a Next.js application on Vercel. Database, weather, storage, Redis, AI, and email credentials are read only by server-side code and must be configured through the deployment environment.

## 🌤️ What Is IconicSkies?

IconicSkies is a weather app built around memory. It begins with practical city weather search and atmospheric condition pages, then lets a verified user preserve that moment with its place, captured time, weather snapshot, personal note, mood, and an optional private photograph.

Those entries become a personal **Sky Journal** rather than a list of forecasts. Users can revisit saved moments chronologically, browse photos, follow favorite locations, preview the sky near their current location, or switch each visual between a weather-led Mood view and a captured-photo-led Photo view.

AI remains an optional writing companion. It can polish a note without replacing the original, suggest a title and mood tags, or create an on-demand monthly recap from a limited set of journal context. The user stays in control of what is accepted and saved.

> **Weather tells you what happened. IconicSkies helps you remember how it felt.**

## 🎯 Problem and Motivation

Most weather products are designed for the next few hours: temperature, rain, wind, and forecasts. Once the day passes, the personal context disappears. A rain-washed study session, a quiet hostel sunrise, or the sky above a journey becomes disconnected from the weather that shaped it.

IconicSkies treats weather as part of a memory. It combines trustworthy weather context with private journaling and photography, making the forecast useful now and meaningful later.

## 💡 The Solution

A **Sky Moment** joins four kinds of context in one entry:

1. **Place and time** — the city and moment where the memory happened.
2. **Weather snapshot** — current weather or historical weather for a supported past capture.
3. **Personal expression** — a note, optional title, and mood tags.
4. **Private media** — an optional photo stored outside the public web.

Users can save a current moment or backdate one by up to 14 days. For past moments, the selected captured city and timestamp drive historical weather lookup; the app does not silently substitute today’s conditions. Account access is protected by password authentication and mandatory one-time inbox verification, with optional email OTP on future sign-ins for selected accounts.

## ✨ Core Features

### Weather Search

- Search live weather by city.
- View current conditions and forecast data on atmospheric weather pages.
- Preview weather near the browser’s current location only after explicit permission.
- Cache normalized weather responses briefly through optional Upstash Redis.
- Use condition-aware imagery for clear, cloudy, rainy, foggy, snowy, windy, and stormy skies.

### Sky Moments

- Save a note with captured city, country, time, weather snapshot, and optional photo.
- Add an optional journal title and up to five mood tags.
- Capture a past moment from the previous 14 days.
- Choose a different captured city when saving a memory away from the currently viewed location.
- Resolve historical weather through Open-Meteo when saving a backdated moment.
- Reject future captures, captures older than 14 days, and invalid captured locations.

### Sky Journal and Gallery

- Browse a chronological timeline grouped by month and year.
- View compact journal cards with weather, location, title, tags, note, and photo context.
- Browse saved media through the authenticated gallery.
- Switch an individual moment between:
  - **Mood view** — the weather mood image leads the composition.
  - **Photo view** — the captured photo fills the visual frame.
- Keep each moment’s visual preference in browser storage without changing saved journal data.

### AI Journal Tools

- **Note enhancement** — rewrites a rough note in a selected style while preserving its concrete meaning.
- **Title and mood suggestions** — returns an editable title and compact mood tags.
- **Monthly Sky Recap** — creates an on-demand summary of a selected month.
- Uses Groq from server-side routes only.
- Requires user action; AI calls are never automatic on page load.
- Saves only user-approved journal text.

### Favorite Locations and Current Sky

- Save up to six labeled favorite places such as Home, Work, or Hostel.
- View compact live weather previews for saved places.
- Edit or remove favorites without leaving the dashboard.
- Preview Current Sky through explicit, one-time browser geolocation.
- Keep the current location ephemeral unless the user deliberately saves it.

### Authentication and Account Safety

- Passwords are hashed server-side.
- New accounts complete one-time email verification before protected app features unlock.
- Registration checks syntax, normalized address, reserved/test domains, a small disposable-domain denylist, and DNS MX records before sending an OTP.
- Email OTP challenges are HMAC-hashed and stored only in Redis with a short TTL.
- Optional external email validation supports disabled, Abstract, and ZeroBounce modes.
- `email_verified_at` and `otp_required` remain separate:
  - verification proves inbox access once;
  - `otp_required=true` adds email OTP after a correct password on future logins.

### Privacy-First Photo Storage

- Uploads use server-authorized signed URLs.
- The Google Cloud Storage bucket remains private.
- GCS object paths are not exposed as public media URLs.
- Photos are served through authenticated `/api/photos/[id]` requests with ownership checks.
- Private photo URLs and storage paths are never sent to the AI provider.

### Performance and Reliability

- PostgreSQL remains the durable source of truth.
- Redis stores derived, cached, or short-lived state only.
- Weather and monthly recap caches fail open when Redis is unavailable.
- AI and OTP endpoints use rate limiting to reduce abuse.
- Historical weather uses stable, privacy-conscious cache keys with rounded coordinates.
- Playwright covers important public, authentication, and protected-route flows.

## ✅ What Is Implemented Today

- Live city weather search and atmospheric weather pages
- Current conditions and forecast presentation
- Password registration, login, logout, and server-managed sessions
- Mandatory one-time email verification for new accounts
- Pre-OTP email syntax, blocked-domain, disposable-domain, and MX checks
- Optional Abstract or ZeroBounce validation hook, disabled by default
- Redis-backed, HMAC-hashed email OTP challenges
- Optional per-login email OTP through `otp_required=true`
- Current Sky preview after explicit geolocation permission
- Favorite location create, update, delete, and weather previews
- Sky Moment notes, titles, mood tags, weather snapshots, and private photos
- Backdated Sky Moments up to 14 days with selected time and city
- Open-Meteo historical weather fallback
- Sky Journal timeline, monthly grouping, and gallery
- Per-moment Mood view and Photo view switching
- Groq-powered note enhancement and journal insights
- On-demand AI monthly recap with deterministic Redis caching
- Private GCS uploads and authenticated photo serving
- Upstash weather caching and AI/API rate limiting
- Responsive dark atmospheric landing, auth, city, dashboard, and journal surfaces
- Playwright smoke and end-to-end tests
- Vercel deployment

## 🏗️ Architecture Overview

### System Diagram

```text
┌────────────────────────────── Browser ──────────────────────────────┐
│ Landing · City Weather · Dashboard · Journal · Gallery · Settings │
│ Client interactions: search, forms, geolocation, visual toggles   │
└───────────────────────────────┬────────────────────────────────────┘
                                │ HTTPS
                                ▼
┌──────────────────────── Next.js App Router ────────────────────────┐
│ Server Components / Pages       │ Route Handlers (`app/api/*`)     │
│ weather and journal rendering   │ auth · OTP · weather · uploads   │
│ protected app surfaces          │ photos · favorites · AI · moments│
└──────────┬────────────┬─────────┴──────┬──────────┬─────────┬──────┘
           │            │                │          │         │
           ▼            ▼                ▼          ▼         ▼
┌────────────────┐ ┌─────────────┐ ┌──────────┐ ┌────────┐ ┌────────┐
│ Neon Postgres  │ │Upstash Redis│ │Private GCS│ │Weather │ │ Groq   │
│ durable records│ │OTP/cache/   │ │sky photos │ │APIs    │ │ AI     │
│ + Drizzle ORM  │ │rate limits  │ │           │ │        │ │        │
└────────────────┘ └─────────────┘ └──────────┘ └────┬───┘ └────────┘
                                                     │
                                  OpenWeather ───────┤
                                  Open-Meteo history ┘

                             ┌───────────────┐
                             │ Resend Email  │
                             │ OTP delivery  │
                             └───────────────┘
```

### Boundaries and Data Ownership

- **Next.js Server Components and pages** render the main app surfaces and load user-scoped data on the server.
- **Client Components** handle interactive forms, geolocation permission, collapsible panels, uploads, and per-moment visual preferences.
- **Route Handlers** validate incoming data and orchestrate authentication, OTP, weather, uploads, private photos, favorites, AI, and Sky Moment mutations.
- **PostgreSQL/Neon** is the source of truth for users, sessions, favorites, weather snapshots, photo metadata, and journal entries.
- **Upstash Redis** holds short-lived OTP challenges, rate-limit state, and derived weather or recap cache entries.
- **Google Cloud Storage** holds private photo objects; the browser reads them through an authenticated application route.
- **External providers** are called only by server-side modules. Their credentials never enter the client bundle.

## 🗂️ Directory Structure

```text
IconicSkies/
├── app/                         # App Router pages and API route handlers
│   ├── api/                     # Auth, OTP, AI, weather, upload, photo,
│   │                            # favorite, and Sky Moment endpoints
│   ├── city/                    # Public weather search and city pages
│   ├── dashboard/               # Current Sky, favorites, recap, journal
│   ├── gallery/                 # Authenticated saved-photo view
│   ├── settings/                # Account Security
│   └── verify-email/            # Mandatory one-time verification flow
├── components/                  # Auth, layout, weather, favorite, and sky UI
├── lib/
│   ├── ai/                      # Groq client, prompts, and output validation
│   ├── auth/                    # Password, session, OTP, and email checks
│   ├── cache/                   # Optional Redis cache and rate-limit helpers
│   ├── db/                      # Drizzle schema and PostgreSQL client
│   ├── gcs/                     # Private object upload/read services
│   ├── sky/                     # Journal persistence and recap logic
│   └── weather/                 # Current, location, and historical weather
├── migrations/                  # Versioned PostgreSQL migrations
├── public/                      # Icons, landing media, and weather artwork
├── scripts/                     # Migration and seed entry points
├── tests/e2e/                   # Playwright browser coverage
├── files/                       # Product, security, architecture, and ops docs
└── config/                      # Service configuration such as Sentry/GCS
```

## 🔐 Auth and Verification Flow

Email verification is a one-time account activation step. Optional OTP sign-in protection is a separate control.

```text
Registration
    │
    ▼
Normalize + validate syntax
    │
    ▼
Block reserved/test/disposable domains
    │
    ▼
Resolve domain MX records
    │
    ├── clearly invalid ──► reject before account/OTP delivery
    │
    ▼
Optional provider validation (disabled by default)
    │
    ▼
Create unverified account + send short-lived email OTP
    │
    ▼
Correct OTP ──► set email_verified_at ──► unlock protected app
```

After verification:

```text
otp_required = false  →  password  →  session
otp_required = true   →  password  →  email OTP  →  session
```

The OTP itself is never stored in PostgreSQL or plaintext Redis data. Redis stores an HMAC digest, hashed identifier, timestamps, and attempt metadata until the challenge expires or is consumed.

## 🛡️ Privacy and Security

- Passwords are hashed with a server-side password hashing implementation.
- New accounts must verify their inbox once before using protected features.
- Obvious fake, reserved, disposable, and non-MX addresses are rejected before OTP delivery.
- OTP challenges default to a 240-second TTL, 60-second resend cooldown, and five verification attempts.
- Raw email addresses are not used in OTP Redis keys.
- The GCS bucket remains private; uploads and reads are authorized by the application.
- `/api/photos/[id]` verifies the session and photo ownership before streaming media.
- AI requests contain minimal journal/weather context, never private photo URLs, object paths, email addresses, or secrets.
- Coordinate cache keys use rounded values rather than full GPS precision.
- Secrets belong in server-side environment variables, never `NEXT_PUBLIC_*` unless explicitly safe for browser exposure.
- OTP codes and credentials must never be logged in production.

For the complete security model and operational guidance, see [files/SECURITY.md](./files/SECURITY.md).

## 🤖 AI Journal Workflow

```text
Rough note + weather context
             │
             ├── Enhance note in a selected writing style
             └── Suggest editable title and mood tags
                              │
                              ▼
                    User reviews and accepts
                              │
                              ▼
                       Save Sky Moment
                              │
             Up to 20 moment excerpts per month
                              │
                              ▼
                  On-demand Monthly Sky Recap
```

The AI routes use Groq’s server-side API. Output is validated before reaching the interface, retries are bounded, and monthly recap responses are cached against a deterministic journal version so unchanged journal data returns the same recap without another model call.

## 🧰 Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Application** | Next.js 16, React 19, App Router | Full-stack rendering, routing, and API handlers |
| **Language** | TypeScript 5 | Shared type safety across UI and server modules |
| **Styling** | Tailwind CSS 3 | Responsive atmospheric interface |
| **Validation** | Zod 4 | Request and model-output validation |
| **Database** | PostgreSQL / Neon | Durable application data |
| **ORM** | Drizzle ORM | Typed schema and database access |
| **Authentication** | Custom password sessions + email OTP | Account access and verification |
| **Email** | Resend | Verification code delivery |
| **Weather** | OpenWeather | Live city weather and forecast context |
| **Historical Weather** | Open-Meteo | Backdated Sky Moment weather |
| **Object Storage** | Google Cloud Storage | Private sky-photo objects |
| **Cache / Limits** | Upstash Redis + Ratelimit | OTP state, caches, and abuse controls |
| **AI** | Groq | Journal enhancement, insights, and monthly recap |
| **Observability** | Sentry (optional) | Server/client error reporting |
| **Testing** | Playwright | Browser smoke and end-to-end checks |
| **Deployment** | Vercel | Next.js production hosting |

## 🚀 Local Setup

### Prerequisites

| Requirement | Notes |
| :--- | :--- |
| **Node.js** | Node.js 20 or newer is recommended for Next.js 16 |
| **npm** | Installed with Node.js |
| **PostgreSQL** | Local Docker instance or managed Neon database |
| **Git** | For cloning the repository |
| **External services** | Needed only for the matching weather, storage, Redis, AI, email, and observability features |

### 1. Clone and install

```bash
git clone <your-fork-or-repository-url>
cd IconicSkies_cskills
npm install
```

### 2. Create the local environment file

```bash
cp .env.example .env.local
```

Fill in only the services you intend to exercise. Never commit `.env.local`.

### 3. Start PostgreSQL

For a local Docker database:

```bash
docker run --name iconicskies-postgres \
  -e POSTGRES_DB=iconicskies \
  -e POSTGRES_USER=iconicskies \
  -e POSTGRES_PASSWORD=iconicskies \
  -p 5432:5432 \
  -d postgres:18
```

Use this local URL in `.env.local`:

```env
DATABASE_URL=postgres://iconicskies:iconicskies@localhost:5432/iconicskies
```

### 4. Apply migrations and seed development data

```bash
npm run db:migrate
npm run db:seed
```

### 5. Start development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

To run browser tests for the first time:

```bash
npm run test:e2e:install
```

## ⚙️ Environment Variables

Copy `.env.example` to `.env.local`. The examples below show variable names and intent only—never place real credentials in documentation or commits.

### Core Application

| Variable | Required | Purpose |
| :--- | :---: | :--- |
| `NEXT_PUBLIC_APP_URL` | Yes | Canonical application origin |
| `AUTH_SECRET` | Yes | Session/auth cryptographic secret |

### Database

| Variable | Required | Purpose |
| :--- | :---: | :--- |
| `DATABASE_URL` | Yes | PostgreSQL connection string |

### Weather

| Variable | Required | Purpose |
| :--- | :---: | :--- |
| `OPENWEATHER_API_KEY` | Production | Live weather and location lookup |

Open-Meteo historical requests do not require an API key.

### Private Storage

| Variable | Required | Purpose |
| :--- | :---: | :--- |
| `GCS_PROJECT_ID` | For uploads | Google Cloud project identifier |
| `GCS_BUCKET_NAME` | For uploads | Private photo bucket name |
| `GCS_CLIENT_EMAIL` | For uploads | Service account identity |
| `GCS_PRIVATE_KEY` | For uploads | Service account private key |

### Redis and Rate Limiting

| Variable | Required | Purpose |
| :--- | :---: | :--- |
| `UPSTASH_REDIS_REST_URL` | Recommended | Upstash REST endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | Recommended | Upstash REST token |

Redis is required for deployed OTP challenges and recommended for weather/recap caching and AI throttling. Cache behavior otherwise degrades gracefully.

### AI

| Variable | Required | Default | Purpose |
| :--- | :---: | :--- | :--- |
| `GROQ_API_KEY` | For AI tools | — | Server-side Groq credential |
| `GROQ_MODEL` | No | `llama-3.3-70b-versatile` | Primary journal model |
| `GROQ_FALLBACK_MODEL` | No | `qwen/qwen3-32b` | Optional fallback model |

### Email and OTP

| Variable | Required | Default | Purpose |
| :--- | :---: | :--- | :--- |
| `RESEND_API_KEY` | Production | — | Resend delivery credential |
| `EMAIL_FROM` | Production | — | Verified sender address |
| `OTP_SECRET` | Recommended | `AUTH_SECRET` fallback | HMAC secret for OTP digests |
| `OTP_TTL_SECONDS` | No | `240` | Challenge lifetime |
| `OTP_RESEND_COOLDOWN_SECONDS` | No | `60` | Delay before resend |
| `OTP_MAX_VERIFY_ATTEMPTS` | No | `5` | Maximum attempts per challenge |
| `OTP_DEV_LOG_CODES` | No | `false` | Development-only code logging switch |

`OTP_DEV_LOG_CODES` must remain `false` in production.

### Email Authenticity

| Variable | Required | Default | Purpose |
| :--- | :---: | :--- | :--- |
| `EMAIL_VALIDATION_PROVIDER` | No | `disabled` | `disabled`, `abstract`, `zerobounce`, or development `mock` |
| `EMAIL_VALIDATION_API_KEY` | Provider only | — | External validation credential |
| `EMAIL_VALIDATION_STRICT` | No | `false` | Block registration when the optional provider fails |

Local syntax, domain denylist, disposable-domain, and MX checks run independently of the optional provider.

### Optional Observability

| Variable | Required | Purpose |
| :--- | :---: | :--- |
| `SENTRY_DSN` | No | Server-side Sentry reporting |
| `NEXT_PUBLIC_SENTRY_DSN` | No | Browser-safe Sentry DSN |

## 🧪 Common Commands

| Command | Purpose |
| :--- | :--- |
| `npm run dev` | Start the development server |
| `npm run build` | Create an optimized production build |
| `npm run start` | Run the production build |
| `npm run lint` | Run ESLint across app, components, libraries, scripts, and tests |
| `npm run typecheck` | Run TypeScript without emitting files |
| `npm run test` | Run the Playwright end-to-end suite |
| `npm run test:e2e` | Run the Playwright end-to-end suite directly |
| `npm run test:e2e:install` | Install the project-local Chromium browser |
| `npm run db:migrate` | Apply SQL migrations |
| `npm run db:seed` | Seed development data |
| `npm run db:studio` | Open Drizzle Studio |
| `npm run db:generate` | Generate Drizzle migration artifacts |

## 🧭 API Surface

The application primarily consumes these endpoints through its own UI. Protected routes require an authenticated, verified user unless noted otherwise.

| Area | Method and Route | Purpose |
| :--- | :--- | :--- |
| Auth | `POST /api/auth/register` | Validate email authenticity and create an account |
| Auth | `POST /api/auth/login` | Password login and optional OTP challenge |
| Auth | `POST /api/auth/logout` | End the current session |
| OTP | `POST /api/auth/otp/request` | Request a verification/login email code |
| OTP | `POST /api/auth/otp/verify` | Verify and consume an OTP challenge |
| Weather | `GET /api/weather` | Public city weather lookup |
| Weather | `POST /api/weather/preview` | Coordinate/current-location preview |
| Moments | `POST /api/sky-moments` | Save a current or backdated Sky Moment |
| Moments | `PATCH /api/sky-moments/[id]` | Update supported moment metadata |
| Favorites | `GET, POST /api/favorites` | List or create saved places |
| Favorites | `PATCH, DELETE /api/favorites/[id]` | Edit or remove a favorite |
| Favorites | `GET /api/favorites/[id]/weather` | Fetch a favorite’s weather preview |
| Uploads | `POST /api/uploads/sign` | Authorize a private upload |
| Uploads | `POST /api/uploads/complete` | Confirm uploaded photo metadata |
| Photos | `GET /api/photos/[id]` | Stream an owned private photo |
| AI | `POST /api/ai/journal-enhance` | Polish a journal note |
| AI | `POST /api/ai/journal-insights` | Suggest title and mood tags |
| AI | `POST /api/ai/monthly-recap` | Generate or read a cached monthly recap |

## ✅ Testing Guide

Run the automated checks:

```bash
npm run typecheck
npm run lint
npm run build
npm run test:e2e
```

For a release-oriented manual pass, verify:

1. Search a city and open its weather page.
2. Register with a real inbox and complete one-time email verification.
3. Confirm an unverified account cannot enter protected app surfaces.
4. Log in as a verified user with `otp_required=false` and confirm no login OTP is requested.
5. Set `otp_required=true` in controlled test data and confirm the email OTP login step.
6. Save a current Sky Moment with and without a photo.
7. Save a backdated moment within 14 days using a different captured city.
8. Confirm future and older-than-14-day timestamps are rejected.
9. Switch a saved moment independently between Mood and Photo views.
10. Upload and view a photo only through the authenticated media route.
11. Enhance a note, accept title/tag suggestions, and generate a monthly recap.
12. Re-run the same monthly recap and confirm cached content is stable.
13. Check the landing page and dashboard at narrow mobile and desktop widths.

The Playwright web server expects to manage its own development process. Stop an existing `next dev` process before running `npm run test:e2e` if the configured port is already occupied.

## ☁️ Deployment Notes

IconicSkies is designed for Vercel:

1. Create or connect a Neon PostgreSQL database.
2. Configure all production environment variables in Vercel.
3. Run `npm run db:migrate` against the production database as a controlled deployment step.
4. Create an Upstash Redis database for OTP, caching, and rate limiting.
5. Configure OpenWeather and Groq server credentials.
6. Verify a Resend sender/domain and set `EMAIL_FROM`.
7. Keep the GCS bucket private, enable public access prevention, and configure its service account.
8. Set:

```env
NEXT_PUBLIC_APP_URL=https://iconicskies.deadlys.tech
```

9. Deploy and run the authentication, upload, weather, AI, and mobile visual checks from the testing guide.

Do not commit `.env.local`, service account JSON, raw private keys, or exported production data.

## ⚖️ Design Decisions and Trade-offs

| Decision | Rationale |
| :--- | :--- |
| **One Next.js full-stack application** | Keeps rendering, validation, auth, and route handlers in one TypeScript codebase without operating a separate backend service. |
| **PostgreSQL is the source of truth** | Users, sessions, favorites, photo metadata, weather snapshots, and journal entries need durable relational storage. |
| **Redis is temporary infrastructure** | OTP challenges, cache entries, and rate limits benefit from TTLs and should not replace durable records. |
| **Private GCS bucket** | User photos stay outside the public web and are served only after application-level authorization. |
| **OTP is final inbox proof** | Domain checks reduce obvious waste; only a successful OTP proves that the user can access the inbox. |
| **External email validation is disabled by default** | Registration can rely on local checks plus OTP without making a paid validation provider mandatory. |
| **Groq for journal assistance** | Low-latency text generation fits user-triggered note, insight, and recap workflows. |
| **Open-Meteo for historical fallback** | Backdated moments get real timestamp/location weather without silently reusing current conditions. |
| **Per-moment visual preference stays client-side** | Mood/Photo presentation can change without a schema migration or mutation of journal data. |

## 🗺️ Roadmap

- Better weather alerts when suitable official API access is available
- Richer journal search, filters, and date navigation
- Export or selectively share user-approved moments
- Optional production use of an external email validation provider
- Broader and more deterministic end-to-end coverage
- Deeper monthly recap insights and journal patterns
- More refined gallery organization and photo management

Roadmap items are directions, not currently implemented features.

## 🖼️ Project Visuals

The README currently uses real assets already committed to the project:

- `public/assets/icon.png` — the IconicSkies mark
- `public/backgrounds/landing/landing-poster.webp` — the atmospheric landing artwork

For a stronger public portfolio presentation, add real, privacy-safe screenshots to `public/readme/` and reference them here. The most useful set would be:

1. `landing-desktop.webp` — landing hero and latest Sky Moment card
2. `city-weather.webp` — atmospheric city weather page
3. `dashboard-journal.webp` — Current Sky, favorites, and journal timeline
4. `sky-moment-mobile.webp` — mobile Mood/Photo visual switching
5. `account-security.webp` — email verification and sign-in protection status


Use anonymized demo accounts and avoid showing real emails, precise current-location data, private photo subjects, or cloud object identifiers.

## 📄 License and Author

IconicSkies is available under the [MIT License](./LICENSE).

Built by **DeadlySatwik** as a production-aware full-stack portfolio project.

<div align="center">

**Look up. Save the moment. Return to the sky.**

[Live Demo](https://iconicskies.deadlys.tech) · [Security](./files/SECURITY.md) · [Product Notes](./files/PRODUCT.md)

</div>
