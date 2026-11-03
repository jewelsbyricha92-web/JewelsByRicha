import prisma from "@/lib/db";
import { ApiError, body, handle, ok, requireCustomer } from "@/lib/server/api";
import { addressInputSchema, backfillAddresses } from "@/lib/server/orders";

const toSaved = (a: { id: string; name: string; phone: string; line: string; city: string; state: string; pincode: string; isDefault: boolean }) => ({ id: a.id, name: a.name, phone: a.phone, line: a.line, city: a.city, state: a.state, pincode: a.pincode, isDefault: a.isDefault });

export const GET = handle(async () => {
  const me = await requireCustomer();
  const query = () => prisma.address.findMany({ where: { userId: me.id }, orderBy: [{ isDefault: "desc" }, { id: "asc" }] });
  let list = await query();
  if (list.length === 0) {
    // accounts that ordered before addresses were saved automatically: recover them from the order history
    await backfillAddresses(me.id);
    list = await query();
  }
  return ok({ addresses: list.map(toSaved) });
});

export const POST = handle(async (req: Request) => {
  const me = await requireCustomer();
  const input = await body(req, addressInputSchema);
  const count = await prisma.address.count({ where: { userId: me.id } });
  if (count >= 10) throw new ApiError(400, "You can save up to 10 addresses.");
  const makeDefault = input.isDefault || count === 0;
  const created = await prisma.$transaction(async (tx) => {
    if (makeDefault) await tx.address.updateMany({ where: { userId: me.id }, data: { isDefault: false } });
    return tx.address.create({ data: { ...input, isDefault: makeDefault, userId: me.id } });
  });
  return ok({ address: toSaved(created) }, { status: 201 });
});
