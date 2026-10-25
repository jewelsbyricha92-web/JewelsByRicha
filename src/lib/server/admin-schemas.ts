import { z } from "zod";

const slug = z.string().trim().toLowerCase().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens").max(120);

export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 120);

/** An image is either an uploaded file (/uploads/..., /images/...) or an https URL. */
const imageUrl = z
  .string()
  .trim()
  .max(500)
  .refine((u) => /^https:\/\//.test(u) || /^\/(uploads|images)\//.test(u), "Image must be an https:// URL or an uploaded file");

export const productSchema = z.object({
  name: z.string().trim().min(2).max(140),
  slug: slug.optional().or(z.literal("")),
  categoryId: z.string().min(1),
  price: z.number().int().min(1, "Price must be at least ₹1").max(1_000_000),
  originalPrice: z.number().int().min(1).max(1_000_000).nullable().optional(),
  shortDescription: z.string().trim().max(300).default(""),
  description: z.string().trim().max(5000).default(""),
  material: z.string().trim().max(500).default(""),
  careInstructions: z.string().trim().max(1000).default(""),
  features: z.array(z.string().trim().min(1).max(60)).max(12).default([]),
  images: z.array(imageUrl).max(10).default([]),
  stock: z.number().int().min(0).max(100000),
  status: z.enum(["ACTIVE", "DRAFT"]),
  isFeatured: z.boolean().default(false),
  isBestSeller: z.boolean().default(false),
  isNew: z.boolean().default(false),
});

export const categorySchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: slug.optional().or(z.literal("")),
  collectionId: z.string().min(1),
  description: z.string().trim().max(300).default(""),
  kind: z.enum(["watch", "necklace", "chain-necklace", "bangle", "bracelet", "chain-bracelet", "pendant", "stud", "drop", "hoop", "ring", "mangalsutra", "combo"]),
  sortOrder: z.number().int().min(0).max(999).default(0),
  active: z.boolean().default(true),
  showOnHome: z.boolean().default(false),
});

export const couponSchema = z
  .object({
    code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{3,30}$/, "Code: 3-30 letters / numbers"),
    description: z.string().trim().max(200).default(""),
    type: z.enum(["PERCENT", "FLAT"]),
    value: z.number().int().min(1).max(100000),
    minOrder: z.number().int().min(0).max(1_000_000).default(0),
    maxDiscount: z.number().int().min(1).nullable().optional(),
    usageLimit: z.number().int().min(1).nullable().optional(),
    perCustomerLimit: z.number().int().min(1).nullable().optional(),
    firstOrderOnly: z.boolean().default(false),
    expiresAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date"),
    active: z.boolean().default(true),
  })
  .refine((c) => c.type !== "PERCENT" || c.value <= 100, { message: "Percent must be 100 or less", path: ["value"] });

export const settingsSchema = z.object({
  freeShippingThreshold: z.number().int().min(0).max(1_000_000),
  shippingFee: z.number().int().min(0).max(10_000),
  contactEmail: z.string().trim().email().max(160),
  contactPhone: z.string().trim().min(5).max(30),
  businessHours: z.string().trim().max(160),
  instagram: z.string().trim().max(60).regex(/^[A-Za-z0-9._]*$/, "Instagram handle without @"),
  lowStockThreshold: z.number().int().min(0).max(1000),
});

export const orderPatchSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"]).optional(),
  trackingNumber: z.string().trim().max(60).nullable().optional(),
});
