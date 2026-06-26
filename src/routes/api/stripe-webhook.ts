// @ts-expect-error - vinxi/http doesn't export static types in some local tsconfig contexts
import { defineEventHandler, readRawBody } from "vinxi/http";
import Stripe from "stripe";
import { connectDB, OrderModel } from "@/lib/db.server";

export default defineEventHandler(async (event: any) => {
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecret || !webhookSecret) {
    console.error("Stripe config missing");
    return { error: "Stripe configuration missing on server" };
  }

  const stripe = new Stripe(stripeSecret, {
    apiVersion: "2025-02-24.accredited" as any,
  });

  const headers = event.headers;
  const signature = headers["stripe-signature"];
  if (!signature) {
    event.node.res.statusCode = 400;
    return { error: "Missing stripe-signature header" };
  }

  const rawBody = await readRawBody(event);
  if (!rawBody) {
    event.node.res.statusCode = 400;
    return { error: "Missing request body" };
  }

  let stripeEvent: Stripe.Event;
  try {
    stripeEvent = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    event.node.res.statusCode = 400;
    return { error: `Webhook Error: ${err.message}` };
  }

  // Handle the completed checkout session
  if (stripeEvent.type === "checkout.session.completed") {
    const session = stripeEvent.data.object as Stripe.Checkout.Session;
    const orderNumber = session.metadata?.orderNumber;

    if (orderNumber) {
      await connectDB();
      await OrderModel.updateOne(
        { order_number: orderNumber },
        { $set: { status: "Confirmed", updated_at: new Date() } }
      );
      console.log(`Order ${orderNumber} successfully confirmed via webhook!`);
    }
  }

  return { received: true };
});
