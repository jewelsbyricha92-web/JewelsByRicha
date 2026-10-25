/**
 * End-to-end smoke test against a RUNNING server (npm run dev / npm start).
 *   npm run test:smoke                      -> http://localhost:3010
 *   BASE_URL=https://staging.example npm run test:smoke
 * Reads ADMIN_SEED_EMAIL / ADMIN_SEED_PASSWORD from .env. Creates a couple of test orders and cancels them again
 * (stock and coupon usage are restored). Do not run against production.
 */
import "dotenv/config";

const BASE = process.env.BASE_URL || "http://localhost:3010";
const ADMIN_EMAIL = process.env.ADMIN_SEED_EMAIL || "admin@jewelsbyricha.in";
const ADMIN_PASSWORD = process.env.ADMIN_SEED_PASSWORD;

let passed = 0;
const failures = [];
const ok = (cond, name, extra = "") => {
  if (cond) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failures.push(name);
    console.log(`  ✗ ${name} ${extra}`);
  }
};

class Client {
  jar = new Map();
  async req(path, { method = "GET", body, headers = {}, raw } = {}) {
    const h = { ...headers };
    if (body && !raw) h["content-type"] = "application/json";
    if (this.jar.size) h.cookie = [...this.jar].map(([k, v]) => `${k}=${v}`).join("; ");
    const res = await fetch(BASE + path, { method, headers: h, body: raw ? body : body ? JSON.stringify(body) : undefined, redirect: "manual" });
    for (const c of res.headers.getSetCookie?.() ?? []) {
      const [pair] = c.split(";");
      const i = pair.indexOf("=");
      const name = pair.slice(0, i);
      const val = pair.slice(i + 1);
      if (/max-age=0|expires=thu, 01 jan 1970/i.test(c) || val === "") this.jar.delete(name);
      else this.jar.set(name, val);
    }
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {}
    return { status: res.status, json, text, headers: res.headers };
  }
}

const address = { name: "Smoke Test", phone: "9876543210", line: "1 Test Street", city: "Jaipur", state: "Rajasthan", pincode: "302001" };

