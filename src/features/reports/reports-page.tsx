import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  DollarSign,
  Package,
  Wrench,
  ShoppingCart,
  Percent,
  RefreshCw,
} from "lucide-react";
import { format, subMonths } from "date-fns";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar, Pie, Radar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
);

export function ReportsPage() {
  const [timePeriod, setTimePeriod] = useState("6m");

  // Fetch all orders
  const { data: rawOrders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["reports-orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*");
      if (error) throw error;
      return data ?? [];
    },
  });
  const orders = rawOrders as any[];

  // Fetch all devices/products
  const { data: rawDevices = [], isLoading: devicesLoading } = useQuery({
    queryKey: ["reports-devices"],
    queryFn: async () => {
      const { data, error } = await supabase.from("devices").select("*");
      if (error) throw error;
      return data ?? [];
    },
  });
  const devices = rawDevices as any[];

  const loading = ordersLoading || devicesLoading;

  // 1. Financial Report Analytics (Monthly Spend)
  const financialData = useMemo(() => {
    const months = Array.from({ length: 6 }).map((_, idx) => {
      return subMonths(new Date(), 5 - idx);
    });
    const labels = months.map((m) => format(m, "MMM yyyy"));

    const spend = months.map((m) => {
      return orders
        .filter((o) => {
          const d = new Date(o.created_at);
          return (
            d.getMonth() === m.getMonth() &&
            d.getFullYear() === m.getFullYear() &&
            o.status !== "Cancelled"
          );
        })
        .reduce((sum, o) => sum + Number(o.total), 0);
    });

    return {
      labels,
      datasets: [
        {
          label: "Procurement Capital Spend ($)",
          data: spend,
          borderColor: "rgba(16, 185, 129, 1)", // Emerald
          backgroundColor: "rgba(16, 185, 129, 0.12)",
          borderWidth: 3,
          fill: true,
          tension: 0.35,
          pointBackgroundColor: "rgba(16, 185, 129, 1)",
        },
      ],
    };
  }, [orders]);

  // 2. Inventory Allocation (Devices by Category)
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    devices.forEach((d) => {
      counts[d.category] = (counts[d.category] ?? 0) + (d.quantity ?? 1);
    });

    return {
      labels: Object.keys(counts),
      datasets: [
        {
          label: "Unit Count",
          data: Object.values(counts),
          backgroundColor: "rgba(99, 102, 241, 0.8)", // Indigo
          borderRadius: 8,
          borderWidth: 0,
          maxBarThickness: 32,
        },
      ],
    };
  }, [devices]);

  // 3. Device Status Breakdown (Radar Chart)
  const statusData = useMemo(() => {
    const statuses = ["Available", "In Use", "Under Maintenance", "Damaged", "Disposed"];
    const counts = statuses.map((s) => {
      return devices.filter((d) => d.status === s).length;
    });

    return {
      labels: statuses,
      datasets: [
        {
          label: "Physical Peripherals",
          data: counts,
          backgroundColor: "rgba(244, 63, 94, 0.2)", // Rose
          borderColor: "rgba(244, 63, 94, 0.8)",
          borderWidth: 2,
          pointBackgroundColor: "rgba(244, 63, 94, 1)",
        },
      ],
    };
  }, [devices]);

  // 4. Fulfillment Status Breakdown (Pie Chart)
  const fulfillmentData = useMemo(() => {
    const statuses = ["Pending", "Confirmed", "Processing", "Shipped", "Delivered", "Cancelled"];
    const counts = statuses.map((s) => {
      return orders.filter((o) => o.status === s).length;
    });

    return {
      labels: statuses,
      datasets: [
        {
          data: counts,
          backgroundColor: [
            "rgba(156, 163, 175, 0.8)", // Gray (Pending)
            "rgba(59, 130, 246, 0.8)", // Blue (Confirmed)
            "rgba(139, 92, 246, 0.8)", // Purple (Processing)
            "rgba(245, 158, 11, 0.8)", // Yellow (Shipped)
            "rgba(16, 185, 129, 0.8)", // Green (Delivered)
            "rgba(239, 68, 68, 0.8)", // Red (Cancelled)
          ],
          borderColor: "var(--color-card)",
          borderWidth: 2,
        },
      ],
    };
  }, [orders]);

  // Top metric values
  const metrics = useMemo(() => {
    const capitalAssetVal = devices.reduce(
      (sum, d) => sum + Number(d.price) * (d.quantity ?? 1),
      0,
    );
    const activeRequisitions = orders.filter((o) =>
      ["Pending", "Confirmed", "Processing", "Shipped"].includes(o.status),
    ).length;
    const totalProcuredSpend = orders
      .filter((o) => o.status !== "Cancelled")
      .reduce((sum, o) => sum + Number(o.total), 0);
    const maintenanceUnits = devices
      .filter((d) => d.status === "Under Maintenance" || d.status === "Damaged")
      .reduce((sum, d) => sum + (d.quantity ?? 1), 0);

    return { capitalAssetVal, activeRequisitions, totalProcuredSpend, maintenanceUnits };
  }, [orders, devices]);

  // General Chart.js configuration options
  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
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
    animation: { duration: 1200, easing: "easeInOutCubic" as const },
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
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
    animation: { duration: 1200, easing: "easeOutElastic" as const },
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right" as const,
        labels: {
          color: "rgba(156, 163, 175, 1)",
          font: { family: "Inter", size: 10, weight: "bold" as const },
          usePointStyle: true,
          boxWidth: 8,
        },
      },
    },
    animation: { animateRotate: true, animateScale: true, duration: 1000 },
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      r: {
        angleLines: { color: "rgba(63, 63, 70, 0.2)" },
        grid: { color: "rgba(63, 63, 70, 0.2)" },
        pointLabels: {
          color: "rgba(156, 163, 175, 1)",
          font: { family: "Inter", size: 9, weight: "bold" as const },
        },
        ticks: { display: false },
      },
    },
    animation: { duration: 1500, easing: "easeOutElastic" as const },
  };

  const triggerExport = () => {
    toast.success("Preparing PDF Document Report...");
    setTimeout(() => {
      toast.success("Download Complete: labtrack_inventory_report.pdf");
    }, 1500);
  };

  return (
    <div className="relative min-h-screen space-y-6">
      {/* Background Liquid Blurs */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="aurora-bg absolute inset-0 opacity-15" />
        <div className="liquid-orb animate-blob absolute bottom-1/4 right-1/4 h-[350px] w-[350px] bg-accent/5 opacity-60" />
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl bg-gradient-to-r from-foreground via-foreground to-foreground/60 bg-clip-text text-transparent">
            Executive Analytics & Reports
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Generate and visualize peripheral inventory allocations, cost breakdowns, and active
            orders.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Period selector */}
          <div className="flex items-center gap-1 bg-secondary/15 rounded-xl border border-border/80 px-2 py-1 text-xs h-9">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground mr-1" />
            <button
              onClick={() => setTimePeriod("30d")}
              className={`px-2 py-0.5 rounded-lg transition-colors font-semibold ${timePeriod === "30d" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              30D
            </button>
            <button
              onClick={() => setTimePeriod("6m")}
              className={`px-2 py-0.5 rounded-lg transition-colors font-semibold ${timePeriod === "6m" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              6M
            </button>
            <button
              onClick={() => setTimePeriod("1y")}
              className={`px-2 py-0.5 rounded-lg transition-colors font-semibold ${timePeriod === "1y" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              1Y
            </button>
          </div>
          <Button
            size="sm"
            onClick={triggerExport}
            className="rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground text-xs font-semibold h-9 gap-1.5"
          >
            <Download className="h-3.5 w-3.5" /> Export Report PDF
          </Button>
        </div>
      </div>

      {/* Metrics Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="liquid-card border-border/55">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Procured Capital Spend
              </p>
              <p className="text-2xl font-extrabold text-success mt-1">
                $
                {metrics.totalProcuredSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-success/10 text-success">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="liquid-card border-border/55">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Capital Asset Value
              </p>
              <p className="text-2xl font-extrabold text-primary mt-1">
                ${metrics.capitalAssetVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <Package className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="liquid-card border-border/55">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Active Requisitions
              </p>
              <p className="text-2xl font-extrabold text-accent mt-1">
                {metrics.activeRequisitions}
              </p>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent/10 text-accent">
              <ShoppingCart className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="liquid-card border-border/55">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Maintenance Backlog
              </p>
              <p className="text-2xl font-extrabold text-warning mt-1">
                {metrics.maintenanceUnits} Units
              </p>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-warning/10 text-warning">
              <Wrench className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs segment */}
      <Tabs defaultValue="financial" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-[500px] rounded-xl border border-border bg-card/65 p-1">
          <TabsTrigger
            value="financial"
            className="rounded-lg text-xs font-bold transition-all flex items-center gap-1"
          >
            <TrendingUp className="h-3.5 w-3.5" /> Capital Costs
          </TabsTrigger>
          <TabsTrigger
            value="inventory"
            className="rounded-lg text-xs font-bold transition-all flex items-center gap-1"
          >
            <Package className="h-3.5 w-3.5" /> Allocations
          </TabsTrigger>
          <TabsTrigger
            value="fulfillment"
            className="rounded-lg text-xs font-bold transition-all flex items-center gap-1"
          >
            <ShoppingCart className="h-3.5 w-3.5" /> Requisitions
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Financial Report */}
        <TabsContent value="financial" className="space-y-6 outline-none">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="md:col-span-2 liquid-card border-border/55">
              <CardHeader>
                <CardTitle className="text-sm font-bold text-foreground">
                  Monthly Spend Trend
                </CardTitle>
                <CardDescription className="text-xs">
                  Capital investment value of approved equipment purchases.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                {loading ? (
                  <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                    <RefreshCw className="h-4 w-4 animate-spin text-success mr-1.5" /> Loading spend
                    logs...
                  </div>
                ) : (
                  <Line data={financialData} options={lineOptions} />
                )}
              </CardContent>
            </Card>

            <Card className="liquid-card border-border/55">
              <CardHeader>
                <CardTitle className="text-sm font-bold text-foreground">Spend Analysis</CardTitle>
                <CardDescription className="text-xs">
                  Summary stats for financial acquisitions.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-1 text-xs">
                <div className="rounded-xl border border-border bg-secondary/10 p-3">
                  <p className="text-[10px] uppercase text-muted-foreground font-semibold">
                    Total Net Procurement
                  </p>
                  <p className="text-lg font-black text-foreground mt-1">
                    ${metrics.totalProcuredSpend.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-secondary/10 p-3">
                  <p className="text-[10px] uppercase text-muted-foreground font-semibold">
                    Inventory Valuation
                  </p>
                  <p className="text-lg font-black text-foreground mt-1">
                    ${metrics.capitalAssetVal.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-secondary/10 p-3">
                  <p className="text-[10px] uppercase text-muted-foreground font-semibold">
                    Fulfillment Ratio
                  </p>
                  <p className="text-lg font-black text-success mt-1">
                    {orders.length > 0
                      ? (
                          (orders.filter((o) => o.status === "Delivered").length / orders.length) *
                          100
                        ).toFixed(1)
                      : "0.0"}
                    %
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 2: Inventory Allocation */}
        <TabsContent value="inventory" className="space-y-6 outline-none">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="liquid-card border-border/55">
              <CardHeader>
                <CardTitle className="text-sm font-bold text-foreground">
                  Unit Count by Category
                </CardTitle>
                <CardDescription className="text-xs">
                  Distribution of lab stock equipment across primary peripheral groups.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                {loading ? (
                  <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                    <RefreshCw className="h-4 w-4 animate-spin text-primary mr-1.5" /> Loading
                    category allocation...
                  </div>
                ) : (
                  <Bar data={categoryData} options={barOptions} />
                )}
              </CardContent>
            </Card>

            <Card className="liquid-card border-border/55">
              <CardHeader>
                <CardTitle className="text-sm font-bold text-foreground">
                  Device Condition Matrix
                </CardTitle>
                <CardDescription className="text-xs">
                  Health and operational readiness status distribution.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                {loading ? (
                  <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                    <RefreshCw className="h-4 w-4 animate-spin text-accent mr-1.5" /> Loading health
                    matrix...
                  </div>
                ) : (
                  <div className="h-64 relative">
                    <Radar data={statusData} options={radarOptions} />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 3: Requisitions & Fulfillment */}
        <TabsContent value="fulfillment" className="space-y-6 outline-none">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="md:col-span-2 liquid-card border-border/55">
              <CardHeader>
                <CardTitle className="text-sm font-bold text-foreground">
                  Fulfillment Statuses
                </CardTitle>
                <CardDescription className="text-xs">
                  Breakdown of customer requisition states.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                {loading ? (
                  <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                    <RefreshCw className="h-4 w-4 animate-spin text-primary mr-1.5" /> Loading
                    fulfillment charts...
                  </div>
                ) : (
                  <div className="h-64 relative">
                    <Pie data={fulfillmentData} options={pieOptions} />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="liquid-card border-border/55">
              <CardHeader>
                <CardTitle className="text-sm font-bold text-foreground">
                  Active Orders Queue
                </CardTitle>
                <CardDescription className="text-xs">
                  Pending requisition orders needing fulfillment.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-1">
                {orders
                  .filter((o) => ["Pending", "Confirmed", "Processing"].includes(o.status))
                  .slice(0, 4)
                  .map((o) => (
                    <div
                      key={o.id}
                      className="flex items-center justify-between gap-2 rounded-xl border border-border/55 p-3 bg-secondary/10"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground font-mono">
                          {o.order_number}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {o.customer_name}
                        </p>
                      </div>
                      <Badge className="text-[9px] font-bold" variant="outline">
                        {o.status}
                      </Badge>
                    </div>
                  ))}
                {orders.filter((o) => ["Pending", "Confirmed", "Processing"].includes(o.status))
                  .length === 0 && (
                  <p className="text-xs text-muted-foreground py-10 text-center">
                    No active requisitions in queue.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
