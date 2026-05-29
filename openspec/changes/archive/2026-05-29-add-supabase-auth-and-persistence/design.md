## Context

The app is a Next.js 16 (App Router) + React 19 + Tailwind v4 project with a single public route handler `POST /api/analyze-feedback` that calls Anthropic's API and returns a structured classification. There is no user model, no persistence, no auth. This change introduces both identity and durable storage at once because they are inseparable: the database needs `user_id` to key rows, and the auth layer only earns its keep once data hangs off it.

The broader plan is three integrations, proposed and applied separately:

1. **This change** — Supabase auth + analyses table.
2. `add-stripe-billing` — free (5/mo) vs Pro (unlimited), webhook updates plan in Supabase.
3. `add-resend-emails` — welcome email on signup, upgrade prompt when free limit is reached.

Each later change depends on artifacts this one creates (`user_id`, `analyses` table, `auth.users`), so the shape of those has to be right here.

Constraint: Next.js App Router uses Server Components by default and auth tokens must survive across server/client/route-handler boundaries. The officially supported path for that on Next 16 is `@supabase/ssr`.

## Goals / Non-Goals

**Goals:**

- Email+password and Google OAuth sign-in via Supabase Auth.
- Sessions that work transparently in Server Components, Client Components, Route Handlers, and Server Actions.
- `analyses` table with RLS so a user can only see their own rows — no application-layer filtering that could be bypassed if a query forgets a `where`.
- `POST /api/analyze-feedback` rejects anonymous callers with 401 and persists every successful analysis against the caller's `user_id`.
- A history view (`/history`) that lists the signed-in user's past analyses and opens any of them.
- Schema fields future changes will need (`user_id` for billing, `created_at` for monthly usage counting) must be in place now.

**Non-Goals:**

- Billing, plan gating, and the 5/month limit — that's `add-stripe-billing`.
- Transactional emails (welcome, upgrade prompt) — that's `add-resend-emails`.
- Password reset and email verification flows beyond what Supabase Auth provides out of the box (we use the Supabase-hosted redirect templates; no custom UI for the reset form in this change).
- Team/organization concepts. One `auth.users` row = one tenant.
- Migrating any prior anonymous analyses (there are none — nothing was persisted before).

## Decisions

### Decision 1: Supabase for both auth and database (not separate providers)

We could pair NextAuth with a self-managed Postgres, or use Clerk + Supabase DB. We chose **Supabase for both** because:

- Auth rows live in the same Postgres instance as `analyses`, so `analyses.user_id REFERENCES auth.users(id)` is a real FK with cascade, not a string we have to keep in sync.
- RLS policies can reference `auth.uid()` directly — no need to shuttle a JWT claim into the DB layer.
- One set of credentials, one dashboard, one billing line. For a 3-integration SaaS this keeps the surface area small.

Trade-off: we lock database choice to Supabase's hosted Postgres. Acceptable — portability is not a current goal and self-hosting Supabase later is still possible.

### Decision 2: `@supabase/ssr` with three client factories

Following Supabase's Next.js 16 guidance, we create three small factories in `lib/supabase/`:

- `server.ts` — `createClient()` for Server Components and Server Actions, reads cookies via `next/headers`.
- `client.ts` — `createBrowserClient()` for `'use client'` components.
- `middleware.ts` — helper used from `middleware.ts` at the project root, responsible for refreshing the session cookie on every request.

Alternatives considered: a single client passed around via context (breaks in Server Components) and the older `@supabase/auth-helpers-nextjs` (deprecated — replaced by `@supabase/ssr`).

### Decision 3: Route protection via middleware, not per-page checks

`middleware.ts` at the repo root runs on every request, refreshes the Supabase cookie, and redirects unauthenticated visitors to `/sign-in` when they hit a protected matcher (`/` analyzer page, `/history`, `/api/analyze-feedback`).

Alternative: check `supabase.auth.getUser()` at the top of every protected Server Component. Rejected — easy to forget on a new page, and middleware gives us one place to reason about it.

The API route still re-checks `supabase.auth.getUser()` internally and returns 401 on miss — middleware alone is not a security boundary for route handlers because a misconfigured matcher would silently expose them.

### Decision 4: `analyses` schema

