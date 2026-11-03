import { z } from "zod";
import { ApiError, body, clientIp, emailSchema, handle, ok, rateLimit } from "@/lib/server/api";
import { checkOtp } from "@/lib/server/otp";
import { emailProof } from "@/lib/server/tokens";

const schema = z.object({ email: emailSchema, otp: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code") });

/** Checks the checkout code and hands back a short-lived proof that /api/orders accepts for this email. */
export const POST = handle(async (req: Request) => {
  const { email, otp } = await body(req, schema);
  await rateLimit(`checkout-verify:ip:${clientIp(req)}`, 20, 15 * 60);

  const res = await checkOtp(email, "checkout", otp);
  if (!res) throw new ApiError(400, "That code is incorrect or has expired. Please request a new one.");
  return ok({ token: emailProof(email) });
});
