import { z } from "zod";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/db";
import { computeTotals } from "@/lib/pricing";
import type { Order, OrderStatus } from "@/types/shop";
import { ApiError, emailSchema, phoneSchema } from "./api";
import { consumeCoupon, validateCouponCode } from "./coupons";
import { sendOrderCancelled, sendOrderConfirmation, sendOrderShipped } from "./email";
import { toOrder } from "./mappers";
import { getSettings } from "./settings";

type Tx = Prisma.TransactionClient;

export const addressSchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: phoneSchema,
  line: z.string().trim().min(5).max(200),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  pincode: z.string().trim().regex(/^[1-9][0-9]{5}$/, "Enter a valid 6-digit PIN code"),
});

export const addressInputSchema = addressSchema.extend({ isDefault: z.boolean().optional() });

export const createOrderSchema = z.object({
  lines: z.array(z.object({ productId: z.string().min(1).max(64), quantity: z.number().int().min(1).max(10) })).min(1).max(30),
  email: emailSchema,
  address: addressSchema,
  paymentMethod: z.enum(["UPI", "CARD", "COD"]),
  couponCode: z.string().trim().max(40).optional().or(z.literal("")),
});
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

const include = { items: true } as const;

/** Prices the cart from the database, takes stock + coupon, and creates the order — all in one transaction. */
export async function createOrder(input: CreateOrderInput, userId: string | null): Promise<Order> {
  const settings = await getSettings();
  if (input.paymentMethod === "COD" && !settings.codEnabled) throw new ApiError(400, "Cash on Delivery is not available right now.");

  const merged = new Map<string, number>();
  for (const l of input.lines) merged.set(l.productId, (merged.get(l.productId) ?? 0) + l.quantity);

  const created = await prisma.$transaction(
    async (tx) => {
      const ids = [...merged.keys()];
      const products = await tx.product.findMany({ where: { id: { in: ids }, status: "ACTIVE" }, include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } } });
      if (products.length !== ids.length) throw new ApiError(409, "Some items in your bag are no longer available. Please review your bag.");

      for (const p of products) {
        const qty = merged.get(p.id)!;
        const r = await tx.product.updateMany({ where: { id: p.id, stock: { gte: qty } }, data: { stock: { decrement: qty } } });
        if (r.count === 0) throw new ApiError(409, p.stock > 0 ? `Only ${p.stock} of “${p.name}” left in stock.` : `“${p.name}” just sold out.`);
      }

      const subtotal = products.reduce((s, p) => s + p.price * merged.get(p.id)!, 0);

      let discount = 0;
      let couponId: string | null = null;
      let couponCode: string | null = null;
      if (input.couponCode) {
        const v = await validateCouponCode(tx, input.couponCode, subtotal, input.paymentMethod, { email: input.email, userId });
        if (!(await consumeCoupon(tx, v.coupon.id))) throw new ApiError(400, "This coupon has been fully redeemed");
        discount = v.discount;
        couponId = v.coupon.id;
        couponCode = v.coupon.code;
      }

      const totals = computeTotals(subtotal, discount, input.paymentMethod, settings);
      const counter = await tx.counter.upsert({ where: { key: "order" }, update: { value: { increment: 1 } }, create: { key: "order", value: 1001 } });

      const order = await tx.order.create({
        data: {
          number: `JBR-${counter.value}`,
          userId,
          customerName: input.address.name,
          email: input.email,
          phone: input.address.phone,
          shippingAddress: input.address,
          subtotal: totals.subtotal,
          discount: totals.discount,
          shipping: totals.shipping,
          codFee: totals.codFee,
          total: totals.total,
          couponCode,
          paymentMethod: input.paymentMethod,
          items: { create: products.map((p) => ({ productId: p.id, name: p.name, image: p.images[0]?.url ?? null, price: p.price, quantity: merged.get(p.id)! })) },
        },
        include,
      });
      if (couponId) await tx.couponUsage.create({ data: { couponId, orderId: order.id, email: input.email } });
      return order;
    },
    { timeout: 20000 },
  );

  const order = toOrder(created);
  // Cash on Delivery has nothing more to wait for; online orders are confirmed when the payment lands.
  if (order.paymentMethod === "COD") void sendOrderConfirmation(order);
  return order;
}

/** Gives stock (and the coupon use) back for an order that is being cancelled. Idempotent. */
async function restoreOrder(tx: Tx, orderId: string) {
  const o = await tx.order.findUnique({ where: { id: orderId }, include: { items: true, coupon: true } });
  if (!o || o.stockRestored) return;
  for (const i of o.items) if (i.productId) await tx.product.updateMany({ where: { id: i.productId }, data: { stock: { increment: i.quantity } } });
  if (o.coupon) {
    await tx.$executeRaw`UPDATE public."Coupon" SET "usedCount" = GREATEST("usedCount" - 1, 0) WHERE "id" = ${o.coupon.couponId}`;
    await tx.couponUsage.delete({ where: { id: o.coupon.id } });
  }
  await tx.order.update({ where: { id: orderId }, data: { stockRestored: true } });
}

