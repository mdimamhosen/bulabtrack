import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import jwt from "jsonwebtoken";
import { requireSupabaseAuth } from "../../integrations/supabase/auth-middleware";
import {
  connectDB,
  UserModel,
  DeviceModel,
  OrderModel,
  OrderItemModel,
  ContactMessageModel,
  AuditLogModel,
  ReviewModel,
  LikeDislikeModel,
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
    case "reviews":
      return ReviewModel;
    case "likes_dislikes":
      return LikeDislikeModel;
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
        }),
      ),
      operations: z.array(
        z.object({
          type: z.string(),
          args: z.array(z.any()),
        }),
      ),
    }),
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
            role: u.role === "customer" ? null : u.role,
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

        const isSingle =
          operations.some((o) => o.type === "single") ||
          operations.some((o) => o.type === "maybeSingle");
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
    }),
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
          },
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
    }),
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

        const token = jwt.sign({ sub: user._id, email: user.email, role: user.role }, JWT_SECRET, {
          expiresIn: "7d",
        });

        return {
          data: {
            user: { id: user._id, email: user.email, user_metadata: { name: user.name } },
            session: {
              access_token: token,
              expires_in: 3600,
              user: { id: user._id, email: user.email },
            },
          },
          error: null,
        };
      }

      if (action === "signInWithPassword") {
        const { email, password } = payload;
        const user = await UserModel.findOne({ email: email.toLowerCase().trim() });
        if (!user || !verifyPassword(password, user.password)) {
          return {
            data: { user: null, session: null },
            error: { message: "Invalid email or password" },
          };
        }

        // Generate session JWT
        const token = jwt.sign({ sub: user._id, email: user.email, role: user.role }, JWT_SECRET, {
          expiresIn: "7d",
        });

        return {
          data: {
            user: { id: user._id, email: user.email, user_metadata: { name: user.name } },
            session: {
              access_token: token,
              expires_in: 3600,
              user: { id: user._id, email: user.email },
            },
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

        const user = await UserModel.findByIdAndUpdate(
          decoded.sub,
          { $set: updates },
          { new: true },
        );
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
    }),
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

// 5. Seed database server function with complete high-quality dataset
export const seedDatabaseServer = createServerFn({ method: "POST" }).handler(async () => {
  await connectDB();
  try {
    // Clear collections
    await DeviceModel.deleteMany({});
    await OrderModel.deleteMany({});
    await OrderItemModel.deleteMany({});
    await AuditLogModel.deleteMany({});
    await ContactMessageModel.deleteMany({});

    // Delete all users except admin 'mdimam.cse9.bu@gmail.com'
    await UserModel.deleteMany({ email: { $ne: "mdimam.cse9.bu@gmail.com" } });

    // Hash a default password
    const hashedPwd = hashPassword("password123");

    // Seed staff
    const staffList = [
      {
        _id: crypto.randomUUID(),
        name: "Sarah Jenkins",
        email: "sarah.j@lab.edu",
        password: hashedPwd,
        role: "staff",
        status: "active",
        needs_password_change: false,
        has_changed_password: true,
        phone: "+1 (555) 123-4567",
      },
      {
        _id: crypto.randomUUID(),
        name: "Michael Chen",
        email: "m.chen@lab.edu",
        password: hashedPwd,
        role: "staff",
        status: "active",
        needs_password_change: true,
        has_changed_password: false,
        phone: "+1 (555) 234-5678",
      },
      {
        _id: crypto.randomUUID(),
        name: "Emily Rodriguez",
        email: "emily.r@lab.edu",
        password: hashedPwd,
        role: "staff",
        status: "active",
        needs_password_change: false,
        has_changed_password: true,
        phone: "+1 (555) 345-6789",
      },
      {
        _id: crypto.randomUUID(),
        name: "David Kim",
        email: "d.kim@lab.edu",
        password: hashedPwd,
        role: "staff",
        status: "inactive",
        needs_password_change: false,
        has_changed_password: true,
        phone: "+1 (555) 456-7890",
      },
    ];
    await UserModel.insertMany(staffList);

    // Seed customers
    const customers = [
      {
        name: "Alice Johnson",
        email: "alice.j@stanford.edu",
        phone: "+1 (555) 087-4321",
        city: "Stanford",
        address: "789 Campus Dr",
        postal_code: "94305",
      },
      {
        name: "Bob Brown",
        email: "bob.brown@berkeley.edu",
        phone: "+1 (555) 098-1122",
        city: "Berkeley",
        address: "101 Euclid Ave",
        postal_code: "94720",
      },
      {
        name: "Charlie Green",
        email: "c.green@cmu.edu",
        phone: "+1 (555) 022-8877",
        city: "Pittsburgh",
        address: "5000 Forbes Ave",
        postal_code: "15213",
      },
      {
        name: "Diana Prince",
        email: "diana.prince@harvard.edu",
        phone: "+1 (555) 055-6677",
        city: "Cambridge",
        address: "86 Brattle St",
        postal_code: "02138",
      },
      {
        name: "Evan Wright",
        email: "evan.wright@yale.edu",
        phone: "+1 (555) 077-4433",
        city: "New Haven",
        address: "246 Church St",
        postal_code: "06510",
      },
      {
        name: "Fiona Gallagher",
        email: "fiona.g@columbia.edu",
        phone: "+1 (555) 011-2233",
        city: "New York",
        address: "116th St & Broadway",
        postal_code: "10027",
      },
      {
        name: "John Doe",
        email: "john.doe@gmail.com",
        phone: "+1 (555) 019-2834",
        city: "Boston",
        address: "123 Academic Way",
        postal_code: "02115",
      },
      {
        name: "Jane Smith",
        email: "jane.smith@mit.edu",
        phone: "+1 (555) 043-9821",
        city: "Cambridge",
        address: "45 Innovation Blvd",
        postal_code: "02139",
      },
      {
        name: "George Costanza",
        email: "george@vandelay.com",
        phone: "+1 (555) 044-5566",
        city: "New York",
        address: "84th St & West End Ave",
        postal_code: "10024",
      },
      {
        name: "Hannah Abbott",
        email: "hannah@hogwarts.edu",
        phone: "+1 (555) 033-6699",
        city: "Hogsmeade",
        address: "Hufflepuff Basement",
        postal_code: "00777",
      },
      {
        name: "Peter Parker",
        email: "peter.parker@columbia.edu",
        phone: "+1 (555) 777-8888",
        city: "New York",
        address: "Ingram St, Forest Hills",
        postal_code: "11375",
      },
      {
        name: "Bruce Wayne",
        email: "bruce.wayne@gotham.edu",
        phone: "+1 (555) 999-0000",
        city: "Gotham",
        address: "1007 Mountain Drive",
        postal_code: "53540",
      },
      {
        name: "Clark Kent",
        email: "clark.kent@metropolis.edu",
        phone: "+1 (555) 111-2222",
        city: "Metropolis",
        address: "344 Clinton St, Apt 3B",
        postal_code: "62960",
      },
      {
        name: "Tony Stark",
        email: "tony.stark@mit.edu",
        phone: "+1 (555) 330-0880",
        city: "Malibu",
        address: "10880 El Medio St",
        postal_code: "90265",
      },
      {
        name: "Steve Rogers",
        email: "steve.rogers@nyu.edu",
        phone: "+1 (555) 191-8045",
        city: "Brooklyn",
        address: "569 Corona Avenue",
        postal_code: "11201",
      },
    ];

    const customerUsers = customers.map((c) => ({
      _id: crypto.randomUUID(),
      name: c.name,
      email: c.email,
      password: hashedPwd,
      role: "customer",
      status: "active",
      needs_password_change: false,
      has_changed_password: true,
      phone: c.phone,
    }));
    await UserModel.insertMany(customerUsers);

    // Seed devices
    const SEED_DEVICES = [
      {
        name: "Logitech G Pro Mechanical Keyboard",
        brand: "Logitech",
        model: "G Pro X",
        category: "Input Device",
        price: 129.99,
        quantity: 25,
        status: "Available",
        location: "Lab Room 101",
        supplier: "Logitech Direct",
        serial_number: "SN-KBD-GPX-001",
        warranty_expiry: new Date("2028-12-31"),
        purchase_date: new Date("2025-06-15"),
        description: "Compact tenkeyless gaming keyboard with hot-swappable pro-grade switches.",
        image_url:
          "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=500&q=80",
      },
      {
        name: "Keychron K2 Wireless Keyboard",
        brand: "Keychron",
        model: "K2 V2",
        category: "Input Device",
        price: 99.99,
        quantity: 15,
        status: "Available",
        location: "Lab Room 102",
        supplier: "Keychron Corp",
        serial_number: "SN-KBD-KK2-002",
        warranty_expiry: new Date("2027-10-01"),
        purchase_date: new Date("2025-08-20"),
        description: "75% layout tactile mechanical keyboard with wireless and wired connections.",
        image_url:
          "https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=500&q=80",
      },
      {
        name: "SteelSeries Apex Pro Keyboard",
        brand: "SteelSeries",
        model: "Apex Pro",
        category: "Input Device",
        price: 199.99,
        quantity: 10,
        status: "Available",
        location: "Lab Room 101",
        supplier: "SteelSeries Inc",
        serial_number: "SN-KBD-ASP-003",
        warranty_expiry: new Date("2029-01-15"),
        purchase_date: new Date("2025-09-10"),
        description:
          "Full-sized mechanical keyboard featuring OmniPoint adjustable mechanical switches.",
        image_url:
          "https://images.unsplash.com/photo-1601445638532-3c6f6c3aa1d6?auto=format&fit=crop&w=500&q=80",
      },
      {
        name: "MX Master 3S Wireless Mouse",
        brand: "Logitech",
        model: "MX Master 3S",
        category: "Input Device",
        price: 99.99,
        quantity: 30,
        status: "Available",
        location: "Lab Room 101",
        supplier: "Logitech Direct",
        serial_number: "SN-MSE-MXM-004",
        warranty_expiry: new Date("2028-06-30"),
        purchase_date: new Date("2025-07-01"),
        description: "Ergonomic workspace mouse with 8K DPI tracking and quiet clicks.",
        image_url:
          "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=500&q=80",
      },
      {
        name: "Logitech G502 Hero Gaming Mouse",
        brand: "Logitech",
        model: "G502 Hero",
        category: "Input Device",
        price: 59.99,
        quantity: 40,
        status: "Available",
        location: "Lab Room 103",
        supplier: "Logitech Direct",
        serial_number: "SN-MSE-G50-005",
        warranty_expiry: new Date("2027-05-15"),
        purchase_date: new Date("2025-05-10"),
        description:
          "High performance gaming mouse with HERO 25K optical sensor and adjustable weights.",
        image_url:
          "https://images.unsplash.com/photo-1625842268584-8f3290455655?auto=format&fit=crop&w=500&q=80",
      },
      {
        name: "Razer DeathAdder V3 Mouse",
        brand: "Razer",
        model: "DeathAdder V3",
        category: "Input Device",
        price: 69.99,
        quantity: 20,
        status: "Available",
        location: "Lab Room 102",
        supplier: "Razer Store",
        serial_number: "SN-MSE-RDV-006",
        warranty_expiry: new Date("2028-02-28"),
        purchase_date: new Date("2025-08-15"),
        description: "Ultra-lightweight ergonomic wired mouse for competitive gameplay.",
        image_url:
          "https://images.unsplash.com/photo-1613141411244-0e4ac259d217?auto=format&fit=crop&w=500&q=80",
      },
      {
        name: 'Dell UltraSharp 27" 4K Monitor',
        brand: "Dell",
        model: "U2723QE",
        category: "Output Device",
        price: 499.99,
        quantity: 12,
        status: "Available",
        location: "Lab Room 101",
        supplier: "Dell Business",
        serial_number: "SN-MON-DU4-007",
        warranty_expiry: new Date("2030-06-15"),
        purchase_date: new Date("2025-06-10"),
        description:
          "27-inch 4K USB-C hub monitor with IPS Black technology and 98% DCI-P3 color gamut.",
        image_url:
          "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=500&q=80",
      },
      {
        name: 'LG UltraFine 5K 27" Display',
        brand: "LG",
        model: "27MD5KL-B",
        category: "Output Device",
        price: 1299.99,
        quantity: 5,
        status: "Available",
        location: "Lab Room 104",
        supplier: "LG Electronics",
        serial_number: "SN-MON-LGU-008",
        warranty_expiry: new Date("2029-09-01"),
        purchase_date: new Date("2025-09-01"),
        description: "27-inch 5K IPS monitor optimized for macOS with Thunderbolt 3 compatibility.",
        image_url:
          "https://images.unsplash.com/photo-1547082299-de196ea013d6?auto=format&fit=crop&w=500&q=80",
      },
      {
        name: "ASUS ROG Swift 360Hz Monitor",
        brand: "ASUS",
        model: "PG259QN",
        category: "Output Device",
        price: 379.99,
        quantity: 8,
        status: "Available",
        location: "Lab Room 103",
        supplier: "ASUS Direct",
        serial_number: "SN-MON-ARG-009",
        warranty_expiry: new Date("2028-11-20"),
        purchase_date: new Date("2025-11-15"),
        description: "24.5-inch FHD Fast IPS gaming monitor with 360Hz refresh rate and G-SYNC.",
        image_url:
          "https://images.unsplash.com/photo-1585790050230-5ad28404ccb9?auto=format&fit=crop&w=500&q=80",
      },
      {
        name: "Sony WH-1000XM4 Noise Canceling Headset",
        brand: "Sony",
        model: "WH-1000XM4",
        category: "Accessories",
        price: 348.0,
        quantity: 15,
        status: "Available",
        location: "Lab Room 101",
        supplier: "Sony Store",
        serial_number: "SN-AUD-SXM-010",
        warranty_expiry: new Date("2027-12-31"),
        purchase_date: new Date("2025-06-20"),
        description: "Premium over-ear noise-canceling wireless headphones with built-in mic.",
        image_url:
          "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&q=80",
      },
      {
        name: "Bose QuietComfort Headphones",
        brand: "Bose",
        model: "QC45",
        category: "Accessories",
        price: 329.0,
        quantity: 10,
        status: "Available",
        location: "Lab Room 102",
        supplier: "Bose Corp",
        serial_number: "SN-AUD-BQC-011",
        warranty_expiry: new Date("2028-08-01"),
        purchase_date: new Date("2025-08-05"),
        description: "Wireless noise-canceling headphones with legendary acoustic performance.",
        image_url:
          "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=500&q=80",
      },
      {
        name: "Shure SM7B Vocal Microphone",
        brand: "Shure",
        model: "SM7B",
        category: "Input Device",
        price: 399.0,
        quantity: 8,
        status: "Available",
        location: "Lab Room 105",
        supplier: "Shure Music",
        serial_number: "SN-AUD-SSM-012",
        warranty_expiry: new Date("2029-04-15"),
        purchase_date: new Date("2025-04-10"),
        description: "Dynamic cardioid studio microphone for broadcast, podcast, and recording.",
        image_url:
          "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=500&q=80",
      },
      {
        name: "Elgato Facecam 1080p Webcam",
        brand: "Elgato",
        model: "Facecam",
        category: "Input Device",
        price: 149.99,
        quantity: 18,
        status: "Available",
        location: "Lab Room 101",
        supplier: "Elgato Direct",
        serial_number: "SN-VID-EFC-013",
        warranty_expiry: new Date("2027-12-01"),
        purchase_date: new Date("2025-11-20"),
        description: "Pro-grade webcam with studio-quality glass lens and high-speed CMOS sensor.",
        image_url:
          "https://images.unsplash.com/photo-1603184017968-9ee23a4f89d9?auto=format&fit=crop&w=500&q=80",
      },
      {
        name: "Anker PowerExpand 8-in-1 USB Hub",
        brand: "Anker",
        model: "A8383",
        category: "Accessories",
        price: 79.99,
        quantity: 25,
        status: "Available",
        location: "Lab Room 101",
        supplier: "Anker Store",
        serial_number: "SN-ACC-APH-014",
        warranty_expiry: new Date("2027-06-30"),
        purchase_date: new Date("2025-06-25"),
        description: "USB-C data hub with Power Delivery, HDMI, Ethernet, and SD card readers.",
        image_url:
          "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=500&q=80",
      },
      {
        name: "SanDisk Extreme Portable SSD 1TB",
        brand: "SanDisk",
        model: "Extreme 1TB",
        category: "Storage",
        price: 109.99,
        quantity: 35,
        status: "Available",
        location: "Lab Room 102",
        supplier: "SanDisk Dist",
        serial_number: "SN-STG-SDE-015",
        warranty_expiry: new Date("2028-09-01"),
        purchase_date: new Date("2025-09-05"),
        description:
          "Rugged high-speed external solid state drive with up to 1050MB/s read speeds.",
        image_url:
          "https://images.unsplash.com/photo-1618424181497-157f25b6ddd5?auto=format&fit=crop&w=500&q=80",
      },
      {
        name: "Google Nest Audio Smart Speaker",
        brand: "Google",
        model: "Nest Audio",
        category: "Output Device",
        price: 99.0,
        quantity: 15,
        status: "Available",
        location: "Lab Room 106",
        supplier: "Google Store",
        serial_number: "SN-AUD-GNA-016",
        warranty_expiry: new Date("2027-07-15"),
        purchase_date: new Date("2025-07-10"),
        description: "Smart speaker with room-filling sound and Google Assistant integration.",
        image_url:
          "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=500&q=80",
      },
    ];

    const devices = SEED_DEVICES.map((d) => ({
      ...d,
      _id: crypto.randomUUID(),
    }));
    const createdDevices = await DeviceModel.insertMany(devices);

    // Seed orders & order items spread over the last 6 months
    const now = new Date();
    const ordersToInsert: any[] = [];
    const orderItemsToInsert: any[] = [];

    // Create 60 orders
    for (let i = 0; i < 60; i++) {
      const customer = customers[i % customers.length];

      // Distribute dates over the last 6 months (increasing volume in recent months)
      let monthOffset = 0;
      if (i < 5) monthOffset = 5;
      else if (i < 12) monthOffset = 4;
      else if (i < 21) monthOffset = 3;
      else if (i < 32) monthOffset = 2;
      else if (i < 46) monthOffset = 1;
      else monthOffset = 0;

      const orderDate = new Date();
      orderDate.setMonth(now.getMonth() - monthOffset);
      orderDate.setDate(Math.floor(Math.random() * 28) + 1);
      orderDate.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));

      let status = "Delivered";
      const rand = Math.random();
      if (rand < 0.08) status = "Pending";
      else if (rand < 0.15) status = "Confirmed";
      else if (rand < 0.25) status = "Processing";
      else if (rand < 0.35) status = "Shipped";
      else if (rand < 0.9) status = "Delivered";
      else status = "Cancelled";

      const orderId = crypto.randomUUID();
      const datePrefix = `${orderDate.getFullYear()}${(orderDate.getMonth() + 1).toString().padStart(2, "0")}${orderDate.getDate().toString().padStart(2, "0")}`;
      const orderNumber = `ORD-${datePrefix}-${Math.floor(1000 + Math.random() * 9000)}`;

      // Select 1 to 3 random devices
      const itemsCount = Math.floor(Math.random() * 3) + 1;
      const selectedDevs: any[] = [];
      const usedIds = new Set<string>();

      while (selectedDevs.length < itemsCount) {
        const dev = createdDevices[Math.floor(Math.random() * createdDevices.length)];
        if (!usedIds.has(dev._id)) {
          usedIds.add(dev._id);
          selectedDevs.push(dev);
        }
      }

      let orderTotal = 0;
      for (const dev of selectedDevs) {
        const qty = Math.floor(Math.random() * 2) + 1;
        const price = Number(dev.price);
        orderTotal += price * qty;

        orderItemsToInsert.push({
          _id: crypto.randomUUID(),
          order_id: orderId,
          device_id: dev._id,
          device_name: dev.name,
          unit_price: price,
          quantity: qty,
          created_at: orderDate,
        });
      }

      ordersToInsert.push({
        _id: orderId,
        order_number: orderNumber,
        customer_name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        city: customer.city,
        postal_code: customer.postal_code,
        notes: Math.random() > 0.75 ? "Please drop at Lab 202 main office." : null,
        total: orderTotal,
        status,
        created_at: orderDate,
        updated_at: orderDate,
      });
    }

    await OrderModel.insertMany(ordersToInsert);
    await OrderItemModel.insertMany(orderItemsToInsert);

    // Seed audit logs
    const auditLogs = [
      {
        action: "Database Seeded",
        details: "Cleared inventory database and populated clean mock dataset",
        created_at: new Date(),
      },
      {
        action: "Staff Created",
        details: "Created staff account for Michael Chen",
        created_at: new Date(Date.now() - 3600000),
      },
      {
        action: "Staff Created",
        details: "Created staff account for Sarah Jenkins",
        created_at: new Date(Date.now() - 7200000),
      },
      {
        action: "Device Added",
        details: "Added Elgato Facecam 1080p Webcam to Lab Room 101",
        created_at: new Date(Date.now() - 10800000),
      },
      {
        action: "Device Added",
        details: "Added Shure SM7B Vocal Microphone to Lab Room 105",
        created_at: new Date(Date.now() - 14400000),
      },
    ];
    await AuditLogModel.insertMany(auditLogs.map((l) => ({ ...l, _id: crypto.randomUUID() })));

    return {
      success: true,
      orderCount: ordersToInsert.length,
      itemCount: orderItemsToInsert.length,
    };
  } catch (err: any) {
    console.error("Seeding error:", err);
    return { success: false, error: err.message };
  }
});

