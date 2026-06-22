import { createFileRoute } from "@tanstack/react-router";
import { requireRole } from "@/lib/roles";
import { PortalLayout } from "@/components/layout/portal-layout";

export const Route = createFileRoute("/_authenticated/customer")({
  beforeLoad: async () => {
    await requireRole("customer");
  },
  component: CustomerLayout,
});

function CustomerLayout() {
  return <PortalLayout portalKind="customer" portalTitle="Customer Portal" />;
}
