import { createFileRoute } from "@tanstack/react-router";
import { redirectLegacyPath } from "@/lib/legacy-redirect";

export const Route = createFileRoute("/_authenticated/_app/maintenance")({
  beforeLoad: async () => {
    await redirectLegacyPath("/maintenance");
  },
});
