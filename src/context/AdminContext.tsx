"use client";

/**
 * Admin data store. Holds the small, rarely-changing data (collections, categories, coupons, settings, counters).
 * Big lists (products, orders, customers, messages) are fetched page by page by the pages themselves.
 * Every save/delete goes to the server first, and the local copy is updated from the server's answer.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Category, Collection, Coupon, Order, OrderStatus, Product, StoreSettings } from "@/types/shop";
import { api } from "@/lib/client/api";

interface Bootstrap {
  collections: Collection[];
  categories: Category[];
  coupons: Coupon[];
  settings: StoreSettings;
  unreadMessages: number;
  pendingOrders: number;
  categoryCounts: Record<string, number>;
  integrations: { razorpay: boolean; cloudinary: boolean; email: boolean };
}

interface AdminContextType extends Bootstrap {
  ready: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getCategory: (id: string) => Category | undefined;
  saveProduct: (p: Product) => Promise<Product>;
  deleteProduct: (id: string) => Promise<void>;
  saveCategory: (c: Category, isNew?: boolean) => Promise<Category>;
  deleteCategory: (id: string) => Promise<void>;
  saveCoupon: (c: Coupon, isNew?: boolean) => Promise<Coupon>;
  deleteCoupon: (id: string) => Promise<void>;
  updateOrder: (number: string, patch: { status?: OrderStatus; trackingNumber?: string | null }) => Promise<Order>;
  saveSettings: (s: StoreSettings) => Promise<StoreSettings>;
}

const EMPTY: Bootstrap = {
  collections: [],
  categories: [],
  coupons: [],
  settings: { freeShippingThreshold: 999, shippingFee: 79, contactEmail: "", contactPhone: "", businessHours: "", instagram: "", lowStockThreshold: 5 },
  unreadMessages: 0,
  pendingOrders: 0,
  categoryCounts: {},
  integrations: { razorpay: false, cloudinary: false, email: false },
};

const AdminContext = createContext<AdminContextType | null>(null);

const swap = <T extends { id: string }>(list: T[], item: T, prepend = true) => (list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : prepend ? [item, ...list] : [...list, item]);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Bootstrap>(EMPTY);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const d = await api<Bootstrap>("/api/admin/bootstrap");
      setData(d);
      setError(null);
    } catch (e) {
      if ((e as { status?: number }).status === 401) {
        window.location.href = "/admin/login";
        return;
      }
      setError(e instanceof Error ? e.message : "Could not load data");
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<AdminContextType>(
    () => ({
      ...data,
      ready,
      error,
      refresh,
      getCategory: (id) => data.categories.find((c) => c.id === id),

      saveProduct: async (p) => {
        const exists = p.id !== "new";
        const payload = {
          name: p.name,
          slug: p.slug,
          categoryId: p.categoryId,
          price: p.price,
          originalPrice: p.originalPrice ?? null,
          shortDescription: p.shortDescription,
          description: p.description,
          material: p.material,
          careInstructions: p.careInstructions,
          features: p.features,
          images: p.images,
          stock: p.stock,
          status: p.status,
          isFeatured: p.isFeatured,
          isBestSeller: p.isBestSeller,
          isNew: p.isNew,
        };
        const r = await api<{ product: Product }>(exists ? `/api/admin/products/${p.id}` : "/api/admin/products", { method: exists ? "PUT" : "POST", body: payload });
        void refresh(); // category product counts
        return r.product;
      },
      deleteProduct: async (id) => {
        await api(`/api/admin/products/${id}`, { method: "DELETE" });
        void refresh();
      },

      saveCategory: async (c, isNew) => {
        const exists = !isNew && data.categories.some((x) => x.id === c.id);
        const payload = { name: c.name, slug: c.slug, collectionId: c.collectionId, description: c.description, kind: c.kind, sortOrder: c.sortOrder, active: c.active, showOnHome: c.showOnHome };
        const r = await api<{ category: Category }>(exists ? `/api/admin/categories/${c.id}` : "/api/admin/categories", { method: exists ? "PUT" : "POST", body: payload });
        setData((d) => ({ ...d, categories: swap(d.categories, r.category, false) }));
        return r.category;
      },
      deleteCategory: async (id) => {
        await api(`/api/admin/categories/${id}`, { method: "DELETE" });
        setData((d) => ({ ...d, categories: d.categories.filter((c) => c.id !== id) }));
      },

      saveCoupon: async (c, isNew) => {
        const exists = !isNew && data.coupons.some((x) => x.id === c.id);
        const payload = {
          code: c.code,
          description: c.description,
          type: c.type,
          value: c.value,
          minOrder: c.minOrder,
          maxDiscount: c.maxDiscount ?? null,
          usageLimit: c.usageLimit ?? null,
          perCustomerLimit: c.perCustomerLimit ?? null,
          firstOrderOnly: c.firstOrderOnly,
          expiresAt: c.expiresAt,
          active: c.active,
        };
        const r = await api<{ coupon: Coupon }>(exists ? `/api/admin/coupons/${c.id}` : "/api/admin/coupons", { method: exists ? "PUT" : "POST", body: payload });
        setData((d) => ({ ...d, coupons: swap(d.coupons, r.coupon) }));
        return r.coupon;
      },
      deleteCoupon: async (id) => {
        await api(`/api/admin/coupons/${id}`, { method: "DELETE" });
        setData((d) => ({ ...d, coupons: d.coupons.filter((c) => c.id !== id) }));
      },

      updateOrder: async (number, patch) => {
        const r = await api<{ order: Order }>(`/api/admin/orders/${encodeURIComponent(number)}`, { method: "PUT", body: patch });
        void refresh(); // pending count, coupon usage
        return r.order;
      },

      saveSettings: async (s) => {
        const r = await api<{ settings: StoreSettings }>("/api/admin/settings", { method: "PUT", body: s });
        setData((d) => ({ ...d, settings: r.settings }));
        return r.settings;
      },
    }),
    [data, ready, error, refresh],
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used within AdminProvider");
  return ctx;
}
