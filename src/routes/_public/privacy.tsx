import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_public/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — LabTrack" },
      { name: "description", content: "How LabTrack collects, uses, and protects your data." },
    ],
  }),
  component: () => (
    <div className="mx-auto max-w-3xl px-4 py-16 lg:px-8 lg:py-24">
      <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: June 2026</p>
      <div className="prose prose-invert mt-10 max-w-none space-y-6 text-sm leading-relaxed text-muted-foreground">
        <Section title="1. Information We Collect">
          We collect information you provide directly: account details (name, email, phone), device
          records (serial numbers, locations, prices), and order information (delivery address,
          contact details). We also collect usage data such as IP addresses and browser metadata for
          security and analytics.
        </Section>
        <Section title="2. How We Use Your Information">
          To provide and improve the LabTrack service, process orders, authenticate users, send
          transactional notifications, and ensure platform security.
        </Section>
        <Section title="3. Data Sharing">
          We do not sell your data. We share data only with the cloud infrastructure that powers
          LabTrack (database, authentication) under strict data-processing agreements.
        </Section>
        <Section title="4. Data Security">
          All data is protected with industry-standard encryption in transit and at rest. Row-Level
          Security policies restrict access to authorized users only.
        </Section>
        <Section title="5. Your Rights">
          You may request access, correction, or deletion of your personal data at any time by
          contacting support@labtrack.app.
        </Section>
        <Section title="6. Cookies">
          We use only essential cookies for authentication and theme preferences. We do not use
          advertising or third-party tracking cookies.
        </Section>
        <Section title="7. Children's Privacy">
          LabTrack is not directed to children under 13 and we do not knowingly collect personal
          information from them.
        </Section>
        <Section title="8. Changes">
          We may update this policy from time to time; material changes will be posted on this page
          with an updated date.
        </Section>
        <Section title="9. Contact">
          Questions? Email{" "}
          <a href="mailto:support@labtrack.app" className="text-primary">
            support@labtrack.app
          </a>
          .
        </Section>
      </div>
    </div>
  ),
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <p className="mt-2">{children}</p>
    </div>
  );
}
