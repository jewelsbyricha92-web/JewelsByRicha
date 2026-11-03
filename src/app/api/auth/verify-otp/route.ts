import { z } from "zod";
import prisma from "@/lib/db";
import { ApiError, body, clientIp, emailSchema, handle, ok, rateLimit } from "@/lib/server/api";
import { checkOtp } from "@/lib/server/otp";
import { backfillAddresses } from "@/lib/server/orders";
import { customerSession } from "@/lib/server/session";

const schema = z.object({ email: emailSchema, otp: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code") });

export const POST = handle(async (req: Request) => {
  const { email, otp } = await body(req, schema);
  await rateLimit(`otp:ip:${clientIp(req)}`, 20, 15 * 60);

  const res = await checkOtp<{ name: string; phone: string | null; passwordHash: string }>(email, "register", otp);
  if (!res?.data) throw new ApiError(400, "That code is incorrect or has expired. Please request a new one.");
  if (await prisma.user.findUnique({ where: { email } })) throw new ApiError(409, "This email is already registered. Please sign in.");

  const user = await prisma.user.create({ data: { name: res.data.name, email, phone: res.data.phone, passwordHash: res.data.passwordHash, lastLoginAt: new Date() } });
  // attach any guest orders placed earlier with this email
  await prisma.order.updateMany({ where: { email, userId: null }, data: { userId: user.id } });
  await backfillAddresses(user.id);

  const s = await customerSession();
  s.userId = user.id;
  s.role = "CUSTOMER";
  await s.save();
  return ok({ user: { id: user.id, name: user.name, email: user.email, phone: user.phone ?? undefined } });
});
