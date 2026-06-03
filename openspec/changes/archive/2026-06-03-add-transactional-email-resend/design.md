## Context

The app already has Supabase Auth (sign-up/sign-in), usage metering with a 5-analysis free quota, and Stripe billing with a Pro plan at $9.99/month. The three key lifecycle events — user creation, quota exhaustion, and plan upgrade — currently produce no email feedback to the user. Resend is the chosen provider because it has a generous free tier (3,000 emails/month), a first-class Node.js SDK, and excellent deliverability for transactional mail.

The three trigger points in existing code are:
1. **Sign-up Server Action** (`app/(auth)/sign-up/page.tsx`) — currently a client component calling `supabase.auth.signUp()`; email must be sent server-side after successful signup.
2. **`POST /api/analyze-feedback`** (`app/api/analyze-feedback/route.ts`) — returns HTTP 402 with `{ error: "free_limit_reached" }` when the free quota is reached.
3. **`POST /api/webhooks/stripe`** (`app/api/webhooks/stripe/route.ts`) — processes `checkout.session.completed` and upserts the user plan to `pro` using the service-role Supabase client.

## Goals / Non-Goals

**Goals:**
- Send a welcome email on successful sign-up
- Send a limit-reached email (with a direct checkout URL) when a free-plan user hits the 5-analysis quota
- Send a Pro activation confirmation email after the Stripe webhook sets the plan to `pro`
- Keep email sending non-blocking — a Resend API failure must never break the core user flow
- Single shared `lib/email.ts` module for the Resend client and all send helpers

**Non-Goals:**
- Email unsubscribe/preference center (out of scope for MVP)
- React Email / JSX templates — plain HTML strings keep the dependency surface minimal
- Resend webhooks or delivery status tracking
- Bulk/marketing emails
- Email verification on sign-up (Supabase handles that separately)

## Decisions

### D1: Fire-and-forget for all email sends

Email sends are wrapped in a `try/catch` and awaited, but a failure only logs a warning — it never throws or changes the HTTP response. Rationale: the user's primary action (creating an account, getting a 402, receiving a plan upgrade) must not be blocked or broken by a transient email provider outage.

*Alternative considered*: Return an error to the client if email fails — rejected because it creates a confusing UX (signup "fails" but the account was created).

### D2: Plain HTML string templates, no React Email

Templates are authored as tagged-template-literal HTML strings in `lib/email-templates/`. React Email adds ~50 MB of dependencies and a compilation step for no meaningful benefit at three simple emails. Template strings are easier to read, edit, and test.

*Alternative considered*: React Email (`@react-email/components`) — deferred until the template count or complexity justifies the dependency.

### D3: Sign-up email triggered in a new Server Action, not in the client component

The sign-up page is a `'use client'` component; `lib/email.ts` uses the Resend SDK (Node.js only) and cannot run in the browser. A new `app/(auth)/sign-up/actions.ts` Server Action wraps `supabase.auth.signUp()` and calls `sendWelcomeEmail()` on success. The client component is refactored to call this action instead of the Supabase client directly.

*Alternative considered*: A Supabase Auth hook / database trigger — would require a separate edge function deployment; overkill for a single email.

### D4: Limit-reached email sent once per quota hit, not deduplicated

For MVP, the email is sent every time the 402 path is hit (i.e., each subsequent analysis attempt while over quota). Full deduplication (e.g., track "limit email sent" in DB) is deferred. Rationale: the user is unlikely to spam the endpoint once they see the 402; the cost of a few duplicate emails is lower than the complexity of a new DB column.

### D5: Checkout URL in limit-reached email constructed from `NEXT_PUBLIC_APP_URL`

The email links directly to `/api/checkout` (which creates the Stripe session and redirects). A new env var `NEXT_PUBLIC_APP_URL` provides the base URL. This avoids hardcoding the domain and works in both staging and production.

## Risks / Trade-offs

- **Resend cold-start latency** → adds ~100–300 ms to affected endpoints; acceptable because sign-up and webhook are not latency-sensitive. The 402 path in `analyze-feedback` may feel slightly slower — mitigated by keeping the send non-blocking (fire-and-forget after awaiting).
- **Missing `RESEND_API_KEY` in production** → email sends silently fail and log a warning; the core flow is unaffected but emails are never delivered. Mitigation: add the var to deployment checklist and startup validation.
- **Sign-up email sent before Supabase email confirmation** → if Supabase email confirmation is enabled, the user receives both the Supabase verification email and our welcome email simultaneously. Mitigation: document this in the env setup; welcome email content should acknowledge that verification may still be pending.

## Migration Plan

1. Add `RESEND_API_KEY` and `RESEND_FROM_EMAIL` to `.env.local` (development) and production environment.
2. Add `NEXT_PUBLIC_APP_URL` to env if not already present.
3. Deploy — no database migrations required.
4. **Rollback**: remove the three `sendXxxEmail()` call sites and the `lib/email.ts` module; no schema to revert.

## Open Questions

- Should the welcome email be suppressed when Supabase email confirmation is enabled (to avoid two near-simultaneous emails)? Likely yes — check `SUPABASE_AUTH_EMAIL_CONFIRM_CHANGE_EMAIL` env at send time.
- What sender name and `from` address should be used? Needs a verified Resend domain. Placeholder: `Feedback Analyzer <noreply@feedbackanalyzer.com>`.
