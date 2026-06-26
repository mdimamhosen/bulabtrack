import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Target,
  Lightbulb,
  Users,
  Code,
  Calendar,
  Award,
  Sparkles,
  Rocket,
  Brain,
  Shield,
  Heart,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

import { AboutSkeleton } from "@/components/page-skeletons";

export const Route = createFileRoute("/_public/about")({
  head: () => ({
    meta: [
      { title: "About LabTrack — Our Mission & Team" },
      {
        name: "description",
        content:
          "Learn about LabTrack's mission to modernize peripheral inventory management for warehouses and logistics hubs.",
      },
    ],
  }),
  component: AboutPage,
  pendingComponent: AboutSkeleton,
});

const values = [
  {
    I: Brain,
    t: "Intelligent by design",
    d: "Every workflow is shaped around real warehouse staff routines, not generic SaaS templates.",
  },
  {
    I: Shield,
    t: "Trust at the core",
    d: "Row-level security, audit trails and role-based access by default.",
  },
  {
    I: Heart,
    t: "Crafted with care",
    d: "Pixel-perfect surfaces, animated micro-interactions, accessible by default.",
  },
  {
    I: Zap,
    t: "Edge-fast performance",
    d: "Built on a modern edge runtime — sub-second responses globally.",
  },
];

const milestones = [
  {
    y: "2025 Q3",
    t: "Requirements gathered",
    d: "Interviewed warehouse staff, operators and logistics coordinators across 3 hubs.",
  },
  {
    y: "2025 Q4",
    t: "Design system shipped",
    d: "Dark-first, glassmorphic, accessible token system in Figma & Tailwind.",
  },
  {
    y: "2026 Q1",
    t: "Inventory + Auth live",
    d: "Phase 1: catalog, dashboard, role-based auth and RLS hardening.",
  },
  {
    y: "2026 Q2",
    t: "Public storefront",
    d: "Phase 2: COD checkout, order pipeline, contact and FAQ surfaces.",
  },
  {
    y: "2026 Q3",
    t: "AI-themed redesign",
    d: "Phase 3: futuristic glassmorphic refresh with aurora visuals.",
  },
];

const stats = [
  { v: "30+", l: "Devices tracked" },
  { v: "240+", l: "Active users" },
  { v: "12", l: "Warehouse hubs" },
  { v: "99.9%", l: "Uptime" },
];

