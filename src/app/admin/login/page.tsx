"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client/api";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          try {
            await api("/api/admin/login", { method: "POST", body: { email, password } });
            router.push("/admin");
            router.refresh();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Could not sign in");
            setBusy(false);
          }
        }}
        className="w-full max-w-sm rounded-2xl bg-ivory p-8 shadow-lift"
      >
        <Image src="/logo.png" alt="Jewels by Richa" width={88} height={88} className="mx-auto rounded-full" />
        <h1 className="mt-4 text-center font-serif text-3xl">Admin sign in</h1>
        <p className="mb-6 text-center text-xs text-muted">Authorised staff only.</p>
        {error && <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
        <label className="mb-4 block"><span className="label">Email</span><input className="a-input" type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label className="mb-6 block"><span className="label">Password</span><input className="a-input" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" /></label>
        <button disabled={busy} className="a-btn-dark w-full !py-2.5">{busy ? "Signing in…" : "Sign in"}</button>
      </form>
    </div>
  );
}
