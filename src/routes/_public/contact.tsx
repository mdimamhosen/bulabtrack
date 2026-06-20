import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Phone, MapPin, Send, Github, Twitter, Linkedin, MessageSquare, Sparkles, Clock, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/_public/contact")({
  head: () => ({
    meta: [
      { title: "Contact LabTrack" },
      { name: "description", content: "Get in touch with the LabTrack team — questions, demos, and partnership inquiries." },
    ],
  }),
  component: ContactPage,
});

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(255),
  subject: z.string().trim().min(2).max(150),
  message: z.string().trim().min(10).max(2000),
});
type FormData = z.infer<typeof schema>;

function ContactPage() {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    const { error } = await supabase.from("contact_messages").insert(data);
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Message sent! We'll be in touch soon.");
    reset();
  };

  const cards = [
    { I: Mail, t: "Email us", v: "support@labtrack.app", sub: "Replies within 24h" },
    { I: Phone, t: "Call us", v: "+1 (555) 010-2204", sub: "Mon–Fri, 9–6 PT" },
    { I: MapPin, t: "Visit us", v: "CS Dept., University Campus", sub: "Bldg. 4, Room 207" },
  ];

  return (
    <div className="relative overflow-hidden">
      {/* Aurora & grid background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="aurora-bg absolute inset-0 opacity-60" />
        <div className="ai-grid absolute inset-0 opacity-50" />
        <div className="liquid-orb animate-blob absolute -top-20 left-1/4 h-[460px] w-[460px] opacity-60" />
        <div className="liquid-orb animate-blob absolute bottom-0 right-0 h-[420px] w-[420px] opacity-50" style={{ animationDelay: "-9s" }} />
      </div>

      <div className="mx-auto max-w-6xl px-4 pt-20 pb-24 lg:px-8 lg:pt-28">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center">
          <div className="liquid-card mx-auto inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            <span className="neon-text font-medium">We'd love to hear from you</span>
          </div>
          <h1 className="mt-6 text-balance text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
            Let's build something
            <span className="block neon-text">remarkable, together.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-muted-foreground sm:text-lg">
            Whether you're a lab director, instructor, or curious student — drop us a line and our team will get back within one business day.
          </p>
        </motion.div>

        {/* Quick contact cards */}
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {cards.map(({ I, t, v, sub }, i) => (
            <motion.div key={t} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
              className="liquid-card group relative overflow-hidden rounded-2xl p-6 transition-all hover:-translate-y-1 hover:neon-ring">
              <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br from-primary/30 to-accent/20 blur-3xl transition-opacity group-hover:opacity-80" />
              <div className="relative grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground">
                <I className="h-5 w-5" />
              </div>
              <p className="relative mt-4 text-xs uppercase tracking-widest text-muted-foreground">{t}</p>
              <p className="relative mt-1 text-base font-semibold">{v}</p>
              <p className="relative mt-0.5 text-xs text-muted-foreground">{sub}</p>
            </motion.div>
          ))}
        </div>

        {/* Form + Sidebar */}
        <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_1.4fr]">
          {/* Sidebar */}
          <motion.div initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="space-y-5">
            <div className="liquid-card rounded-3xl p-6">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <p className="font-semibold">Talk to our team</p>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                We answer every message — usually within a few hours during business days. For urgent lab issues, call our hotline.
              </p>
              <div className="mt-5 space-y-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground"><Clock className="h-4 w-4 text-accent" /> Mon–Fri · 9am–6pm PT</div>
                <div className="flex items-center gap-2 text-muted-foreground"><Globe className="h-4 w-4 text-accent" /> Serving labs worldwide</div>
              </div>
            </div>

            <div className="liquid-card rounded-3xl p-6">
              <p className="text-sm font-semibold">Find us online</p>
              <div className="mt-3 flex gap-2">
                {[Github, Twitter, Linkedin].map((I, i) => (
                  <a key={i} href="#"
                    className="group grid h-11 w-11 place-items-center rounded-xl border border-border/60 bg-card/40 backdrop-blur-md transition-all hover:-translate-y-0.5 hover:neon-ring">
                    <I className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                  </a>
                ))}
              </div>
            </div>

            <div className="liquid-card group relative aspect-[4/3] overflow-hidden rounded-3xl">
              <div className="absolute inset-0 aurora-bg opacity-60" />
              <div className="absolute inset-0 ai-grid opacity-60" />
              <div className="relative flex h-full flex-col items-center justify-center gap-2 text-center">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground animate-pulse-ring">
                  <MapPin className="h-5 w-5" />
                </div>
                <p className="text-sm font-semibold">University Campus</p>
                <p className="text-xs text-muted-foreground">CS Department · Bldg. 4, Room 207</p>
              </div>
            </div>
          </motion.div>

          {/* Form */}
          <motion.div initial={{ opacity: 0, x: 10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            className="liquid-card relative overflow-hidden rounded-3xl p-6 sm:p-8 lg:p-10">
            <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-gradient-to-br from-primary/30 to-accent/20 blur-3xl" />
            <div className="relative">
              <Badge variant="outline" className="liquid-card">Send a message</Badge>
              <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">Tell us about your lab</h2>
              <p className="mt-1 text-sm text-muted-foreground">We'll review and reach back out — promise.</p>

              <form onSubmit={handleSubmit(onSubmit)} className="mt-6 grid gap-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="name" className="text-xs uppercase tracking-widest text-muted-foreground">Name</Label>
                    <Input id="name" {...register("name")}
                      className="glass-input mt-1.5 h-11 rounded-xl focus-visible:[--tw-ring-color:transparent] focus-visible:glass-input-focus" />
                    {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-xs uppercase tracking-widest text-muted-foreground">Email</Label>
                    <Input id="email" type="email" {...register("email")}
                      className="glass-input mt-1.5 h-11 rounded-xl focus-visible:glass-input-focus" />
                    {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
                  </div>
                </div>
                <div>
                  <Label htmlFor="subject" className="text-xs uppercase tracking-widest text-muted-foreground">Subject</Label>
                  <Input id="subject" {...register("subject")}
                    className="glass-input mt-1.5 h-11 rounded-xl focus-visible:glass-input-focus" />
                  {errors.subject && <p className="mt-1 text-xs text-destructive">{errors.subject.message}</p>}
                </div>
                <div>
                  <Label htmlFor="message" className="text-xs uppercase tracking-widest text-muted-foreground">Message</Label>
                  <Textarea id="message" rows={6} {...register("message")}
                    className="glass-input mt-1.5 rounded-xl focus-visible:glass-input-focus" />
                  {errors.message && <p className="mt-1 text-xs text-destructive">{errors.message.message}</p>}
                </div>
                <Button type="submit" disabled={loading} size="lg"
                  className="group h-12 gap-2 rounded-xl bg-gradient-to-r from-primary via-[oklch(0.62_0.24_305)] to-accent text-base shadow-[0_10px_40px_-10px_oklch(0.58_0.24_274/0.8)] transition-all hover:opacity-95 hover:shadow-[0_14px_50px_-10px_oklch(0.58_0.24_274/1)]">
                  <Send className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  {loading ? "Sending…" : "Send message"}
                </Button>
              </form>
            </div>
          </motion.div>
        </div>

        {/* Mini FAQ */}
        <section className="mt-20">
          <div className="text-center">
            <Badge variant="outline" className="liquid-card">Before you ask</Badge>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Quick answers</h2>
          </div>
          <div className="mt-8 grid gap-3 md:grid-cols-2">
            {[
              ["How fast do you reply?", "Most messages get a reply within a few hours on business days."],
              ["Do you offer demos?", "Yes — request a 20-minute walkthrough and we'll tailor it to your lab."],
              ["Is LabTrack free for academia?", "Yes, accredited educational institutions get full academic access."],
              ["Can we self-host?", "Get in touch — we have a self-host package for larger institutions."],
            ].map(([q, a]) => (
              <details key={q} className="liquid-card group rounded-2xl p-5">
                <summary className="flex cursor-pointer items-center justify-between font-medium">
                  {q}
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground text-xs transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm text-muted-foreground">{a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
