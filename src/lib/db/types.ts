export type AppRole = "admin" | "staff";
export type UserStatus = "active" | "inactive";
export type DeviceCategory = "Input Device" | "Output Device";
export type DeviceStatus =
  | "Available"
  | "In Use"
  | "Under Maintenance"
  | "Damaged"
  | "Disposed";
export type OrderStatus =
  | "Pending"
  | "Confirmed"
  | "Processing"
  | "Shipped"
  | "Delivered"
  | "Cancelled";

export type Profile = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: UserStatus;
  avatar_url: string | null;
  needs_password_change: boolean;
  created_at: string;
};

export type UserRole = {
  id: string;
  user_id: string;
  role: AppRole;
};

export type Device = {
  id: string;
  name: string;
  brand: string;
  model: string;
  category: DeviceCategory;
  price: number;
  quantity: number;
  interface: string;
  status: DeviceStatus;
  serial_number: string;
  image_url: string | null;
  supplier: string | null;
  location: string | null;
  purchase_date: string | null;
  warranty_expiry: string | null;
  description: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type Order = {
  id: string;
  order_number: string;
  customer_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string | null;
  notes: string | null;
  total: number;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  device_id: string | null;
  device_name: string;
  unit_price: number;
  quantity: number;
  created_at: string;
};

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
};

export type AuditLog = {
  id: string;
  action: string;
  user_id: string | null;
  details: string | null;
  created_at: string;
};

export type AuthUser = {
  id: string;
  email: string;
  email_confirmed_at: string | null;
};

export type SessionResponse = {
  token: string;
  user: AuthUser;
};
