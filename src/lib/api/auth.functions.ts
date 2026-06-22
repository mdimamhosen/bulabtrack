import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  assignStaffRoleByAdmin,
  createUserWithProfile,
  deleteUserByAdmin,
  fetchUserRole,
  getProfile,
  getUserFromToken,
  loginUser,
  updateUserEmail,
  updateUserPassword,
} from "@/lib/db/auth.server";
import { requireAdmin, requireAuth } from "@/lib/auth/auth-middleware";
import { getRequest } from "@tanstack/react-start/server";

function extractToken(): string | null {
  const request = getRequest();
  const authHeader = request?.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice("Bearer ".length) || null;
}

export const signIn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ email: z.string().email(), password: z.string().min(6) }))
  .handler(async ({ data }) => loginUser(data.email, data.password));

export const signUp = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      name: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(8),
      phone: z.string().optional().nullable(),
    }),
  )
  .handler(async ({ data }) =>
    createUserWithProfile({
      email: data.email,
      password: data.password,
      name: data.name,
      phone: data.phone,
    }),
  );

export const getAuthUser = createServerFn({ method: "GET" }).handler(async () => {
  const token = extractToken();
  if (!token) return { user: null, role: null, profile: null };
  const user = await getUserFromToken(token);
  if (!user) return { user: null, role: null, profile: null };
  const [role, profile] = await Promise.all([fetchUserRole(user.id), getProfile(user.id)]);
  return { user, role, profile };
});

export const signOut = createServerFn({ method: "POST" }).handler(async () => ({ ok: true }));

export const updatePassword = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator(z.object({ password: z.string().min(6) }))
  .handler(async ({ data, context }) => {
    await updateUserPassword(context.userId, data.password);
    return { ok: true };
  });

export const changeEmail = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator(z.object({ email: z.string().email() }))
  .handler(async ({ data, context }) => {
    await updateUserEmail(context.userId, data.email);
    return { ok: true };
  });

export const requestPasswordReset = createServerFn({ method: "POST" })
  .inputValidator(z.object({ email: z.string().email() }))
  .handler(async () => ({
    ok: true,
    message: "If an account exists, a reset link would be sent. Email is not configured for local MongoDB mode.",
  }));

export const createStaffAccount = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator(
    z.object({
      name: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(8),
    }),
  )
  .handler(async ({ data, context }) => {
    const session = await createUserWithProfile({
      email: data.email,
      password: data.password,
      name: data.name,
      needsPasswordChange: true,
    });
    await assignStaffRoleByAdmin(session.user.id, data.name);
    return { userId: session.user.id };
  });

export const adminDeleteUser = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator(z.object({ targetUserId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    if (data.targetUserId === context.userId) throw new Error("Cannot delete your own account");
    await deleteUserByAdmin(data.targetUserId);
    return { ok: true };
  });

export const adminAssignStaffRole = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator(
    z.object({
      targetUserId: z.string().uuid(),
      staffName: z.string().min(2),
    }),
  )
  .handler(async ({ data }) => {
    await assignStaffRoleByAdmin(data.targetUserId, data.staffName);
    return { ok: true };
  });

export const getUserRole = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => ({ role: context.role }));
