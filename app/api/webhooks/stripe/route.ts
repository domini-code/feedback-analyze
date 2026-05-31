import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";

/**
 * Service-role Supabase client — bypasses RLS. Constructed only here, inside the
 * webhook handler (server-only), so the service-role key never reaches a client
 * bundle. The webhook runs without a user session, so it cannot use the
 * cookie-based server client.
 */
function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase service-role credentials are not configured.");
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET is not configured." },
      { status: 500 }
    );
  }

  // Signature verification needs the raw body — never parse it as JSON first.
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("[api/webhooks/stripe] signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId =
      session.metadata?.supabase_user_id ?? session.client_reference_id ?? null;

    if (!userId) {
      console.error("[api/webhooks/stripe] checkout.session.completed without a Supabase user id");
      return NextResponse.json({ error: "Missing supabase_user_id." }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Upsert keyed on user_id makes Stripe redeliveries idempotent.
    const { error } = await supabase.from("user_plans").upsert(
      {
        user_id: userId,
        plan: "pro",
        stripe_customer_id:
          typeof session.customer === "string" ? session.customer : session.customer?.id ?? null,
        stripe_subscription_id:
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (error) {
      console.error("[api/webhooks/stripe] failed to upsert user_plans:", error);
      return NextResponse.json({ error: "Failed to update plan." }, { status: 500 });
    }
  }

  // Acknowledge all verified events (handled or not) so Stripe stops retrying.
  return NextResponse.json({ received: true });
}
