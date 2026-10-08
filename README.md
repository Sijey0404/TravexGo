# Travexgo

Web-based tour package, booking, customer, and payment management for Travexgo San Carlos City, Pangasinan.

## Requirements

- PHP 8.2 or newer with the `pdo_pgsql`, `mbstring`, `openssl`, `fileinfo`, and `curl` extensions
- Composer 2
- A Supabase project with PostgreSQL and Storage enabled

This project uses Supabase PostgreSQL through Laravel's `pgsql` driver. MySQL and SQLite are not supported.

## Setup

1. Install PHP 8.2+, Composer 2, and the `pdo_pgsql`, `mbstring`, `openssl`, `fileinfo`, and `curl` PHP extensions.
2. Install dependencies with `composer install`.
3. Copy `.env.example` to `.env` and set the Supabase connection values. Use the project pooler host/port/user/password from Supabase, or supply `SUPABASE_DATABASE_URL`. Keep `DB_CONNECTION=pgsql` and `DB_SSLMODE=require`. Direct connections normally use port 5432; the transaction pooler normally uses port 6543.
4. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` server-side. The service-role key bypasses Storage RLS; it must never appear in browser code, logs, or a committed file. Keep `.env` private.
5. Generate the application key with `php artisan key:generate`.
6. Create the four Storage buckets listed below, then run `php artisan migrate --seed`.
7. Start locally using `php artisan serve` and open the URL printed by Artisan.

## Supabase Storage

Create buckets named `tour-packages`, `destinations`, `profile-images`, and `payment-proofs` in Supabase Storage, matching the `.env` values. Make the first three public only if package/destination/profile images should be visible to visitors. Keep `payment-proofs` private. Laravel uploads and reads files through the server-side Storage API; the payment-proof controller authorizes staff before proxying private file contents. The database stores object paths, not uploaded file bytes.

## Optional Node/Edge API

`@supabase/server` is a JavaScript package for Node.js, Deno, Bun, and Supabase Edge Functions; it does not run inside this Laravel/PHP backend. It has not been added as an unused dependency. If a separate Node/Edge API is introduced, configure `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, and `SUPABASE_JWKS_URL` in that service's private environment. Supabase Edge Functions inject their supported variables automatically. The supplied secret value was redacted, so it must be entered directly into the target secret store by an authorized operator. Do not treat `SUPABASE_SECRET_KEY` as Laravel's `SUPABASE_SERVICE_ROLE_KEY`; Laravel's current Storage client expects the service-role JWT credential. The `npx skills add supabase/server` command is optional tooling for an AI coding agent, not an application dependency.

## Demo accounts

Seeder-created accounts use fictional data. Change all demo passwords before deployment.

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@travexgo.test` | `AdminPass123!` |
| Staff | `staff@travexgo.test` | `StaffPass123!` |
| Customer | `customer1@travexgo.test` | `CustomerPass123!` |
| Customer | `customer2@travexgo.test` | `CustomerPass123!` |

## Tests

Set valid Supabase PostgreSQL credentials in `.env`, then run `php artisan test`. Feature tests use the configured PostgreSQL database and never fall back to SQLite. Tests that refresh the schema are destructive to the configured test database; use a dedicated Supabase project/database for testing.

## Production deployment

- Provision PHP 8.2+, Composer, PostgreSQL network access, and the required PHP extensions.
- Set production `.env` values, `APP_ENV=production`, `APP_DEBUG=false`, a unique `APP_KEY`, Supabase DB credentials, and server-only Storage credentials.
- Set the web server document root to `public/`; enable HTTPS and secure cookies.
- Run `composer install --no-dev --optimize-autoloader`, `php artisan migrate --force`, `php artisan config:cache`, `php artisan route:cache`, and `php artisan view:cache` during release.
- Configure automated database backups and rotate Supabase credentials. Restrict dashboard/service-role credentials to the application server.
- Configure a real mail transport before enabling email-dependent features. This system does not charge cards or execute monetary refunds; payment verification and refund statuses are operational records.

## GitHub and Vercel

### Publish to GitHub

The working folder must be a Git repository before it can be imported. From PowerShell in this project directory:

```powershell
git init
git add .
git status --short
git check-ignore .env
git commit -m "Initial Travexgo capstone system"
git branch -M main
git remote add origin https://github.com/YOUR_ACCOUNT/YOUR_REPOSITORY.git
git push -u origin main
```

Create an empty GitHub repository first and replace the remote URL. Before committing, confirm `.env` is ignored and no credentials appear in staged changes. `.env.example` is intentionally tracked with blank secrets. Keep the GitHub repository private if the source is not intended to be public.

### Vercel compatibility

Vercel's official function runtimes do not include PHP. PHP is available only through a community runtime (`vercel-php`), so importing this Laravel repository and pressing Deploy is not sufficient. A Vercel deployment needs a tested PHP entry point/runtime configuration, Composer dependency installation, static asset routing, and Laravel writable-path configuration. Vercel functions have an ephemeral, read-only application filesystem apart from `/tmp`; this app currently compiles Blade views and uses file cache paths under `storage/`, so it needs a Vercel-specific adjustment before it can run reliably. Do not treat an untested community-runtime deployment as production-ready.

For the recommended deployment, host this Laravel app on a PHP-capable service (for example, a VM/container or a managed Laravel/PHP host) and use Vercel only if you later build a separate frontend/API specifically for it. If proceeding with the community PHP runtime, first follow its current setup instructions and test login, sessions, file uploads, view compilation, migrations, and all routes on preview deployments.

### Supabase database settings

In the Vercel project's **Settings → Environment Variables**, or in the PHP host's secret manager, add the database variables from `.env.example`. Copy the exact connection details from the Supabase Dashboard's **Connect** panel; do not guess the pooler hostname or username. For serverless connections use the Supabase shared transaction pooler (usually port `6543`), with `DB_CONNECTION=pgsql`, `DB_SSLMODE=require`, `DB_DATABASE=postgres`, the pooler username, and the database password. For a persistent PHP server, use Supabase's direct connection when IPv6 is available, or the session pooler on port `5432` when using IPv4-only hosting. Avoid putting the connection string in Git or frontend code.

Set `APP_KEY` to a generated Laravel key, `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL` to the deployed HTTPS URL, and `SUPABASE_URL` plus the server-only Storage credential. Run `php artisan migrate --force` once from a trusted deployment job or local environment configured for the production database; do not run migrations on every serverless request. Run `php artisan db:seed --force` only if you intentionally want the fictional demo accounts and sample records in that database, and change demo passwords immediately.

## Scope notes

Payments are submitted for staff verification; no real payment gateway or automatic refund is connected. Public imagery uses external image URLs until staff uploads package/destination images. Review authentication, retention, privacy, and operational policies with the organization before deployment.