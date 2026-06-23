import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Cpu,
  Wrench,
  BarChart3,
  Users,
  Activity,
  Settings,
  ShoppingBag,
  Globe,
  Boxes,
  X,
} from "lucide-react";

export type NavItem = { to: string; label: string; icon: LucideIcon };

export const adminNavItems = (base: string): NavItem[] => [
  { to: `${base}/dashboard`, label: "Dashboard", icon: LayoutDashboard },
  { to: `${base}/devices`, label: "Devices", icon: Cpu },
  { to: `${base}/orders`, label: "Orders", icon: ShoppingBag },
  { to: `${base}/maintenance`, label: "Maintenance", icon: Wrench },
  { to: `${base}/reports`, label: "Reports", icon: BarChart3 },
  { to: `${base}/users`, label: "Users", icon: Users },
  { to: `${base}/activity`, label: "Activity", icon: Activity },
  { to: `${base}/settings`, label: "Settings", icon: Settings },
];

export const staffNavItems = (base: string): NavItem[] => [
  { to: `${base}/dashboard`, label: "Dashboard", icon: LayoutDashboard },
  { to: `${base}/devices`, label: "Devices", icon: Cpu },
  { to: `${base}/orders`, label: "Orders", icon: ShoppingBag },
  { to: `${base}/maintenance`, label: "Maintenance", icon: Wrench },
  { to: `${base}/reports`, label: "Reports", icon: BarChart3 },
  { to: `${base}/settings`, label: "Settings", icon: Settings },
];

export const customerNavItems = (base: string): NavItem[] => [
  { to: `${base}/dashboard`, label: "My Orders", icon: LayoutDashboard },
  { to: "/products", label: "Storefront", icon: Globe },
  { to: `${base}/settings`, label: "Settings", icon: Settings },
];

export function PortalSidebar({
  navItems,
  dashboardTo,
  portalTitle,
  roleLabel,
  roleVariant,
  profile,
  pathname,
  open,
  onClose,
  onSignOut,
}: {
  navItems: NavItem[];
  dashboardTo: string;
  portalTitle: string;
  roleLabel: string;
  roleVariant: "default" | "secondary" | "outline";
  profile: { name?: string; email?: string; avatar_url?: string | null } | null;
  pathname: string;
  open: boolean;
  onClose: () => void;
  onSignOut: () => void;
}) {
  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-sidebar-border bg-sidebar transition-transform lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-5">
          <Link to={dashboardTo as never} className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Boxes className="h-4 w-4" />
            </div>
            <span className="font-semibold tracking-tight">LabTrack</span>
          </Link>
          <button type="button" className="lg:hidden" onClick={onClose} aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          {navItems.map((item) => {
            const active = pathname === item.to || pathname.startsWith(item.to + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to as never}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground font-bold shadow-sm"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 w-full border-t border-sidebar-border p-3">
          <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent p-3">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
              {(profile?.name ?? "U").slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{profile?.name ?? "Loading…"}</p>
              <p className="truncate text-xs text-muted-foreground">{profile?.email}</p>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold capitalize border ${
                roleVariant === "default"
                  ? "bg-primary text-primary-foreground"
                  : roleVariant === "secondary"
                    ? "bg-secondary text-secondary-foreground"
                    : "border-accent text-accent"
              }`}
            >
              {roleLabel}
            </span>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-sidebar-border bg-sidebar px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
          >
            Sign out
          </button>
        </div>
      </aside>
      {open && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={onClose} />}
    </>
  );
}
