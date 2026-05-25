import { assertOwnerJson } from "@/lib/misato/owner-guard";
import { misatoJson, misatoOptions } from "@/lib/misato/http/cors";

export function OPTIONS() {
  return misatoOptions();
}

export async function GET(request: Request) {
  const unauthorized = await assertOwnerJson(request);
  if (unauthorized) {
    return misatoJson(
      {
        ok: false,
        auth: "invalid",
        error: "unauthorized",
        timestamp: new Date().toISOString()
      },
      { status: 401 }
    );
  }

  return misatoJson({
    ok: true,
    service: "MISATO",
    mode: "mock-safe",
    ownerOnly: true,
    auth: "valid",
    timestamp: new Date().toISOString()
  });
}
