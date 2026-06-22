import { createFileRoute } from "@tanstack/react-router";
import { UsersPage } from "@/features/users/users-page";

export const Route = createFileRoute("/_authenticated/admin/users")({
  head: () => ({ meta: [{ title: "User & Customer Directory — LabTrack" }] }),
  component: UsersPage,
});
