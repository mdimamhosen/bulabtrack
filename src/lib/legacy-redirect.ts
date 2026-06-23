import { redirect } from "@tanstack/react-router";
import { getCurrentUserRole, roleBasePath, type Role } from "@/lib/roles";

function canAccessLegacyPath(role: Role | null, suffix: string): boolean {
  const adminOnly = ["/users", "/activity"];
  const adminStaffOnly = ["/orders"];

  if (adminOnly.some((p) => suffix === p || suffix.startsWith(p + "/"))) {
    return role === "admin";
  }
  if (adminStaffOnly.some((p) => suffix === p || suffix.startsWith(p + "/"))) {
    return role === "admin" || role === "staff";
  }
  if (suffix === "/devices/new" || (suffix.includes("/devices/") && suffix.endsWith("/edit"))) {
    return role === "admin";
  }
  return true;
}

export async function redirectLegacyPath(suffix: string) {
  const role = await getCurrentUserRole();
  const base = roleBasePath(role);

  if (!canAccessLegacyPath(role, suffix)) {
    throw redirect({ to: `${base}/dashboard` as never, replace: true });
  }

  const target = suffix ? `${base}${suffix}` : `${base}/dashboard`;
  throw redirect({ to: target as never, replace: true });
}
