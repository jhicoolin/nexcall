import { assertOwnerJson } from "@/lib/misato/owner-guard";
import { misatoJson, misatoOptions } from "@/lib/misato/http/cors";

export function OPTIONS() {
  return misatoOptions();
}

export async function GET(request: Request) {
  const unauthorized = await assertOwnerJson(request);
  if (unauthorized) return unauthorized;
  return misatoJson({ ok: true, connected: false, mode: "mock", note: "Discord command center not connected in v1." });
}
