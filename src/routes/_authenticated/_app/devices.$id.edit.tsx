import { createFileRoute, redirect } from "@tanstack/react-router";
import { getCurrentUserRole, roleBasePath } from "@/lib/roles";

export const Route = createFileRoute("/_authenticated/_app/devices/$id/edit")({
  beforeLoad: async ({ params }) => {
    const role = await getCurrentUserRole();
    const base = roleBasePath(role);
    throw redirect({ to: `${base}/devices/${params.id}/edit` as never, replace: true });
  },
});
