import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Customer / admin facing name of a stored payment method (older orders may still say UPI, CARD or COD). */
export function paymentLabel(method: string) {
  return ({ ONLINE: "Online payment", UPI: "UPI", CARD: "Card", COD: "Cash on delivery" } as Record<string, string>)[method] ?? method;
}

export function formatPrice(n: number) {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function discountPct(price: number, original?: number) {
  if (!original || original <= price) return 0;
  return Math.round(((original - price) / original) * 100);
}
