import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/stub-page";
import { Users } from "lucide-react";
export const Route = createFileRoute("/_authenticated/_app/users")({
  component: () => <StubPage title="Users" desc="Create staff accounts, assign roles, and manage activity." icon={Users} />,
});
