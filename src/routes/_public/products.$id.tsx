import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ShoppingCart, ArrowLeft, Minus, Plus, Truck, ShieldCheck, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";

export const Route = createFileRoute("/_public/products/$id")({
  component: ProductDetailPage,
});

function ProductDetailPage() {
  const { id } = useParams({ from: "/_public/products/$id" });
  const [qty, setQty] = useState(1);
  const { add } = useCart();

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data } = await supabase.from("devices").select("*").eq("id", id).maybeSingle();
      return data;
    },
  });

  const { data: related = [] } = useQuery({
    queryKey: ["related", product?.category],
    enabled: !!product,
    queryFn: async () => {
      const { data } = await supabase.from("devices").select("id,name,brand,price,image_url").eq("category", product!.category).neq("id", id).limit(4);
      return data ?? [];
    },
  });

  if (isLoading) return <div className="mx-auto max-w-7xl px-4 py-20">Loading…</div>;
  if (!product) return (
    <div className="mx-auto max-w-7xl px-4 py-20 text-center">
      <p className="text-muted-foreground">Product not found.</p>
      <Button asChild className="mt-4"><Link to="/products">Back to products</Link></Button>
    </div>
  );

  const specs: [string, string][] = [
    ["Brand", product.brand], ["Model", product.model], ["Category", product.category],
    ["Interface", product.interface], ["Serial #", product.serial_number],
    ...(product.supplier ? [["Supplier", product.supplier] as [string, string]] : []),
    ...(product.location ? [["Location", product.location] as [string, string]] : []),
    ...(product.warranty_expiry ? [["Warranty until", String(product.warranty_expiry)] as [string, string]] : []),
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8 lg:py-16">
      <Link to="/products" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to products</Link>

      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <div className="aspect-square overflow-hidden rounded-2xl border border-border bg-secondary">
            {product.image_url && <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />}
          </div>
          <div className="mt-4 grid grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-square overflow-hidden rounded-lg border border-border bg-secondary opacity-60">
                {product.image_url && <img src={product.image_url} alt="" className="h-full w-full object-cover" />}
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{product.category}</Badge>
            <Badge variant={product.status === "Available" ? "default" : "secondary"}>{product.status}</Badge>
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{product.name}</h1>
          <p className="mt-1 text-muted-foreground">{product.brand} • {product.model}</p>

          <div className="mt-6 text-4xl font-bold text-primary">${Number(product.price).toFixed(2)}</div>

          {product.description && <p className="mt-6 leading-relaxed text-muted-foreground">{product.description}</p>}

          <div className="mt-8 flex items-center gap-3">
            <div className="inline-flex items-center rounded-md border border-border">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-10 w-10 place-items-center hover:bg-secondary"><Minus className="h-4 w-4" /></button>
              <span className="w-12 text-center font-medium">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} className="grid h-10 w-10 place-items-center hover:bg-secondary"><Plus className="h-4 w-4" /></button>
            </div>
            <Button size="lg" className="flex-1 gap-2" disabled={product.status !== "Available"}
              onClick={() => {
                add({ id: product.id, name: product.name, brand: product.brand, price: Number(product.price), image_url: product.image_url }, qty);
                toast.success(`${qty} × ${product.name} added`);
              }}>
              <ShoppingCart className="h-4 w-4" /> Add to Cart
            </Button>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-3 text-center text-xs">
            {[[Truck, "Cash on delivery"], [ShieldCheck, "1-year warranty"], [RefreshCw, "Easy returns"]].map(([I, t], i) => {
              const Icon = I as any;
              return (
                <div key={i} className="rounded-lg border border-border bg-card p-3">
                  <Icon className="mx-auto h-4 w-4 text-primary" />
                  <p className="mt-1.5 text-muted-foreground">{t as string}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-8 overflow-hidden rounded-xl border border-border">
            <div className="border-b border-border bg-card px-4 py-2.5 text-sm font-semibold">Specifications</div>
            <table className="w-full text-sm">
              <tbody>
                {specs.map(([k, v]) => (
                  <tr key={k} className="border-b border-border/60 last:border-b-0">
                    <td className="w-1/3 px-4 py-2.5 text-muted-foreground">{k}</td>
                    <td className="px-4 py-2.5">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <div className="mt-20">
          <h2 className="text-2xl font-bold tracking-tight">Related products</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p: any) => (
              <Link key={p.id} to="/products/$id" params={{ id: p.id }} className="group overflow-hidden rounded-xl border border-border bg-card hover:border-primary/60">
                <div className="aspect-square overflow-hidden bg-secondary">
                  {p.image_url && <img src={p.image_url} alt={p.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" />}
                </div>
                <div className="p-4">
                  <p className="text-xs text-muted-foreground">{p.brand}</p>
                  <p className="mt-1 truncate font-medium">{p.name}</p>
                  <p className="mt-2 font-semibold text-primary">${Number(p.price).toFixed(2)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
