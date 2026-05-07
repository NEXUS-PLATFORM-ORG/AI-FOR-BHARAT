import { DashboardLayout } from "@/layouts/DashboardLayout";
import { Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Clock,
  ShieldAlert,
  ScrollText,
} from "lucide-react";

const adminSidebarItems = [
  { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Departments", url: "/admin/departments", icon: Building2 },
  { title: "Deadlines", url: "/admin/deadlines", icon: Clock },
  { title: "Risk Analysis", url: "/admin/risk-analysis", icon: ShieldAlert },
  { title: "Audit Logs", url: "/admin/audit-logs", icon: ScrollText },
];

export function AdminDashboard() {
  return (
    <DashboardLayout
      sidebarItems={adminSidebarItems}
      sidebarTitle="VidhanSeva"
      userRole="Administrator"
    >
      <Outlet />
    </DashboardLayout>
  );
}
