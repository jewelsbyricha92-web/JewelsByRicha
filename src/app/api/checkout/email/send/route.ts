import { z } from "zod";
import { body, clientIp, emailSchema, handle, ok, rateLimit } from "@/lib/server/api";
import { createOtp } from "@/lib/server/otp";
import { sendOtpEmail } from "@/lib/server/email";

const schema = z.object({ email: emailSchema });

/** Checkout step: emails a one-time code so a guest can prove the address is theirs before ordering. */
export const POST = handle(async (req: Request) => {
  const { email } = await body(req, schema);
  await rateLimit(`checkout-otp:ip:${clientIp(req)}`, 10, 15 * 60);
  await rateLimit(`checkout-otp:email:${email}`, 4, 15 * 60);

  const otp = await createOtp(email, "checkout");
  await sendOtpEmail(email, otp, "register");

  // Local development only: with no mail server configured the code is returned so the flow can be tested.
  const devOtp = process.env.NODE_ENV !== "production" && !process.env.SMTP_HOST ? otp : undefined;
  return ok({ ok: true, devOtp });
});
