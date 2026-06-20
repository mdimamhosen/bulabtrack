import { createFileRoute } from "@tanstack/react-router";
import { ActivityLog } from "@/components/activity-log";
import { Activity } from "lucide-react";
export const Route = createFileRoute("/_authenticated/_app/activity")({
  component: ActivityLog,
});
