# Jewels by Richa — Feature List

Everything this project does today. Items marked **(needs keys)** are fully built but can only be verified live once the client's Razorpay / Cloudinary / email accounts are connected.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · PostgreSQL + Prisma · iron-session · Zod · Razorpay · Cloudinary · Nodemailer.

---

## 1. Storefront (customer website)

### Browsing
- **Premium design** in the brand's gold / ivory / black palette with serif + script typography, built to look right on phones, tablets and desktops.
- **Homepage:** three-slide photo hero (auto-play, arrows, dots), trust strip, two collection banners, **"Shop by category" (max 8, chosen in admin) with a "View all categories" link**, bestsellers with Festive / Anti Tarnish tabs, brand story, new arrivals, festive banner, customer reviews, Instagram gallery.
- **Two collections, 19 categories** (Festive Collection: Kashmiri Watches, Necklaces, Heritage Bangle Kada, Pendant Sets, AD Bangle Kada, Kashmiri Earrings, Moissanite Earrings, Festive Bracelets, Stud Earrings · Anti Tarnish: Mangalsutra, Bracelet Kada, Chain Bracelets, Rings, Hoop Earrings, Danglers Earrings, Studs Earrings, Chain Necklaces, Combo Necklace Packs, Watches).
- **Navigation:** sticky header with collection mega-menus, mobile slide-in menu, rotating announcement bar (free-shipping line comes from admin settings).
- **Shop pages** for everything, a collection, or a single category — with sorting (featured, newest, price, rating), price-band and in-stock filters, category chips, and **"Show more" pagination** (12 at a time with a progress indicator).
- **Dedicated pages:** All categories, Bestsellers, New arrivals, Collections.
- **Search overlay** with instant results (name and category).
- **Product page:** photo gallery (thumbnails on desktop, swipe on phones), price with MRP and % off, rating, feature chips, stock status ("Only 3 left"), quantity selector, Add to bag / Buy now, wishlist, accordion for description / material / care / shipping, "You may also love", and a **sticky add-to-bag bar on phones**.
- **Illustrated placeholders** appear automatically for any product that has no photo yet.

### Bag, wishlist & checkout
- **Slide-out bag** and full **bag page** with free-shipping progress bar, quantity edits, remove, "Complete the look" suggestions, step indicator, sticky checkout button on phones.
- **Wishlist:** works for guests (in the browser) and is **saved to the account** after sign-in (guest items are merged in).
- **Checkout:** contact + delivery form (pre-filled from the account and default address), saved-address picker, **live coupon check** (re-validated when the bag or payment method changes), UPI / card / Cash on Delivery, collapsible order summary and sticky pay button on phones, clear error messages.
- **Order confirmation page**, guest orders supported.

### Customer accounts
- **Register with an emailed 6-digit OTP**, sign in, **forgot / reset password** (OTP), sign out.
- **Account area:** overview (orders, wishlist, total spent), **order history with "show older orders" pagination**, order detail with a progress tracker and tracking number, **cancel an order** (while allowed), **pay again** for an unpaid online order, saved addresses (add / delete / default), profile edit.
- Guest orders placed earlier with the same email are **attached automatically** when the customer signs up or signs in.

### Content pages
About, Care guide, FAQ, Contact (messages are saved and appear in admin), Shipping & returns (uses the live fee settings), Privacy policy, Terms. Policy wording is placeholder until the client supplies it.

### SEO
Server-rendered catalogue pages, per-page titles and descriptions, Open Graph tags, **product structured data (JSON-LD)**, `sitemap.xml` and `robots.txt` generated from the database, real **404 status** for unknown products, collections and categories.

---

## 2. Admin panel (`/admin`)

Responsive (sidebar collapses to a menu on tablets and phones; lists turn into cards on phones). Separate secure login.

| Page | What the admin can do |
|---|---|
| **Dashboard** | Revenue, order count (with pending), customers, products; 30-day sales chart; top categories; recent orders; low-stock list. All numbers are aggregated in the database. |
| **Products** | **Server-side paginated list (20/page)** with search, category, status (active/draft) and stock filters; one-click publish/unpublish; add / edit / delete. The form has **photo upload (multiple, reorder, cover photo)**, URL paste, price + MRP, stock, badges (featured / bestseller / new), features, material, care text and SEO slug. |
| **Categories** | Grouped by collection; add / edit / delete (blocked while it still has products), show / hide, **choose which (max 8) appear on the homepage**, sort order, URL slug. |
| **Orders** | **Paginated** with status tabs and live counts and search (order no., name, email, phone). Order detail: items, totals, customer and address, change status (Pending → Confirmed → Shipped → Delivered / Cancelled), add **tracking number**, **cancel** (restocks and releases the coupon), and a warning when a paid order needs a refund. Customers are emailed on ship / cancel. |
| **Customers** | **Paginated** list with search, order count and total spent; customer detail with order history. |
| **Coupons** | Create / edit / delete / enable. Percent or flat, minimum order, maximum discount, expiry date, total usage limit, **per-customer limit**, **first-order-only**, valid-on-COD switch, live usage count. |
| **Messages** | Contact-form inbox (paginated, unread filter, mark handled, delete) and newsletter subscriber count. |
| **Settings** | Free-shipping threshold, shipping fee, COD fee and on/off, low-stock alert level, store email / phone / hours / Instagram, **change admin password**, and a status panel showing which integrations (Razorpay, Cloudinary, email) are connected. |

Sidebar badges show pending orders and unread messages.

---

## 3. Backend & database

