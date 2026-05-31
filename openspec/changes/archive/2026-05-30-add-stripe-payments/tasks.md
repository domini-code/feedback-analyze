## 1. Stripe & environment setup

- [x] 1.1 In the Stripe dashboard (test mode), create a "Pro" product with a $9.99/month recurring price; copy the price ID
- [x] 1.2 Add `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_PRO`, and `NEXT_PUBLIC_APP_URL` to `.env.local` (and document them in `.env.example`) — `.env.example` documented; real secrets in `.env.local` are yours to fill
- [x] 1.3 Create a Stripe webhook endpoint pointing at `/api/webhooks/stripe` subscribed to `checkout.session.completed`; copy its signing secret into `STRIPE_WEBHOOK_SECRET`
- [x] 1.4 Install the Stripe SDK: `pnpm add stripe`

## 2. Database

- [x] 2.1 Add SQL migration in `supabase/migrations/` creating `public.user_plans` (`user_id` PK → `auth.users` on delete cascade, `plan` text default `'free'` with `check (plan in ('free','pro'))`, `stripe_customer_id`, `stripe_subscription_id`, `created_at`, `updated_at`)
- [x] 2.2 Enable RLS on `user_plans` and add a `select`-own policy (`auth.uid() = user_id`); add no insert/update/delete policies
- [x] 2.3 Apply the migration to the Supabase project and verify the table and policy exist

## 3. Library helpers

- [x] 3.1 Create `lib/stripe.ts` exporting a singleton `Stripe` client from `STRIPE_SECRET_KEY` with a pinned `apiVersion`
- [x] 3.2 Create `lib/plans.ts` with `getUserPlan(userId): Promise<'free' | 'pro'>` using the server (user-scoped) client, returning `'free'` when no row exists
- [x] 3.3 Confirm `lib/usage.ts` `getMonthlyUsage(userId)` counts `analyses` since the first day of the current calendar month (already implemented)

## 4. Checkout endpoint

- [x] 4.1 Create `app/api/checkout/route.ts` (`POST`) — return 401 for anonymous callers
- [x] 4.2 Ensure a Stripe customer exists for the user (reuse `user_plans.stripe_customer_id`, else create one with the user's email and `metadata.supabase_user_id`)
- [x] 4.3 Create a subscription-mode Checkout Session for `STRIPE_PRICE_ID_PRO` with `client_reference_id` and `metadata.supabase_user_id` set to the user id, and success/cancel URLs from `NEXT_PUBLIC_APP_URL`
- [x] 4.4 Return `{ url }` with the session URL

## 5. Webhook endpoint

- [x] 5.1 Create `app/api/webhooks/stripe/route.ts` (`POST`) that reads the raw body via `await req.text()` (never `req.json()`)
- [x] 5.2 Verify the signature with `stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET)`; return 400 on failure with no DB write
- [x] 5.3 On `checkout.session.completed`, upsert `user_plans` (keyed on `user_id` from `metadata.supabase_user_id` / `client_reference_id`) setting `plan='pro'`, `stripe_customer_id`, `stripe_subscription_id`, `updated_at` — using the Supabase service-role client
- [x] 5.4 Return 200 for unhandled event types without changes; verify idempotency on redelivery

## 6. Quota gate in analyze endpoint

- [x] 6.1 In `app/api/analyze-feedback/route.ts`, after the existing auth check, read the user's plan via `getUserPlan`
- [x] 6.2 For `free` users, call `getMonthlyUsage` and return HTTP 402 `{ "error": "free_limit_reached", "limit": 5 }` when the count is `>= 5`, before any Claude call or DB write
- [x] 6.3 For `pro` users, skip the quota check and classify/persist as before

## 7. Upgrade modal UI

- [x] 7.1 Add a client component upgrade modal explaining the 5/month free limit with an upgrade CTA
- [x] 7.2 In the analyzer UI, detect HTTP 402 from `POST /api/analyze-feedback` and open the modal instead of rendering results
- [x] 7.3 Wire the modal CTA to `POST /api/checkout` and redirect to the returned `url`

## 8. Verification

- [ ] 8.1 As a free user, run 5 analyses, confirm the 6th returns 402 and the modal appears
- [ ] 8.2 Complete Checkout in Stripe test mode; confirm the webhook fires and the `user_plans` row flips to `pro`
- [ ] 8.3 Confirm a `pro` user can run more than 5 analyses without a 402
- [x] 8.4 Run `pnpm lint` and `pnpm build` clean
