import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { optionalSupabaseAuth } from "../../integrations/supabase/auth-middleware";
import {
  connectDB,
  UserModel,
  DeviceModel,
  OrderModel,
  OrderItemModel,
  ReviewModel,
  AuditLogModel,
} from "../db.server";

// Schema for chat messages mapping to Gemini API content format
const ChatMessageSchema = z.object({
  role: z.enum(["user", "model"]),
  parts: z.array(z.object({ text: z.string() })),
});

export const askLabTalk = createServerFn({ method: "POST" })
  .middleware([optionalSupabaseAuth])
  .validator(
    z.object({
      message: z.string().min(1),
      chatHistory: z.array(ChatMessageSchema),
      clientApiKey: z.string().optional(),
      cartItems: z
        .array(
          z.object({
            id: z.string(),
            name: z.string(),
            price: z.number(),
            quantity: z.number(),
          }),
        )
        .optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    const serverApiKey = process.env.GEMINI_API_KEY;
    const apiKey = serverApiKey || data.clientApiKey;
    const geminiModel = process.env.GEMINI_MODEL || "gemini-1.5-flash";

    if (!apiKey) {
      return {
        success: false,
        error:
          "Gemini API Key is missing. Please set GEMINI_API_KEY in your .env or configure it in the AI Settings.",
        noApiKey: true,
      };
    }

    let devices: Awaited<ReturnType<typeof DeviceModel.find>>;
    let reviews: Awaited<ReturnType<typeof ReviewModel.find>>;
    let orders: any[] = [];
    let orderItems: any[] = [];
    let auditLogs: any[] = [];
    let dbUser = null;

    try {
      await connectDB();
      const userId = context?.userId;

      if (userId) {
        dbUser = await UserModel.findById(userId);
      }

      let userEmail = dbUser ? dbUser.email : null;

      if (!userEmail) {
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
        const emailMatch = data.message.match(emailRegex);
        if (emailMatch) {
          userEmail = emailMatch[0].toLowerCase().trim();
        } else if (data.chatHistory && data.chatHistory.length > 0) {
          for (let i = data.chatHistory.length - 1; i >= 0; i--) {
            const hist = data.chatHistory[i];
            if (hist.role === "user" && hist.parts) {
              const text = hist.parts.map((p) => p.text).join(" ");
              const match = text.match(emailRegex);
              if (match) {
                userEmail = match[0].toLowerCase().trim();
                break;
              }
            }
          }
        }
      }

      const userRole = dbUser ? dbUser.role || "customer" : "customer";
      const userName = dbUser ? dbUser.name : "Guest";

      devices = await DeviceModel.find({});
      reviews = await ReviewModel.find({});

      if (userRole === "admin" || userRole === "staff") {
        orders = await OrderModel.find({}).sort({ created_at: -1 }).limit(50);
        const orderIds = orders.map((o) => o._id);
        orderItems = await OrderItemModel.find({ order_id: { $in: orderIds } });

        if (userRole === "admin") {
          auditLogs = await AuditLogModel.find({}).sort({ created_at: -1 }).limit(20);
        }
      } else {
        orders = userEmail
          ? await OrderModel.find({ email: userEmail }).sort({ created_at: -1 })
          : [];
        const orderIds = orders.map((o) => o._id);
        orderItems = await OrderItemModel.find({ order_id: { $in: orderIds } });
      }

      // userName, userEmail, userRole used below — assign to outer scope via block below
      return await generateLabTalkReply({
        data,
        apiKey,
        geminiModel,
        devices,
        reviews,
        orders,
        orderItems,
        auditLogs,
        userName,
        userEmail,
        userRole,
        cartItems: data.cartItems,
      });
    } catch (dbError: any) {
      console.error("LabTalk database error:", dbError);
      const hint = process.env.MONGODB_URI?.includes("mongodb.net")
        ? " If you use MongoDB Atlas, add your current IP under Network Access in the Atlas dashboard."
        : " Check that MongoDB is running and MONGODB_URI is correct.";
      return {
        success: false,
        error: `Could not reach the database: ${dbError.message || "connection failed"}.${hint}`,
      };
    }
  });

async function generateLabTalkReply({
  data,
  apiKey,
  geminiModel,
  devices,
  reviews,
  orders,
  orderItems,
  auditLogs,
  userName,
  userEmail,
  userRole,
  cartItems,
}: {
  data: {
    message: string;
    chatHistory: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }>;
  };
  apiKey: string;
  geminiModel: string;
  devices: any[];
  reviews: any[];
  orders: any[];
  orderItems: any[];
  auditLogs: any[];
  userName: string;
  userEmail: string | null;
  userRole: string;
  cartItems?: Array<{ id: string; name: string; price: number; quantity: number }>;
}) {
    const contextLines: string[] = [];

    contextLines.push("=== SYSTEM DATE ===");
    contextLines.push(`Current Time: ${new Date().toISOString()}`);
    contextLines.push("");

    contextLines.push("=== USER PROFILE ===");
    contextLines.push(`Name: ${userName}`);
    contextLines.push(`Email: ${userEmail}`);
    contextLines.push(`Role: ${userRole}`);
    contextLines.push("");

    contextLines.push("=== USER CURRENT SHOPPING CART ===");
    if (!cartItems || cartItems.length === 0) {
      contextLines.push("User's shopping cart is currently empty.");
    } else {
      cartItems.forEach((i) => {
        contextLines.push(`- ${i.name} (ID: ${i.id}) | Qty: ${i.quantity} | Price: $${i.price}/ea`);
      });
    }
    contextLines.push("");

    contextLines.push("=== INVENTORY DEVICES ===");
    if (devices.length === 0) {
      contextLines.push("No devices found in inventory.");
    } else {
      devices.forEach((d) => {
        contextLines.push(
          `- Name: ${d.name} | Brand: ${d.brand} | Model: ${d.model} | Category: ${d.category} | Price: $${d.price} | Stock Qty: ${d.quantity} | Status: ${d.status} | Location: ${d.location || "N/A"} | Supplier: ${d.supplier || "N/A"} | Serial: ${d.serial_number}`,
        );
      });
    }
    contextLines.push("");

    contextLines.push("=== REVIEWS & RATINGS ===");
    if (reviews.length === 0) {
      contextLines.push("No customer reviews submitted yet.");
    } else {
      reviews.forEach((r) => {
        const device = devices.find((d) => d._id === r.device_id);
        const deviceName = device ? device.name : "Unknown Device";
        contextLines.push(
          `- Device: ${deviceName} | Rated by: ${r.user_name} | Rating: ${r.rating}/5 stars | Comment: "${r.comment}"`,
        );
      });
    }
    contextLines.push("");

    contextLines.push("=== ORDERS ===");
    if (orders.length === 0) {
      contextLines.push(
        userRole === "customer"
          ? "You have not placed any orders."
          : "No orders found in database.",
      );
    } else {
      orders.forEach((o) => {
        const items = orderItems
          .filter((item) => item.order_id === o._id)
          .map((item) => `${item.device_name} (Qty: ${item.quantity} @ $${item.unit_price}/ea)`)
          .join(", ");
        contextLines.push(
          `- Order #: ${o.order_number} | Customer: ${o.customer_name} (${o.email}) | Total: $${o.total} | Status: ${o.status} | Placed: ${o.created_at?.toISOString() || "N/A"} | Items: [${items}]`,
        );
      });
    }
    contextLines.push("");

    if (userRole === "admin") {
      contextLines.push("=== RECENT AUDIT LOGS ===");
      if (auditLogs.length === 0) {
        contextLines.push("No audit logs found.");
      } else {
        auditLogs.forEach((log) => {
          contextLines.push(
            `- Action: ${log.action} | Details: ${log.details || "N/A"} | Date: ${log.created_at?.toISOString() || "N/A"}`,
          );
        });
      }
      contextLines.push("");
    }

    const ragContext = contextLines.join("\n");

    // 5. Setup system instruction
    const systemPrompt = `You are LabTalk, the intelligent AI RAG Assistant for LabTrack Peripheral Inventory Management System.
You help users with inventory audits, order queries, product reviews, and system metrics.

Your primary directive: You MUST answer user questions based on the real-time database context provided.
Do not make up facts. If a device or order is not in the context, state that it was not found in the database.

IMPORTANT ACCESS CONTROL RULES:
- You are chatting with ${userName} (${userEmail}) who has the role: ${userRole}.
- Customers can only see their own orders. Your context contains only the current customer's orders. Never expose other customers' orders.
- Admin and staff can see all orders and administrative data.
- Do not mention the word "RAG", "context text", "provided context", or "JSON database" to the user. Speak naturally as if you have direct access to the database.

Provide answers in clear, modern markdown format. Use bullet points, bolding, and tables where appropriate to present information beautifully.

=== ONLINE ORDERING & CASH ON DELIVERY (COD) ===
- You have direct integration to place Cash on Delivery (COD) orders for the user.
- The user's active cart items are listed under 'USER CURRENT SHOPPING CART'.
- If the user wants to buy, purchase, order, or checkout:
  1. Check if their shopping cart is empty. If it is empty, tell them: "Your cart is empty. Please add items to your cart before checking out."
  2. If they have items, verify if you have all of the following details:
     - Full Name
     - Email Address
     - Phone Number
     - Shipping Address (must include Street and City)
     If any of these details are missing, politely ask the user to provide them (you can ask for multiple missing details or ask for them one-by-one, e.g., "To place your cash on delivery order, please provide your Full Name, Email Address, Phone Number, and Shipping Address.").
  3. Once they have provided all 4 required details:
     - Full Name (name)
     - Email Address (email)
     - Phone Number (phone)
     - Shipping Address (address and city)
     You MUST generate the following exact command tag on a new line at the very end of your response:
     \`[PLACE_ORDER: name=<Name>|email=<Email>|phone=<Phone>|address=<Address>|city=<City>]\`
     - Keep the tag strictly in this format, replacing bracketed text with the actual values. For \`<City>\`, extract or infer the city name from their address. If you can't determine it, use their address or default to 'Online/Other'.
     - Ensure the tag is placed at the very end of your response.
     - Tell the user their Cash on Delivery order is being submitted.`;

    // 6. Build Gemini contents structure
    const apiContents = [...data.chatHistory];

    // Enrich the final user message with the retrieved database context
    const enrichedUserMessage = `Here is the current database state context to answer my question:
---
${ragContext}
---

Question: ${data.message}`;

    apiContents.push({
      role: "user",
      parts: [{ text: enrichedUserMessage }],
    });

    // 7. Make API request to Gemini
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: apiContents,
            systemInstruction: {
              parts: [{ text: systemPrompt }],
            },
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 2048,
            },
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Gemini API Error Response:", errorText);
        return {
          success: false,
          error: `Gemini API returned an error status (${response.status}): ${errorText}`,
        };
      }

      const responseData = await response.json();
      const generatedText = responseData.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!generatedText) {
        console.error("Invalid Gemini API payload structure:", responseData);
        return {
          success: false,
          error: "Failed to parse reply text from Gemini API response.",
        };
      }

      let orderPlacedResult: { success: boolean; orderNumber?: string; error?: string } | null = null;
      let cleanAnswer = generatedText;

      const orderTagRegex = /\[PLACE_ORDER:\s*name=(.*?)\|email=(.*?)\|phone=(.*?)\|address=(.*?)\|city=(.*?)\]/;
      const match = generatedText.match(orderTagRegex);
      if (match) {
        const [_, customerName, email, phone, address, city] = match;

        // Clean up response text by stripping out the backend command tag
        cleanAnswer = generatedText.replace(orderTagRegex, "").trim();

        if (cartItems && cartItems.length > 0) {
          try {
            await connectDB();
            const orderId = crypto.randomUUID();
            const t = Date.now().toString(36).toUpperCase();
            const r = Math.random().toString(36).slice(2, 6).toUpperCase();
            const orderNumber = `LAB-${t}-${r}`;
            const subtotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);

            // Create the order
            await OrderModel.create({
              _id: orderId,
              order_number: orderNumber,
              customer_name: customerName.trim(),
              email: email.trim().toLowerCase(),
              phone: phone.trim(),
              address: address.trim(),
              city: city.trim(),
              postal_code: "",
              notes: "[Placed via AI Assistant]",
              total: subtotal,
              status: "Pending",
              created_at: new Date(),
              updated_at: new Date(),
            });

            // Create order items
            const lineItems = cartItems.map((item) => ({
              _id: crypto.randomUUID(),
              order_id: orderId,
              device_id: item.id || null,
              device_name: item.name,
              unit_price: item.price,
              quantity: item.quantity,
              created_at: new Date(),
            }));

            await OrderItemModel.insertMany(lineItems);

            orderPlacedResult = { success: true, orderNumber };

            // Append order placement success feedback
            cleanAnswer += `\n\n🎉 **Order Placed Successfully!**\nYour order number is **${orderNumber}**. You have chosen **Cash on Delivery**. We will contact you at ${phone.trim()} to confirm shipment details.`;
          } catch (err: any) {
            console.error("Failed to place order from AI chatbot:", err);
            orderPlacedResult = { success: false, error: err.message };
            cleanAnswer += `\n\n❌ **Error placing order**: ${err.message}. Please try again or checkout manually.`;
          }
        } else {
          orderPlacedResult = { success: false, error: "Cart is empty" };
          cleanAnswer += `\n\n❌ **Error placing order**: Your cart is empty. Please add items to your cart first.`;
        }
      }

      return {
        success: true,
        answer: cleanAnswer,
        orderCreated: orderPlacedResult?.success ?? false,
        orderNumber: orderPlacedResult?.orderNumber ?? null,
        stats: {
          devicesCount: devices.length,
          ordersCount: orders.length,
          reviewsCount: reviews.length,
          auditLogsCount: auditLogs.length,
        },
      };
    } catch (e: any) {
      console.error("RAG Gemini fetch exception:", e);
      return {
        success: false,
        error: e.message || "An error occurred while connecting to the Gemini API.",
      };
    }
}
