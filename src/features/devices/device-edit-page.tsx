import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getDevice, updateDevice } from "@/lib/api/devices.functions";
import { DeviceFormFields } from "@/components/device-form";
import type { DeviceForm } from "@/lib/device-schema";
import { toast } from "sonner";
import { ChevronLeft, Loader2 } from "lucide-react";

export function EditDevicePage({ id, roleBase }: { id: string; roleBase: string }) {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ["device", id],
    queryFn: async () => getDevice({ data: { id } }),
  });

  const m = useMutation({
    mutationFn: async (v: DeviceForm) => {
      await updateDevice({
        data: {
          id,
          data: {
            ...v,
            supplier: v.supplier || null,
            location: v.location || null,
            description: v.description || null,
            image_url: v.image_url || null,
            purchase_date: v.purchase_date || null,
            warranty_expiry: v.warranty_expiry || null,
          },
        },
      });
    },
    onSuccess: () => {
      toast.success("Device updated");
      navigate({ to: `${roleBase}/devices` as never });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!data) return <div className="p-6 text-muted-foreground">Device not found.</div>;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link to={`${roleBase}/devices` as never} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Back to devices
      </Link>
      <div>
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Edit device</h1>
        <p className="mt-1 text-sm text-muted-foreground">{data.name}</p>
      </div>
      <DeviceFormFields
        defaultValues={{
          ...data,
          price: Number(data.price),
          supplier: data.supplier ?? "",
          location: data.location ?? "",
          description: data.description ?? "",
          image_url: data.image_url ?? "",
          purchase_date: data.purchase_date ?? "",
          warranty_expiry: data.warranty_expiry ?? "",
        } as Partial<DeviceForm>}
        submitting={m.isPending}
        onSubmit={(v) => m.mutate(v)}
        submitLabel="Save changes"
      />
    </div>
  );
}
