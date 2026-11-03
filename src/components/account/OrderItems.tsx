"use client";

import Link from "next/link";
import type { OrderItem } from "@/types/shop";
import { useCatalog } from "@/context/CatalogContext";
import { ProductVisual } from "@/components/ui/ProductVisual";
import { cn } from "@/lib/utils";

/** The live product behind an order line (undefined when it was deleted or unpublished since). */
export function useItemProduct(item: OrderItem) {
  const { getProduct } = useCatalog();
  return item.productId ? getProduct(item.productId) : undefined;
}

/** Product photo for an order line; links to the product page while the product is still on sale. */
export function ItemThumb({ item, className = "h-20 w-16" }: { item: OrderItem; className?: string }) {
  const product = useItemProduct(item);
  const picture = item.image ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={item.image} alt={item.name} loading="lazy" decoding="async" className="h-full w-full object-cover" />
  ) : product ? (
    <ProductVisual product={product} />
  ) : (
    <div className="h-full w-full bg-cream" />
  );
  const box = <div className={cn("relative shrink-0 overflow-hidden bg-cream", className)}>{picture}</div>;
  return product ? (
    <Link href={`/product/${product.slug}`} aria-label={`View ${item.name}`} className="block shrink-0 transition-opacity hover:opacity-85">
      {box}
    </Link>
  ) : (
    box
  );
}

/** Product name for an order line; a link while the product is still on sale. */
export function ItemName({ item, className }: { item: OrderItem; className?: string }) {
  const product = useItemProduct(item);
  return product ? (
    <Link href={`/product/${product.slug}`} className={cn("underline-offset-4 hover:text-gold-deep hover:underline", className)}>
      {item.name}
    </Link>
  ) : (
    <span className={className}>{item.name}</span>
  );
}
