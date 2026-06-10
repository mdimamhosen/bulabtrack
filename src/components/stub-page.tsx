import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Wrench, BarChart3, Users, Activity, Settings, Construction } from "lucide-react";

const stubs = {
  maintenance: { title: "Maintenance", icon: Wrench, desc: "Report issues, track technician progress, and view repair history." },
  reports: { title: "Reports", icon: BarChart3, desc: "Inventory, maintenance, cost and category reports — PDF, CSV, Excel." },
  users: { title: "Users", icon: Users, desc: "Create staff accounts, assign roles, and manage activity." },
  activity: { title: "Activity Log", icon: Activity, desc: "Full audit trail: logins, device changes, maintenance updates." },
  settings: { title: "Settings", icon: Settings, desc: "Theme, notification preferences and account options." },
} as const;

function Stub({ kind }: { kind: keyof typeof stubs }) {
  const s = stubs[kind];
  const Icon = s.icon;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">{s.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 p-16 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/15 text-primary">
            <Icon className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-semibold">Coming in the next phase</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            <Construction className="mr-1 inline h-4 w-4" />
            Phase 1 ships Auth, Dashboard and full Device CRUD. This module is queued for the next iteration.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export const MaintenanceRoute = createFileRoute("/_authenticated/_app/maintenance")({ component: () => <Stub kind="maintenance" /> });
export const ReportsRoute = createFileRoute("/_authenticated/_app/reports")({ component: () => <Stub kind="reports" /> });
export const UsersRoute = createFileRoute("/_authenticated/_app/users")({ component: () => <Stub kind="users" /> });
export const ActivityRoute = createFileRoute("/_authenticated/_app/activity")({ component: () => <Stub kind="activity" /> });
export const SettingsRoute = createFileRoute("/_authenticated/_app/settings")({ component: () => <Stub kind="settings" /> });
