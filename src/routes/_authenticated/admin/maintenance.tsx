import { createFileRoute } from "@tanstack/react-router";
import { MaintenancePage } from "@/features/maintenance/maintenance-page";

export const Route = createFileRoute("/_authenticated/admin/maintenance")({
  component: MaintenancePage,
});
