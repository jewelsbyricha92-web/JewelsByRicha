"use client";

import Link from "next/link";
import Image from "next/image";
import { Mail, Phone } from "lucide-react";
import { Instagram } from "@/components/ui/InstagramIcon";
import { BRAND } from "@/config/brand";
import { useCatalog } from "@/context/CatalogContext";

export function Footer() {
  const { collections, settings } = useCatalog();
  return (
    <footer className="mt-0 bg-[#0f0e0e] text-ivory/80">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 md:grid-cols-4 md:px-10">
        <div className="md:col-span-1">
          <Image src="/logo.png" alt="Jewels by Richa" width={88} height={88} className="mb-4 h-[78px] w-[78px] rounded-full" />
          <p className="text-[13px] leading-relaxed text-ivory/55">{BRAND.positioning}</p>
          <a
            href={`https://instagram.com/${settings.instagram}`}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-2 text-sm text-gold-light hover:text-gold-mid"
          >
            <Instagram className="h-4 w-4" /> @{settings.instagram}
          </a>
        </div>

        <div>
          <h4 className="eyebrow !text-gold-light mb-4">Shop</h4>
          <ul className="space-y-2.5 text-sm">
            <li><Link href="/shop" className="text-ivory/70 transition-colors hover:text-gold-light">All jewellery</Link></li>
            {collections.map((c) => (
              <li key={c.id}><Link href={`/collections/${c.slug}`} className="text-ivory/70 transition-colors hover:text-gold-light">{c.name}</Link></li>
            ))}
            <li><Link href="/wishlist" className="text-ivory/70 transition-colors hover:text-gold-light">Wishlist</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="eyebrow !text-gold-light mb-4">Help</h4>
          <ul className="space-y-2.5 text-sm">
            <li><Link href="/faq" className="text-ivory/70 transition-colors hover:text-gold-light">FAQ</Link></li>
            <li><Link href="/care" className="text-ivory/70 transition-colors hover:text-gold-light">Jewellery care</Link></li>
            <li><Link href="/shipping-returns" className="text-ivory/70 transition-colors hover:text-gold-light">Shipping &amp; returns</Link></li>
            <li><Link href="/account/orders" className="text-ivory/70 transition-colors hover:text-gold-light">Track my order</Link></li>
            <li><Link href="/contact" className="text-ivory/70 transition-colors hover:text-gold-light">Contact us</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="eyebrow !text-gold-light mb-4">Get in touch</h4>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-2 text-ivory/80"><Mail className="h-4 w-4 text-gold-light" /> {settings.contactEmail}</li>
            <li className="flex items-center gap-2 text-ivory/80"><Phone className="h-4 w-4 text-gold-light" /> {settings.contactPhone}</li>
            <li className="text-[13px] text-ivory/55">{settings.businessHours}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-[#362923] bg-[#140e0c]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-5 py-5 text-[11px] text-ivory/50 md:flex-row md:px-10">
          <span>© 2026 Jewels by Richa. All rights reserved.</span>
          <span className="flex gap-6">
            <Link href="/privacy-policy" className="hover:text-gold-light">Privacy</Link>
            <Link href="/terms" className="hover:text-gold-light">Terms</Link>
            <Link href="/shipping-returns" className="hover:text-gold-light">Shipping</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
