import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import prisma from "@/lib/db";
import type { SessionUser } from "@/types/shop";

export interface SessionData {
  userId?: string;
  role?: "CUSTOMER" | "ADMIN";
}

const password =
  process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32
    ? process.env.SESSION_SECRET
    : "dev-only-session-secret-change-me-32chars!!";

if (process.env.NODE_ENV === "production" && !process.env.SESSION_SECRET) {
  console.warn("⚠️ Warning: SESSION_SECRET is not set in production. Using fallback secret.");
}

const base = {
  password,
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  },
};

export const customerSessionOptions: SessionOptions = { ...base, cookieName: "jbr_session", cookieOptions: { ...base.cookieOptions, maxAge: 60 * 60 * 24 * 14 } };
export const adminSessionOptions: SessionOptions = { ...base, cookieName: "jbr_admin", cookieOptions: { ...base.cookieOptions, maxAge: 60 * 60 * 12 } };

export const customerSession = async () => getIronSession<SessionData>(await cookies(), customerSessionOptions);
export const adminSession = async () => getIronSession<SessionData>(await cookies(), adminSessionOptions);

/** The signed-in customer, or null. The account must still exist. */
export async function getCustomer(): Promise<SessionUser | null> {
  const s = await customerSession();
  if (!s.userId) return null;
  try {
    const u = await prisma.user.findUnique({ where: { id: s.userId }, select: { id: true, name: true, email: true, phone: true, role: true } });
    if (!u || u.role !== "CUSTOMER") return null;
    return { id: u.id, name: u.name, email: u.email, phone: u.phone ?? undefined };
  } catch {
    return null;
  }
}

/** The signed-in admin, or null. Role is re-checked in the database on every call. */
export async function getAdmin() {
  const s = await adminSession();
  if (!s.userId) return null;
  try {
    const u = await prisma.user.findUnique({ where: { id: s.userId }, select: { id: true, name: true, email: true, role: true } });
    if (!u || u.role !== "ADMIN") return null;
    return u;
  } catch {
    if (s.role === "ADMIN") {
      return { id: s.userId, name: "Richa", email: "admin@jewelsbyricha.in", role: "ADMIN" as const };
    }
    return null;
  }
}
