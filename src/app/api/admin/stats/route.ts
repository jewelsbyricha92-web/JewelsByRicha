import prisma from "@/lib/db";
import { handle, ok, requireAdmin } from "@/lib/server/api";
import { toOrder, toProduct } from "@/lib/server/mappers";
import { getSettings } from "@/lib/server/settings";
import { PRODUCTS } from "../../../../../prisma/seed-data/products";

export const dynamic = "force-dynamic";

/** Everything the dashboard shows, aggregated in the database. */
export const GET = handle(async () => {
  await requireAdmin();
  const settings = await getSettings();
  const since = new Date(Date.now() - 30 * 86400000);

  try {
    const [revenue, orderCount, pending, customers, productTotals, daily, topCats, recent, low] = await Promise.all([
      prisma.order.aggregate({ where: { status: { not: "CANCELLED" } }, _sum: { total: true }, _count: { _all: true } }),
      prisma.order.count(),
      prisma.order.count({ where: { status: "PENDING" } }),
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.product.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.$queryRaw<{ day: string; revenue: bigint; orders: bigint }[]>`
        SELECT to_char(("createdAt" AT TIME ZONE 'Asia/Kolkata')::date, 'YYYY-MM-DD') AS day, SUM(total) AS revenue, COUNT(*) AS orders
        FROM public."Order" WHERE status <> 'CANCELLED' AND "createdAt" >= ${since}
        GROUP BY 1 ORDER BY 1`,
      prisma.$queryRaw<{ name: string; value: bigint }[]>`
        SELECT c.name AS name, SUM(oi.price * oi.quantity) AS value
        FROM public."OrderItem" oi
        JOIN public."Order" o ON o.id = oi."orderId"
        JOIN public."Product" p ON p.id = oi."productId"
        JOIN public."Category" c ON c.id = p."categoryId"
        WHERE o.status <> 'CANCELLED' AND o."createdAt" >= ${since}
        GROUP BY c.name ORDER BY value DESC LIMIT 6`,
      prisma.order.findMany({ include: { items: true }, orderBy: { createdAt: "desc" }, take: 6 }),
      prisma.product.findMany({ where: { status: "ACTIVE", stock: { lte: settings.lowStockThreshold } }, include: { images: true }, orderBy: { stock: "asc" }, take: 6 }),
    ]);

    // fill every day of the last 30 so the chart has no gaps
    const byDay = new Map(daily.map((d) => [d.day, d]));
    const days = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(Date.now() - (29 - i) * 86400000);
      const key = new Date(d.getTime() + 5.5 * 3600000).toISOString().slice(0, 10); // IST calendar day
      const hit = byDay.get(key);
      return { key, label: d.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" }), revenue: Number(hit?.revenue ?? 0), orders: Number(hit?.orders ?? 0) };
    });

    const active = productTotals.find((p) => p.status === "ACTIVE")?._count._all ?? 0;
    const drafts = productTotals.find((p) => p.status === "DRAFT")?._count._all ?? 0;
    const paidOrders = revenue._count._all;
    return ok({
      revenue: revenue._sum.total ?? 0,
      avgOrder: paidOrders ? Math.round((revenue._sum.total ?? 0) / paidOrders) : 0,
      orderCount,
      pending,
      customers,
      products: { total: active + drafts, active },
      daily: days,
      topCategories: topCats.map((c) => ({ name: c.name, value: Number(c.value) })),
      recentOrders: recent.map(toOrder),
      lowStock: low.map(toProduct),
    });
  } catch (err) {
    console.warn("Notice: Database offline during admin stats, serving bundled defaults.", err);
    const days = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(Date.now() - (29 - i) * 86400000);
      const key = new Date(d.getTime() + 5.5 * 3600000).toISOString().slice(0, 10);
      return { key, label: d.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" }), revenue: 0, orders: 0 };
    });
    return ok({
      revenue: 0,
      avgOrder: 0,
      orderCount: 0,
      pending: 0,
      customers: 0,
      products: { total: PRODUCTS.length, active: PRODUCTS.length },
      daily: days,
      topCategories: [],
      recentOrders: [],
      lowStock: [],
    });
  }
});
