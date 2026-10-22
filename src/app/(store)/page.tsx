"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Droplets, Gem, Gift, ShieldCheck, Star, Truck, Quote } from "lucide-react";
import { Instagram } from "@/components/ui/InstagramIcon";
import { useCatalog } from "@/context/CatalogContext";
import { ProductGrid } from "@/components/ui/ProductCard";
import { HeroSlider } from "@/components/home/HeroSlider";
import { SectionHead } from "@/components/ui/SectionHead";
import { HERO, cdn } from "@/data/images";
import { categoryCover } from "@/lib/catalog";
import { cn } from "@/lib/utils";

const rise = { initial: { opacity: 0, y: 26 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-60px" }, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const } };

const trustItems = (threshold: number) => [
  { icon: ShieldCheck, title: "Anti-tarnish", text: "Stays golden, wear after wear" },
  { icon: Droplets, title: "100% waterproof", text: "Showers, gym & monsoons" },
  { icon: Gem, title: "Premium quality", text: "Skin-friendly, nickel-safe" },
  { icon: Truck, title: "Free shipping", text: `On orders above ₹${threshold.toLocaleString("en-IN")}` },
  { icon: Gift, title: "Gift-ready", text: "Signature JR packaging" },
];

const REVIEWS = [
  { name: "Ananya Sharma", city: "Jaipur", item: "Virasat Heritage Kada", text: "I've worn my kada in the shower for three months — it still looks brand new. Looks far more expensive than it is." },
  { name: "Priya Mehta", city: "Mumbai", item: "Kashmiri Chandbali", text: "Wore these to a family function and got compliments all evening. The packaging felt so premium." },
  { name: "Simran Kaur", city: "Chandigarh", item: "Snake Chain Necklace", text: "Finally jewellery that doesn't turn my neck green. Light, elegant and I never take it off." },
];

const INSTA = ["/images/hero/1777999745587-31af0844db6c.jpg", "/images/stock/1631982690223-8aa4be0a2497.jpg", "/images/stock/1762686130435-897de4b26aac.jpg", "/images/stock/1602173574767-37ac01994b2a.jpg", "/images/stock/1783541507490-edb026e2a961.jpg", "/images/stock/1572545884955-6f3d7b6540a0.jpg"].map(cdn);

export default function HomePage() {
  const { products, categories, collections, settings } = useCatalog();
  const [tab, setTab] = useState<"all" | "festive" | "anti-tarnish">("all");

  const live = useMemo(() => products.filter((p) => p.status === "ACTIVE"), [products]);
  const homeCats = useMemo(() => categories.filter((c) => c.active && c.showOnHome).sort((a, b) => a.sortOrder - b.sortOrder).slice(0, 8), [categories]);
  const best = useMemo(() => {
    const col = collections.find((c) => c.slug === tab);
    return live.filter((p) => (p.isBestSeller || p.isFeatured) && (!col || p.collectionId === col.id)).slice(0, 8);
  }, [live, tab, collections]);
  const fresh = useMemo(() => [...live].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4), [live]);

  return (
    <>
      <HeroSlider />

      {/* ───────── TRUST STRIP (Light: Ivory Goldish Pink) ───────── */}
      <section className="border-b border-[#ebd8cc] bg-gradient-to-r from-[#fdf8f4] via-[#faf2eb] to-[#fbf1ea]">
        <div className="hide-scrollbar mx-auto flex max-w-7xl gap-8 overflow-x-auto px-5 py-7 md:grid md:grid-cols-5 md:gap-4 md:px-10 md:py-9">
          {trustItems(settings.freeShippingThreshold).map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex shrink-0 items-center gap-3.5 md:justify-center">
              <Icon className="h-6 w-6 shrink-0 text-[#c49e49]" strokeWidth={1.25} />
              <div className="leading-tight">
                <div className="text-[12px] font-semibold tracking-wide text-ink">{title}</div>
                <div className="mt-0.5 text-[10.5px] text-muted">{text}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ───────── NEW ARRIVALS (Light: Ivory Goldish Pink) ───────── */}
      <section
        className="relative isolate overflow-hidden border-b border-[#ebd8cc] py-18 md:py-28"
        style={{
          background: "linear-gradient(145deg, #fdf8f4 0%, #faf2eb 40%, #f6e9e0 80%, #fbf3ec 100%)",
        }}
      >
        {/* Soft golden glow */}
        <div className="pointer-events-none absolute -top-20 right-1/4 h-[300px] w-[450px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(212,174,88,0.14),transparent_70%)] blur-3xl" />
        {/* Soft pink glow */}
        <div className="pointer-events-none absolute -bottom-20 left-10 h-[320px] w-[450px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(246,215,205,0.25),transparent_70%)] blur-3xl" />

        <div className="relative z-10 mx-auto w-full max-w-7xl px-5 md:px-10">
          <motion.div {...rise}><SectionHead eyebrow="Just landed" title="New arrivals" /></motion.div>
          <ProductGrid products={fresh} />
          <div className="mt-14 text-center"><Link href="/new-arrivals" className="btn-outline !bg-white hover:!bg-[#201714]">Explore new arrivals</Link></div>
        </div>
      </section>

      {/* ───────── COLLECTIONS (Dark: Black, Dark Brown & Dark Beige) ───────── */}
      <section className="border-y border-[#362923] bg-[#1c1411] py-18 md:py-28 text-ivory">
        <div className="mx-auto w-full max-w-7xl px-5 md:px-10">
          <motion.div {...rise}><SectionHead eyebrow="Two worlds, one signature" title="Our collections" dark={true} /></motion.div>
          <div className="grid gap-6 md:grid-cols-2">
            {[
              { slug: "festive", img: HERO.jhumka, pos: "object-[50%_55%]", cta: "Explore festive" },
              { slug: "anti-tarnish", img: HERO.necklace, pos: "object-[60%_50%]", cta: "Explore everyday" },
            ].map((c, i) => {
              const col = collections.find((x) => x.slug === c.slug);
              if (!col) return null;
              return (
                <motion.div key={c.slug} {...rise} transition={{ ...rise.transition, delay: i * 0.12 }}>
                  <Link href={`/collections/${col.slug}`} className="group relative block aspect-[1/1.08] overflow-hidden bg-[#281d19] md:aspect-[5/6] ring-1 ring-[#c49e49]/30 hover:ring-[#c49e49]/70 transition-all duration-700">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.img} alt={col.name} className={cn("absolute inset-0 h-full w-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-105", c.pos)} />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#140e0c] via-[#140e0c]/40 to-transparent" />
                    <div className="absolute inset-4 border border-[#e8cca0]/25 transition-all duration-700 group-hover:border-[#d4ae58]/70" />
                    <div className="absolute inset-x-0 bottom-0 p-8 text-ivory md:p-10">
                      <p className="eyebrow !text-[#e8cca0]">{col.tagline}</p>
                      <h3 className="mt-2 font-serif text-4xl md:text-5xl">{col.name}</h3>
                      <span className="mt-5 inline-flex items-center gap-2 border-b border-[#d4ae58]/80 pb-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-ivory">{c.cta} <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───────── SHOP BY CATEGORY (Light: Ivory Goldish Pink) ───────── */}
      <section
        className="relative isolate overflow-hidden border-b border-[#ebd8cc] py-18 md:py-28"
        style={{
          background: "linear-gradient(135deg, #fbf2eb 0%, #f7ebe1 50%, #faf3ec 100%)",
        }}
      >
        <div className="pointer-events-none absolute -top-16 left-1/3 h-[280px] w-[400px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(212,174,88,0.12),transparent_70%)] blur-3xl" />
        <div className="relative z-10 mx-auto max-w-7xl px-5 md:px-10">
          <motion.div {...rise}><SectionHead eyebrow="Find your piece" title="Shop by category" /></motion.div>
          <div className="hide-scrollbar -mx-5 flex scroll-px-5 snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 md:mx-0 md:grid md:grid-cols-4 md:gap-x-6 md:gap-y-10 md:overflow-visible md:px-0">
            {homeCats.map((c, i) => {
              const col = collections.find((x) => x.id === c.collectionId)!;
              const img = categoryCover(c, products);
              return (
                <motion.div key={c.id} {...rise} transition={{ ...rise.transition, delay: (i % 4) * 0.08 }} className="w-[44%] shrink-0 snap-start sm:w-[30%] md:w-auto">
                  <Link href={`/collections/${col.slug}/${c.slug}`} className="group block text-center">
                    <div className="relative mx-auto aspect-[3/4] overflow-hidden rounded-t-[999px] bg-white ring-1 ring-[#c49e49]/40 transition-all duration-700 group-hover:ring-[#c49e49] group-hover:shadow-soft">
                      {img && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={img} alt={c.name} className="h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-110" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#140e0c]/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                    <h3 className="mt-4 font-serif text-xl text-ink">{c.name}</h3>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-muted">{col.name}</p>
                  </Link>
                </motion.div>
              );
            })}
          </div>
          <div className="mt-12 text-center">
            <Link href="/categories" className="btn-outline !bg-white hover:!bg-[#201714]">View all {categories.filter((c) => c.active).length} categories</Link>
          </div>
        </div>
      </section>

      {/* ───────── BESTSELLERS (Dark: Rich Goldish Brown Symphony) ───────── */}
      <section
        className="relative isolate overflow-hidden border-y border-[#c49e49]/30 py-20 text-ivory md:py-32"
        style={{
          background: "linear-gradient(145deg, #18110b 0%, #251a10 32%, #352516 68%, #1d130c 100%)",
        }}
      >
        {/* Shimmering Gold Ambient Glow from top */}
        <div className="pointer-events-none absolute -top-24 left-1/2 h-[380px] w-[650px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(212,174,88,0.24),transparent_70%)] blur-2xl" />

        {/* Warm Golden Amber Light from bottom-left */}
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-[400px] w-[500px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(196,140,60,0.18),transparent_70%)] blur-3xl" />

        {/* Deep Burnished Bronze from bottom-right */}
        <div className="pointer-events-none absolute -bottom-24 -right-16 h-[400px] w-[500px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(170,115,50,0.18),transparent_70%)] blur-3xl" />

        <div className="relative z-10 mx-auto w-full max-w-7xl px-5 md:px-10">
          <motion.div {...rise}><SectionHead eyebrow="Most loved" title="Bestsellers" dark={true} /></motion.div>
          <div className="mb-10 flex justify-center gap-2">
            {([["all", "All"], ["festive", "Festive"], ["anti-tarnish", "Anti Tarnish"]] as const).map(([k, l]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={cn(
                  "border px-6 py-2.5 text-[10px] font-semibold uppercase tracking-[0.22em] transition-all duration-500",
                  tab === k
                    ? "border-[#d4ae58] bg-gradient-to-r from-[#d4ae58] via-[#e8cca0] to-[#b08930] text-[#141110] font-bold shadow-[0_4px_18px_rgba(212,174,88,0.35)]"
                    : "border-[#c49e49]/35 bg-[#251a10]/80 text-[#e8cca0] hover:border-[#d4ae58] hover:text-white"
                )}
              >
                {l}
              </button>
            ))}
          </div>
          <ProductGrid products={best} dark={true} />
          <div className="mt-14 text-center">
            <Link
              href="/shop"
              className="btn-gold !bg-gradient-to-r !from-[#e8cca0] !via-[#d4ae58] !to-[#b08930] !text-[#141110] font-bold shadow-[0_8px_25px_rgba(196,158,73,0.32)] hover:scale-105"
            >
              View all jewellery
            </Link>
          </div>
        </div>
      </section>





      {/* ───────── REVIEWS (Unique 3-Color Luxury Mix: Black, Dark Espresso, Rose-Blush & Gold) ───────── */}
      <section
        className="relative isolate overflow-hidden border-y border-[#362923] py-22 text-ivory md:py-32"
        style={{
          background: "linear-gradient(135deg, #0c0808 0%, #1c110e 25%, #2a161d 55%, #281d17 80%, #120c0a 100%)",
        }}
      >
        {/* Color 1: Champagne Gold halo behind title */}
        <div className="pointer-events-none absolute -top-20 left-1/2 h-[380px] w-[600px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(212,174,88,0.25),transparent_70%)] blur-2xl" />

        {/* Color 2: Luminous Rose-Blush Pink ambient warmth from bottom-left */}
        <div className="pointer-events-none absolute -bottom-24 -left-20 h-[420px] w-[500px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(246,215,205,0.18),transparent_70%)] blur-3xl" />

        {/* Color 3: Warm Bronze / Dark Beige glow from bottom-right */}
        <div className="pointer-events-none absolute -bottom-24 -right-20 h-[420px] w-[500px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(196,145,95,0.22),transparent_70%)] blur-3xl" />

        <div className="relative z-10 mx-auto max-w-7xl px-5 md:px-10">
          <motion.div {...rise}><SectionHead eyebrow="Kind words" title="Loved by our customers" dark={true} /></motion.div>
          <div className="hide-scrollbar -mx-5 flex scroll-px-5 snap-x snap-mandatory gap-4 overflow-x-auto px-5 md:mx-0 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:px-0">
            {REVIEWS.map((r, i) => (
              <motion.figure
                key={r.name}
                {...rise}
                transition={{ ...rise.transition, delay: i * 0.1 }}
                className="relative w-[84%] shrink-0 snap-start rounded-2xl border border-[#c49e49]/30 bg-gradient-to-b from-[#251915]/90 via-[#1d1310]/92 to-[#140d0b]/95 p-8 backdrop-blur-md transition-all duration-500 hover:border-[#c49e49]/60 hover:-translate-y-1 md:w-auto md:p-9"
                style={{
                  boxShadow: "0 18px 42px -12px rgba(8, 6, 5, 0.7), inset 0 1px 0 rgba(232, 204, 160, 0.2)",
                }}
              >
                <Quote className="absolute right-6 top-6 h-8 w-8 text-[#d4ae58]/35" />
                <div className="mb-4 flex gap-0.5">{Array.from({ length: 5 }).map((_, k) => <Star key={k} className="h-4 w-4 fill-[#d4ae58] text-[#d4ae58]" />)}</div>
                <blockquote className="font-serif text-[1.35rem] leading-snug text-ivory/95">{r.text}</blockquote>
                <figcaption className="mt-6 flex items-center gap-3 border-t border-[#362923]/80 pt-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d4ae58]/40 bg-gradient-to-br from-[#2c1d18] to-[#120d0b] font-serif text-[#e8cca0] shadow-sm">{r.name[0]}</span>
                  <span className="text-sm leading-tight text-ivory"><b className="font-medium text-ivory">{r.name}</b><br /><span className="text-xs text-ivory/55">{r.city} · {r.item}</span></span>
                </figcaption>
              </motion.figure>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── INSTAGRAM (Light: Ivory Goldish Pink) ───────── */}
      <section
        className="border-b border-[#ebd8cc] py-18 md:py-28"
        style={{
          background: "linear-gradient(180deg, #fdf8f4 0%, #faf2eb 50%, #fdf8f4 100%)",
        }}
      >
        <div className="mx-auto w-full max-w-7xl px-5 md:px-10">
          <motion.div {...rise}><SectionHead eyebrow="Follow along" title={<>@{settings.instagram}</>} /></motion.div>
          <div className="grid grid-cols-3 gap-2.5 md:grid-cols-6 md:gap-3.5">
            {INSTA.map((src, i) => (
              <a key={i} href={`https://instagram.com/${settings.instagram}`} target="_blank" rel="noreferrer" className="group relative aspect-square overflow-hidden bg-[#faf2eb] ring-1 ring-[#ebd8cc]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-108" />
                <span className="absolute inset-0 flex items-center justify-center bg-[#140e0c]/60 opacity-0 transition-opacity group-hover:opacity-100"><Instagram className="h-6 w-6 text-[#faf3ec]" /></span>
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
