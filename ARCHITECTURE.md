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
- `/api/sky-moments`: create and list user moments.
- `/api/uploads/sign`, `/api/uploads/complete`: upload handshake.

## Local Development

Local PostgreSQL runs through Docker Compose with `postgres:18`. The app supports mock weather and mock upload when external credentials are missing.

## Deployment

The intended deployment target is Vercel for the Next.js app, Cloud SQL PostgreSQL 18 for production data, and Google Cloud Storage for sky photos. No separate Render backend is needed for the vertical slice.
