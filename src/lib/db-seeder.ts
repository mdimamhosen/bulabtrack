import { seedFakeOrders, clearOrders } from "@/lib/api/orders.functions";

export async function generateFakeOrdersAndCustomers() {
  return seedFakeOrders({});
}

export async function clearAllOrders() {
  return clearOrders({});
}
