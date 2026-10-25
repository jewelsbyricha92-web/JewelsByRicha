import type { Metadata } from "next";
import { PolicyLayout } from "@/components/ui/PolicyLayout";
import { getSettings } from "@/lib/server/settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Privacy policy" };

export default async function PrivacyPage() {
  const s = await getSettings();
  return (
    <PolicyLayout eyebrow="Legal" title="Privacy policy" intro="How Jewels by Richa collects, uses and protects your information.">
      <section>
        <h2>Information we collect</h2>
        <p>When you create an account, place an order or contact us, we collect your name, email address, phone number, delivery address and order history. If you sign up for our newsletter, we collect your email address. We also keep basic technical information (such as your IP address and browser type) to keep the website secure.</p>
      </section>

      <section>
        <h2>How we use it</h2>
        <ul>
          <li>To process and deliver your orders and send order updates.</li>
          <li>To manage your account, send one-time passwords (OTP) and reply to your messages.</li>
          <li>To send news and offers, only if you have subscribed — you can unsubscribe at any time.</li>
          <li>To prevent fraud and keep the website safe.</li>
        </ul>
      </section>

      <section>
        <h2>Payments</h2>
        <p>Payments are handled by Razorpay. Your card, UPI and bank details are entered on Razorpay&apos;s secure page and are never seen or stored by us.</p>
      </section>

      <section>
        <h2>Who we share it with</h2>
        <p>We do not sell your personal information. We share only what is needed with the services that help us run the store — our payment provider, courier partners (name, phone and address, to deliver your parcel), and email and hosting providers. They may use your data only for these purposes.</p>
      </section>

      <section>
        <h2>Cookies</h2>
        <p>We use essential cookies and browser storage to keep you signed in and to remember your bag and wishlist. We do not use them to track you across other websites.</p>
      </section>

      <section>
        <h2>Your choices</h2>
        <p>You can update your details from My account at any time. To access, correct or delete your data, or to stop receiving emails, write to us at <a href={`mailto:${s.contactEmail}`}>{s.contactEmail}</a>.</p>
      </section>

      <section>
        <h2>Security</h2>
        <p>Passwords are stored in encrypted form and the website uses secure (HTTPS) connections. No method of transmission over the internet is completely secure, but we take reasonable steps to protect your information.</p>
      </section>

      <section>
        <h2>Changes to this policy</h2>
        <p>We may update this policy from time to time. The latest version will always be on this page.</p>
      </section>
    </PolicyLayout>
  );
}
