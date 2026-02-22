# Imitation

A Next.js application featuring a Twitter clone, flashcard system, games, and more. Deployed to Fly.io with Supabase for auth and PostgreSQL for data.

**Contributors:** Mubassera Subah, Ethan Hicks, Thalia Matos

## Getting Started

```bash
npm install
npm run dev
```

## Database Migrations

Database updates are deployed to Supabase using a migration pipeline. Migrations are non-destructive — they never drop tables or erase existing data.

Migration files live in `db/migrations/` and are numbered sequentially (e.g. `001_initial_schema.sql`, `002_add_column.sql`). The pipeline tracks which migrations have already been applied in a `_migrations` table so each migration only runs once.

### Deploy DB updates to Supabase

```bash
DATABASE_URL="postgresql://postgres:<password>@db.dbmxbfeuxflznukpuvnf.supabase.co:5432/postgres" npm run db:migrate
```

Replace `<password>` with your Supabase database password. You can also set `DATABASE_URL` as an environment variable instead of inlining it.

### Adding a new migration

1. Create a new SQL file in `db/migrations/` with the next number prefix:
   ```
   db/migrations/002_add_some_column.sql
   ```
2. Write non-destructive SQL (`CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, etc.)
3. Run `npm run db:migrate`

### Running against local Postgres

Without setting `DATABASE_URL`, the pipeline defaults to `postgresql://postgres:postgres@localhost:5432/imitation`.

```bash
npm run db:migrate
```

## Browser Extension

A Mozilla (Firefox) browser extension lives in `extension/`. It is kept in this repo so AI agents and contributors have full context across the entire project.

### Structure

```
extension/
├── manifest.json          # Firefox manifest v2
├── background.js          # Background script
├── content.js             # Content script (injected into pages)
├── popup/
│   ├── popup.html         # Popup UI
│   ├── popup.css          # Popup styles
│   └── popup.js           # Popup logic
└── icons/                 # Extension icons (48x48, 96x96)
```

### Loading in Firefox

1. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on**
3. Select the `extension/manifest.json` file

## Testing

```bash
npm test              # Unit tests (vitest)
npm run test:mock     # Tests with mocked backend
npm run test:local    # Integration tests against local DB
npm run test:remote   # Tests against remote Supabase
npm run test:e2e      # End-to-end tests (Playwright)
```

## Deployment

Pushing to `main` triggers a GitHub Actions workflow that deploys to Fly.io.

```bash
fly deploy --remote-only
```
