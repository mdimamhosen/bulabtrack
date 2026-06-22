import { getDb, newId, nowIso } from "./mongodb.server";

export async function logAudit(action: string, userId: string | null, details?: string | null): Promise<void> {
  const db = await getDb();
  await db.collection("audit_log").insertOne({
    id: newId(),
    action,
    user_id: userId,
    details: details ?? null,
    created_at: nowIso(),
  });
}
