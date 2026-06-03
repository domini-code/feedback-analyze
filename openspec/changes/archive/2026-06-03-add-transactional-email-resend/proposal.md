## Why

The app has auth, usage metering, and billing wired up but no transactional emails — users who sign up, hit the free quota, or upgrade to Pro receive no confirmation or guidance, creating a silent and confusing experience. Adding three lifecycle emails with Resend closes the feedback loop at every key conversion moment.

## What Changes

- Add `resend` as a new npm dependency and create a shared email-sending utility in `lib/email.ts`
- Send a **welcome email** when a new user completes sign-up (triggered in the sign-up Server Action)
- Send a **limit-reached email** when a free-plan user hits the 5-analysis quota (triggered in `POST /api/analyze-feedback` at the 402 response point)
- Send a **Pro activation email** when a Stripe `checkout.session.completed` webhook fires and the user plan is updated to `pro` (triggered inside `POST /api/webhooks/stripe`)
- Add React Email templates (or plain HTML strings) for each of the three email types
- Expose `RESEND_API_KEY` and `RESEND_FROM_EMAIL` as new required environment variables

## Capabilities

### New Capabilities

- `transactional-email`: Sends automated lifecycle emails via the Resend API — welcome on signup, free-quota-limit-reached with checkout link, and Pro-plan activation confirmation.

### Modified Capabilities

- `user-auth`: The successful sign-up flow SHALL also trigger a welcome email as a side effect (new behavioral requirement on top of the existing session-creation requirement).
- `usage-metering`: When the free limit is reached and HTTP 402 is returned, the system SHALL also send a limit-reached email with a checkout link (new behavioral requirement on top of the existing quota-enforcement requirement).
- `billing`: After `checkout.session.completed` sets the user plan to `pro`, the system SHALL also send a Pro-activation confirmation email (new behavioral requirement on top of the existing webhook-processing requirement).

## Impact

- **New dependency**: `resend` (Node.js SDK)
- **New files**: `lib/email.ts` (Resend client + send helpers), `lib/email-templates/` (HTML templates for the three emails)
- **Modified files**:
  - `app/sign-up/actions.ts` (or wherever the sign-up Server Action lives) — add welcome email call
  - `app/api/analyze-feedback/route.ts` — add limit-reached email call at the 402 branch
  - `app/api/webhooks/stripe/route.ts` — add Pro-activation email call after plan update
- **New env vars**: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
- **No schema changes** — no new database tables or columns required
- **No breaking changes** to existing API contracts
