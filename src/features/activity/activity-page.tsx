import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableHeader,
  TableRow,
  TableCell,
  TableBody,
  TableHead,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  Search,
  RefreshCw,
  Clock,
  Settings,
  Database,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  UserCheck,
} from "lucide-react";
import { format, subDays, startOfDay, isWithinInterval } from "date-fns";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
);

interface AuditLog {
  id: string;
  action: string;
  user_id: string | null;
  details: string | null;
  created_at: string;
}

interface Profile {
  id: string;
  name: string;
  email: string;
}

export function ActivityPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState<string>("all");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [logsRes, profilesRes] = await Promise.all([
        supabase
          .from("audit_log")
          .select("id, action, created_at, user_id, details")
          .order("created_at", { ascending: false }),
        supabase.from("profiles").select("id, name, email"),
      ]);

      if (logsRes.data) setLogs(logsRes.data as AuditLog[]);
      if (profilesRes.data) setProfiles(profilesRes.data as Profile[]);
    } catch (err) {
      console.error("Error fetching activity data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter logs based on search query and action category dropdown
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        log.action.toLowerCase().includes(search.toLowerCase()) ||
        (log.details ?? "").toLowerCase().includes(search.toLowerCase());

      const matchesFilter =
        filterAction === "all" || log.action.toLowerCase().includes(filterAction.toLowerCase());

      return matchesSearch && matchesFilter;
    });
  }, [logs, search, filterAction]);

  // Derive user display label
  const getUserLabel = (userId: string | null) => {
    if (!userId) return "System";
    const profile = profiles.find((p) => p.id === userId);
    return profile ? profile.name : "Admin/Staff";
  };

  // 1. Chart.js Data: Daily activity volume (last 7 days)
  const lineChartData = useMemo(() => {
    const dates = Array.from({ length: 7 }).map((_, idx) =>
      startOfDay(subDays(new Date(), 6 - idx)),
    );
    const labels = dates.map((d) => format(d, "MMM dd"));

    const counts = dates.map((d) => {
      const start = d;
      const end = new Date(d.getTime() + 86400000);
      return logs.filter((log) => {
        const logDate = new Date(log.created_at);
        return logDate >= start && logDate < end;
      }).length;
    });

    return {
      labels,
      datasets: [
        {
          label: "Operations Logged",
          data: counts,
          borderColor: "rgba(99, 102, 241, 1)", // Indigo
          backgroundColor: "rgba(99, 102, 241, 0.15)",
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: "rgba(99, 102, 241, 1)",
          pointHoverRadius: 7,
        },
      ],
    };
  }, [logs]);

  // 2. Chart.js Data: Doughnut distribution of action categories
  const doughnutChartData = useMemo(() => {
    const actionCounts: Record<string, number> = {};
    logs.forEach((log) => {
      // Group actions roughly
      let category = "Other";
      if (log.action.toLowerCase().includes("seed")) category = "Database Seeding";
      else if (log.action.toLowerCase().includes("device")) category = "Device Mgmt";
      else if (log.action.toLowerCase().includes("order")) category = "Order Requisition";
      else if (log.action.toLowerCase().includes("staff")) category = "Staff Mgmt";
      else if (
        log.action.toLowerCase().includes("user") ||
        log.action.toLowerCase().includes("auth")
      )
        category = "Authentication";

      actionCounts[category] = (actionCounts[category] ?? 0) + 1;
    });

    const labels = Object.keys(actionCounts);
    const data = Object.values(actionCounts);

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: [
            "rgba(99, 102, 241, 0.85)", // Indigo
            "rgba(244, 63, 94, 0.85)", // Rose
            "rgba(6, 182, 212, 0.85)", // Cyan
            "rgba(245, 158, 11, 0.85)", // Amber
            "rgba(16, 185, 129, 0.85)", // Emerald
            "rgba(156, 163, 175, 0.85)", // Gray
          ],
          borderColor: "var(--color-card)",
          borderWidth: 2,
          hoverOffset: 6,
        },
      ],
    };
  }, [logs]);

  // Helper values for stat cards
  const stats = useMemo(() => {
    const totalOps = logs.length;
    const seedOps = logs.filter((l) => l.action.toLowerCase().includes("seed")).length;
    const deviceOps = logs.filter((l) => l.action.toLowerCase().includes("device")).length;
    const orderOps = logs.filter((l) => l.action.toLowerCase().includes("order")).length;
    return { totalOps, seedOps, deviceOps, orderOps };
  }, [logs]);

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(24, 24, 27, 0.95)",
        titleFont: { family: "Inter", size: 12, weight: "bold" as const },
        bodyFont: { family: "Inter", size: 12 },
        padding: 10,
        borderColor: "rgba(63, 63, 70, 0.5)",
        borderWidth: 1,
      },
    },
    scales: {
      y: {
        grid: { color: "rgba(63, 63, 70, 0.15)" },
        ticks: { color: "rgba(156, 163, 175, 1)", font: { family: "Inter", size: 10 } },
      },
      x: {
        grid: { display: false },
        ticks: { color: "rgba(156, 163, 175, 1)", font: { family: "Inter", size: 10 } },
      },
    },
    animation: {
      duration: 1000,
      easing: "easeOutQuart" as const,
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          color: "rgba(156, 163, 175, 1)",
          font: { family: "Inter", size: 10, weight: "bold" as const },
          padding: 12,
          boxWidth: 10,
          boxHeight: 10,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: "rgba(24, 24, 27, 0.95)",
        bodyFont: { family: "Inter", size: 11 },
        padding: 8,
        borderColor: "rgba(63, 63, 70, 0.5)",
        borderWidth: 1,
      },
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1000,
      easing: "easeOutBack" as const,
    },
  };

  return (
    <div className="relative min-h-screen space-y-6">
      {/* Background Liquid Blurs */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="aurora-bg absolute inset-0 opacity-15" />
        <div className="liquid-orb animate-blob absolute top-1/4 left-1/4 h-[350px] w-[350px] bg-primary/5 opacity-60" />
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl bg-gradient-to-r from-foreground via-foreground to-foreground/60 bg-clip-text text-transparent">
            System Activity Log
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitor real-time operations, administrative actions, and audit logs.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={fetchData}
          disabled={loading}
          className="rounded-xl self-start sm:self-center text-xs h-9 font-semibold gap-1.5"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading && "animate-spin"}`} /> Refresh Logs
        </Button>
      </div>

      {/* Analytics Statistics cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="liquid-card border-border/55">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Total Operations
              </p>
              <p className="text-2xl font-extrabold text-foreground mt-1">{stats.totalOps}</p>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <Activity className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="liquid-card border-border/55">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Device Operations
              </p>
              <p className="text-2xl font-extrabold text-accent mt-1">{stats.deviceOps}</p>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent/10 text-accent">
              <Database className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="liquid-card border-border/55">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Requisitions
              </p>
              <p className="text-2xl font-extrabold text-success mt-1">{stats.orderOps}</p>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-success/10 text-success">
              <ArrowUpRight className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="liquid-card border-border/55">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Database Seeds
              </p>
              <p className="text-2xl font-extrabold text-warning mt-1">{stats.seedOps}</p>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-warning/10 text-warning">
              <UserCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart.js Layout */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Line Chart */}
        <Card className="md:col-span-2 liquid-card border-border/55">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <TrendingUp className="h-4.5 w-4.5 text-primary" /> Daily Activity Trend
            </CardTitle>
            <CardDescription className="text-xs">
              Operation occurrences logged over the last 7 calendar days.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            {loading ? (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin text-primary mr-1.5" /> Loading trends...
              </div>
            ) : (
              <Line data={lineChartData} options={lineOptions} />
            )}
          </CardContent>
        </Card>

        {/* Doughnut Chart */}
        <Card className="liquid-card border-border/55">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <Settings className="h-4.5 w-4.5 text-accent" /> Action Breakdown
            </CardTitle>
            <CardDescription className="text-xs">
              Operational logs segmented by system module.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            {loading ? (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin text-accent mr-1.5" /> Loading
                distribution...
              </div>
            ) : (
              <div className="h-52 relative">
                <Doughnut data={doughnutChartData} options={doughnutOptions} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Table section */}
      <Card className="liquid-card border-border/55">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3">
          <div>
            <CardTitle className="text-base font-bold text-foreground">
              Detailed Audit Feed
            </CardTitle>
            <CardDescription className="text-xs">
              Filterable history logs of all actions performed in this instance.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search audit actions..."
                className="pl-9 glass-input border-border/80 rounded-xl text-xs h-9"
              />
            </div>
            {/* Filter category */}
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="glass-input border border-border/80 rounded-xl text-xs h-9 px-3 bg-card text-foreground focus:outline-none"
            >
              <option value="all">All Category</option>
              <option value="seed">Database Seeding</option>
              <option value="device">Devices</option>
              <option value="order">Orders</option>
              <option value="staff">Staff Roles</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground text-xs gap-2">
              <RefreshCw className="h-4 w-4 animate-spin text-primary" /> Loading audit records...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-xs">
              No activity logs match your search.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border/40 bg-secondary/15">
                  <TableHead className="w-1/4">Action</TableHead>
                  <TableHead className="w-1/4">Timestamp</TableHead>
                  <TableHead className="w-1/6">User Initiator</TableHead>
                  <TableHead className="w-2/5">Operation Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => {
                  let badgeVariant: "default" | "secondary" | "outline" | "destructive" =
                    "secondary";
                  if (log.action.includes("Seed") || log.action.includes("Database"))
                    badgeVariant = "default";
                  else if (log.action.includes("Created") || log.action.includes("Added"))
                    badgeVariant = "outline";
                  else if (log.action.includes("Delete") || log.action.includes("Remove"))
                    badgeVariant = "destructive";

                  return (
                    <TableRow
                      key={log.id}
                      className="border-b border-border/25 last:border-0 hover:bg-secondary/15 transition-colors"
                    >
                      <TableCell className="font-semibold text-foreground">
                        <Badge variant={badgeVariant} className="text-[10px] font-bold">
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs font-mono">
                        {new Date(log.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-foreground text-xs font-medium">
                        {getUserLabel(log.user_id)}
                      </TableCell>
                      <TableCell className="text-zinc-300 text-xs leading-relaxed">
                        {log.details ?? "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
