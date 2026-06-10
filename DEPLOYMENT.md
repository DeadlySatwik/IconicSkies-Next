# Deployment

## Targets

- App: Vercel
- Database: Cloud SQL PostgreSQL 18
- Object storage: Google Cloud Storage
- Monitoring: Sentry

## Local Development

1. Copy `.env.example` to `.env.local`.
2. Leave external credentials blank to use mock mode.
3. Start PostgreSQL with Docker Compose.
4. Run migrations and seed data.
5. Start the Next.js dev server.

If Docker Compose is unavailable, use raw Docker with the same environment variables documented in `README.md`.

## Required Environment Variables

- `DATABASE_URL`
- `OPENWEATHER_API_KEY`
- `NEXT_PUBLIC_APP_URL`
- `AUTH_SECRET`
- `GCS_PROJECT_ID`
- `GCS_BUCKET_NAME`
- `GCS_CLIENT_EMAIL`
- `GCS_PRIVATE_KEY`
- `SENTRY_DSN`
- `NEXT_PUBLIC_SENTRY_DSN`

## Vercel Notes

Set server-only secrets in Vercel project environment variables. Do not prefix secrets with `NEXT_PUBLIC_`. Use Cloud SQL connection guidance for PostgreSQL 18 and ensure the database accepts connections from the deployed runtime.

## GCS Notes

Create a private bucket for sky photos, configure least-privilege service account permissions, and use signed upload URLs. The browser must never receive service account credentials.

The GCS service account needs both of these bucket-level IAM roles:

- `roles/storage.objectCreator` for direct signed uploads.
- `roles/storage.objectViewer` for private server-side photo display through `/api/photos/[id]`.

Keep the bucket private:

- Public access prevention should remain enforced.
- Do not grant `allUsers` or `allAuthenticatedUsers` access.
- Do not make the bucket or objects public.
- Do not expose `GCS_PROJECT_ID`, `GCS_CLIENT_EMAIL`, or `GCS_PRIVATE_KEY` to the browser.

Configure bucket CORS for browser uploads:

- Local development must include the local app origin, for example `http://localhost:3000`.
- Production must include the deployed app domain, for example the Vercel production URL.
- Allow `PUT` requests and the `Content-Type` header for signed uploads.
- Keep CORS origins specific. Do not use `*` for credentialed production app access.

## Production Checklist

- Run `npm run build`.
- Run database migrations against the production database.
- Set all required environment variables.
- Configure Sentry DSN.
- Confirm upload limits and accepted file types.
- Confirm GCS service account has `roles/storage.objectCreator` and `roles/storage.objectViewer`.
- Confirm GCS bucket public access prevention is enforced.
- Confirm GCS CORS includes local and production app origins.
- Verify security headers.
