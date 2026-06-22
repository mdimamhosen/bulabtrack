import { createFileRoute } from "@tanstack/react-router";
import { requireRole } from "@/lib/roles";
import { PortalLayout } from "@/components/layout/portal-layout";

export const Route = createFileRoute("/_authenticated/staff")({
  beforeLoad: async () => {
    await requireRole("staff");
  },
  component: StaffLayout,
});

function StaffLayout() {
  return <PortalLayout portalKind="staff" portalTitle="Staff Portal" />;
}
