## 1. Dependencies & Environment

- [x] 1.1 Install `resend` package with `pnpm add resend`
- [x] 1.2 Add `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and `NEXT_PUBLIC_APP_URL` to `.env.local` with placeholder values
- [x] 1.3 Document the three new env vars in `.env.example` (or equivalent reference file)

## 2. Email Templates

- [x] 2.1 Create `lib/email-templates/welcome.ts` — exports `welcomeTemplate()` returning an HTML string with welcome message and product intro
- [x] 2.2 Create `lib/email-templates/limit-reached.ts` — exports `limitReachedTemplate({ checkoutUrl })` returning an HTML string with quota explanation and a CTA link to `checkoutUrl`
- [x] 2.3 Create `lib/email-templates/pro-activation.ts` — exports `proActivationTemplate()` returning an HTML string confirming Pro plan activation and unlimited analyses

## 3. Email Sending Module

- [x] 3.1 Create `lib/email.ts` — initialize `Resend` client with `process.env.RESEND_API_KEY`
- [x] 3.2 Implement `sendWelcomeEmail(to: string)` — uses `welcomeTemplate()`, sends via Resend, catches and `console.warn`s errors without re-throwing
- [x] 3.3 Implement `sendLimitReachedEmail(to: string, checkoutUrl: string)` — uses `limitReachedTemplate({ checkoutUrl })`, sends via Resend, catches and `console.warn`s errors without re-throwing
- [x] 3.4 Implement `sendProActivationEmail(to: string)` — uses `proActivationTemplate()`, sends via Resend, catches and `console.warn`s errors without re-throwing

## 4. Sign-Up Welcome Email

- [x] 4.1 Create `app/(auth)/sign-up/actions.ts` as a Server Action file (`'use server'`) that wraps `supabase.auth.signUp()` and calls `sendWelcomeEmail(email)` on success
- [x] 4.2 Refactor `app/(auth)/sign-up/page.tsx` to call the new Server Action instead of calling `supabase.auth.signUp()` directly from the client component
- [x] 4.3 Verify sign-up still redirects correctly and session is established; confirm email is sent (check Resend dashboard or logs)

## 5. Limit-Reached Email

- [x] 5.1 In `app/api/analyze-feedback/route.ts`, import `sendLimitReachedEmail` and construct `checkoutUrl` from `process.env.NEXT_PUBLIC_APP_URL`
- [x] 5.2 Call `sendLimitReachedEmail(userEmail, checkoutUrl)` at the HTTP 402 branch, after building the response — ensure it does not block or alter the response
- [x] 5.3 Verify the 402 response body and status code are unchanged; confirm email is sent when the free limit is hit

## 6. Pro Activation Email

- [x] 6.1 In `app/api/webhooks/stripe/route.ts`, import `sendProActivationEmail`
- [x] 6.2 After the `user_plans` upsert succeeds, fetch the user's email from `auth.users` using the service-role Supabase client and `supabase_user_id` from event metadata
- [x] 6.3 Call `sendProActivationEmail(userEmail)` if the email was retrieved; log a `warn` and skip email if the lookup fails — do not change the HTTP 200 response
- [x] 6.4 Verify the webhook still returns HTTP 200 and plan is set to `pro`; confirm activation email is sent
