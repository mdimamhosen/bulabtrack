import { createFileRoute } from "@tanstack/react-router";
import { OrdersPage } from "@/features/orders/orders-page";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  head: () => ({ meta: [{ title: "Orders — LabTrack" }] }),
  component: OrdersPage,
});
