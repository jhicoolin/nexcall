import { NextResponse } from "next/server";
import { getCheckoutPlan, getPriceEnvName, getPriceId, type CheckoutBilling } from "@/lib/checkout-plans";
import { cleanIdentifier, cleanText, getSafeSiteOrigin, isValidEmail, readJsonObject, validationResponse } from "@/lib/security";

type CheckoutRequest = {
  planId?: string;
  billing?: CheckoutBilling;
  email?: string;
};

export async function POST(request: Request) {
  let rawBody: Record<string, unknown>;

  try {
    rawBody = await readJsonObject(request, 4000);
  } catch (error) {
    return validationResponse(error);
  }

  const planId = cleanIdentifier(rawBody.planId, 40);
  const billing = rawBody.billing === "yearly" ? "yearly" : "monthly";
  const email = cleanText(rawBody.email, 254);
  const plan = getCheckoutPlan(planId);
  const priceId = getPriceId(planId, billing);
  const priceEnvName = getPriceEnvName(planId, billing);

  if (!plan) {
    return NextResponse.json(
      { ok: false, error: "Unknown checkout plan." },
      { status: 400 }
    );
  }

  if (!priceId) {
    console.warn("Stripe Checkout price ID missing", { planId, billing, priceEnvName });

    return NextResponse.json(
      {
        ok: false,
        error: "Online checkout for this plan is being connected. Book a demo and we can start your setup manually.",
        missingConfig: priceEnvName
      },
      { status: 503 }
    );
  }

  if (email && !isValidEmail(email)) {
    return NextResponse.json({ ok: false, error: "Enter a valid email address." }, { status: 400 });
  }

  const origin = getSafeSiteOrigin(request);

  const lineItems = [{ price: priceId, quantity: "1" }];
  const setupFeePriceId = process.env.STRIPE_SETUP_FEE_PRICE_ID;

  if (setupFeePriceId && !setupFeePriceId.includes("replace_me")) {
    lineItems.push({ price: setupFeePriceId, quantity: "1" });
  }

  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;

    if (!secretKey || secretKey.includes("replace_me")) {
      console.warn("Stripe Checkout secret key missing or placeholder");

      return NextResponse.json(
        { ok: false, error: "Online checkout is temporarily unavailable. Book a demo and we can complete setup manually." },
        { status: 500 }
      );
    }

    const form = new URLSearchParams();
    form.set("mode", "subscription");
    form.set("billing_address_collection", "auto");
    form.set("allow_promotion_codes", "true");
    form.set("phone_number_collection[enabled]", "true");
    form.set(
      "automatic_tax[enabled]",
      process.env.STRIPE_AUTOMATIC_TAX_ENABLED === "true" ? "true" : "false"
    );
    form.set("success_url", `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`);
    form.set("cancel_url", `${origin}/checkout/cancel?plan=${plan.id}`);
    form.set("client_reference_id", `${plan.id}-${billing}`);
    form.set("metadata[planId]", plan.id);
    form.set("metadata[planName]", plan.name);
    form.set("metadata[billing]", billing);
    form.set("subscription_data[metadata][planId]", plan.id);
    form.set("subscription_data[metadata][planName]", plan.name);
    form.set("subscription_data[metadata][billing]", billing);

    if (email) {
      form.set("customer_email", email);
    }

    lineItems.forEach((item, index) => {
      form.set(`line_items[${index}][price]`, item.price);
      form.set(`line_items[${index}][quantity]`, item.quantity);
    });

    const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: form
    });
    const session = (await stripeResponse.json()) as { url?: string; error?: { message?: string } };

    if (!stripeResponse.ok || !session.url) {
      console.error("Stripe Checkout session creation failed", {
        status: stripeResponse.status,
        planId: plan.id,
        billing,
        message: session.error?.message
      });

      throw new Error("Stripe did not return a checkout URL.");
    }

    return NextResponse.json({ ok: true, url: session.url });
  } catch (error) {
    console.error("Checkout route failed", {
      planId: plan?.id,
      billing,
      message: error instanceof Error ? error.message : "Unknown checkout error"
    });

    return NextResponse.json(
      { ok: false, error: "Checkout could not open right now. Please book a demo and we will follow up." },
      { status: 500 }
    );
  }
}
