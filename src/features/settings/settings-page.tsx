import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { getCurrentProfile, updateProfile } from "@/lib/api/profiles.functions";
import { changeEmail, updatePassword } from "@/lib/api/auth.functions";
import { uploadImage } from "@/lib/api/storage.functions";
import {
  User, Lock, Mail, Camera, Phone, Shield, Bell, Sparkles,
  CheckCircle2, AlertCircle, Loader2, Save, KeyRound
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const PRESET_AVATARS = [
  { name: "Scholar Female", url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80" },
  { name: "Scholar Male", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80" },
  { name: "Researcher Female", url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80" },
  { name: "Researcher Male", url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80" }
];

export function SettingsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("profile");

  // Form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Preference states
  const [reqNotifications, setReqNotifications] = useState(true);
  const [securityNotifications, setSecurityNotifications] = useState(true);
  const [systemNotifications, setSystemNotifications] = useState(false);

  // Fetch current user details & profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ["current-profile"],
    queryFn: async () => getCurrentProfile({}),
  });

  // Sync form states with database query results
  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setPhone(profile.phone || "");
      setAvatarUrl(profile.avatar_url || "");
      setEmail(profile.authEmail || "");
    }
  }, [profile]);

  // Mutation to save name, phone, and avatar changes
  const saveProfileMutation = useMutation({
    mutationFn: async () => {
      await updateProfile({
        data: {
          name: name.trim(),
          phone: phone.trim(),
          avatar_url: avatarUrl,
        },
      });
    },
    onSuccess: () => {
      toast.success("Profile saved successfully");
      queryClient.invalidateQueries({ queryKey: ["current-profile"] });
      // Invalidate navbar sidebar profile query
      queryClient.invalidateQueries({ queryKey: ["public-products"] }); 
      // Invalidate the auth shell queries
      window.location.reload(); // Refresh to propagate sidebar updates smoothly
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update profile");
    }
  });

  // Mutation to change account email
  const changeEmailMutation = useMutation({
    mutationFn: async () => {
      if (email.trim() === profile?.authEmail) {
        throw new Error("This is already your current email address.");
      }
      await changeEmail({ data: { email: email.trim() } });
    },
    onSuccess: () => {
      toast.success("Email updated successfully.");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to initiate email change");
    }
  });

  // Mutation to update password
  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      if (newPassword.length < 6) {
        throw new Error("Password must be at least 6 characters long.");
      }
      if (newPassword !== confirmPassword) {
        throw new Error("Passwords do not match.");
      }
      await updatePassword({ data: { password: newPassword } });
    },
    onSuccess: () => {
      toast.success("Password updated successfully");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to change password");
    }
  });

  // Handles Profile Image Custom Upload (with Base64 fallback if storage bucket is missing)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Profile images must be under 2MB.");
      return;
    }

    setIsUploading(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          const encoded = result.split(",")[1];
          if (!encoded) reject(new Error("Failed to read image"));
          else resolve(encoded);
        };
        reader.onerror = () => reject(new Error("Failed to read image"));
        reader.readAsDataURL(file);
      });

      try {
        const { url } = await uploadImage({
          data: {
            bucket: "avatars",
            fileName: file.name,
            contentType: file.type,
            base64,
          },
        });
        setAvatarUrl(url);
        toast.success("Image uploaded successfully");
      } catch {
        setAvatarUrl(`data:${file.type};base64,${base64}`);
        toast.success("Image loaded successfully (Base64 fallback active)");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground">Loading configurations...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground to-foreground/60 bg-clip-text text-transparent">
          Account Settings
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Manage your personal details, security preferences, and dashboard configurations.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[240px_1fr] items-start">
        {/* Navigation Sidebar */}
        <aside className="flex flex-col gap-1">
          {[
            { id: "profile", label: "Profile Details", icon: User },
            { id: "security", label: "Security & Login", icon: Shield },
            { id: "preferences", label: "System Preferences", icon: Bell }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-3 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all text-left cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-glow"
                    : "text-muted-foreground hover:bg-card/45 hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </aside>

        {/* Content Tabs */}
        <div className="space-y-6">
          
          {/* PROFILE DETAILS TAB */}
          {activeTab === "profile" && (
            <Card className="liquid-card border-border/60 shadow-xl rounded-2xl">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" /> Profile Details
                </CardTitle>
                <CardDescription>
                  Update your display name, telephone, and avatar thumbnail.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Profile Image / Avatar Picker */}
                <div className="space-y-4">
                  <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Profile Image</Label>
                  <div className="flex flex-col sm:flex-row gap-5 items-center">
                    
                    {/* Visual Avatar Preview */}
                    <div className="relative group h-20 w-20 rounded-full border border-border/80 overflow-hidden bg-zinc-950 flex items-center justify-center shrink-0">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-2xl font-black text-zinc-500">
                          {(name || "U").slice(0, 1).toUpperCase()}
                        </span>
                      )}
                      
                      {/* Image Upload Trigger */}
                      <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-[10px] text-white font-bold select-none">
                        <Camera className="h-4 w-4 mb-0.5" />
                        CHANGE
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={isUploading}
                        />
                      </label>
                      {isUploading && (
                        <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        </div>
                      )}
                    </div>

                    {/* Presets and Upload guidelines */}
                    <div className="space-y-2 flex-1 w-full text-center sm:text-left">
                      <p className="text-xs text-muted-foreground">
                        Select a premium scholar preset avatar below, or hover to upload a custom JPG/PNG image.
                      </p>
                      
                      {/* Presets Row */}
                      <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                        {PRESET_AVATARS.map((p) => (
                          <button
                            key={p.name}
                            type="button"
                            onClick={() => { setAvatarUrl(p.url); toast.info(`Selected Preset: ${p.name}`); }}
                            className={`h-9 w-9 rounded-full overflow-hidden border-2 cursor-pointer transition-all hover:scale-105 ${
                              avatarUrl === p.url ? "border-primary scale-[1.03]" : "border-border/60 opacity-70 hover:opacity-100"
                            }`}
                          >
                            <img src={p.url} alt={p.name} className="h-full w-full object-cover" />
                          </button>
                        ))}
                        {avatarUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            type="button"
                            onClick={() => setAvatarUrl(null)}
                            className="h-9 px-3 rounded-xl border border-dashed border-rose-500/30 text-rose-500 hover:bg-rose-500/10 text-[10px]"
                          >
                            Clear Photo
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Inputs */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="display-name" className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Display Name
                    </Label>
                    <Input
                      id="display-name"
                      placeholder="e.g. Dr. Alex Vance"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="glass-input h-10 px-3 text-sm rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone-number" className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Phone Number
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                      <Input
                        id="phone-number"
                        placeholder="+1 (555) 123-4567"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="glass-input pl-10 h-10 px-3 text-sm rounded-xl"
                      />
                    </div>
                  </div>
                </div>

              </CardContent>
              <CardFooter className="border-t border-border/10 pt-4 flex justify-end">
                <Button
                  onClick={() => saveProfileMutation.mutate()}
                  disabled={saveProfileMutation.isPending}
                  className="bg-gradient-to-r from-primary to-accent text-primary-foreground font-bold rounded-xl h-10 px-5 shadow-glow"
                >
                  {saveProfileMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" /> Save Profile Details
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* SECURITY & LOGIN TAB */}
          {activeTab === "security" && (
            <div className="space-y-6">
              
              {/* Email Address Update Card */}
              <Card className="liquid-card border-border/60 shadow-xl rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Mail className="h-5 w-5 text-primary" /> Email Authentication
                  </CardTitle>
                  <CardDescription>
                    Change your linked email address.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="email-input" className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                        Email Address
                      </Label>
                      {profile?.emailConfirmedAt ? (
                        <Badge className="bg-success/15 border-none text-success text-[10px] font-bold py-0.5 px-2 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Verified
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-500/15 border-none text-amber-500 text-[10px] font-bold py-0.5 px-2 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> Pending Verification
                        </Badge>
                      )}
                    </div>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                      <Input
                        id="email-input"
                        type="email"
                        placeholder="your@school.edu"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="glass-input pl-10 h-10 px-3 text-sm rounded-xl"
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-relaxed pt-1">
                      ⚠️ Note: Your email is updated immediately in local MongoDB mode (no verification email is sent).
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="border-t border-border/10 pt-4 flex justify-end">
                  <Button
                    onClick={() => changeEmailMutation.mutate()}
                    disabled={changeEmailMutation.isPending}
                    variant="outline"
                    className="border-primary text-primary hover:bg-primary/5 rounded-xl h-10 px-5"
                  >
                    {changeEmailMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...
                      </>
                    ) : (
                      <>Update Authentication Email</>
                    )}
                  </Button>
                </CardFooter>
              </Card>

              {/* Password Change Card */}
              <Card className="liquid-card border-border/60 shadow-xl rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <KeyRound className="h-5 w-5 text-primary" /> Credentials Password
                  </CardTitle>
                  <CardDescription>
                    Change your account password.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="new-pwd" className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                        New Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                        <Input
                          id="new-pwd"
                          type="password"
                          placeholder="••••••••"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="glass-input pl-10 h-10 px-3 text-sm rounded-xl"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-pwd" className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                        Confirm New Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                        <Input
                          id="confirm-pwd"
                          type="password"
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="glass-input pl-10 h-10 px-3 text-sm rounded-xl"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t border-border/10 pt-4 flex justify-end">
                  <Button
                    onClick={() => changePasswordMutation.mutate()}
                    disabled={changePasswordMutation.isPending}
                    className="bg-primary text-primary-foreground font-bold rounded-xl h-10 px-5 shadow-glow"
                  >
                    {changePasswordMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
                      </>
                    ) : (
                      <>Change Password</>
                    )}
                  </Button>
                </CardFooter>
              </Card>

            </div>
          )}

          {/* PREFERENCES & SYSTEM TAB */}
          {activeTab === "preferences" && (
            <Card className="liquid-card border-border/60 shadow-xl rounded-2xl">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" /> System Preferences
                </CardTitle>
                <CardDescription>
                  Configure dashboard notifications and telemetry settings.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Telemetry notification triggers */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Notification Channels</h4>
                  
                  {/* Option 1 */}
                  <div className="flex items-center justify-between border-b border-border/10 pb-4">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-semibold">Requisition Approvals</Label>
                      <p className="text-xs text-muted-foreground max-w-md">
                        Receive instant notifications when your department requisitions are approved, returned, or completed.
                      </p>
                    </div>
                    <Switch
                      checked={reqNotifications}
                      onCheckedChange={setReqNotifications}
                    />
                  </div>

                  {/* Option 2 */}
                  <div className="flex items-center justify-between border-b border-border/10 pb-4">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-semibold">Telemetry Calibration Logs</Label>
                      <p className="text-xs text-muted-foreground max-w-md">
                        Email alerts when a connected classroom peripheral reports device maintenance warnings or telemetry sync failure.
                      </p>
                    </div>
                    <Switch
                      checked={systemNotifications}
                      onCheckedChange={setSystemNotifications}
                    />
                  </div>

                  {/* Option 3 */}
                  <div className="flex items-center justify-between pb-2">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-semibold">Security & Audit logs</Label>
                      <p className="text-xs text-muted-foreground max-w-md">
                        Get notified when new admin roles are assigned or devices are permanently disposed of.
                      </p>
                    </div>
                    <Switch
                      checked={securityNotifications}
                      onCheckedChange={setSecurityNotifications}
                    />
                  </div>

                </div>

                {/* Info Note */}
                <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-xl p-3 text-primary text-xs">
                  <Sparkles className="h-4 w-4 shrink-0 animate-pulse" />
                  <span>These settings sync automatically to your local browser storage.</span>
                </div>

              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}
