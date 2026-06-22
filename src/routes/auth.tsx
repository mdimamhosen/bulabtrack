import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock, User, Phone, Loader2, Boxes } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { fetchUserRole, dashboardPath } from "@/lib/roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — LabTrack Inventory" },
      { name: "description", content: "Secure access to the Computer Lab Peripheral Inventory Management System." },
    ],
  }),
  component: AuthPage,
});

const loginSchema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(6, "At least 6 characters").max(72),
  remember: z.boolean().optional(),
});

const signupSchema = z.object({
  name: z.string().trim().min(2, "Name required").max(80),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  password: z.string().min(8, "Min 8 chars").max(72),
});

function AuthPage() {
  const navigate = useNavigate();

  const navigateAfterAuth = async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    const role = await fetchUserRole(data.user.id);
    navigate({ to: dashboardPath(role) as never, replace: true });
  };

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        const role = await fetchUserRole(data.user.id);
        navigate({ to: dashboardPath(role) as never, replace: true });
      }
    });
  }, [navigate]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
      </div>
      <div className="grid min-h-screen lg:grid-cols-2">
        <div className="hidden flex-col justify-between p-12 lg:flex">
          <div className="flex items-center gap-2 text-foreground">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Boxes className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold tracking-tight">LabTrack</span>
          </div>
          <div className="max-w-md">
            <h1 className="text-5xl font-bold tracking-tight">
              Manage every <span className="gradient-text">peripheral</span> in your lab.
            </h1>
            <p className="mt-4 text-muted-foreground">
              A modern inventory system for keyboards, mice, monitors, printers and every device in between — built for staff and administrators.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-3 text-sm">
              {["Track devices", "Monitor status", "Calculate cost"].map((t) => (
                <div key={t} className="glass rounded-lg p-3 text-center">
                  <span className="text-muted-foreground">{t}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">© LabTrack Inventory System</p>
        </div>

        <div className="flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            <div className="mb-6 flex items-center gap-2 lg:hidden">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
                <Boxes className="h-4 w-4" />
              </div>
              <span className="font-semibold">LabTrack</span>
            </div>
            <div className="glass rounded-2xl p-6 shadow-xl">
              <Tabs defaultValue="login">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Sign in</TabsTrigger>
                  <TabsTrigger value="signup">Create account</TabsTrigger>
                </TabsList>
                <TabsContent value="login" className="pt-4">
                  <LoginForm onDone={navigateAfterAuth} />
                </TabsContent>
                <TabsContent value="signup" className="pt-4">
                  <SignupForm onDone={navigateAfterAuth} />
                </TabsContent>
              </Tabs>
            </div>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              The first account created becomes the admin.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoginForm({ onDone }: { onDone: () => void }) {
  const [loading, setLoading] = useState(false);
  const [forgot, setForgot] = useState(false);
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", remember: true },
  });

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back");
    onDone();
  };

  const sendReset = async () => {
    const email = form.getValues("email");
    if (!email) return toast.error("Enter your email first");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth`,
    });
    if (error) return toast.error(error.message);
    toast.success("Password reset email sent");
    setForgot(false);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="email" type="email" autoComplete="email" className="pl-9" placeholder="you@lab.edu" {...form.register("email")} />
        </div>
        {form.formState.errors.email && <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>}
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <button type="button" onClick={() => setForgot((v) => !v)} className="text-xs text-primary hover:underline">
            Forgot?
          </button>
        </div>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="password" type="password" autoComplete="current-password" className="pl-9" placeholder="••••••••" {...form.register("password")} />
        </div>
        {form.formState.errors.password && <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>}
      </div>
      {forgot && (
        <div className="rounded-md border border-border bg-secondary/40 p-3 text-sm">
          <p className="mb-2 text-muted-foreground">We'll email a reset link to the address above.</p>
          <Button type="button" size="sm" variant="secondary" onClick={sendReset}>Send reset link</Button>
        </div>
      )}
      <div className="flex items-center gap-2">
        <Checkbox id="remember" defaultChecked />
        <Label htmlFor="remember" className="text-sm font-normal text-muted-foreground">Remember me</Label>
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Sign in
      </Button>
    </form>
  );
}

function SignupForm({ onDone }: { onDone: () => void }) {
  const [loading, setLoading] = useState(false);
  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", phone: "", password: "" },
  });

  const onSubmit = async (values: z.infer<typeof signupSchema>) => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: `${window.location.origin}/customer/dashboard`,
        data: { name: values.name, phone: values.phone || null },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account created");
    onDone();
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="su-name">Full name</Label>
        <div className="relative">
          <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="su-name" className="pl-9" placeholder="Jane Doe" {...form.register("name")} />
        </div>
        {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="su-email">Email</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="su-email" type="email" className="pl-9" placeholder="you@lab.edu" {...form.register("email")} />
        </div>
        {form.formState.errors.email && <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="su-phone">Phone (optional)</Label>
        <div className="relative">
          <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="su-phone" className="pl-9" placeholder="+1 555 1234" {...form.register("phone")} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="su-password">Password</Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="su-password" type="password" className="pl-9" placeholder="At least 8 characters" {...form.register("password")} />
        </div>
        {form.formState.errors.password && <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Create account
      </Button>
    </form>
  );
}
