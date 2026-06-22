import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "@/features/settings/settings-page";

export const Route = createFileRoute("/_authenticated/staff/settings")({
  head: () => ({ meta: [{ title: "Account Settings — LabTrack" }] }),
  component: SettingsPage,
});
