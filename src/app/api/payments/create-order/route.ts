import { z } from "zod";
import prisma from "@/lib/db";
import { ApiError, body, clientIp, handle, ok, rateLimit } from "@/lib/server/api";
import { getRazorpay, razorpayConfigured } from "@/lib/server/razorpay";
import { getCustomer } from "@/lib/server/session";
import { validOrderToken } from "@/lib/server/tokens";

const schema = z.object({ orderNumber: z.string().min(3).max(30), token: z.string().max(100).optional() });

/**
 * Starts payment for an online order. With Razorpay keys configured this creates a Razorpay order for the browser
 * checkout; without keys (local development only) it answers `mode: "mock"` so the flow can be tested end to end.
 */
export const POST = handle(async (req: Request) => {
  const { orderNumber, token } = await body(req, schema);
  await rateLimit(`pay:${clientIp(req)}`, 20, 10 * 60);

  const order = await prisma.order.findUnique({ where: { number: orderNumber } });
  const me = await getCustomer();
  if (!order || !((me && order.userId === me.id) || validOrderToken(order.number, order.email, token))) throw new ApiError(404, "Order not found");
  if (order.status === "CANCELLED") throw new ApiError(400, "This order was cancelled. Please place a new order.");
  if (order.paymentStatus === "PAID") throw new ApiError(400, "This order is already paid.");

  if (!razorpayConfigured()) {
    if (process.env.NODE_ENV === "production") throw new ApiError(503, "Online payments are not available right now.");
    return ok({ mode: "mock" as const, amount: order.total });
  }

  const rz = await getRazorpay().orders.create({ amount: order.total * 100, currency: "INR", receipt: order.number, notes: { order: order.number } });
  await prisma.payment.upsert({
    where: { providerOrderId: rz.id },
    update: {},
    create: { orderId: order.id, providerOrderId: rz.id, amount: order.total, status: "PENDING" },
  });
  return ok({ mode: "razorpay" as const, keyId: process.env.RAZORPAY_KEY_ID, razorpayOrderId: rz.id, amount: order.total * 100, name: order.customerName, email: order.email, phone: order.phone });
});
