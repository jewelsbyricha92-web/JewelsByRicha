"use client";

import { useEffect, useState } from "react";
import { useCatalog } from "@/context/CatalogContext";

export function PromoBanner() {
  const { settings } = useCatalog();
  const messages = [
    `Free shipping on orders above ₹${settings.freeShippingThreshold.toLocaleString("en-IN")}`,
    "Anti-tarnish · Waterproof · Premium quality",
    "Gift-ready packaging · Free replacement on damaged items",
  ];
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % 3), 3800);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="relative z-50 flex h-10 items-center justify-center overflow-hidden bg-ink px-4 text-center text-[9px] font-medium uppercase tracking-[0.28em] text-gold-light/90 sm:text-[10px] sm:tracking-[0.32em] md:text-[10.5px]" style={{ borderBottom: "1px solid rgba(196, 154, 60, 0.2)" }}>
      {messages.map((m, k) => (
        <span key={k} className={`absolute inset-x-4 transition-all duration-700 ${k === i ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}>
          {m}
        </span>
      ))}
    </div>
  );
}
