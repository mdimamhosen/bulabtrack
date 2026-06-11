import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, Boxes, ShieldCheck, BarChart3, Zap, Cpu, Wrench, Users, Star, Mail, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_public/")({
  head: () => ({
    meta: [
      { title: "LabTrack — Modern Peripheral Inventory for Labs" },
      { name: "description", content: "Track, manage, and procure computer lab peripherals with a beautiful, production-ready inventory platform." },
    ],
  }),
  component: HomePage,
});

const features = [
  { icon: Cpu, title: "Centralized Inventory", desc: "Every device, brand, and serial in one searchable hub." },
  { icon: BarChart3, title: "Real-time Analytics", desc: "Status, category and trend charts updated live." },
  { icon: Wrench, title: "Maintenance Tracking", desc: "Log issues, schedule fixes, and reduce downtime." },
  { icon: ShieldCheck, title: "Role-based Security", desc: "Admins and staff each get the access they need." },
  { icon: Zap, title: "Lightning Fast", desc: "Built on edge infrastructure for instant responses." },
  { icon: Users, title: "Multi-user Friendly", desc: "Designed for teams of lab staff and instructors." },
];

const stats = [
  { label: "Devices tracked", value: "30+" },
  { label: "Lab locations", value: "12" },
  { label: "Uptime", value: "99.9%" },
  { label: "Active users", value: "240+" },
];

const steps = [
  { n: "01", t: "Catalog", d: "Add every peripheral with brand, model, serial, and location." },
  { n: "02", t: "Monitor", d: "Real-time dashboard surfaces availability, status and trends." },
  { n: "03", t: "Maintain", d: "Track maintenance windows and warranty expiry effortlessly." },
  { n: "04", t: "Procure", d: "Order new devices directly from the integrated storefront." },
];

const testimonials = [
  { name: "Dr. Aisha Khan", role: "Lab Director, CS Dept.", quote: "LabTrack replaced our spreadsheets overnight. The analytics alone saved us hours weekly." },
  { name: "Marco Reyes", role: "IT Coordinator", quote: "Beautifully designed. Our staff onboarded in minutes — and the maintenance log is gold." },
  { name: "Priya Shah", role: "Procurement Lead", quote: "The storefront makes COD requisitions painless. A genuinely modern tool." },
];

