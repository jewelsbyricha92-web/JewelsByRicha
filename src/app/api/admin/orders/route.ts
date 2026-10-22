import type { Prisma } from "@prisma/client";
import prisma from "@/lib/db";
import { handle, ok, requireAdmin } from "@/lib/server/api";
import { toOrder } from "@/lib/server/mappers";
import { pageMeta, paging } from "@/lib/server/paging";

export const dynamic = "force-dynamic";

const STATUSES = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"] as const;

/** Paginated orders. Filters: status, q (order number, name, email, phone). Also returns the count per status for the tabs. */
export const GET = handle(async (req: Request) => {
  await requireAdmin();
  const { page, pageSize, skip, take, params } = paging(req, 20, 100);
  const status = params.get("status");
  const q = params.get("q")?.trim();

  try {
    const where: Prisma.OrderWhereInput = {
      ...(status && (STATUSES as readonly string[]).includes(status) ? { status: status as (typeof STATUSES)[number] } : {}),
      ...(q ? { OR: [{ number: { contains: q, mode: "insensitive" } }, { customerName: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }] } : {}),
    };
    const [total, rows, grouped] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({ where, include: { items: true }, orderBy: { createdAt: "desc" }, skip, take }),
      prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
    ]);
    const counts: Record<string, number> = { ALL: 0 };
    for (const g of grouped) {
      counts[g.status] = g._count._all;
      counts.ALL += g._count._all;
    }
    return ok({ orders: rows.map(toOrder), counts, ...pageMeta(page, pageSize, total) });
  } catch (err) {
    console.warn("Notice: Database offline during orders fetch.", err);
    return ok({ orders: [], counts: { ALL: 0 }, ...pageMeta(page, pageSize, 0) });
  }
});
