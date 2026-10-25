import nodemailer from "nodemailer";
import type { Order } from "@/types/shop";

const host = process.env.SMTP_HOST;
const port = Number(process.env.SMTP_PORT || 587);
const configured = !!(host && process.env.SMTP_USER && process.env.SMTP_PASS);
const FROM = process.env.EMAIL_FROM || "Jewels by Richa <jewelsbyricha92@gmail.com>";
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3010";

const transporter = configured
  ? nodemailer.createTransport({ host, port, secure: port === 465, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } })
  : null;

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

/** Sends an email. With no SMTP configured (local dev) it is printed to the server console instead. */
export async function sendMail(to: string, subject: string, html: string, text?: string) {
  const plain = text ?? html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (!transporter) {
    console.log(`\n[email:dev] to=${to}\n  subject: ${subject}\n  ${plain}\n`);
    return true;
  }
  try {
    await transporter.sendMail({ from: FROM, to, subject, html, text: plain });
    return true;
  } catch (e) {
    console.error("[email] failed", e);
    return false;
  }
}

function layout(title: string, body: string) {
  return `<div style="background:#fbf8f1;padding:24px;font-family:Georgia,serif;color:#121110"><div style="max-width:560px;margin:auto;background:#fff;border:1px solid #e5dcc8">
  <div style="background:#121110;color:#e6cf93;text-align:center;padding:22px;letter-spacing:6px;font-size:18px">JEWELS BY RICHA</div>
  <div style="padding:28px"><h2 style="font-weight:400;margin:0 0 14px">${esc(title)}</h2><div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6">${body}</div></div>
  <div style="background:#f4ede0;text-align:center;padding:14px;font:12px Arial,sans-serif;color:#7a7266">Timeless • Trendy • Yours</div></div></div>`;
}

export const sendOtpEmail = (to: string, otp: string, purpose: "register" | "reset") =>
  sendMail(
    to,
    purpose === "register" ? "Your Jewels by Richa verification code" : "Reset your Jewels by Richa password",
    layout(
      purpose === "register" ? "Verify your email" : "Reset your password",
      `<p>Your one-time code is</p><p style="font-size:30px;letter-spacing:8px;margin:12px 0"><b>${otp}</b></p><p>It expires in 10 minutes. If you did not request this, you can ignore this email.</p>`,
    ),
    `Your Jewels by Richa verification code is ${otp}. It expires in 10 minutes.`,
  );

function orderTable(o: Order) {
  const rows = o.items.map((i) => `<tr><td style="padding:6px 0">${esc(i.name)} × ${i.quantity}</td><td style="text-align:right">${inr(i.price * i.quantity)}</td></tr>`).join("");
  return `<table width="100%" style="border-collapse:collapse;border-top:1px solid #e5dcc8;margin:12px 0">${rows}
  <tr><td style="padding-top:8px;border-top:1px solid #e5dcc8">Subtotal</td><td style="text-align:right;border-top:1px solid #e5dcc8">${inr(o.subtotal)}</td></tr>
  ${o.discount ? `<tr><td>Discount${o.couponCode ? ` (${esc(o.couponCode)})` : ""}</td><td style="text-align:right">− ${inr(o.discount)}</td></tr>` : ""}
  <tr><td>Shipping &amp; fees</td><td style="text-align:right">${o.shipping ? inr(o.shipping) : "Free"}</td></tr>
  <tr><td style="padding-top:6px"><b>Total</b></td><td style="text-align:right;padding-top:6px"><b>${inr(o.total)}</b></td></tr></table>`;
}

export const sendOrderConfirmation = (o: Order) =>
  sendMail(
    o.email,
    `Order ${o.id} confirmed — Jewels by Richa`,
    layout(
      `Thank you, ${o.customerName.split(" ")[0]}!`,
      `<p>We've received your order <b>${esc(o.id)}</b>.</p>${orderTable(o)}<p><b>Delivering to:</b><br/>${esc(o.address)}</p><p>We'll email you again when it ships.</p>`,
    ),
  );

export const sendOrderShipped = (o: Order) =>
  sendMail(
    o.email,
    `Your order ${o.id} is on its way`,
    layout("Your order has shipped", `<p>Good news — order <b>${esc(o.id)}</b> has been dispatched.</p>${o.trackingNumber ? `<p>Tracking number: <b>${esc(o.trackingNumber)}</b></p>` : ""}<p>Delivering to:<br/>${esc(o.address)}</p>`),
  );

export const sendOrderCancelled = (o: Order) =>
  sendMail(
    o.email,
    `Order ${o.id} cancelled`,
    layout("Your order was cancelled", `<p>Order <b>${esc(o.id)}</b> has been cancelled.${o.paymentStatus === "REFUNDED" ? " We'll contact you about the amount you paid." : ""}</p><p>Questions? Just reply to this email.</p>`),
  );

export const sendContactNotification = (to: string, name: string, email: string, message: string) =>
  sendMail(to, `New website message from ${name}`, layout("New contact message", `<p><b>${esc(name)}</b> (${esc(email)})</p><p>${esc(message).replace(/\n/g, "<br/>")}</p><p><a href="${SITE}/admin">Open admin</a></p>`));