/** Cancels an order: restocks, frees the coupon, and flags the payment (PAID -> REFUNDED means "refund owed"). */
export async function cancelOrder(number: string): Promise<Order> {
  const updated = await prisma.$transaction(async (tx) => {
    const o = await tx.order.findUnique({ where: { number } });
    if (!o) throw new ApiError(404, "Order not found");
    if (o.status === "CANCELLED") return tx.order.findUniqueOrThrow({ where: { id: o.id }, include });
    if (o.status === "SHIPPED" || o.status === "DELIVERED") throw new ApiError(400, "This order has already been shipped and can't be cancelled.");
    await restoreOrder(tx, o.id);
    return tx.order.update({
      where: { id: o.id },
      data: { status: "CANCELLED", paymentStatus: o.paymentStatus === "PAID" ? "REFUNDED" : o.paymentMethod === "COD" ? o.paymentStatus : "FAILED" },
      include,
    });
  });
  const order = toOrder(updated);
  void sendOrderCancelled(order);
  return order;
}

/** Admin: change status and/or tracking number. */
export async function adminUpdateOrder(number: string, patch: { status?: OrderStatus; trackingNumber?: string | null }): Promise<Order> {
  const current = await prisma.order.findUnique({ where: { number } });
  if (!current) throw new ApiError(404, "Order not found");

  if (patch.status === "CANCELLED" && current.status !== "CANCELLED") return cancelOrder(number);
  if (current.status === "CANCELLED" && patch.status && patch.status !== "CANCELLED") throw new ApiError(400, "A cancelled order can't be reopened. Ask the customer to place a new order.");

  const data: Prisma.OrderUpdateInput = {};
  if (patch.status) {
    data.status = patch.status;
    if (patch.status === "DELIVERED" && current.paymentMethod === "COD") data.paymentStatus = "PAID"; // cash collected
  }
  if (patch.trackingNumber !== undefined) data.trackingNumber = patch.trackingNumber?.trim() || null;

  const updated = await prisma.order.update({ where: { id: current.id }, data, include });
  const order = toOrder(updated);
  if (patch.status === "SHIPPED" && current.status !== "SHIPPED") void sendOrderShipped(order);
  return order;
}

/** Marks an online order paid (idempotent). Used by payment verification and the Razorpay webhook. */
export async function markOrderPaid(orderId: string, payment: { providerOrderId?: string | null; providerPaymentId: string; method?: string | null }) {
  const result = await prisma.$transaction(async (tx) => {
    const o = await tx.order.findUnique({ where: { id: orderId } });
    if (!o) throw new ApiError(404, "Order not found");
    if (o.paymentStatus === "PAID") return { order: await tx.order.findUniqueOrThrow({ where: { id: orderId }, include }), changed: false };

    const existing = payment.providerOrderId ? await tx.payment.findUnique({ where: { providerOrderId: payment.providerOrderId } }) : null;
    if (existing) await tx.payment.update({ where: { id: existing.id }, data: { status: "PAID", providerPaymentId: payment.providerPaymentId, method: payment.method ?? null } });
    else await tx.payment.create({ data: { orderId, providerOrderId: payment.providerOrderId ?? null, providerPaymentId: payment.providerPaymentId, amount: o.total, status: "PAID", method: payment.method ?? null } });

    // If the order was auto-cancelled while the customer was paying, flag it clearly: money received, refund or reinstate manually.
    const status = o.status === "PENDING" ? "CONFIRMED" : o.status;
    const order = await tx.order.update({ where: { id: orderId }, data: { paymentStatus: "PAID", status }, include });
    return { order, changed: true };
  });
  const order = toOrder(result.order);
  if (result.changed && order.status !== "CANCELLED") void sendOrderConfirmation(order);
  return order;
}

/** Cancels online orders that were never paid within an hour, so reserved stock is not locked forever. */
export async function expireUnpaidOrders() {
  const cutoff = new Date(Date.now() - 60 * 60 * 1000);
  const stale = await prisma.order.findMany({ where: { paymentMethod: { not: "COD" }, paymentStatus: { in: ["PENDING", "FAILED"] }, status: "PENDING", createdAt: { lt: cutoff } }, select: { number: true } });
  for (const s of stale) {
    try {
      await cancelOrder(s.number);
    } catch (e) {
      console.error("[expire]", s.number, e);
    }
  }
  return stale.length;
}
