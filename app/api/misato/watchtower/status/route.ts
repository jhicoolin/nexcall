import { assertOwnerJson } from "@/lib/misato/owner-guard";
import { getWatchtowerStatus } from "@/lib/misato/watchtower/uptimeKumaClient";
import { misatoJson, misatoOptions } from "@/lib/misato/http/cors";

export function OPTIONS() {
  return misatoOptions();
}

export async function GET(request: Request) {
  const unauthorized = await assertOwnerJson(request);
  if (unauthorized) return unauthorized;

  const data = await getWatchtowerStatus();
  return misatoJson(data);
}
