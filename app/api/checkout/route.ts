import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const priceId = process.env.STRIPE_PRICE_ID_PRO;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!priceId || !appUrl) {
    return NextResponse.json(
      { error: "Billing is not configured. Set STRIPE_PRICE_ID_PRO and NEXT_PUBLIC_APP_URL." },
      { status: 500 }
    );
  }

  // Reuse the user's Stripe customer if we already have one, otherwise create it
  // and stash the Supabase user id in metadata so the webhook can map back.
  const { data: plan } = await supabase
    .from("user_plans")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  let customerId = plan?.stripe_customer_id ?? undefined;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;

    // Persist immediately so the row exists before the webhook fires.
    // Plan stays 'free' until the webhook confirms payment.
    await supabase.from("user_plans").upsert(
      { user_id: user.id, stripe_customer_id: customerId, plan: "free" },
      { onConflict: "user_id" }
    );
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    client_reference_id: user.id,
    metadata: { supabase_user_id: user.id },
    success_url: `${appUrl}/?upgraded=1`,
    cancel_url: `${appUrl}/?upgrade=cancelled`,
  });

  return NextResponse.json({ url: session.url });
}
