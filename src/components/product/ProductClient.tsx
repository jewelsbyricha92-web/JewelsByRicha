"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Droplets, Heart, RefreshCcw, ShieldCheck, Star, Truck } from "lucide-react";
import { useCatalog } from "@/context/CatalogContext";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { ProductVisual } from "@/components/ui/ProductVisual";
import { ProductGrid } from "@/components/ui/ProductCard";
import { QuantitySelector } from "@/components/ui/QuantitySelector";
import { cn, discountPct, formatPrice } from "@/lib/utils";
import type { Product } from "@/types/shop";

export function ProductClient({ product }: { product: Product }) {
  const { products, getCategory, collections, settings } = useCatalog();
  const { addToCart } = useCart();
  const { has, toggle } = useWishlist();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [img, setImg] = useState(0);
  const [open, setOpen] = useState<string | null>("Description");
  const rail = useRef<HTMLDivElement>(null);

  const cat = getCategory(product.categoryId);
  const col = collections.find((c) => c.id === product.collectionId);
  const off = discountPct(product.price, product.originalPrice);
  const soldOut = product.stock <= 0;
  const live = products.filter((p) => p.status === "ACTIVE" && p.id !== product.id);
  const same = live.filter((p) => p.categoryId === product.categoryId);
  const more = [...same, ...live.filter((p) => p.collectionId === product.collectionId && p.categoryId !== product.categoryId)].slice(0, 4);
  const slides = product.images.length ? product.images.map((_, i) => i) : [0, 1, 2];

  const sections: [string, string][] = [
    ["Description", product.description],
    ["Material & finish", product.material],
    ["Care instructions", product.careInstructions],
    ["Shipping & replacement", `Ships within 1–2 business days across India. Free shipping on orders above ₹${settings.freeShippingThreshold.toLocaleString("en-IN")}. All orders are prepaid and are not eligible for cancellation or return; a damaged piece is replaced free of charge (an unboxing video is required).`],
  ];

  const onScroll = () => {
    const el = rail.current;
    if (el) setImg(Math.round(el.scrollLeft / el.clientWidth));
  };

  return (
    <div className="mx-auto w-full max-w-7xl pb-24 md:px-8 md:py-12 md:pb-12">
      <nav className="hidden px-4 pb-6 text-xs uppercase tracking-[0.18em] text-muted md:block md:px-0">
        <Link href="/shop" className="hover:text-ink">Shop</Link>
        {col && <><span className="mx-2">/</span><Link href={`/collections/${col.slug}`} className="hover:text-ink">{col.name}</Link></>}
        {col && cat && <><span className="mx-2">/</span><Link href={`/collections/${col.slug}/${cat.slug}`} className="hover:text-ink">{cat.name}</Link></>}
      </nav>

      <div className="grid gap-8 md:grid-cols-2 lg:gap-16">
        {/* gallery — phones: swipe, desktop: thumbs */}
        <div className="md:flex md:gap-3">
          <div className="hidden gap-3 md:flex md:w-20 md:shrink-0 md:flex-col">
            {slides.map((i) => (
              <button
                key={i}
                onClick={() => setImg(i)}
                className={cn("aspect-[4/5] overflow-hidden border bg-cream transition", img === i ? "border-gold" : "border-transparent opacity-70 hover:opacity-100")}
                aria-label={`View image ${i + 1}`}
              >
                <ProductVisual product={product} index={i} />
              </button>
            ))}
          </div>

          {/* desktop main */}
          <div className="relative hidden aspect-[4/5] flex-1 overflow-hidden bg-cream md:block">
            <ProductVisual product={product} index={img} />
            {(product.badge || off > 0) && (
              <span className="absolute left-4 top-4 bg-ivory/95 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em]">{product.badge ?? `${off}% off`}</span>
            )}
          </div>

          {/* phone swipe rail */}
          <div className="relative md:hidden">
            <div ref={rail} onScroll={onScroll} className="hide-scrollbar flex snap-x snap-mandatory overflow-x-auto">
              {slides.map((i) => (
                <div key={i} className="aspect-[4/5] w-full shrink-0 snap-center bg-cream">
                  <ProductVisual product={product} index={i} />
                </div>
              ))}
            </div>
            <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
              {slides.map((i) => <span key={i} className={cn("h-1.5 rounded-full transition-all", img === i ? "w-5 bg-ink" : "w-1.5 bg-ink/30")} />)}
            </div>
            {(product.badge || off > 0) && (
              <span className="absolute left-3 top-3 bg-ivory/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]">{product.badge ?? `${off}% off`}</span>
            )}
            <button onClick={() => toggle(product.id, product.name)} aria-label="Wishlist" className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-ivory/90">
              <Heart className={cn("h-5 w-5", has(product.id) && "fill-gold text-gold")} />
            </button>
          </div>
        </div>

        {/* info */}
        <div className="px-5 md:px-0">
          <p className="eyebrow">{cat?.name}</p>
          <h1 className="mt-2 font-serif text-[2rem] font-light leading-tight md:text-5xl">{product.name}</h1>
          <div className="mt-3 flex items-center gap-2 text-sm text-muted">
            <span className="flex">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={cn("h-4 w-4", i < Math.round(product.rating) ? "fill-gold text-gold" : "text-line")} />)}</span>
            {product.rating} · {product.reviewCount} reviews
          </div>

          <div className="mt-5 flex flex-wrap items-baseline gap-3">
            <span className="text-3xl font-medium tracking-tight">{formatPrice(product.price)}</span>
            {product.originalPrice && (
              <>
                <span className="text-base text-muted/60 line-through">{formatPrice(product.originalPrice)}</span>
                <span className="bg-blush-rose/50 border border-blush-border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-gold-deep">{off}% OFF</span>
              </>
            )}
          </div>
          <p className="mt-1 text-xs text-muted/80">Inclusive of all taxes · Free shipping above ₹999</p>

          <p className="mt-6 leading-relaxed text-ink-soft/90">{product.shortDescription}</p>

          <ul className="mt-5 flex flex-wrap gap-2">
            {product.features.map((f) => (
              <li key={f} className="border border-blush-border/70 bg-blush-soft px-3 py-1 text-[11px] font-medium tracking-wide text-ink-soft">{f}</li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <QuantitySelector value={qty} onChange={(n) => setQty(Math.max(1, n))} max={Math.max(product.stock, 1)} />
            <span className={cn("text-xs", soldOut ? "text-red-700" : product.stock <= 5 ? "text-gold-deep" : "text-muted/80")}>
              {soldOut ? "Currently sold out" : product.stock <= 5 ? `Only ${product.stock} left` : "In stock"}
            </span>
          </div>

          {/* desktop buttons */}
          <div className="mt-6 hidden gap-3 md:flex">
            <button disabled={soldOut} onClick={() => addToCart(product, qty)} className="btn-dark flex-1">Add to bag</button>
            <button disabled={soldOut} onClick={() => { addToCart(product, qty); router.push("/checkout"); }} className="btn-gold flex-1">Buy now</button>
            <button onClick={() => toggle(product.id, product.name)} aria-label="Wishlist" className="flex h-[46px] w-[46px] items-center justify-center border border-line/80 transition-colors hover:border-gold">
              <Heart className={cn("h-5 w-5", has(product.id) && "fill-gold text-gold")} />
            </button>
          </div>

          <div className="mt-8 grid grid-cols-4 gap-2 border-y border-line/70 py-5 text-[10.5px]">
            {[
              [ShieldCheck, "Anti-tarnish"],
              [Droplets, "Waterproof"],
              [Truck, "Pan-India delivery"],
              [RefreshCcw, "Damage replacement"],
            ].map(([Icon, label]) => {
              const I = Icon as typeof ShieldCheck;
              return (
                <div key={label as string} className="flex flex-col items-center gap-1.5 text-center leading-tight">
                  <I className="h-5 w-5 text-gold/85" strokeWidth={1.2} />
                  {label as string}
                </div>
              );
            })}
          </div>

          <div className="mt-2">
            {sections.map(([t, body]) => (
              <div key={t} className="border-b border-line/70">
                <button onClick={() => setOpen(open === t ? null : t)} className="flex w-full items-center justify-between py-4 text-left text-[11.5px] font-semibold uppercase tracking-[0.2em]">
                  {t}
                  <ChevronDown className={cn("h-4 w-4 transition-transform duration-300", open === t && "rotate-180")} />
                </button>
                {open === t && <p className="pb-5 text-sm leading-relaxed text-ink-soft/85">{body}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {more.length > 0 && (
        <section className="mt-16 px-5 md:mt-24 md:px-0">
          <h2 className="mb-8 text-center font-serif text-3xl font-light md:text-4xl">You may also love</h2>
          <ProductGrid products={more} />
        </section>
      )}

      {/* phone sticky bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-line bg-ivory/95 px-4 py-3 backdrop-blur md:hidden">
        <div className="leading-tight">
          <div className="text-lg font-medium">{formatPrice(product.price * qty)}</div>
          {product.originalPrice && <div className="text-[11px] text-muted line-through">{formatPrice(product.originalPrice * qty)}</div>}
        </div>
        <button disabled={soldOut} onClick={() => addToCart(product, qty)} className="btn-dark flex-1 !px-4 !py-3.5">{soldOut ? "Sold out" : "Add to bag"}</button>
        <button disabled={soldOut} onClick={() => { addToCart(product, qty); router.push("/checkout"); }} className="btn-gold !px-5 !py-3.5">Buy</button>
      </div>
    </div>
  );
}
