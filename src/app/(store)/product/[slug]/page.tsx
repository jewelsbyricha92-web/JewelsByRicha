import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findProductBySlug } from "@/lib/server/catalog";
import { ProductClient } from "@/components/product/ProductClient";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await findProductBySlug(slug);
  if (!p) return { title: "Product not found" };
  const description = p.shortDescription || p.description.slice(0, 160);
  return {
    title: p.name,
    description,
    openGraph: { title: p.name, description, images: p.images[0] ? [p.images[0]] : undefined },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await findProductBySlug(slug);
  if (!product) notFound();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || product.shortDescription,
    image: product.images,
    offers: { "@type": "Offer", priceCurrency: "INR", price: product.price, availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock" },
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <ProductClient product={product} />
    </>
  );
}
