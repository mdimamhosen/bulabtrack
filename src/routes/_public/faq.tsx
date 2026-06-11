import { createFileRoute } from "@tanstack/react-router";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const Route = createFileRoute("/_public/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — LabTrack" },
      { name: "description", content: "Frequently asked questions about LabTrack peripheral inventory management." },
    ],
  }),
  component: FAQPage,
});

const FAQS = [
  ["Is LabTrack free for academic use?", "Yes — LabTrack is free for accredited educational institutions and their lab staff."],
  ["How do staff and admins differ?", "Admins manage devices, users, and orders. Staff can update device status, log maintenance, and view inventory."],
  ["Can I order devices through LabTrack?", "Yes. Browse the public Products page, add to cart, and check out with Cash on Delivery."],
  ["Does LabTrack support warranty tracking?", "Every device record includes a warranty expiry field that surfaces in dashboards and reports."],
  ["Is my data secure?", "All data is protected by Row-Level Security policies; only authorized users can read or modify records."],
  ["Can I export inventory data?", "Yes — Admins can export CSVs of devices, maintenance records, and orders from the dashboard."],
  ["Does it support mobile devices?", "The entire UI is fully responsive and works on tablets and phones."],
  ["Can I integrate it with our existing systems?", "We expose typed server functions and a Postgres schema you can extend with custom integrations."],
];

function FAQPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 lg:px-8 lg:py-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Frequently asked questions</h1>
        <p className="mt-3 text-muted-foreground">Quick answers to common questions about LabTrack.</p>
      </div>
      <div className="mt-12 rounded-xl border border-border bg-card/40 p-2">
        <Accordion type="single" collapsible className="w-full">
          {FAQS.map(([q, a], i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border-border/60 px-4 last:border-b-0">
              <AccordionTrigger className="text-left">{q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
