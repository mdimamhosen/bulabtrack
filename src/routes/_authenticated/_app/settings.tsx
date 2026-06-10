import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/stub-page";
import { Settings } from "lucide-react";
export const Route = createFileRoute("/_authenticated/_app/settings")({
  component: () => <StubPage title="Settings" desc="Theme, notification preferences and account options." icon={Settings} />,
});
