import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { uploadImage } from "@/lib/api/storage.functions";
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

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const encoded = result.split(",")[1];
      if (!encoded) reject(new Error("Failed to read image"));
      else resolve(encoded);
    };
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.readAsDataURL(file);
  });
}

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
      const base64 = await fileToBase64(file);

      try {
        const { url } = await uploadImage({
          data: {
            bucket,
            fileName: file.name,
            contentType: file.type,
            base64,
          },
        });
        onChange(url);
        toast.success("Image uploaded successfully");
      } catch (uploadError) {
        if (allowBase64Fallback) {
          onChange(`data:${file.type};base64,${base64}`);
          toast.success("Image saved (embedded)");
          return;
        }

        const message = uploadError instanceof Error ? uploadError.message : "Upload failed";
        toast.error(
          message.toLowerCase().includes("bucket")
            ? "Image storage is not set up yet. Save without an image or enable local uploads."
            : `Image upload failed: ${message}`,
        );
      }
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
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")} className="text-destructive">
              Remove image
            </Button>
          )}
          <p className="text-xs text-muted-foreground">JPG, PNG, WebP or GIF. Max 5MB.</p>
        </div>
      </div>
    </div>
  );
}
