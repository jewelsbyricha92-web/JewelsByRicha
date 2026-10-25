import type { Metadata } from "next";
import Link from "next/link";
import { PolicyLayout } from "@/components/ui/PolicyLayout";
import { getSettings } from "@/lib/server/settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Shipping & returns" };

export default async function ShippingReturns() {
  const s = await getSettings();
  return (
    <PolicyLayout eyebrow="Policies" title="Shipping & returns" intro="Everything you need to know about delivery, cancellations and damaged items.">
      <section>
        <h2>Shipping</h2>
        <ul>
          <li>We deliver across India.</li>
          <li>Shipping is <b>free on orders of ₹{s.freeShippingThreshold.toLocaleString("en-IN")} and above</b>. Below that, a flat shipping charge of ₹{s.shippingFee} applies.</li>
          <li>Orders are packed and dispatched within 1–2 business days of payment.</li>
          <li>Delivery usually takes 3–7 business days, depending on your location. Remote areas may take a little longer.</li>
          <li>Once your order ships we email you the tracking number, and you can also find it under My account → Orders.</li>
          <li>Please enter a complete address and a working phone number — the courier will call you before delivery.</li>
        </ul>
      </section>

      <section>
        <h2>Payments</h2>
        <p>All orders are <b>prepaid</b>. We accept UPI and credit / debit cards through our secure payment partner, Razorpay. We do not offer Cash on Delivery.</p>
      </section>

      <section>
        <h2>Cancellations, returns &amp; refunds</h2>
        <p>Every piece is packed to order, so <b>we do not accept order cancellations, returns or refunds</b> once an order has been placed. Please check the product, size and address carefully before you pay.</p>
      </section>

      <section>
        <h2>Damaged products</h2>
        <p>If your jewellery reaches you damaged, we will gladly <b>replace it free of charge</b>. To help us process this quickly:</p>
        <ul>
          <li>Record a continuous <b>unboxing video</b> that shows the sealed parcel (with the shipping label visible) being opened, and the damaged item.</li>
          <li>Email the video, your order number and a couple of clear photos of the damage to <a href={`mailto:${s.contactEmail}`}>{s.contactEmail}</a> <b>within 48 hours of delivery</b>.</li>
          <li>Once we have verified the video, we will dispatch a replacement at no extra cost. If the same design is out of stock, we will offer you a similar piece.</li>
        </ul>
        <p>Claims without an unboxing video, claims made after 48 hours, and damage caused after delivery (wear, mishandling, contact with perfume or chemicals) cannot be accepted. A different colour shade caused by screen settings is not treated as damage.</p>
      </section>

      <section>
        <h2>Need help?</h2>
        <p>
          Write to us at <a href={`mailto:${s.contactEmail}`}>{s.contactEmail}</a> or call {s.contactPhone} ({s.businessHours}). You can also use the <Link href="/contact">contact form</Link>.
        </p>
      </section>
    </PolicyLayout>
  );
}
