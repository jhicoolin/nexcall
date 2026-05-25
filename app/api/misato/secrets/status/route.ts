import { assertOwnerJson } from "@/lib/misato/owner-guard";
import { readRedactedGitleaksSummary } from "@/lib/misato/secrets/gitleaksParser";
import { misatoJson, misatoOptions } from "@/lib/misato/http/cors";

export function OPTIONS() {
  return misatoOptions();
}

export async function GET(request: Request) {
  const unauthorized = await assertOwnerJson(request);
  if (unauthorized) return unauthorized;

  return misatoJson(readRedactedGitleaksSummary());
}
