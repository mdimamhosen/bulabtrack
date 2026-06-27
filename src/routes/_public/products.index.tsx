import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  Search,
  ShoppingCart,
  Eye,
  Star,
  Heart,
  Layers,
  SlidersHorizontal,
  Trash2,
  Cpu,
  Check,
  ShieldCheck,
  Keyboard,
  Mouse,
  Webcam,
  Headphones,
  Printer,
  Monitor,
  HardDrive,
  Smartphone,
  Zap,
  Projector,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { enhanceProductWithNanoBanana } from "./products";

import { CatalogSkeleton } from "@/components/page-skeletons";

export const Route = createFileRoute("/_public/products/")({
  head: () => ({
    meta: [
      { title: "Products — LabTrack Peripheral Catalog" },
      {
        name: "description",
        content:
          "Browse 30+ premium Nano Banana lab peripherals: mechanical keyboards, high-DPI mice, monitors, and studio audio.",
      },
    ],
  }),
  component: ProductsPage,
  pendingComponent: CatalogSkeleton,
});

const PAGE_SIZE = 12;

const getPeripheralIcon = (type: string) => {
  const t = type.toLowerCase();
  if (t.includes("keyboard")) return Keyboard;
  if (t.includes("mouse")) return Mouse;
  if (t.includes("microphone") || t.includes("mic")) return Zap;
  if (t.includes("webcam") || t.includes("camera")) return Webcam;
  if (t.includes("audio") || t.includes("speaker") || t.includes("headset")) return Headphones;
  if (t.includes("display") || t.includes("monitor")) return Monitor;
  if (t.includes("printer")) return Printer;
  if (t.includes("tablet")) return Smartphone;
  if (t.includes("storage") || t.includes("ssd")) return HardDrive;
  if (t.includes("projector")) return Projector;
  return Layers;
};

