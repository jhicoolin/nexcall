import { NextResponse } from "next/server";
import { assertOwnerJson } from "@/lib/misato/owner-guard";
import { updateTask } from "@/lib/misato/runtime/service";
import { misatoOptionsResponse, withMisatoCors } from "@/lib/misato/http/cors";

export const runtime = "nodejs";
export async function OPTIONS(request: Request) { return misatoOptionsResponse(request); }
export async function POST(request: Request) {
  const unauthorized = await assertOwnerJson(request);
  if (unauthorized) return withMisatoCors(unauthorized, request);
  const body = await request.json().catch(() => ({})) as { taskId?: string; id?: string; payload?: Record<string, unknown> };
  // app.js sends { taskId, payload }. Normalise to { id, ...fields } for updateTask().
  // Also accept flat { id, ...fields } for direct callers.
  const taskId = body.taskId || body.id || "";
  const patch  = body.payload || (({ taskId: _t, id: _i, ...rest }) => rest)(body as any);
  const result = updateTask({ ...patch, id: taskId });
  return withMisatoCors(NextResponse.json(result, { status: result.ok ? 200 : 404 }), request);
}
