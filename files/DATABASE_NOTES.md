# Database Notes

## PostgreSQL 18

Local development uses Docker Compose with `postgres:18`, which was verified as available in the environment during planning.

The schema intentionally uses PostgreSQL 18 features through raw SQL migrations where ORM support may lag:

- `uuidv7()` defaults for primary keys, giving sortable UUIDs without exposing sequential IDs.
- Generated columns for normalized city lookup and derived weather comfort metadata.
- SQL comments documenting version-specific choices.
- Multicolumn indexes for common query paths.

## Query Paths

- City lookup by normalized country, region, and name.
- Weather snapshot cache by city, unit, source, and freshness.
- Search history by user and searched time.
- Sky Journal timeline by user and captured time.
- Favorite city lookup by user and city.

## Local Commands

The implementation should provide npm scripts for:

- `db:migrate`
- `db:seed`
- `db:studio`

Database verification can run through Docker because `psql` is not installed locally.

In this environment the Docker Compose plugin was not available, so verification used an equivalent raw Docker command:

```bash
docker run --name iconicskies-postgres \
  -e POSTGRES_DB=iconicskies \
  -e POSTGRES_USER=iconicskies \
  -e POSTGRES_PASSWORD=iconicskies \
  -p 5432:5432 \
  -d postgres:18
```

Verified commands:

- `npm run db:migrate`
- `npm run db:seed`
