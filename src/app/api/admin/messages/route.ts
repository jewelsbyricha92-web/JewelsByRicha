import prisma from "@/lib/db";
import { handle, ok, requireAdmin } from "@/lib/server/api";
import { pageMeta, paging } from "@/lib/server/paging";

export const dynamic = "force-dynamic";

/** Contact-form messages (newest first) plus the newsletter subscriber count. Filter: ?handled=false for unread. */
export const GET = handle(async (req: Request) => {
  await requireAdmin();
  const { page, pageSize, skip, take, params } = paging(req, 20, 100);
  const where = params.get("handled") === "false" ? { handled: false } : {};

  try {
    const [total, rows, subscribers] = await Promise.all([
      prisma.contactMessage.count({ where }),
      prisma.contactMessage.findMany({ where, orderBy: { createdAt: "desc" }, skip, take }),
      prisma.subscriber.count(),
    ]);
    return ok({ messages: rows.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() })), subscribers, ...pageMeta(page, pageSize, total) });
  } catch (err) {
    console.warn("Notice: Database offline during messages fetch.", err);
    return ok({ messages: [], subscribers: 0, ...pageMeta(page, pageSize, 0) });
  }
});
