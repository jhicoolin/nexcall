import { notFound } from "next/navigation";
import { hasAdminSession } from "@/lib/admin-auth";
import AdminDashboard from "@/app/admin/AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await hasAdminSession())) {
    notFound();
  }

  return <AdminDashboard />;
}
