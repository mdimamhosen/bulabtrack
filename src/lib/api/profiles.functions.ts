import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getDb } from "@/lib/db/mongodb.server";
import { requireAuth, requireStaff } from "@/lib/auth/auth-middleware";
import type { Profile, UserRole } from "@/lib/db/types";

export const getCurrentProfile = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const db = await getDb();
    const profile = await db.collection<Profile>("profiles").findOne({ id: context.userId });
    return {
      ...profile,
      authEmail: context.user.email,
      emailConfirmedAt: context.user.email_confirmed_at,
    };
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator(
    z.object({
      name: z.string().min(2).optional(),
      phone: z.string().nullable().optional(),
      avatar_url: z.string().nullable().optional(),
      needs_password_change: z.boolean().optional(),
      status: z.enum(["active", "inactive"]).optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    const db = await getDb();
    await db.collection<Profile>("profiles").updateOne({ id: context.userId }, { $set: data });
    return { ok: true };
  });

export const listProfiles = createServerFn({ method: "GET" })
  .middleware([requireStaff])
  .handler(async () => {
    const db = await getDb();
    return db.collection<Profile>("profiles").find({}).toArray();
  });

export const listUserRoles = createServerFn({ method: "GET" })
  .middleware([requireStaff])
  .handler(async () => {
    const db = await getDb();
    return db.collection<UserRole>("user_roles").find({}).toArray();
  });

export const adminUpdateProfile = createServerFn({ method: "POST" })
  .middleware([requireStaff])
  .inputValidator(
    z.object({
      userId: z.string().uuid(),
      name: z.string().min(2).optional(),
      phone: z.string().nullable().optional(),
      status: z.enum(["active", "inactive"]).optional(),
      needs_password_change: z.boolean().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const db = await getDb();
    const { userId, ...update } = data;
    await db.collection<Profile>("profiles").updateOne({ id: userId }, { $set: update });
    return { ok: true };
  });

export const getProfileById = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const db = await getDb();
    return db
      .collection<Profile>("profiles")
      .findOne(
        { id: context.userId },
        { projection: { name: 1, email: 1, avatar_url: 1, needs_password_change: 1, status: 1 } },
      );
  });
