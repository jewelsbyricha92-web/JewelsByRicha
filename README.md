# Jewels by Richa

E-commerce website and admin panel for **Jewels by Richa** — anti-tarnish, waterproof jewellery.
Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · PostgreSQL + Prisma.

## Run it locally

Prerequisites: Node 20+, a PostgreSQL database.

```bash
npm install
cp .env.example .env          # then fill in JBR_DATABASE_URL, SESSION_SECRET, ADMIN_SEED_PASSWORD
npx prisma migrate dev        # creates the tables
npm run db:seed               # collections, categories, sample products, coupons, admin user
npm run dev                   # http://localhost:3010
```

- Storefront: `/`  ·  Admin: `/admin` (sign in with `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD`)
- With no Razorpay / Cloudinary / SMTP keys the site still works end to end locally: online payments run in a
  mock mode (disabled in production), photos are saved to `public/uploads`, and emails (OTP, order updates)
  are printed in the server console.
- `npm run db:studio` opens a visual database browser.
- `npm run test:smoke` runs 50+ end-to-end checks against the running server (needs `ADMIN_SEED_PASSWORD` in `.env`; it creates and cancels a few test orders, so don't point it at production).
- `GET /api/health` is the uptime-check endpoint. Unpaid online orders are released automatically whenever an order is placed or the admin panel is opened; `/api/cron/expire-orders` (secured by `CRON_SECRET`) can also be called by any external scheduler if you want a fixed schedule.

## What's in the box

| Area | Highlights |
|---|---|
| Storefront | Catalogue rendered from the database, search, wishlist (synced to the account), cart, checkout with coupon, UPI / card (prepaid only), order tracking |
| Customer accounts | Register with emailed OTP, login, forgot-password, saved addresses, order history, pay-again |
| Admin | Dashboard, products (photo upload), categories, orders (status, tracking), customers, coupons, settings |
| Backend | Server-side pricing, atomic stock & coupon handling, Razorpay verify + webhook, rate limiting, signed sessions |

Every feature, security measure and limitation: **[FEATURES.md](FEATURES.md)**. Design notes and roadmap: [BACKEND_PLAN.md](BACKEND_PLAN.md). Client information checklist: [docs/](docs).

## Going live

Set real values for every key in `.env.example` on the host (Vercel + Neon Postgres + Cloudinary + Razorpay + SMTP),
run `npx prisma migrate deploy` and `npm run db:seed` once (use a strong `ADMIN_SEED_PASSWORD` and `SEED_DEMO_DATA="false"`),
and add the Razorpay webhook `https://<your-domain>/api/payments/webhook` (events `payment.captured`, `payment.failed`).
