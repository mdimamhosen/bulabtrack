import { createServerFn } from "@tanstack/react-start";
import { getDb } from "@/lib/db/mongodb.server";
import { requireStaff } from "@/lib/auth/auth-middleware";
import type { AuditLog } from "@/lib/db/types";

export const listAuditLogs = createServerFn({ method: "GET" })
  .middleware([requireStaff])
  .handler(async () => {
    const db = await getDb();
    return db
      .collection<AuditLog>("audit_log")
      .find({}, { projection: { id: 1, action: 1, created_at: 1, user_id: 1, details: 1 } })
      .sort({ created_at: -1 })
      .toArray();
  });
