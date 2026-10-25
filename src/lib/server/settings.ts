import prisma from "@/lib/db";
import type { StoreSettings } from "@/types/shop";

export const DEFAULT_SETTINGS: StoreSettings = {
  freeShippingThreshold: 999,
  shippingFee: 79,
  contactEmail: "jewelsbyricha92@gmail.com",
  contactPhone: "+91 97110 57258",
  businessHours: "Monday to Saturday, 10:00 a.m. to 6:00 p.m.",
  instagram: "jewels_by_richa",
  lowStockThreshold: 5,
};

export async function getSettings(): Promise<StoreSettings> {
  try {
    const row = await prisma.siteSettings.findUnique({ where: { key: "store" } });
    return { ...DEFAULT_SETTINGS, ...((row?.value as Partial<StoreSettings> | null) ?? {}) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(next: StoreSettings) {
  try {
    await prisma.siteSettings.upsert({ where: { key: "store" }, update: { value: next as object }, create: { key: "store", value: next as object } });
  } catch {
    // fallback if DB not configured
  }
  return next;
}
