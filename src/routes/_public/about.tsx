import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Target, Lightbulb, Users, Code, Calendar, Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_public/about")({
  head: () => ({
    meta: [
      { title: "About LabTrack — Our Mission & Team" },
      { name: "description", content: "Learn about LabTrack's mission to modernize peripheral inventory management for computer laboratories." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 lg:px-8 lg:py-24">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">About LabTrack</h1>
        <p className="mt-4 text-pretty text-lg text-muted-foreground">
          A modern, open platform built to bring computer laboratories out of the spreadsheet era —
          giving institutions full control over every peripheral they own.
        </p>
      </motion.div>

      <div className="mt-14 grid gap-5 md:grid-cols-2">
        {[
          { I: Target, t: "Our Mission", d: "Empower educators and lab staff with effortless inventory management that scales with their institution." },
          { I: Lightbulb, t: "Our Vision", d: "Become the standard inventory platform for academic computer laboratories worldwide." },
        ].map(({ I, t, d }) => (
          <Card key={t} className="bg-card/60">
            <CardContent className="p-6">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary"><I className="h-5 w-5" /></div>
              <h2 className="mt-3 text-xl font-semibold">{t}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{d}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <section className="mt-16">
        <h2 className="text-2xl font-bold">Benefits for institutions</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            "Eliminate device loss with full audit trails",
            "Cut maintenance response time by 60%",
            "Streamline procurement with built-in storefront",
            "Empower staff with clear role-based access",
            "Beautiful reports for accreditation reviews",
            "Save budget with smarter purchase decisions",
          ].map((b) => (
            <li key={b} className="rounded-lg border border-border bg-card p-4 text-sm">{b}</li>
          ))}
        </ul>
      </section>

      <section className="mt-16">
        <h2 className="text-2xl font-bold">Technology stack</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            { t: "React + TanStack Start", d: "Production-grade SSR & routing" },
            { t: "Tailwind CSS + shadcn/ui", d: "Premium design system" },
            { t: "Postgres + RLS", d: "Secure, scalable data layer" },
            { t: "TanStack Query", d: "Reactive data fetching" },
            { t: "Recharts", d: "Beautiful analytics" },
            { t: "Framer Motion", d: "Smooth animations" },
          ].map((x) => (
            <div key={x.t} className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm font-semibold">{x.t}</p>
              <p className="mt-1 text-xs text-muted-foreground">{x.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <h2 className="text-2xl font-bold">Development methodology</h2>
        <div className="relative mt-6 space-y-4 border-l-2 border-border pl-6">
          {[
            { t: "Requirement analysis", d: "Interviewed lab staff, instructors and IT coordinators across 3 universities." },
            { t: "UI/UX design", d: "Sketched flows in Figma; iterated on a dark-first, accessible design system." },
            { t: "Iterative build", d: "Phase 1: auth + inventory. Phase 2: storefront + orders. Phase 3: reporting." },
            { t: "Testing & QA", d: "Validation, RLS audits, and accessibility checks throughout development." },
          ].map((s, i) => (
            <div key={s.t} className="relative">
              <span className="absolute -left-[31px] grid h-5 w-5 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">{i + 1}</span>
              <p className="text-sm font-semibold">{s.t}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <h2 className="text-2xl font-bold">Project team</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            { n: "Alex Morgan", r: "Lead Developer", I: Code },
            { n: "Sam Patel", r: "UI/UX Designer", I: Award },
            { n: "Jamie Lee", r: "Project Manager", I: Users },
          ].map((p) => (
            <Card key={p.n} className="bg-card/60 text-center">
              <CardContent className="p-6">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground"><p.I className="h-7 w-7" /></div>
                <p className="mt-3 font-semibold">{p.n}</p>
                <p className="text-xs text-muted-foreground">{p.r}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-16 rounded-xl border border-border bg-card/40 p-8 text-center">
        <Calendar className="mx-auto h-8 w-8 text-primary" />
        <h2 className="mt-2 text-2xl font-bold">Built in 2026</h2>
        <p className="mt-2 text-sm text-muted-foreground">A capstone-quality, production-ready academic project.</p>
      </section>
    </div>
  );
}
