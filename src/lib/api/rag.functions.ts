import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "../../integrations/supabase/auth-middleware";
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
  .middleware([requireSupabaseAuth])
  .validator(
    z.object({
      message: z.string().min(1),
      chatHistory: z.array(ChatMessageSchema),
      clientApiKey: z.string().optional(),
    })
  )
  .handler(async ({ data, context }) => {
    await connectDB();
    const userId = context.userId;

    // 1. Fetch current user from MongoDB to check role and email
    const dbUser = await UserModel.findById(userId);
    if (!dbUser) {
      return {
        success: false,
        error: "Authenticated user not found in the database.",
      };
    }

    const userEmail = dbUser.email;
    const userRole = dbUser.role || "customer"; // "admin" | "staff" | "customer"
    const userName = dbUser.name;

    // 2. Determine Gemini API Key and Model
    const serverApiKey = process.env.GEMINI_API_KEY;
    const apiKey = serverApiKey || data.clientApiKey;
    const geminiModel = process.env.GEMINI_MODEL || "gemini-1.5-flash";

    if (!apiKey) {
      return {
        success: false,
        error: "Gemini API Key is missing. Please set GEMINI_API_KEY in your .env or configure it in the AI Settings.",
        noApiKey: true,
      };
    }

    // 3. RAG Retrieval phase
    // Retrieve device catalog (available to all roles)
    const devices = await DeviceModel.find({});
    
    // Retrieve reviews (available to all roles to answer details about feedback)
    const reviews = await ReviewModel.find({});

    let orders: any[] = [];
    let orderItems: any[] = [];
    let auditLogs: any[] = [];

    // Role-based retrieval logic
    if (userRole === "admin" || userRole === "staff") {
      // Admins and staff can view all orders
      orders = await OrderModel.find({}).sort({ created_at: -1 }).limit(50);
      
      // Retrieve order items matching these orders
      const orderIds = orders.map((o) => o._id);
      orderItems = await OrderItemModel.find({ order_id: { $in: orderIds } });

      if (userRole === "admin") {
        // Admins can also see system audit logs
        auditLogs = await AuditLogModel.find({}).sort({ created_at: -1 }).limit(20);
      }
    } else {
      // Customers can ONLY see their own orders
      orders = await OrderModel.find({ email: userEmail }).sort({ created_at: -1 });
      const orderIds = orders.map((o) => o._id);
      orderItems = await OrderItemModel.find({ order_id: { $in: orderIds } });
    }

    // 4. Construct RAG Context string
    const contextLines: string[] = [];

    contextLines.push("=== SYSTEM DATE ===");
    contextLines.push(`Current Time: ${new Date().toISOString()}`);
    contextLines.push("");

    contextLines.push("=== USER PROFILE ===");
    contextLines.push(`Name: ${userName}`);
    contextLines.push(`Email: ${userEmail}`);
    contextLines.push(`Role: ${userRole}`);
    contextLines.push("");

    contextLines.push("=== INVENTORY DEVICES ===");
    if (devices.length === 0) {
      contextLines.push("No devices found in inventory.");
    } else {
      devices.forEach((d) => {
        contextLines.push(
          `- Name: ${d.name} | Brand: ${d.brand} | Model: ${d.model} | Category: ${d.category} | Price: $${d.price} | Stock Qty: ${d.quantity} | Status: ${d.status} | Location: ${d.location || "N/A"} | Supplier: ${d.supplier || "N/A"} | Serial: ${d.serial_number}`
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
          `- Device: ${deviceName} | Rated by: ${r.user_name} | Rating: ${r.rating}/5 stars | Comment: "${r.comment}"`
        );
      });
    }
    contextLines.push("");

    contextLines.push("=== ORDERS ===");
    if (orders.length === 0) {
      contextLines.push(userRole === "customer" ? "You have not placed any orders." : "No orders found in database.");
    } else {
      orders.forEach((o) => {
        const items = orderItems
          .filter((item) => item.order_id === o._id)
          .map((item) => `${item.device_name} (Qty: ${item.quantity} @ $${item.unit_price}/ea)`)
          .join(", ");
        contextLines.push(
          `- Order #: ${o.order_number} | Customer: ${o.customer_name} (${o.email}) | Total: $${o.total} | Status: ${o.status} | Placed: ${o.created_at?.toISOString() || "N/A"} | Items: [${items}]`
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
            `- Action: ${log.action} | Details: ${log.details || "N/A"} | Date: ${log.created_at?.toISOString() || "N/A"}`
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

Provide answers in clear, modern markdown format. Use bullet points, bolding, and tables where appropriate to present information beautifully.`;

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
        }
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

      return {
        success: true,
        answer: generatedText,
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
  });
