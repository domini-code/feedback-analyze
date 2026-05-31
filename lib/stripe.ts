import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;

if (!secretKey) {
  throw new Error("STRIPE_SECRET_KEY is not configured. Set it in .env.local.");
}

/**
 * Singleton server-side Stripe client. Import this from Route Handlers only —
 * never from a `'use client'` component, since it carries the secret key.
 */
export const stripe = new Stripe(secretKey, {
  apiVersion: "2026-05-27.dahlia",
});
