import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Phone, MapPin, Send, Github, Twitter, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";

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

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 lg:px-8 lg:py-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Get in touch</h1>
        <p className="mt-3 text-muted-foreground">Have questions? We'd love to hear from you.</p>
      </div>

      <div className="mt-14 grid gap-8 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-1">
          {[
            { I: Mail, t: "Email", v: "support@labtrack.app" },
            { I: Phone, t: "Phone", v: "+1 (555) 010-2204" },
            { I: MapPin, t: "Office", v: "CS Dept., University Campus" },
          ].map(({ I, t, v }) => (
            <Card key={t} className="bg-card/60">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary"><I className="h-5 w-5" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">{t}</p>
                  <p className="text-sm font-semibold">{v}</p>
                </div>
              </CardContent>
            </Card>
          ))}
          <div className="rounded-xl border border-border bg-card/60 p-5">
            <p className="text-sm font-semibold">Find us online</p>
            <div className="mt-3 flex gap-2">
              {[Github, Twitter, Linkedin].map((I, i) => (
                <a key={i} href="#" className="grid h-10 w-10 place-items-center rounded-md border border-border hover:bg-secondary"><I className="h-4 w-4" /></a>
              ))}
            </div>
          </div>
          <div className="aspect-video overflow-hidden rounded-xl border border-border bg-secondary">
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">📍 Map placeholder</div>
          </div>
        </div>

        <Card className="lg:col-span-2">
          <CardContent className="p-6 lg:p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" {...register("name")} className="mt-1.5" />
                  {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" {...register("email")} className="mt-1.5" />
                  {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
                </div>
              </div>
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" {...register("subject")} className="mt-1.5" />
                {errors.subject && <p className="mt-1 text-xs text-destructive">{errors.subject.message}</p>}
              </div>
              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" rows={6} {...register("message")} className="mt-1.5" />
                {errors.message && <p className="mt-1 text-xs text-destructive">{errors.message.message}</p>}
              </div>
              <Button type="submit" disabled={loading} className="gap-2"><Send className="h-4 w-4" />{loading ? "Sending…" : "Send Message"}</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