// 6. Clear all orders server function
export const clearAllOrdersServer = createServerFn({ method: "POST" }).handler(async () => {
  await connectDB();
  try {
    await OrderModel.deleteMany({});
    await OrderItemModel.deleteMany({});
    await AuditLogModel.deleteMany({});
    return { success: true };
  } catch (err: any) {
    console.error("Clear orders error:", err);
    return { success: false, error: err.message };
  }
});

// 7. Get reviews & likes counts for a product
export const fetchProductReviewsAndLikes = createServerFn({ method: "POST" })
  .validator(
    z.object({
      device_id: z.string(),
      user_id: z.string().nullable().optional(),
    }),
  )
  .handler(async ({ data }) => {
    await connectDB();
    const { device_id, user_id } = data;
    try {
      // Fetch reviews
      const reviews = await ReviewModel.find({ device_id }).sort({ created_at: -1 });

      let averageRating = 0;
      if (reviews.length > 0) {
        const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
        averageRating = Number((sum / reviews.length).toFixed(1));
      }

      // Fetch like/dislike counts
      const likesCount = await LikeDislikeModel.countDocuments({ device_id, type: "like" });
      const dislikesCount = await LikeDislikeModel.countDocuments({ device_id, type: "dislike" });

      // Fetch active user's status
      let userStatus: "like" | "dislike" | null = null;
      if (user_id) {
        const doc = await LikeDislikeModel.findOne({ device_id, user_id });
        if (doc) {
          userStatus = doc.type as "like" | "dislike";
        }
      }

      return {
        reviews: reviews.map((r) => ({
          id: r._id,
          device_id: r.device_id,
          user_id: r.user_id,
          user_name: r.user_name,
          rating: r.rating,
          comment: r.comment,
          created_at: r.created_at,
        })),
        averageRating,
        totalReviews: reviews.length,
        likesCount,
        dislikesCount,
        userStatus,
      };
    } catch (err: any) {
      console.error("Error in fetchProductReviewsAndLikes:", err);
      return {
        reviews: [],
        averageRating: 0,
        totalReviews: 0,
        likesCount: 0,
        dislikesCount: 0,
        userStatus: null,
        error: err.message,
      };
    }
  });

