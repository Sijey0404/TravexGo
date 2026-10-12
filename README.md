# TravexGo

Responsive trip catalog and tour operations application for TravexGo, San Carlos City, Pangasinan. The frontend uses React, TypeScript, Vite, Tailwind CSS, Supabase Auth/PostgreSQL/Storage, React Query, React Hook Form, Zod, Recharts, and Lucide.

## Current implementation

- Public home, package search/catalog, package detail, contact, and about pages.
- Supabase email/password registration, email verification, sign-in, and password recovery.
- Customer bookings, trip traveler data, balance history, payment evidence uploads, and self-service cancellation requests.
- Staff/admin operations for bookings, manual payment verification, package publishing/archiving, schedules, customer export, reports, refund ledger entries, and in-app notifications.
- PostgreSQL migration with RLS, audit/status history, booking capacity locking, payment reconciliation, rate-limited contact submission, and private receipt storage.
- Payments are manual records. Uploading a receipt does not verify funds; refunds are audit records only and do not transfer money.

Email sending, card processing, automated reminders, and production contact details are not configured. No mock catalog or dashboard metrics are bundled.

## Local setup

Prerequisites: Node.js 20.19+ or 22.12+, npm, and a Supabase project.

1. Install packages with `npm install`.
2. Copy `.env.example` to `.env.local` and set:

   ```env
   VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
   ```

   The browser uses only the publishable/anon key. Never use a service-role or secret key in a `VITE_` variable.

3. Apply `supabase/migrations/202610120001_travexgo_core.sql` in the Supabase SQL editor or with the Supabase CLI (`supabase db push`). The migration creates the `package-images` public bucket and private `payment-receipts` bucket.
4. Ensure Supabase Auth email confirmation is enabled and set the local Site URL and redirect URL to `http://localhost:5173/**` (include the deployed Vercel origin for production). In **Authentication > Email Templates > Confirm signup**, include `{{ .Token }}` in the message so users receive a code they can enter in the app.
5. Create the first admin by signing up the intended account, then use `supabase/admin-setup.sql` with that account's Auth UUID. Restrict SQL editor access; do not add an administrator password to this repository.
6. Start with `npm run dev`.

The migration is not automatically applied to a remote database by this repository. Contact submissions are rate-limited per email (3/hour); add CAPTCHA/edge-based IP throttling before exposing the form to heavy anonymous traffic.

## Database and security

- RLS derives roles from `public.profiles`, never editable Auth user metadata.
- Booking creation is a `SECURITY DEFINER` transaction. It locks the departure schedule, validates package bounds/deadlines and remaining capacity, snapshots price, inserts travelers, and generates a random reference.
- Customers may select only their own booking/payment/profile/notification records. Public package/departure access is restricted to published/open records; a small RPC returns remaining seats without exposing bookings.
- Payment submission checks booking ownership, amount, method, and an uploaded receipt path. Staff separately verify/reject via an RPC. Booking confirmation remains separate.
- Private receipts are served through short-lived signed URLs after RLS authorization. Refund entries require an administrator and only represent manually recorded operations.
- Ordinary authenticated users cannot set their own role or account status. Promote the first administrator only using the secure SQL procedure above.
- Configure custom SMTP before relying on account verification or password reset emails for public users. Supabase's default SMTP is limited to project team addresses and currently 2 messages per hour. In-app notifications are stored and shown in the app; database realtime is enabled per project as needed, with polling fallback.

## Vercel deployment

1. Push the repository to GitHub and import it in Vercel.
2. Set the production `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel project environment variables.
3. Use the default Vite build command `npm run build` and output directory `dist`.
4. `vercel.json` rewrites application paths to `index.html` for client-side routing.
5. Apply the migration to the production Supabase project, configure Auth Site URL/redirect URLs and SMTP, and create the first administrator securely.
6. Deploy and verify registration, package visibility, seat selection, booking limits, private receipt access, and unauthorized RLS denial using separate customer and staff accounts.

Do not use a Supabase service-role key in Vercel's browser environment variables. No always-running server is required.

## Verification

- `npm run build` runs strict TypeScript checking and a production Vite build.
- `npm test` runs the Vitest suite.
- Supabase policies, storage rules, SQL RPCs, and concurrent seat allocation should additionally be exercised against a dedicated Supabase development project; there is no connected database or service credential in this workspace.