function AboutPage() {
  return (
    <div className="relative overflow-hidden">
      {/* Aurora background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="aurora-bg absolute inset-0 opacity-60" />
        <div className="ai-grid absolute inset-0 opacity-50" />
        <div className="liquid-orb animate-blob absolute -top-32 -left-20 h-[460px] w-[460px] opacity-60" />
        <div
          className="liquid-orb animate-blob absolute top-1/2 right-0 h-[420px] w-[420px] opacity-50"
          style={{ animationDelay: "-8s" }}
        />
        <div
          className="liquid-orb animate-blob absolute bottom-0 left-10 h-[500px] w-[500px] opacity-35"
          style={{ animationDelay: "-12s" }}
        />
      </div>

      <div className="mx-auto max-w-6xl px-4 pt-20 pb-16 lg:px-8 lg:pt-28">
        {/* ===== HERO ===== */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="liquid-card mx-auto inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            <span className="neon-text font-medium">About LabTrack</span>
          </div>
          <h1 className="mt-6 text-balance text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            Bringing warehouses out of the
            <span className="block neon-text">spreadsheet era.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
            A modern, open platform built to give logistics teams full, intelligent control over every
            peripheral they own — from catalog to checkout.
          </p>
        </motion.div>

        {/* ===== STATS ===== */}
        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.l}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="liquid-card rounded-2xl p-6 text-center"
            >
              <div className="neon-text text-4xl font-bold">{s.v}</div>
              <div className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
                {s.l}
              </div>
            </motion.div>
          ))}
        </div>

        {/* ===== MISSION / VISION ===== */}
        <div className="mt-20 grid gap-6 md:grid-cols-2">
          {[
            {
              I: Target,
              t: "Our Mission",
              d: "Empower warehouse managers and operators with effortless inventory management that scales with their business — without sacrificing beauty or efficiency.",
            },
            {
              I: Lightbulb,
              t: "Our Vision",
              d: "Become the default operating system for warehouse logistics environments worldwide, blending intelligent automation with delightful UX.",
            },
          ].map(({ I, t, d }, i) => (
            <motion.div
              key={t}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="liquid-card group relative overflow-hidden rounded-3xl p-8"
            >
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br from-primary/30 to-accent/20 blur-3xl transition-opacity group-hover:opacity-80" />
              <div className="relative grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-[0_10px_40px_-10px_oklch(0.58_0.24_274/0.7)]">
                <I className="h-6 w-6" />
              </div>
              <h2 className="relative mt-5 text-2xl font-semibold">{t}</h2>
              <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">{d}</p>
            </motion.div>
          ))}
        </div>

        {/* ===== VALUES ===== */}
        <section className="mt-24">
          <div className="text-center">
            <Badge variant="outline" className="liquid-card">
              Our values
            </Badge>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              What we believe in
            </h2>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v, i) => (
              <motion.div
                key={v.t}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="liquid-card group h-full rounded-2xl p-6 transition-all hover:-translate-y-1 hover:neon-ring"
              >
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-primary/25 to-accent/20 text-accent">
                  <v.I className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{v.t}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{v.d}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ===== BENEFITS ===== */}
        <section className="mt-24">
          <div className="text-center">
            <Badge variant="outline" className="liquid-card">
              Benefits
            </Badge>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Built for warehouses, loved by staff
            </h2>
          </div>
          <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              "Eliminate device loss with full audit trails",
              "Cut maintenance response time by 60%",
              "Streamline procurement with built-in storefront",
              "Empower staff with clear role-based access",
              "Beautiful reports for operations audits",
              "Save budget with smarter purchase decisions",
            ].map((b, i) => (
              <motion.li
                key={b}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="liquid-card flex items-start gap-3 rounded-xl p-4 text-sm"
              >
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md bg-gradient-to-br from-primary to-accent text-[10px] font-bold text-primary-foreground">
                  ✓
                </span>
                {b}
              </motion.li>
            ))}
          </ul>
        </section>

        {/* ===== TIMELINE ===== */}
        <section className="mt-24">
          <div className="text-center">
            <Badge variant="outline" className="liquid-card">
              Journey
            </Badge>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              From idea to platform
            </h2>
          </div>
          <div className="relative mx-auto mt-14 max-w-3xl">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-primary via-accent to-transparent md:left-1/2" />
            {milestones.map((m, i) => (
              <motion.div
                key={m.t}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className={`relative mb-10 md:grid md:grid-cols-2 md:gap-10 ${i % 2 ? "md:[&>div:first-child]:order-2" : ""}`}
              >
                <div
                  className={`hidden md:block ${i % 2 ? "text-left pl-10" : "text-right pr-10"}`}
                >
                  <p className="neon-text text-sm font-bold uppercase tracking-widest">{m.y}</p>
                </div>
                <div className="relative pl-12 md:pl-10">
                  <span className="absolute left-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground animate-pulse-ring md:left-[-11px]" />
                  <div className="liquid-card rounded-2xl p-5">
                    <p className="text-xs uppercase tracking-widest text-accent md:hidden">{m.y}</p>
                    <p className="mt-1 text-base font-semibold">{m.t}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{m.d}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ===== MASONRY GALLERY SECTION ===== */}
        <section className="mt-24">
          <div className="text-center mb-12">
            <Badge variant="outline" className="liquid-card">
              Visual Showcase
            </Badge>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Warehouse life in pixels
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
              A glimpse into the real hubs, custom setups, and hardware workstations monitored under the LabTrack ecosystem.
            </p>
          </div>

          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
            {[
              {
                src: "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=600",
                title: "Fulfillment Bay B",
                desc: "Optimized workstation layouts for sorting operators.",
                tag: "Fulfillment",
                aspect: "aspect-[3/4]",
              },
              {
                src: "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?q=80&w=600",
                title: "Stabilizer Lubing Station",
                desc: "Custom mechanical switch maintenance testing deck.",
                tag: "Maintenance",
                aspect: "aspect-[1/1]",
              },
              {
                src: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=600",
                title: "Logistics Dock 402",
                desc: "Equipped with rugged handheld terminals and scanners.",
                tag: "Docking",
                aspect: "aspect-[16/10]",
              },
              {
                src: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=600",
                title: "Core Server Cabinet",
                desc: "Row-level database synchronizations and edge routing.",
                tag: "Infrastructure",
                aspect: "aspect-[3/5]",
              },
              {
                src: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?q=80&w=600",
                title: "Acoustic Audio Deck",
                desc: "Pro headphones with active noise calibration settings.",
                tag: "Accessories",
                aspect: "aspect-[16/11]",
              },
              {
                src: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=600",
                title: "Data Science Station",
                desc: "Dual displays optimized for low-fatigue telemetry analysis.",
                tag: "Focus Setup",
                aspect: "aspect-[1/1]",
              },
              {
                src: "https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?q=80&w=600",
                title: "Surface Protection Matting",
                desc: "Custom deskmats aligned with anti-static standards.",
                tag: "Safety",
                aspect: "aspect-[16/10]",
              },
            ].map((img, i) => (
              <motion.div
                key={img.title}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="break-inside-avoid liquid-card rounded-2xl overflow-hidden p-2 group hover:neon-ring hover:scale-[1.03] transition-all duration-300 flex flex-col"
              >
                <div className={`relative w-full overflow-hidden rounded-xl bg-black ${img.aspect}`}>
                  <img
                    src={img.src}
                    alt={img.title}
                    className="h-full w-full object-cover filter brightness-[0.85] contrast-[1.05] transition-all duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-primary/20 text-primary border-none text-[9px] font-bold uppercase tracking-wider font-mono">
                      {img.tag}
                    </Badge>
                  </div>
                </div>
                <div className="p-3">
                  <h4 className="font-extrabold text-foreground text-sm">{img.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{img.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ===== TECH STACK ===== */}
        <section className="mt-24">
          <div className="text-center">
            <Badge variant="outline" className="liquid-card">
              Under the hood
            </Badge>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Technology stack</h2>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { t: "React + TanStack Start", d: "Production-grade SSR & routing" },
              { t: "Tailwind CSS + shadcn/ui", d: "Premium design system" },
              { t: "Postgres + RLS", d: "Secure, scalable data layer" },
              { t: "TanStack Query", d: "Reactive data fetching" },
              { t: "Recharts", d: "Beautiful analytics" },
              { t: "Framer Motion", d: "Smooth animations" },
            ].map((x, i) => (
              <motion.div
                key={x.t}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="liquid-card group rounded-2xl p-5 transition-all hover:-translate-y-1"
              >
                <p className="text-sm font-semibold">{x.t}</p>
                <p className="mt-1 text-xs text-muted-foreground">{x.d}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ===== TEAM ===== */}
        <section className="mt-24">
          <div className="text-center">
            <Badge variant="outline" className="liquid-card">
              Project team
            </Badge>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              The humans behind the pixels
            </h2>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {[
              { n: "Alex Morgan", r: "Lead Developer", I: Code },
              { n: "Sam Patel", r: "UI/UX Designer", I: Award },
              { n: "Jamie Lee", r: "Project Manager", I: Users },
            ].map((p, i) => (
              <motion.div
                key={p.n}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="liquid-card group relative overflow-hidden rounded-3xl p-8 text-center transition-all hover:-translate-y-1 hover:neon-ring"
              >
                <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-primary/20 via-accent/10 to-transparent" />
                <div className="relative mx-auto grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-[0_12px_40px_-10px_oklch(0.58_0.24_274/0.8)]">
                  <p.I className="h-9 w-9" />
                </div>
                <p className="relative mt-4 text-lg font-semibold">{p.n}</p>
                <p className="relative text-xs uppercase tracking-widest text-muted-foreground">
                  {p.r}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ===== CLOSING ===== */}
        <section className="mt-24">
          <div className="liquid-card relative overflow-hidden rounded-3xl p-10 text-center">
            <div className="absolute inset-0 aurora-bg opacity-70" />
            <div className="relative">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground">
                <Rocket className="h-6 w-6" />
              </div>
              <h2 className="mt-4 text-3xl font-bold tracking-tight">Built in 2026</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                A production-ready logistics software solution — engineered to ship.
              </p>
              <div className="mt-5 inline-flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" /> Last updated this quarter
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
