"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";
import { Check } from "lucide-react";
import type { Order } from "@/types/shop";
import { api } from "@/lib/client/api";
import { payForOrder } from "@/lib/client/pay";
import { useToast } from "@/context/ToastContext";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn, formatDate, formatPrice } from "@/lib/utils";

const STEPS = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED"] as const;

export default function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { showToast } = useToast();
  const [o, setO] = useState<Order | null | undefined>(undefined); // undefined = loading, null = not found
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api<{ order: Order }>(`/api/orders/${encodeURIComponent(id)}`)
      .then((r) => setO(r.order))
      .catch(() => setO(null));
  }, [id]);
  useEffect(load, [load]);

  if (o === undefined) return <p className="text-muted">Loading…</p>;
  if (o === null)
    return (
      <p className="text-muted">
        Order not found. <Link href="/account/orders" className="underline">Back to orders</Link>
      </p>
    );
  const idx = STEPS.indexOf(o.status as (typeof STEPS)[number]);
  const needsPayment = o.paymentStatus !== "PAID" && o.status !== "CANCELLED";

  const payNow = async () => {
    setBusy(true);
    try {
      if (await payForOrder(o.id)) showToast("Payment received — thank you!");
      load();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Payment could not be completed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <Link href="/account/orders" className="text-xs uppercase tracking-[0.2em] text-muted hover:text-ink">← All orders</Link>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h2 className="font-serif text-3xl">{o.id}</h2>
        <StatusBadge status={o.status} />
      </div>
      <p className="text-sm text-muted">Placed on {formatDate(o.createdAt)}</p>

      {o.status !== "CANCELLED" && (
        <ol className="my-8 grid grid-cols-4 gap-2">
          {STEPS.map((s, i) => (
            <li key={s} className="text-center">
              <div className={cn("mx-auto flex h-8 w-8 items-center justify-center rounded-full border text-xs", i <= idx ? "border-gold bg-gold text-ink" : "border-line text-muted")}>
                {i <= idx ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <div className="mt-1 text-[11px] capitalize text-muted">{s.toLowerCase()}</div>
            </li>
          ))}
        </ol>
      )}
      {o.trackingNumber && <p className="mb-6 text-sm">Tracking number: <b>{o.trackingNumber}</b></p>}

      {needsPayment && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border border-gold-light bg-cream p-4 text-sm">
          <span>Payment for this order is pending.</span>
          <button disabled={busy} onClick={payNow} className="btn-gold !py-2.5">Pay {formatPrice(o.total)}</button>
        </div>
      )}

      <div className="border border-line bg-white">
        {o.items.map((i, k) => (
          <div key={`${i.productId}-${k}`} className="flex justify-between border-b border-line p-4 text-sm last:border-0">
            <span>{i.name} × {i.quantity}</span><span>{formatPrice(i.price * i.quantity)}</span>
          </div>
        ))}
        <div className="space-y-1 bg-cream p-4 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(o.subtotal)}</span></div>
          {o.discount > 0 && <div className="flex justify-between text-green-700"><span>Discount {o.couponCode && `(${o.couponCode})`}</span><span>− {formatPrice(o.discount)}</span></div>}
          <div className="flex justify-between"><span>Shipping &amp; fees</span><span>{o.shipping ? formatPrice(o.shipping) : "Free"}</span></div>
          <div className="flex justify-between border-t border-line pt-2 text-base font-medium"><span>Total</span><span>{formatPrice(o.total)}</span></div>
        </div>
      </div>
      <div className="mt-6 grid gap-6 text-sm sm:grid-cols-2">
        <div><div className="label">Delivery address</div>{o.customerName}<br />{o.address}</div>
        <div><div className="label">Payment</div>{o.paymentMethod} · <StatusBadge status={o.paymentStatus} /></div>
      </div>
      <p className="mt-8 text-xs text-muted">
        Received a damaged piece? Email us an unboxing video within 48 hours of delivery — see <Link href="/shipping-returns" className="underline">Shipping &amp; returns</Link>.
      </p>
    </div>
  );
}
