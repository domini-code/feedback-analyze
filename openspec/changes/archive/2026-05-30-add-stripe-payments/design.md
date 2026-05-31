## Context

The app is a Next.js 16 (App Router) + React 19 + Tailwind v4 SaaS with Supabase Auth and an `analyses` table keyed by `user_id` with a `(user_id, created_at desc)` index. `POST /api/analyze-feedback` already requires an authenticated session and persists each successful classification. There is no billing: every signed-in user runs unlimited analyses for free.

This is integration 2 of 3:

1. `add-supabase-auth-and-persistence` (done) — auth + `analyses` table.
2. **This change** — Stripe free/Pro split, monthly quota, webhook plan state.
3. `add-resend-emails` — upgrade-prompt and receipt emails.

The previous change deliberately shipped `analyses.created_at` and a composite index so monthly usage could be counted here without a schema change. `lib/usage.ts` (`getMonthlyUsage`) is already in place and does exactly that count.

Constraint: Stripe webhook signature verification needs the **raw** request body. In Next 16 Route Handlers that means reading `await req.text()` and passing it (not a parsed object) to `stripe.webhooks.constructEvent`. The webhook also runs without a user session, so it must write with the Supabase **service-role** key, bypassing RLS.

## Goals / Non-Goals

**Goals:**

- A `user_plans` table mapping each user to `free` (default) or `pro`, plus their Stripe customer/subscription IDs.
- Free tier hard-capped at 5 analyses per calendar month; Pro unlimited.
- `POST /api/analyze-feedback` returns **402** to over-limit free users *before* calling Claude (no wasted token spend, no persisted row).
- `POST /api/checkout` creates a Stripe Checkout Session for the $9.99/mo recurring price and returns its URL.
- `POST /api/webhooks/stripe` verifies the signature and promotes the user to `pro` on `checkout.session.completed`, idempotently.
- An upgrade modal in the analyzer UI triggered by a 402 response.

**Non-Goals:**

- Downgrade / cancellation handling (`customer.subscription.deleted`), proration, plan management portal — a later change. We note the event but do not act on it here.
- Annual plans, multiple paid tiers, coupons, taxes.
- Transactional emails (upgrade prompt, receipt) — that's `add-resend-emails`.
- Counting analyses across a rolling 30-day window — we use the **calendar** month (resets on the 1st) to match the spec wording and keep the count query a simple `created_at >= start_of_month`.
- A usage meter UI (e.g. "3/5 used") — out of scope; only the 402 modal is required.

## Decisions

### Decision 1: `user_plans` schema, one row per user

```sql
create table public.user_plans (
  user_id                uuid primary key references auth.users(id) on delete cascade,
  plan                   text not null default 'free' check (plan in ('free','pro')),
  stripe_customer_id     text,
  stripe_subscription_id text,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
```

- `user_id` is the primary key (one plan per user), and a real FK with cascade so a deleted user's plan row goes too.
- `plan` defaults to `free` with a CHECK constraint — the only two legal values this change recognizes.
- Stripe IDs are nullable: a `free` user who never checks out has none.
- No row is required to exist for a `free` user. The plan reader (`lib/plans.ts`) treats a missing row as `free`, so we don't have to backfill existing users or insert on signup in this change.

### Decision 2: RLS — user reads own plan, webhook writes via service role

```sql
alter table public.user_plans enable row level security;

create policy "user_plans_select_own"
  on public.user_plans for select
  using (auth.uid() = user_id);
```

No INSERT/UPDATE/DELETE policies for end users — plan changes only ever come from Stripe via the webhook, which uses the **service-role** client and bypasses RLS entirely. This means a user can never self-promote to `pro` by writing their own row, even if the anon client tried. The quota check in the analyze route reads the plan with the user-scoped client (RLS-allowed select), so it sees the real plan without trusting client input.

### Decision 3: Quota enforced in the route handler, before Claude

The order in `POST /api/analyze-feedback`:

1. `getUser()` → 401 if anonymous (existing behavior, unchanged).
2. Read plan via `lib/plans.ts`. If `pro` → skip straight to classification.
3. If `free` → `getMonthlyUsage(userId)`. If `>= 5` → return **402** `{ "error": "free_limit_reached", "limit": 5 }` and stop — no Claude call, no DB write.
4. Otherwise classify and persist as today.

The check happens before the Claude call so an over-limit request costs us nothing. We count *existing* rows (analyses already persisted this month); the request being gated is the would-be 6th. Because persistence is "persist-then-respond", the count is authoritative at check time.

Trade-off: a user could race two requests at count=4 and land 6 rows. Acceptable for this tier — the cap is a soft business limit, not a security boundary, and the overage is at most the concurrency window. A DB-side trigger/constraint is overkill here.

