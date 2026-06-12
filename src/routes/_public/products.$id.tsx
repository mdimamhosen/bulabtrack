import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  ShoppingCart, ArrowLeft, Minus, Plus, Truck, ShieldCheck, RefreshCw,
  Phone, MessageCircle, Mail, MapPin, Clock, Star, Share2, Heart, CheckCircle2, Zap, Award,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";
import { motion } from "framer-motion";

export const Route = createFileRoute("/_public/products/$id")({
  component: ProductDetailPage,
});

const SUPPORT_PHONE = "+1 (800) 555-0142";
const SUPPORT_PHONE_HREF = "tel:+18005550142";

function ProductDetailPage() {
  const { id } = useParams({ from: "/_public/products/$id" });
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const { add } = useCart();

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data } = await supabase.from("devices").select("*").eq("id", id).maybeSingle();
      return data;
    },
  });

  const { data: related = [] } = useQuery({
    queryKey: ["related", product?.category, id],
    enabled: !!product,
    queryFn: async () => {
      const { data } = await supabase.from("devices").select("id,name,brand,price,image_url,category").eq("category", product!.category).neq("id", id).limit(4);
      return data ?? [];
    },
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20">
        <div className="liquid-card h-96 animate-pulse rounded-3xl" />
      </div>
    );
  }
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
    ...(product.location ? [["Lab Location", product.location] as [string, string]] : []),
    ...(product.warranty_expiry ? [["Warranty until", String(product.warranty_expiry)] as [string, string]] : []),
    ...(product.purchase_date ? [["Purchase date", String(product.purchase_date)] as [string, string]] : []),
  ];

  const galleryImages = product.image_url ? [product.image_url, product.image_url, product.image_url, product.image_url] : [];

  return (
    <div className="relative">
      {/* Liquid background orbs */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[700px] overflow-hidden">
        <div className="liquid-orb animate-blob absolute -top-32 left-1/4 h-[400px] w-[400px] opacity-50" />
        <div className="liquid-orb animate-blob absolute right-0 top-20 h-[420px] w-[420px] opacity-40" style={{ animationDelay: "-8s" }} />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8 lg:py-16">
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-foreground">Products</Link>
          <span>/</span>
          <span className="text-foreground">{product.name}</span>
        </nav>

        <Link to="/products" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to products
        </Link>

        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr]">
          {/* === GALLERY === */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="liquid-card relative aspect-square overflow-hidden rounded-3xl p-3">
              <div className="relative h-full w-full overflow-hidden rounded-2xl bg-gradient-to-br from-secondary via-card to-secondary">
                {galleryImages[activeImg] && (
                  <motion.img
                    key={activeImg}
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    src={galleryImages[activeImg]}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                )}
                {/* Floating chips */}
                <div className="absolute left-4 top-4 flex flex-col gap-2">
                  <Badge className="liquid-card border-none bg-background/60 text-foreground backdrop-blur-xl">
                    <Award className="mr-1 h-3 w-3 text-primary" /> Lab certified
                  </Badge>
                  {product.status === "Available" && (
                    <Badge className="liquid-card border-none bg-success/20 text-success backdrop-blur-xl">
                      <CheckCircle2 className="mr-1 h-3 w-3" /> In stock
                    </Badge>
                  )}
                </div>
                <div className="absolute right-4 top-4 flex gap-2">
                  <button className="liquid-card grid h-10 w-10 place-items-center rounded-full backdrop-blur-xl transition hover:bg-card/80" aria-label="Wishlist">
                    <Heart className="h-4 w-4" />
                  </button>
                  <button className="liquid-card grid h-10 w-10 place-items-center rounded-full backdrop-blur-xl transition hover:bg-card/80" aria-label="Share">
                    <Share2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Thumbnails */}
            {galleryImages.length > 0 && (
              <div className="mt-4 grid grid-cols-4 gap-3">
                {galleryImages.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`liquid-card aspect-square overflow-hidden rounded-xl p-1 transition-all ${
                      activeImg === i ? "ring-2 ring-primary" : "opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={src} alt="" className="h-full w-full rounded-lg object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* === DETAILS === */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="liquid-card">{product.category}</Badge>
              <Badge className="liquid-card border-none bg-gradient-to-r from-primary/20 to-accent/20 text-primary">
                {product.brand}
              </Badge>
              {product.interface && <Badge variant="outline" className="liquid-card">{product.interface}</Badge>}
            </div>

            <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
              <span className="bg-gradient-to-br from-foreground via-foreground to-foreground/60 bg-clip-text text-transparent">
                {product.name}
              </span>
            </h1>
            <p className="mt-2 text-muted-foreground">{product.brand} • Model {product.model}</p>

            {/* Rating */}
            <div className="mt-4 flex items-center gap-3">
              <div className="flex gap-0.5 text-warning">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
              </div>
              <span className="text-sm text-muted-foreground">4.9 (128 reviews)</span>
            </div>

            {/* Price */}
            <div className="liquid-card mt-6 rounded-2xl p-5">
              <div className="flex items-baseline gap-3">
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-5xl font-bold text-transparent">
                  ${Number(product.price).toFixed(2)}
                </span>
                <span className="text-lg text-muted-foreground line-through">
                  ${(Number(product.price) * 1.2).toFixed(2)}
                </span>
                <Badge className="bg-success/15 text-success">Save 17%</Badge>
              </div>
              <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <Zap className="h-3.5 w-3.5 text-primary" /> Cash on delivery available. Pay nothing today.
              </p>
            </div>

            {product.description && (
              <p className="mt-6 leading-relaxed text-muted-foreground">{product.description}</p>
            )}

            {/* Highlights */}
            <div className="mt-6 grid grid-cols-2 gap-2">
              {[
                "Plug & play setup",
                "Lab-grade durability",
                "1-year manufacturer warranty",
                "Free shipping over $50",
              ].map((h) => (
                <div key={h} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-success" /> {h}
                </div>
              ))}
            </div>

            {/* Qty + actions */}
            <div className="mt-8 flex items-center gap-3">
              <div className="liquid-card inline-flex items-center rounded-full">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-11 w-11 place-items-center rounded-full hover:bg-secondary"><Minus className="h-4 w-4" /></button>
                <span className="w-10 text-center font-semibold">{qty}</span>
                <button onClick={() => setQty((q) => q + 1)} className="grid h-11 w-11 place-items-center rounded-full hover:bg-secondary"><Plus className="h-4 w-4" /></button>
              </div>
              <Button size="lg" className="h-11 flex-1 gap-2 bg-gradient-to-r from-primary to-accent shadow-[0_8px_30px_-8px_oklch(0.62_0.22_257/0.7)]" disabled={product.status !== "Available"}
                onClick={() => {
                  add({ id: product.id, name: product.name, brand: product.brand, price: Number(product.price), image_url: product.image_url }, qty);
                  toast.success(`${qty} × ${product.name} added`);
                }}>
                <ShoppingCart className="h-4 w-4" /> Add to Cart
              </Button>
            </div>

            {/* Talk to us — opens right drawer */}
            <button
              onClick={() => setInquiryOpen(true)}
              className="liquid-card group mt-4 flex w-full items-center justify-between rounded-2xl p-4 text-left transition-all hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Talk to a specialist</p>
                  <p className="text-xs text-muted-foreground">Tap to see our number and chat options</p>
                </div>
              </div>
              <ArrowLeft className="h-4 w-4 rotate-180 text-muted-foreground transition-transform group-hover:translate-x-1" />
            </button>

            {/* Trust badges */}
            <div className="mt-6 grid grid-cols-3 gap-3 text-center text-xs">
              {[[Truck, "Cash on delivery"], [ShieldCheck, "1-year warranty"], [RefreshCw, "Easy returns"]].map(([I, t], i) => {
                const Icon = I as any;
                return (
                  <div key={i} className="liquid-card rounded-xl p-3">
                    <Icon className="mx-auto h-4 w-4 text-primary" />
                    <p className="mt-1.5 text-muted-foreground">{t as string}</p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* === SPECIFICATIONS === */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="liquid-card mt-16 overflow-hidden rounded-3xl">
          <div className="border-b border-border/40 bg-gradient-to-r from-primary/10 via-accent/5 to-transparent px-6 py-4">
            <h2 className="text-lg font-bold">Full Specifications</h2>
            <p className="text-xs text-muted-foreground">Every detail you need before procurement.</p>
          </div>
          <div className="grid sm:grid-cols-2">
            {specs.map(([k, v], i) => (
              <div key={k} className={`flex items-center justify-between gap-4 border-b border-border/40 px-6 py-3.5 ${i % 2 === 0 ? "sm:border-r" : ""}`}>
                <span className="text-sm text-muted-foreground">{k}</span>
                <span className="text-sm font-medium">{v}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* === RELATED === */}
        {related.length > 0 && (
          <div className="mt-20">
            <div className="mb-6 flex items-end justify-between">
              <div>
                <Badge variant="outline" className="liquid-card">You may also like</Badge>
                <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Related peripherals</h2>
              </div>
              <Button asChild variant="ghost"><Link to="/products">View all</Link></Button>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((p: any, i) => (
                <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                  <Link to="/products/$id" params={{ id: p.id }}
                    className="liquid-card group block overflow-hidden rounded-2xl transition-all hover:-translate-y-1 hover:shadow-[0_20px_60px_-20px_oklch(0.62_0.22_257/0.5)]">
                    <div className="aspect-square overflow-hidden bg-gradient-to-br from-secondary to-card">
                      {p.image_url && <img src={p.image_url} alt={p.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />}
                    </div>
                    <div className="p-4">
                      <p className="text-xs text-muted-foreground">{p.brand}</p>
                      <p className="mt-1 truncate text-sm font-semibold">{p.name}</p>
                      <p className="mt-2 bg-gradient-to-r from-primary to-accent bg-clip-text font-bold text-transparent">
                        ${Number(p.price).toFixed(2)}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* === RIGHT-SIDE INQUIRY DRAWER === */}
      <Sheet open={inquiryOpen} onOpenChange={setInquiryOpen}>
        <SheetContent side="right" className="w-full border-l border-border/60 bg-background/80 backdrop-blur-2xl sm:max-w-md">
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <div className="liquid-orb absolute -top-20 -right-20 h-[300px] w-[300px] opacity-60" />
            <div className="liquid-orb absolute bottom-0 left-0 h-[280px] w-[280px] opacity-40" />
          </div>
          <SheetHeader>
            <SheetTitle className="text-2xl">Talk to a specialist</SheetTitle>
            <SheetDescription>
              Have a question about <span className="font-medium text-foreground">{product.name}</span>? We're here.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            {/* Big phone CTA */}
            <a href={SUPPORT_PHONE_HREF}
              className="liquid-card group block rounded-2xl bg-gradient-to-br from-primary/15 via-accent/10 to-transparent p-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_60px_-20px_oklch(0.62_0.22_257/0.6)]">
              <div className="flex items-center gap-4">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg">
                  <Phone className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Call us now</p>
                  <p className="mt-1 bg-gradient-to-r from-primary to-accent bg-clip-text text-2xl font-bold text-transparent">
                    {SUPPORT_PHONE}
                  </p>
                </div>
              </div>
              <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" /> Mon–Sat, 9am – 7pm
              </p>
            </a>

            {/* WhatsApp / chat */}
            <a href="https://wa.me/18005550142" target="_blank" rel="noreferrer"
              className="liquid-card group flex items-center gap-4 rounded-2xl p-4 transition hover:-translate-y-0.5">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-success/15 text-success">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">WhatsApp chat</p>
                <p className="text-xs text-muted-foreground">Instant replies during business hours</p>
              </div>
              <ArrowLeft className="h-4 w-4 rotate-180 text-muted-foreground" />
            </a>

            {/* Email */}
            <a href="mailto:sales@labtrack.dev"
              className="liquid-card group flex items-center gap-4 rounded-2xl p-4 transition hover:-translate-y-0.5">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent/15 text-accent">
                <Mail className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">sales@labtrack.dev</p>
                <p className="text-xs text-muted-foreground">Reply within 24 hours</p>
              </div>
              <ArrowLeft className="h-4 w-4 rotate-180 text-muted-foreground" />
            </a>

            {/* Location */}
            <div className="liquid-card flex items-center gap-4 rounded-2xl p-4">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-warning/15 text-warning">
                <MapPin className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Visit our showroom</p>
                <p className="text-xs text-muted-foreground">221B Tech Street, Innovation Park</p>
              </div>
            </div>

            {/* Quick action */}
            <Button asChild className="w-full bg-gradient-to-r from-primary to-accent" size="lg">
              <Link to="/contact" onClick={() => setInquiryOpen(false)}>
                Send a detailed message
              </Link>
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