async function main() {
  console.log(`Smoke test against ${BASE}\n`);
  const anon = new Client();
  const admin = new Client();

  console.log("Health & public pages");
  const health = await anon.req("/api/health");
  ok(health.status === 200 && health.json?.status === "ok", "health endpoint reports ok");
  ok((await anon.req("/")).status === 200, "home page renders");
  ok((await anon.req("/shop")).status === 200, "shop page renders");
  ok((await anon.req("/robots.txt")).status === 200, "robots.txt served");
  ok((await anon.req("/sitemap.xml")).status === 200, "sitemap.xml served");
  ok((await anon.req("/product/this-does-not-exist")).status === 404, "unknown product is a real 404");

  console.log("\nAccess control & CSRF");
  ok((await anon.req("/api/admin/bootstrap")).status === 401, "admin API refuses anonymous visitors");
  ok((await anon.req("/admin")).status === 307, "admin page redirects anonymous visitors to login");
  ok((await anon.req("/account/orders")).status === 307, "account page redirects anonymous visitors to login");
  const csrf = await anon.req("/api/newsletter", { method: "POST", body: { email: "x@example.com" }, headers: { origin: "https://evil.example" } });
  ok(csrf.status === 403, "cross-site POST is blocked", `(got ${csrf.status})`);
  ok((await anon.req("/api/admin/login", { method: "POST", body: { email: ADMIN_EMAIL, password: "definitely-wrong" } })).status === 401, "wrong admin password rejected");

  if (!ADMIN_PASSWORD) {
    console.log("\nSet ADMIN_SEED_PASSWORD in .env to run the admin and order checks.");
    return;
  }
  const login = await admin.req("/api/admin/login", { method: "POST", body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } });
  ok(login.status === 200, "admin login works");

  console.log("\nAdmin data & pagination");
  const boot = await admin.req("/api/admin/bootstrap");
  ok(boot.status === 200 && boot.json.categories.length > 0, "bootstrap returns categories");
  const page1 = await admin.req("/api/admin/products?page=1&pageSize=5");
  ok(page1.json?.products?.length === 5 && page1.json.total >= 5 && page1.json.pages >= 1, "products are paginated", JSON.stringify({ n: page1.json?.products?.length, total: page1.json?.total }));
  const search = await admin.req("/api/admin/products?q=kada&pageSize=50");
  ok(search.json?.products?.every((p) => /kada/i.test(p.name)) && search.json.products.length > 0, "product search filters on the server");
  ok((await admin.req("/api/admin/orders?page=1")).json?.counts?.ALL >= 0, "orders list returns status counts");
  ok((await admin.req("/api/admin/stats")).json?.daily?.length === 30, "dashboard stats return 30 days");
  ok((await admin.req("/api/admin/customers?page=1")).status === 200, "customers list works");

  console.log("\nOrders, coupons and stock");
  const target = page1.json.products.find((p) => p.status === "ACTIVE" && p.stock >= 3) ?? (await admin.req("/api/admin/products?stock=ok&status=ACTIVE&pageSize=1")).json.products[0];
  const stockOf = async () => (await admin.req(`/api/admin/products/${target.id}`)).json.product.stock;
  const before = await stockOf();
  const email = `smoke+${Date.now()}@example.com`;
  const lines = [{ productId: target.id, quantity: 2 }];

  const preview = await anon.req("/api/coupons/validate", { method: "POST", body: { code: "welcome10", lines, paymentMethod: "UPI", email } });
  ok(preview.status === 200 && preview.json.discount > 0, "WELCOME10 previews a discount", JSON.stringify(preview.json));
  const codRefused = await anon.req("/api/orders", { method: "POST", body: { lines, email, address, paymentMethod: "COD" } });
  ok(codRefused.status === 400, "Cash on Delivery orders are refused (prepaid only)");

  const placed = await anon.req("/api/orders", { method: "POST", body: { lines, email, address, paymentMethod: "UPI", couponCode: "WELCOME10" } });
  ok(placed.status === 201 && /^JBR-\d+$/.test(placed.json?.order?.id ?? ""), "guest prepaid order is created", placed.text.slice(0, 200));
  const order = placed.json?.order;
  if (order) {
    ok(order.subtotal === target.price * 2, "server prices the order from the database");
    ok(order.total === order.subtotal - order.discount + order.shipping, "totals add up");
    ok((await stockOf()) === before - 2, "stock is reserved by the order");
    ok((await anon.req(`/api/orders/${order.id}`)).status === 404, "order is private without its token");
    ok((await anon.req(`/api/orders/${order.id}?token=${placed.json.token}`)).status === 200, "order is visible with its token");

    const again = await anon.req("/api/orders", { method: "POST", body: { lines, email, address, paymentMethod: "UPI", couponCode: "WELCOME10" } });
    ok(again.status === 400, "first-order-only coupon can't be reused", again.text.slice(0, 120));
    if (again.status === 201) await admin.req(`/api/admin/orders/${again.json.order.id}`, { method: "PUT", body: { status: "CANCELLED" } });

    const oversell = await anon.req("/api/orders", { method: "POST", body: { lines: [{ productId: target.id, quantity: 10 }], email, address, paymentMethod: "UPI" } });
    ok(oversell.status === 409 || oversell.status === 201, "over-ordering is handled");
    if (oversell.status === 201) await admin.req(`/api/admin/orders/${oversell.json.order.id}`, { method: "PUT", body: { status: "CANCELLED" } });

    ok((await admin.req(`/api/admin/orders/${order.id}`, { method: "PUT", body: { status: "CONFIRMED" } })).json?.order?.status === "CONFIRMED", "admin can confirm the order");
    const cancelled = await admin.req(`/api/admin/orders/${order.id}`, { method: "PUT", body: { status: "CANCELLED" } });
    ok(cancelled.json?.order?.status === "CANCELLED", "admin can cancel the order");
    ok((await stockOf()) === before, "cancelling restores stock");
    ok((await admin.req(`/api/admin/orders/${order.id}`, { method: "PUT", body: { status: "SHIPPED" } })).status === 400, "a cancelled order can't be reopened");
  }

  console.log("\nCustomer account");
  const cust = new Client();
  const cEmail = `smoke.customer+${Date.now()}@example.com`;
  const reg = await cust.req("/api/auth/register", { method: "POST", body: { name: "Smoke Customer", email: cEmail, password: "Smoke-pass-1" } });
  ok(reg.status === 200 && !!reg.json?.devOtp, "registration sends an OTP (dev mode returns it)", reg.text.slice(0, 120));
  ok((await cust.req("/api/auth/verify-otp", { method: "POST", body: { email: cEmail, otp: "000000" } })).status === 400, "wrong OTP rejected");
  const verified = await cust.req("/api/auth/verify-otp", { method: "POST", body: { email: cEmail, otp: reg.json?.devOtp } });
  ok(verified.status === 200, "correct OTP creates the account and signs in");
  ok((await cust.req("/api/auth/me")).json?.user?.email === cEmail, "session identifies the customer");
  ok((await cust.req("/api/admin/bootstrap")).status === 401, "customer session can't reach the admin API");
  const addr = await cust.req("/api/account/addresses", { method: "POST", body: address });
  ok(addr.status === 201 && addr.json.address.isDefault === true && !("userId" in addr.json.address), "address saved (first becomes default, no internal fields leaked)");
  const wl = await cust.req("/api/wishlist", { method: "POST", body: { productId: target.id } });
  ok(wl.status === 200 && (await cust.req("/api/wishlist")).json.ids.includes(target.id), "wishlist saved on the server");
  const myOrder = await cust.req("/api/orders", { method: "POST", body: { lines: [{ productId: target.id, quantity: 1 }], email: "ignored@example.com", address, paymentMethod: "UPI" } });
  ok(myOrder.status === 201 && myOrder.json.order.email === cEmail, "signed-in order uses the account email");
  const pay = await cust.req("/api/payments/create-order", { method: "POST", body: { orderNumber: myOrder.json.order.id } });
  ok(pay.status === 200 && (pay.json.mode === "mock" || pay.json.mode === "razorpay"), "payment can be started");
  if (pay.json?.mode === "mock") ok((await cust.req("/api/payments/verify", { method: "POST", body: { orderNumber: myOrder.json.order.id } })).json?.ok === true, "mock payment confirms the order");
  const mine = await cust.req("/api/account/orders?page=1&pageSize=5");
  ok(mine.json?.orders?.length === 1 && mine.json.total === 1, "account order history is paginated");
  const forgot = await anon.req("/api/auth/forgot", { method: "POST", body: { email: cEmail } });
  ok(forgot.status === 200 && !!forgot.json?.devOtp, "forgot-password sends a code");
  ok((await anon.req("/api/auth/reset", { method: "POST", body: { email: cEmail, otp: forgot.json.devOtp, password: "Brand-new-pass-2" } })).status === 200, "password reset with the code works");
  const relogin = new Client();
  ok((await relogin.req("/api/auth/login", { method: "POST", body: { email: cEmail, password: "Smoke-pass-1" } })).status === 401, "old password no longer works");
  ok((await relogin.req("/api/auth/login", { method: "POST", body: { email: cEmail, password: "Brand-new-pass-2" } })).status === 200, "new password works");
  ok((await cust.req("/api/auth/logout", { method: "POST" })).status === 200 && (await cust.req("/api/auth/me")).json?.user === null, "logout ends the session");
  await admin.req(`/api/admin/orders/${myOrder.json.order.id}`, { method: "PUT", body: { status: "CANCELLED" } }); // tidy up: restock

  console.log("\nValidation & uploads");
  ok((await anon.req("/api/orders", { method: "POST", body: { lines: [{ productId: target.id, quantity: -1 }], email, address, paymentMethod: "UPI" } })).status === 400, "negative quantity rejected");
  const bad = await admin.req("/api/admin/products", { method: "POST", body: { name: "X", categoryId: target.categoryId, price: 100, stock: 1, status: "ACTIVE", images: ["javascript:alert(1)"] } });
  ok(bad.status === 400, "unsafe image URL rejected");
  const fd = new FormData();
  fd.append("file", new Blob(["not an image"], { type: "image/jpeg" }), "fake.jpg");
  const fake = await admin.req("/api/admin/upload", { method: "POST", body: fd, raw: true });
  ok(fake.status === 400, "fake image upload rejected");

  console.log("\nRate limiting");
  let limited = false;
  for (let i = 0; i < 12; i++) {
    const r = await anon.req("/api/auth/login", { method: "POST", body: { email: `ratelimit${Date.now()}@example.com`.slice(0, 4) + "@example.com", password: "wrong" } });
    if (r.status === 429) {
      limited = true;
      break;
    }
  }
  ok(limited, "repeated failed logins get 429");
}

main()
  .catch((e) => {
    console.error("\nSmoke test crashed:", e);
    failures.push("crash");
  })
  .finally(() => {
    console.log(`\n${passed} passed, ${failures.length} failed${failures.length ? ": " + failures.join("; ") : ""}`);
    process.exit(failures.length ? 1 : 0);
  });
