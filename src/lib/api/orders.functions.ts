import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getDb, newId, nowIso } from "@/lib/db/mongodb.server";
import { logAudit } from "@/lib/db/audit.server";
import { optionalAuth, requireAuth, requireStaff } from "@/lib/auth/auth-middleware";
import type { Order, OrderItem, OrderStatus } from "@/lib/db/types";

const orderInsertSchema = z.object({
  id: z.string().uuid().optional(),
  customer_name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(6),
  address: z.string().min(5),
  city: z.string().min(2),
  postal_code: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  order_number: z.string().min(1),
  total: z.number(),
  status: z
    .enum(["Pending", "Confirmed", "Processing", "Shipped", "Delivered", "Cancelled"])
    .optional(),
});

const lineItemSchema = z.object({
  order_id: z.string().uuid(),
  device_id: z.string().uuid().nullable().optional(),
  device_name: z.string(),
  unit_price: z.number(),
  quantity: z.number().min(1),
});

export const listOrders = createServerFn({ method: "GET" })
  .middleware([optionalAuth])
  .inputValidator(z.object({ email: z.string().email().optional() }).optional())
  .handler(async ({ data, context }) => {
    const db = await getDb();
    const filter: Record<string, unknown> = {};

    if (data?.email) {
      filter.email = data.email;
    } else if (context.role !== "admin" && context.role !== "staff" && context.user?.email) {
      filter.email = context.user.email;
    }

    return db.collection<Order>("orders").find(filter).sort({ created_at: -1 }).toArray();
  });

export const getOrderItems = createServerFn({ method: "GET" })
  .middleware([optionalAuth])
  .inputValidator(z.object({ orderId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const db = await getDb();
    return db.collection<OrderItem>("order_items").find({ order_id: data.orderId }).toArray();
  });

export const createOrder = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      order: orderInsertSchema,
      items: z.array(lineItemSchema.omit({ order_id: true })),
    }),
  )
  .handler(async ({ data }) => {
    const db = await getDb();
    const orderId = data.order.id ?? newId();
    const timestamp = nowIso();

    const order: Order = {
      id: orderId,
      customer_name: data.order.customer_name,
      email: data.order.email.trim().toLowerCase(),
      phone: data.order.phone,
      address: data.order.address,
      city: data.order.city,
      postal_code: data.order.postal_code ?? null,
      notes: data.order.notes ?? null,
      order_number: data.order.order_number,
      total: data.order.total,
      status: data.order.status ?? "Pending",
      created_at: timestamp,
      updated_at: timestamp,
    };

    const items: OrderItem[] = data.items.map((item) => ({
      id: newId(),
      order_id: orderId,
      device_id: item.device_id ?? null,
      device_name: item.device_name,
      unit_price: item.unit_price,
      quantity: item.quantity,
      created_at: timestamp,
    }));

    await db.collection<Order>("orders").insertOne(order);
    if (items.length > 0) {
      await db.collection<OrderItem>("order_items").insertMany(items);
    }

    return { order, items };
  });

export const updateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireStaff])
  .inputValidator(
    z.object({
      id: z.string().uuid(),
      status: z.enum(["Pending", "Confirmed", "Processing", "Shipped", "Delivered", "Cancelled"]),
    }),
  )
  .handler(async ({ data, context }) => {
    const db = await getDb();
    await db
      .collection<Order>("orders")
      .updateOne({ id: data.id }, { $set: { status: data.status as OrderStatus, updated_at: nowIso() } });
    await logAudit("order_status_updated", context.userId, `${data.id} -> ${data.status}`);
    return { ok: true };
  });

export const clearOrders = createServerFn({ method: "POST" })
  .middleware([requireStaff])
  .handler(async ({ context }) => {
    const db = await getDb();
    await db.collection<OrderItem>("order_items").deleteMany({});
    await db.collection<Order>("orders").deleteMany({});
    await logAudit("orders_cleared", context.userId, "All orders cleared");
    return { ok: true };
  });

