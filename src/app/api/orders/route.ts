import { body, clientIp, handle, ok, rateLimit, requireCustomer } from "@/lib/server/api";
import { createOrder, createOrderSchema, expireUnpaidOrders } from "@/lib/server/orders";
import { orderToken } from "@/lib/server/tokens";

/**
 * Places an order. Prices, stock, coupon and totals are all computed on the server from the database;
 * the browser only sends product ids and quantities.
 * Only signed-in customers can order: accounts are created through an emailed OTP, so the order email is always a verified one.
 */
export const POST = handle(async (req: Request) => {
  const me = await requireCustomer();
  const input = await body(req, createOrderSchema);
  await rateLimit(`order:${clientIp(req)}`, 15, 10 * 60);
  void expireUnpaidOrders().catch(() => {});

  const order = await createOrder({ ...input, email: me.email }, me.id);
  return ok({ order, token: orderToken(order.id, order.email) }, { status: 201 });
});
