import { createFileRoute } from "@tanstack/react-router";
import { NewDevicePage } from "@/features/devices/device-new-page";

export const Route = createFileRoute("/_authenticated/admin/devices/new")({
  head: () => ({ meta: [{ title: "Add device — LabTrack" }] }),
  component: () => <NewDevicePage roleBase="/admin" />,
});
