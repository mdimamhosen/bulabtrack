import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import jwt from "jsonwebtoken";
import {
  connectDB,
  UserModel,
  DeviceModel,
  OrderModel,
  OrderItemModel,
  ContactMessageModel,
  AuditLogModel,
} from "../db.server";

const JWT_SECRET = process.env.JWT_SECRET || "bulabtrack_secret_key_123456789";

// Native Password Hashing Helpers
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return hash === verifyHash;
}

// Token Verification Helper
function verifyTokenFromHeader(authHeader?: string | null) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.replace("Bearer ", "");
  try {
    return jwt.verify(token, JWT_SECRET) as { sub: string; email: string; role: string };
  } catch (e) {
    return null;
  }
}

// Map table names to Mongoose models
function getModel(tableName: string) {
  switch (tableName) {
    case "profiles":
      return UserModel;
    case "devices":
      return DeviceModel;
    case "orders":
      return OrderModel;
    case "order_items":
      return OrderItemModel;
    case "contact_messages":
      return ContactMessageModel;
    case "audit_log":
      return AuditLogModel;
    default:
      throw new Error(`Unknown table: ${tableName}`);
  }
}

// 1. Unified DB query/write server function
export const executeDbAction = createServerFn({ method: "POST" })
  .validator(
    z.object({
      tableName: z.string(),
      action: z.enum(["select", "insert", "update", "delete"]),
      filters: z.array(
        z.object({
          type: z.enum(["eq", "neq"]),
          field: z.string(),
          value: z.any(),
        })
      ),
      operations: z.array(
        z.object({
          type: z.string(),
          args: z.array(z.any()),
        })
      ),
    })
  )
  .handler(async ({ data: payload }) => {
    await connectDB();
    const { tableName, action, filters, operations } = payload;
    const Model = tableName === "user_roles" ? UserModel : getModel(tableName);

    // Build filter query object
    const filterObj: any = {};
    for (const f of filters) {
      let field = f.field === "id" ? "_id" : f.field;
      if (tableName === "user_roles" && f.field === "user_id") {
        field = "_id";
      }
      if (f.type === "eq") {
        filterObj[field] = f.value;
      } else if (f.type === "neq") {
        filterObj[field] = { $ne: f.value };
      }
    }

    try {
      if (tableName === "user_roles") {
        // Special case: User roles are virtualized on User model in MongoDB
        if (action === "select") {
          const users = await UserModel.find(filterObj);
          const responseData = users.map((u) => ({
            id: u._id,
            user_id: u._id,
            role: u.role,
          }));
          const isSingle = operations.some((o) => o.type === "single");
          const isMaybeSingle = operations.some((o) => o.type === "maybeSingle");
          if (isSingle) {
            if (responseData.length === 0) {
              return { data: null, error: { message: "No row found" } };
            }
            return { data: responseData[0], error: null };
          }
          if (isMaybeSingle) {
            return { data: responseData[0] || null, error: null };
          }
          return { data: responseData, error: null };
        }
        if (action === "insert") {
          const insertData = operations.find((o) => o.type === "insert")?.args[0];
          if (!insertData) return { data: null, error: { message: "No data provided" } };
          const user_id = insertData.user_id;
          const role = insertData.role;
          await UserModel.updateOne({ _id: user_id }, { $set: { role } });
          return { data: { id: user_id, user_id, role }, error: null };
        }
        if (action === "update") {
          const updateData = operations.find((o) => o.type === "update")?.args[0];
          if (!updateData) return { data: null, error: { message: "No data provided" } };
          const userId = filterObj.user_id || filterObj._id;
          if (!userId) return { data: null, error: { message: "No user ID filter" } };
          await UserModel.updateOne({ _id: userId }, { $set: { role: updateData.role } });
          return { data: [{ id: userId, user_id: userId, role: updateData.role }], error: null };
        }
      }

      if (action === "select") {
        let query = Model.find(filterObj);

        // Check for sort order
        const orderOp = operations.find((o) => o.type === "order");
        if (orderOp) {
          const [field, options] = orderOp.args;
          const direction = options?.ascending ? 1 : -1;
          const sortField = field === "id" ? "_id" : field;
          query = query.sort({ [sortField]: direction });
        }

        const docs = await query;
        const responseData = docs.map((doc) => {
          const obj = doc.toObject();
          obj.id = obj._id;
          if (tableName === "profiles") {
            // Ensure password is NEVER returned
            delete obj.password;
            // Map needs_password_change and has_changed_password correctly
            obj.needs_password_change = obj.needs_password_change ?? !obj.has_changed_password;
          }
          return obj;
        });

        const isSingle = operations.some((o) => o.type === "single");
        const isMaybeSingle = operations.some((o) => o.type === "maybeSingle");

        if (isSingle) {
          if (responseData.length === 0) {
            return { data: null, error: { message: "No row found" } };
          }
          return { data: responseData[0], error: null };
        }
        if (isMaybeSingle) {
          return { data: responseData[0] || null, error: null };
        }

        return { data: responseData, error: null };
      }

      if (action === "insert") {
        const insertOp = operations.find((o) => o.type === "insert");
        if (!insertOp) return { data: null, error: { message: "No insert operation found" } };
        const rawData = insertOp.args[0];

        const docs = Array.isArray(rawData) ? rawData : [rawData];
        const docsWithIds = docs.map((d) => {
          const docCopy = { ...d };
          if (!docCopy.id && !docCopy._id) {
            docCopy.id = crypto.randomUUID();
          }
          if (docCopy.id) {
            docCopy._id = docCopy.id;
          }
          return docCopy;
        });

        const result = await Model.insertMany(docsWithIds);
        const responseData = result.map((doc) => {
          const obj = doc.toObject();
          obj.id = obj._id;
          if (tableName === "profiles") delete obj.password;
          return obj;
        });

        const isSingle = operations.some((o) => o.type === "single");
        return {
          data: Array.isArray(rawData) && !isSingle ? responseData : responseData[0],
          error: null,
        };
      }

      if (action === "update") {
        const updateOp = operations.find((o) => o.type === "update");
        if (!updateOp) return { data: null, error: { message: "No update operation found" } };
        const updateData = updateOp.args[0];

        // Fetch matching docs first to mimic Postgres RETURNING
        const docsToUpdate = await Model.find(filterObj);
        const ids = docsToUpdate.map((d) => d._id);

        await Model.updateMany({ _id: { $in: ids } }, { $set: updateData });

        const updatedDocs = await Model.find({ _id: { $in: ids } });
        const responseData = updatedDocs.map((doc) => {
          const obj = doc.toObject();
          obj.id = obj._id;
          if (tableName === "profiles") delete obj.password;
          return obj;
        });

        const isSingle = operations.some((o) => o.type === "single") || operations.some((o) => o.type === "maybeSingle");
        return {
          data: isSingle ? responseData[0] || null : responseData,
          error: null,
        };
      }

      if (action === "delete") {
        const docsToDelete = await Model.find(filterObj);
        const ids = docsToDelete.map((d) => d._id);

        await Model.deleteMany({ _id: { $in: ids } });

        const responseData = docsToDelete.map((doc) => {
          const obj = doc.toObject();
          obj.id = obj._id;
          if (tableName === "profiles") delete obj.password;
          return obj;
        });

        return { data: responseData, error: null };
      }
    } catch (err: any) {
      console.error(`Database error on ${tableName}.${action}:`, err);
      return { data: null, error: { message: err.message || "Database action failed" } };
    }

    return { data: null, error: { message: "Action fell through" } };
  });