function ProductsPage() {
  const [search, setSearch] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [selectedPeripheral, setSelectedPeripheral] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<string>("all");
  const [sort, setSort] = useState<string>("latest");
  const [page, setPage] = useState(1);
  const [wishlist, setWishlist] = useState<string[]>([]);

  const { data: rawProducts = [], isLoading } = useQuery({
    queryKey: ["public-products"],
    queryFn: async () => {
      const { data } = await supabase
        .from("devices")
        .select("*")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { add } = useCart();

  // Enhance all products with custom specs and Nano Banana images
  const products = useMemo(() => {
    return rawProducts.map(enhanceProductWithNanoBanana).filter(Boolean) as any[];
  }, [rawProducts]);

  // Extract dynamically generated lists
  const brandsList = useMemo(() => {
    return Array.from(
      new Set(products.map((p: any) => p.brand).filter(Boolean)),
    ).sort() as string[];
  }, [products]);

  const peripheralTypesList = useMemo(() => {
    return Array.from(
      new Set(products.map((p: any) => p.peripheralType).filter(Boolean)),
    ).sort() as string[];
  }, [products]);

  // Get counts dynamically based on active search/price selections
  const peripheralCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p: any) => {
      const matchesSearch =
        !search ||
        `${p.name} ${p.brand} ${p.model} ${p.specsList.join(" ")}`
          .toLowerCase()
          .includes(search.toLowerCase());
      const matchesBrand = selectedBrand === "all" || p.brand === selectedBrand;
      const matchesPrice =
        priceRange === "all" ||
        (() => {
          const [min, max] = priceRange.split("-").map(Number);
          return Number(p.price) >= min && (max ? Number(p.price) <= max : true);
        })();

      if (matchesSearch && matchesBrand && matchesPrice) {
        counts[p.peripheralType] = (counts[p.peripheralType] || 0) + 1;
      }
    });
    return counts;
  }, [products, search, selectedBrand, priceRange]);

  const brandCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p: any) => {
      const matchesSearch =
        !search ||
        `${p.name} ${p.brand} ${p.model} ${p.specsList.join(" ")}`
          .toLowerCase()
          .includes(search.toLowerCase());
      const matchesPeripheral =
        selectedPeripheral === "all" || p.peripheralType === selectedPeripheral;
      const matchesPrice =
        priceRange === "all" ||
        (() => {
          const [min, max] = priceRange.split("-").map(Number);
          return Number(p.price) >= min && (max ? Number(p.price) <= max : true);
        })();

      if (matchesSearch && matchesPeripheral && matchesPrice) {
        counts[p.brand] = (counts[p.brand] || 0) + 1;
      }
    });
    return counts;
  }, [products, search, selectedPeripheral, priceRange]);

  const filtered = useMemo(() => {
    let r = products as any[];
    if (search) {
      r = r.filter((p) =>
        `${p.name} ${p.brand} ${p.model} ${p.specsList.join(" ")}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      );
    }
    if (selectedPeripheral !== "all") {
      r = r.filter((p) => p.peripheralType === selectedPeripheral);
    }
    if (selectedBrand !== "all") {
      r = r.filter((p) => p.brand === selectedBrand);
    }
    if (priceRange !== "all") {
      const [min, max] = priceRange.split("-").map(Number);
      r = r.filter((p) => Number(p.price) >= min && (max ? Number(p.price) <= max : true));
    }
    if (sort === "price-asc") r = [...r].sort((a, b) => Number(a.price) - Number(b.price));
    if (sort === "price-desc") r = [...r].sort((a, b) => Number(b.price) - Number(a.price));
    if (sort === "name") r = [...r].sort((a, b) => a.name.localeCompare(b.name));
    return r;
  }, [products, search, selectedPeripheral, selectedBrand, priceRange, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleWishlist = (id: string) => {
    setWishlist((prev) => {
      const active = prev.includes(id);
      if (active) {
        toast.info("Removed from wishlist");
        return prev.filter((item) => item !== id);
      } else {
        toast.success("Saved to wishlist");
        return [...prev, id];
      }
    });
  };

  const hasFiltersActive =
    search !== "" ||
    selectedPeripheral !== "all" ||
    selectedBrand !== "all" ||
    priceRange !== "all";

  const clearAllFilters = () => {
    setSearch("");
    setSelectedPeripheral("all");
    setSelectedBrand("all");
    setPriceRange("all");
    setPage(1);
    toast.info("Filters cleared");
  };

  return (
    <div className="relative min-h-screen bg-background">
      {/* Background Liquid Blurs */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="aurora-bg absolute inset-0 opacity-15" />
        <div className="liquid-orb animate-blob absolute top-1/4 left-1/4 h-[350px] w-[350px] bg-primary/5 opacity-60" />
        <div
          className="liquid-orb animate-blob absolute bottom-1/3 right-10 h-[400px] w-[400px] bg-accent/5 opacity-50"
          style={{ animationDelay: "-6s" }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8 lg:py-16">
        {/* Page Header */}
        <div className="mb-10 text-center sm:text-left border-b border-border/20 pb-8">
          <Badge className="bg-primary/10 border-primary/20 text-primary px-3.5 py-1 mb-3">
            Storefront & Requisitions
          </Badge>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl bg-gradient-to-r from-foreground via-foreground to-foreground/60 bg-clip-text text-transparent">
            The Nano Banana Catalog
          </h1>
          <p className="mt-3 text-muted-foreground max-w-xl text-sm leading-relaxed">
            Reengineered custom academic peripherals. Every device carries active telemetry
            diagnostics and institutional compliance certificates.
          </p>
        </div>

        {/* E-Commerce Sidebar Layout */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Sticky Sidebar Filters */}
          <aside className="w-full lg:w-72 shrink-0 space-y-6 lg:sticky lg:top-24">
            {/* Search Card */}
            <div className="liquid-card rounded-2xl p-5 border-border/60 shadow-xl space-y-4">
              <h3 className="text-sm font-bold flex items-center gap-2 text-foreground">
                <Search className="h-4 w-4 text-primary" /> Search Inventory
              </h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
                <Input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Type to search..."
                  className="pl-9 glass-input border-border/80 rounded-xl text-xs"
                />
              </div>
            </div>

            {/* Peripheral Types Filter Card */}
            <div className="liquid-card rounded-2xl p-5 border-border/60 shadow-xl space-y-4">
              <h3 className="text-sm font-bold flex items-center gap-2 text-foreground">
                <Layers className="h-4 w-4 text-primary" /> Peripheral Types
              </h3>
              <div className="flex flex-col gap-1.5 max-h-52 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                <button
                  onClick={() => {
                    setSelectedPeripheral("all");
                    setPage(1);
                  }}
                  className={`w-full flex items-center justify-between text-xs px-3 py-2 rounded-xl transition-all cursor-pointer ${
                    selectedPeripheral === "all"
                      ? "bg-primary text-primary-foreground font-bold"
                      : "text-muted-foreground hover:bg-card/45 hover:text-foreground"
                  }`}
                >
                  <span>All Peripherals</span>
                  {selectedPeripheral === "all" ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <span className="text-[10px] text-muted-foreground/60">
                      ({products.length})
                    </span>
                  )}
                </button>
                {peripheralTypesList.map((type: string) => {
                  const IconComp = getPeripheralIcon(type);
                  const count = peripheralCounts[type] || 0;
                  return (
                    <button
                      key={type}
                      onClick={() => {
                        setSelectedPeripheral(type);
                        setPage(1);
                      }}
                      className={`w-full flex items-center justify-between text-xs px-3 py-2 rounded-xl transition-all text-left cursor-pointer ${
                        selectedPeripheral === type
                          ? "bg-primary text-primary-foreground font-bold"
                          : "text-muted-foreground hover:bg-card/45 hover:text-foreground"
                      }`}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <IconComp className="h-3.5 w-3.5 opacity-80" />
                        <span className="truncate">{type}</span>
                      </span>
                      {selectedPeripheral === type ? (
                        <Check className="h-3.5 w-3.5 shrink-0" />
                      ) : (
                        <span className="text-[10px] text-muted-foreground/50 shrink-0">
                          ({count})
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Brands/Company Filtration Card */}
            <div className="liquid-card rounded-2xl p-5 border-border/60 shadow-xl space-y-4">
              <h3 className="text-sm font-bold flex items-center gap-2 text-foreground">
                <Cpu className="h-4 w-4 text-primary" /> Companies / Brands
              </h3>
              <div className="flex flex-col gap-1.5 max-h-52 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                <button
                  onClick={() => {
                    setSelectedBrand("all");
                    setPage(1);
                  }}
                  className={`w-full flex items-center justify-between text-xs px-3 py-2 rounded-xl transition-all cursor-pointer ${
                    selectedBrand === "all"
                      ? "bg-primary text-primary-foreground font-bold"
                      : "text-muted-foreground hover:bg-card/45 hover:text-foreground"
                  }`}
                >
                  <span>All Companies</span>
                  {selectedBrand === "all" ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <span className="text-[10px] text-muted-foreground/60">
                      ({products.length})
                    </span>
                  )}
                </button>
                {brandsList.map((br: string) => {
                  const count = brandCounts[br] || 0;
                  return (
                    <button
                      key={br}
                      onClick={() => {
                        setSelectedBrand(br);
                        setPage(1);
                      }}
                      className={`w-full flex items-center justify-between text-xs px-3 py-2 rounded-xl transition-all text-left cursor-pointer ${
                        selectedBrand === br
                          ? "bg-primary text-primary-foreground font-bold"
                          : "text-muted-foreground hover:bg-card/45 hover:text-foreground"
                      }`}
                    >
                      <span className="truncate mr-2">{br}</span>
                      {selectedBrand === br ? (
                        <Check className="h-3.5 w-3.5 shrink-0" />
                      ) : (
                        <span className="text-[10px] text-muted-foreground/50 shrink-0">
                          ({count})
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Price Ranges Card */}
            <div className="liquid-card rounded-2xl p-5 border-border/60 shadow-xl space-y-4">
              <h3 className="text-sm font-bold flex items-center gap-2 text-foreground">
                <SlidersHorizontal className="h-4 w-4 text-primary" /> Price Ranges
              </h3>
              <div className="flex flex-col gap-1.5">
                {[
                  { id: "all", label: "Any Price" },
                  { id: "0-50", label: "Under $50" },
                  { id: "50-150", label: "$50 – $150" },
                  { id: "150-300", label: "$150 – $300" },
                  { id: "300-9999", label: "$300+" },
                ].map((range) => (
                  <button
                    key={range.id}
                    onClick={() => {
                      setPriceRange(range.id);
                      setPage(1);
                    }}
                    className={`w-full flex items-center justify-between text-xs px-3 py-2 rounded-xl transition-all cursor-pointer ${
                      priceRange === range.id
                        ? "bg-primary text-primary-foreground font-bold"
                        : "text-muted-foreground hover:bg-card/45 hover:text-foreground"
                    }`}
                  >
                    <span>{range.label}</span>
                    {priceRange === range.id && <Check className="h-3.5 w-3.5" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Compliance Telemetry Widget */}
            <div className="liquid-card rounded-2xl p-5 border-border/60 bg-gradient-to-br from-primary/5 to-accent/5 shadow-xl space-y-3.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Cpu className="h-4 w-4 text-accent animate-pulse" /> Telemetry Monitor
              </h4>
              <div className="space-y-2 text-[10px] leading-relaxed text-zinc-400">
                <div className="flex justify-between border-b border-border/10 pb-1">
                  <span>Inventory Sync</span>
                  <span className="text-success font-bold font-mono">100% OK</span>
                </div>
                <div className="flex justify-between border-b border-border/10 pb-1">
                  <span>Compliance Gate</span>
                  <span className="text-primary font-bold">NIST SP 800</span>
                </div>
                <div className="flex justify-between">
                  <span>Active Telemetry</span>
                  <span className="text-accent font-bold">Live Stream</span>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-success/15 border border-success/30 rounded-lg p-2 text-success">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span className="text-[9px] font-bold">FIPS 140-3 Cryptography</span>
              </div>
            </div>

            {/* Clear Filters Button */}
            {hasFiltersActive && (
              <Button
                onClick={clearAllFilters}
                variant="outline"
                className="w-full h-11 border-rose-500/40 text-rose-500 hover:bg-rose-500/10 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer animate-fade-in"
              >
                <Trash2 className="h-4 w-4" /> Reset Filters
              </Button>
            )}
          </aside>

          {/* Main Content Area (Products Grid) */}
          <div className="flex-1 w-full space-y-6">
            {/* Sort & Stats Bar */}
            <div className="flex items-center justify-between gap-4 border-b border-border/20 pb-4">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Displaying {filtered.length} Custom Device{filtered.length !== 1 && "s"}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-bold">Sort by:</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="rounded-xl border border-border/80 glass-input px-3 py-1.5 text-xs text-foreground outline-none hover:border-primary/40 focus:border-primary/60 transition-colors cursor-pointer"
                >
                  <option value="latest">Latest additions</option>
                  <option value="name">Name (A–Z)</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
              </div>
            </div>

            {/* Catalog Grid */}
            {isLoading ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 animate-pulse">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="border border-zinc-900 bg-zinc-950/40 rounded-2xl p-4 h-[360px] flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col gap-1.5">
                          <div className="h-5 w-16 rounded bg-zinc-800" />
                          <div className="h-3.5 w-12 rounded bg-zinc-900" />
                        </div>
                        <div className="h-7 w-7 rounded-full bg-zinc-900" />
                      </div>
                      <div className="h-32 w-full rounded-xl bg-zinc-900" />
                    </div>
                    <div className="space-y-2 mt-2">
                      <div className="flex justify-between">
                        <div className="h-3.5 w-10 rounded bg-zinc-900" />
                        <div className="h-3 w-6 rounded bg-zinc-900" />
                      </div>
                      <div className="h-4 w-3/4 rounded bg-zinc-800" />
                      <div className="flex gap-1.5">
                        <div className="h-4.5 w-8 rounded bg-zinc-900" />
                        <div className="h-4.5 w-10 rounded bg-zinc-900" />
                      </div>
                      <div className="border-t border-zinc-800/60 my-1" />
                      <div className="flex justify-between items-center pt-1">
                        <div className="flex flex-col gap-1">
                          <div className="h-2 w-8 rounded bg-zinc-900" />
                          <div className="h-4 w-12 rounded bg-zinc-800" />
                        </div>
                        <div className="h-8 w-8 rounded-lg bg-zinc-900" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : pageItems.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/80 p-16 text-center text-muted-foreground liquid-card">
                <p className="text-sm">No specialized peripherals match your current filters.</p>
                <Button
                  onClick={clearAllFilters}
                  variant="outline"
                  className="mt-4 rounded-xl border-primary text-primary hover:bg-primary/5"
                >
                  Clear All Filters
                </Button>
              </div>
            ) : (
              <motion.div layout className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                <AnimatePresence mode="popLayout">
                  {pageItems.map((p: any) => {
                    const isFavorite = wishlist.includes(p.id);
                    return (
                      <motion.div
                        layout
                        key={p.id}
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ duration: 0.3 }}
                        className="liquid-card group relative w-full h-[360px] overflow-hidden rounded-2xl border border-zinc-900 bg-zinc-950/40 hover:border-primary/45 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_30px_-10px_rgba(234,179,8,0.2)]"
                      >
                        {/* Background full-bleed image */}
                        {p.image_url && (
                          <div className="absolute inset-0 w-full h-full">
                            <img
                              src={p.image_url}
                              alt={p.name}
                              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 filter brightness-[0.65] contrast-[1.05]"
                              loading="lazy"
                            />
                            {/* Dark vignette gradient overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent" />
                          </div>
                        )}

                        {/* Card Content Overlay (layered on top) */}
                        <div className="absolute inset-0 flex flex-col justify-between p-4 z-10">
                          {/* Top Row: Category, Status and Wishlist */}
                          <div className="flex items-start justify-between">
                            <div className="flex flex-col gap-1.5 items-start">
                              <Badge className="bg-zinc-950/85 border border-zinc-800 text-zinc-300 backdrop-blur-md text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-md">
                                {p.peripheralType}
                              </Badge>
                              <div className="flex items-center gap-1 bg-zinc-950/85 border border-zinc-800/85 backdrop-blur px-2 py-0.5 rounded-full">
                                <span
                                  className={`inline-block h-1.5 w-1.5 rounded-full ${p.status === "Available" ? "bg-success animate-pulse" : "bg-amber-500"}`}
                                />
                                <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-zinc-300">
                                  {p.status === "Available" ? "SYNC OK" : "MAINTENANCE"}
                                </span>
                              </div>
                            </div>

                            <button
                              onClick={() => toggleWishlist(p.id)}
                              className={`h-7 w-7 rounded-full border flex items-center justify-center backdrop-blur-md transition-colors cursor-pointer ${
                                isFavorite
                                  ? "bg-rose-500/20 text-rose-500 border-rose-500/40"
                                  : "bg-zinc-950/70 border-zinc-800 text-zinc-300 hover:bg-rose-500/10 hover:text-rose-500"
                              }`}
                            >
                              <Heart
                                className={`h-3.5 w-3.5 ${isFavorite ? "fill-current" : ""}`}
                              />
                            </button>
                          </div>

                          {/* Bottom Section */}
                          <div className="space-y-2">
                            {/* Brand and Rating */}
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span className="font-extrabold uppercase tracking-widest text-[8px] bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded text-primary">
                                {p.brand}
                              </span>
                              <span className="flex items-center gap-1 font-semibold text-zinc-300 text-[10px]">
                                <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                                {p.rating}
                              </span>
                            </div>

                            {/* Title (Link to Detail Page) */}
                            <Link
                              to="/products/$id"
                              params={{ id: p.id }}
                              className="block font-bold text-sm text-white hover:text-primary leading-tight transition-colors truncate"
                            >
                              {p.name}
                            </Link>

                            {/* Tags Grid (Short horizontally) */}
                            <div className="flex flex-wrap gap-1">
                              {p.tags?.slice(0, 2).map((tag: string) => (
                                <Badge
                                  key={tag}
                                  variant="outline"
                                  className="text-[8px] font-medium border-zinc-800/80 bg-zinc-950/50 text-zinc-400 px-1.5 py-0.5 rounded"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>

                            {/* Divider */}
                            <div className="border-t border-zinc-800/60 my-1" />

                            {/* Price and Action Row */}
                            <div className="flex items-center justify-between pt-1">
                              <div className="flex flex-col">
                                <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider leading-none">
                                  REQ VAL
                                </span>
                                <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-base font-black text-transparent">
                                  ${Number(p.price).toFixed(2)}
                                </span>
                              </div>

                              <div className="flex gap-1.5">
                                <Button
                                  asChild
                                  size="sm"
                                  variant="outline"
                                  className="h-8 w-8 p-0 border-zinc-800 bg-zinc-950/50 hover:bg-zinc-900 text-zinc-300 hover:text-white rounded-lg cursor-pointer shrink-0"
                                >
                                  <Link
                                    to="/products/$id"
                                    params={{ id: p.id }}
                                    title="Specifications"
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                  </Link>
                                </Button>
                                <Button
                                  size="sm"
                                  disabled={p.status !== "Available"}
                                  onClick={() => {
                                    add({
                                      id: p.id,
                                      name: p.name,
                                      brand: p.brand,
                                      price: Number(p.price),
                                      image_url: p.image_url,
                                    });
                                    toast.success("Added to requisition cart");
                                  }}
                                  className="h-8 px-2.5 rounded-lg bg-gradient-to-r from-primary to-accent text-primary-foreground text-[10px] font-bold cursor-pointer"
                                >
                                  <ShoppingCart className="h-3 w-3 mr-1 shrink-0" /> Req
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </motion.div>
            )}

            {/* Stepped Pagination */}
            {totalPages > 1 && (
              <div className="mt-12 flex justify-center items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="rounded-xl border-border h-9"
                >
                  Prev
                </Button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <Button
                    key={i}
                    size="sm"
                    variant={page === i + 1 ? "default" : "outline"}
                    onClick={() => setPage(i + 1)}
                    className={`h-9 w-9 rounded-xl ${page === i + 1 ? "bg-primary text-primary-foreground shadow-glow" : "border-border"}`}
                  >
                    {i + 1}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-xl border-border h-9"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
