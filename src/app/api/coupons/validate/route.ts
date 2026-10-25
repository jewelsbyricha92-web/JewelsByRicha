import { z } from "zod";
import prisma from "@/lib/db";
import { ApiError, body, clientIp, emailSchema, handle, ok, rateLimit } from "@/lib/server/api";
import { validateCouponCode } from "@/lib/server/coupons";
import { getCustomer } from "@/lib/server/session";

const schema = z.object({
  code: z.string().trim().min(1).max(40),
  lines: z.array(z.object({ productId: z.string().min(1).max(64), quantity: z.number().int().min(1).max(10) })).min(1).max(30),
  email: emailSchema.optional().or(z.literal("")),
});

/** Previews a coupon for the current bag. Authoritative checks run again when the order is placed. */
export const POST = handle(async (req: Request) => {
  const input = await body(req, schema);
  await rateLimit(`coupon:${clientIp(req)}`, 30, 10 * 60);
  const me = await getCustomer();

  const merged = new Map<string, number>();
  for (const l of input.lines) merged.set(l.productId, (merged.get(l.productId) ?? 0) + l.quantity);
  const products = await prisma.product.findMany({ where: { id: { in: [...merged.keys()] }, status: "ACTIVE" }, select: { id: true, price: true } });
  if (products.length === 0) throw new ApiError(400, "Your bag is empty");
  const subtotal = products.reduce((s, p) => s + p.price * (merged.get(p.id) ?? 0), 0);

  const v = await prisma.$transaction((tx) => validateCouponCode(tx, input.code, subtotal, { email: me?.email || input.email || "", userId: me?.id }));
  return ok({ code: v.coupon.code, discount: v.discount, description: v.coupon.description });
});
