import type { Prisma } from "@prisma/client";
import prisma from "@/lib/db";
import { handle, ok, requireAdmin } from "@/lib/server/api";
import { pageMeta, paging } from "@/lib/server/paging";
import type { ShippingAddress } from "@/types/shop";

export const dynamic = "force-dynamic";

/** Paginated customers with their order count, total spent and last-known city. Filter: q (name, email, phone). */
export const GET = handle(async (req: Request) => {
  await requireAdmin();
  const { page, pageSize, skip, take, params } = paging(req, 20, 100);
  const q = params.get("q")?.trim();

  try {
    const where: Prisma.UserWhereInput = {
      role: "CUSTOMER",
      ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }] } : {}),
    };
    const [total, users] = await Promise.all([prisma.user.count({ where }), prisma.user.findMany({ where, orderBy: { createdAt: "desc" }, skip, take })]);

    const ids = users.map((u) => u.id);
    const [sums, lastOrders] = await Promise.all([
      prisma.order.groupBy({ by: ["userId"], where: { userId: { in: ids }, status: { not: "CANCELLED" } }, _count: { _all: true }, _sum: { total: true } }),
      prisma.order.findMany({ where: { userId: { in: ids } }, orderBy: { createdAt: "desc" }, select: { userId: true, shippingAddress: true }, distinct: ["userId"] }),
    ]);
    const sumBy = new Map(sums.map((s) => [s.userId, s]));
    const placeBy = new Map(lastOrders.map((o) => [o.userId, o.shippingAddress as unknown as ShippingAddress]));

    return ok({
      customers: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone ?? "",
        city: placeBy.get(u.id)?.city ?? "",
        state: placeBy.get(u.id)?.state ?? "",
        joinedDate: u.createdAt.toISOString().slice(0, 10),
        orderCount: sumBy.get(u.id)?._count._all ?? 0,
        spent: sumBy.get(u.id)?._sum.total ?? 0,
      })),
      ...pageMeta(page, pageSize, total),
    });
  } catch (err) {
    console.warn("Notice: Database offline during customers fetch.", err);
    return ok({ customers: [], ...pageMeta(page, pageSize, 0) });
  }
});
