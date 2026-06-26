import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/features/dashboard/dashboard-page";

import { DashboardSkeleton } from "@/components/page-skeletons";

export const Route = createFileRoute("/_authenticated/admin/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — LabTrack" }] }),
  component: () => <DashboardPage roleBase="/admin" />,
  pendingComponent: DashboardSkeleton,
});
