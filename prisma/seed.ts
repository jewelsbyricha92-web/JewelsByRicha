/**
 * Seeds the database: store settings, the two collections, 19 categories, sample products, coupons and the admin user.
 * With SEED_DEMO_DATA=true it also adds sample customers and orders so the dashboard has something to show.
 *
 * Safe to run more than once (everything is upserted). Run with:  npx prisma db seed
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { COLLECTIONS, CATEGORIES } from "./seed-data/catalog";
import { PRODUCTS } from "./seed-data/products";
import { COUPONS, DEMO_CUSTOMERS, buildDemoOrders } from "./seed-data/demo";

const prisma = new PrismaClient();

const DEFAULT_SETTINGS = {
  freeShippingThreshold: 999,
  shippingFee: 79,
  contactEmail: "jewelsbyricha92@gmail.com",
  contactPhone: "+91 97110 57258",
  businessHours: "Monday to Saturday, 10:00 a.m. to 6:00 p.m.",
  instagram: "jewels_by_richa",
  lowStockThreshold: 5,
};

async function main() {
  // settings (never overwrite values the admin already changed)
  await prisma.siteSettings.upsert({ where: { key: "store" }, update: {}, create: { key: "store", value: DEFAULT_SETTINGS } });

  // catalogue
  for (const [i, c] of COLLECTIONS.entries()) {
    await prisma.collection.upsert({
      where: { slug: c.slug },
      update: {},
      create: { id: c.id, name: c.name, slug: c.slug, tagline: c.tagline, description: c.description, sortOrder: i },
    });
  }
  for (const c of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: { id: c.id, collectionId: c.collectionId, name: c.name, slug: c.slug, description: c.description, artKind: c.kind, sortOrder: c.sortOrder, active: c.active, showOnHome: c.showOnHome },
    });
  }

  for (const p of PRODUCTS) {
    const exists = await prisma.product.findUnique({ where: { slug: p.slug }, select: { id: true } });
    if (exists) continue;
    await prisma.product.create({
      data: {
        id: p.id,
        name: p.name,
        slug: p.slug,
        collectionId: p.collectionId,
        categoryId: p.categoryId,
        price: p.price,
        originalPrice: p.originalPrice ?? null,
        shortDescription: p.shortDescription,
        description: p.description,
        material: p.material,
        careInstructions: p.careInstructions,
        features: p.features,
        stock: p.stock,
        status: p.status,
        badge: p.badge ?? null,
        isFeatured: p.isFeatured,
        isBestSeller: p.isBestSeller,
        isNew: p.isNew,
        rating: p.rating,
        reviewCount: p.reviewCount,
        createdAt: new Date(p.createdAt),
        images: { create: p.images.map((url, sortOrder) => ({ url, sortOrder })) },
      },
    });
  }

  for (const c of COUPONS) {
    const data = { ...c, expiresAt: new Date(`${c.expiresAt}T23:59:59+05:30`), usedCount: 0 };
    await prisma.coupon.upsert({ where: { code: c.code }, update: {}, create: data });
  }

  // admin
  const adminEmail = (process.env.ADMIN_SEED_EMAIL || "admin@jewelsbyricha.in").toLowerCase();
  const adminPassword = process.env.ADMIN_SEED_PASSWORD;
  if (!adminPassword) throw new Error("Set ADMIN_SEED_PASSWORD in .env before seeding.");
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: "ADMIN" },
    create: { name: "Richa", email: adminEmail, passwordHash: await bcrypt.hash(adminPassword, 12), role: "ADMIN" },
  });

  // demo customers and orders
  if (process.env.SEED_DEMO_DATA === "true") {
    const unusable = await bcrypt.hash(crypto.randomBytes(24).toString("hex"), 10);
    const userIds = new Map<string, string>();
    for (const c of DEMO_CUSTOMERS) {
      const u = await prisma.user.upsert({
        where: { email: c.email },
        update: {},
        create: { name: c.name, email: c.email, phone: c.phone, passwordHash: unusable, createdAt: new Date(`${c.joined}T10:00:00+05:30`) },
      });
      userIds.set(c.email, u.id);
    }
    const welcome = await prisma.coupon.findUnique({ where: { code: "WELCOME10" } });
    for (const o of buildDemoOrders(new Date())) {
      if (await prisma.order.findUnique({ where: { number: o.number } })) continue;
      const order = await prisma.order.create({
        data: {
          number: o.number,
          userId: userIds.get(o.customerEmail),
          customerName: o.customerName,
          email: o.customerEmail,
          phone: o.phone,
          shippingAddress: o.address,
          subtotal: o.subtotal,
          discount: o.discount,
          shipping: o.shipping,
          codFee: o.codFee,
          total: o.total,
          couponCode: o.couponCode,
          paymentMethod: o.paymentMethod,
          paymentStatus: o.paymentStatus,
          status: o.status,
          trackingNumber: o.trackingNumber,
          stockRestored: o.status === "CANCELLED",
          createdAt: o.createdAt,
          items: { create: o.items },
        },
      });
      if (o.couponCode && welcome) {
        await prisma.couponUsage.create({ data: { couponId: welcome.id, orderId: order.id, email: o.customerEmail } });
        await prisma.coupon.update({ where: { id: welcome.id }, data: { usedCount: { increment: 1 } } });
      }
    }
  }

  // next order number
  const last = await prisma.order.findMany({ select: { number: true } });
  const max = last.reduce((m, o) => Math.max(m, parseInt(o.number.replace(/\D/g, ""), 10) || 0), 1000);
  await prisma.counter.upsert({ where: { key: "order" }, update: { value: max }, create: { key: "order", value: max } });

  console.log(`Seeded: ${COLLECTIONS.length} collections, ${CATEGORIES.length} categories, ${PRODUCTS.length} products, admin ${adminEmail}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
