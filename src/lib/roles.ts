import { redirect } from "@tanstack/react-router";
import { getAuthUser } from "@/lib/api/auth.functions";
import type { AppRole } from "@/lib/db/types";

export type Role = AppRole;

export function roleBasePath(role: Role | null): string {
  if (role === "admin") return "/admin";
  if (role === "staff") return "/staff";
  return "/customer";
}

export function dashboardPath(role: Role | null): string {
  return `${roleBasePath(role)}/dashboard`;
}

export async function getCurrentUserRole(): Promise<Role | null> {
  const { user, role } = await getAuthUser({});
  if (!user) return null;
  return role;
}

export async function requireRole(expected: Role | "customer"): Promise<Role | null> {
  const { user, role } = await getAuthUser({});
  if (!user) throw redirect({ to: "/auth" });

  if (expected === "customer") {
    if (role !== null) {
      throw redirect({ to: dashboardPath(role), replace: true });
    }
    return null;
  }

  if (role !== expected) {
    throw redirect({ to: dashboardPath(role), replace: true });
  }

  return role;
}
