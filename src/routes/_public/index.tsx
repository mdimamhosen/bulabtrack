import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowRight, ShieldCheck, BarChart3, Zap, Cpu, Wrench, Users, Star, Mail, CheckCircle2,
  Sparkles, Keyboard, Mouse, Headphones, Monitor, Camera, Mic, Truck, PackageCheck, PlayCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import heroImg from "@/assets/hero-peripherals.jpg";
import showcaseKb from "@/assets/showcase-keyboard.jpg";
import showcaseHs from "@/assets/showcase-headset.jpg";
import showcaseMs from "@/assets/showcase-mouse.jpg";

export const Route = createFileRoute("/_public/")({
  head: () => ({
    meta: [
      { title: "LabTrack — Premium Peripheral Inventory & Storefront" },
      { name: "description", content: "Discover, track and procure beautifully crafted peripherals for the modern computer laboratory." },
    ],
  }),
  component: HomePage,
});

const features = [
  { icon: Cpu, title: "Centralized Inventory", desc: "Every device, brand and serial — one searchable hub." },
  { icon: BarChart3, title: "Real-time Analytics", desc: "Live status, category and trend dashboards." },
  { icon: Wrench, title: "Maintenance Tracking", desc: "Log issues, schedule fixes, reduce downtime." },
  { icon: ShieldCheck, title: "Role-based Security", desc: "Granular admin & staff permissions out of the box." },
  { icon: Zap, title: "Lightning Fast", desc: "Built on edge infrastructure for instant responses." },
  { icon: Users, title: "Multi-user Teams", desc: "Designed for lab staff, instructors and procurement." },
];

const categories = [
  { icon: Keyboard, label: "Keyboards", count: "120+" },
  { icon: Mouse, label: "Mice", count: "85+" },
  { icon: Headphones, label: "Audio", count: "60+" },
  { icon: Monitor, label: "Displays", count: "40+" },
  { icon: Camera, label: "Webcams", count: "35+" },
  { icon: Mic, label: "Microphones", count: "28+" },
];

const stats = [
  { label: "Devices tracked", value: "30+" },
  { label: "Lab locations", value: "12" },
  { label: "Uptime", value: "99.9%" },
  { label: "Active users", value: "240+" },
];

const steps = [
  { n: "01", t: "Catalog", d: "Add every peripheral with brand, model, serial and location." },
  { n: "02", t: "Monitor", d: "Real-time dashboards surface availability and trends." },
  { n: "03", t: "Maintain", d: "Track maintenance windows and warranty expiry." },
  { n: "04", t: "Procure", d: "Order new devices from the integrated storefront." },
];

const testimonials = [
  { name: "Dr. Aisha Khan", role: "Lab Director, CS Dept.", quote: "LabTrack replaced our spreadsheets overnight. The analytics alone saved us hours weekly." },
  { name: "Marco Reyes", role: "IT Coordinator", quote: "Beautifully designed. Our staff onboarded in minutes — and the maintenance log is gold." },
  { name: "Priya Shah", role: "Procurement Lead", quote: "The storefront makes COD requisitions painless. A genuinely modern tool." },
];

const brands = ["Logitech", "Razer", "Dell", "HP", "Corsair", "SteelSeries", "ASUS", "Microsoft"];

