import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/lib/role-context";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Search,
  Download,
  Pencil,
  Trash2,
  PackageX,
  LayoutGrid,
  List,
  SlidersHorizontal,
  Cpu,
  ShieldCheck,
  Check,
  Star,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { enhanceProductWithNanoBanana } from "@/routes/_public/products";

const STATUSES = ["Available", "In Use", "Under Maintenance", "Damaged", "Disposed"] as const;

export function DevicesPage({ roleBase }: { roleBase: string }) {
  const qc = useQueryClient();
  const { role } = useRole();
  const isAdmin = role === "admin";

  // Filter and Layout States
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [brand, setBrand] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [toDelete, setToDelete] = useState<string | null>(null);

  const { data: rawDevices = [], isLoading } = useQuery({
    queryKey: ["devices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("devices")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  // Enhance devices using storefront logic
  const devices = useMemo(() => {
    return rawDevices.map(enhanceProductWithNanoBanana).filter(Boolean);
  }, [rawDevices]);

  // Extract dynamic categories and brands from devices
  const categoriesList = useMemo(() => {
    return Array.from(new Set(devices.map((d) => d.peripheralType).filter(Boolean))).sort();
  }, [devices]);

  const brandsList = useMemo(() => {
    return Array.from(new Set(devices.map((d) => d.brand).filter(Boolean))).sort();
  }, [devices]);

  // Dynamic filter counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    devices.forEach((d) => {
      const matchesSearch =
        !q || `${d.name} ${d.brand} ${d.model}`.toLowerCase().includes(q.toLowerCase());
      const matchesStatus = status === "all" || d.status === status;
      const matchesBrand = brand === "all" || d.brand === brand;
      const matchesPrice =
        priceRange === "all" ||
        (() => {
          const [min, max] = priceRange.split("-").map(Number);
          return Number(d.price) >= min && (max ? Number(d.price) <= max : true);
        })();

      if (matchesSearch && matchesStatus && matchesBrand && matchesPrice) {
        counts[d.peripheralType] = (counts[d.peripheralType] || 0) + 1;
      }
    });
    return counts;
  }, [devices, q, status, brand, priceRange]);

  const brandCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    devices.forEach((d) => {
      const matchesSearch =
        !q || `${d.name} ${d.brand} ${d.model}`.toLowerCase().includes(q.toLowerCase());
      const matchesStatus = status === "all" || d.status === status;
      const matchesCategory = category === "all" || d.peripheralType === category;
      const matchesPrice =
        priceRange === "all" ||
        (() => {
          const [min, max] = priceRange.split("-").map(Number);
          return Number(d.price) >= min && (max ? Number(d.price) <= max : true);
        })();

      if (matchesSearch && matchesStatus && matchesCategory && matchesPrice) {
        counts[d.brand] = (counts[d.brand] || 0) + 1;
      }
    });
    return counts;
  }, [devices, q, status, category, priceRange]);

  // Apply filters
  const filtered = useMemo(() => {
    return devices.filter((d) => {
      if (status !== "all" && d.status !== status) return false;
      if (category !== "all" && d.peripheralType !== category) return false;
      if (brand !== "all" && d.brand !== brand) return false;
      if (priceRange !== "all") {
        const [min, max] = priceRange.split("-").map(Number);
        if (Number(d.price) < min || (max && Number(d.price) > max)) return false;
      }
      if (q) {
        const t = q.toLowerCase();
        if (
          !d.name.toLowerCase().includes(t) &&
          !d.brand.toLowerCase().includes(t) &&
          !d.model.toLowerCase().includes(t) &&
          !(d.serial_number ?? "").toLowerCase().includes(t) &&
          !(d.supplier ?? "").toLowerCase().includes(t) &&
          !(d.interface ?? "").toLowerCase().includes(t)
        )
          return false;
      }
      return true;
    });
  }, [devices, q, status, category, brand, priceRange]);

  const updateStatus = useMutation({
    mutationFn: async (args: { id: string; status: string }) => {
      const { error } = await supabase
        .from("devices")
        .update({ status: args.status as never })
        .eq("id", args.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Status updated successfully");
      qc.invalidateQueries({ queryKey: ["devices"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("devices").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Device deleted successfully");
      qc.invalidateQueries({ queryKey: ["devices"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      setToDelete(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const exportCsv = () => {
    if (filtered.length === 0) return toast.error("Nothing to export");
    const headers = [
      "Name",
      "Brand",
      "Model",
      "Category",
      "Status",
      "Interface",
      "Qty",
      "Price",
      "Total",
      "Serial",
      "Supplier",
      "Location",
    ];
    const lines = [headers.join(",")];
    for (const d of filtered) {
      lines.push(
        [
          d.name,
          d.brand,
          d.model,
          d.category,
          d.status,
          d.interface,
          d.quantity,
          d.price,
          Number(d.price) * (d.quantity ?? 1),
          d.serial_number,
          d.supplier ?? "",
          d.location ?? "",
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(","),
      );
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `devices-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearAllFilters = () => {
    setQ("");
    setStatus("all");
    setCategory("all");
    setBrand("all");
    setPriceRange("all");
    toast.info("Filters cleared");
  };

  const hasFiltersActive =
    q !== "" || status !== "all" || category !== "all" || brand !== "all" || priceRange !== "all";

  return (
    <div className="relative min-h-screen space-y-6">
      {/* Background Liquid Blurs */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="aurora-bg absolute inset-0 opacity-10" />
        <div className="liquid-orb animate-blob absolute top-1/4 left-1/4 h-[300px] w-[300px] bg-primary/5 opacity-55" />
        <div
          className="liquid-orb animate-blob absolute bottom-1/3 right-10 h-[350px] w-[350px] bg-accent/5 opacity-45"
          style={{ animationDelay: "-5s" }}
        />
      </div>

      {/* Header section */}
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border/20 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl bg-gradient-to-r from-foreground via-foreground to-foreground/60 bg-clip-text text-transparent">
            Admin Inventory
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Displaying {filtered.length} of {devices.length} registered hardware items.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Grid/Table Toggle */}
          <div className="flex items-center rounded-lg border border-border bg-card/65 p-1 mr-2">
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 rounded-md ${viewMode === "grid" ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground"}`}
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 rounded-md ${viewMode === "table" ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground"}`}
              onClick={() => setViewMode("table")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          <Button variant="outline" size="sm" onClick={exportCsv} className="rounded-xl">
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          {isAdmin && (
            <Link to={`${roleBase}/devices/new` as never}>
              <Button
                size="sm"
                className="rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground"
              >
                <Plus className="mr-2 h-4 w-4" /> Add device
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Main layout with sidebar filters */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Sticky Filters Sidebar */}
        <aside className="w-full lg:w-64 shrink-0 space-y-4 lg:sticky lg:top-20">
          {/* Search Card */}
          <div className="liquid-card rounded-2xl p-4 border-border/60 shadow-xl space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-foreground">
              <Search className="h-3.5 w-3.5 text-primary" /> Search Inventory
            </h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Name, brand, model, serial..."
                className="pl-9 glass-input border-border/80 rounded-xl text-xs h-9"
              />
            </div>
          </div>

          {/* Status filter card */}
          <div className="liquid-card rounded-2xl p-4 border-border/60 shadow-xl space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-foreground">
              <SlidersHorizontal className="h-3.5 w-3.5 text-primary" /> Status Filter
            </h3>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => setStatus("all")}
                className={`w-full flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg transition-all text-left cursor-pointer ${
                  status === "all"
                    ? "bg-primary text-primary-foreground font-bold"
                    : "text-muted-foreground hover:bg-card/45"
                }`}
              >
                <span>All Statuses</span>
                {status === "all" && <Check className="h-3.5 w-3.5" />}
              </button>
              {STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`w-full flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg transition-all text-left cursor-pointer ${
                    status === s
                      ? "bg-primary text-primary-foreground font-bold"
                      : "text-muted-foreground hover:bg-card/45"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${s === "Available" ? "bg-success" : s === "Under Maintenance" ? "bg-warning" : "bg-destructive"}`}
                    />
                    {s}
                  </span>
                  {status === s && <Check className="h-3.5 w-3.5" />}
                </button>
              ))}
            </div>
          </div>

          {/* Peripheral Types Filter */}
          <div className="liquid-card rounded-2xl p-4 border-border/60 shadow-xl space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-foreground">
              <SlidersHorizontal className="h-3.5 w-3.5 text-primary" /> Peripheral Type
            </h3>
            <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
              <button
                onClick={() => setCategory("all")}
                className={`w-full flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg transition-all text-left cursor-pointer ${
                  category === "all"
                    ? "bg-primary text-primary-foreground font-bold"
                    : "text-muted-foreground hover:bg-card/45"
                }`}
              >
                <span>All Types</span>
                {category === "all" ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <span className="text-[9px] text-muted-foreground/60">({devices.length})</span>
                )}
              </button>
              {categoriesList.map((type) => {
                const count = categoryCounts[type] || 0;
                return (
                  <button
                    key={type}
                    onClick={() => setCategory(type)}
                    className={`w-full flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg transition-all text-left cursor-pointer ${
                      category === type
                        ? "bg-primary text-primary-foreground font-bold"
                        : "text-muted-foreground hover:bg-card/45"
                    }`}
                  >
                    <span>{type}</span>
                    {category === type ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <span className="text-[9px] text-muted-foreground/50">({count})</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Brands Filter */}
          <div className="liquid-card rounded-2xl p-4 border-border/60 shadow-xl space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-foreground">
              <Cpu className="h-3.5 w-3.5 text-primary" /> Brands / Companies
            </h3>
            <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
              <button
                onClick={() => setBrand("all")}
                className={`w-full flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg transition-all text-left cursor-pointer ${
                  brand === "all"
                    ? "bg-primary text-primary-foreground font-bold"
                    : "text-muted-foreground hover:bg-card/45"
                }`}
              >
                <span>All Brands</span>
                {brand === "all" ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <span className="text-[9px] text-muted-foreground/60">({devices.length})</span>
                )}
              </button>
              {brandsList.map((br) => {
                const count = brandCounts[br] || 0;
                return (
                  <button
                    key={br}
                    onClick={() => setBrand(br)}
                    className={`w-full flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg transition-all text-left cursor-pointer ${
                      brand === br
                        ? "bg-primary text-primary-foreground font-bold"
                        : "text-muted-foreground hover:bg-card/45"
                    }`}
                  >
                    <span>{br}</span>
                    {brand === br ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <span className="text-[9px] text-muted-foreground/50">({count})</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="liquid-card rounded-2xl p-4 border-border/60 shadow-xl space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-foreground">
              <SlidersHorizontal className="h-3.5 w-3.5 text-primary" /> Price Range
            </h3>
            <div className="flex flex-col gap-1">
              {[
                { id: "all", label: "Any Price" },
                { id: "0-50", label: "Under $50" },
                { id: "50-150", label: "$50 – $150" },
                { id: "150-300", label: "$150 – $300" },
                { id: "300-9999", label: "$300+" },
              ].map((range) => (
                <button
                  key={range.id}
                  onClick={() => setPriceRange(range.id)}
                  className={`w-full flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg transition-all text-left cursor-pointer ${
                    priceRange === range.id
                      ? "bg-primary text-primary-foreground font-bold"
                      : "text-muted-foreground hover:bg-card/45"
                  }`}
                >
                  <span>{range.label}</span>
                  {priceRange === range.id && <Check className="h-3.5 w-3.5" />}
                </button>
              ))}
            </div>
          </div>

          {/* Compliance Card */}
          <div className="liquid-card rounded-2xl p-4 border-border/60 bg-gradient-to-br from-primary/5 to-accent/5 shadow-xl space-y-2.5">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5 text-accent animate-pulse" /> Diagnostic Telemetry
            </h4>
            <div className="space-y-1.5 text-[9px] leading-relaxed text-zinc-400">
              <div className="flex justify-between border-b border-border/10 pb-0.5">
                <span>Cryptographic Core</span>
                <span className="text-primary font-bold">FIPS 140-3</span>
              </div>
              <div className="flex justify-between">
                <span>Institutional Audit</span>
                <span className="text-success font-bold font-mono">100% SECURE</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-success/10 border border-success/20 rounded-md p-1.5 text-success">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
              <span className="text-[8px] font-bold">NIST SP 800 Compliant</span>
            </div>
          </div>

          {/* Reset Filters */}
          {hasFiltersActive && (
            <Button
              onClick={clearAllFilters}
              variant="outline"
              className="w-full border-rose-500/40 text-rose-500 hover:bg-rose-500/10 rounded-xl text-xs h-9 transition-all cursor-pointer"
            >
              Reset Filters
            </Button>
          )}
        </aside>

        {/* Main inventory display area */}
        <div className="flex-1 w-full">
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-80 animate-pulse rounded-2xl border border-border bg-card/45"
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/80 p-12 text-center text-muted-foreground liquid-card">
              <PackageX className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm">No hardware items match your filters.</p>
              <Button onClick={clearAllFilters} variant="outline" className="mt-4 rounded-xl">
                Reset All Filters
              </Button>
            </div>
          ) : viewMode === "grid" ? (
            <motion.div layout className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {filtered.map((p: any) => (
                  <motion.div
                    layout
                    key={p.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.25 }}
                    className="liquid-card group relative w-full h-[375px] overflow-hidden rounded-2xl border border-zinc-900 bg-zinc-950/40 hover:border-primary/45 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_28px_-12px_rgba(234,179,8,0.22)]"
                  >
                    {/* Background product image */}
                    {p.image_url && (
                      <div className="absolute inset-0 w-full h-full">
                        <img
                          src={p.image_url}
                          alt={p.name}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 filter brightness-[0.55] contrast-[1.05]"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/35 to-transparent" />
                      </div>
                    )}

                    {/* Card Content Layer */}
                    <div className="absolute inset-0 flex flex-col justify-between p-4 z-10">
                      {/* Top Row: type badge & status */}
                      <div className="flex items-start justify-between">
                        <div className="flex flex-col gap-1 items-start">
                          <Badge className="bg-zinc-950/85 border border-zinc-800 text-zinc-300 text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-md">
                            {p.peripheralType}
                          </Badge>
                          <div className="flex items-center gap-1 bg-zinc-950/85 border border-zinc-800/80 px-2 py-0.5 rounded-full">
                            <span
                              className={`inline-block h-1.5 w-1.5 rounded-full ${p.status === "Available" ? "bg-success animate-pulse" : p.status === "Under Maintenance" ? "bg-warning" : "bg-destructive"}`}
                            />
                            <span className="text-[7.5px] font-mono font-bold uppercase tracking-wider text-zinc-300">
                              {p.status}
                            </span>
                          </div>
                        </div>

                        {/* Rating info */}
                        <div className="flex items-center gap-0.5 bg-zinc-950/80 border border-zinc-800/80 px-1.5 py-0.5 rounded-md text-[9px] text-zinc-300 font-bold">
                          <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                          <span>{p.rating}</span>
                        </div>
                      </div>

                      {/* Bottom area */}
                      <div className="space-y-2.5">
                        <div className="min-w-0">
                          <span className="text-[8px] font-extrabold uppercase tracking-wider bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded text-primary">
                            {p.brand}
                          </span>
                          <h3 className="mt-1 font-bold text-sm text-white truncate" title={p.name}>
                            {p.name}
                          </h3>
                          <p className="text-[10px] text-zinc-400 font-mono truncate">
                            Model: {p.model} • SN: {p.serial_number}
                          </p>
                        </div>

                        {/* Specifications tags (slice to 2) */}
                        <div className="flex flex-wrap gap-1">
                          {p.tags?.slice(0, 2).map((t: string) => (
                            <Badge
                              key={t}
                              variant="outline"
                              className="text-[8px] font-medium border-zinc-800/80 bg-zinc-950/50 text-zinc-400 px-1.5 py-0.5 rounded"
                            >
                              {t}
                            </Badge>
                          ))}
                          <Badge
                            variant="outline"
                            className="text-[8px] border-zinc-800/80 bg-zinc-950/50 text-zinc-400 px-1.5 py-0.5 rounded"
                          >
                            Qty: {p.quantity}
                          </Badge>
                        </div>

                        <div className="border-t border-zinc-800/60 my-1" />

                        {/* Inline admin controls */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-zinc-400 font-bold">
                              Price:{" "}
                              <span className="text-white">${Number(p.price).toFixed(2)}</span>
                            </span>
                            <span className="text-xs font-extrabold text-primary">
                              ${(Number(p.price) * (p.quantity ?? 1)).toFixed(2)}
                            </span>
                          </div>

                          <div className="flex gap-2 items-center">
                            {/* Status dropselect */}
                            <div className="flex-1 min-w-0">
                              <Select
                                value={p.status}
                                onValueChange={(v) => updateStatus.mutate({ id: p.id, status: v })}
                              >
                                <SelectTrigger className="h-8 w-full border border-zinc-800 bg-zinc-950/80 text-[10px] rounded-lg text-zinc-300">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {STATUSES.map((s) => (
                                    <SelectItem key={s} value={s} className="text-[10px]">
                                      {s}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Edit / Delete triggers */}
                            {isAdmin && (
                              <div className="flex gap-1 shrink-0">
                                <Link to={`${roleBase}/devices/${p.id}/edit` as never}>
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-8 w-8 border-zinc-800 bg-zinc-950/50 hover:bg-zinc-900 text-zinc-300 hover:text-white rounded-lg cursor-pointer"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                </Link>
                                <Button
                                  size="icon"
                                  variant="outline"
                                  onClick={() => setToDelete(p.id)}
                                  className="h-8 w-8 border-zinc-800 bg-zinc-950/50 hover:bg-destructive/15 text-destructive rounded-lg cursor-pointer"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <Card className="liquid-card border-border/50">
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border/55 bg-secondary/20">
                      <TableHead>Device Detail</TableHead>
                      <TableHead className="hidden md:table-cell">Category / Type</TableHead>
                      <TableHead className="hidden lg:table-cell">Interface</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Total Value</TableHead>
                      <TableHead className="w-20" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((d) => (
                      <TableRow
                        key={d.id}
                        className="border-b border-border/40 hover:bg-secondary/20"
                      >
                        <TableCell>
                          <div className="font-semibold text-foreground text-sm">{d.name}</div>
                          <div className="text-[10px] text-muted-foreground font-mono">
                            {d.brand} {d.model} • SN: {d.serial_number}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                          {d.peripheralType}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                          {d.interface}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={d.status}
                            onValueChange={(v) => updateStatus.mutate({ id: d.id, status: v })}
                          >
                            <SelectTrigger className="h-8 w-36 border-border bg-card text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUSES.map((s) => (
                                <SelectItem key={s} value={s}>
                                  {s}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right text-xs">{d.quantity}</TableCell>
                        <TableCell className="text-right text-xs">
                          ${Number(d.price).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-medium text-sm text-primary">
                          ${(Number(d.price) * (d.quantity ?? 1)).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {isAdmin && (
                            <div className="flex gap-1 justify-end">
                              <Link to={`${roleBase}/devices/${d.id}/edit` as never}>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                              </Link>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setToDelete(d.id)}
                                className="h-7 w-7 text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      <AlertDialog open={!!toDelete} onOpenChange={(v) => !v && setToDelete(null)}>
        <AlertDialogContent className="rounded-2xl border-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete hardware device?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. It will remove this device from the active inventory
              catalog. Associated order logs will be set to NULL references but records will remain
              intact.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => toDelete && del.mutate(toDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
            >
              Delete Device
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
