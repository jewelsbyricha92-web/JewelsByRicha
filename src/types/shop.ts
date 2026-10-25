/** Shared types used by the storefront, the admin panel and the API layer. */

export type ArtKind =
  | "watch"
  | "necklace"
  | "chain-necklace"
  | "bangle"
  | "bracelet"
  | "chain-bracelet"
  | "pendant"
  | "stud"
  | "drop"
  | "hoop"
  | "ring"
  | "mangalsutra"
  | "combo";

export type Tone = "gold" | "rose" | "onyx" | "pearl";

export interface Collection {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  collectionId: string;
  kind: ArtKind;
  description: string;
  active: boolean;
  showOnHome: boolean;
  sortOrder: number;
}

export type ProductBadge = "NEW" | "BEST SELLER" | "SALE" | "LIMITED";

export interface Product {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  collectionId: string;
  price: number;
  originalPrice?: number;
  description: string;
  shortDescription: string;
  /** Photo URLs. When empty the storefront draws an illustrated placeholder. */
  images: string[];
  tone?: Tone;
  rating: number;
  reviewCount: number;
  badge?: ProductBadge;
  isNew: boolean;
  isBestSeller: boolean;
  isFeatured: boolean;
  stock: number;
  status: "ACTIVE" | "DRAFT";
  features: string[];
  material: string;
  careInstructions: string;
  createdAt: string;
}

export type OrderStatus = "PENDING" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED";
export type PaymentMethod = "UPI" | "CARD" | "COD";
export type PaymentStatus = "PAID" | "PENDING" | "FAILED" | "REFUNDED";

export interface OrderItem {
  productId: string;
  name: string;
  image?: string;
  price: number;
  quantity: number;
}

export interface ShippingAddress {
  name: string;
  phone: string;
  line: string;
  city: string;
  state: string;
  pincode: string;
}

export interface Order {
  id: string; // the order number, e.g. JBR-1001
  customerId: string; // user id, or "guest"
  customerName: string;
  email: string;
  phone: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  couponCode?: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  address: string;
  shippingAddress: ShippingAddress;
  trackingNumber?: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  joinedDate: string;
}

export interface Coupon {
  id: string;
  code: string;
  description: string;
  type: "PERCENT" | "FLAT";
  value: number;
  minOrder: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  perCustomerLimit?: number;
  firstOrderOnly: boolean;
  expiresAt: string; // yyyy-mm-dd
  active: boolean;
}

/** Editable store settings (Admin -> Settings). */
export interface StoreSettings {
  freeShippingThreshold: number;
  shippingFee: number;
  contactEmail: string;
  contactPhone: string;
  businessHours: string;
  instagram: string;
  lowStockThreshold: number;
}

export interface CatalogData {
  collections: Collection[];
  categories: Category[];
  products: Product[];
  settings: StoreSettings;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

export interface SavedAddress extends ShippingAddress {
  id: string;
  isDefault: boolean;
}
