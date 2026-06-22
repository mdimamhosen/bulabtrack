import { createFileRoute } from "@tanstack/react-router";
import { redirectLegacyPath } from "@/lib/legacy-redirect";

export const Route = createFileRoute("/_authenticated/_app/reports")({
  beforeLoad: async () => {
    await redirectLegacyPath("/reports");
  },
});
