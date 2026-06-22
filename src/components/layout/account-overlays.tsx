import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Lock, Loader2, LogOut, ShieldAlert } from "lucide-react";
import { updatePassword } from "@/lib/api/auth.functions";
import { updateProfile } from "@/lib/api/profiles.functions";
import { clearToken } from "@/lib/auth/auth.client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { Profile } from "@/lib/db/types";

type ProfileSummary = Pick<
  Profile,
  "name" | "email" | "avatar_url" | "needs_password_change" | "status"
>;

export function AccountOverlays({
  profile,
  onProfileUpdate,
}: {
  profile: ProfileSummary | null;
  onProfileUpdate: (profile: ProfileSummary) => void;
}) {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const signOut = async () => {
    clearToken();
    toast.success("Signed out");
    navigate({ to: "/auth", replace: true });
  };

  const handleEnforcedPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      return toast.error("Please fill in all fields");
    }
    if (newPassword.length < 8) {
      return toast.error("Password must be at least 8 characters");
    }
    if (newPassword !== confirmPassword) {
      return toast.error("Passwords do not match");
    }

    setUpdatingPassword(true);
    try {
      await updatePassword({ data: { password: newPassword } });
      await updateProfile({ data: { needs_password_change: false } });

      toast.success("Password changed successfully!");
      onProfileUpdate({ ...profile!, needs_password_change: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update password";
      toast.error(message);
    } finally {
      setUpdatingPassword(false);
    }
  };

  const mustChangePassword = profile?.needs_password_change === true;
  const isDeactivated = profile?.status === "inactive";

  return (
    <>
      {isDeactivated && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-md rounded-2xl border border-destructive/30 bg-card p-6 shadow-glow animate-in zoom-in-95 duration-300 text-center">
            <div className="p-3 bg-destructive/15 rounded-full text-destructive border border-destructive/20 w-fit mx-auto mb-4">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Account Deactivated</h3>
            <p className="text-xs text-muted-foreground mt-2 mb-6 leading-relaxed">
              Your account has been deactivated or blocked by an administrator. Please reach out to administrative support if you believe this is in error.
            </p>
            <Button onClick={signOut} variant="destructive" className="w-full rounded-xl font-semibold text-xs h-9">
              <LogOut className="mr-1.5 h-3.5 w-3.5" /> Sign Out & Exit
            </Button>
          </div>
        </div>
      )}

      {mustChangePassword && !isDeactivated && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-glow animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center gap-2 mb-4">
              <div className="p-3 bg-warning/15 rounded-full text-warning border border-warning/20">
                <Lock className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Password Update Required</h3>
              <p className="text-xs text-muted-foreground">
                For security reasons, your administrator requires you to change your password before using the LabTrack portal.
              </p>
            </div>
            <form onSubmit={handleEnforcedPasswordChange} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">New Password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-9 glass-input text-xs"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Confirm Password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-9 glass-input text-xs"
                    required
                  />
                </div>
              </div>
              <Button type="submit" disabled={updatingPassword} className="w-full rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold text-xs h-9">
                {updatingPassword && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                Change Password & Proceed
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