export const seedFakeOrders = createServerFn({ method: "POST" })
  .middleware([requireStaff])
  .handler(async ({ context }) => {
    const db = await getDb();
    const devices = await db.collection("devices").find({}, { projection: { id: 1, name: 1, price: 1 } }).toArray();
    if (devices.length === 0) throw new Error("No devices found in the database. Add some devices first.");

    const FAKE_CUSTOMERS = [
      { name: "John Doe", email: "john.doe@gmail.com", phone: "+1 (555) 019-2834", address: "123 Academic Way", city: "Boston", postal_code: "02115" },
      { name: "Jane Smith", email: "jane.smith@mit.edu", phone: "+1 (555) 043-9821", address: "45 Innovation Blvd", city: "Cambridge", postal_code: "02139" },
      { name: "Alice Johnson", email: "alice.j@stanford.edu", phone: "+1 (555) 087-4321", address: "789 Campus Dr", city: "Stanford", postal_code: "94305" },
      { name: "Bob Brown", email: "bob.brown@berkeley.edu", phone: "+1 (555) 098-1122", address: "101 Euclid Ave", city: "Berkeley", postal_code: "94720" },
      { name: "Charlie Green", email: "c.green@cmu.edu", phone: "+1 (555) 022-8877", address: "5000 Forbes Ave", city: "Pittsburgh", postal_code: "15213" },
      { name: "Diana Prince", email: "diana.prince@harvard.edu", phone: "+1 (555) 055-6677", address: "86 Brattle St", city: "Cambridge", postal_code: "02138" },
      { name: "Evan Wright", email: "evan.wright@yale.edu", phone: "+1 (555) 077-4433", address: "246 Church St", city: "New Haven", postal_code: "06510" },
      { name: "Fiona Gallagher", email: "fiona.g@columbia.edu", phone: "+1 (555) 011-2233", address: "116th St & Broadway", city: "New York", postal_code: "10027" },
      { name: "George Costanza", email: "george@vandelay.com", phone: "+1 (555) 044-5566", address: "84th St & West End Ave", city: "New York", postal_code: "10024" },
      { name: "Hannah Abbott", email: "hannah@hogwarts.edu", phone: "+1 (555) 033-6699", address: "Hufflepuff Basement", city: "Hogsmeade", postal_code: "00777" },
    ];

    const ordersToInsert: Order[] = [];
    const itemsToInsert: OrderItem[] = [];
    const now = new Date();

    for (let i = 0; i < 15; i++) {
      const customer = FAKE_CUSTOMERS[i % FAKE_CUSTOMERS.length];
      const createdDate = new Date();
      createdDate.setDate(now.getDate() - Math.floor(Math.random() * 180));

      let status: OrderStatus = "Delivered";
      const rand = Math.random();
      if (rand < 0.1) status = "Pending";
      else if (rand < 0.25) status = "Confirmed";
      else if (rand < 0.4) status = "Processing";
      else if (rand < 0.55) status = "Shipped";
      else if (rand < 0.9) status = "Delivered";
      else status = "Cancelled";

      const orderId = newId();
      const datePrefix = `${createdDate.getFullYear()}${String(createdDate.getMonth() + 1).padStart(2, "0")}${String(createdDate.getDate()).padStart(2, "0")}`;
      const orderNumber = `ORD-${datePrefix}-${Math.floor(1000 + Math.random() * 9000)}`;
      const timestamp = createdDate.toISOString();

      const numItems = Math.floor(Math.random() * 3) + 1;
      const selectedDevices: typeof devices = [];
      const used = new Set<string>();
      while (selectedDevices.length < numItems) {
        const dev = devices[Math.floor(Math.random() * devices.length)];
        if (!used.has(String(dev.id))) {
          used.add(String(dev.id));
          selectedDevices.push(dev);
        }
      }

      let orderTotal = 0;
      for (const dev of selectedDevices) {
        const quantity = Math.floor(Math.random() * 2) + 1;
        const price = Number(dev.price);
        orderTotal += price * quantity;
        itemsToInsert.push({
          id: newId(),
          order_id: orderId,
          device_id: String(dev.id),
          device_name: String(dev.name),
          unit_price: price,
          quantity,
          created_at: timestamp,
        });
      }

      ordersToInsert.push({
        id: orderId,
        order_number: orderNumber,
        customer_name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        city: customer.city,
        postal_code: customer.postal_code,
        notes: Math.random() > 0.6 ? `Please ship to ${customer.city} academic lab office.` : null,
        total: orderTotal,
        status,
        created_at: timestamp,
        updated_at: timestamp,
      });
    }

    ordersToInsert.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    await db.collection<Order>("orders").insertMany(ordersToInsert);
    await db.collection<OrderItem>("order_items").insertMany(itemsToInsert);
    await logAudit("orders_seeded", context.userId, `Seeded ${ordersToInsert.length} orders`);

    return { orderCount: ordersToInsert.length, itemCount: itemsToInsert.length };
  });

export const getMyOrders = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const db = await getDb();
    return db.collection<Order>("orders").find({ email: context.user.email }).sort({ created_at: -1 }).toArray();
  });
