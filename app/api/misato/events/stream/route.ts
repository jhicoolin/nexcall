import { GET as streamGet } from "../../../../events/stream/route";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return streamGet(request);
}
