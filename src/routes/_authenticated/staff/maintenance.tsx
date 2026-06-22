import { createFileRoute } from "@tanstack/react-router";
import { MaintenancePage } from "@/features/maintenance/maintenance-page";

export const Route = createFileRoute("/_authenticated/staff/maintenance")({
  component: MaintenancePage,
});
