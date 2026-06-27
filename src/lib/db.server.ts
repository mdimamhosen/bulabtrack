import mongoose from "mongoose";
import crypto from "node:crypto";

export async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/bulabtrack";
  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB via Mongoose");
  } catch (error) {
    console.error("Failed to connect to MongoDB", error);
    throw error;
  }
}

// User Profile Schema
const UserSchema = new mongoose.Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar_url: { type: String, default: null },
  needs_password_change: { type: Boolean, default: false },
  has_changed_password: { type: Boolean, default: true },
  phone: { type: String, default: null },
  status: { type: String, default: "active" }, // "active" | "inactive"
  role: { type: String, default: "customer" }, // "admin" | "staff" | "customer"
  created_at: { type: Date, default: Date.now },
});

export const UserModel = mongoose.models.User || mongoose.model("User", UserSchema);

// Device Schema
const DeviceSchema = new mongoose.Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  name: { type: String, required: true },
  brand: { type: String, required: true },
  model: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, default: 0 },
  status: { type: String, default: "Available" },
  location: { type: String, default: null },
  supplier: { type: String, default: null },
  serial_number: { type: String, required: true },
  warranty_expiry: { type: Date, default: null },
  purchase_date: { type: Date, default: null },
  description: { type: String, default: null },
  image_url: { type: String, default: null },
  created_by: { type: String, default: null },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

export const DeviceModel = mongoose.models.Device || mongoose.model("Device", DeviceSchema);

// Order Schema
const OrderSchema = new mongoose.Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  order_number: { type: String, required: true },
  customer_name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  postal_code: { type: String, default: null },
  notes: { type: String, default: null },
  total: { type: Number, required: true },
  status: { type: String, default: "Pending" },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

export const OrderModel = mongoose.models.Order || mongoose.model("Order", OrderSchema);

// Order Item Schema
const OrderItemSchema = new mongoose.Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  order_id: { type: String, required: true },
  device_id: { type: String, default: null },
  device_name: { type: String, required: true },
  unit_price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  created_at: { type: Date, default: Date.now },
});

export const OrderItemModel =
  mongoose.models.OrderItem || mongoose.model("OrderItem", OrderItemSchema);

// Contact Message Schema
const ContactMessageSchema = new mongoose.Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  name: { type: String, required: true },
  email: { type: String, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
});

export const ContactMessageModel =
  mongoose.models.ContactMessage || mongoose.model("ContactMessage", ContactMessageSchema);

// Audit Log Schema
const AuditLogSchema = new mongoose.Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  action: { type: String, required: true },
  details: { type: String, default: null },
  user_id: { type: String, default: null },
  created_at: { type: Date, default: Date.now },
});

export const AuditLogModel = mongoose.models.AuditLog || mongoose.model("AuditLog", AuditLogSchema);

// Review Schema
const ReviewSchema = new mongoose.Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  device_id: { type: String, required: true },
  user_id: { type: String, required: true },
  user_name: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
});

export const ReviewModel = mongoose.models.Review || mongoose.model("Review", ReviewSchema);

// Like/Dislike Interaction Schema
const LikeDislikeSchema = new mongoose.Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  device_id: { type: String, required: true },
  user_id: { type: String, required: true },
  type: { type: String, required: true, enum: ["like", "dislike"] },
  created_at: { type: Date, default: Date.now },
});

export const LikeDislikeModel =
  mongoose.models.LikeDislike || mongoose.model("LikeDislike", LikeDislikeSchema);
