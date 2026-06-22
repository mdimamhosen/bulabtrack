import { createFileRoute } from "@tanstack/react-router";
import { DevicesPage } from "@/features/devices/devices-page";

export const Route = createFileRoute("/_authenticated/admin/devices/")({
  head: () => ({ meta: [{ title: "Devices — LabTrack Admin" }] }),
  component: () => <DevicesPage roleBase="/admin" />,
});
