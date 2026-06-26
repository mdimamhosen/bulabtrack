import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/features/dashboard/dashboard-page";

import { DashboardSkeleton } from "@/components/page-skeletons";

export const Route = createFileRoute("/_authenticated/customer/dashboard")({
  head: () => ({ meta: [{ title: "My Orders — LabTrack" }] }),
  component: () => <DashboardPage roleBase="/customer" />,
  pendingComponent: DashboardSkeleton,
});
