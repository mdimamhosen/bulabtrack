import { z } from "zod";

export const deviceSchema = z.object({
  name: z.string().trim().min(1, "Name required").max(120),
  brand: z.string().trim().min(1, "Brand required").max(80),
  model: z.string().trim().min(1, "Model required").max(80),
  category: z.string().trim().min(1, "Category required").max(80),
  price: z.coerce.number().min(0, "Price cannot be negative"),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  interface: z.string().trim().min(1, "Interface required").max(40),
  status: z.enum(["Available", "In Use", "Under Maintenance", "Damaged", "Disposed"]),
  supplier: z.string().trim().max(120).optional().or(z.literal("")),
  purchase_date: z.string().optional().or(z.literal("")),
  warranty_expiry: z.string().optional().or(z.literal("")),
  location: z.string().trim().max(120).optional().or(z.literal("")),
  serial_number: z.string().trim().min(1, "Serial required").max(80),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  image_url: z
    .string()
    .trim()
    .max(2048, "Image URL is too long")
    .optional()
    .or(z.literal(""))
    .refine(
      (val) => !val || /^https?:\/\//.test(val),
      "Image URL must start with http:// or https://",
    ),
});

export type DeviceForm = z.infer<typeof deviceSchema>;

export const INTERFACES = [
  "USB",
  "Bluetooth",
  "HDMI",
  "PS/2",
  "Ethernet",
  "Wireless",
  "VGA",
  "DisplayPort",
  "Audio Jack",
];
export const STATUSES = [
  "Available",
  "In Use",
  "Under Maintenance",
  "Damaged",
  "Disposed",
] as const;
export const CATEGORIES = ["Input Device", "Output Device"] as const;