- **PostgreSQL** with Prisma migrations and a **seed script** (settings, 2 collections, 19 categories, 57 sample products, 4 coupons, admin user; optional demo customers and orders).
- **Tables:** User, Address, Collection, Category, Product, ProductImage, Order, OrderItem, Payment, WebhookEvent, Coupon, CouponUsage, WishlistItem, ContactMessage, Subscriber, VerificationCode, RateLimit, SiteSettings, Counter.
- **Orders are priced on the server** from the database — the browser only sends product ids and quantities, so prices can't be tampered with.
- **Atomic checkout:** stock reservation and coupon consumption happen in one database transaction; overselling and double coupon use are prevented. Order numbers (`JBR-1001…`) come from an atomic counter.
- **Cancel / expiry** returns stock and the coupon use. Unpaid online orders are **auto-cancelled after 1 hour** (cleaned up on the next order or admin visit).
- **Payments (needs keys):** Razorpay order creation, **signature verification + a second check against Razorpay's API** (amount and order must match), idempotent **webhook** (duplicate events ignored), retry-payment for pending orders. Without keys, a **mock payment mode** works in development only and is disabled in production.
- **Emails (needs keys):** OTP, order confirmation, shipped, cancelled, contact notification — branded HTML + plain text. In development they print to the server console.
- **Uploads (needs keys for Cloudinary):** type is verified from the file's actual bytes (JPEG / PNG / WEBP), 8 MB limit; Cloudinary in production, local disk in development.
- **Editable settings** stored in the database, applied across the storefront (bag, checkout, policy page, footer, announcement bar).

### API summary
`/api/auth/*` (register, verify-otp, login, logout, me, profile, forgot, reset) · `/api/account/*` (addresses, orders, cancel) · `/api/wishlist` · `/api/orders` · `/api/coupons/validate` · `/api/payments/*` (create-order, verify, webhook) · `/api/contact` · `/api/newsletter` · `/api/health` · `/api/cron/expire-orders` · `/api/admin/*` (login, logout, me, bootstrap, stats, products, categories, coupons, orders, customers, messages, settings, password, upload).

---

## 4. Security

- **Authentication:** passwords hashed with bcrypt (cost 12); customer and admin use **separate encrypted, httpOnly, SameSite cookies** (admin sessions last 12 h); admin role is re-checked in the database on every request; constant-time comparisons; no user-enumeration on login and forgot-password.
- **OTP safety:** hashed at rest, 10-minute expiry, single use, attempt-limited.
- **Rate limiting (three layers):**
  1. a per-IP flood limiter on every `/api` call (300 / min);
  2. a database-backed limit on **every write** (240 / min per IP);
  3. strict per-route limits — login (8 per email / 20 per IP per 15 min), registration, OTP, password reset, admin login (6 / 15 min), order placement, payments, coupon checks, contact (5 / hour), newsletter, admin password change.
- **CSRF protection:** cross-site browser writes are rejected (Origin + Sec-Fetch-Site checks) on top of SameSite cookies.
- **Access control:** `proxy.ts` guards `/admin`, `/account` and `/api/admin`; each handler re-verifies; customers can only see their own orders; guests need an unguessable signed order token.
- **Input validation:** every API input is validated with Zod; image URLs must be `https://` or uploaded files (no `javascript:`); emails HTML-escaped; JSON-LD escaped.
- **HTTP security headers (production):** Content-Security-Policy (only Razorpay + Cloudinary allowed externally), HSTS, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy, COOP; admin and API responses are `no-store` and admin pages `noindex`.
- **Secrets:** all keys come from environment variables; the app refuses to start in production without `SESSION_SECRET`; `.env` is git-ignored.
- **Dependencies:** `npm audit` is clean (Next.js and Nodemailer upgraded to patched versions).

## 5. Reliability & performance

- `/api/health` endpoint (checks the database) for uptime monitors.
- Abandoned-order cleanup: unpaid online orders are released automatically whenever an order is placed or the admin panel is opened. A secured endpoint (`/api/cron/expire-orders`, `CRON_SECRET`) is available if a fixed schedule is wanted later — no Vercel cron is configured, so the free Hobby plan works.
- **Pagination everywhere it matters:** admin products, orders, customers, messages; customer order history; shop listing.
- Lean storefront payload (long text fields omitted from listing data; full detail loaded per product), lazy-loaded images, database indexes on the hot query columns, aggregated dashboard queries.
- Error pages: friendly error screens with a reference code for store and admin, a last-resort global error page, custom 404.
- Defensive UI: loading and empty states, failed-request messages, disabled buttons while saving, duplicate-submit protection.

## 6. Developer tooling

- `npm run dev` / `build` / `start` · `npm run db:migrate` / `db:seed` / `db:studio` · `npm run typecheck`
- **`npm run test:smoke`** — 50+ automated end-to-end checks against a running server (health, access control, CSRF, admin login, pagination, coupons, ordering, stock, cancel/restock, uploads, registration + OTP, password reset, rate limiting).
- `.env.example` documents every setting; `README.md` has the setup steps; `BACKEND_PLAN.md` holds the design notes; `docs/` holds the client information checklist (PDF).

---

## 7. Not done yet / needs the client

- Connect the client's own accounts: **Razorpay** (live payments + webhook), **Cloudinary** (image storage), **SMTP email**, domain, Vercel hosting and Neon database — then run a live test of each.
- Replace sample products, photos, reviews and policy text with real ones (see the checklist PDF).
- Not built in this version: automated refunds (refund manually in Razorpay), GST invoices, courier / shipping-label integration, product reviews by customers, multi-staff admin roles, multi-language.
