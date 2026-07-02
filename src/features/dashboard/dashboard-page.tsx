import { Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/lib/role-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";
import {
  Boxes,
  CheckCircle2,
  Wrench,
  ArrowUpRight,
  DollarSign,
  PackageX,
  Database,
  RefreshCw,
  ShoppingCart,
  Users,
  ClipboardList,
  ShieldAlert,
  Eye,
  Globe,
  MapPin,
  Phone,
  Mail,
  User,
  Star,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { generateFakeOrdersAndCustomers, clearAllOrders } from "@/lib/db-seeder";
import { toast } from "sonner";
import { DashboardCalendar } from "./components/dashboard-calendar";
import { OrderGraphTracker } from "@/components/order-graph-tracker";

const STATUS_COLORS: Record<string, string> = {
  Available: "var(--color-success)",
  "In Use": "var(--color-primary)",
  "Under Maintenance": "var(--color-warning)",
  Damaged: "var(--color-destructive)",
  Disposed: "var(--color-muted-foreground)",
};

const ORDER_STATUS_COLORS: Record<string, string> = {
  Pending: "var(--color-muted-foreground)",
  Confirmed: "var(--color-accent)",
  Processing: "var(--color-primary)",
  Shipped: "var(--color-chart-3)",
  Delivered: "var(--color-success)",
  Cancelled: "var(--color-destructive)",
};

const ORDER_STATUSES = [
  "Pending",
  "Confirmed",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
] as const;

export function DashboardPage({ roleBase }: { roleBase: string }) {
  const qc = useQueryClient();
  const { profile: ctxProfile, userId } = useRole();
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [clearing, setClearing] = useState(false);

  const userEmail = ctxProfile?.email ?? "";
  const profile = ctxProfile;

  // Queries
  const { data: devices = [], isLoading: devicesLoading } = useQuery({
    queryKey: ["dashboard-devices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("devices")
        .select("id,name,brand,model,category,price,quantity,status,created_at");
      if (error) throw error;
      return data ?? [];
    },
  });

  const isCustomerView = roleBase === "/customer";

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["dashboard-orders", userEmail, roleBase],
    queryFn: async () => {
      let query = supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (isCustomerView && userEmail) {
        query = query.eq("email", userEmail);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!userId,
  });

  // Query order items dynamically when an order is selected
  const { data: selectedOrderItems = [] } = useQuery({
    queryKey: ["order-items", selectedOrder?.id],
    enabled: !!selectedOrder,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", selectedOrder.id);
      if (error) throw error;
      return data ?? [];
    },
  });

  // Query ALL order items for real-time stock/sales calculations
  const { data: allOrderItems = [], isLoading: orderItemsLoading } = useQuery({
    queryKey: ["dashboard-all-order-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_items")
        .select("*");
      if (error) throw error;
      return data ?? [];
    },
  });

  // Mutations
  const updateOrderStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("orders")
        .update({ status: status as any })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Order status updated");
      qc.invalidateQueries({ queryKey: ["dashboard-orders"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Seeding handlers
  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await generateFakeOrdersAndCustomers();
      toast.success(
        `Successfully generated ${res.orderCount} fake orders and ${res.itemCount} customer order items.`,
      );
      qc.invalidateQueries();
    } catch (e: any) {
      toast.error(e.message || "Failed to seed fake data.");
    } finally {
      setSeeding(false);
    }
  };

  const handleClear = async () => {
    setClearing(true);
    try {
      await clearAllOrders();
      toast.success("Successfully cleared all order and customer history.");
      qc.invalidateQueries();
    } catch (e: any) {
      toast.error(e.message || "Failed to clear order history.");
    } finally {
      setClearing(false);
    }
  };

  const dashboardLoading = devicesLoading || ordersLoading || orderItemsLoading;

  const topCustomers = useMemo(() => {
    const map = new Map<
      string,
      { name: string; email: string; orderCount: number; totalSpend: number }
    >();
    orders.forEach((o: any) => {
      const email = o.email.toLowerCase();
      const current = map.get(email) ?? {
        name: o.customer_name,
        email: o.email,
        orderCount: 0,
        totalSpend: 0,
      };
      current.orderCount += 1;
      if (o.status !== "Cancelled") {
        current.totalSpend += Number(o.total);
      }
      map.set(email, current);
    });
    return Array.from(map.values())
      .sort((a, b) => b.totalSpend - a.totalSpend)
      .slice(0, 5);
  }, [orders]);

  const lowStockDevices = useMemo(() => {
    return devices.filter((d: any) => d.status === "Available" && (d.quantity ?? 0) <= 5);
  }, [devices]);

  useEffect(() => {
    if (lowStockDevices.length > 0) {
      toast.warning(`Low Stock Warning: ${lowStockDevices.length} items are running low on stock!`, {
        description: lowStockDevices.map((d: any) => `${d.name} (${d.quantity} remaining)`).join(", "),
        duration: 8000,
      });
    }
  }, [lowStockDevices.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const stockTrackingData = useMemo(() => {
    return devices.map((d: any) => {
      const sold = allOrderItems
        .filter((item: any) => item.device_id === d.id)
        .reduce((sum: number, item: any) => sum + (item.quantity ?? 0), 0);
      const remaining = d.quantity ?? 0;
      const total = sold + remaining;
      const value = remaining * Number(d.price);
      return {
        id: d.id,
        name: d.name,
        brand: d.brand,
        category: d.category,
        price: Number(d.price),
        sold,
        remaining,
        total,
        value,
      };
    });
  }, [devices, allOrderItems]);

  const categoryManagementBreakdown = useMemo(() => {
    const cats: Record<string, { uniqueProducts: number; totalStock: number; totalValue: number }> = {};
    devices.forEach((d: any) => {
      const cat = d.category || "Uncategorized";
      if (!cats[cat]) {
        cats[cat] = { uniqueProducts: 0, totalStock: 0, totalValue: 0 };
      }
      cats[cat].uniqueProducts += 1;
      cats[cat].totalStock += d.quantity ?? 0;
      cats[cat].totalValue += (d.quantity ?? 0) * Number(d.price);
    });
    return Object.entries(cats).map(([name, data]) => ({ name, ...data }));
  }, [devices]);

  // ----------------------------------------------------
  // CUSTOMER DASHBOARD VIEW
  // ----------------------------------------------------
  if (isCustomerView) {
    const myOrders = orders.filter((o: any) => o.email.toLowerCase() === userEmail.toLowerCase());
    const myOrderCount = myOrders.length;
    const myTotalSpend = myOrders
      .filter((o: any) => o.status !== "Cancelled")
      .reduce((s: number, o: any) => s + Number(o.total), 0);

    // Latest active order (Pending, Confirmed, Processing, Shipped)
    const activeOrders = [...myOrders]
      .filter((o: any) => o.status !== "Delivered" && o.status !== "Cancelled")
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const latestActiveOrder = activeOrders[0] ?? null;

    // Delivery address from latest order
    const latestOrderWithAddress =
      [...myOrders]
        .filter((o: any) => o.address && o.city)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0] ??
      null;

    const recommendedDevices = devices.filter((d: any) => d.status === "Available").slice(0, 3);

    const getStatusStep = (status: string) => {
      switch (status) {
        case "Pending":
          return 1;
        case "Confirmed":
          return 2;
        case "Processing":
          return 3;
        case "Shipped":
          return 4;
        case "Delivered":
          return 5;
        default:
          return 0;
      }
    };

    const currentStep = latestActiveOrder ? getStatusStep(latestActiveOrder.status) : 0;

    return (
      <div className="relative min-h-screen space-y-6">
        {/* Background Liquid Blurs */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="aurora-bg absolute inset-0 opacity-15" />
          <div className="liquid-orb animate-blob absolute top-1/4 left-1/4 h-[350px] w-[350px] bg-primary/5 opacity-60" />
          <div
            className="liquid-orb animate-blob absolute bottom-1/3 right-10 h-[400px] w-[400px] bg-accent/5 opacity-50"
            style={{ animationDelay: "-6s" }}
          />
        </div>

        {/* Header */}
        <div className="rounded-2xl border border-border/55 liquid-card p-6 bg-gradient-to-r from-card via-card to-accent/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              Welcome back, {profile?.name ?? "Customer"}!
            </h2>
            <p className="text-xs text-muted-foreground mt-1 max-w-lg leading-relaxed">
              Monitor the status of your laboratory hardware requests, track deliveries, and manage
              your account details.
            </p>
          </div>
          <Link to="/products">
            <Button
              size="sm"
              className="rounded-xl bg-gradient-to-r from-primary to-accent font-semibold text-xs h-9"
            >
              Order Peripherals
            </Button>
          </Link>
        </div>

        {/* Customer Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="My Orders"
            value={myOrderCount}
            sub="Total requisitions"
            icon={ShoppingCart}
            tone="primary"
            loading={dashboardLoading}
          />
          <StatCard
            label="Total Invested"
            value={`$${myTotalSpend.toFixed(2)}`}
            sub="Approved requisitions value"
            icon={DollarSign}
            tone="success"
            loading={dashboardLoading}
          />
          <Card className="liquid-card border-border/55 overflow-hidden transition-all duration-300 hover:shadow-md">
            <CardContent className="p-4 flex items-center justify-between h-full">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Storefront Link
                </p>
                <p className="text-xs font-medium text-muted-foreground mt-1">
                  Explore keyboards, monitors, and mice.
                </p>
                <Link
                  to="/products"
                  className="mt-2 inline-flex items-center gap-1 text-xs text-primary font-bold hover:underline"
                >
                  Browse Catalog <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="grid h-9 w-9 place-items-center rounded-xl border border-accent/20 bg-accent/10 text-accent shrink-0">
                <Globe className="h-4.5 w-4.5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Requisition Tracker */}
        {latestActiveOrder && (
          <Card className="liquid-card border-border/55 overflow-hidden bg-gradient-to-br from-card via-card to-primary/5">
            <CardHeader className="pb-3 border-b border-border/10">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-primary animate-pulse" />
                    Active Requisition Status Tracker
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Tracking request{" "}
                    <span className="font-mono font-bold text-foreground">
                      {latestActiveOrder.order_number}
                    </span>{" "}
                    placed on {new Date(latestActiveOrder.created_at).toLocaleDateString()}
                  </CardDescription>
                </div>
                <Badge
                  variant="outline"
                  className="text-[10px] font-bold border-primary/30 text-primary capitalize bg-primary/5 font-mono px-2 py-0.5"
                >
                  {latestActiveOrder.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4 pb-4">
              <OrderGraphTracker currentStatus={latestActiveOrder.status} />
            </CardContent>
          </Card>
        )}

        {/* Dashboard 2-Column Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column: Requisition History */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="liquid-card border-border/55">
              <CardHeader>
                <CardTitle className="text-base font-bold text-foreground">
                  My Requisition History
                </CardTitle>
                <CardDescription className="text-xs">
                  Timeline and status of your custom lab equipment orders.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                {myOrders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-muted-foreground">
                    <ShoppingCart className="h-8 w-8 text-muted-foreground/60" />
                    <p className="text-sm">You haven't placed any hardware requests yet.</p>
                    <Link to="/products">
                      <Button size="sm" className="rounded-xl">
                        Browse Catalog
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border/40 bg-secondary/15 text-[10px] text-muted-foreground font-bold uppercase">
                        <th className="px-4 py-3">Order #</th>
                        <th className="px-4 py-3">Date Placed</th>
                        <th className="px-4 py-3">Total Cost</th>
                        <th className="px-4 py-3 text-center">Status</th>
                        <th className="w-16 px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {myOrders.map((o: any) => (
                        <tr
                          key={o.id}
                          className="border-b border-border/25 last:border-0 hover:bg-secondary/15 transition-colors"
                        >
                          <td className="px-4 py-3 font-mono text-[10px]">{o.order_number}</td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {new Date(o.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 font-semibold text-foreground text-xs">
                            ${Number(o.total).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge variant="secondary" className="text-[10px] font-bold capitalize">
                              {o.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setSelectedOrder(o)}
                              className="h-6 w-6 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Lab Info & Recommended Peripherals */}
          <div className="space-y-6">
            {/* Lab Delivery Destination Card */}
            <Card className="liquid-card border-border/55">
              <CardHeader className="pb-3 border-b border-border/10">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <MapPin className="h-4.5 w-4.5 text-primary" />
                  Lab Delivery Office
                </CardTitle>
                <CardDescription className="text-xs">
                  Destination details collected for equipment dispatch.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-3.5 text-xs">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-secondary/20 rounded-lg text-muted-foreground">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
                      Recipient Name
                    </p>
                    <p className="font-semibold text-foreground text-xs">
                      {profile?.name ?? "Customer Account"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-secondary/20 rounded-lg text-muted-foreground">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
                      Contact Email
                    </p>
                    <p className="font-mono text-zinc-300 text-xs">{userEmail}</p>
                  </div>
                </div>
                {latestOrderWithAddress ? (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-secondary/20 rounded-lg text-muted-foreground">
                        <Phone className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
                          Contact Phone
                        </p>
                        <p className="font-semibold text-foreground text-xs">
                          {latestOrderWithAddress.phone}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 pt-1">
                      <div className="p-2 bg-secondary/20 rounded-lg text-muted-foreground shrink-0 mt-0.5">
                        <MapPin className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
                          Shipping Destination
                        </p>
                        <p className="font-medium text-foreground text-xs leading-relaxed">
                          {latestOrderWithAddress.address}
                        </p>
                        <p className="text-muted-foreground text-[10px] mt-0.5">
                          {latestOrderWithAddress.city}, {latestOrderWithAddress.postal_code}
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-3 bg-warning/5 border border-warning/15 rounded-xl text-warning text-xs flex gap-2">
                    <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>
                      No delivery address on record yet. Place your first requisition to record
                      office location.
                    </span>
                  </div>
                )}
                <div className="pt-2 border-t border-border/10">
                  <Link to={`${roleBase}/settings` as never}>
                    <Button
                      variant="outline"
                      className="w-full text-xs font-semibold rounded-xl h-8.5 text-left"
                    >
                      Edit Profile Info
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Recommended Peripherals Card */}
            <Card className="liquid-card border-border/55">
              <CardHeader className="pb-3 border-b border-border/10">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Boxes className="h-4.5 w-4.5 text-accent" />
                  Recommended Equipment
                </CardTitle>
                <CardDescription className="text-xs">
                  Quick picks from lab stock catalog.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-3.5">
                {recommendedDevices.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2 text-center">
                    No catalog items available.
                  </p>
                ) : (
                  recommendedDevices.map((d: any) => {
                    const price = Number(d.price);
                    return (
                      <div
                        key={d.id}
                        className="flex gap-3 items-center rounded-xl border border-border/55 bg-secondary/10 p-2.5 transition-all duration-300 hover:shadow-sm"
                      >
                        {d.image_url ? (
                          <img
                            src={d.image_url}
                            alt={d.name}
                            className="h-11 w-11 rounded-lg object-cover bg-zinc-950 border border-border/40 shrink-0"
                          />
                        ) : (
                          <div className="h-11 w-11 rounded-lg bg-zinc-900 border border-border/40 shrink-0 flex items-center justify-center text-muted-foreground">
                            <Boxes className="h-5 w-5" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h5 className="font-bold text-foreground text-xs truncate leading-tight">
                            {d.name}
                          </h5>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[80px]">
                              {d.brand}
                            </span>
                            <span className="text-[10px] text-success font-black">
                              ${price.toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <Link to={`/products?q=${encodeURIComponent(d.name)}` as never}>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 rounded-lg text-muted-foreground hover:text-primary"
                          >
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      </div>
                    );
                  })
                )}
                <div className="pt-1.5">
                  <Link to="/products">
                    <Button
                      variant="outline"
                      className="w-full text-xs font-semibold rounded-xl h-8.5"
                    >
                      Browse Full Storefront
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Dynamic Scheduler & Event Calendar Section */}
        <div className="pt-4">
          <DashboardCalendar />
        </div>

        {/* Order Details dialog (Modal) */}
        <Dialog open={!!selectedOrder} onOpenChange={(v) => !v && setSelectedOrder(null)}>
          <DialogContent className="max-w-2xl rounded-2xl border-border bg-card">
            {selectedOrder && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-base font-bold flex items-center justify-between">
                    <span>Order {selectedOrder.order_number}</span>
                    <Badge
                      variant="outline"
                      className="capitalize text-[10px] border-primary text-primary"
                    >
                      {selectedOrder.status}
                    </Badge>
                  </DialogTitle>
                </DialogHeader>
                <div className="grid gap-3 sm:grid-cols-2 text-xs border-b border-border/20 pb-4 pt-1">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                      Recipient
                    </p>
                    <p className="font-bold text-foreground text-sm">
                      {selectedOrder.customer_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                      Order Date
                    </p>
                    <p className="text-foreground">
                      {new Date(selectedOrder.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                      Email
                    </p>
                    <p className="text-foreground">{selectedOrder.email}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                      Phone
                    </p>
                    <p className="text-foreground">{selectedOrder.phone}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                      Shipping Address
                    </p>
                    <p className="text-foreground font-medium">
                      {selectedOrder.address}, {selectedOrder.city} {selectedOrder.postal_code}
                    </p>
                  </div>
                  {selectedOrder.notes && (
                    <div className="sm:col-span-2">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                        Notes
                      </p>
                      <p className="text-foreground italic bg-secondary/15 rounded-md p-2 mt-1">
                        "{selectedOrder.notes}"
                      </p>
                    </div>
                  )}
                </div>
                <div className="rounded-xl border border-border overflow-hidden">
                  <div className="border-b border-border bg-secondary/20 px-4 py-2.5 text-[10px] font-bold uppercase text-muted-foreground">
                    Items List
                  </div>
                  <table className="w-full text-xs">
                    <tbody>
                      {selectedOrderItems.length === 0 ? (
                        <tr>
                          <td
                            colSpan={3}
                            className="px-4 py-4 text-center text-muted-foreground italic"
                          >
                            Loading items...
                          </td>
                        </tr>
                      ) : (
                        selectedOrderItems.map((item: any) => (
                          <tr key={item.id} className="border-b border-border/30 last:border-0">
                            <td className="px-4 py-2 text-foreground font-semibold">
                              {item.device_name}
                            </td>
                            <td className="px-4 py-2 text-muted-foreground text-center">
                              ×{item.quantity}
                            </td>
                            <td className="px-4 py-2 text-right text-foreground font-mono">
                              ${(Number(item.unit_price) * item.quantity).toFixed(2)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-border bg-secondary/25 font-bold">
                        <td colSpan={2} className="px-4 py-2 text-sm text-foreground">
                          Total
                        </td>
                        <td className="px-4 py-2 text-right text-sm text-primary font-mono">
                          ${Number(selectedOrder.total).toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }



  // ----------------------------------------------------
  // ADMIN/STAFF DASHBOARD VIEW
  // ----------------------------------------------------
  const totalDevices = devices.length;
  const totalUnits = devices.reduce((s: number, d: any) => s + (d.quantity ?? 0), 0);
  const available = devices.filter((d: any) => d.status === "Available").length;
  const maintenance = devices.filter((d: any) => d.status === "Under Maintenance").length;
  const inUse = devices.filter((d: any) => d.status === "In Use").length;
  const damaged = devices.filter((d: any) => d.status === "Damaged").length;
  const grandValue = devices.reduce(
    (s: number, d: any) => s + Number(d.price) * (d.quantity ?? 1),
    0,
  );

  const byCategory = Object.entries(
    (devices as any[]).reduce((acc: Record<string, number>, d: any) => {
      acc[d.category] = (acc[d.category] ?? 0) + (d.quantity ?? 1);
      return acc;
    }, {}),
  ).map(([name, value]) => ({ name, value: value as number }));

  const byStatus = ["Available", "In Use", "Under Maintenance", "Damaged", "Disposed"].map(
    (s: string) => ({
      name: s,
      count: devices.filter((d: any) => d.status === s).length,
    }),
  );

  const deviceMonthly = Array.from({ length: 6 }).map((_, idx: number) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - idx));
    const key = format(d, "MMM");
    const count = devices.filter((dev: any) => {
      const dt = new Date(dev.created_at);
      return dt.getMonth() === d.getMonth() && dt.getFullYear() === d.getFullYear();
    }).length;
    return { month: key, count };
  });

  const totalOrders = orders.length;
  const totalSales = orders
    .filter((o: any) => o.status !== "Cancelled")
    .reduce((s: number, o: any) => s + Number(o.total), 0);
  const totalCustomers = Array.from(new Set(orders.map((o: any) => o.email.toLowerCase()))).length;
  const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

  const orderStatusDistribution = Object.entries(
    (orders as any[]).reduce((acc: Record<string, number>, o: any) => {
      acc[o.status] = (acc[o.status] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([name, value]) => ({ name, value: value as number }));

  const salesMonthly = Array.from({ length: 6 }).map((_, idx) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - idx));
    const key = format(d, "MMM");
    const totalAmount = orders
      .filter((o: any) => {
        const dt = new Date(o.created_at);
        return (
          dt.getMonth() === d.getMonth() &&
          dt.getFullYear() === d.getFullYear() &&
          o.status !== "Cancelled"
        );
      })
      .reduce((s: number, o: any) => s + Number(o.total), 0);
    return { month: key, Sales: totalAmount };
  });

  const recentDevices = [...devices]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const recentOrders = orders.slice(0, 5);

  return (
    <div className="relative min-h-screen space-y-6">
      {/* Background Liquid Blurs */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="aurora-bg absolute inset-0 opacity-15" />
        <div className="liquid-orb animate-blob absolute top-1/4 left-1/4 h-[350px] w-[350px] bg-primary/5 opacity-60" />
        <div
          className="liquid-orb animate-blob absolute bottom-1/3 right-10 h-[400px] w-[400px] bg-accent/5 opacity-50"
          style={{ animationDelay: "-6s" }}
        />
      </div>

      {/* Header section */}
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl bg-gradient-to-r from-foreground via-foreground to-foreground/60 bg-clip-text text-transparent">
            Admin Overview
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your hardware inventory, customers, and client orders.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to={`${roleBase}/devices` as never}
            className="hidden items-center gap-1 text-sm text-primary hover:underline sm:inline-flex"
          >
            Inventory <ArrowUpRight className="h-4 w-4" />
          </Link>
          <span className="text-muted-foreground hidden sm:inline">•</span>
          <Link
            to={`${roleBase}/orders` as never}
            className="hidden items-center gap-1 text-sm text-accent hover:underline sm:inline-flex"
          >
            Orders <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
      {/* Low Stock Alerts Banner */}
      {lowStockDevices.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5 text-destructive-foreground liquid-card overflow-hidden">
          <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-destructive/10 rounded-xl text-destructive shrink-0 mt-0.5 animate-pulse">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">Critical Low Stock Warning</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  The following items are running low on stock (5 or fewer remaining) and require restocking.
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {lowStockDevices.map((d: any) => (
                    <Badge key={d.id} variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive text-[10px] font-bold px-2 py-0.5 rounded-lg">
                      {d.name} ({d.quantity} remaining)
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <Link to={`${roleBase}/devices` as never}>
              <Button size="sm" variant="outline" className="rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10 text-xs shrink-0 cursor-pointer">
                Manage Inventory
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-[580px] rounded-xl border border-border bg-card/65 p-1">
          <TabsTrigger value="overview" className="rounded-lg text-xs font-bold transition-all">
            Inventory Overview
          </TabsTrigger>
          <TabsTrigger value="sales" className="rounded-lg text-xs font-bold transition-all">
            Sales & Customers
          </TabsTrigger>
          <TabsTrigger value="planner" className="rounded-lg text-xs font-bold transition-all">
            Lab Planner & Calendar
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Inventory Overview */}
        <TabsContent value="overview" className="space-y-6 outline-none">
          {/* Stat cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard
              label="Total Devices"
              value={totalDevices}
              sub={`${totalUnits} units`}
              icon={Boxes}
              tone="primary"
              loading={dashboardLoading}
            />
            <StatCard
              label="Available"
              value={available}
              icon={CheckCircle2}
              tone="success"
              loading={dashboardLoading}
            />
            <StatCard
              label="In Use"
              value={inUse}
              icon={Boxes}
              tone="primary"
              loading={dashboardLoading}
            />
            <StatCard
              label="Maintenance"
              value={maintenance}
              sub={`${damaged} damaged`}
              icon={Wrench}
              tone="warning"
              loading={dashboardLoading}
            />
            <StatCard
              label="Total Value"
              value={`$${grandValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
              icon={DollarSign}
              tone="accent"
              loading={dashboardLoading}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {/* Devices by status chart */}
            <Card className="lg:col-span-2 liquid-card border-border/55">
              <CardHeader>
                <CardTitle className="text-base font-bold text-foreground">
                  Devices by status
                </CardTitle>
                <CardDescription className="text-xs">
                  Fulfillment and operational statuses of academic hardware.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byStatus}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--color-border)"
                      opacity={0.4}
                    />
                    <XAxis
                      dataKey="name"
                      stroke="var(--color-muted-foreground)"
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis stroke="var(--color-muted-foreground)" tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        background: "var(--color-card)",
                        border: "1px solid var(--color-border)",
                        borderRadius: 12,
                      }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {byStatus.map((s) => (
                        <Cell key={s.name} fill={STATUS_COLORS[s.name]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Category breakdown */}
            <Card className="liquid-card border-border/55">
              <CardHeader>
                <CardTitle className="text-base font-bold text-foreground">By category</CardTitle>
                <CardDescription className="text-xs">
                  Quantity breakdown by device interface group.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-72 flex flex-col justify-between">
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={byCategory}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={48}
                        outerRadius={76}
                        paddingAngle={4}
                      >
                        {byCategory.map((_, i) => (
                          <Cell
                            key={i}
                            fill={i % 2 === 0 ? "var(--color-primary)" : "var(--color-accent)"}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "var(--color-card)",
                          border: "1px solid var(--color-border)",
                          borderRadius: 12,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap justify-center gap-3 text-[10px] text-muted-foreground">
                  {byCategory.map((c, i) => (
                    <div key={c.name} className="flex items-center gap-1">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{
                          background: i % 2 === 0 ? "var(--color-primary)" : "var(--color-accent)",
                        }}
                      />
                      {c.name} ({c.value})
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {/* Added last 6 months */}
            <Card className="lg:col-span-2 liquid-card border-border/55">
              <CardHeader>
                <CardTitle className="text-base font-bold text-foreground">
                  Devices added (last 6 months)
                </CardTitle>
                <CardDescription className="text-xs">
                  Registration timeline of laboratory inventory items.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={deviceMonthly}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--color-border)"
                      opacity={0.4}
                    />
                    <XAxis
                      dataKey="month"
                      stroke="var(--color-muted-foreground)"
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis stroke="var(--color-muted-foreground)" tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        background: "var(--color-card)",
                        border: "1px solid var(--color-border)",
                        borderRadius: 12,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="var(--color-primary)"
                      strokeWidth={2.5}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Latest devices list */}
            <Card className="liquid-card border-border/55">
              <CardHeader>
                <CardTitle className="text-base font-bold text-foreground">Latest added</CardTitle>
                <CardDescription className="text-xs">
                  Most recently registered peripherals.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentDevices.length === 0 && (
                  <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                    <PackageX className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No devices found</p>
                  </div>
                )}
                {recentDevices.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card/40 p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-foreground">{d.name}</p>
                      <p className="truncate text-[10px] text-muted-foreground">
                        {d.brand} {d.model}
                      </p>
                    </div>
                    <Badge variant="secondary" className="shrink-0 text-[9px] font-semibold">
                      {d.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {/* Real-Time Stock Tracker Table */}
            <Card className="lg:col-span-2 liquid-card border-border/55">
              <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/10">
                <div>
                  <CardTitle className="text-base font-bold text-foreground">Real-Time Stock Tracker</CardTitle>
                  <CardDescription className="text-xs">
                    Track sold units, remaining quantity, and total stock value in real time.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-[10px] border-primary/20 text-primary font-bold px-2 py-0.5 rounded-lg bg-primary/5">
                  Live Stock
                </Badge>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto max-h-[350px] overflow-y-auto pr-1 scrollbar-thin">
                {stockTrackingData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                    <PackageX className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No inventory items available to track.</p>
                  </div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border/40 bg-secondary/15 text-[10px] text-muted-foreground font-bold uppercase sticky top-0 z-10">
                        <th className="px-4 py-3 bg-card/90 backdrop-blur-sm">Product</th>
                        <th className="px-4 py-3 text-right bg-card/90 backdrop-blur-sm text-accent font-bold">Sold</th>
                        <th className="px-4 py-3 text-right bg-card/90 backdrop-blur-sm text-success font-bold">Remaining</th>
                        <th className="px-4 py-3 text-right bg-card/90 backdrop-blur-sm">Total</th>
                        <th className="px-4 py-3 text-right bg-card/90 backdrop-blur-sm">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stockTrackingData.map((s) => {
                        const lowStock = s.remaining <= 5;
                        return (
                          <tr key={s.id} className="border-b border-border/25 last:border-0 hover:bg-secondary/15 transition-colors">
                            <td className="px-4 py-2.5">
                              <span className="font-semibold text-foreground text-xs">{s.name}</span>
                              <span className="block text-[9px] text-muted-foreground font-mono">{s.brand} • {s.category}</span>
                            </td>
                            <td className="px-4 py-2.5 text-right font-bold text-accent font-mono text-xs">{s.sold}</td>
                            <td className="px-4 py-2.5 text-right font-mono">
                              <span className={`font-bold px-2 py-0.5 rounded-md text-xs ${lowStock ? "bg-destructive/15 text-destructive animate-pulse" : "text-success bg-success/15"}`}>
                                {s.remaining}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-right font-mono text-muted-foreground text-xs">{s.total}</td>
                            <td className="px-4 py-2.5 text-right font-semibold font-mono text-xs">${s.value.toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>

            {/* Category Management Breakdown List */}
            <Card className="liquid-card border-border/55">
              <CardHeader className="pb-3 border-b border-border/10">
                <CardTitle className="text-base font-bold text-foreground">Category Inventory Breakdown</CardTitle>
                <CardDescription className="text-xs">
                  Inventory summary structured by product categories.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 overflow-y-auto max-h-[350px] scrollbar-thin">
                {categoryManagementBreakdown.length === 0 ? (
                  <p className="text-xs text-muted-foreground p-6 text-center">No categories found.</p>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border/40 bg-secondary/15 text-[10px] text-muted-foreground font-bold uppercase sticky top-0 z-10">
                        <th className="px-4 py-3 bg-card/90 backdrop-blur-sm">Category</th>
                        <th className="px-4 py-3 text-right bg-card/90 backdrop-blur-sm">Products</th>
                        <th className="px-4 py-3 text-right bg-card/90 backdrop-blur-sm">Total Qty</th>
                        <th className="px-4 py-3 text-right bg-card/90 backdrop-blur-sm">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categoryManagementBreakdown.map((c) => (
                        <tr key={c.name} className="border-b border-border/20 last:border-0 hover:bg-secondary/10 transition-colors">
                          <td className="px-4 py-2.5 font-semibold text-foreground">{c.name}</td>
                          <td className="px-4 py-2.5 text-right font-mono">{c.uniqueProducts}</td>
                          <td className="px-4 py-2.5 text-right font-mono font-semibold text-primary">{c.totalStock}</td>
                          <td className="px-4 py-2.5 text-right font-mono font-bold text-success">${c.totalValue.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Database seeding controls */}
          <Card className="liquid-card border-border/55 bg-gradient-to-r from-card to-accent/5 overflow-hidden">
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-foreground">
                  Database Seeding Sandbox
                </CardTitle>
                <CardDescription className="text-xs">
                  Generate mock orders and customer accounts to test dashboard performance and
                  filtering metrics.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3 items-center pt-2">
              <Button
                onClick={handleSeed}
                disabled={seeding || clearing}
                className="rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold text-xs h-9 cursor-pointer"
              >
                {seeding ? (
                  <RefreshCw className="mr-2 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Database className="mr-2 h-3.5 w-3.5" />
                )}
                Seed Fake Customers & Orders
              </Button>
              <Button
                onClick={handleClear}
                disabled={seeding || clearing}
                variant="outline"
                className="rounded-xl border-destructive/40 text-destructive hover:bg-destructive/10 font-semibold text-xs h-9 cursor-pointer"
              >
                {clearing ? (
                  <RefreshCw className="mr-2 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ClipboardList className="mr-2 h-3.5 w-3.5" />
                )}
                Clear Order History
              </Button>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground ml-auto bg-card/65 px-3 py-1.5 rounded-lg border border-border/60">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                </span>
                <span>FIPS 140-3 Encryption Active</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Sales & Customers */}
        <TabsContent value="sales" className="space-y-6 outline-none">
          {/* Sales Stat cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total Sales"
              value={`$${totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              icon={DollarSign}
              tone="success"
              loading={dashboardLoading}
            />
            <StatCard
              label="Total Orders"
              value={totalOrders}
              icon={ShoppingCart}
              tone="primary"
              loading={dashboardLoading}
            />
            <StatCard
              label="Total Customers"
              value={totalCustomers}
              icon={Users}
              tone="accent"
              loading={dashboardLoading}
            />
            <StatCard
              label="Average Order Value"
              value={`$${averageOrderValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              icon={DollarSign}
              tone="primary"
              loading={dashboardLoading}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {/* Sales performance trend (Area Chart) */}
            <Card className="lg:col-span-2 liquid-card border-border/55">
              <CardHeader>
                <CardTitle className="text-base font-bold text-foreground">
                  Sales Performance (Last 6 Months)
                </CardTitle>
                <CardDescription className="text-xs">
                  Monthly total sales revenue generated from customer orders.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesMonthly}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-success)" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="var(--color-success)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--color-border)"
                      opacity={0.4}
                    />
                    <XAxis
                      dataKey="month"
                      stroke="var(--color-muted-foreground)"
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis stroke="var(--color-muted-foreground)" tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        background: "var(--color-card)",
                        border: "1px solid var(--color-border)",
                        borderRadius: 12,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="Sales"
                      stroke="var(--color-success)"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorSales)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Order status breakdown */}
            <Card className="liquid-card border-border/55">
              <CardHeader>
                <CardTitle className="text-base font-bold text-foreground">
                  Fulfillment Statuses
                </CardTitle>
                <CardDescription className="text-xs">
                  Fulfillment pipeline breakdown for placed orders.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-72 flex flex-col justify-between">
                {orderStatusDistribution.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 h-56 text-center text-muted-foreground">
                    <ShieldAlert className="h-8 w-8 text-muted-foreground" />
                    <p className="text-xs">No orders seeded yet</p>
                  </div>
                ) : (
                  <>
                    <div className="h-52">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={orderStatusDistribution}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={42}
                            outerRadius={70}
                            paddingAngle={3}
                          >
                            {orderStatusDistribution.map((entry) => (
                              <Cell
                                key={entry.name}
                                fill={ORDER_STATUS_COLORS[entry.name] || "var(--color-primary)"}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              background: "var(--color-card)",
                              border: "1px solid var(--color-border)",
                              borderRadius: 12,
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2.5 text-[9px] text-muted-foreground max-h-16 overflow-y-auto">
                      {orderStatusDistribution.map((item) => (
                        <div key={item.name} className="flex items-center gap-1">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{
                              background: ORDER_STATUS_COLORS[item.name] || "var(--color-primary)",
                            }}
                          />
                          {item.name} ({item.value})
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {/* Recent Orders table */}
            <Card className="lg:col-span-2 liquid-card border-border/55">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base font-bold text-foreground">
                    Recent Orders
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Last 5 orders placed through the public storefront.
                  </CardDescription>
                </div>
                <Link
                  to={`${roleBase}/orders` as never}
                  className="text-xs text-primary hover:underline font-bold"
                >
                  View all
                </Link>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                {recentOrders.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground text-xs">
                    No orders found. Click "Seed Fake Customers & Orders" under the Inventory tab to
                    generate mock data.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border/40 bg-secondary/15 text-[10px] text-muted-foreground font-bold uppercase">
                        <th className="px-4 py-2">Order #</th>
                        <th className="px-4 py-2">Customer</th>
                        <th className="px-4 py-2">Total</th>
                        <th className="px-4 py-2">Fulfillment</th>
                        <th className="w-12 px-4 py-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((o: any) => (
                        <tr
                          key={o.id}
                          className="border-b border-border/25 last:border-0 hover:bg-secondary/15 transition-colors"
                        >
                          <td className="px-4 py-2.5 font-mono text-[10px]">{o.order_number}</td>
                          <td className="px-4 py-2.5">
                            <div className="font-bold">{o.customer_name}</div>
                            <div className="text-[10px] text-muted-foreground">{o.email}</div>
                          </td>
                          <td className="px-4 py-2.5 font-semibold text-foreground">
                            ${Number(o.total).toFixed(2)}
                          </td>
                          <td className="px-4 py-2.5">
                            <Select
                              value={o.status}
                              onValueChange={(v) =>
                                updateOrderStatus.mutate({ id: o.id, status: v })
                              }
                            >
                              <SelectTrigger className="h-7 w-28 border border-border bg-card text-[10px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ORDER_STATUSES.map((s) => (
                                  <SelectItem key={s} value={s} className="text-[10px]">
                                    {s}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setSelectedOrder(o)}
                              className="h-6 w-6 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>

            {/* Top Customers (Spend) */}
            <Card className="liquid-card border-border/55">
              <CardHeader>
                <CardTitle className="text-base font-bold text-foreground">Top Customers</CardTitle>
                <CardDescription className="text-xs">
                  Highest value institutional purchasers by email.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {topCustomers.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground text-xs">
                    No customers found.
                  </div>
                ) : (
                  topCustomers.map((cust: any) => (
                    <div
                      key={cust.email}
                      className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card/40 p-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-foreground">{cust.name}</p>
                        <p className="truncate text-[10px] text-muted-foreground">{cust.email}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-extrabold text-success">
                          ${cust.totalSpend.toFixed(2)}
                        </p>
                        <p className="text-[9px] text-muted-foreground">
                          {cust.orderCount} order{cust.orderCount !== 1 && "s"}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="planner" className="outline-none">
          <DashboardCalendar />
        </TabsContent>
      </Tabs>

      {/* Order Details dialog (Modal) */}
      <Dialog open={!!selectedOrder} onOpenChange={(v) => !v && setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl rounded-2xl border-border bg-card">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base font-bold flex items-center justify-between">
                  <span>Order {selectedOrder.order_number}</span>
                  <Badge
                    variant="outline"
                    className="capitalize text-[10px] border-primary text-primary"
                  >
                    {selectedOrder.status}
                  </Badge>
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 sm:grid-cols-2 text-xs border-b border-border/20 pb-4 pt-1">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Customer
                  </p>
                  <p className="font-bold text-foreground text-sm">{selectedOrder.customer_name}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Order Date
                  </p>
                  <p className="text-foreground">
                    {new Date(selectedOrder.created_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Email
                  </p>
                  <p className="text-foreground">{selectedOrder.email}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Phone
                  </p>
                  <p className="text-foreground">{selectedOrder.phone}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Shipping Address
                  </p>
                  <p className="text-foreground">
                    {selectedOrder.address}, {selectedOrder.city} {selectedOrder.postal_code}
                  </p>
                </div>
                {selectedOrder.notes && (
                  <div className="sm:col-span-2">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Special Instructions
                    </p>
                    <p className="text-foreground italic bg-secondary/15 rounded-md p-2 mt-1">
                      "{selectedOrder.notes}"
                    </p>
                  </div>
                )}
              </div>
              <div className="my-4">
                <OrderGraphTracker currentStatus={selectedOrder.status} />
              </div>
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="border-b border-border bg-secondary/20 px-4 py-2.5 text-[10px] font-bold uppercase text-muted-foreground">
                  Order Items
                </div>
                <table className="w-full text-xs">
                  <tbody>
                    {selectedOrderItems.length === 0 ? (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-4 py-4 text-center text-muted-foreground italic"
                        >
                          Loading items...
                        </td>
                      </tr>
                    ) : (
                      selectedOrderItems.map((item: any) => (
                        <tr key={item.id} className="border-b border-border/30 last:border-0">
                          <td className="px-4 py-2 text-foreground font-semibold">
                            {item.device_name}
                          </td>
                          <td className="px-4 py-2 text-muted-foreground text-center">
                            ×{item.quantity}
                          </td>
                          <td className="px-4 py-2 text-right text-foreground font-mono">
                            ${(Number(item.unit_price) * item.quantity).toFixed(2)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-border bg-secondary/25 font-bold">
                      <td colSpan={2} className="px-4 py-2 text-sm text-foreground">
                        Grand Total
                      </td>
                      <td className="px-4 py-2 text-right text-sm text-primary font-mono">
                        ${Number(selectedOrder.total).toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone,
  loading,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: typeof Boxes;
  tone: "primary" | "success" | "warning" | "accent";
  loading?: boolean;
}) {
  const toneClass = {
    primary: "bg-primary/10 text-primary border-primary/20",
    success: "bg-success/10 text-success border-success/20",
    warning: "bg-warning/10 text-warning border-warning/20",
    accent: "bg-accent/10 text-accent border-accent/20",
  }[tone];
  return (
    <Card className="liquid-card border-border/55 overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {label}
            </p>
            <p className="mt-1 text-2xl font-black tracking-tight text-foreground truncate">
              {loading ? (
                <span className="inline-block h-8 w-16 animate-pulse rounded bg-muted" />
              ) : (
                value
              )}
            </p>
            {sub && <p className="mt-0.5 text-[10px] text-muted-foreground font-medium">{sub}</p>}
          </div>
          <div
            className={`grid h-9 w-9 place-items-center rounded-xl border ${toneClass} shrink-0`}
          >
            <Icon className="h-4.5 w-4.5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
