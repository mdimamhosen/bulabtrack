import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/stub-page";
import { BarChart3 } from "lucide-react";
export const Route = createFileRoute("/_authenticated/_app/reports")({
  component: () => <StubPage title="Reports" desc="Inventory, maintenance, cost and category reports." icon={BarChart3} />,
});
