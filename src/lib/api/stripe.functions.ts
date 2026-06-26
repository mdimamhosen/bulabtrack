import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import Stripe from "stripe";
import { connectDB, OrderModel } from "../db.server";

export const createStripeCheckoutSession = createServerFn({ method: "POST" })
  .validator(
    z.object({
      orderNumber: z.string(),
      total: z.number(),
      customerName: z.string(),
      email: z.string(),
      phone: z.string(),
      address: z.string(),
      city: z.string(),
      postalCode: z.string().optional(),
      items: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          price: z.number(),
          quantity: z.number(),
        })
      ),
      origin: z.string(),
    })
  )
  .handler(async ({ data }) => {
    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecret) {
      throw new Error("STRIPE_SECRET_KEY is not configured on the server");
    }

    const stripe = new Stripe(stripeSecret, {
      apiVersion: "2025-02-24.accredited" as any,
    });

    const lineItems = data.items.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name,
          metadata: {
            productId: item.id,
          },
        },
        unit_amount: Math.round(item.price * 100), // convert to cents
      },
      quantity: item.quantity,
    }));

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      customer_email: data.email,
      metadata: {
        orderNumber: data.orderNumber,
        customerName: data.customerName,
        phone: data.phone,
        address: data.address,
        city: data.city,
        postalCode: data.postalCode || "",
      },
      success_url: `${data.origin}/order-success/${data.orderNumber}?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${data.origin}/checkout`,
    });

    return { url: session.url };
  });

export const confirmStripeOrder = createServerFn({ method: "POST" })
  .validator(
    z.object({
      orderNumber: z.string(),
      sessionId: z.string(),
    })
  )
  .handler(async ({ data }) => {
    await connectDB();
    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecret) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }

    const stripe = new Stripe(stripeSecret, {
      apiVersion: "2025-02-24.accredited" as any,
    });

    try {
      const session = await stripe.checkout.sessions.retrieve(data.sessionId);
      if (session.payment_status === "paid" || session.status === "complete") {
        await OrderModel.updateOne(
          { order_number: data.orderNumber },
          { $set: { status: "Confirmed", updated_at: new Date() } }
        );
        return { success: true };
      }
      return { success: false, error: "Payment not completed" };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });
