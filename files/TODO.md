# TODO

## Current Priority

- [x] Phase 1: Create planning docs and continuity files.
- [x] Phase 2: Scaffold Next.js app and tooling.
- [x] Phase 3: Add PostgreSQL 18 schema, migrations, and seed.
- [x] Phase 4: Implement server-side weather service with mock mode.
- [x] Phase 5: Build homepage and city weather page.
- [x] Phase 6: Build register/login and protected routes.
- [x] Phase 7: Build save sky moment and dashboard timeline.
- [x] Phase 8: Add mock/GCS-ready upload architecture.
- [x] Phase 9: Add smoke tests and run quality gates.
- [x] Phase 10: Final docs, security notes, and polish.
- [x] Atmospheric backgrounds: add curated landing/city backgrounds, mood resolution, and smoke coverage.

## Remaining Hardening

- [ ] Add production-grade rate limiting for auth and weather endpoints.
- [ ] Add CSRF tokens if the auth model expands beyond SameSite cookie protection.
- [x] Add a real GCS photo display strategy for private objects.
- [ ] Add unit tests around auth, weather normalization, and upload validation.
- [ ] Add dependency-audit follow-up for npm moderate transitive findings.
- [ ] Add focused unit tests for weather background mood resolution edge cases.
- [x] Redis caching foundation for monthly recap and weather previews.
- [x] AI rate limiting via optional Redis-backed helpers.
- [x] Favorite locations.
- [x] AI Journal Enhancement.
- [x] Progressive disclosure for dashboard and save-form optional panels.
- [x] OTP validation foundation for password-first login/register, Redis-only challenges, and additive email verification.

## Secondary If Time Allows

- [ ] Recent searches view.
- [ ] Gallery page.
- [ ] Settings page.
- [ ] Compare page.
- [ ] Admin view.
- [ ] Optional SMS provider implementation if phone OTP is ever promoted beyond the current stub.

## Future Journal Ideas

- [x] AI title generation for saved sky moments.
- [x] Monthly recap drafts for the Sky Journal timeline.
- [x] Month-grouped Sky Journal archive with collapsible months.
- [ ] Rewrite an older saved note from the dashboard edit flow, only if the UX stays compact and user-approved.
