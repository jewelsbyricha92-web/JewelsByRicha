"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Droplets, Gem, Gift, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/client/api";
import { HERO } from "@/data/images";

type Mode = "login" | "register" | "forgot";

function LoginInner() {
  const { login, startRegistration, verifyRegistration } = useAuth();
  const params = useSearchParams();
  const redirect = params.get("redirect");
  const dest = redirect && redirect.startsWith("/") && !redirect.startsWith("//") ? redirect : "/account";

  const [mode, setMode] = useState<Mode>("login");
  const [step, setStep] = useState<"form" | "otp">("form");
  const [f, setF] = useState({ name: "", email: "", phone: "", password: "", otp: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((p) => ({ ...p, [k]: e.target.value }));

  const switchMode = (m: Mode) => {
    setMode(m);
    setStep("form");
    setError(null);
    setInfo(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    let leaving = false;
    try {
      if (mode === "login") {
        await login(f.email, f.password);
        leaving = true;
        window.location.assign(dest); // full page load: always lands on the page with the fresh session, never on a cached redirect
      } else if (mode === "register") {
        if (step === "form") {
          const r = await startRegistration({ name: f.name, email: f.email, phone: f.phone || undefined, password: f.password });
          setStep("otp");
          setInfo(r.devOtp ? `Local development: your code is ${r.devOtp}` : `We emailed a 6-digit code to ${f.email}.`);
        } else {
          await verifyRegistration(f.email, f.otp);
          leaving = true;
          window.location.assign(dest);
        }
      } else if (step === "form") {
        const r = await api<{ devOtp?: string }>("/api/auth/forgot", { method: "POST", body: { email: f.email } });
        setStep("otp");
        setInfo(r.devOtp ? `Local development: your code is ${r.devOtp}` : `If ${f.email} has an account, we've emailed a 6-digit code.`);
      } else {
        await api("/api/auth/reset", { method: "POST", body: { email: f.email, otp: f.otp, password: f.password } });
        switchMode("login");
        setInfo("Password updated. Please sign in.");
        setF((p) => ({ ...p, password: "", otp: "" }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      if (!leaving) setBusy(false);
    }
  };

  const title = mode === "login" ? "Sign in" : mode === "register" ? "Create account" : "Reset password";
  const button =
    mode === "login" ? "Sign in" : mode === "register" ? (step === "form" ? "Send verification code" : "Verify & create account") : step === "form" ? "Send reset code" : "Set new password";

  return (
    <div className="grid min-h-[calc(100svh-6rem)] lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-ink lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={HERO.necklace} alt="" className="absolute inset-0 h-full w-full object-cover object-[62%_50%] opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-ink/10" />
        <div className="absolute inset-x-0 bottom-0 p-12 text-ivory">
          <p className="eyebrow !text-gold-light">Jewels by Richa</p>
          <h2 className="mt-3 font-serif text-5xl font-light leading-tight">Your jewellery box,<br /><span className="font-script text-gold-mid">always with you</span></h2>
          <ul className="mt-8 grid grid-cols-2 gap-4 text-sm text-ivory/80">
            {[[ShieldCheck, "Track every order"], [Gift, "Save your favourites"], [Gem, "Faster checkout"], [Droplets, "Exclusive early access"]].map(([Icon, t]) => {
              const I = Icon as typeof ShieldCheck;
              return <li key={t as string} className="flex items-center gap-2"><I className="h-4 w-4 text-gold-mid" />{t as string}</li>;
            })}
          </ul>
        </div>
      </div>

      <div className="flex items-center justify-center px-5 py-12 md:py-16">
        <div className="w-full max-w-md">
          <div className="text-center">
            <Image src="/logo.png" alt="" width={72} height={72} className="mx-auto rounded-full lg:hidden" />
            <p className="eyebrow mt-4 lg:mt-0">{mode === "login" ? "Welcome back" : mode === "register" ? "Join the family" : "No worries"}</p>
            <h1 className="mt-2 font-serif text-4xl font-light md:text-5xl">{title}</h1>
          </div>

          {mode !== "forgot" && (
            <div className="mt-8 grid grid-cols-2 border border-line bg-cream p-1 text-xs font-medium uppercase tracking-[0.18em]">
              {(["login", "register"] as const).map((m) => (
                <button key={m} type="button" onClick={() => switchMode(m)} className={`py-2.5 transition-colors ${mode === m ? "bg-ink text-ivory" : "text-muted hover:text-ink"}`}>
                  {m === "login" ? "Sign in" : "Register"}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={submit} className="mt-6 space-y-4">
            {error && <div role="alert" className="border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
            {info && <div className="border border-gold-light bg-cream p-3 text-sm text-ink-soft">{info}</div>}

            {step === "form" ? (
              <>
                {mode === "register" && <label className="block"><span className="label">Full name</span><input required minLength={2} className="input" value={f.name} onChange={set("name")} autoComplete="name" /></label>}
                <label className="block"><span className="label">Email</span><input required type="email" className="input" value={f.email} onChange={set("email")} autoComplete="email" /></label>
                {mode === "register" && <label className="block"><span className="label">Phone (optional)</span><input type="tel" className="input" value={f.phone} onChange={set("phone")} autoComplete="tel" /></label>}
                {mode !== "forgot" && (
                  <label className="block">
                    <span className="label">Password</span>
                    <input required minLength={mode === "register" ? 8 : 1} type="password" className="input" value={f.password} onChange={set("password")} autoComplete={mode === "login" ? "current-password" : "new-password"} />
                    {mode === "register" && <span className="mt-1 block text-xs text-muted">At least 8 characters.</span>}
                  </label>
                )}
              </>
            ) : (
              <>
                <label className="block">
                  <span className="label">6-digit code</span>
                  <input required inputMode="numeric" maxLength={6} pattern="\d{6}" className="input text-center text-xl tracking-[0.5em]" value={f.otp} onChange={set("otp")} autoComplete="one-time-code" />
                </label>
                {mode === "forgot" && (
                  <label className="block"><span className="label">New password</span><input required minLength={8} type="password" className="input" value={f.password} onChange={set("password")} autoComplete="new-password" /></label>
                )}
              </>
            )}
            <button disabled={busy} className="btn-dark w-full !py-4">{busy ? "Please wait…" : button}</button>
          </form>

          <div className="mt-5 flex justify-between text-sm">
            {mode === "login" ? (
              <button type="button" onClick={() => switchMode("forgot")} className="text-gold-deep underline-offset-4 hover:underline">Forgot password?</button>
            ) : (
              <button type="button" onClick={() => switchMode("login")} className="text-gold-deep underline-offset-4 hover:underline">← Back to sign in</button>
            )}
            {step === "otp" && <button type="button" onClick={() => setStep("form")} className="text-muted underline-offset-4 hover:underline">Change details</button>}
          </div>

          <p className="mt-6 text-center text-xs text-muted">By continuing you agree to our <Link href="/terms" className="underline">Terms</Link> and <Link href="/privacy-policy" className="underline">Privacy Policy</Link>.</p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}
