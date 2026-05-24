import { NextResponse } from "next/server";
import { getOwnerEmail } from "@/lib/misato/auth";
import { runMisatoMockCommand } from "@/lib/misato/mock/data";
import { assertOwnerJson } from "@/lib/misato/owner-guard";

export async function POST(request: Request) {
  const unauthorized = await assertOwnerJson();
  if (unauthorized) return unauthorized;

  const owner = getOwnerEmail();
  if (!owner) return NextResponse.json({ ok: false, error: "OWNER_EMAIL is not configured." }, { status: 500 });

  const body = (await request.json().catch(() => ({}))) as { command?: string };
  const command = (body.command || "").trim();
  if (!command) return NextResponse.json({ ok: false, error: "Command is required." }, { status: 400 });

  const result = runMisatoMockCommand(command);
  return NextResponse.json({ ok: true, mode: "mock", result });
}
