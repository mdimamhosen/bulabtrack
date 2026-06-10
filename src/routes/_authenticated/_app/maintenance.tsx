import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/stub-page";
import { Wrench } from "lucide-react";
export const Route = createFileRoute("/_authenticated/_app/maintenance")({
  component: () => <StubPage title="Maintenance" desc="Report issues, track technician progress, and view repair history." icon={Wrench} />,
});
