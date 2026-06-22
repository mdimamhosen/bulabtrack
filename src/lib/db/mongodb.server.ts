import { MongoClient, type Db } from "mongodb";

let client: MongoClient | null = null;
let db: Db | null = null;

export function getMongoUri(): string {
  return process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/labtrack";
}

export async function getDb(): Promise<Db> {
  if (db) return db;

  client = new MongoClient(getMongoUri());
  await client.connect();
  db = client.db();

  await db.collection("users").createIndex({ email: 1 }, { unique: true });
  await db.collection("profiles").createIndex({ email: 1 });
  await db.collection("user_roles").createIndex({ user_id: 1 });
  await db.collection("devices").createIndex({ created_at: -1 });
  await db.collection("orders").createIndex({ created_at: -1 });
  await db.collection("orders").createIndex({ email: 1 });
  await db.collection("order_items").createIndex({ order_id: 1 });
  await db.collection("audit_log").createIndex({ created_at: -1 });

  return db;
}

export function newId(): string {
  return crypto.randomUUID();
}

export function nowIso(): string {
  return new Date().toISOString();
}
