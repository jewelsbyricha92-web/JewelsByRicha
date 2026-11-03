"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useAuth } from "@/context/AuthContext";
import { SearchOverlay } from "./SearchOverlay";

export function Navbar() {
  const { cartCount, setIsDrawerOpen } = useCart();
  const { ids } = useWishlist();
  const { user } = useAuth();
  const [mobile, setMobile] = useState(false);
  const [search, setSearch] = useState(false);

  // The drawer and search overlay are siblings of <header>, not children: the header's backdrop-filter would otherwise
  // become their containing block and squash "fixed inset-0" into the 60px header bar.
  return (
    <>
    <header className="sticky top-0 z-40 border-b border-line/70 bg-ivory/95 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-[60px] max-w-7xl items-center md:h-[82px] justify-between px-5 md:px-10">
        {/* left: clean direct navigation */}
        <div className="flex flex-1 items-center gap-4">
          <button className="md:hidden" onClick={() => setMobile(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <nav className="hidden items-center gap-7 whitespace-nowrap lg:gap-9 md:flex">
            <Link
              href="/new-arrivals"
              className="text-[10.5px] font-semibold uppercase tracking-[0.24em] text-ink/80 transition-colors duration-300 hover:text-gold-deep"
            >
              New Arrivals
            </Link>
            <Link
              href="/bestsellers"
              className="text-[10.5px] font-semibold uppercase tracking-[0.24em] text-ink/80 transition-colors duration-300 hover:text-gold-deep"
            >
              Bestsellers
            </Link>
            <Link
              href="/collections"
              className="text-[10.5px] font-semibold uppercase tracking-[0.24em] text-ink/80 transition-colors duration-300 hover:text-gold-deep"
            >
              Our Collection
            </Link>
          </nav>
        </div>

        {/* logo */}
        <Link href="/" className="flex items-center gap-2.5" aria-label="Jewels by Richa — home">
          <Image src="/logo.png" alt="Jewels by Richa" width={52} height={52} className="h-12 w-12 rounded-full md:h-[54px] md:w-[54px]" priority />
          <span className="hidden leading-none sm:block">
            <span className="block font-serif text-[1.3rem] font-light tracking-[0.35em]">JEWELS</span>
            <span className="-mt-0.5 block font-script text-[1.05rem] text-gold-deep">by Richa</span>
          </span>
        </Link>

        {/* right */}
        <div className="flex flex-1 items-center justify-end gap-1 md:gap-3">
          <button onClick={() => setSearch(true)} className="p-2 hover:text-gold-deep" aria-label="Search">
            <Search className="h-[18px] w-[18px]" />
          </button>
          <Link href={user ? "/account" : "/login"} className="hidden p-2 hover:text-gold-deep sm:block" aria-label="Account">
            <User className="h-[18px] w-[18px]" />
          </Link>
          <Link href="/wishlist" className="relative hidden p-2 hover:text-gold-deep sm:block" aria-label="Wishlist">
            <Heart className="h-[18px] w-[18px]" />
            {ids.length > 0 && <span className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-gold" />}
          </Link>
          <button onClick={() => setIsDrawerOpen(true)} className="relative p-2 hover:text-gold-deep" aria-label="Open bag">
            <ShoppingBag className="h-[18px] w-[18px]" />
            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 text-[10px] text-ivory">{cartCount}</span>
            )}
          </button>
        </div>
      </div>
    </header>

      {/* mobile drawer */}
      {mobile && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-ink/50" onClick={() => setMobile(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[84%] max-w-sm flex-col overflow-y-auto bg-ivory p-6">
            <div className="mb-6 flex items-center justify-between">
              <span className="font-serif text-xl tracking-[0.25em]">MENU</span>
              <button onClick={() => setMobile(false)} aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <Link href="/new-arrivals" onClick={() => setMobile(false)} className="border-b border-line py-3 text-sm font-medium uppercase tracking-[0.18em]">
              New Arrivals
            </Link>
            <Link href="/bestsellers" onClick={() => setMobile(false)} className="border-b border-line py-3 text-sm font-medium uppercase tracking-[0.18em]">
              Bestsellers
            </Link>
            <Link href="/collections" onClick={() => setMobile(false)} className="border-b border-line py-3 text-sm font-medium uppercase tracking-[0.18em]">
              Our Collection
            </Link>
            <Link href="/categories" onClick={() => setMobile(false)} className="border-b border-line py-3 text-sm uppercase tracking-[0.18em]">
              All Categories
            </Link>
            <Link href="/shop" onClick={() => setMobile(false)} className="border-b border-line py-3 text-sm uppercase tracking-[0.18em]">
              Shop all jewellery
            </Link>
            {[
              ["Wishlist", "/wishlist"],
              [user ? "My account" : "Login / Register", user ? "/account" : "/login"],
              ["About", "/about"],
              ["Contact", "/contact"],
            ].map(([l, h]) => (
              <Link key={h} href={h} onClick={() => setMobile(false)} className="border-b border-line py-3 text-sm uppercase tracking-[0.18em]">
                {l}
              </Link>
            ))}
          </div>
        </div>
      )}
      {search && <SearchOverlay onClose={() => setSearch(false)} />}
    </>
  );
}
