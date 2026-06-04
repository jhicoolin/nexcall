import { NextResponse } from "next/server";
import {
  getCheckoutPlan,
  getInlinePriceData,
  getPriceEnvNames,
  getPriceId,
  type CheckoutBilling
} from "@/lib/checkout-plans";
import { notifyNexCallLead } from "@/lib/lead-notifications";
import {
  assertAllowedFields,
  checkRateLimit,
  cleanIdentifier,
  getSafeSiteOrigin,
  isHoneypotTriggered,
  isValidEmail,
  normalizeEmail,
  originGuardResponse,
  rateLimitResponse,
  readJsonObject,
  validationResponse
} from "@/lib/security";

type CheckoutRequest = {
  planId?: string;
  billing?: CheckoutBilling;
  email?: string;
};

export async function POST(request: Request) {
  const originDenied = originGuardResponse(request);
  if (originDenied) return originDenied;

  const limit = await checkRateLimit(request, {
    bucket: "checkout",
    limit: 10,
    windowSeconds: 60
  });

  if (!limit.allowed) return rateLimitResponse(limit);

  let rawBody: Record<string, unknown>;

  try {
    rawBody = await readJsonObject(request, 4000);
  } catch (error) {
    return validationResponse(error);
  }

  try {
    assertAllowedFields(
      rawBody,
      ["billing", "email", "planId", "companyWebsiteConfirm", "website", "websiteConfirm"],
      "checkout payload"
    );
  } catch (error) {
    return validationResponse(error);
  }

  if (isHoneypotTriggered(rawBody)) {
    return NextResponse.json({ ok: true, leadCaptured: true });
  }

  const planId = cleanIdentifier(rawBody.planId, 40);
  const rawBilling = cleanIdentifier(rawBody.billing || "monthly", 20);
  const email = normalizeEmail(rawBody.email);

  if (rawBilling !== "monthly" && rawBilling !== "yearly") {
    return NextResponse.json({ ok: false, error: "Unknown billing interval." }, { status: 400 });
  }

  const billing = rawBilling;
  const plan = getCheckoutPlan(planId);
  const priceId = getPriceId(planId, billing);
  const priceEnvNames = getPriceEnvNames(planId, billing);
  const inlinePriceData = getInlinePriceData(planId, billing);

  if (!plan) {
    return NextResponse.json(
      { ok: false, error: "Unknown checkout plan." },
      { status: 400 }
    );
  }

  if (!priceId) {
    console.warn("Stripe Checkout price ID missing; using server-side inline price_data fallback", {
      planId,
      billing,
      priceEnvNames
    });
    await notifyNexCallLead({
      subject: "New NexCall Checkout Lead",
      source: "checkout-inline-price-fallback",
      email,
      inquiryType: "checkout fallback",
      appointmentType: billing,
      message: "A visitor started checkout using server-side Stripe inline price_data because this plan is missing its Stripe price ID.",
      metadata: { planId, planName: plan.name, billing, missingEnvCandidates: priceEnvNames }
    });
  }

  if (email && !isValidEmail(email)) {
    return NextResponse.json({ ok: false, error: "Enter a valid email address." }, { status: 400 });
  }

  const origin = getSafeSiteOrigin(request);

  const lineItems = [
    priceId
      ? { price: priceId, quantity: "1" }
      : { priceData: inlinePriceData, quantity: "1" }
  ];
  const setupFeePriceId = process.env.STRIPE_SETUP_FEE_PRICE_ID;

  if (setupFeePriceId && !setupFeePriceId.includes("replace_me")) {
    lineItems.push({ price: setupFeePriceId, quantity: "1" });
  }

  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;

    if (!secretKey || secretKey.includes("replace_me") || !inlinePriceData) {
      console.warn("Stripe Checkout secret key missing or placeholder");
      await notifyNexCallLead({
        subject: "New NexCall Checkout Lead",
        source: "checkout-missing-secret-key",
        email,
        inquiryType: "checkout fallback",
        appointmentType: billing,
        message: "A visitor tried to start checkout, but STRIPE_SECRET_KEY is missing or placeholder.",
        metadata: { planId: plan.id, planName: plan.name, billing }
      });

      return NextResponse.json(
        {
          ok: false,
          error: "This plan is being finalized. Please request a demo and our team will help you activate it.",
          leadCaptured: true
        },
        { status: 503 }
      );
    }

    console.info("Starting Stripe Checkout session", {
      planId: plan.id,
      billing,
      stripeMode: secretKey.startsWith("sk_test_") ? "test" : secretKey.startsWith("sk_live_") ? "live" : "unknown"
    });

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
      if ("price" in item && item.price) {
        form.set(`line_items[${index}][price]`, item.price);
      } else if ("priceData" in item && item.priceData) {
        form.set(`line_items[${index}][price_data][currency]`, "usd");
        form.set(`line_items[${index}][price_data][unit_amount]`, item.priceData.unitAmount.toString());
        form.set(`line_items[${index}][price_data][recurring][interval]`, item.priceData.interval);
        form.set(`line_items[${index}][price_data][product_data][name]`, item.priceData.productName);
      }
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
    await notifyNexCallLead({
      subject: "New NexCall Checkout Lead",
      source: "checkout-provider-error",
      email,
      inquiryType: "checkout fallback",
      appointmentType: billing,
      message: "A visitor tried to start checkout, but Stripe did not return a usable session.",
      metadata: { planId: plan?.id, planName: plan?.name, billing }
    });

    return NextResponse.json(
      {
        ok: false,
        error: "This plan is being finalized. Please request a demo and our team will help you activate it.",
        leadCaptured: true
      },
      { status: 502 }
    );
  }
}
