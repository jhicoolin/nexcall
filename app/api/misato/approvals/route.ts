import { NextResponse } from "next/server";
import { assertOwnerJson } from "@/lib/misato/owner-guard";
import { getRuntimeSnapshot, resolveApproval } from "@/lib/misato/runtime/service";
import { misatoOptionsResponse, withMisatoCors } from "@/lib/misato/http/cors";

export const runtime = "nodejs";

export async function OPTIONS(request: Request) {
  return misatoOptionsResponse(request);
}

export async function GET(request: Request) {
  try {
    const unauthorized = await assertOwnerJson(request);
    if (unauthorized) return withMisatoCors(unauthorized, request);
    const { approvals } = getRuntimeSnapshot();
    const items = approvals || [];

    const stats = {
      pending: items.filter((a: any) => String(a.status).toLowerCase() === "pending").length,
      approved: items.filter((a: any) => String(a.status).toLowerCase() === "approved").length,
      rejected: items.filter((a: any) => String(a.status).toLowerCase() === "rejected").length,
      deferred: items.filter((a: any) => String(a.status).toLowerCase() === "deferred").length,
      superseded: items.filter((a: any) => String(a.status).toLowerCase() === "superseded").length
    };

    return withMisatoCors(
      NextResponse.json({ ok: true, items, stats, mode: "approval-gate" }),
      request
    );
  } catch (err) {
    return withMisatoCors(
      NextResponse.json({ ok: false, error: "approvals_fetch_failed", message: String(err) }, { status: 500 }),
      request
    );
  }
}

export async function POST(request: Request) {
  try {
    const unauthorized = await assertOwnerJson(request);
    if (unauthorized) return withMisatoCors(unauthorized, request);

    const body = (await request.json().catch(() => ({}))) as {
      approvalId?: string;
      decision?: "approved" | "rejected";
      resolvedBy?: string;
    };

    const approvalId = (body.approvalId || "").trim();
    const decision = body.decision;
    if (!approvalId || (decision !== "approved" && decision !== "rejected")) {
      return withMisatoCors(
        NextResponse.json({ ok: false, error: "invalid_request", hint: "approvalId and decision (approved|rejected) are required." }, { status: 400 }),
        request
      );
    }

    const result = resolveApproval(approvalId, decision, body.resolvedBy || "owner");
    if (!result.ok) {
      return withMisatoCors(NextResponse.json(result, { status: 404 }), request);
    }

    return withMisatoCors(NextResponse.json(result), request);
  } catch (err) {
    return withMisatoCors(
      NextResponse.json({ ok: false, error: "approval_action_failed", message: String(err) }, { status: 500 }),
      request
    );
  }
}