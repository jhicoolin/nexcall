import { NextResponse } from "next/server";
import { getClientById, getClientByPhone, normalizeClientPhone } from "@/lib/client-directory";
import { cleanIdentifier, readJsonObject, validationResponse } from "@/lib/security";

function isAuthorized(request: Request) {
  const token = process.env.CLIENT_DIRECTORY_READ_TOKEN;

  if (!token) {
    return process.env.NODE_ENV !== "production";
  }

  return request.headers.get("x-client-directory-token") === token;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized client lookup." }, { status: 401 });
  }

  let payload: Record<string, unknown>;

  try {
    payload = await readJsonObject(request, 3000);
  } catch (error) {
    return validationResponse(error);
  }

  const clientId = cleanIdentifier(payload.clientId, 80);
  const phoneNumber = normalizeClientPhone(payload.phoneNumber || payload.businessPhone || payload.to);
  const client = clientId ? await getClientById(clientId) : await getClientByPhone(phoneNumber);

  if (!client) {
    return NextResponse.json({ ok: false, error: "Client not found." }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    client: {
      id: client.id,
      businessName: client.businessName,
      twilioPhoneNumber: client.twilioPhoneNumber,
      phoneNumbers: client.phoneNumbers,
      timezone: client.timezone,
      greeting: client.greeting,
      escalationPhone: client.escalationPhone,
      crmProvider: client.crmProvider,
      calendarProvider: client.calendarProvider,
      huggingFaceModelId: client.huggingFaceModelId,
      speechToTextModelId: client.speechToTextModelId,
      llmModelId: client.llmModelId,
      hasVoiceAgentWebhook: Boolean(client.externalVoiceWebhookUrl),
      hasLeadWebhook: Boolean(client.leadWebhookUrl),
      hasCalendarWebhook: Boolean(client.calendarWebhookUrl)
    }
  });
}