// 2. RPC calls executor
export const executeDbRpc = createServerFn({ method: "POST" })
  .validator(
    z.object({
      name: z.string(),
      args: z.any(),
    })
  )
  .handler(async ({ data: payload }) => {
    await connectDB();
    const { name, args } = payload;
    try {
      if (name === "assign_staff_role_by_admin") {
        const { target_user_id, staff_name } = args;
        await UserModel.updateOne(
          { _id: target_user_id },
          {
            $set: {
              role: "staff",
              name: staff_name,
              needs_password_change: true,
              has_changed_password: false,
            },
          }
        );
        return { data: null, error: null };
      }

      if (name === "delete_user_by_admin") {
        const { target_user_id } = args;
        await UserModel.deleteOne({ _id: target_user_id });
        return { data: null, error: null };
      }

      return { data: null, error: { message: `RPC ${name} not implemented` } };
    } catch (err: any) {
      return { data: null, error: { message: err.message } };
    }
  });

// 3. Auth operations server function
export const executeAuthAction = createServerFn({ method: "POST" })
  .validator(
    z.object({
      action: z.enum(["signUp", "signInWithPassword", "getUser", "updateUser", "signOut"]),
      payload: z.any().optional(),
    })
  )
  .handler(async ({ data: body }) => {
    await connectDB();
    const { action, payload } = body;

    try {
      if (action === "signUp") {
        const { email, password, options } = payload;
        const metadata = options?.data || {};

        const existing = await UserModel.findOne({ email: email.toLowerCase().trim() });
        if (existing) {
          return { data: { user: null }, error: { message: "User already exists" } };
        }

        const count = await UserModel.countDocuments();
        // First user is Admin, others default to Customer (unless metadata forces staff)
        let role = count === 0 ? "admin" : "customer";
        const needsPwd = metadata.needs_password_change === true;

        const user = await UserModel.create({
          name: metadata.name || "Customer",
          email: email.toLowerCase().trim(),
          password: hashPassword(password),
          phone: metadata.phone || null,
          status: "active",
          role,
          needs_password_change: needsPwd,
          has_changed_password: !needsPwd,
        });

        const token = jwt.sign(
          { sub: user._id, email: user.email, role: user.role },
          JWT_SECRET,
          { expiresIn: "7d" }
        );

        return {
          data: {
            user: { id: user._id, email: user.email, user_metadata: { name: user.name } },
            session: { access_token: token, expires_in: 3600, user: { id: user._id, email: user.email } },
          },
          error: null,
        };
      }

      if (action === "signInWithPassword") {
        const { email, password } = payload;
        const user = await UserModel.findOne({ email: email.toLowerCase().trim() });
        if (!user || !verifyPassword(password, user.password)) {
          return { data: { user: null, session: null }, error: { message: "Invalid email or password" } };
        }

        // Generate session JWT
        const token = jwt.sign(
          { sub: user._id, email: user.email, role: user.role },
          JWT_SECRET,
          { expiresIn: "7d" }
        );

        return {
          data: {
            user: { id: user._id, email: user.email, user_metadata: { name: user.name } },
            session: { access_token: token, expires_in: 3600, user: { id: user._id, email: user.email } },
          },
          error: null,
        };
      }

      if (action === "getUser") {
        const { token } = payload;
        const decoded = verifyTokenFromHeader(`Bearer ${token}`);
        if (!decoded) {
          return { data: { user: null }, error: { message: "Invalid auth token" } };
        }
        const user = await UserModel.findById(decoded.sub);
        if (!user) {
          return { data: { user: null }, error: { message: "User not found" } };
        }
        return {
          data: {
            user: { id: user._id, email: user.email, user_metadata: { name: user.name } },
          },
          error: null,
        };
      }

      if (action === "updateUser") {
        const { token, data } = payload;
        const decoded = verifyTokenFromHeader(`Bearer ${token}`);
        if (!decoded) {
          return { data: { user: null }, error: { message: "Invalid auth token" } };
        }

        const updates: any = {};
        if (data.password) {
          updates.password = hashPassword(data.password);
        }
        if (data.email) {
          updates.email = data.email.toLowerCase().trim();
        }
        if (data.data) {
          if (data.data.name) updates.name = data.data.name;
          if (data.data.phone) updates.phone = data.data.phone;
        }

        const user = await UserModel.findByIdAndUpdate(decoded.sub, { $set: updates }, { new: true });
        if (!user) return { data: { user: null }, error: { message: "User not found" } };

        return {
          data: {
            user: { id: user._id, email: user.email, user_metadata: { name: user.name } },
          },
          error: null,
        };
      }

      if (action === "signOut") {
        return { data: null, error: null };
      }
    } catch (err: any) {
      return { data: null, error: { message: err.message } };
    }

    return { data: null, error: { message: "Auth action fell through" } };
  });

// 4. File upload server function
export const saveUploadedFileServer = createServerFn({ method: "POST" })
  .validator(
    z.object({
      filePath: z.string(),
      base64Data: z.string(),
    })
  )
  .handler(async ({ data: payload }) => {
    const { filePath, base64Data } = payload;
    try {
      const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        throw new Error("Invalid base64 payload");
      }
      const buffer = Buffer.from(matches[2], "base64");

      const publicDir = path.join(process.cwd(), "public");
      const uploadDir = path.join(publicDir, "uploads");

      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filename = path.basename(filePath);
      const destPath = path.join(uploadDir, filename);

      fs.writeFileSync(destPath, buffer);
      console.log(`Saved file to ${destPath}`);

      return { data: { path: `/uploads/${filename}` }, error: null };
    } catch (err: any) {
      console.error("File upload error:", err);
      return { data: null, error: { message: err.message } };
    }
  });
