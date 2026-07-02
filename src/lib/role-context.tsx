import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchUserRole, type Role } from "@/lib/roles";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Pick<
  Tables<"profiles">,
  "name" | "email" | "avatar_url" | "needs_password_change" | "status"
>;

type RoleContextValue = {
  role: Role | null;
  profile: Profile | null;
  loading: boolean;
  userId: string | null;
  isLoggedIn: boolean;
  setProfile: React.Dispatch<React.SetStateAction<Profile | null>>;
  refresh: () => Promise<void>;
};

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      setRole(null);
      setProfile(null);
      setUserId(null);
      setLoading(false);
      return;
    }

    setUserId(data.user.id);
    const [r, p] = await Promise.all([
      fetchUserRole(data.user.id),
      supabase
        .from("profiles")
        .select("name,email,avatar_url,needs_password_change,status")
        .eq("id", data.user.id)
        .maybeSingle(),
    ]);
    setRole(r);
    if (p.data) setProfile(p.data);
    setLoading(false);
  };

  useEffect(() => {
    refresh();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      refresh();
      if (session) {
        if (typeof window !== "undefined") {
          (window as any).__user_logged_in__ = true;
          localStorage.setItem("isLoggedIn", "true");
        }
      } else {
        if (typeof window !== "undefined") {
          (window as any).__user_logged_in__ = false;
          localStorage.setItem("isLoggedIn", "false");
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const isLoggedIn = !!userId;

  return (
    <RoleContext.Provider value={{ role, profile, loading, userId, isLoggedIn, setProfile, refresh }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
}
