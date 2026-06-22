import { createWriteStream, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { optionalAuth } from "@/lib/auth/auth-middleware";

function uploadsDir(bucket: string): string {
  const dir = join(process.cwd(), "public", "uploads", bucket);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}

export const uploadImage = createServerFn({ method: "POST" })
  .middleware([optionalAuth])
  .inputValidator(
    z.object({
      bucket: z.string().default("device-images"),
      fileName: z.string(),
      contentType: z.string(),
      base64: z.string(),
    }),
  )
  .handler(async ({ data, context }) => {
    const userId = context.userId ?? "anon";
    const ext = data.fileName.split(".").pop() ?? "jpg";
    const safeName = `${userId}/${Date.now()}.${ext}`;
    const dir = uploadsDir(data.bucket);
    const filePath = join(dir, safeName.replace("/", "-"));
    const buffer = Buffer.from(data.base64, "base64");

    await pipeline(Readable.from(buffer), createWriteStream(filePath));

    return { url: `/uploads/${data.bucket}/${safeName.replace("/", "-")}` };
  });
