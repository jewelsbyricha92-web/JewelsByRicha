import { z } from "zod";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db";
import { ApiError, body, clientIp, emailSchema, handle, ok, phoneSchema, rateLimit } from "@/lib/server/api";
import { checkOtp } from "@/lib/server/otp";
import { backfillAddresses } from "@/lib/server/orders";
import { customerSession } from "@/lib/server/session";
import { emailProof } from "@/lib/server/tokens";

const schema = z.object({
  email: emailSchema,
  otp: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code"),
  // what the customer has typed on the checkout form so far — used only if we have to create their account
  name: z.string().trim().max(80).optional(),
  phone: phoneSchema.optional().or(z.literal("")),
});

/**
 * Checks the checkout code. Proving ownership of the email is the same as signing in with a one-time code, so the customer
 * is signed in too (an account is created for a first-time email, with a random password they can reset any time).
 * Also hands back a short-lived proof that /api/orders accepts for this email.
 */
export const POST = handle(async (req: Request) => {
  const { email, otp, name, phone } = await body(req, schema);
  await rateLimit(`checkout-verify:ip:${clientIp(req)}`, 20, 15 * 60);

  const res = await checkOtp(email, "checkout", otp);
  if (!res) throw new ApiError(400, "That code is incorrect or has expired. Please request a new one.");

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const passwordHash = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10);
    user = await prisma.user.create({
      data: { name: name && name.length >= 2 ? name : email.split("@")[0], email, phone: phone || null, passwordHash, lastLoginAt: new Date() },
    });
    await prisma.order.updateMany({ where: { email, userId: null }, data: { userId: user.id } });
  } else if (user.role === "CUSTOMER") {
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  }

  let signedIn: { id: string; name: string; email: string; phone?: string } | null = null;
  if (user.role === "CUSTOMER") {
    const s = await customerSession();
    s.userId = user.id;
    s.role = "CUSTOMER";
    await s.save();
    await backfillAddresses(user.id);
    signedIn = { id: user.id, name: user.name, email: user.email, phone: user.phone ?? undefined };
  }
  return ok({ token: emailProof(email), user: signedIn });
});