function HomePage() {
  const { data: featured = [] } = useQuery({
    queryKey: ["featured-devices-home"],
    queryFn: async () => {
      const { data } = await supabase
        .from("devices")
        .select("id,name,brand,price,image_url,status,category,description")
        .eq("status", "Available")
        .limit(8);
      return data ?? [];
    },
  });

  const hero = featured[0];

  return (
    <div className="overflow-hidden">
      {/* ===== HERO ===== */}
      <section className="relative">
        {/* Aurora + grid + orbs */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="aurora-bg absolute inset-0 opacity-70" />
          <div className="ai-grid absolute inset-0 opacity-60" />
          <div className="liquid-orb animate-blob absolute -top-40 -left-20 h-[520px] w-[520px] opacity-70" />
          <div className="liquid-orb animate-blob absolute top-40 right-0 h-[460px] w-[460px] opacity-60" style={{ animationDelay: "-6s" }} />
          <div className="liquid-orb animate-blob absolute -bottom-40 left-1/3 h-[420px] w-[420px] opacity-50" style={{ animationDelay: "-12s" }} />
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,var(--color-background)_95%)]" />
        </div>

        <div className="mx-auto max-w-7xl px-4 pb-24 pt-16 lg:px-8 lg:pt-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
            {/* Left text */}
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div className="liquid-card inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs">
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                <span className="neon-text font-medium">
                  Now serving 240+ lab admins worldwide
                </span>
              </div>

              <h1 className="mt-6 text-balance text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
                Peripheral inventory,
                <span className="block neon-text">
                  reimagined for the AI era.
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
                LabTrack is the all-in-one platform to catalog, monitor, maintain and procure every
                peripheral in your computer laboratory — wrapped in a UI that finally feels modern.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button asChild size="lg" className="h-12 gap-2 bg-gradient-to-r from-primary to-accent px-6 text-base shadow-[0_8px_30px_-8px_oklch(0.62_0.22_257/0.7)] hover:opacity-90">
                  <Link to="/products">Explore catalog <ArrowRight className="h-4 w-4" /></Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="liquid-card h-12 gap-2 px-6 text-base">
                  <Link to="/auth"><PlayCircle className="h-4 w-4" /> Watch demo</Link>
                </Button>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-6 text-xs text-muted-foreground">
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" /> Free for academia</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" /> COD enabled</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" /> 30+ live devices</div>
              </div>
            </motion.div>

            {/* Right hero image */}
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.15 }} className="relative">
              <div className="liquid-card animate-float-slow relative overflow-hidden rounded-3xl p-2">
                <img src={heroImg} alt="Premium peripherals showcase" width={1600} height={1024}
                  className="aspect-[16/11] w-full rounded-2xl object-cover" />
                {/* shine */}
                <div className="pointer-events-none absolute inset-0 rounded-3xl bg-[linear-gradient(120deg,transparent_30%,rgba(255,255,255,0.08)_50%,transparent_70%)]" />
              </div>

              {/* Floating stat card */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                className="liquid-card absolute -bottom-6 -left-4 hidden rounded-2xl p-4 sm:block">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent">
                    <PackageCheck className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">In stock today</p>
                    <p className="text-lg font-bold">{featured.length || 30}+ items</p>
                  </div>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
                className="liquid-card absolute -top-4 -right-2 hidden rounded-2xl p-4 sm:block">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-accent to-primary">
                    <Truck className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Avg. delivery</p>
                    <p className="text-lg font-bold">24h COD</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* Brand bar */}
          <div className="mt-20 border-y border-border/60 py-6">
            <p className="text-center text-xs uppercase tracking-widest text-muted-foreground">Trusted brands in our catalog</p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 opacity-70">
              {brands.map((b) => (
                <span key={b} className="text-sm font-semibold tracking-wide">{b}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== CATEGORY GRID ===== */}
      <section className="relative border-t border-border/60">
        <div className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <Badge variant="outline" className="liquid-card">Shop by category</Badge>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Find exactly what your lab needs</h2>
            </div>
            <Button asChild variant="ghost"><Link to="/products">All categories <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {categories.map((c, i) => (
              <motion.div key={c.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }}>
                <Link to="/products" className="liquid-card group flex flex-col items-center justify-center gap-3 rounded-2xl p-6 transition-all hover:-translate-y-1 hover:shadow-[0_20px_50px_-20px_oklch(0.62_0.22_257/0.5)]">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 text-primary group-hover:from-primary group-hover:to-accent group-hover:text-primary-foreground">
                    <c.icon className="h-6 w-6" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold">{c.label}</p>
                    <p className="text-xs text-muted-foreground">{c.count}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURED HERO PRODUCT ===== */}
      {hero && (
        <section className="relative border-t border-border/60">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="liquid-orb absolute right-0 top-1/3 h-[400px] w-[400px] opacity-40" />
          </div>
          <div className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
            <div className="grid items-center gap-10 lg:grid-cols-2">
              <Link to="/products/$id" params={{ id: hero.id }} className="liquid-card group block overflow-hidden rounded-3xl p-3">
                <div className="aspect-square overflow-hidden rounded-2xl bg-gradient-to-br from-secondary to-card">
                  {hero.image_url && <img src={hero.image_url} alt={hero.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />}
                </div>
              </Link>
              <div>
                <Badge className="liquid-card border-none bg-gradient-to-r from-primary/20 to-accent/20 text-primary">⭐ Featured pick</Badge>
                <h3 className="mt-4 text-4xl font-bold tracking-tight">{hero.name}</h3>
                <p className="mt-2 text-lg text-muted-foreground">{hero.brand} • {hero.category}</p>
                {hero.description && <p className="mt-5 leading-relaxed text-muted-foreground">{hero.description}</p>}
                <div className="mt-6 flex items-baseline gap-3">
                  <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-5xl font-bold text-transparent">
                    ${Number(hero.price).toFixed(2)}
                  </span>
                  <span className="text-sm text-muted-foreground line-through">${(Number(hero.price) * 1.2).toFixed(2)}</span>
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button asChild size="lg" className="gap-2 bg-gradient-to-r from-primary to-accent">
                    <Link to="/products/$id" params={{ id: hero.id }}>View details <ArrowRight className="h-4 w-4" /></Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="liquid-card"><Link to="/products">More products</Link></Button>
                </div>
                <div className="mt-8 grid grid-cols-3 gap-3">
                  {[["Free", "Lab Setup"], ["1-Year", "Warranty"], ["24h", "Delivery"]].map(([a, b]) => (
                    <div key={a + b} className="liquid-card rounded-xl p-3 text-center">
                      <p className="text-lg font-bold text-primary">{a}</p>
                      <p className="text-[11px] text-muted-foreground">{b}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ===== FEATURES ===== */}
      <section className="relative border-t border-border/60">
        <div className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="outline" className="liquid-card">Why LabTrack</Badge>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Everything labs need, nothing they don't.</h2>
            <p className="mt-3 text-muted-foreground">A complete toolkit for the modern computer lab.</p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                <div className="liquid-card group h-full rounded-2xl p-6 transition-all hover:-translate-y-1">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold">{f.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SHOWCASE STRIP ===== */}
      <section className="border-t border-border/60 bg-gradient-to-b from-background to-card/30">
        <div className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="outline" className="liquid-card">Crafted for performance</Badge>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Designed to be touched, felt and loved.</h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { img: showcaseKb, t: "Mechanical Keyboards", d: "Tactile switches, hot-swap PCBs, RGB per-key lighting." },
              { img: showcaseHs, t: "Studio-Grade Audio", d: "Surround sound, noise-cancelling mics, plush comfort." },
              { img: showcaseMs, t: "Precision Pointing", d: "Up to 26,000 DPI sensors, sub-1ms wireless latency." },
            ].map((s, i) => (
              <motion.div key={s.t} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="liquid-card group relative overflow-hidden rounded-3xl">
                <img src={s.img} alt={s.t} width={1280} height={960} loading="lazy"
                  className="aspect-[4/3] w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6">
                  <h3 className="text-xl font-bold">{s.t}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURED PRODUCTS GRID ===== */}
      {featured.length > 0 && (
        <section className="border-t border-border/60">
          <div className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <Badge variant="outline" className="liquid-card">Best sellers</Badge>
                <h2 className="mt-3 text-3xl font-bold tracking-tight">Top peripherals this month</h2>
                <p className="mt-2 text-muted-foreground">Hand-picked, lab-tested, ready to ship.</p>
              </div>
              <Button asChild variant="outline" className="liquid-card"><Link to="/products">View all <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
            </div>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {featured.slice(0, 8).map((p: any, i) => (
                <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }}>
                  <Link to="/products/$id" params={{ id: p.id }}
                    className="liquid-card group relative block overflow-hidden rounded-2xl transition-all hover:-translate-y-1 hover:shadow-[0_20px_60px_-20px_oklch(0.62_0.22_257/0.5)]">
                    <div className="aspect-square overflow-hidden bg-gradient-to-br from-secondary to-card">
                      {p.image_url && <img src={p.image_url} alt={p.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />}
                    </div>
                    <div className="absolute right-3 top-3">
                      <Badge className="bg-background/70 text-foreground backdrop-blur-md">{p.category}</Badge>
                    </div>
                    <div className="p-4">
                      <p className="text-xs text-muted-foreground">{p.brand}</p>
                      <p className="mt-1 truncate text-sm font-semibold">{p.name}</p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-lg font-bold text-transparent">
                          ${Number(p.price).toFixed(2)}
                        </span>
                        <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">In stock</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== STATS ===== */}
      <section className="relative border-t border-border/60">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="liquid-orb absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 opacity-30" />
        </div>
        <div className="mx-auto grid max-w-7xl gap-5 px-4 py-16 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
          {stats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
              className="liquid-card rounded-2xl p-6 text-center">
              <div className="bg-gradient-to-r from-primary to-accent bg-clip-text text-5xl font-bold text-transparent">{s.value}</div>
              <div className="mt-2 text-sm text-muted-foreground">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="border-t border-border/60 bg-card/20">
        <div className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="outline" className="liquid-card">Workflow</Badge>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">How it works</h2>
            <p className="mt-3 text-muted-foreground">Four steps from chaos to clarity.</p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <motion.div key={s.n} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                className="liquid-card relative rounded-2xl p-6">
                <div className="bg-gradient-to-br from-primary to-accent bg-clip-text text-3xl font-bold text-transparent">{s.n}</div>
                <h3 className="mt-2 text-lg font-semibold">{s.t}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{s.d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="border-t border-border/60">
        <div className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="outline" className="liquid-card">Loved by educators</Badge>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">What labs are saying</h2>
          </div>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {testimonials.map((t, i) => (
              <motion.div key={t.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
                <Card className="liquid-card h-full border-none">
                  <CardContent className="p-6">
                    <div className="flex gap-0.5 text-primary">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}</div>
                    <p className="mt-4 text-sm leading-relaxed">"{t.quote}"</p>
                    <div className="mt-6 flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-bold text-primary-foreground">
                        {t.name.split(" ").map(n => n[0]).slice(0,2).join("")}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FAQ PREVIEW ===== */}
      <section className="border-t border-border/60 bg-card/20">
        <div className="mx-auto max-w-4xl px-4 py-20 lg:px-8">
          <div className="text-center">
            <Badge variant="outline" className="liquid-card">FAQ</Badge>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Frequently asked</h2>
          </div>
          <div className="mt-10 grid gap-3">
            {[
              ["Is LabTrack free for academic use?", "Yes, the platform is free for accredited educational institutions for academic use."],
              ["Can students place orders?", "Orders are placed by lab staff or instructors using the public storefront with cash on delivery."],
              ["Does it work on mobile?", "Absolutely — the entire interface is fully responsive."],
              ["Do you ship internationally?", "Currently we ship to most regions via partner couriers. Contact us for specifics."],
            ].map(([q, a]) => (
              <details key={q} className="liquid-card group rounded-2xl p-5">
                <summary className="flex cursor-pointer items-center justify-between font-medium">
                  {q}<CheckCircle2 className="h-4 w-4 text-primary transition-transform group-open:rotate-45" />
                </summary>
                <p className="mt-3 text-sm text-muted-foreground">{a}</p>
              </details>
            ))}
          </div>
          <div className="mt-6 text-center"><Button asChild variant="outline" className="liquid-card"><Link to="/faq">All FAQs</Link></Button></div>
        </div>
      </section>

      {/* ===== CTA / NEWSLETTER ===== */}
      <section className="relative border-t border-border/60">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="liquid-orb absolute -top-20 left-1/4 h-[400px] w-[400px] opacity-50" />
          <div className="liquid-orb absolute -bottom-20 right-1/4 h-[400px] w-[400px] opacity-50" />
        </div>
        <div className="mx-auto max-w-4xl px-4 py-20 text-center lg:px-8">
          <div className="liquid-card mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Stay in the loop</h2>
          <p className="mt-2 text-muted-foreground">Monthly product updates and lab best-practices. No spam, ever.</p>
          <form onSubmit={(e) => { e.preventDefault(); (e.target as HTMLFormElement).reset(); alert("Subscribed!"); }}
            className="liquid-card mx-auto mt-8 flex max-w-md gap-2 rounded-full p-2">
            <input required type="email" placeholder="you@school.edu"
              className="flex-1 rounded-full bg-transparent px-4 py-2 text-sm outline-none placeholder:text-muted-foreground" />
            <Button type="submit" className="rounded-full bg-gradient-to-r from-primary to-accent">Subscribe</Button>
          </form>
        </div>
      </section>
    </div>
  );
}
