import type { Prisma } from "@prisma/client";
import prisma from "@/lib/db";
import { ApiError, body, handle, ok, rateLimit, clientIp, requireAdmin } from "@/lib/server/api";
import { productSchema, slugify } from "@/lib/server/admin-schemas";
import { toProduct } from "@/lib/server/mappers";
import { pageMeta, paging } from "@/lib/server/paging";
import { productData } from "@/lib/server/product-data";
import { getSettings } from "@/lib/server/settings";
import { PRODUCTS } from "../../../../../prisma/seed-data/products";

export const dynamic = "force-dynamic";

/** Paginated product list. Filters: q (name), category, status, stock = out | low | ok. */
export const GET = handle(async (req: Request) => {
  await requireAdmin();
  const { page, pageSize, skip, take, params } = paging(req, 20, 100);
  const settings = await getSettings();
  const q = params.get("q")?.trim();
  const category = params.get("category");
  const status = params.get("status");
  const stock = params.get("stock");

  try {
    const where: Prisma.ProductWhereInput = {
      ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
      ...(category && category !== "all" ? { categoryId: category } : {}),
      ...(status === "ACTIVE" || status === "DRAFT" ? { status } : {}),
      ...(stock === "out" ? { stock: 0 } : stock === "low" ? { stock: { gt: 0, lte: settings.lowStockThreshold } } : stock === "ok" ? { stock: { gt: settings.lowStockThreshold } } : {}),
    };
    const [total, rows] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({ where, include: { images: true }, orderBy: { createdAt: "desc" }, skip, take }),
    ]);
    return ok({ products: rows.map(toProduct), ...pageMeta(page, pageSize, total) });
  } catch (err) {
    console.warn("Notice: Database offline during product fetch, serving bundled products.", err);
    let filtered = [...PRODUCTS];
    if (q) {
      const lower = q.toLowerCase();
      filtered = filtered.filter((p) => p.name.toLowerCase().includes(lower));
    }
    if (category && category !== "all") {
      filtered = filtered.filter((p) => p.categoryId === category);
    }
    const sliced = filtered.slice(skip, skip + take);
    return ok({ products: sliced, ...pageMeta(page, pageSize, filtered.length) });
  }
});

export const POST = handle(async (req: Request) => {
  await requireAdmin();
  await rateLimit(`admin-write:${clientIp(req)}`, 120, 60);
  const input = await body(req, productSchema);
  const category = await prisma.category.findUnique({ where: { id: input.categoryId } });
  if (!category) throw new ApiError(400, "Pick a valid category");
  const slug = input.slug || slugify(input.name);
  if (await prisma.product.findUnique({ where: { slug } })) throw new ApiError(409, "Another product already uses this URL slug");

  const created = await prisma.product.create({
    data: { ...productData(input), slug, collectionId: category.collectionId, images: { create: input.images.map((url, sortOrder) => ({ url, sortOrder })) } },
    include: { images: true },
  });
  return ok({ product: toProduct(created) }, { status: 201 });
});