```sql
create table public.analyses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  input_text  text not null,
  items       jsonb not null,
  summary     jsonb not null,
  created_at  timestamptz not null default now()
);

create index analyses_user_id_created_at_idx
  on public.analyses (user_id, created_at desc);
```

- `items` and `summary` are stored as `jsonb` — the classifier's response shape may evolve, and this avoids a second migration every time we add a field.
- `(user_id, created_at desc)` composite index supports the history view's primary query (`where user_id = $1 order by created_at desc limit N`) and also the monthly-count query Stripe's quota check will need later.
- `input_text` is kept verbatim so the history view can show the original submission and future reprocessing / re-classification is possible.
- `on delete cascade` — when a user is deleted, their analyses go with them.

### Decision 5: RLS policies

```sql
alter table public.analyses enable row level security;

create policy "analyses_select_own"
  on public.analyses for select
  using (auth.uid() = user_id);

create policy "analyses_insert_own"
  on public.analyses for insert
  with check (auth.uid() = user_id);
```

No UPDATE or DELETE policies — analyses are immutable from the user's perspective in this change. If a "delete analysis" feature is added later it will need its own policy.

The route handler uses the user-scoped server client (not the service role key), so RLS is the enforcement layer. The service role key is only used from the SQL migration tooling and is not referenced from any request-handling code in this change.

### Decision 6: Sign-up / sign-in UI lives under `/(auth)` route group

`app/(auth)/sign-in/page.tsx`, `app/(auth)/sign-up/page.tsx`, `app/(auth)/callback/route.ts` (for the Google OAuth code exchange). The parenthesised group keeps these URLs at the root (`/sign-in`, not `/auth/sign-in`) while letting them share an auth-specific layout (centered card, no app chrome).

### Decision 7: Persist-then-respond ordering in the route handler

On a successful classification, the route handler inserts into `analyses` **before** returning the response. If the insert fails we still return the classification (with a server-side logged warning) rather than 500 — the user already waited for the Claude call and the classification itself is valid. The classifier is the product; persistence is a convenience.

Alternative considered: fire-and-forget with `waitUntil` — rejected because failures would be silent and the history view would miss rows with no signal to the user. Logging + returning the payload keeps the contract intact while making persistence failures observable.

## Risks / Trade-offs

- **[Supabase project not provisioned at apply time] → Mitigation**: `tasks.md` starts with a manual provisioning step and ends with a smoke-test checklist. The SQL migration lives in-repo (`supabase/migrations/`) so re-creating the project is repeatable.
- **[Google OAuth misconfiguration silently falls back to sign-in error] → Mitigation**: Callback route logs the exact Supabase error and the `callback/page.tsx` renders it for signed-in dev sessions. We do not swallow exchange failures.
- **[Existing public API consumers break after 401 enforcement] → Mitigation**: There are no external consumers — this is still a pre-launch app. The breaking-change marker in the proposal is for completeness, not for coordinating with external callers.
- **[RLS policy typo lets a user read others' analyses] → Mitigation**: Migration includes a test scenario (second user cannot select first user's rows) that is run manually before merge. Also covered by the spec scenarios in `analysis-persistence`.
- **[Schema locks in before Stripe/Resend are designed] → Mitigation**: `user_id` + `created_at` are the only fields downstream changes need (monthly-usage count for billing, plus joining on `auth.users.email` for Resend). Both are already present. Anything else Stripe/Resend need goes in their own tables (`subscriptions`, `email_events`), not by altering `analyses`.

## Migration Plan

1. Create a Supabase project via the dashboard; copy URL + anon key into `.env.local`.
2. Configure Google OAuth provider in Supabase dashboard (client ID/secret from Google Cloud Console). Add redirect `https://<project>.supabase.co/auth/v1/callback`.
3. Apply SQL migration: `analyses` table + indexes + RLS policies.
4. Ship code (middleware, clients, auth pages, route-handler change, history page).
5. Smoke-test: sign up with email, sign in with Google, run an analysis, confirm a row appears in `analyses`, confirm a second account cannot see that row.

Rollback: revert the code commit; drop the `analyses` table; disable Google provider in Supabase. There is no data to preserve since persistence is new.
