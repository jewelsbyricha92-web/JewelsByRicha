"use client";

import Link from "next/link";
import { ArrowRight, PackageOpen, Truck } from "lucide-react";
import { useMyOrders } from "@/lib/client/hooks";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ItemName, ItemThumb } from "@/components/account/OrderItems";
import { formatDate, formatPrice } from "@/lib/utils";

export default function OrdersPage() {
  const { orders, error, hasMore, loadMore, loadingMore, total } = useMyOrders();
  return (
    <div>
      <h2 className="mb-6 font-serif text-3xl">Order history</h2>
      {error && <p className="mb-4 text-sm text-red-700">{error}</p>}
      {!orders && !error && <p className="text-muted">Loading your orders…</p>}
      {orders && orders.length === 0 && (
        <div className="border border-dashed border-line bg-white p-12 text-center">
          <PackageOpen className="mx-auto mb-3 h-10 w-10 text-gold-mid" strokeWidth={1.2} />
          <p className="font-serif text-2xl">No orders yet</p>
          <p className="mt-1 text-sm text-muted">Your orders will appear here.</p>
          <Link href="/shop" className="btn-dark mt-5">Start shopping</Link>
        </div>
      )}
      {orders && orders.length > 0 && (
        <ul className="space-y-5">
          {orders.map((o) => {
            const shown = o.items.slice(0, 3);
            const more = o.items.length - shown.length;
            return (
              <li key={o.id} className="border border-line bg-white transition-colors hover:border-gold-light">
                {/* header: tapping it opens the order */}
                <Link href={`/account/orders/${o.id}`} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-line bg-cream/50 px-5 py-4">
                  <div>
                    <div className="font-serif text-xl leading-none">{o.id}</div>
                    <div className="mt-1.5 text-xs text-muted">Placed on {formatDate(o.createdAt)}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <StatusBadge status={o.status} />
                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-widest text-muted">Total</div>
                      <div className="font-medium">{formatPrice(o.total)}</div>
                    </div>
                  </div>
                </Link>

                {/* items: photo and name open the product */}
                <ul className="divide-y divide-line px-5">
                  {shown.map((i, k) => (
                    <li key={`${i.productId}-${k}`} className="flex items-center gap-4 py-4">
                      <ItemThumb item={i} className="h-16 w-[52px]" />
                      <div className="min-w-0 flex-1 text-sm">
                        <ItemName item={i} className="block truncate font-serif text-lg leading-tight" />
                        <p className="mt-0.5 text-xs text-muted">Qty {i.quantity} · {formatPrice(i.price)} each</p>
                      </div>
                      <div className="text-sm font-medium">{formatPrice(i.price * i.quantity)}</div>
                    </li>
                  ))}
                  {more > 0 && <li className="py-3 text-xs text-muted">+ {more} more {more === 1 ? "item" : "items"}</li>}
                </ul>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3 text-xs">
                  {o.trackingNumber ? (
                    <span className="flex items-center gap-1.5 text-muted"><Truck className="h-3.5 w-3.5 text-gold" /> Tracking: <b className="text-ink">{o.trackingNumber}</b></span>
                  ) : (
                    <span className="text-muted">{o.items.reduce((n, i) => n + i.quantity, 0)} item(s)</span>
                  )}
                  <Link href={`/account/orders/${o.id}`} className="inline-flex items-center gap-1.5 uppercase tracking-[0.18em] text-gold-deep hover:underline">
                    View details &amp; price breakdown <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {orders && orders.length > 0 && (
        <div className="mt-8 text-center">
          <p className="text-xs text-muted">Showing {orders.length} of {total}</p>
          {hasMore && <button onClick={loadMore} disabled={loadingMore} className="btn-outline mt-3">{loadingMore ? "Loading…" : "Show older orders"}</button>}
        </div>
      )}
    </div>
  );
}
