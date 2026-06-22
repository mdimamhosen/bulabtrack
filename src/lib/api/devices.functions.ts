import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getDb, newId, nowIso } from "@/lib/db/mongodb.server";
import { logAudit } from "@/lib/db/audit.server";
import { requireAuth, requireStaff } from "@/lib/auth/auth-middleware";
import type { Device, DeviceStatus } from "@/lib/db/types";

const deviceInsertSchema = z.object({
  name: z.string().min(1),
  brand: z.string().min(1),
  model: z.string().min(1),
  category: z.enum(["Input Device", "Output Device"]),
  price: z.number(),
  quantity: z.number(),
  interface: z.string().min(1),
  status: z.enum(["Available", "In Use", "Under Maintenance", "Damaged", "Disposed"]).optional(),
  serial_number: z.string().min(1),
  image_url: z.string().nullable().optional(),
  supplier: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  purchase_date: z.string().nullable().optional(),
  warranty_expiry: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
});

export const listDevices = createServerFn({ method: "GET" })
  .inputValidator(
    z
      .object({
        status: z.string().optional(),
        limit: z.number().optional(),
        columns: z.string().optional(),
      })
      .optional(),
  )
  .handler(async ({ data }) => {
    const db = await getDb();
    const filter = data?.status ? { status: data.status } : {};
    let cursor = db.collection<Device>("devices").find(filter).sort({ created_at: -1 });
    if (data?.limit) cursor = cursor.limit(data.limit);
    return cursor.toArray();
  });

export const getDevice = createServerFn({ method: "GET" })
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const db = await getDb();
    return db.collection<Device>("devices").findOne({ id: data.id });
  });

export const listRelatedDevices = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      category: z.string(),
      excludeId: z.string().uuid(),
      limit: z.number().default(4),
    }),
  )
  .handler(async ({ data }) => {
    const db = await getDb();
    return db
      .collection<Device>("devices")
      .find({ category: data.category, id: { $ne: data.excludeId } })
      .project({ id: 1, name: 1, brand: 1, price: 1, image_url: 1, category: 1 })
      .limit(data.limit)
      .toArray();
  });

export const createDevice = createServerFn({ method: "POST" })
  .middleware([requireStaff])
  .inputValidator(deviceInsertSchema)
  .handler(async ({ data, context }) => {
    const db = await getDb();
    const timestamp = nowIso();
    const device: Device = {
      id: newId(),
      ...data,
      status: data.status ?? "Available",
      image_url: data.image_url ?? null,
      supplier: data.supplier ?? null,
      location: data.location ?? null,
      purchase_date: data.purchase_date ?? null,
      warranty_expiry: data.warranty_expiry ?? null,
      description: data.description ?? null,
      created_by: context.userId,
      created_at: timestamp,
      updated_at: timestamp,
    };
    await db.collection<Device>("devices").insertOne(device);
    await logAudit("device_created", context.userId, `Created device ${device.name}`);
    return device;
  });

export const updateDevice = createServerFn({ method: "POST" })
  .middleware([requireStaff])
  .inputValidator(
    z.object({
      id: z.string().uuid(),
      data: deviceInsertSchema.partial(),
    }),
  )
  .handler(async ({ data, context }) => {
    const db = await getDb();
    const update = { ...data.data, updated_at: nowIso() };
    await db.collection<Device>("devices").updateOne({ id: data.id }, { $set: update });
    await logAudit("device_updated", context.userId, `Updated device ${data.id}`);
    return { ok: true };
  });

export const updateDeviceStatus = createServerFn({ method: "POST" })
  .middleware([requireStaff])
  .inputValidator(
    z.object({
      id: z.string().uuid(),
      status: z.enum(["Available", "In Use", "Under Maintenance", "Damaged", "Disposed"]),
    }),
  )
  .handler(async ({ data, context }) => {
    const db = await getDb();
    await db
      .collection<Device>("devices")
      .updateOne({ id: data.id }, { $set: { status: data.status as DeviceStatus, updated_at: nowIso() } });
    await logAudit("device_status_updated", context.userId, `${data.id} -> ${data.status}`);
    return { ok: true };
  });

export const deleteDevice = createServerFn({ method: "POST" })
  .middleware([requireStaff])
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const db = await getDb();
    await db.collection<Device>("devices").deleteOne({ id: data.id });
    await logAudit("device_deleted", context.userId, data.id);
    return { ok: true };
  });
