"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";
import { ArrowLeft, Check, CreditCard, Mail, MapPin, Phone, Truck } from "lucide-react";
import type { Order } from "@/types/shop";
import { api } from "@/lib/client/api";
import { payForOrder } from "@/lib/client/pay";
import { useToast } from "@/context/ToastContext";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ItemName, ItemThumb } from "@/components/account/OrderItems";
import { cn, formatDate, formatPrice, paymentLabel } from "@/lib/utils";

const STEPS = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED"] as const;
const STEP_LABEL: Record<(typeof STEPS)[number], string> = { PENDING: "Placed", CONFIRMED: "Confirmed", SHIPPED: "Shipped", DELIVERED: "Delivered" };

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
  const units = o.items.reduce((n, i) => n + i.quantity, 0);
  const a = o.shippingAddress;

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
      <Link href="/account/orders" className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-muted hover:text-ink">
        <ArrowLeft className="h-3.5 w-3.5" /> All orders
      </Link>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h2 className="font-serif text-3xl">{o.id}</h2>
        <StatusBadge status={o.status} />
      </div>
      <p className="text-sm text-muted">Placed on {formatDate(o.createdAt)} · {units} {units === 1 ? "item" : "items"}</p>

      {o.status === "CANCELLED" ? (
        <div className="mt-6 border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">This order was cancelled. If you have any questions, please <Link href="/contact" className="underline">contact us</Link>.</div>
      ) : (
        <ol className="my-8 grid grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s} className="relative text-center">
              {i > 0 && <span className={cn("absolute right-1/2 top-4 h-px w-full", i <= idx ? "bg-gold" : "bg-line")} aria-hidden />}
              <div className={cn("relative z-10 mx-auto flex h-8 w-8 items-center justify-center rounded-full border text-xs", i <= idx ? "border-gold bg-gold text-ink" : "border-line bg-ivory text-muted")}>
                {i <= idx ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <div className={cn("mt-1.5 text-[11px]", i <= idx ? "font-medium text-ink" : "text-muted")}>{STEP_LABEL[s]}</div>
            </li>
          ))}
        </ol>
      )}

      {o.trackingNumber && (
        <div className="mb-6 flex items-center gap-3 border border-line bg-white p-4 text-sm">
          <Truck className="h-5 w-5 text-gold" strokeWidth={1.4} />
          <span>Tracking number: <b className="select-all">{o.trackingNumber}</b></span>
        </div>
      )}

      {needsPayment && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border border-gold-light bg-cream p-4 text-sm">
          <span>Payment for this order is pending.</span>
          <button disabled={busy} onClick={payNow} className="btn-gold !py-2.5">Pay {formatPrice(o.total)}</button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* items */}
        <section className="border border-line bg-white">
          <h3 className="border-b border-line px-5 py-4 font-serif text-xl">Items in this order</h3>
          <ul className="divide-y divide-line">
            {o.items.map((i, k) => (
              <li key={`${i.productId}-${k}`} className="flex gap-4 p-5">
                <ItemThumb item={i} />
                <div className="flex min-w-0 flex-1 flex-col justify-between gap-1 text-sm">
                  <div>
                    <ItemName item={i} className="font-serif text-lg leading-snug" />
                    <p className="mt-0.5 text-xs text-muted">{formatPrice(i.price)} each · Qty {i.quantity}</p>
                  </div>
                </div>
                <div className="text-right text-sm font-medium">{formatPrice(i.price * i.quantity)}</div>
              </li>
            ))}
          </ul>
        </section>

        {/* price breakdown */}
        <section className="h-fit border border-line bg-white">
          <h3 className="border-b border-line px-5 py-4 font-serif text-xl">Price details</h3>
          <dl className="space-y-3 p-5 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Items ({units})</dt><dd>{formatPrice(o.subtotal)}</dd></div>
            {o.discount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <dt>Discount{o.couponCode && <span className="ml-1.5 rounded border border-dashed border-emerald-300 px-1.5 py-0.5 font-mono text-[11px]">{o.couponCode}</span>}</dt>
                <dd>− {formatPrice(o.discount)}</dd>
              </div>
            )}
            <div className="flex justify-between"><dt className="text-muted">Shipping</dt><dd className={o.shipping ? "" : "text-emerald-700"}>{o.shipping ? formatPrice(o.shipping) : "Free"}</dd></div>
            <div className="flex justify-between border-t border-line pt-3 text-base font-medium"><dt>Total paid</dt><dd>{formatPrice(o.total)}</dd></div>
            {o.discount > 0 && <p className="bg-emerald-50 px-3 py-2 text-xs text-emerald-800">You saved {formatPrice(o.discount)} on this order.</p>}
          </dl>
        </section>
      </div>

      {/* delivery, contact, payment */}
      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <section className="border border-line bg-white p-5 text-sm">
          <h3 className="mb-3 flex items-center gap-2 font-serif text-lg"><MapPin className="h-4 w-4 text-gold" /> Delivery address</h3>
          <p className="font-medium">{a?.name ?? o.customerName}</p>
          <p className="mt-1 text-muted">{a ? `${a.line}, ${a.city}, ${a.state} – ${a.pincode}` : o.address}</p>
        </section>
        <section className="border border-line bg-white p-5 text-sm">
          <h3 className="mb-3 flex items-center gap-2 font-serif text-lg"><Mail className="h-4 w-4 text-gold" /> Contact</h3>
          <p className="break-all">{o.email}</p>
          <p className="mt-1 flex items-center gap-1.5 text-muted"><Phone className="h-3.5 w-3.5" /> {o.phone}</p>
        </section>
        <section className="border border-line bg-white p-5 text-sm">
          <h3 className="mb-3 flex items-center gap-2 font-serif text-lg"><CreditCard className="h-4 w-4 text-gold" /> Payment</h3>
          <p>{paymentLabel(o.paymentMethod)}</p>
          <p className="mt-1.5"><StatusBadge status={o.paymentStatus} /></p>
        </section>
      </div>

      <p className="mt-8 text-xs text-muted">
        Received a damaged piece? Email us an unboxing video within 48 hours of delivery — see <Link href="/shipping-returns" className="underline">Shipping &amp; returns</Link>. Need help with this order? <Link href="/contact" className="underline">Contact us</Link>.
      </p>
    </div>
  );
}