// 8. Add a review/comment for a product (Auth required)
export const addProductReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    z.object({
      device_id: z.string(),
      rating: z.number().min(1).max(5),
      comment: z.string(),
    }),
  )
  .handler(async ({ data, context }) => {
    await connectDB();
    const { device_id, rating, comment } = data;
    const { userId } = context;

    try {
      const user = await UserModel.findById(userId);
      const userName = user?.name || "Customer";

      const review = await ReviewModel.create({
        _id: crypto.randomUUID(),
        device_id,
        user_id: userId,
        user_name: userName,
        rating,
        comment,
        created_at: new Date(),
      });

      // Audit Log
      await AuditLogModel.create({
        _id: crypto.randomUUID(),
        action: "Review Added",
        details: `User ${userName} reviewed device ${device_id} with ${rating} stars`,
        user_id: userId,
        created_at: new Date(),
      });

      return {
        success: true,
        review: {
          id: review._id,
          device_id: review.device_id,
          user_id: review.user_id,
          user_name: review.user_name,
          rating: review.rating,
          comment: review.comment,
          created_at: review.created_at,
        },
      };
    } catch (err: any) {
      console.error("Error in addProductReview:", err);
      return { success: false, error: err.message };
    }
  });

// 9. Toggle like/dislike for a product (Auth required)
export const toggleLikeDislike = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    z.object({
      device_id: z.string(),
      type: z.enum(["like", "dislike"]),
    }),
  )
  .handler(async ({ data, context }) => {
    await connectDB();
    const { device_id, type } = data;
    const { userId } = context;

    try {
      const existing = await LikeDislikeModel.findOne({ device_id, user_id: userId });

      if (existing) {
        if (existing.type === type) {
          // Toggle off
          await LikeDislikeModel.deleteOne({ _id: existing._id });
        } else {
          // Switch type
          existing.type = type;
          existing.created_at = new Date();
          await existing.save();
        }
      } else {
        // Create new
        await LikeDislikeModel.create({
          _id: crypto.randomUUID(),
          device_id,
          user_id: userId,
          type,
          created_at: new Date(),
        });
      }

      // Fetch updated counts
      const likesCount = await LikeDislikeModel.countDocuments({ device_id, type: "like" });
      const dislikesCount = await LikeDislikeModel.countDocuments({ device_id, type: "dislike" });

      const updated = await LikeDislikeModel.findOne({ device_id, user_id: userId });
      const userStatus = updated ? updated.type : null;

      return {
        success: true,
        likesCount,
        dislikesCount,
        userStatus,
      };
    } catch (err: any) {
      console.error("Error in toggleLikeDislike:", err);
      return { success: false, error: err.message };
    }
  });

