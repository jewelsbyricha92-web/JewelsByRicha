import { NextResponse } from "next/server";
import { z, type ZodType } from "zod";
import prisma from "@/lib/db";
import { getAdmin, getCustomer } from "./session";

export class ApiError extends Error {
  constructor(public status: number, message: string, public extra?: Record<string, unknown>) {
    super(message);
  }
}

export const ok = <T>(data: T, init?: ResponseInit) => NextResponse.json(data, init);

/** Wraps a route handler: turns thrown ApiErrors / validation errors into JSON responses and hides internals. */
export function handle<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      // Blanket protection: every write (POST/PUT/PATCH/DELETE) is limited per IP, on top of each route's own stricter limits.
      const req = args[0];
      if (req instanceof Request && req.method !== "GET" && req.method !== "HEAD") await rateLimit(`mutations:${clientIp(req)}`, 240, 60);
      return await fn(...args);
    } catch (e) {
      if (e instanceof ApiError) return NextResponse.json({ error: e.message, ...e.extra }, { status: e.status });
      console.error("[api]", e);
      return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
    }
  };
}

export async function body<T>(req: Request, schema: ZodType<T>): Promise<T> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    throw new ApiError(400, "Invalid request body");
  }
  const r = schema.safeParse(json);
  if (!r.success) {
    const first = r.error.issues[0];
    throw new ApiError(400, first ? `${first.path.join(".") || "Request"}: ${first.message}` : "Invalid request");
  }
  return r.data;
}

export async function requireAdmin() {
  const a = await getAdmin();
  if (!a) throw new ApiError(401, "Unauthorized");
  return a;
}

export async function requireCustomer() {
  const c = await getCustomer();
  if (!c) throw new ApiError(401, "Please sign in");
  return c;
}

export function clientIp(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
}

/** Fixed-window rate limit stored in the database (works across serverless instances). */
export async function rateLimit(key: string, limit: number, windowSec: number) {
  try {
    const now = new Date();
    const expireAt = new Date(now.getTime() + windowSec * 1000);
    const row = await prisma.rateLimit.upsert({ where: { key }, update: { points: { increment: 1 } }, create: { key, points: 1, expireAt } });
    if (row.expireAt < now) {
      await prisma.rateLimit.update({ where: { key }, data: { points: 1, expireAt } });
      return;
    }
    if (row.points > limit) throw new ApiError(429, "Too many attempts. Please wait a few minutes and try again.");
    // opportunistic cleanup
    if (Math.random() < 0.02) prisma.rateLimit.deleteMany({ where: { expireAt: { lt: now } } }).catch(() => {});
  } catch (e) {
    if (e instanceof ApiError) throw e;
    // Database offline or not configured - ignore rate limiting gracefully
  }
}

export const idSchema = z.string().min(1).max(64);
export const emailSchema = z.string().trim().toLowerCase().email().max(160);
export const phoneSchema = z.string().trim().min(7).max(20).regex(/^[0-9+\-\s()]+$/, "Enter a valid phone number");
