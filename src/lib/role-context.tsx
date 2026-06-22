import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getAuthUser } from "@/lib/api/auth.functions";
import type { Role } from "@/lib/roles";
import type { Profile } from "@/lib/db/types";

type ProfileSummary = Pick<
  Profile,
  "name" | "email" | "avatar_url" | "needs_password_change" | "status"
>;

type RoleContextValue = {
  role: Role | null;
  profile: ProfileSummary | null;
  loading: boolean;
  userId: string | null;
  setProfile: React.Dispatch<React.SetStateAction<ProfileSummary | null>>;
  refresh: () => Promise<void>;
};

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role | null>(null);
  const [profile, setProfile] = useState<ProfileSummary | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    const { user, role: r, profile: p } = await getAuthUser({});
    if (!user) {
      setRole(null);
      setProfile(null);
      setUserId(null);
      setLoading(false);
      return;
    }

    setUserId(user.id);
    setRole(r);
    if (p) {
      setProfile({
        name: p.name,
        email: p.email,
        avatar_url: p.avatar_url,
        needs_password_change: p.needs_password_change,
        status: p.status,
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <RoleContext.Provider value={{ role, profile, loading, userId, setProfile, refresh }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
}
