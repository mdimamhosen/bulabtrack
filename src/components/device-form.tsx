import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  deviceSchema, type DeviceForm,
  INTERFACES, STATUSES, CATEGORIES,
} from "@/lib/device-schema";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { ImageUploadField } from "@/components/image-upload-field";

export function DeviceFormFields({
  defaultValues,
  submitting,
  onSubmit,
  submitLabel,
}: {
  defaultValues?: Partial<DeviceForm>;
  submitting?: boolean;
  onSubmit: (v: DeviceForm) => void;
  submitLabel: string;
}) {
  const form = useForm<DeviceForm>({
    resolver: zodResolver(deviceSchema),
    defaultValues: {
      name: "", brand: "", model: "", category: "Input Device",
      price: 0, quantity: 1, interface: "USB", status: "Available",
      supplier: "", purchase_date: "", warranty_expiry: "", location: "",
      serial_number: "", description: "", image_url: "",
      ...defaultValues,
    },
  });

  const err = form.formState.errors;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
          <Field label="Device name" error={err.name?.message}>
            <Input {...form.register("name")} placeholder="Logitech MX Master 3" />
          </Field>
          <Field label="Serial number" error={err.serial_number?.message}>
            <Input {...form.register("serial_number")} placeholder="SN-XXXXX" />
          </Field>
          <Field label="Brand" error={err.brand?.message}>
            <Input {...form.register("brand")} placeholder="Logitech" />
          </Field>
          <Field label="Model" error={err.model?.message}>
            <Input {...form.register("model")} placeholder="MX Master 3" />
          </Field>
          <Field label="Category" error={err.category?.message}>
            <Select value={form.watch("category")} onValueChange={(v) => form.setValue("category", v as DeviceForm["category"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Interface" error={err.interface?.message}>
            <Select value={form.watch("interface")} onValueChange={(v) => form.setValue("interface", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {INTERFACES.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Status" error={err.status?.message}>
            <Select value={form.watch("status")} onValueChange={(v) => form.setValue("status", v as DeviceForm["status"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Price (USD)" error={err.price?.message}>
              <Input type="number" step="0.01" min="0" {...form.register("price")} />
            </Field>
            <Field label="Quantity" error={err.quantity?.message}>
              <Input type="number" min="1" {...form.register("quantity")} />
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
          <Field label="Supplier" error={err.supplier?.message}>
            <Input {...form.register("supplier")} placeholder="Acme Suppliers" />
          </Field>
          <Field label="Lab location" error={err.location?.message}>
            <Input {...form.register("location")} placeholder="Lab 204, Rack B" />
          </Field>
          <Field label="Purchase date" error={err.purchase_date?.message}>
            <Input type="date" {...form.register("purchase_date")} />
          </Field>
          <Field label="Warranty expiry" error={err.warranty_expiry?.message}>
            <Input type="date" {...form.register("warranty_expiry")} />
          </Field>
          <div className="sm:col-span-2">
            <ImageUploadField
              value={form.watch("image_url") ?? ""}
              onChange={(url) => form.setValue("image_url", url, { shouldValidate: true })}
              label="Product image (optional)"
            />
            {err.image_url?.message && (
              <p className="mt-1 text-xs text-destructive">{err.image_url.message}</p>
            )}
          </div>
          <div className="sm:col-span-2">
            <Field label="Description" error={err.description?.message}>
              <Textarea {...form.register("description")} rows={3} placeholder="Notes about the device…" />
            </Field>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
