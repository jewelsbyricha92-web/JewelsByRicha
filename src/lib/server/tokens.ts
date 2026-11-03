import crypto from "crypto";
import { getSecret } from "./secret";

const secret = () => getSecret();

/** Unguessable token that lets a guest (no account) look at / pay for the order they just placed. */
export function orderToken(number: string, email: string) {
  return crypto.createHmac("sha256", secret()).update(`order:${number}:${email.toLowerCase()}`).digest("hex").slice(0, 32);
}

const PROOF_TTL_MS = 30 * 60 * 1000;
const proofSig = (email: string, exp: number) => crypto.createHmac("sha256", secret()).update(`email-proof:${email.toLowerCase()}:${exp}`).digest("hex");

/** Short-lived proof that a guest confirmed ownership of `email` with a one-time code at checkout. */
export function emailProof(email: string) {
  const exp = Date.now() + PROOF_TTL_MS;
  return `${exp}.${proofSig(email, exp)}`;
}

export function validEmailProof(email: string, token: string | null | undefined) {
  if (!token) return false;
  const [expRaw, sig] = token.split(".");
  const exp = Number(expRaw);
  if (!sig || !Number.isFinite(exp) || exp < Date.now()) return false;
  const a = Buffer.from(proofSig(email, exp));
  const b = Buffer.from(sig);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function validOrderToken(number: string, email: string, token: string | null | undefined) {
  if (!token) return false;
  const a = Buffer.from(orderToken(number, email));
  const b = Buffer.from(token);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
