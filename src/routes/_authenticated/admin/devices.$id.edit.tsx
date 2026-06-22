import { createFileRoute } from "@tanstack/react-router";
import { EditDevicePage } from "@/features/devices/device-edit-page";

export const Route = createFileRoute("/_authenticated/admin/devices/$id/edit")({
  head: () => ({ meta: [{ title: "Edit device — LabTrack" }] }),
  component: function AdminEditDevice() {
    const { id } = Route.useParams();
    return <EditDevicePage id={id} roleBase="/admin" />;
  },
});
