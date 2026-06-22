import { redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export type Role = "admin" | "staff";

export async function fetchUserRole(userId: string): Promise<Role | null> {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();
  return (data?.role as Role) ?? null;
}

export function roleBasePath(role: Role | null): string {
  if (role === "admin") return "/admin";
  if (role === "staff") return "/staff";
  return "/customer";
}

export function dashboardPath(role: Role | null): string {
  return `${roleBasePath(role)}/dashboard`;
}

export async function getCurrentUserRole(): Promise<Role | null> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  return fetchUserRole(data.user.id);
}

export async function requireRole(expected: Role | "customer"): Promise<Role | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw redirect({ to: "/auth" });

  const role = await fetchUserRole(data.user.id);

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
