import crypto from "crypto";
import { getSecret } from "./secret";
import prisma from "@/lib/db";

export type OtpPurpose = "register" | "reset";
const TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

const secret = () => getSecret();
const hash = (key: string, otp: string) => crypto.createHmac("sha256", secret()).update(`${key}:${otp}`).digest("hex");
const same = (a: string, b: string) => a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));

/** Creates (and replaces) the code for email+purpose. `data` carries the pending registration. */
export async function createOtp(email: string, purpose: OtpPurpose, data?: Record<string, unknown>) {
  const otp = String(crypto.randomInt(100000, 1000000));
  const key = `${email}:${purpose}`;
  const expiresAt = new Date(Date.now() + TTL_MS);
  await prisma.verificationCode.upsert({
    where: { key },
    update: { codeHash: hash(key, otp), attempts: 0, expiresAt, data: (data as object) ?? undefined },
    create: { key, codeHash: hash(key, otp), attempts: 0, expiresAt, data: (data as object) ?? undefined },
  });
  prisma.verificationCode.deleteMany({ where: { expiresAt: { lt: new Date() } } }).catch(() => {});
  return otp;
}

/** Checks the code; it is consumed on success and burned after too many wrong guesses. */
export async function checkOtp<T = Record<string, unknown>>(email: string, purpose: OtpPurpose, otp: string): Promise<{ data: T | null } | null> {
  const key = `${email}:${purpose}`;
  const row = await prisma.verificationCode.findUnique({ where: { key } });
  if (!row || row.expiresAt < new Date()) {
    if (row) await prisma.verificationCode.delete({ where: { key } }).catch(() => {});
    return null;
  }
  const updated = await prisma.verificationCode.update({ where: { key }, data: { attempts: { increment: 1 } } });
  if (updated.attempts > MAX_ATTEMPTS) {
    await prisma.verificationCode.delete({ where: { key } }).catch(() => {});
    return null;
  }
  if (!same(row.codeHash, hash(key, otp))) return null;
  const del = await prisma.verificationCode.deleteMany({ where: { key } });
  if (del.count === 0) return null;
  return { data: (row.data as T) ?? null };
}
