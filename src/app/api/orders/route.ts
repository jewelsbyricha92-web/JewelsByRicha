import { ApiError, body, clientIp, handle, ok, rateLimit } from "@/lib/server/api";
import { createOrder, createOrderSchema, expireUnpaidOrders } from "@/lib/server/orders";
import { getCustomer } from "@/lib/server/session";
import { orderToken, validEmailProof } from "@/lib/server/tokens";

/**
 * Places an order. Prices, stock, coupon and totals are all computed on the server from the database;
 * the browser only sends product ids and quantities.
 * The order email must be verified: a signed-in customer's account email already is (sign-up needs an emailed OTP);
 * a guest has to confirm the address with a one-time code at checkout and send the proof it gets back.
 */
export const POST = handle(async (req: Request) => {
  const { email: guestEmail, emailToken, ...input } = await body(req, createOrderSchema);
  await rateLimit(`order:${clientIp(req)}`, 15, 10 * 60);

  const me = await getCustomer();
  let email: string;
  if (me) {
    email = me.email;
  } else {
    if (!guestEmail || !validEmailProof(guestEmail, emailToken)) throw new ApiError(403, "Please verify your email address to place the order.");
    email = guestEmail;
  }

  void expireUnpaidOrders().catch(() => {});
  const order = await createOrder({ ...input, email }, me?.id ?? null);
  return ok({ order, token: orderToken(order.id, order.email) }, { status: 201 });
});
