import type { Metadata } from "next";
import Link from "next/link";
import { PolicyLayout } from "@/components/ui/PolicyLayout";
import { getSettings } from "@/lib/server/settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Terms & conditions" };

export default async function TermsPage() {
  const s = await getSettings();
  return (
    <PolicyLayout eyebrow="Legal" title="Terms & conditions" intro="Please read these terms before you shop with Jewels by Richa. By using this website or placing an order, you agree to them.">
      <section>
        <h2>Using this website</h2>
        <p>You agree to give accurate information when you create an account or place an order, to keep your login details private, and not to misuse the website. You must be 18 or older, or use the site with a parent or guardian&apos;s permission.</p>
      </section>

      <section>
        <h2>Products &amp; pricing</h2>
        <ul>
          <li>All prices are in Indian Rupees (₹). The price shown on the product page is the price you pay, plus shipping where it applies.</li>
          <li>Stock is limited. We may cancel an order and refund it in full if an item turns out to be unavailable or a price was shown by mistake.</li>
          <li>We try to show colours accurately, but they may look slightly different on your screen. Handmade finishes can vary slightly from piece to piece.</li>
          <li>Coupons and offers are subject to the conditions shown with them and may be withdrawn at any time.</li>
        </ul>
      </section>

      <section>
        <h2>Orders &amp; payment</h2>
        <p>All orders are prepaid by UPI or card through Razorpay. An order is confirmed once payment is received. We do not offer Cash on Delivery.</p>
      </section>

      <section>
        <h2>Shipping, cancellations &amp; returns</h2>
        <p>Orders cannot be cancelled once placed, and we do not accept returns or give refunds. If an item arrives damaged, we replace it free of charge, provided you send an unboxing video within 48 hours of delivery. Full details are in our <Link href="/shipping-returns">Shipping &amp; returns</Link> policy, which forms part of these terms.</p>
      </section>

      <section>
        <h2>Jewellery care</h2>
        <p>Our anti-tarnish pieces are made to last, but they are not indestructible. Following our <Link href="/care">care guide</Link> helps keep them looking their best. Damage caused by misuse is not covered by the damage-replacement policy.</p>
      </section>

      <section>
        <h2>Intellectual property</h2>
        <p>The Jewels by Richa name, logo, photographs, designs and text on this website belong to us. Please do not copy or use them without our written permission.</p>
      </section>

      <section>
        <h2>Limitation of liability</h2>
        <p>To the extent permitted by law, our liability for any claim relating to an order is limited to the amount you paid for that order. We are not responsible for delays caused by couriers, weather or other events beyond our control.</p>
      </section>

      <section>
        <h2>Governing law</h2>
        <p>These terms are governed by the laws of India, and the courts of India will have jurisdiction over any dispute.</p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>Questions about these terms? Write to <a href={`mailto:${s.contactEmail}`}>{s.contactEmail}</a>.</p>
      </section>
    </PolicyLayout>
  );
}
