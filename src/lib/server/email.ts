import nodemailer from "nodemailer";
import type { Order, StoreSettings } from "@/types/shop";
import { getSettings } from "./settings";

const host = process.env.SMTP_HOST;
const port = Number(process.env.SMTP_PORT || 587);
const configured = !!(host && process.env.SMTP_USER && process.env.SMTP_PASS);
const FROM = process.env.EMAIL_FROM || "Jewels by Richa <jewelsbyricha92@gmail.com>";
const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3010").replace(/\/$/, "");

const transporter = configured
  ? nodemailer.createTransport({ host, port, secure: port === 465, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } })
  : null;

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");
const abs = (url: string) => (/^https?:\/\//.test(url) ? url : `${SITE}${url.startsWith("/") ? "" : "/"}${url}`);
const longDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

/** Sends an email. With no SMTP configured (local dev) it is printed to the server console instead. */
export async function sendMail(to: string, subject: string, html: string, text?: string, replyTo?: string) {
  const plain = text ?? html.replace(/<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (!transporter) {
    console.log(`\n[email:dev] to=${to}\n  subject: ${subject}\n  ${plain}\n`);
    return true;
  }
  try {
    await transporter.sendMail({ from: FROM, to, subject, html, text: plain, ...(replyTo ? { replyTo } : {}) });
    return true;
  } catch (e) {
    console.error("[email] failed", e);
    return false;
  }
}

/* ----------------------------------------------------------------------------------------------------------------
 * Look & feel — table layout with inline styles so it renders the same in Gmail, Outlook, Apple Mail and phones.
 * -------------------------------------------------------------------------------------------------------------- */
const C = { ink: "#121110", gold: "#b8913a", goldLight: "#e6cf93", cream: "#faf5ea", sand: "#f3ece0", line: "#e8dfcc", muted: "#7a7266", green: "#2f7d4f" };
const SERIF = "Georgia,'Times New Roman',serif";
const SANS = "'Helvetica Neue',Helvetica,Arial,sans-serif";

const button = (href: string, label: string) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px auto 4px"><tr><td align="center" bgcolor="${C.ink}" style="background:${C.ink};border-bottom:3px solid ${C.gold}">
    <a href="${esc(href)}" style="display:inline-block;padding:14px 34px;font:600 12px ${SANS};letter-spacing:2.5px;text-transform:uppercase;color:${C.goldLight};text-decoration:none">${esc(label)}</a></td></tr></table>`;

const p = (html: string, extra = "") => `<p style="margin:0 0 14px;font:15px/1.65 ${SANS};color:#3a352e;${extra}">${html}</p>`;
const h1 = (t: string) => `<h1 style="margin:0 0 6px;font:400 28px/1.25 ${SERIF};color:${C.ink};text-align:center">${esc(t)}</h1>`;
const rule = `<table role="presentation" width="60" align="center" cellpadding="0" cellspacing="0" style="margin:14px auto 22px"><tr><td height="2" style="background:${C.gold};font-size:0;line-height:0">&nbsp;</td></tr></table>`;

function layout(opts: { title: string; preheader: string; body: string; s: StoreSettings }) {
  const { title, preheader, body, s } = opts;
  const logo = /^https:\/\//.test(SITE) ? `<img src="${SITE}/logo.png" width="64" height="64" alt="" style="display:block;margin:0 auto 12px;border-radius:50%;border:1px solid ${C.gold}" />` : "";
  const insta = s.instagram ? `<a href="https://instagram.com/${esc(s.instagram)}" style="color:${C.gold};text-decoration:none">Instagram</a> &nbsp;·&nbsp; ` : "";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:${C.sand}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${C.sand};font-size:1px;line-height:1px">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.sand}"><tr><td align="center" style="padding:28px 12px">
 <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border:1px solid ${C.line}">
  <tr><td align="center" style="background:${C.ink};padding:30px 20px 24px">
    ${logo}
    <div style="font:400 24px ${SERIF};letter-spacing:9px;color:${C.goldLight};padding-left:9px">JEWELS</div>
    <div style="font:italic 400 18px ${SERIF};color:${C.gold};margin-top:2px">by Richa</div>
  </td></tr>
  <tr><td height="3" style="background:${C.gold};font-size:0;line-height:0">&nbsp;</td></tr>
  <tr><td style="padding:38px 34px 30px">${body}</td></tr>
  <tr><td style="background:${C.cream};border-top:1px solid ${C.line};padding:24px 28px;text-align:center;font:12px/1.7 ${SANS};color:${C.muted}">
    <div style="font:italic 15px ${SERIF};color:${C.ink};margin-bottom:8px">Timeless • Trendy • Yours</div>
    Questions? Write to <a href="mailto:${esc(s.contactEmail)}" style="color:${C.gold};text-decoration:none">${esc(s.contactEmail)}</a> or call ${esc(s.contactPhone)}<br/>
    ${esc(s.businessHours)}<br/>
    <div style="margin-top:10px">${insta}<a href="${SITE}/shipping-returns" style="color:${C.gold};text-decoration:none">Shipping &amp; returns</a> &nbsp;·&nbsp; <a href="${SITE}/privacy-policy" style="color:${C.gold};text-decoration:none">Privacy</a></div>
  </td></tr>
 </table>
 <div style="font:11px ${SANS};color:${C.muted};padding:14px 10px">© ${new Date().getFullYear()} Jewels by Richa. You received this email because of activity on ${SITE.replace(/^https?:\/\//, "")}.</div>
</td></tr></table></body></html>`;
}

/* ------------------------------------------------------------------------------------------------ one-time codes */

export function buildOtpEmail(otp: string, purpose: "register" | "reset", s: StoreSettings) {
  const reset = purpose === "reset";
  const title = reset ? "Reset your password" : "Verify your email";
  const body = `${h1(title)}${rule}
    ${p(reset ? "We received a request to reset the password for your Jewels by Richa account. Use this code to continue:" : "Thank you for choosing Jewels by Richa. Please use this code to confirm your email address:", "text-align:center")}
    <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:22px auto"><tr><td align="center" style="background:${C.cream};border:1px dashed ${C.gold};padding:18px 34px">
      <div style="font:700 34px ${SANS};letter-spacing:12px;padding-left:12px;color:${C.ink}">${esc(otp)}</div>
    </td></tr></table>
    ${p("This code is valid for <b>10 minutes</b> and can be used only once.", "text-align:center")}
    ${p(`If you didn't ask for this, you can safely ignore this email — nothing will change. For your security, never share this code with anyone, including us.`, `text-align:center;font-size:13px;color:${C.muted}`)}`;
  return {
    subject: reset ? "Reset your Jewels by Richa password" : `${otp} is your Jewels by Richa verification code`,
    html: layout({ title, preheader: `Your code is ${otp}. It expires in 10 minutes.`, body, s }),
    text: `${title}\n\nYour Jewels by Richa code is ${otp}. It is valid for 10 minutes and can be used once.\nIf you didn't request it, ignore this email. Never share this code with anyone.`,
  };
}

/* --------------------------------------------------------------------------------------------------------- orders */

function itemsTable(o: Order) {
  const rows = o.items
    .map(
      (i) => `<tr>
      <td width="68" valign="top" style="padding:14px 0;border-bottom:1px solid ${C.line}">${
        i.image ? `<img src="${esc(abs(i.image))}" width="60" height="75" alt="" style="display:block;width:60px;height:75px;object-fit:cover;border:1px solid ${C.line}" />` : `<div style="width:60px;height:75px;background:${C.cream};border:1px solid ${C.line}"></div>`
      }</td>
      <td valign="top" style="padding:14px 12px;border-bottom:1px solid ${C.line};font:14px/1.5 ${SANS};color:${C.ink}"><div style="font:400 17px/1.3 ${SERIF}">${esc(i.name)}</div><div style="color:${C.muted};font-size:12px;margin-top:3px">Qty ${i.quantity} × ${inr(i.price)}</div></td>
      <td valign="top" align="right" style="padding:14px 0;border-bottom:1px solid ${C.line};font:600 14px ${SANS};color:${C.ink};white-space:nowrap">${inr(i.price * i.quantity)}</td></tr>`,
    )
    .join("");
  const line = (label: string, value: string, extra = "") => `<tr><td style="padding:5px 0;font:14px ${SANS};color:${C.muted};${extra}">${label}</td><td align="right" style="padding:5px 0;font:14px ${SANS};color:${C.ink};${extra}">${value}</td></tr>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${C.line}">${rows}</table>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px">
    ${line("Subtotal", inr(o.subtotal))}
    ${o.discount ? line(`Discount${o.couponCode ? ` (${esc(o.couponCode)})` : ""}`, `<span style="color:${C.green}">− ${inr(o.discount)}</span>`) : ""}
    ${line("Shipping", o.shipping ? inr(o.shipping) : `<span style="color:${C.green}">Free</span>`)}
    <tr><td colspan="2" height="8" style="font-size:0;line-height:0;border-bottom:1px solid ${C.line}">&nbsp;</td></tr>
    <tr><td style="padding-top:12px;font:600 16px ${SANS};color:${C.ink}">Total paid</td><td align="right" style="padding-top:12px;font:700 20px ${SANS};color:${C.ink}">${inr(o.total)}</td></tr>
  </table>`;
}

const addressCard = (o: Order, heading: string) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;background:${C.cream};border:1px solid ${C.line}"><tr><td style="padding:16px 18px;font:14px/1.6 ${SANS};color:${C.ink}">
    <div style="font:600 11px ${SANS};letter-spacing:2px;text-transform:uppercase;color:${C.gold};margin-bottom:6px">${esc(heading)}</div>
    <b>${esc(o.shippingAddress?.name ?? o.customerName)}</b><br/>${esc(o.address)}<br/><span style="color:${C.muted}">${esc(o.phone)}</span></td></tr></table>`;

const orderLink = (o: Order) => `${SITE}/account/orders/${encodeURIComponent(o.id)}`;

export function buildOrderConfirmation(o: Order, s: StoreSettings) {
  const first = o.customerName.split(" ")[0];
  const body = `${h1(`Thank you, ${first}!`)}${rule}
    ${p(`Your order is confirmed and payment has been received. We're getting your jewellery ready — it usually ships within 1–2 business days.`, "text-align:center")}
    <table role="presentation" align="center" cellpadding="0" cellspacing="0" style="margin:18px auto 24px"><tr>
      <td style="padding:10px 22px;border:1px solid ${C.line};text-align:center;font:12px ${SANS};color:${C.muted}">ORDER NUMBER<br/><b style="font:700 16px ${SANS};color:${C.ink};letter-spacing:1px">${esc(o.id)}</b></td>
      <td style="padding:10px 22px;border:1px solid ${C.line};border-left:0;text-align:center;font:12px ${SANS};color:${C.muted}">PLACED ON<br/><b style="font:700 16px ${SANS};color:${C.ink}">${esc(longDate(o.createdAt))}</b></td></tr></table>
    ${itemsTable(o)}
    ${addressCard(o, "Delivering to")}
    ${button(orderLink(o), "View your order")}
    ${p(`We'll email you again with the tracking details as soon as your parcel ships.`, `text-align:center;margin-top:18px;font-size:13px;color:${C.muted}`)}
    ${p(`<b>Please note:</b> orders can't be cancelled or returned once placed. If a piece arrives damaged, record an unboxing video and email it to us within 48 hours of delivery — we'll replace it free of charge.`, `font-size:12.5px;color:${C.muted};border-top:1px solid ${C.line};padding-top:16px;margin-top:22px`)}`;
  const lines = o.items.map((i) => `  - ${i.name} x ${i.quantity}  ${inr(i.price * i.quantity)}`).join("\n");
  return {
    subject: `Order ${o.id} confirmed — Jewels by Richa`,
    html: layout({ title: `Order ${o.id} confirmed`, preheader: `Thank you, ${first}! Your order ${o.id} of ${inr(o.total)} is confirmed.`, body, s }),
    text: `Thank you, ${first}!\n\nYour order ${o.id} (${longDate(o.createdAt)}) is confirmed.\n\n${lines}\n\nSubtotal ${inr(o.subtotal)}${o.discount ? `\nDiscount -${inr(o.discount)}` : ""}\nShipping ${o.shipping ? inr(o.shipping) : "Free"}\nTotal paid ${inr(o.total)}\n\nDelivering to:\n${o.shippingAddress?.name ?? o.customerName}, ${o.address}\n\nView your order: ${orderLink(o)}`,
  };
}

export function buildOrderShipped(o: Order, s: StoreSettings) {
  const body = `${h1("Your order is on its way")}${rule}
    ${p(`Good news, ${esc(o.customerName.split(" ")[0])} — order <b>${esc(o.id)}</b> has been dispatched and is headed to you.`, "text-align:center")}
    ${
      o.trackingNumber
        ? `<table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:20px auto"><tr><td align="center" style="background:${C.cream};border:1px dashed ${C.gold};padding:16px 30px">
        <div style="font:600 11px ${SANS};letter-spacing:2px;text-transform:uppercase;color:${C.gold};margin-bottom:4px">Tracking number</div>
        <div style="font:700 20px ${SANS};letter-spacing:2px;color:${C.ink}">${esc(o.trackingNumber)}</div></td></tr></table>`
        : ""
    }
    ${p("Delivery usually takes 3–7 business days depending on your location. The courier may call you before delivery, so please keep your phone handy.", "text-align:center")}
    ${addressCard(o, "Delivering to")}
    <div style="margin-top:22px">${itemsTable(o)}</div>
    ${button(orderLink(o), "Track your order")}`;
  return {
    subject: `Your order ${o.id} is on its way`,
    html: layout({ title: "Your order is on its way", preheader: `Order ${o.id} has shipped${o.trackingNumber ? ` — tracking ${o.trackingNumber}` : ""}.`, body, s }),
    text: `Your order ${o.id} has shipped.${o.trackingNumber ? `\nTracking number: ${o.trackingNumber}` : ""}\n\nDelivering to: ${o.shippingAddress?.name ?? o.customerName}, ${o.address}\n\nTrack your order: ${orderLink(o)}`,
  };
}

export function buildOrderCancelled(o: Order, s: StoreSettings) {
  const body = `${h1("Your order was cancelled")}${rule}
    ${p(`Order <b>${esc(o.id)}</b> has been cancelled.${o.paymentStatus === "REFUNDED" ? " We'll contact you shortly about the amount you paid." : ""}`, "text-align:center")}
    ${itemsTable(o)}
    ${p(`If you didn't expect this, or have any questions, just reply to this email and we'll help.`, `text-align:center;margin-top:20px;font-size:13px;color:${C.muted}`)}
    ${button(`${SITE}/shop`, "Continue shopping")}`;
  return {
    subject: `Order ${o.id} cancelled`,
    html: layout({ title: "Your order was cancelled", preheader: `Order ${o.id} has been cancelled.`, body, s }),
    text: `Order ${o.id} has been cancelled.${o.paymentStatus === "REFUNDED" ? " We'll contact you about the amount you paid." : ""}\nQuestions? Just reply to this email.`,
  };
}

export function buildContactNotification(name: string, email: string, message: string, s: StoreSettings) {
  const body = `${h1("New website message")}${rule}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.cream};border:1px solid ${C.line}"><tr><td style="padding:16px 18px;font:14px/1.6 ${SANS};color:${C.ink}">
      <b>${esc(name)}</b><br/><a href="mailto:${esc(email)}" style="color:${C.gold};text-decoration:none">${esc(email)}</a></td></tr></table>
    <div style="margin-top:18px;font:15px/1.7 ${SANS};color:#3a352e">${esc(message).replace(/\n/g, "<br/>")}</div>
    ${button(`${SITE}/admin/messages`, "Open in admin")}
    ${p(`Reply directly to this email to answer ${esc(name.split(" ")[0])}.`, `text-align:center;font-size:12.5px;color:${C.muted}`)}`;
  return {
    subject: `New website message from ${name}`,
    html: layout({ title: "New website message", preheader: `${name} wrote to you through the website.`, body, s }),
    text: `New website message\n\nFrom: ${name} <${email}>\n\n${message}\n\nOpen in admin: ${SITE}/admin/messages`,
  };
}

/* --------------------------------------------------------------------------------------------------------- senders */

export const sendOtpEmail = async (to: string, otp: string, purpose: "register" | "reset") => {
  const m = buildOtpEmail(otp, purpose, await getSettings());
  return sendMail(to, m.subject, m.html, m.text);
};

export const sendOrderConfirmation = async (o: Order) => {
  const m = buildOrderConfirmation(o, await getSettings());
  return sendMail(o.email, m.subject, m.html, m.text);
};

export const sendOrderShipped = async (o: Order) => {
  const m = buildOrderShipped(o, await getSettings());
  return sendMail(o.email, m.subject, m.html, m.text);
};

export const sendOrderCancelled = async (o: Order) => {
  const m = buildOrderCancelled(o, await getSettings());
  return sendMail(o.email, m.subject, m.html, m.text);
};

export const sendContactNotification = async (to: string, name: string, email: string, message: string) => {
  const m = buildContactNotification(name, email, message, await getSettings());
  return sendMail(to, m.subject, m.html, m.text, email);
};