### Decision 4: `402 Payment Required` as the over-limit status

402 is the semantically correct, rarely-used status for "you must pay to proceed." The client distinguishes it from 401 (re-auth) and 429 (slow down) and maps it directly to the upgrade modal. Body carries a machine-readable `error: "free_limit_reached"` so the client doesn't string-match on status alone.

### Decision 5: Checkout session creation

`POST /api/checkout` (authenticated):

- Resolves the user, ensures a Stripe customer exists (creates one with the user's email and `metadata.supabase_user_id` if `user_plans.stripe_customer_id` is absent), then creates a subscription-mode Checkout Session for `STRIPE_PRICE_ID_PRO`.
- Sets `client_reference_id` and `metadata.supabase_user_id` to the Supabase user id so the webhook can map the completed session back to the user without trusting the email.
- `success_url = ${NEXT_PUBLIC_APP_URL}/?upgraded=1`, `cancel_url = ${NEXT_PUBLIC_APP_URL}/?upgrade=cancelled`.
- Returns `{ url }`; the client does `window.location.href = url`.

### Decision 6: Webhook handler

`POST /api/webhooks/stripe`:

- Reads the raw body with `await req.text()` and the `stripe-signature` header, calls `stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET)`. On verification failure → **400**, no DB write.
- On `checkout.session.completed`: read `metadata.supabase_user_id` (fallback `client_reference_id`), then **upsert** `user_plans` with `plan='pro'`, `stripe_customer_id = session.customer`, `stripe_subscription_id = session.subscription`, `updated_at = now()`, using the **service-role** client.
- The upsert keys on `user_id`, making redelivery idempotent — Stripe retries are safe.
- Unhandled event types → **200** (acknowledge so Stripe stops retrying) with no action.

### Decision 7: `lib/stripe.ts` and `lib/plans.ts` helpers

- `lib/stripe.ts` exports a singleton `Stripe` instance built from `STRIPE_SECRET_KEY`, pinned to an explicit `apiVersion`. Used by both the checkout and webhook routes.
- `lib/plans.ts` exports `getUserPlan(userId): Promise<'free' | 'pro'>` — selects `plan` from `user_plans` with the server (user-scoped) client, returns `'free'` when no row exists or on a not-found. Keeps the analyze route thin and the "missing row = free" rule in one place.

## Risks / Trade-offs

- **[Webhook body parsed before signature check] → Mitigation**: handler reads `req.text()` first and never `req.json()`; signature verification is the first thing it does. Documented in the spec scenario.
- **[Service-role key leaks via client bundle] → Mitigation**: the service-role client is constructed only inside the webhook route handler (server-only, never imported by a `'use client'` file); `SUPABASE_SERVICE_ROLE_KEY` has no `NEXT_PUBLIC_` prefix.
- **[Concurrency lets a free user exceed 5] → Mitigation**: accepted (Decision 3). Overage bounded by request concurrency; not a security concern.
- **[Stripe price/env not configured at apply time] → Mitigation**: `tasks.md` includes a Stripe-dashboard setup step (create $9.99/mo recurring price, copy price ID, create webhook endpoint + signing secret) before the smoke test.
- **[Webhook never arrives / arrives late, user paid but still `free`] → Mitigation**: idempotent upsert keyed on `user_id` means any redelivery converges; `success_url` carries `?upgraded=1` for UI feedback but the source of truth is the webhook, not the redirect. Stripe's automatic retries cover transient endpoint failures.
- **[Calendar-month reset surprises a user mid-cycle] → Mitigation**: documented behavior — the free quota resets on the 1st of each month, independent of signup date. Stated in the `usage-metering` spec.

## Migration Plan

1. In the Stripe dashboard (test mode): create a product "Pro" with a $9.99/month recurring price; copy the price ID into `STRIPE_PRICE_ID_PRO`.
2. Create a webhook endpoint pointing at `/api/webhooks/stripe`, subscribe to `checkout.session.completed`; copy the signing secret into `STRIPE_WEBHOOK_SECRET`. Copy the secret key into `STRIPE_SECRET_KEY`. Set `NEXT_PUBLIC_APP_URL`.
3. Apply SQL migration: `user_plans` table + RLS select policy.
4. Ship code: `lib/stripe.ts`, `lib/plans.ts`, checkout route, webhook route, quota gate in analyze route, upgrade modal.
5. Smoke-test: as a free user run 5 analyses, confirm the 6th returns 402 and the modal appears; complete Checkout in Stripe test mode; confirm the webhook fires, the `user_plans` row flips to `pro`, and a 6th analysis now succeeds.

Rollback: revert the code commit; drop the `user_plans` table; deactivate the Stripe webhook endpoint and the price. No analysis data is affected (the `analyses` table is untouched by this change).
