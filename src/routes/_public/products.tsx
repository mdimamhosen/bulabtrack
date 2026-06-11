import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, ShoppingCart, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";

export const Route = createFileRoute("/_public/products")({
  head: () => ({
    meta: [
      { title: "Products — LabTrack Peripheral Catalog" },
      { name: "description", content: "Browse 30+ lab peripherals: keyboards, mice, monitors, printers, headsets and more." },
    ],
  }),
  component: ProductsPage,
});

const PAGE_SIZE = 12;

function ProductsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [brand, setBrand] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<string>("all");
  const [sort, setSort] = useState<string>("latest");
  const [page, setPage] = useState(1);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["public-products"],
    queryFn: async () => {
      const { data } = await supabase.from("devices").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { add } = useCart();

  const brands = useMemo(() => Array.from(new Set(products.map((p: any) => p.brand))).sort(), [products]);

  const filtered = useMemo(() => {
    let r = products as any[];
    if (search) r = r.filter((p) => `${p.name} ${p.brand} ${p.model}`.toLowerCase().includes(search.toLowerCase()));
    if (category !== "all") r = r.filter((p) => p.category === category);
    if (brand !== "all") r = r.filter((p) => p.brand === brand);
    if (priceRange !== "all") {
      const [min, max] = priceRange.split("-").map(Number);
      r = r.filter((p) => Number(p.price) >= min && (max ? Number(p.price) <= max : true));
    }
    if (sort === "price-asc") r = [...r].sort((a, b) => Number(a.price) - Number(b.price));
    if (sort === "price-desc") r = [...r].sort((a, b) => Number(b.price) - Number(a.price));
    if (sort === "name") r = [...r].sort((a, b) => a.name.localeCompare(b.name));
    return r;
  }, [products, search, category, brand, priceRange, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8 lg:py-16">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Catalog</h1>
        <p className="mt-2 text-muted-foreground">Browse our complete peripheral inventory and request what your lab needs.</p>
      </div>

      <div className="mb-6 grid gap-3 rounded-xl border border-border bg-card/60 p-4 lg:grid-cols-5">
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search devices…" className="pl-9" />
        </div>
        <Select value={category} onValueChange={(v) => { setCategory(v); setPage(1); }}>
          <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            <SelectItem value="Input Device">Input Device</SelectItem>
            <SelectItem value="Output Device">Output Device</SelectItem>
          </SelectContent>
        </Select>
        <Select value={brand} onValueChange={(v) => { setBrand(v); setPage(1); }}>
          <SelectTrigger><SelectValue placeholder="Brand" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All brands</SelectItem>
            {brands.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={priceRange} onValueChange={(v) => { setPriceRange(v); setPage(1); }}>
          <SelectTrigger><SelectValue placeholder="Price" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any price</SelectItem>
            <SelectItem value="0-50">Under $50</SelectItem>
            <SelectItem value="50-150">$50 – $150</SelectItem>
            <SelectItem value="150-300">$150 – $300</SelectItem>
            <SelectItem value="300-9999">$300+</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">{filtered.length} product{filtered.length !== 1 && "s"}</p>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="latest">Latest</SelectItem>
            <SelectItem value="name">Name (A–Z)</SelectItem>
            <SelectItem value="price-asc">Price: Low → High</SelectItem>
            <SelectItem value="price-desc">Price: High → Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-80 animate-pulse rounded-xl border border-border bg-card" />
          ))}
        </div>
      ) : pageItems.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">No products match your filters.</div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {pageItems.map((p: any) => (
            <div key={p.id} className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition hover:border-primary/60 hover:shadow-lg">
              <Link to="/products/$id" params={{ id: p.id }} className="aspect-square overflow-hidden bg-secondary">
                {p.image_url ? <img src={p.image_url} alt={p.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" /> : null}
              </Link>
              <div className="flex flex-1 flex-col p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs text-muted-foreground">{p.brand}</p>
                  <Badge variant={p.status === "Available" ? "default" : "secondary"} className="text-[10px]">{p.status}</Badge>
                </div>
                <Link to="/products/$id" params={{ id: p.id }} className="mt-1 line-clamp-2 font-medium hover:text-primary">{p.name}</Link>
                <p className="mt-0.5 text-xs text-muted-foreground">{p.category} • {p.interface}</p>
                <p className="mt-2 text-lg font-semibold text-primary">${Number(p.price).toFixed(2)}</p>
                <div className="mt-3 flex gap-2">
                  <Button asChild size="sm" variant="outline" className="flex-1"><Link to="/products/$id" params={{ id: p.id }}><Eye className="h-3.5 w-3.5" /> Details</Link></Button>
                  <Button size="sm" className="flex-1" disabled={p.status !== "Available"}
                    onClick={() => { add({ id: p.id, name: p.name, brand: p.brand, price: Number(p.price), image_url: p.image_url }); toast.success("Added to cart"); }}>
                    <ShoppingCart className="h-3.5 w-3.5" /> Add
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-10 flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
          {Array.from({ length: totalPages }).map((_, i) => (
            <Button key={i} size="sm" variant={page === i + 1 ? "default" : "outline"} onClick={() => setPage(i + 1)}>{i + 1}</Button>
          ))}
          <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
