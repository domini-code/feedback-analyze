## 1. Supabase project & environment

- [ ] 1.1 Create a new Supabase project via the dashboard (region close to users).
- [ ] 1.2 Configure the Google OAuth provider in Supabase (client ID/secret from Google Cloud Console) and whitelist the local + production redirect URIs.
- [ ] 1.3 Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` to `.env.local` and document them in `.env.example`.
- [ ] 1.4 Install `@supabase/supabase-js` and `@supabase/ssr` with `pnpm add`.

## 2. Database schema & policies

- [ ] 2.1 Create `supabase/migrations/<timestamp>_init_analyses.sql` with the `public.analyses` table as specified in `design.md` decision 4 (`id`, `user_id`, `input_text`, `items jsonb`, `summary jsonb`, `created_at`).
- [ ] 2.2 Add the `(user_id, created_at desc)` composite index in the same migration.
- [ ] 2.3 Enable RLS on `public.analyses` and create `analyses_select_own` and `analyses_insert_own` policies (no update/delete policies).
- [ ] 2.4 Apply the migration to the Supabase project and verify with the CLI that the table, index, and policies exist.
- [ ] 2.5 Manual verification: sign in as two test users via the dashboard, insert a row for each, and confirm user A's `select` returns only A's row and user A's `insert` with `user_id = B` is rejected.

## 3. Supabase clients & middleware

- [ ] 3.1 Add `lib/supabase/server.ts` exporting `createClient()` that wires `@supabase/ssr` with `next/headers` cookies.
- [ ] 3.2 Add `lib/supabase/client.ts` exporting the browser client via `createBrowserClient`.
- [ ] 3.3 Add `lib/supabase/middleware.ts` with a `updateSession(request)` helper that refreshes the session cookie.
- [ ] 3.4 Add root `middleware.ts` that calls `updateSession` and redirects: anonymous users hitting protected routes (`/`, `/history`, `/history/:id`, `/api/analyze-feedback`) go to `/sign-in?redirectTo=...`; authenticated users hitting `/sign-in` or `/sign-up` go to `/`.
- [ ] 3.5 Configure the middleware `matcher` to exclude `_next/static`, `_next/image`, `favicon.ico`, and public assets.

## 4. Auth UI

- [ ] 4.1 Create `app/(auth)/layout.tsx` with a centered card layout and no app chrome.
- [ ] 4.2 Build `app/(auth)/sign-up/page.tsx` with an email/password form (client-side validation: 8+ chars) and a "Continue with Google" button that calls `supabase.auth.signInWithOAuth({ provider: 'google' })`.
- [ ] 4.3 Build `app/(auth)/sign-in/page.tsx` with the same layout as sign-up but no password-strength validation; show a generic error for bad credentials.
- [ ] 4.4 Create `app/auth/callback/route.ts` that reads `code` from the URL, calls `supabase.auth.exchangeCodeForSession`, and redirects to the original `redirectTo` (or `/` if none). On failure redirect to `/sign-in?error=oauth_exchange_failed` and log the Supabase error.
- [ ] 4.5 Add a sign-out Server Action and wire it into a user menu in the app header; on success redirect to `/sign-in`.

## 5. Protected analyzer route

- [ ] 5.1 Update `app/api/analyze-feedback/route.ts` to call `supabase.auth.getUser()` first; if no user, return HTTP 401 `{ "error": "unauthorized" }` without invoking Claude.
- [ ] 5.2 After a successful classification, insert a row into `public.analyses` with `user_id`, `input_text`, `items`, `summary`.
- [ ] 5.3 On insert failure, log the error server-side and still return the classification with HTTP 200 (persist-then-respond, don't 500).
- [ ] 5.4 Update the analyzer page to show the signed-in user's email/avatar in the header (read from `getUser()` in the Server Component).

## 6. History views

- [ ] 6.1 Create `app/history/page.tsx` — Server Component that queries `analyses` ordered by `created_at desc` for the current user and renders a list with date + `summary.total` + `summary.overall_sentiment`.
- [ ] 6.2 Render an empty state with a CTA to `/` when the user has no analyses yet.
- [ ] 6.3 Create `app/history/[id]/page.tsx` — Server Component that fetches a single analysis by id (RLS does the scoping automatically). If the query returns zero rows, call `notFound()`.
- [ ] 6.4 Reuse the existing feedback-cards components to render `items` and `summary` in the detail view.
- [ ] 6.5 Add a "History" link in the app header visible only to authenticated users.

## 7. Verification

- [ ] 7.1 `pnpm lint` passes.
- [ ] 7.2 `pnpm build` passes.
- [ ] 7.3 Manual smoke test — sign up with email, run an analysis, confirm a row in Supabase, reload `/history`, open the analysis detail.
- [ ] 7.4 Manual smoke test — sign in with Google, run an analysis, confirm the row is keyed to the Google account's `user_id`.
- [ ] 7.5 Manual smoke test — open `/api/analyze-feedback` from a tool without a session cookie, confirm HTTP 401 and no Claude call was made (check server logs).
- [ ] 7.6 Manual smoke test — with user A signed in, try to visit `/history/<id-of-user-B>` and confirm 404.
