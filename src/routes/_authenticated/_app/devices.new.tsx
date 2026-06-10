import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DeviceFormFields } from "@/components/device-form";
import type { DeviceForm } from "@/lib/device-schema";
import { toast } from "sonner";
import { ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/_app/devices/new")({
  head: () => ({ meta: [{ title: "Add device — LabTrack" }] }),
  component: NewDevice,
});

function NewDevice() {
  const navigate = useNavigate();
  const m = useMutation({
    mutationFn: async (v: DeviceForm) => {
      const { data: u } = await supabase.auth.getUser();
      const payload = {
        ...v,
        supplier: v.supplier || null,
        location: v.location || null,
        description: v.description || null,
        image_url: v.image_url || null,
        purchase_date: v.purchase_date || null,
        warranty_expiry: v.warranty_expiry || null,
        created_by: u.user?.id ?? null,
      };
      const { error } = await supabase.from("devices").insert(payload as never);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Device added");
      navigate({ to: "/devices" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link to="/devices" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Back to devices
      </Link>
      <div>
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Add device</h1>
        <p className="mt-1 text-sm text-muted-foreground">Register a new peripheral in the inventory.</p>
      </div>
      <DeviceFormFields submitting={m.isPending} onSubmit={(v) => m.mutate(v)} submitLabel="Add device" />
    </div>
  );
}
