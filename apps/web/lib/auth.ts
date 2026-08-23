import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { AUTH_CONFIG } from "@internship-copilot/config";

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  isAdmin?: boolean;
}

// Master Admin Emails
export const ADMIN_EMAILS = ["sanjeev1803t@gmail.com"];

export function isAdminUser(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase().trim());
}

const JWT_SECRET = process.env.EXTENSION_JWT_SECRET || "ihateform_secure_jwt_secret_token_2026";
export const AUTH_COOKIE_NAME = "ihateform_session";

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function createSessionToken(user: SessionUser): string {
  const isAdmin = isAdminUser(user.email);
  const payload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    isAdmin,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
  };

  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = Buffer.from(`${header}.${body}.${JWT_SECRET}`).toString("base64url").substring(0, 32);

  return `${header}.${body}.${signature}`;
}

export function createExtensionToken(userId: string): { accessToken: string; expiresIn: number; refreshToken: string } {
  const expiresIn = AUTH_CONFIG.EXTENSION_TOKEN_EXPIRY_SECONDS;
  const payload = {
    sub: userId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + expiresIn,
  };

  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = Buffer.from(`${header}.${body}.${JWT_SECRET}`).toString("base64url").substring(0, 32);

  return {
    accessToken: `${header}.${body}.${signature}`,
    expiresIn,
    refreshToken: `ref_${Date.now()}_${Math.random().toString(36).substring(2)}`,
  };
}

export function decodeSessionToken(token: string): SessionUser | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  try {
    const payloadJson = Buffer.from(parts[1], "base64url").toString("utf-8");
    const payload = JSON.parse(payloadJson);

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name || null,
      isAdmin: isAdminUser(payload.email),
    };
  } catch {
    return null;
  }
}

export async function getAuthenticatedUser(req: NextRequest): Promise<SessionUser | null> {
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const decoded = decodeSessionToken(token);
    if (decoded) return decoded;
  }

  const cookie = req.cookies.get(AUTH_COOKIE_NAME);
  if (cookie && cookie.value) {
    const decoded = decodeSessionToken(cookie.value);
    if (decoded) return decoded;
  }

  return null;
}
