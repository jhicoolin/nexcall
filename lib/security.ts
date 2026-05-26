import { NextResponse } from "next/server";

export type JsonObject = Record<string, unknown>;

export class RequestValidationError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function readJsonObject(request: Request, maxBytes = 12000): Promise<JsonObject> {
  const contentType = request.headers.get("content-type") || "";

  if (!contentType.toLowerCase().includes("application/json")) {
    throw new RequestValidationError("Expected application/json.", 415);
  }

  const body = await request.text();

  if (!body.trim()) {
    throw new RequestValidationError("Request body is required.");
  }

  if (new TextEncoder().encode(body).length > maxBytes) {
    throw new RequestValidationError("Request body is too large.", 413);
  }

  try {
    const parsed = JSON.parse(body) as unknown;

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new RequestValidationError("JSON body must be an object.");
    }

    return parsed as JsonObject;
  } catch (error) {
    if (error instanceof RequestValidationError) {
      throw error;
    }

    throw new RequestValidationError("Invalid JSON body.");
  }
}

export function cleanText(value: unknown, maxLength = 500) {
  if (typeof value !== "string") return "";

  return value
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function cleanIdentifier(value: unknown, maxLength = 80) {
  return cleanText(value, maxLength).replace(/[^a-zA-Z0-9_.:-]/g, "-");
}

export function isHoneypotTriggered(
  payload: Record<string, unknown>,
  fields = ["companyWebsiteConfirm", "websiteConfirm", "website"]
) {
  return fields.some((field) => cleanText(payload[field], 120).length > 0);
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

export function isValidPhone(value: string) {
  const normalized = value.replace(/[^\d+]/g, "");
  return normalized.length >= 7 && normalized.length <= 20;
}

export function isAllowedServerUrl(value: string) {
  try {
    const url = new URL(value);
    const isLocal = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);

    return url.protocol === "https:" || (process.env.NODE_ENV !== "production" && isLocal);
  } catch {
    return false;
  }
}

export function getSafeSiteOrigin(request: Request) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;

  if (configured && isAllowedServerUrl(configured)) {
    return configured.replace(/\/$/, "");
  }

  const origin = request.headers.get("origin") || "";

  if (origin && isAllowedServerUrl(origin)) {
    return origin.replace(/\/$/, "");
  }

  // Use the request's own host as fallback before reaching for a hardcoded default.
  const host = request.headers.get("host") || "";
  if (host) {
    const proto = process.env.NODE_ENV === "production" ? "https" : "http";
    return `${proto}://${host}`;
  }

  return `http://127.0.0.1:3010`;
}

export function validationResponse(error: unknown) {
  if (error instanceof RequestValidationError) {
    return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
  }

  return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
}
