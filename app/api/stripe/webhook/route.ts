import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { notifyNexCallLead } from "@/lib/lead-notifications";
import { isAllowedServerUrl } from "@/lib/security";

export const runtime = "nodejs";

type StripeCheckoutSession = {
  id: string;
  customer?: string;
  subscription?: string;
  customer_email?: string;
  customer_details?: {
    email?: string;
    name?: string;
  };
  metadata?: {
    planId?: string;
    planName?: string;
    billing?: string;
  };
};

type StripeEvent = {
  type: string;
  data: {
    object: StripeCheckoutSession;
  };
};

export async function POST(request: Request) {
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret || webhookSecret.includes("replace_me")) {
    return NextResponse.json(
      { ok: false, error: "Stripe webhook secret or signature missing." },
      { status: 400 }
    );
  }

  let event: StripeEvent;

  try {
    verifyStripeSignature(payload, signature, webhookSecret);
    event = JSON.parse(payload) as StripeEvent;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown webhook error";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    await notifyNexCallLead({
      subject: "New NexCall Checkout Lead",
      source: "stripe-checkout-completed",
      name: session.customer_details?.name,
      email: session.customer_details?.email || session.customer_email,
      inquiryType: "checkout completed",
      appointmentType: session.metadata?.billing,
      message: "Stripe confirmed a checkout.session.completed event.",
      metadata: {
        sessionId: session.id,
        customerId: session.customer,
        subscriptionId: session.subscription,
        planId: session.metadata?.planId,
        planName: session.metadata?.planName,
        billing: session.metadata?.billing
      }
    });

    if (process.env.CHECKOUT_SUCCESS_WEBHOOK_URL) {
      if (!isAllowedServerUrl(process.env.CHECKOUT_SUCCESS_WEBHOOK_URL)) {
        console.error("CHECKOUT_SUCCESS_WEBHOOK_URL is not allowed");
      } else {
        try {
          await fetch(process.env.CHECKOUT_SUCCESS_WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              event: event.type,
              customerEmail: session.customer_details?.email || session.customer_email,
              customerName: session.customer_details?.name,
              customerId: session.customer,
              subscriptionId: session.subscription,
              planId: session.metadata?.planId,
              planName: session.metadata?.planName,
              billing: session.metadata?.billing,
              sessionId: session.id,
              createdAt: new Date().toISOString()
            })
          });
        } catch (error) {
          console.error("Checkout success webhook failed", {
            message: error instanceof Error ? error.message : "Unknown checkout webhook error"
          });
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}

function verifyStripeSignature(payload: string, signatureHeader: string, secret: string) {
  const entries = signatureHeader.split(",").reduce<Record<string, string[]>>((acc, pair) => {
    const separatorIndex = pair.indexOf("=");

    if (separatorIndex === -1) {
      return acc;
    }

    const key = pair.slice(0, separatorIndex);
    const value = pair.slice(separatorIndex + 1);
    acc[key] = [...(acc[key] || []), value];

    return acc;
  }, {});
  const timestamp = entries.t?.[0];
  const signatures = entries.v1 || [];

  if (!timestamp || signatures.length === 0) {
    throw new Error("Stripe signature header is malformed.");
  }

  const timestampMs = Number(timestamp) * 1000;
  const toleranceMs = 5 * 60 * 1000;

  if (!Number.isFinite(timestampMs) || Math.abs(Date.now() - timestampMs) > toleranceMs) {
    throw new Error("Stripe signature timestamp is outside the allowed tolerance.");
  }

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`, "utf8")
    .digest("hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  const isMatch = signatures.some((signature) => {
    try {
      const signatureBuffer = Buffer.from(signature, "hex");

      return (
        expectedBuffer.length === signatureBuffer.length &&
        timingSafeEqual(expectedBuffer, signatureBuffer)
      );
    } catch {
      return false;
    }
  });

  if (!isMatch) {
    throw new Error("Stripe signature verification failed.");
  }
}
