"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useAdmin } from "@/context/AdminContext";
import { useToast } from "@/context/ToastContext";
import { EmptyRow, Field, Modal, PageHeader, Toggle } from "@/components/admin/ui";
import type { Coupon } from "@/types/shop";
import { formatPrice } from "@/lib/utils";

const BLANK: Coupon = { id: "new", code: "", description: "", type: "PERCENT", value: 10, minOrder: 0, usedCount: 0, firstOrderOnly: false, expiresAt: "", active: true };

const defaultExpiry = () => {
  const d = new Date();
  d.setMonth(d.getMonth() + 3);
  return d.toISOString().slice(0, 10);
};

export default function AdminCoupons() {
  const { coupons, saveCoupon, deleteCoupon } = useAdmin();
  const { showToast } = useToast();
  const [editing, setEditing] = useState<{ c: Coupon; isNew: boolean } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fail = (e: unknown) => showToast(e instanceof Error ? e.message : "Something went wrong");
  const remove = (c: Coupon) => {
    if (confirm(`Delete coupon ${c.code}?`)) deleteCoupon(c.id).then(() => showToast("Coupon deleted")).catch(fail);
  };
  const expired = (c: Coupon) => new Date(`${c.expiresAt}T23:59:59+05:30`) < new Date();

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setError(null);
    try {
      await saveCoupon({ ...editing.c, code: editing.c.code.trim().toUpperCase() }, editing.isNew);
      showToast("Coupon saved");
      setEditing(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const num = (v: string) => (v === "" ? undefined : Number(v));
  const set = (patch: Partial<Coupon>) => setEditing((s) => (s ? { ...s, c: { ...s.c, ...patch } } : s));

  return (
    <div>
      <PageHeader title="Coupons" subtitle="Discount codes customers can apply at checkout" actions={<button className="a-btn-dark" onClick={() => { setError(null); setEditing({ isNew: true, c: { ...BLANK, expiresAt: defaultExpiry() } }); }}><Plus className="h-4 w-4" /> New coupon</button>} />

      <ul className="space-y-3 md:hidden">
        {coupons.length === 0 && <li className="a-card p-8 text-center text-sm text-muted">No coupons yet.</li>}
        {coupons.map((c) => (
          <li key={c.id} className="a-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="rounded border border-dashed border-gold bg-cream px-2 py-0.5 font-mono text-xs font-semibold tracking-wider text-gold-deep">{c.code}</span>
                <div className="mt-2 text-sm">{c.description}</div>
              </div>
              <Toggle checked={c.active} onChange={(v) => saveCoupon({ ...c, active: v }).catch(fail)} label={`Toggle ${c.code}`} />
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
              <span><b className="text-ink">{c.type === "PERCENT" ? `${c.value}%` : formatPrice(c.value)}</b> off</span>
              <span>Min {c.minOrder ? formatPrice(c.minOrder) : "—"}</span>
              <span>Used {c.usedCount}{c.usageLimit ? `/${c.usageLimit}` : ""}</span>
              <span className={expired(c) ? "text-red-700" : ""}>{expired(c) ? "Expired" : "Exp"} {c.expiresAt}</span>
              {c.firstOrderOnly && <span>First order only</span>}
            </div>
            <div className="mt-3 flex justify-end gap-1 border-t border-line pt-3">
              <button onClick={() => { setError(null); setEditing({ c, isNew: false }); }} className="a-btn-ghost !py-1.5"><Pencil className="h-3.5 w-3.5" /> Edit</button>
              <button onClick={() => remove(c)} className="a-btn-ghost !py-1.5 text-red-700"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
            </div>
          </li>
        ))}
      </ul>

      <div className="a-card hidden overflow-x-auto md:block">
        <table className="w-full min-w-[900px]">
          <thead className="bg-cream/60"><tr><th className="a-th">Code</th><th className="a-th">Discount</th><th className="a-th">Min. order</th><th className="a-th">Rules</th><th className="a-th">Usage</th><th className="a-th">Expires</th><th className="a-th">Active</th><th className="a-th text-right">Actions</th></tr></thead>
          <tbody className="divide-y divide-line">
            {coupons.length === 0 && <EmptyRow cols={8} text="No coupons yet." />}
            {coupons.map((c) => (
              <tr key={c.id} className="hover:bg-cream/40">
                <td className="a-td"><span className="rounded border border-dashed border-gold bg-cream px-2 py-0.5 font-mono text-xs font-semibold tracking-wider text-gold-deep">{c.code}</span><div className="mt-1 text-xs text-muted">{c.description}</div></td>
                <td className="a-td">{c.type === "PERCENT" ? `${c.value}%` : formatPrice(c.value)}{c.maxDiscount && <div className="text-xs text-muted">up to {formatPrice(c.maxDiscount)}</div>}</td>
                <td className="a-td">{c.minOrder ? formatPrice(c.minOrder) : "—"}</td>
                <td className="a-td text-xs text-muted">{[c.firstOrderOnly && "First order only", c.perCustomerLimit && `${c.perCustomerLimit}× per customer`].filter(Boolean).join(" · ") || "—"}</td>
                <td className="a-td">{c.usedCount}{c.usageLimit ? ` / ${c.usageLimit}` : ""}</td>
                <td className={`a-td ${expired(c) ? "text-red-700" : "text-muted"}`}>{c.expiresAt}{expired(c) && <div className="text-xs">expired</div>}</td>
                <td className="a-td"><Toggle checked={c.active} onChange={(v) => saveCoupon({ ...c, active: v }).catch(fail)} label={`Toggle ${c.code}`} /></td>
                <td className="a-td">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => { setError(null); setEditing({ c, isNew: false }); }} className="rounded-md p-2 text-muted hover:bg-cream hover:text-ink" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => remove(c)} className="rounded-md p-2 text-muted hover:bg-red-50 hover:text-red-700" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.isNew ? "New coupon" : "Edit coupon"} wide>
        {editing && (
          <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
            {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 sm:col-span-2">{error}</div>}
            <Field label="Code"><input required className="a-input font-mono uppercase" value={editing.c.code} onChange={(e) => set({ code: e.target.value })} /></Field>
            <Field label="Expires on"><input required type="date" className="a-input" value={editing.c.expiresAt} onChange={(e) => set({ expiresAt: e.target.value })} /></Field>
            <div className="sm:col-span-2"><Field label="Description (shown to customer)"><input className="a-input" value={editing.c.description} onChange={(e) => set({ description: e.target.value })} /></Field></div>
            <Field label="Discount type">
              <select className="a-input" value={editing.c.type} onChange={(e) => set({ type: e.target.value as Coupon["type"] })}>
                <option value="PERCENT">Percentage (%)</option><option value="FLAT">Flat amount (₹)</option>
              </select>
            </Field>
            <Field label={editing.c.type === "PERCENT" ? "Percent off" : "Amount off (₹)"}><input required type="number" min={1} max={editing.c.type === "PERCENT" ? 100 : undefined} className="a-input" value={editing.c.value} onChange={(e) => set({ value: Number(e.target.value) })} /></Field>
            <Field label="Minimum order (₹)"><input type="number" min={0} className="a-input" value={editing.c.minOrder} onChange={(e) => set({ minOrder: Number(e.target.value) })} /></Field>
            <Field label="Max discount (₹)" hint="Optional cap for % coupons"><input type="number" min={0} className="a-input" value={editing.c.maxDiscount ?? ""} onChange={(e) => set({ maxDiscount: num(e.target.value) })} /></Field>
            <Field label="Total usage limit" hint="Leave blank for unlimited"><input type="number" min={0} className="a-input" value={editing.c.usageLimit ?? ""} onChange={(e) => set({ usageLimit: num(e.target.value) })} /></Field>
            <Field label="Uses per customer" hint="Leave blank for unlimited"><input type="number" min={0} className="a-input" value={editing.c.perCustomerLimit ?? ""} onChange={(e) => set({ perCustomerLimit: num(e.target.value) })} /></Field>
            <div className="flex flex-col gap-3 text-sm sm:col-span-2 sm:flex-row sm:gap-8">
              <div className="flex items-center justify-between gap-4">Active<Toggle checked={editing.c.active} onChange={(v) => set({ active: v })} label="Active" /></div>
              <div className="flex items-center justify-between gap-4">First order only<Toggle checked={editing.c.firstOrderOnly} onChange={(v) => set({ firstOrderOnly: v })} label="First order only" /></div>            </div>
            <div className="flex justify-end gap-2 sm:col-span-2"><button type="button" className="a-btn-ghost" onClick={() => setEditing(null)}>Cancel</button><button disabled={saving} className="a-btn-dark">{saving ? "Saving…" : "Save coupon"}</button></div>
          </form>
        )}
      </Modal>
    </div>
  );
}
