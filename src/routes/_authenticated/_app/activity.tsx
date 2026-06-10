import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/stub-page";
import { Activity } from "lucide-react";
export const Route = createFileRoute("/_authenticated/_app/activity")({
  component: () => <StubPage title="Activity Log" desc="Audit trail of all user and device actions." icon={Activity} />,
});
