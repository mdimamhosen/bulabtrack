import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "bulabtrack_secret_key_123456789";

export const requireSupabaseAuth = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const request = getRequest();

    if (!request?.headers) {
      throw new Error("Unauthorized: No request headers available");
    }

    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
      throw new Error("Unauthorized: No authorization header provided");
    }

    if (!authHeader.startsWith("Bearer ")) {
      throw new Error("Unauthorized: Only Bearer tokens are supported");
    }

    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      throw new Error("Unauthorized: No token provided");
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { sub: string; email: string; role: string }; 
      return next({
        context: {
          userId: decoded.sub,
          claims: decoded,
        },
      });
    } catch (err) {
      throw new Error("Unauthorized: Invalid token");
    }
  }
);
