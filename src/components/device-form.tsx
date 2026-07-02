import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { saveUploadedFileServer } from "@/lib/api/database.functions";
import {
  deviceSchema,
  type DeviceForm,
  INTERFACES,
  STATUSES,
} from "@/lib/device-schema";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Camera } from "lucide-react";

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
  const defaultCategory = defaultValues?.category ?? "Input Device";
  const isDefaultStandard = defaultCategory === "Input Device" || defaultCategory === "Output Device";

  const [isCustomCategory, setIsCustomCategory] = useState(!isDefaultStandard);
  const [customCategoryValue, setCustomCategoryValue] = useState(!isDefaultStandard ? defaultCategory : "");

  const { data: devices = [] } = useQuery({
    queryKey: ["device-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("devices").select("category");
      if (error) throw error;
      return data ?? [];
    },
  });

  const existingCategories = useMemo(() => {
    const cats = new Set<string>();
    cats.add("Input Device");
    cats.add("Output Device");
    devices.forEach((d: any) => {
      if (d.category) {
        cats.add(d.category);
      }
    });
    return Array.from(cats);
  }, [devices]);

  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const toastId = toast.loading("Uploading image...");

    try {
      const cloudName = "drxkgsnhy";
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "ml_default");

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.secure_url) {
          form.setValue("image_url", data.secure_url);
          toast.success("Image uploaded to Cloudinary successfully!", { id: toastId });
          setUploadingImage(false);
          return;
        }
      }

      console.warn("Cloudinary upload failed, trying local fallback...");
      
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result as string;
        try {
          const res = await saveUploadedFileServer({
            data: {
              filePath: file.name,
              base64Data,
            },
          });

          if (res.data?.path) {
            form.setValue("image_url", window.location.origin + res.data.path);
            toast.success("Image uploaded to local storage (Cloudinary fallback)!", { id: toastId });
          } else {
            toast.error(res.error?.message || "Failed to upload image.", { id: toastId });
          }
        } catch (err: any) {
          toast.error(err.message || "Failed to upload image.", { id: toastId });
        } finally {
          setUploadingImage(false);
        }
      };
      reader.readAsDataURL(file);

    } catch (err: any) {
      toast.error(err.message || "Upload failed.", { id: toastId });
      setUploadingImage(false);
    }
  };

  const form = useForm<DeviceForm>({
    resolver: zodResolver(deviceSchema),
    defaultValues: {
      name: "",
      brand: "",
      model: "",
      category: "Input Device",
      price: 0,
      quantity: 1,
      interface: "USB",
      status: "Available",
      supplier: "",
      purchase_date: "",
      warranty_expiry: "",
      location: "",
      serial_number: "",
      description: "",
      image_url: "",
      ...defaultValues,
    },
  });

  const err = form.formState.errors;

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit, (errors) => {
        const first = Object.values(errors)[0] as { message?: string } | undefined;
        toast.error(first?.message ?? "Please fix the highlighted fields before saving.");
      })}
      className="space-y-6"
    >
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
            <Select
              value={isCustomCategory ? "__custom__" : form.watch("category")}
              onValueChange={(v) => {
                if (v === "__custom__") {
                  setIsCustomCategory(true);
                  form.setValue("category", customCategoryValue || "");
                } else {
                  setIsCustomCategory(false);
                  form.setValue("category", v);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {existingCategories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
                <SelectItem value="__custom__" className="text-amber-500 font-semibold">
                  + Add custom category...
                </SelectItem>
              </SelectContent>
            </Select>
            {isCustomCategory && (
              <Input
                placeholder="Enter custom category name"
                value={customCategoryValue}
                onChange={(e) => {
                  setCustomCategoryValue(e.target.value);
                  form.setValue("category", e.target.value);
                }}
                className="mt-2"
              />
            )}
          </Field>
          <Field label="Interface" error={err.interface?.message}>
            <Select
              value={form.watch("interface")}
              onValueChange={(v) => form.setValue("interface", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INTERFACES.map((i) => (
                  <SelectItem key={i} value={i}>
                    {i}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Status" error={err.status?.message}>
            <Select
              value={form.watch("status")}
              onValueChange={(v) => form.setValue("status", v as DeviceForm["status"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
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
            <Field label="Product Image URL (optional)" error={err.image_url?.message}>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center mt-1.5">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border bg-secondary/30">
                  {form.watch("image_url") && /^https?:\/\//.test(form.watch("image_url") || "") ? (
                    <img
                      src={form.watch("image_url") || ""}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <Camera className="h-6 w-6 opacity-40" />
                    </div>
                  )}
                </div>
                <div className="flex-1 w-full">
                  <Input
                    type="text"
                    placeholder="https://images.unsplash.com/photo-..."
                    {...form.register("image_url")}
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Paste a direct link to an image (starting with http:// or https://)
                  </p>
                  <div className="mt-3">
                    <Label className="text-[10px] uppercase text-muted-foreground block mb-1">Or upload image file</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="cursor-pointer text-xs"
                    />
                  </div>
                </div>
              </div>
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Description" error={err.description?.message}>
              <Textarea
                {...form.register("description")}
                rows={3}
                placeholder="Notes about the device…"
              />
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

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
