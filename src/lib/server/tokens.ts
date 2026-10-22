import crypto from "crypto";
import { getSecret } from "./secret";

const secret = () => getSecret();

/** Unguessable token that lets a guest (no account) look at / pay for the order they just placed. */
export function orderToken(number: string, email: string) {
  return crypto.createHmac("sha256", secret()).update(`order:${number}:${email.toLowerCase()}`).digest("hex").slice(0, 32);
}

export function validOrderToken(number: string, email: string, token: string | null | undefined) {
  if (!token) return false;
  const a = Buffer.from(orderToken(number, email));
  const b = Buffer.from(token);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
