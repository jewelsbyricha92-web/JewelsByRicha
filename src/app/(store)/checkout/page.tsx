"use client";

import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BadgeCheck, ChevronDown, Lock, ShieldCheck, Tag } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useCatalog } from "@/context/CatalogContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { computeTotals } from "@/lib/pricing";
import { api, ApiClientError } from "@/lib/client/api";
import { cn, formatPrice } from "@/lib/utils";
import { ProductVisual } from "@/components/ui/ProductVisual";
import { CheckoutSteps } from "@/components/ui/CheckoutSteps";
import type { Order, SavedAddress } from "@/types/shop";

export default function CheckoutPage() {
  const { items, subtotal, clearCart, ready } = useCart();
  const { settings } = useCatalog();
  const { user, ready: authReady } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [form, setForm] = useState({ name: "", email: "", phone: "", line: "", city: "", state: "", pincode: "" });
  const [saved, setSaved] = useState<SavedAddress[]>([]);
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState<{ code: string; discount: number } | null>(null);
  const [couponMsg, setCouponMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // guests confirm their email with a one-time code before paying (signed-in customers already have a verified email)
  const [emailToken, setEmailToken] = useState<string | null>(null);
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const [otpOpen, setOtpOpen] = useState(false);
  const [otp, setOtp] = useState('');
  const [verifyBusy, setVerifyBusy] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const emailNorm = form.email.trim().toLowerCase();
  const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailNorm);
  const emailVerified = !!user || (!!emailToken && verifiedEmail === emailNorm);

  // prefill from the signed-in customer and their default address
  useEffect(() => {
    if (!user) return;
    setForm((f) => ({ ...f, name: f.name || user.name, email: f.email || user.email, phone: f.phone || user.phone || "" }));
    api<{ addresses: SavedAddress[] }>("/api/account/addresses")
      .then((r) => {
        setSaved(r.addresses);
        const d = r.addresses.find((a) => a.isDefault) ?? r.addresses[0];
        if (d) setForm((f) => (f.line ? f : { ...f, name: d.name, phone: d.phone, line: d.line, city: d.city, state: d.state, pincode: d.pincode }));
      })
      .catch(() => {});
  }, [user]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const lines = items.map((i) => ({ productId: i.product.id, quantity: i.quantity }));

  const onEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setForm((f) => ({ ...f, email: v }));
    if (v.trim().toLowerCase() !== verifiedEmail) {
      setOtpOpen(false);
      setOtp('');
      setVerifyMsg(null);
    }
  };

  const sendCode = async () => {
    setVerifyMsg(null);
    setVerifyBusy(true);
    try {
      const r = await api<{ devOtp?: string }>('/api/checkout/email/send', { method: 'POST', body: { email: emailNorm } });
      setOtp('');
      setOtpOpen(true);
      setVerifyMsg({
        ok: true,
        text: r.devOtp ? `Local development: your code is ${r.devOtp}` : `We emailed a 6-digit code to ${emailNorm}. It can take a minute — check your spam folder too.`,
      });
    } catch (e) {
      setVerifyMsg({ ok: false, text: e instanceof Error ? e.message : 'Could not send the code. Please try again.' });
    } finally {
      setVerifyBusy(false);
    }
  };

  const confirmCode = async () => {
    if (!/^\d{6}$/.test(otp.trim())) return setVerifyMsg({ ok: false, text: 'Enter the 6-digit code from the email.' });
    setVerifyMsg(null);
    setVerifyBusy(true);
    try {
      const r = await api<{ token: string }>('/api/checkout/email/verify', { method: 'POST', body: { email: emailNorm, otp: otp.trim() } });
      setEmailToken(r.token);
      setVerifiedEmail(emailNorm);
      setOtpOpen(false);
      setOtp('');
      setVerifyMsg(null);
      setError(null);
    } catch (e) {
      setVerifyMsg({ ok: false, text: e instanceof Error ? e.message : 'Could not verify the code.' });
    } finally {
      setVerifyBusy(false);
    }
  };

  // an applied coupon is re-checked whenever the bag changes
  useEffect(() => {
    if (!applied) return;
    let cancelled = false;
    api<{ code: string; discount: number }>("/api/coupons/validate", { method: "POST", body: { code: applied.code, lines, email: form.email || undefined } })
      .then((r) => !cancelled && setApplied({ code: r.code, discount: r.discount }))
      .catch((e: Error) => {
        if (cancelled) return;
        setApplied(null);
        setCouponMsg({ ok: false, text: `${applied.code} removed: ${e.message}` });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal]);

  const totals = computeTotals(subtotal, applied?.discount ?? 0, settings);

  const apply = async () => {
    if (!code.trim()) return;
    try {
      const r = await api<{ code: string; discount: number }>("/api/coupons/validate", { method: "POST", body: { code, lines, email: form.email || undefined } });
      setApplied({ code: r.code, discount: r.discount });
      setCouponMsg({ ok: true, text: `${r.code} applied — you save ${formatPrice(r.discount)}` });
    } catch (e) {
      setApplied(null);
      setCouponMsg({ ok: false, text: e instanceof Error ? e.message : "Could not apply this coupon" });
    }
  };

  if (!ready || !authReady) return <div className="py-32 text-center text-muted">Loading…</div>;

  if (items.length === 0)
    return (
      <div className="py-32 text-center">
        <h1 className="font-serif text-4xl">Nothing to checkout</h1>
        <Link href="/shop" className="btn-dark mt-6">Shop jewellery</Link>
      </div>
    );

  const finish = (order: Order, token: string) => {
    try {
      sessionStorage.setItem("jbr_last_order", JSON.stringify({ order, token }));
    } catch {}
    clearCart();
    router.push(`/order-success?id=${order.id}`);
  };

  const place = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!emailVerified) {
      setError('Please verify your email address first — tap "Verify email" under the email box.');
      return;
    }
    setBusy(true);
    try {
      const res = await api<{ order: Order; token: string }>("/api/orders", {
        method: "POST",
        body: {
          lines,
          ...(user ? {} : { email: emailNorm, emailToken }),
          address: { name: form.name, phone: form.phone, line: form.line, city: form.city, state: form.state, pincode: form.pincode },
          couponCode: applied?.code ?? "",
        },
      });
      const { order, token } = res;

      const pay = await api<{ mode: "mock" | "razorpay"; keyId?: string; razorpayOrderId?: string; amount: number; name?: string; email?: string; phone?: string }>("/api/payments/create-order", {
        method: "POST",
        body: { orderNumber: order.id, token },
      });

      if (pay.mode === "mock") {
        await api("/api/payments/verify", { method: "POST", body: { orderNumber: order.id, token } });
        return finish({ ...order, paymentStatus: "PAID", status: "CONFIRMED" }, token);
      }

      if (!window.Razorpay) throw new Error("The payment window could not load. Please refresh and try again.");
      const rz = new window.Razorpay({
        key: pay.keyId,
        order_id: pay.razorpayOrderId,
        amount: pay.amount,
        currency: "INR",
        name: "Jewels by Richa",
        description: `Order ${order.id}`,
        prefill: { name: pay.name, email: pay.email, contact: pay.phone },
        theme: { color: "#B8913A" },
        handler: async (r: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            await api("/api/payments/verify", { method: "POST", body: { orderNumber: order.id, token, razorpayOrderId: r.razorpay_order_id, razorpayPaymentId: r.razorpay_payment_id, razorpaySignature: r.razorpay_signature } });
            finish({ ...order, paymentStatus: "PAID", status: "CONFIRMED" }, token);
          } catch (err) {
            setError(err instanceof Error ? err.message : "We could not confirm your payment. If money was deducted it will be reconciled automatically.");
            setBusy(false);
          }
        },
        modal: {
          ondismiss: () => {
            setBusy(false);
            setError(`Payment was not completed. Your order ${order.id} is saved — you can pay again from My account > Orders within the hour.`);
          },
        },
      });
      rz.on("payment.failed", () => setError("The payment failed. Please try again or choose another method."));
      rz.open();
    } catch (err) {
      setBusy(false);
      const msg = err instanceof ApiClientError || err instanceof Error ? err.message : "Could not place your order";
      setError(msg);
      showToast(msg);
    }
  };

  const payLabel = busy ? "Processing…" : `Pay ${formatPrice(totals.total)}`;

  const summary = (
    <>
      <ul className="mb-5 space-y-4">
        {items.map(({ product, quantity }) => (
          <li key={product.id} className="flex items-center gap-3 text-sm">
            <div className="relative h-16 w-14 shrink-0 overflow-hidden bg-cream">
              <ProductVisual product={product} />
              <span className="absolute right-0 top-0 flex h-5 min-w-5 items-center justify-center bg-ink px-1 text-[10px] text-ivory">{quantity}</span>
            </div>
            <span className="flex-1 font-serif text-lg leading-tight">{product.name}</span>
            <span className="font-medium">{formatPrice(product.price * quantity)}</span>
          </li>
        ))}
      </ul>

      <div className="mb-2 flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Coupon code" className="input !pl-9 uppercase" />
        </div>
        <button type="button" onClick={apply} className="btn-outline !px-5">Apply</button>
      </div>
      {couponMsg && <p className={cn("mb-3 text-xs", couponMsg.ok ? "text-emerald-700" : "text-red-700")}>{couponMsg.text}</p>}

      <dl className="space-y-2.5 border-t border-line pt-4 text-sm">
        <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatPrice(totals.subtotal)}</dd></div>
        {totals.discount > 0 && <div className="flex justify-between text-emerald-700"><dt>Discount ({applied?.code})</dt><dd>− {formatPrice(totals.discount)}</dd></div>}
        <div className="flex justify-between"><dt className="text-muted">Shipping</dt><dd>{totals.shipping === 0 ? "Free" : formatPrice(totals.shipping)}</dd></div>
        <div className="flex justify-between border-t border-line pt-3 text-lg font-medium"><dt>Total</dt><dd>{formatPrice(totals.total)}</dd></div>
      </dl>
    </>
  );

  return (
    <form onSubmit={place} className="mx-auto w-full max-w-6xl px-4 pb-28 pt-8 md:px-8 md:pb-20 md:pt-12">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <CheckoutSteps current={1} />

      <div className="mb-6 border border-line bg-white lg:hidden">
        <button type="button" onClick={() => setShowSummary((v) => !v)} className="flex w-full items-center justify-between px-4 py-3.5 text-sm">
          <span className="flex items-center gap-2 text-gold-deep">{showSummary ? "Hide" : "Show"} order summary <ChevronDown className={cn("h-4 w-4 transition-transform", showSummary && "rotate-180")} /></span>
          <span className="text-base font-medium">{formatPrice(totals.total)}</span>
        </button>
        {showSummary && <div className="border-t border-line p-4">{summary}</div>}
      </div>

      {error && <div role="alert" className="mb-6 border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}

      <div className="grid gap-8 lg:grid-cols-[1fr_400px] lg:gap-14">
        <div className="space-y-6">
          <section className="border border-line bg-white p-5 md:p-8">
            <h2 className="mb-5 flex items-center gap-3 font-serif text-2xl"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink font-sans text-xs text-ivory">1</span> Contact &amp; delivery</h2>
            {saved.length > 0 && (
              <div className="mb-5">
                <p className="label">Your saved addresses</p>
                <div className="flex flex-wrap gap-2">
                  {saved.map((a) => {
                    const active = a.line === form.line && a.pincode === form.pincode && a.name === form.name;
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, name: a.name, phone: a.phone, line: a.line, city: a.city, state: a.state, pincode: a.pincode }))}
                        className={cn("max-w-full border px-3 py-2 text-left text-xs transition-colors", active ? "border-gold bg-cream" : "border-line hover:border-gold")}
                      >
                        <span className="block font-medium">{a.name}{a.isDefault && <span className="ml-1.5 text-[10px] uppercase tracking-wider text-gold-deep">Default</span>}</span>
                        <span className="block truncate text-muted">{a.line}, {a.city} – {a.pincode}</span>
                      </button>
                    );
                  })}
                  <button type="button" onClick={() => setForm((f) => ({ ...f, line: "", city: "", state: "", pincode: "" }))} className="border border-dashed border-line px-3 py-2 text-xs text-muted hover:border-gold hover:text-ink">
                    + New address
                  </button>
                </div>
                <p className="mt-2 text-[11px] text-muted">New addresses are saved to your account automatically when you place an order.</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1"><Field label="Full name" value={form.name} onChange={set("name")} autoComplete="name" minLength={2} /></div>
              <div className="col-span-2 sm:col-span-1"><Field label="Phone" type="tel" inputMode="tel" value={form.phone} onChange={set("phone")} autoComplete="tel" minLength={7} /></div>
              <div className="col-span-2">
                <Field label="Email" type="email" value={form.email} onChange={onEmailChange} autoComplete="email" readOnly={!!user} />
                {user ? (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700"><BadgeCheck className="h-4 w-4" /> Verified — your order updates will be sent here.</p>
                ) : emailVerified ? (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700"><BadgeCheck className="h-4 w-4" /> Email verified</p>
                ) : (
                  <div className="mt-2">
                    <p className="text-xs text-muted">Please verify your email so we can send your order confirmation and tracking updates.</p>
                    <button type="button" onClick={sendCode} disabled={!emailLooksValid || verifyBusy} className="btn-outline mt-2 !px-5 !py-2.5 disabled:opacity-50">
                      {verifyBusy && !otpOpen ? 'Sending…' : otpOpen ? 'Resend code' : 'Verify email'}
                    </button>
                    {otpOpen && (
                      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                        <input
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); confirmCode(); } }}
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          placeholder="Enter 6-digit code"
                          aria-label="Email verification code"
                          className="input flex-1 tracking-[0.4em]"
                        />
                        <button type="button" onClick={confirmCode} disabled={verifyBusy || otp.length !== 6} className="btn-dark !px-6 disabled:opacity-50">{verifyBusy ? 'Checking…' : 'Verify'}</button>
                      </div>
                    )}
                    {verifyMsg && <p className={cn('mt-2 text-xs', verifyMsg.ok ? 'text-emerald-700' : 'text-red-700')}>{verifyMsg.text}</p>}
                  </div>
                )}
              </div>
              <div className="col-span-2"><Field label="Address" value={form.line} onChange={set("line")} autoComplete="street-address" minLength={5} /></div>
              <Field label="City" value={form.city} onChange={set("city")} />
              <Field label="State" value={form.state} onChange={set("state")} />
              <div className="col-span-2 sm:col-span-1"><Field label="PIN code" inputMode="numeric" value={form.pincode} onChange={set("pincode")} pattern="[1-9][0-9]{5}" title="6-digit PIN code" /></div>
            </div>
          </section>

          <section className="border border-line bg-white p-5 md:p-8">
            <h2 className="mb-5 flex items-center gap-3 font-serif text-2xl"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink font-sans text-xs text-ivory">2</span> Payment</h2>
            <div className="flex items-center gap-4 border border-gold bg-cream p-4">
              <ShieldCheck className="h-5 w-5 text-gold" strokeWidth={1.4} />
              <div className="flex-1">
                <div className="text-sm font-medium">Pay online</div>
                <div className="text-xs text-muted">UPI, cards, netbanking &amp; wallets — you&apos;ll choose on the next screen</div>
              </div>
            </div>
            <p className="mt-4 flex items-center gap-2 text-xs text-muted"><Lock className="h-3.5 w-3.5" /> Payments are processed securely by Razorpay. We never see your card details.</p>
            <p className="mt-3 text-xs leading-relaxed text-muted">
              All orders are prepaid. Orders can&apos;t be cancelled or returned once placed; a damaged item is replaced free — see our{" "}
              <Link href="/shipping-returns" target="_blank" className="underline">Shipping &amp; returns</Link> and <Link href="/terms" target="_blank" className="underline">Terms</Link>.
            </p>
          </section>
        </div>

        <aside className="hidden h-fit border border-line bg-white p-6 lg:sticky lg:top-28 lg:block">
          <h2 className="mb-5 font-serif text-2xl">Your order</h2>
          {summary}
          <button disabled={busy} className="btn-gold mt-6 w-full">{payLabel}</button>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ivory/95 px-4 py-3 backdrop-blur lg:hidden">
        <button disabled={busy} className="btn-gold w-full !py-3.5">{payLabel}</button>
      </div>
    </form>
  );
}

function Field({ label, ...rest }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input required className="input" {...rest} />
    </label>
  );
}
