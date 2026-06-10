# Security

## Security Model

IconicSkies treats browser input as untrusted. Secrets remain server-side, and protected user data is scoped by the authenticated user session.

## Decisions

- OpenWeather API keys are read only on the server.
- GCS service account values are read only on the server.
- Auth uses credentials with password hashing and HttpOnly SameSite cookies.
- Session tokens are stored hashed in PostgreSQL.
- Upload endpoints validate file type, size, ownership, and configuration state.
- Direct GCS uploads use server-generated signed URLs. The browser receives no GCS service account credentials.
- Private GCS photo display goes through `/api/photos/[id]`, which checks the signed-in user owns the photo before downloading it server-side.
- Missing external credentials trigger safe mock/demo behavior, not secret prompts.

## Threat Areas

- Credential stuffing and weak passwords.
- CSRF on cookie-authenticated state changes.
- XSS through journal notes or weather text.
- Upload abuse through unsafe content type, oversized files, or object path manipulation.
- SSRF-like abuse through server-side weather fetches if city input is not constrained.
- Data leakage through unscoped dashboard queries.

## Controls To Implement

- Runtime input validation with clear error responses.
- Parameterized database access through Drizzle.
- Ownership checks on all protected resources.
- Security headers in Next.js config or middleware.
- Rate-limit-ready structure for weather and auth endpoints.
- Non-sensitive error messages in production.

## Upload Controls

- Accepted image types: JPG/JPEG, PNG, WebP, and GIF.
- Maximum upload size: 8 MB, validated in the client and server.
- Signed upload object paths are generated server-side under `sky-photos/<userId>/`.
- Upload completion rejects non-mock object paths outside the signed-in user's prefix.
- Sky moment creation verifies that an uploaded photo belongs to the signed-in user and matches the city/weather snapshot before attaching it.
- Real uploaded photos are streamed through an authenticated server route; the GCS bucket does not need to be public.

## GCS Permissions

The GCS bucket remains private and public access prevention remains enforced. Do not grant public bucket or object access.

The service account used by the server needs only these bucket-level roles:

- `roles/storage.objectCreator` for signed browser uploads.
- `roles/storage.objectViewer` for private server-side photo display.

The browser must never receive service account credentials. Keep `GCS_PROJECT_ID`, `GCS_CLIENT_EMAIL`, and `GCS_PRIVATE_KEY` server-side only.

Bucket CORS must allow direct signed uploads:

- Include the local development origin, such as `http://localhost:3000`.
- Include the production deployed app domain.
- Allow `PUT` and the `Content-Type` header.
- Do not make the bucket public as a shortcut for display or CORS issues.

## Remaining Manual Setup

- Rotate the old exposed OpenWeather key if it was ever valid.
- Provide production secrets through Vercel or a secret manager.
- Configure Cloud SQL, GCS bucket IAM, private bucket CORS, and Sentry DSN for production.

## Verification Notes

- Legacy static files were sanitized so the old hardcoded OpenWeather key is no longer present.
- Lint, typecheck, build, migrations, seed, and Playwright smoke tests were run locally.
- npm reported moderate transitive audit findings after install. A forced audit fix was not run because it can introduce breaking dependency upgrades; this remains a follow-up task.
