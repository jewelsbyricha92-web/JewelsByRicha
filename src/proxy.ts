import { NextResponse, type NextRequest } from "next/server";
import { unsealData } from "iron-session";
import { getSecret } from "@/lib/server/secret";

/**
 * First line of defence, runs before every page and API call:
 *  1. CSRF: browser-originated writes must come from our own site (Origin / Sec-Fetch-Site check).
 *  2. A coarse per-IP flood limiter for /api (fine-grained, database-backed limits live in each route).
 *  3. Sends visitors without a valid session away from /admin and /account, and rejects unauthenticated /api/admin calls.
 * Every route handler ALSO re-checks the session and role against the database.
 */

// ---- coarse limiter (per server instance) ----
const WINDOW_MS = 60_000;
const MAX_API_PER_WINDOW = 300;
const hits = new Map<string, { n: number; reset: number }>();

function floodLimited(ip: string) {
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || h.reset < now) {
    hits.set(ip, { n: 1, reset: now + WINDOW_MS });
    if (hits.size > 5000) for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
    return false;
  }
  h.n += 1;
  return h.n > MAX_API_PER_WINDOW;
}

async function hasSession(req: NextRequest, cookie: string, role?: string) {
  const raw = req.cookies.get(cookie)?.value;
  if (!raw) return false;
  try {
    const data = await unsealData<{ userId?: string; role?: string }>(raw, { password: getSecret() });
    return !!data.userId && (!role || data.role === role);
  } catch {
    return false;
  }
}

const json = (error: string, status: number) => NextResponse.json({ error }, { status });

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const method = req.method;

  if (pathname.startsWith("/api/")) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
    if (floodLimited(ip)) return json("Too many requests. Please slow down.", 429);

    // CSRF defence for cookie-authenticated writes. The payment webhook is server-to-server (verified by signature), and cron uses a secret.
    const isWrite = method !== "GET" && method !== "HEAD" && method !== "OPTIONS";
    if (isWrite && pathname !== "/api/payments/webhook") {
      const site = req.headers.get("sec-fetch-site");
      if (site && site !== "same-origin" && site !== "none") return json("Cross-site request blocked", 403);
      const origin = req.headers.get("origin");
      if (origin) {
        try {
          if (new URL(origin).host !== req.headers.get("host")) return json("Cross-site request blocked", 403);
        } catch {
          return json("Bad origin", 403);
        }
      }
    }

    if (pathname.startsWith("/api/admin")) {
      if (pathname === "/api/admin/login") return NextResponse.next();
      if (!(await hasSession(req, "jbr_admin", "ADMIN"))) return json("Unauthorized", 401);
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") return NextResponse.next();
    if (!(await hasSession(req, "jbr_admin", "ADMIN"))) return NextResponse.redirect(new URL("/admin/login", req.url));
    return NextResponse.next();
  }

  if (pathname.startsWith("/account")) {
    if (!(await hasSession(req, "jbr_session"))) {
      const url = new URL("/login", req.url);
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*", "/account/:path*", "/api/:path*"] };
