import type { StoreSettings } from "@/types/shop";

/** Discount in rupees for a coupon on a subtotal (pure; usable on client and server). */
export function couponAmount(c: { type: "PERCENT" | "FLAT"; value: number; maxDiscount?: number | null }, subtotal: number) {
  let d = c.type === "PERCENT" ? Math.round((subtotal * c.value) / 100) : c.value;
  if (c.maxDiscount) d = Math.min(d, c.maxDiscount);
  return Math.max(0, Math.min(d, subtotal));
}

export function computeTotals(subtotal: number, discount: number, s: Pick<StoreSettings, "freeShippingThreshold" | "shippingFee">) {
  const after = subtotal - discount;
  const shipping = subtotal === 0 || after >= s.freeShippingThreshold ? 0 : s.shippingFee;
  return { subtotal, discount, shipping, total: after + shipping };
}
