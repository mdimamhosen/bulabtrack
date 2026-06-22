import { createFileRoute } from "@tanstack/react-router";
import { requireRole } from "@/lib/roles";
import { PortalLayout } from "@/components/layout/portal-layout";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    await requireRole("admin");
  },
  component: AdminLayout,
});

function AdminLayout() {
  return <PortalLayout portalKind="admin" portalTitle="Administrator Portal" />;
}
