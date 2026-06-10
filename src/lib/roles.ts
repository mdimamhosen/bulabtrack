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
