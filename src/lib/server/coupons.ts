import type { Prisma } from "@prisma/client";
import { couponAmount } from "@/lib/pricing";
import { ApiError } from "./api";

type Tx = Prisma.TransactionClient;

/**
 * Validates a coupon against the order and returns the discount. Throws ApiError(400) with a customer-friendly message.
 * Pass `userId` / `email` so first-order-only and per-customer limits can be enforced.
 */
export async function validateCouponCode(tx: Tx, code: string, subtotal: number, who: { email: string; userId?: string | null }) {
  const coupon = await tx.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });
  const bad = (m: string) => new ApiError(400, m);
  if (!coupon) throw bad("Invalid coupon code");
  if (!coupon.active) throw bad("This coupon is no longer active");
  if (coupon.expiresAt < new Date()) throw bad("This coupon has expired");
  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) throw bad("This coupon has been fully redeemed");
  if (subtotal < coupon.minOrder) throw bad(`Add ₹${coupon.minOrder - subtotal} more to use this coupon`);

  const email = who.email.toLowerCase();
  if (coupon.firstOrderOnly) {
    const prior = await tx.order.count({ where: { status: { not: "CANCELLED" }, OR: [{ email }, ...(who.userId ? [{ userId: who.userId }] : [])] } });
    if (prior > 0) throw bad("This coupon is only valid on your first order");
  }
  if (coupon.perCustomerLimit != null) {
    const used = await tx.couponUsage.count({ where: { couponId: coupon.id, email, order: { status: { not: "CANCELLED" } } } });
    if (used >= coupon.perCustomerLimit) throw bad("You have already used this coupon");
  }
  return { coupon, discount: couponAmount(coupon, subtotal) };
}

/** Atomically takes one use of a coupon; false when the usage limit was reached in the meantime. */
export async function consumeCoupon(tx: Tx, couponId: string) {
  const n = await tx.$executeRaw`UPDATE public."Coupon" SET "usedCount" = "usedCount" + 1 WHERE "id" = ${couponId} AND ("usageLimit" IS NULL OR "usedCount" < "usageLimit")`;
  return n === 1;
}
