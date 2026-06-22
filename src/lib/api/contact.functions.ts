import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getDb, newId, nowIso } from "@/lib/db/mongodb.server";
import type { ContactMessage } from "@/lib/db/types";

export const submitContactMessage = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      name: z.string().min(2),
      email: z.string().email(),
      subject: z.string().min(2),
      message: z.string().min(10),
    }),
  )
  .handler(async ({ data }) => {
    const db = await getDb();
    const message: ContactMessage = {
      id: newId(),
      ...data,
      created_at: nowIso(),
    };
    await db.collection<ContactMessage>("contact_messages").insertOne(message);
    return { ok: true };
  });
