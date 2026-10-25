import type { Category as DbCategory, Collection as DbCollection, Coupon as DbCoupon, Order as DbOrder, OrderItem as DbOrderItem, Product as DbProduct, ProductImage, User } from "@prisma/client";
import type { ArtKind, Category, Collection, Coupon, Customer, Order, Product, ProductBadge, ShippingAddress } from "@/types/shop";

export const toCollection = (c: DbCollection): Collection => ({ id: c.id, name: c.name, slug: c.slug, tagline: c.tagline ?? "", description: c.description ?? "" });

export const toCategory = (c: DbCategory): Category => ({
  id: c.id,
  name: c.name,
  slug: c.slug,
  collectionId: c.collectionId,
  kind: c.artKind as ArtKind,
  description: c.description,
  active: c.active,
  showOnHome: c.showOnHome,
  sortOrder: c.sortOrder,
});

export const toProduct = (p: DbProduct & { images: ProductImage[] }): Product => ({
  id: p.id,
  name: p.name,
  slug: p.slug,
  categoryId: p.categoryId,
  collectionId: p.collectionId,
  price: p.price,
  originalPrice: p.originalPrice ?? undefined,
  description: p.description,
  shortDescription: p.shortDescription,
  images: [...p.images].sort((a, b) => a.sortOrder - b.sortOrder).map((i) => i.url),
  rating: p.rating,
  reviewCount: p.reviewCount,
  badge: (p.badge as ProductBadge | null) ?? undefined,
  isNew: p.isNew,
  isBestSeller: p.isBestSeller,
  isFeatured: p.isFeatured,
  stock: p.stock,
  status: p.status,
  features: p.features,
  material: p.material,
  careInstructions: p.careInstructions,
  createdAt: p.createdAt.toISOString(),
});

export const toCoupon = (c: DbCoupon): Coupon => ({
  id: c.id,
  code: c.code,
  description: c.description,
  type: c.type,
  value: c.value,
  minOrder: c.minOrder,
  maxDiscount: c.maxDiscount ?? undefined,
  usageLimit: c.usageLimit ?? undefined,
  usedCount: c.usedCount,
  perCustomerLimit: c.perCustomerLimit ?? undefined,
  firstOrderOnly: c.firstOrderOnly,
  expiresAt: c.expiresAt.toISOString().slice(0, 10),
  active: c.active,
});

export function toOrder(o: DbOrder & { items: DbOrderItem[] }): Order {
  const a = o.shippingAddress as unknown as ShippingAddress;
  return {
    id: o.number,
    customerId: o.userId ?? "guest",
    customerName: o.customerName,
    email: o.email,
    phone: o.phone,
    items: o.items.map((i) => ({ productId: i.productId ?? "", name: i.name, image: i.image ?? undefined, price: i.price, quantity: i.quantity })),
    subtotal: o.subtotal,
    discount: o.discount,
    shipping: o.shipping + o.codFee, // codFee is 0 on every new order (COD was dropped); kept so old orders still add up
    total: o.total,
    couponCode: o.couponCode ?? undefined,
    paymentMethod: o.paymentMethod,
    paymentStatus: o.paymentStatus,
    status: o.status,
    address: `${a.line}, ${a.city}, ${a.state} – ${a.pincode}`,
    shippingAddress: a,
    trackingNumber: o.trackingNumber ?? undefined,
    createdAt: o.createdAt.toISOString(),
  };
}

export const toCustomer = (u: User, place?: { city: string; state: string }): Customer => ({
  id: u.id,
  name: u.name,
  email: u.email,
  phone: u.phone ?? "",
  city: place?.city ?? "",
  state: place?.state ?? "",
  joinedDate: u.createdAt.toISOString().slice(0, 10),
});
