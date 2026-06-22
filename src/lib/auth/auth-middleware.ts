import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { fetchUserRole, getUserFromToken } from "@/lib/db/auth.server";
import type { AppRole } from "@/lib/db/types";

function extractToken(request: Request | undefined): string | null {
  const authHeader = request?.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice("Bearer ".length) || null;
}

export const requireAuth = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const request = getRequest();
  const token = extractToken(request);
  if (!token) throw new Error("Unauthorized");

  const user = await getUserFromToken(token);
  if (!user) throw new Error("Unauthorized");

  const role = await fetchUserRole(user.id);
  return next({ context: { user, userId: user.id, role } });
});

export const requireStaff = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const request = getRequest();
  const token = extractToken(request);
  if (!token) throw new Error("Unauthorized");

  const user = await getUserFromToken(token);
  if (!user) throw new Error("Unauthorized");

  const role = await fetchUserRole(user.id);
  if (role !== "admin" && role !== "staff") {
    throw new Error("Forbidden");
  }

  return next({ context: { user, userId: user.id, role } });
});

export const requireAdmin = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const request = getRequest();
  const token = extractToken(request);
  if (!token) throw new Error("Unauthorized");

  const user = await getUserFromToken(token);
  if (!user) throw new Error("Unauthorized");

  const role = await fetchUserRole(user.id);
  if (role !== "admin") throw new Error("Forbidden");

  return next({ context: { user, userId: user.id, role: role as AppRole } });
});

export const optionalAuth = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const request = getRequest();
  const token = extractToken(request);
  if (!token) return next({ context: { user: null, userId: null as string | null, role: null } });

  const user = await getUserFromToken(token);
  if (!user) return next({ context: { user: null, userId: null as string | null, role: null } });

  const role = await fetchUserRole(user.id);
  return next({ context: { user, userId: user.id, role } });
});
