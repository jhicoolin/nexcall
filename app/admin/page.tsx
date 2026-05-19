import { redirect } from "next/navigation";
import { hasAdminSession } from "@/lib/admin-auth";
import AdminDashboard from "@/app/admin/AdminDashboard";

export default async function AdminPage() {
  if (!(await hasAdminSession())) {
    redirect("/admin/login");
  }

  return <AdminDashboard />;
}
