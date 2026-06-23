import { seedDatabaseServer, clearAllOrdersServer } from "./api/database.functions";

export async function generateFakeOrdersAndCustomers() {
  const res = await seedDatabaseServer();
  if (!res.success) {
    throw new Error(res.error || "Failed to seed database server side");
  }
  return { orderCount: res.orderCount, itemCount: res.itemCount };
}

export async function clearAllOrders() {
  const res = await clearAllOrdersServer();
  if (!res.success) {
    throw new Error(res.error || "Failed to clear order history");
  }
}