function HomePage() {
  const { data: featured } = useQuery({
    queryKey: ["featured-devices"],
    queryFn: async () => {
      const { data } = await supabase.from("devices").select("id,name,brand,price,image_url,status").eq("status", "Available").limit(4);
      return data ?? [];
    },
  });

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-32 left-1/4 h-[480px] w-[480px] rounded-full bg-primary/25 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-[480px] w-[480px] rounded-full bg-accent/20 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(56,189,248,0.08),transparent_60%)]" />
        </div>
        <div className="mx-auto max-w-7xl px-4 pb-24 pt-20 lg:px-8 lg:pt-28">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
              <span className="grid h-1.5 w-1.5 place-items-center rounded-full bg-primary" />
              Production-ready • v1.0
            </div>
            <h1 className="mt-5 text-balance bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl lg:text-6xl">
              Peripheral inventory that actually feels modern.
            </h1>
            <p className="mt-5 text-pretty text-base text-muted-foreground sm:text-lg">
              LabTrack is the all-in-one platform to catalog, monitor, maintain and procure
              every peripheral in your computer laboratory — beautifully.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" className="gap-2">
                <Link to="/auth">Get Started <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/products">Browse Products</Link>
              </Button>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }} className="mx-auto mt-16 max-w-5xl">
            <div className="relative rounded-2xl border border-border bg-card/60 p-2 shadow-2xl backdrop-blur-xl">
              <div className="rounded-xl bg-gradient-to-br from-secondary/40 to-card p-8">
                <div className="grid gap-4 sm:grid-cols-3">
                  {stats.slice(0, 3).map((s) => (
                    <div key={s.label} className="rounded-lg border border-border bg-background/50 p-5">
                      <div className="text-3xl font-bold text-primary">{s.value}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{s.label}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 grid grid-cols-3 gap-3">
                  {["Available 84%", "In Use 12%", "Maintenance 4%"].map((t, i) => (
                    <div key={t} className="rounded-lg border border-border bg-background/50 p-3">
                      <div className="h-2 overflow-hidden rounded-full bg-secondary">
                        <div className={`h-full rounded-full ${["bg-primary", "bg-accent", "bg-muted-foreground"][i]}`} style={{ width: ["84%", "60%", "20%"][i] }} />
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">{t}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border/60 bg-card/20">
        <div className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Everything labs need, nothing they don't.</h2>
            <p className="mt-3 text-muted-foreground">A complete toolkit for the modern computer lab.</p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                <Card className="h-full border-border/60 bg-card/60 transition-colors hover:border-primary/50">
                  <CardContent className="p-6">
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary"><f.icon className="h-5 w-5" /></div>
                    <h3 className="mt-4 font-semibold">{f.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-t border-border/60">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-16 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card/40 p-6 text-center">
              <div className="bg-gradient-to-r from-primary to-accent bg-clip-text text-4xl font-bold text-transparent">{s.value}</div>
              <div className="mt-2 text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border/60 bg-card/20">
        <div className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">How it works</h2>
            <p className="mt-3 text-muted-foreground">Four steps from chaos to clarity.</p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <motion.div key={s.n} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                className="relative rounded-xl border border-border bg-card p-6">
                <div className="text-xs font-semibold text-primary">{s.n}</div>
                <h3 className="mt-2 text-lg font-semibold">{s.t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured products */}
      {featured && featured.length > 0 && (
        <section className="border-t border-border/60">
          <div className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">Featured peripherals</h2>
                <p className="mt-2 text-muted-foreground">A taste of our procurement catalog.</p>
              </div>
              <Button asChild variant="outline"><Link to="/products">View all <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
            </div>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((p: any) => (
                <Link key={p.id} to="/products/$id" params={{ id: p.id }} className="group overflow-hidden rounded-xl border border-border bg-card transition hover:border-primary/60 hover:shadow-xl">
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
        </section>
      )}

      {/* Testimonials */}
      <section className="border-t border-border/60 bg-card/20">
        <div className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Trusted by educators</h2>
          </div>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {testimonials.map((t) => (
              <Card key={t.name} className="border-border/60 bg-card/60">
                <CardContent className="p-6">
                  <div className="flex gap-0.5 text-primary">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}</div>
                  <p className="mt-4 text-sm leading-relaxed">"{t.quote}"</p>
                  <div className="mt-4">
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ preview */}
      <section className="border-t border-border/60">
        <div className="mx-auto max-w-4xl px-4 py-20 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Frequently asked</h2>
            <p className="mt-3 text-muted-foreground">Answers to common questions.</p>
          </div>
          <div className="mt-10 grid gap-3">
            {[
              ["Is LabTrack free for academic use?", "Yes, the platform is free for accredited educational institutions for academic use."],
              ["Can students place orders?", "Orders are placed by lab staff or instructors using the public storefront with cash on delivery."],
              ["Does it work on mobile?", "Absolutely — the entire interface is fully responsive."],
            ].map(([q, a]) => (
              <details key={q} className="group rounded-xl border border-border bg-card p-5">
                <summary className="flex cursor-pointer items-center justify-between font-medium">
                  {q}<CheckCircle2 className="h-4 w-4 text-primary transition-transform group-open:rotate-45" />
                </summary>
                <p className="mt-3 text-sm text-muted-foreground">{a}</p>
              </details>
            ))}
          </div>
          <div className="mt-6 text-center"><Button asChild variant="outline"><Link to="/faq">All FAQs</Link></Button></div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="border-t border-border/60 bg-gradient-to-b from-card/20 to-background">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center lg:px-8">
          <Mail className="mx-auto h-10 w-10 text-primary" />
          <h2 className="mt-4 text-3xl font-bold tracking-tight">Stay in the loop</h2>
          <p className="mt-2 text-muted-foreground">Monthly product updates and lab best-practices. No spam.</p>
          <form onSubmit={(e) => { e.preventDefault(); (e.target as HTMLFormElement).reset(); alert("Subscribed!"); }}
            className="mx-auto mt-6 flex max-w-md flex-col gap-2 sm:flex-row">
            <input required type="email" placeholder="you@school.edu" className="flex-1 rounded-md border border-border bg-card px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
            <Button type="submit">Subscribe</Button>
          </form>
        </div>
      </section>
    </div>
  );
}
