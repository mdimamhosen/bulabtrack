import { Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { RoleProvider, useRole } from "@/lib/role-context";
import { ThemeToggle } from "@/components/theme";
import { AccountOverlays } from "@/components/layout/account-overlays";
import { FloatingChatbot } from "@/components/layout/floating-chatbot";
import {
  PortalSidebar,
  adminNavItems,
  staffNavItems,
  customerNavItems,
  type NavItem,
} from "@/components/layout/portal-sidebar";
import { toast } from "sonner";

type PortalKind = "admin" | "staff" | "customer";

function AppShellInner({
  portalKind,
  portalTitle,
}: {
  portalKind: PortalKind;
  portalTitle: string;
}) {
  const navigate = useNavigate();
  const { role, profile, setProfile } = useRole();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const base = `/${portalKind}`;
  const navItems: NavItem[] =
    portalKind === "admin"
      ? adminNavItems(base)
      : portalKind === "staff"
        ? staffNavItems(base)
        : customerNavItems(base);

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth", replace: true });
  };

  const roleLabel = portalKind === "customer" ? "Customer" : (role ?? portalKind);
  const roleVariant =
    portalKind === "admin" ? "default" : portalKind === "staff" ? "secondary" : "outline";

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <PortalSidebar
        navItems={navItems}
        dashboardTo={`${base}/dashboard`}
        portalTitle={portalTitle}
        roleLabel={roleLabel}
        roleVariant={roleVariant}
        profile={profile}
        pathname={pathname}
        open={open}
        onClose={() => setOpen(false)}
        onSignOut={signOut}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-md lg:px-8">
          <button type="button" onClick={() => setOpen(true)} className="lg:hidden">
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden lg:block">
            <h2 className="text-sm text-muted-foreground">{portalTitle} • Peripheral Inventory</h2>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>

      <AccountOverlays profile={profile} onProfileUpdate={(p) => setProfile(p)} />
      <FloatingChatbot />
    </div>
  );
}

export function PortalLayout({
  portalKind,
  portalTitle,
}: {
  portalKind: PortalKind;
  portalTitle: string;
}) {
  return (
    <RoleProvider>
      <AppShellInner portalKind={portalKind} portalTitle={portalTitle} />
    </RoleProvider>
  );
}
