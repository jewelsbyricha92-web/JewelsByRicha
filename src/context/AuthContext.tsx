"use client";

/** Customer session. The cookie is httpOnly and managed by the server; this context mirrors who is signed in. */

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { SessionUser } from "@/types/shop";
import { api } from "@/lib/client/api";

interface AuthContextType {
  user: SessionUser | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<SessionUser>;
  /** Step 1 of sign-up: emails a 6-digit code. Returns the code in local development (no mail server). */
  startRegistration: (input: { name: string; email: string; phone?: string; password: string }) => Promise<{ devOtp?: string }>;
  /** Step 2: verifies the code, creates the account and signs in. */
  verifyRegistration: (email: string, otp: string) => Promise<SessionUser>;
  /** Adopts a session the server just created (e.g. after the checkout email check). */
  adoptUser: (u: SessionUser) => void;
  logout: () => Promise<void>;
  updateProfile: (u: { name: string; phone?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    api<{ user: SessionUser | null }>("/api/auth/me")
      .then((r) => setUser(r.user))
      .catch(() => setUser(null))
      .finally(() => setReady(true));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const r = await api<{ user: SessionUser }>("/api/auth/login", { method: "POST", body: { email, password } });
    setUser(r.user);
    return r.user;
  }, []);

  const startRegistration = useCallback((input: { name: string; email: string; phone?: string; password: string }) => api<{ devOtp?: string }>("/api/auth/register", { method: "POST", body: input }), []);

  const verifyRegistration = useCallback(async (email: string, otp: string) => {
    const r = await api<{ user: SessionUser }>("/api/auth/verify-otp", { method: "POST", body: { email, otp } });
    setUser(r.user);
    return r.user;
  }, []);

  const logout = useCallback(async () => {
    await api("/api/auth/logout", { method: "POST" }).catch(() => {});
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (u: { name: string; phone?: string }) => {
    const r = await api<{ user: SessionUser }>("/api/auth/profile", { method: "PUT", body: u });
    setUser(r.user);
  }, []);

  const adoptUser = useCallback((u: SessionUser) => setUser(u), []);

  return <AuthContext.Provider value={{ user, ready, login, startRegistration, verifyRegistration, adoptUser, logout, updateProfile }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
