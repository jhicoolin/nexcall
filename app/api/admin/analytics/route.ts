import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getTenantAnalytics, listTenants } from "@/lib/tenant-repository";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const [tenants, analytics] = await Promise.all([listTenants(), getTenantAnalytics()]);

  return NextResponse.json({ ok: true, tenants, analytics });
}
