import { DashboardLayout } from "@/layouts/DashboardLayout";
import { Outlet } from "react-router-dom";
import {
  SquaresFour,
  Books,
  Brain,
  ChartLineUp,
  ShieldCheck,
} from "@phosphor-icons/react";

const reviewerSidebarItems = [
  { title: "Dashboard", url: "/reviewer/dashboard", icon: SquaresFour },
  { title: "Case library", url: "/reviewer/case-library", icon: Books },
  { title: "Case tracking", url: "/reviewer/case-tracking", icon: ChartLineUp },
  { title: "Compliance", url: "/reviewer/compliance", icon: ShieldCheck },
  { title: "Appeal", url: "/reviewer/appeal", icon: Brain },
];

export function ReviewerDashboard() {
  return (
    <DashboardLayout sidebarItems={reviewerSidebarItems} sidebarTitle="VidhanSeva">
      <Outlet />
    </DashboardLayout>
  );
}
