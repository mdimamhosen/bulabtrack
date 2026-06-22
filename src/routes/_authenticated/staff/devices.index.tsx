import { createFileRoute } from "@tanstack/react-router";
import { DevicesPage } from "@/features/devices/devices-page";

export const Route = createFileRoute("/_authenticated/staff/devices/")({
  head: () => ({ meta: [{ title: "Devices — LabTrack" }] }),
  component: () => <DevicesPage roleBase="/staff" />,
});
