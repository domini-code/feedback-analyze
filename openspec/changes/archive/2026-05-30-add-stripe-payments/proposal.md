## Why

The Feedback Analyzer has identity and persistence (`add-supabase-auth-and-persistence`) but no way to make money or cap usage — every authenticated user can run unlimited analyses for free. This change is integration 2 of 3: it monetizes the app with a Stripe-backed free/Pro split (Free = 5 analyses/month, Pro = unlimited at $9.99/mo) so usage has a cost and an upgrade path. It builds directly on the `analyses.user_id` + `created_at` schema the previous change put in place for exactly this metering.

## What Changes

- Add Stripe as the payments provider (Checkout + Billing, webhook-driven plan state).
- Add a `user_plans` table keyed by `user_id` that records the user's plan (`free` | `pro`) and their Stripe identifiers (`stripe_customer_id`, `stripe_subscription_id`). Users default to `free`.
- Add usage metering: `getMonthlyUsage(userId)` counts the caller's analyses since the first day of the current calendar month (already added in `lib/usage.ts`).
- **BREAKING** — `POST /api/analyze-feedback` now enforces the free quota: a `free` user who has already run 5 analyses this calendar month receives HTTP **402 Payment Required** instead of a classification. `pro` users are never gated. Authenticated `free` users under the limit are unaffected; the success schema is unchanged.
- Add `POST /api/checkout` — creates a Stripe Checkout Session for the Pro plan for the signed-in user and returns its URL.
- Add `POST /api/webhooks/stripe` — verifies the Stripe signature and, on `checkout.session.completed`, sets the user's plan to `pro` and stores their Stripe customer/subscription IDs.
- Add an upgrade modal in the analyzer UI that appears when the API responds 402, explaining the limit and linking to checkout.

## Capabilities

### New Capabilities

- `billing`: Stripe-backed plans for the app — the `user_plans` table, the Checkout Session endpoint, the signature-verified webhook that promotes a user to `pro`, and the upgrade UI surfaced on quota exhaustion.
- `usage-metering`: Per-user monthly analysis counting and free-tier quota enforcement (5/month) — `getMonthlyUsage` plus the 402 gate applied at the analyze endpoint.

### Modified Capabilities

- `feedback-classifier`: The `POST /api/analyze-feedback` endpoint changes from "any authenticated user, unlimited" to plan-aware. It SHALL reject `free` callers who have reached 5 analyses in the current calendar month with HTTP 402 before invoking Claude, and SHALL allow `pro` callers without limit.

## Impact

- **Code**: new `app/api/checkout/route.ts`, new `app/api/webhooks/stripe/route.ts`, new `lib/stripe.ts` (server SDK client), plan/quota check added to `app/api/analyze-feedback/route.ts`, an upgrade-modal client component in the analyzer UI, and a small `lib/plans.ts` helper to read a user's plan. `lib/usage.ts` (`getMonthlyUsage`) already exists.
- **Database**: new Supabase table `public.user_plans` (`user_id` PK → `auth.users`, `plan`, `stripe_customer_id`, `stripe_subscription_id`, timestamps) with RLS so a user reads only their own plan; the webhook writes via the service-role key, bypassing RLS. SQL migration checked into `supabase/migrations/`.
- **Dependencies**: `stripe` (Node server SDK).
- **Environment**: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_PRO` (the $9.99/mo recurring price), and `NEXT_PUBLIC_APP_URL` for Checkout success/cancel redirects. The existing `SUPABASE_SERVICE_ROLE_KEY` is reused by the webhook handler.
- **Webhook config**: the Stripe dashboard must point a webhook endpoint at `/api/webhooks/stripe` subscribed to `checkout.session.completed` (and, for forward-compat, `customer.subscription.deleted` is noted but not required for this change).
- **Downstream**: unlocks `add-resend-emails` (integration 3) which sends an upgrade-prompt email when the free limit is hit and a receipt on successful checkout.
