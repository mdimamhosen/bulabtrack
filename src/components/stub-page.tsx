import { Card, CardContent } from "@/components/ui/card";
import { Construction, type LucideIcon } from "lucide-react";

export function StubPage({
  title,
  desc,
  icon: Icon,
}: {
  title: string;
  desc: string;
  icon: LucideIcon;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 p-16 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/15 text-primary">
            <Icon className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-semibold">Coming in the next phase</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            <Construction className="mr-1 inline h-4 w-4" />
            Phase 1 ships Auth, Dashboard and full Device CRUD. This module is queued next.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
