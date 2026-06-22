import bcrypt from "bcryptjs";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { getDb, newId, nowIso } from "./mongodb.server";
import type { AppRole, AuthUser, Profile, SessionResponse } from "./types";

const SALT_ROUNDS = 10;

function jwtSecret(): string {
  return process.env.JWT_SECRET ?? "labtrack-local-dev-secret";
}

export function signToken(userId: string, email: string): string {
  return jwt.sign({ sub: userId, email }, jwtSecret(), { expiresIn: "7d" });
}

export function verifyToken(token: string): { sub: string; email: string } {
  const payload = jwt.verify(token, jwtSecret()) as JwtPayload;
  if (!payload.sub) throw new Error("Invalid token");
  return { sub: payload.sub, email: String(payload.email ?? "") };
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

type UserDoc = {
  _id: string;
  email: string;
  password_hash: string;
  email_confirmed_at: string | null;
  created_at: string;
};

function toAuthUser(doc: UserDoc): AuthUser {
  return {
    id: doc._id,
    email: doc.email,
    email_confirmed_at: doc.email_confirmed_at,
  };
}

export async function fetchUserRole(userId: string): Promise<AppRole | null> {
  const db = await getDb();
  const role = await db.collection("user_roles").findOne({ user_id: userId });
  return (role?.role as AppRole | undefined) ?? null;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const db = await getDb();
  const profile = await db.collection<Profile>("profiles").findOne({ id: userId });
  return profile;
}

export async function createUserWithProfile(input: {
  email: string;
  password: string;
  name: string;
  phone?: string | null;
  needsPasswordChange?: boolean;
  assignRole?: AppRole;
}): Promise<SessionResponse> {
  const db = await getDb();
  const email = input.email.trim().toLowerCase();
  const existing = await db.collection("users").findOne({ email });
  if (existing) throw new Error("User already registered");

  const userId = newId();
  const timestamp = nowIso();
  const passwordHash = await hashPassword(input.password);

  const userCount = await db.collection("users").countDocuments();
  const isFirstUser = userCount === 0;

  await db.collection<UserDoc>("users").insertOne({
    _id: userId,
    email,
    password_hash: passwordHash,
    email_confirmed_at: timestamp,
    created_at: timestamp,
  });

  await db.collection<Profile>("profiles").insertOne({
    id: userId,
    name: input.name.trim(),
    email,
    phone: input.phone?.trim() || null,
    status: "active",
    avatar_url: null,
    needs_password_change: input.needsPasswordChange ?? false,
    created_at: timestamp,
  });

  const roleToAssign = input.assignRole ?? (isFirstUser ? "admin" : undefined);
  if (roleToAssign) {
    await db.collection("user_roles").insertOne({
      id: newId(),
      user_id: userId,
      role: roleToAssign,
    });
  }

  const user = { id: userId, email, email_confirmed_at: timestamp };
  return { token: signToken(userId, email), user };
}

export async function loginUser(email: string, password: string): Promise<SessionResponse> {
  const db = await getDb();
  const normalized = email.trim().toLowerCase();
  const user = await db.collection<UserDoc>("users").findOne({ email: normalized });
  if (!user) throw new Error("Invalid login credentials");

  const valid = await comparePassword(password, user.password_hash);
  if (!valid) throw new Error("Invalid login credentials");

  const profile = await getProfile(user._id);
  if (profile?.status === "inactive") {
    throw new Error("Account is deactivated");
  }

  return {
    token: signToken(user._id, user.email),
    user: toAuthUser(user),
  };
}

export async function getUserFromToken(token: string): Promise<AuthUser | null> {
  try {
    const { sub } = verifyToken(token);
    const db = await getDb();
    const user = await db.collection<UserDoc>("users").findOne({ _id: sub });
    return user ? toAuthUser(user) : null;
  } catch {
    return null;
  }
}

export async function updateUserPassword(userId: string, password: string): Promise<void> {
  const db = await getDb();
  const passwordHash = await hashPassword(password);
  await db.collection("users").updateOne({ _id: userId }, { $set: { password_hash: passwordHash } });
}

export async function updateUserEmail(userId: string, email: string): Promise<void> {
  const db = await getDb();
  const normalized = email.trim().toLowerCase();
  const taken = await db.collection("users").findOne({ email: normalized, _id: { $ne: userId } });
  if (taken) throw new Error("Email is already in use");

  await db.collection("users").updateOne({ _id: userId }, { $set: { email: normalized } });
  await db.collection("profiles").updateOne({ id: userId }, { $set: { email: normalized } });
}

export async function deleteUserByAdmin(targetUserId: string): Promise<void> {
  const db = await getDb();
  await db.collection("users").deleteOne({ _id: targetUserId });
  await db.collection("profiles").deleteOne({ id: targetUserId });
  await db.collection("user_roles").deleteMany({ user_id: targetUserId });
}

export async function assignStaffRoleByAdmin(targetUserId: string, staffName: string): Promise<void> {
  const db = await getDb();
  await db.collection("profiles").updateOne(
    { id: targetUserId },
    { $set: { name: staffName.trim(), needs_password_change: true } },
  );

  const existing = await db.collection("user_roles").findOne({ user_id: targetUserId });
  if (existing) {
    await db.collection("user_roles").updateOne({ user_id: targetUserId }, { $set: { role: "staff" } });
  } else {
    await db.collection("user_roles").insertOne({
      id: newId(),
      user_id: targetUserId,
      role: "staff",
    });
  }
}
