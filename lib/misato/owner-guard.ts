import { NextResponse } from "next/server";
import { hasOwnerSession } from "@/lib/misato/auth";

export async function assertOwnerJson() {
  if (!(await hasOwnerSession())) {
    return NextResponse.json({ ok: false, error: "Owner authentication required." }, { status: 401 });
  }
  return null;
}
