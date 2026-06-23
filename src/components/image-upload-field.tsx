import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type ImageUploadFieldProps = {
  value: string;
  onChange: (url: string) => void;
  bucket?: string;
  label?: string;
  /** When false (default), failed uploads show an error instead of embedding base64 */
  allowBase64Fallback?: boolean;
};

export function ImageUploadField({
  value,
  onChange,
  bucket = "device-images",
  label = "Product image",
  allowBase64Fallback = false,
}: ImageUploadFieldProps) {
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    setIsUploading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id ?? "anon";
      const ext = file.name.split(".").pop() ?? "jpg";
      const filePath = `${userId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, { cacheControl: "3600", upsert: true });

      if (uploadError) {
        if (allowBase64Fallback) {
          const reader = new FileReader();
          reader.onloadend = () => {
            onChange(reader.result as string);
            setIsUploading(false);
            toast.success("Image saved (embedded)");
          };
          reader.onerror = () => {
            setIsUploading(false);
            toast.error("Failed to read image file");
          };
          reader.readAsDataURL(file);
          return;
        }

        setIsUploading(false);
        const msg = uploadError.message.toLowerCase();
        if (msg.includes("bucket") || msg.includes("not found")) {
          toast.error(
            "Image storage is not set up yet. Apply Supabase migrations (device-images bucket) or save without an image.",
          );
        } else {
          toast.error(`Image upload failed: ${uploadError.message}`);
        }
        return;
      }

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
      onChange(urlData.publicUrl);
      toast.success("Image uploaded successfully");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to upload image";
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl border border-border bg-secondary/30">
          {value ? (
            <img src={value} alt="Preview" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <Camera className="h-8 w-8 opacity-40" />
            </div>
          )}
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/70">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
            disabled={isUploading}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isUploading}
            onClick={() => inputRef.current?.click()}
          >
            {value ? "Replace image" : "Upload image"}
          </Button>
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange("")}
              className="text-destructive"
            >
              Remove image
            </Button>
          )}
          <p className="text-xs text-muted-foreground">JPG, PNG, WebP or GIF. Max 5MB.</p>
        </div>
      </div>
    </div>
  );
}
