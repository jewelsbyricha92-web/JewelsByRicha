/**
 * The secret that signs login cookies, OTP codes and guest-order tokens.
 * In production a missing / short SESSION_SECRET is a hard error at request time (never a silent public default,
 * which would let anyone forge an admin session). The check is skipped only while `next build` collects pages.
 */
const DEV_ONLY = "dev-only-session-secret-change-me-32chars!!";

export function getSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 32) return s;
  if (process.env.NODE_ENV === "production" && process.env.NEXT_PHASE !== "phase-production-build") {
    throw new Error("SESSION_SECRET must be set to a random string of at least 32 characters in production.");
  }
  return DEV_ONLY;
}
