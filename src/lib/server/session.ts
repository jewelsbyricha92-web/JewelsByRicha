import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import prisma from "@/lib/db";
import type { SessionUser } from "@/types/shop";
import { getSecret } from "./secret";

export interface SessionData {
  userId?: string;
  role?: "CUSTOMER" | "ADMIN";
}

const options = (cookieName: string, maxAge: number): SessionOptions => ({
  password: getSecret(),
  cookieName,
  cookieOptions: { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge },
});

export const customerSession = async () => getIronSession<SessionData>(await cookies(), options("jbr_session", 60 * 60 * 24 * 14));
export const adminSession = async () => getIronSession<SessionData>(await cookies(), options("jbr_admin", 60 * 60 * 12));

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

/** The signed-in admin, or null. The role is re-checked in the database on every call; if the database can't be reached, access is denied. */
export async function getAdmin() {
  const s = await adminSession();
  if (!s.userId) return null;
  try {
    const u = await prisma.user.findUnique({ where: { id: s.userId }, select: { id: true, name: true, email: true, role: true } });
    if (!u || u.role !== "ADMIN") return null;
    return u;
  } catch {
    return null;
  }
}
