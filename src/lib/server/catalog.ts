import prisma from "@/lib/db";
import type { CatalogData, Product } from "@/types/shop";
import { DEFAULT_SETTINGS, getSettings } from "./settings";
import { toCategory, toCollection, toProduct } from "./mappers";
import { COLLECTIONS, CATEGORIES } from "../../../prisma/seed-data/catalog";
import { PRODUCTS } from "../../../prisma/seed-data/products";

/** Upper bound for the storefront catalogue payload (listing cards only need a lean subset of each product). */
const MAX_LISTED_PRODUCTS = 1000;

/**
 * Everything the public storefront needs to render: live products only, in a LEAN form (long text fields are left out;
 * the product page loads the full record itself). Keeps the HTML small as the catalogue grows.
 */
export async function getCatalogData(): Promise<CatalogData> {
  try {
    const [collections, categories, products, settings] = await Promise.all([
      prisma.collection.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.category.findMany({ orderBy: [{ collectionId: "asc" }, { sortOrder: "asc" }] }),
      prisma.product.findMany({ where: { status: "ACTIVE" }, include: { images: { orderBy: { sortOrder: "asc" }, take: 3 } }, orderBy: { createdAt: "desc" }, take: MAX_LISTED_PRODUCTS }),
      getSettings(),
    ]);
    return {
      collections: collections.map(toCollection),
      categories: categories.map(toCategory),
      products: products.map((p) => ({ ...toProduct(p), description: "", material: "", careInstructions: "", features: p.features.slice(0, 4) })),
      settings,
    };
  } catch (err) {
    console.warn("Notice: Database unavailable, serving bundled catalogue data.", err);
    return {
      collections: COLLECTIONS,
      categories: CATEGORIES,
      products: PRODUCTS.map((p) => ({ ...p, description: "", material: "", careInstructions: "", features: p.features.slice(0, 4) })),
      settings: DEFAULT_SETTINGS,
    };
  }
}

/** Find an active product by its URL slug. The bundled seed list is used ONLY if the database can't be reached (never for products that were deleted or unpublished). */
export async function findProductBySlug(slug: string): Promise<Product | null> {
  try {
    const p = await prisma.product.findFirst({ where: { slug, status: "ACTIVE" }, include: { images: true } });
    return p ? toProduct(p) : null;
  } catch {
    return PRODUCTS.find((p) => p.slug === slug && p.status === "ACTIVE") ?? null;
  }
}
