import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line,
} from "recharts";
import {
  Boxes, CheckCircle2, Wrench, ArrowUpRight, DollarSign, PackageX,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — LabTrack" }] }),
  component: Dashboard,
});

const STATUS_COLORS: Record<string, string> = {
  Available: "var(--color-success)",
  "In Use": "var(--color-primary)",
  "Under Maintenance": "var(--color-warning)",
  Damaged: "var(--color-destructive)",
  Disposed: "var(--color-muted-foreground)",
};

function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const { data: devices, error } = await supabase
        .from("devices")
        .select("id,name,brand,model,category,price,quantity,status,created_at");
      if (error) throw error;
      return devices ?? [];
    },
  });

  const devices = data ?? [];
  const total = devices.length;
  const totalUnits = devices.reduce((s, d) => s + (d.quantity ?? 0), 0);
  const available = devices.filter((d) => d.status === "Available").length;
  const maintenance = devices.filter((d) => d.status === "Under Maintenance").length;
  const inUse = devices.filter((d) => d.status === "In Use").length;
  const damaged = devices.filter((d) => d.status === "Damaged").length;
  const grand = devices.reduce((s, d) => s + Number(d.price) * (d.quantity ?? 1), 0);

  const byCategory = Object.entries(
    devices.reduce<Record<string, number>>((acc, d) => {
      acc[d.category] = (acc[d.category] ?? 0) + (d.quantity ?? 1);
      return acc;
    }, {}),
  ).map(([name, value]) => ({ name, value }));

  const byStatus = ["Available", "In Use", "Under Maintenance", "Damaged", "Disposed"].map((s) => ({
    name: s,
    count: devices.filter((d) => d.status === s).length,
  }));

  const monthly = Array.from({ length: 6 }).map((_, idx) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - idx));
    const key = format(d, "MMM");
    const count = devices.filter((dev) => {
      const dt = new Date(dev.created_at);
      return dt.getMonth() === d.getMonth() && dt.getFullYear() === d.getFullYear();
    }).length;
    return { month: key, count };
  });

  const recent = [...devices]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Overview of your computer lab inventory.</p>
        </div>
        <Link
          to="/devices"
          className="hidden items-center gap-1 text-sm text-primary hover:underline sm:inline-flex"
        >
          View all devices <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total Devices" value={total} sub={`${totalUnits} units`} icon={Boxes} tone="primary" loading={isLoading} />
        <StatCard label="Available" value={available} icon={CheckCircle2} tone="success" loading={isLoading} />
        <StatCard label="In Use" value={inUse} icon={Boxes} tone="primary" loading={isLoading} />
        <StatCard label="Maintenance" value={maintenance} sub={`${damaged} damaged`} icon={Wrench} tone="warning" loading={isLoading} />
        <StatCard label="Total Value" value={`$${grand.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} icon={DollarSign} tone="accent" loading={isLoading} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Devices by status</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byStatus}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" stroke="var(--color-muted-foreground)" tick={{ fontSize: 12 }} />
                <YAxis stroke="var(--color-muted-foreground)" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8 }}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {byStatus.map((s) => (
                    <Cell key={s.name} fill={STATUS_COLORS[s.name]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">By category</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={3}>
                  {byCategory.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? "var(--color-primary)" : "var(--color-accent)"} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 flex justify-center gap-4 text-xs text-muted-foreground">
              {byCategory.map((c, i) => (
                <div key={c.name} className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ background: i === 0 ? "var(--color-primary)" : "var(--color-accent)" }} />
                  {c.name} • {c.value}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Devices added (last 6 months)</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" stroke="var(--color-muted-foreground)" tick={{ fontSize: 12 }} />
                <YAxis stroke="var(--color-muted-foreground)" tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
                <Line type="monotone" dataKey="count" stroke="var(--color-primary)" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Latest added</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recent.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                <PackageX className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No devices yet</p>
              </div>
            )}
            {recent.map((d) => (
              <div key={d.id} className="flex items-center justify-between gap-2 rounded-lg border border-border p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{d.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{d.brand} {d.model}</p>
                </div>
                <Badge variant="secondary" className="shrink-0">{d.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  label, value, sub, icon: Icon, tone, loading,
}: {
  label: string; value: string | number; sub?: string;
  icon: typeof Boxes; tone: "primary" | "success" | "warning" | "accent"; loading?: boolean;
}) {
  const toneClass = {
    primary: "bg-primary/15 text-primary",
    success: "bg-success/15 text-success",
    warning: "bg-warning/15 text-warning",
    accent: "bg-accent/20 text-accent",
  }[tone];
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="mt-2 text-3xl font-bold tracking-tight">
              {loading ? <span className="inline-block h-8 w-16 animate-pulse rounded bg-muted" /> : value}
            </p>
            {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
          </div>
          <div className={`grid h-10 w-10 place-items-center rounded-lg ${toneClass}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