// =========================================================
// PUBLIC CHATBOT ORDER - No authentication required
// Allows guests to place COD orders via the chatbot interface
// =========================================================
export const placeChatbotOrder = createServerFn({ method: "POST" })
  .validator(
    z.object({
      customer_name: z.string().trim().min(2).max(80),
      email: z.string().trim().email().max(255),
      phone: z.string().trim().min(6).max(20),
      address: z.string().trim().min(5).max(255),
      city: z.string().trim().min(2).max(80),
      postal_code: z.string().trim().max(20).optional().or(z.literal("")),
      notes: z.string().trim().max(500).optional().or(z.literal("")),
      items: z
        .array(
          z.object({
            device_id: z.string().optional(),
            device_name: z.string(),
            unit_price: z.number(),
            quantity: z.number().min(1),
          }),
        )
        .min(1),
      total: z.number().positive(),
    }),
  )
  .handler(async ({ data }) => {
    await connectDB();
    const orderId = crypto.randomUUID();
    const t = Date.now().toString(36).toUpperCase();
    const r = Math.random().toString(36).slice(2, 6).toUpperCase();
    const orderNumber = `LAB-${t}-${r}`;

    try {
      // Create the order
      await OrderModel.create({
        _id: orderId,
        order_number: orderNumber,
        customer_name: data.customer_name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
        postal_code: data.postal_code || null,
        notes: data.notes ? `${data.notes} [via chatbot]` : "[via chatbot]",
        total: data.total,
        status: "Pending",
        created_at: new Date(),
        updated_at: new Date(),
      });

      // Create order items
      const lineItems = data.items.map((item) => ({
        _id: crypto.randomUUID(),
        order_id: orderId,
        device_id: item.device_id || null,
        device_name: item.device_name,
        unit_price: item.unit_price,
        quantity: item.quantity,
        created_at: new Date(),
      }));

      await OrderItemModel.insertMany(lineItems);

      return { success: true, orderNumber };
    } catch (err: any) {
      console.error("Error placing chatbot order:", err);
      return { success: false, error: err.message };
    }
  });
