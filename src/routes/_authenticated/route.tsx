import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";
import { getAuthUser } from "@/lib/api/auth.functions";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { user } = await getAuthUser({});
    if (!user) throw redirect({ to: "/auth" });
    return { user };
  },
  component: () => <Outlet />,
});
