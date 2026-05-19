import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { findTenantById } from "@/lib/tenant-repository";
import { inngest } from "@/inngest/client";

async function postJson(url: string, payload: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Webhook rejected request with status ${response.status}.`);
  }

  return response;
}

export const calendarBookingRequested = inngest.createFunction(
  {
    id: "calendar-booking-requested",
    retries: 5,
    triggers: { event: "booking/calendar.requested" }
  },
  async ({ event, step }) => {
    const tenant = await step.run("load tenant", async () => findTenantById(event.data.tenantId));

    if (!tenant?.calendarWebhookUrl) {
      throw new Error("Tenant calendar webhook is not configured.");
    }

    await step.run("record pending delivery", async () => {
      if (!isDatabaseConfigured()) return null;

      return prisma.webhookDelivery.create({
        data: {
          tenantId: tenant.id,
          type: "calendar.booking",
          status: "PENDING",
          destinationUrl: tenant.calendarWebhookUrl,
          payload: event.data
        }
      });
    });

    await step.run("post to client calendar webhook", async () => postJson(tenant.calendarWebhookUrl, event.data));

    await step.run("mark booking success", async () => {
      if (!isDatabaseConfigured()) return null;

      await prisma.webhookDelivery.updateMany({
        where: {
          tenantId: tenant.id,
          type: "calendar.booking",
          status: "PENDING"
        },
        data: {
          status: "DELIVERED",
          attempts: { increment: 1 },
          deliveredAt: new Date()
        }
      });

      if (event.data.callSid) {
        await prisma.callLog.upsert({
          where: { callSid: String(event.data.callSid) },
          create: {
            tenantId: tenant.id,
            callSid: String(event.data.callSid),
            fromNumber: String(event.data.phone || ""),
            toNumber: tenant.assignedTwilioNumber,
            provider: tenant.voiceProvider,
            status: "COMPLETED",
            transcript: String(event.data.notes || ""),
            bookingSuccess: true,
            bookingPayload: event.data
          },
          update: {
            bookingSuccess: true,
            bookingPayload: event.data
          }
        });
      }

      return null;
    });

    return { ok: true, tenantId: tenant.id };
  }
);

export const postCallSummaryRequested = inngest.createFunction(
  {
    id: "post-call-summary-requested",
    retries: 5,
    triggers: { event: "call/summary.requested" }
  },
  async ({ event, step }) => {
    const tenant = await step.run("load tenant", async () => findTenantById(event.data.tenantId));

    if (!tenant) throw new Error("Tenant not found.");

    await step.run("persist call log", async () => {
      if (!isDatabaseConfigured()) return null;

      return prisma.callLog.upsert({
        where: { callSid: String(event.data.callSid) },
        create: {
          tenantId: tenant.id,
          callSid: String(event.data.callSid),
          fromNumber: String(event.data.fromNumber || ""),
          toNumber: String(event.data.toNumber || tenant.assignedTwilioNumber),
          provider: tenant.voiceProvider,
          status: "COMPLETED",
          durationSeconds: Number(event.data.durationSeconds || 0),
          transcript: String(event.data.transcript || ""),
          summary: String(event.data.summary || ""),
          bookingSuccess: Boolean(event.data.bookingSuccess),
          costCents: Number(event.data.costCents || 0),
          endedAt: new Date()
        },
        update: {
          status: "COMPLETED",
          durationSeconds: Number(event.data.durationSeconds || 0),
          transcript: String(event.data.transcript || ""),
          summary: String(event.data.summary || ""),
          bookingSuccess: Boolean(event.data.bookingSuccess),
          costCents: Number(event.data.costCents || 0),
          endedAt: new Date()
        }
      });
    });

    return { ok: true, tenantId: tenant.id };
  }
);

export const smsFollowupRequested = inngest.createFunction(
  {
    id: "sms-followup-requested",
    retries: 5,
    triggers: { event: "sms/followup.requested" }
  },
  async ({ event, step }) => {
    const tenant = await step.run("load tenant", async () => findTenantById(event.data.tenantId));

    if (!tenant?.smsWebhookUrl) {
      throw new Error("Tenant SMS webhook is not configured.");
    }

    await step.run("post sms workflow webhook", async () => postJson(tenant.smsWebhookUrl, event.data));

    return { ok: true, tenantId: tenant.id };
  }
);

export const functions = [calendarBookingRequested, postCallSummaryRequested, smsFollowupRequested];
