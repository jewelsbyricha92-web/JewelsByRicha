"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useAdmin } from "@/context/AdminContext";
import { useToast } from "@/context/ToastContext";
import { api } from "@/lib/client/api";
import { Field, PageHeader } from "@/components/admin/ui";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Order, OrderStatus } from "@/types/shop";
import { formatDate, formatPrice, paymentLabel } from "@/lib/utils";

const STATUSES: OrderStatus[] = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];

export default function AdminOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { updateOrder } = useAdmin();
  const { showToast } = useToast();
  const [o, setO] = useState<Order | null | undefined>(undefined);
  const [tracking, setTracking] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api<{ order: Order }>(`/api/admin/orders/${encodeURIComponent(id)}`)
      .then((r) => {
        setO(r.order);
        setTracking(r.order.trackingNumber ?? "");
      })
      .catch(() => setO(null));
  }, [id]);
  useEffect(load, [load]);

  if (o === undefined) return <p className="text-muted">Loading…</p>;
  if (o === null) return <p className="text-muted">Order not found. <Link href="/admin/orders" className="underline">Back to orders</Link></p>;
  const cancelled = o.status === "CANCELLED";

  const run = async (patch: { status?: OrderStatus; trackingNumber?: string | null }, okMsg: string) => {
    setBusy(true);
    try {
      const next = await updateOrder(o.id, patch);
      setO(next);
      setTracking(next.trackingNumber ?? "");
      showToast(okMsg);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Could not update the order");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <Link href="/admin/orders" className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-ink"><ArrowLeft className="h-4 w-4" /> Orders</Link>
      <PageHeader title={o.id} subtitle={`Placed ${formatDate(o.createdAt)}`} actions={<StatusBadge status={o.status} />} />

      {cancelled && o.paymentStatus === "REFUNDED" && (
        <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">This paid order was cancelled. Issue the refund of {formatPrice(o.total)} from the Razorpay dashboard.</div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="a-card overflow-hidden">
            <div className="border-b border-line p-5"><h2 className="font-serif text-xl font-semibold">Items</h2></div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-cream/60"><tr><th className="a-th">Product</th><th className="a-th">Price</th><th className="a-th">Qty</th><th className="a-th text-right">Total</th></tr></thead>
                <tbody className="divide-y divide-line">
                  {o.items.map((i, k) => (
                    <tr key={`${i.productId}-${k}`}>
                      <td className="a-td font-medium">
                        <div className="flex items-center gap-3">
                          {i.image && /* eslint-disable-next-line @next/next/no-img-element */ <img src={i.image} alt="" className="h-12 w-10 rounded object-cover" />}
                          {i.productId ? <Link href={`/admin/products/${i.productId}`} className="hover:text-gold-deep">{i.name}</Link> : i.name}
                        </div>
                      </td>
                      <td className="a-td">{formatPrice(i.price)}</td><td className="a-td">{i.quantity}</td><td className="a-td text-right">{formatPrice(i.price * i.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="space-y-1 border-t border-line bg-cream/40 p-5 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(o.subtotal)}</span></div>
              {o.discount > 0 && <div className="flex justify-between text-emerald-700"><span>Discount {o.couponCode && `(${o.couponCode})`}</span><span>− {formatPrice(o.discount)}</span></div>}
              <div className="flex justify-between"><span>Shipping &amp; fees</span><span>{o.shipping ? formatPrice(o.shipping) : "Free"}</span></div>
              <div className="flex justify-between border-t border-line pt-2 text-base font-semibold"><span>Total</span><span>{formatPrice(o.total)}</span></div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="a-card space-y-4 p-5">
            <h2 className="font-serif text-xl font-semibold">Fulfilment</h2>
            <Field label="Order status" hint={cancelled ? "Cancelled orders can't be reopened." : "Cancelling restocks the items and frees the coupon."}>
              <select disabled={busy || cancelled} className="a-input" value={o.status} onChange={(e) => {
                const status = e.target.value as OrderStatus;
                if (status === "CANCELLED" && !confirm("Cancel this order? Stock will be returned and the customer is emailed.")) return;
                void run({ status }, `Order marked ${status.toLowerCase()}`);
              }}>
                {STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s.toLowerCase()}</option>)}
              </select>
            </Field>
            <Field label="Tracking number" hint="Customer is emailed when you mark the order shipped.">
              <div className="flex gap-2">
                <input disabled={cancelled} className="a-input" value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="e.g. TRK1234567" />
                <button disabled={busy || cancelled || tracking === (o.trackingNumber ?? "")} className="a-btn-ghost" onClick={() => run({ trackingNumber: tracking || null }, "Tracking saved")}>Save</button>
              </div>
            </Field>
          </div>

          <div className="a-card space-y-3 p-5 text-sm">
            <h2 className="font-serif text-xl font-semibold">Customer</h2>
            <div><div className="font-medium">{o.customerName}</div><div className="text-muted">{o.email}</div><div className="text-muted">{o.phone}</div></div>
            <div><div className="text-xs font-medium uppercase tracking-wider text-muted">Ship to</div>{o.shippingAddress.name}<br />{o.address}</div>
            <div><div className="text-xs font-medium uppercase tracking-wider text-muted">Payment</div>{paymentLabel(o.paymentMethod)} · <StatusBadge status={o.paymentStatus} /></div>
            {o.customerId !== "guest" ? <Link href={`/admin/customers/${o.customerId}`} className="inline-block text-gold-deep hover:underline">View customer →</Link> : <span className="text-xs text-muted">Guest checkout</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
