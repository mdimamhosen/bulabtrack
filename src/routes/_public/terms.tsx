import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_public/terms")({
  head: () => ({ meta: [{ title: "Terms & Conditions — LabTrack" }, { name: "description", content: "Terms of service and user responsibilities for using LabTrack." }] }),
  component: () => (
    <div className="mx-auto max-w-3xl px-4 py-16 lg:px-8 lg:py-24">
      <h1 className="text-4xl font-bold tracking-tight">Terms & Conditions</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: June 2026</p>
      <div className="mt-10 space-y-6 text-sm leading-relaxed text-muted-foreground">
        <Section title="1. Acceptance of Terms">
          By accessing or using LabTrack, you agree to be bound by these Terms. If you do not agree, please do not use the service.
        </Section>
        <Section title="2. Eligibility">
          LabTrack is intended for use by accredited educational institutions and their authorized staff. You must be at least 18 years old to create an admin account.
        </Section>
        <Section title="3. User Responsibilities">
          You agree to maintain the confidentiality of your credentials, provide accurate information, and not misuse the service to harm others or attempt unauthorized access.
        </Section>
        <Section title="4. Orders & Cash on Delivery">
          All orders placed through the public storefront are subject to availability. Payment is collected upon delivery (COD). LabTrack reserves the right to cancel orders due to fraud, abuse, or incorrect pricing.
        </Section>
        <Section title="5. Intellectual Property">
          All LabTrack content, branding, and software are the property of the project authors. You may not copy, modify, or distribute the platform without written permission.
        </Section>
        <Section title="6. Limitation of Liability">
          LabTrack is provided "as is" without warranties of any kind. We are not liable for indirect or consequential damages arising from use of the service.
        </Section>
        <Section title="7. Termination">
          We may suspend or terminate your access if you violate these Terms or use the platform in a manner that harms other users.
        </Section>
        <Section title="8. Governing Law">
          These Terms are governed by the laws of your local jurisdiction; disputes will be resolved by the competent courts therein.
        </Section>
        <Section title="9. Contact">
          For questions about these Terms, email <a href="mailto:support@labtrack.app" className="text-primary">support@labtrack.app</a>.
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
