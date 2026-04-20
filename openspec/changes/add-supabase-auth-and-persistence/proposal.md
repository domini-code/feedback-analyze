## Why

The Feedback Analyzer is currently a single-session tool: anyone can hit `/api/analyze-feedback`, results vanish on reload, and there is no way to attribute activity to a user. To turn it into a production SaaS we need identity and durable storage. This change is the foundation integration (1 of 3) — without user accounts and a persisted history we cannot meter usage for the upcoming Stripe free/Pro tiers, nor trigger the Resend transactional emails that come after it.

## What Changes

- Add Supabase as the auth and database provider for the app.
- Add sign-up, sign-in and sign-out flows backed by Supabase Auth — email + password and Google OAuth.
- Add a protected user area: unauthenticated visitors can see the landing page but not submit feedback; the analyzer UI requires a session.
- Add an `analyses` table keyed by `user_id` that stores every analysis the user runs (input feedback, structured items, summary, timestamps).
- **BREAKING** — `POST /api/analyze-feedback` now requires an authenticated Supabase session. Anonymous requests receive HTTP 401. The response schema is unchanged; on success, the analysis is also persisted for the caller.
- Add a "My analyses" history view that lists the signed-in user's past analyses, newest first, and lets them reopen any one.
- Enforce row-level security so a user can only read/write their own rows.

## Capabilities

### New Capabilities

- `user-auth`: Supabase-backed authentication (email/password + Google OAuth), session management in the Next.js App Router, protected routes, and sign-up/sign-in/sign-out UI.
- `analysis-persistence`: Per-user storage of feedback analyses in Supabase (`analyses` table with RLS), including write on classification and read for the history view.

### Modified Capabilities

- `feedback-classifier`: The `POST /api/analyze-feedback` endpoint changes from public to authenticated. It SHALL reject anonymous callers with HTTP 401 and SHALL persist the resulting analysis under the caller's `user_id` before returning the response.

## Impact

- **Code**: new `lib/supabase/` clients (server, browser, middleware), new `app/(auth)/` route group for sign-in / sign-up / OAuth callback, new `app/history/` route, middleware for session refresh and route protection, changes to `app/api/analyze-feedback/route.ts` to enforce auth and persist the analysis.
- **Database**: new Supabase project with `analyses` table (`id`, `user_id`, `input_text`, `items` jsonb, `summary` jsonb, `created_at`) plus RLS policies. SQL migration checked into `supabase/migrations/`.
- **Dependencies**: `@supabase/supabase-js`, `@supabase/ssr`.
- **Environment**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-only, for migration tooling / webhook handlers landing in later changes). Google OAuth client ID/secret configured inside the Supabase dashboard, not in `.env`.
- **Downstream**: unlocks the upcoming `add-stripe-billing` change (needs `user_id` to attach a subscription) and `add-resend-emails` change (needs an email + signup event to send the welcome mail).
