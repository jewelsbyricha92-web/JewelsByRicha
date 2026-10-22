"""
Jewels by Richa — Official Project Quotation & Feature List
Strictly mapped to FEATURES.md by Priyank Bohra
Payment Terms: Total Rs. 13,000 (Rs. 2,000 Advance Paid + Rs. 11,000 Upon Live Launch)
"""

import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak, HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_header_footer(num_pages)
            super().showPage()
        super().save()

    def draw_header_footer(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#7A6E63"))
        
        # Header (page 2)
        if self._pageNumber > 1:
            self.drawString(36, 810, "JEWELS BY RICHA  |  Project Quotation & Feature Specification")
            self.drawRightString(A4[0] - 36, 810, "Prepared by Priyank Bohra")
            self.setStrokeColor(colors.HexColor("#D8C8B5"))
            self.setLineWidth(0.5)
            self.line(36, 804, A4[0] - 36, 804)

        # Footer (all pages)
        self.setStrokeColor(colors.HexColor("#D8C8B5"))
        self.setLineWidth(0.5)
        self.line(36, 36, A4[0] - 36, 36)
        
        self.drawString(36, 24, "Jewels by Richa — Anti-tarnish, waterproof jewellery (jewelsbyricha.in)")
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(A4[0] - 36, 24, page_text)
        self.restoreState()


def build_pdf(filename="docs/Jewels_by_Richa_Quotation_and_Features.pdf"):
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    doc = SimpleDocTemplate(
        filename,
        pagesize=A4,
        leftMargin=36,
        rightMargin=36,
        topMargin=38,
        bottomMargin=44
    )

    content = []
    styles = getSampleStyleSheet()

    # Brand Colors
    c_gold = colors.HexColor("#9C721D")
    c_gold_dark = colors.HexColor("#7F5A12")
    c_ink = colors.HexColor("#1A1411")
    c_line = colors.HexColor("#DFCDB9")
    c_bg_light = colors.HexColor("#FDF9F5")
    c_card_bg = colors.HexColor("#F7F1EA")
    c_green = colors.HexColor("#1E6B37")

    # Typography Styles
    title_style = ParagraphStyle(
        'DocTitle',
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=c_ink
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=c_gold_dark
    )
    h1_style = ParagraphStyle(
        'SectionH1',
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=c_ink,
        spaceBefore=7,
        spaceAfter=3
    )
    body_style = ParagraphStyle(
        'DocBody',
        fontName='Helvetica',
        fontSize=8,
        leading=11.5,
        textColor=c_ink
    )
    table_cell = ParagraphStyle(
        'TableCell',
        fontName='Helvetica',
        fontSize=7.6,
        leading=10.5,
        textColor=c_ink
    )
    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        fontName='Helvetica-Bold',
        fontSize=7.6,
        leading=10.5,
        textColor=c_ink
    )
    table_hdr = ParagraphStyle(
        'TableHdr',
        fontName='Helvetica-Bold',
        fontSize=7.8,
        leading=10.8,
        textColor=colors.white
    )

    # 1. HEADER BLOCK
    logo_path = "public/logo.png"
    logo_img = Image(logo_path, width=46, height=46) if os.path.exists(logo_path) else Paragraph("<b>JR</b>", title_style)

    header_table_data = [
        [
            logo_img,
            [
                Paragraph("JEWELS BY RICHA", title_style),
                Paragraph("Website & Admin Panel — Quotation & Technical Feature List", subtitle_style),
                Paragraph("Stack: Next.js 16 · React 19 · PostgreSQL + Prisma · Tailwind CSS v4 · Razorpay · Cloudinary · Nodemailer", body_style)
            ],
            [
                Paragraph("<b>Client:</b> Richa Marwaha Jain", body_style),
                Paragraph("<b>Prepared by:</b> Priyank Bohra", body_style),
                Paragraph("<b>Date:</b> October 2026", body_style),
                Paragraph("<b>Total:</b> Rs. 13,000", body_style),
            ]
        ]
    ]

    header_table = Table(header_table_data, colWidths=[52, 320, 150])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
    ]))
    content.append(header_table)
    content.append(HRFlowable(width="100%", thickness=1.2, color=c_gold, spaceBefore=4, spaceAfter=6))

    # 2. STOREFRONT SPECIFICATION (DIRECT FROM FEATURES.MD)
    content.append(Paragraph("1. Storefront Features (Customer Website — As specified in FEATURES.md)", h1_style))

    storefront_data = [
        [
            Paragraph("<b>Area</b>", table_hdr),
            Paragraph("<b>Exact Features Built (from FEATURES.md)</b>", table_hdr)
        ],
        [
            Paragraph("<b>Browsing & Design</b>", table_cell_bold),
            Paragraph(
                "• <b>Design:</b> Gold / ivory / black palette with serif + script typography, built for phones, tablets, and desktops.<br/>"
                "• <b>Homepage:</b> 3-slide photo hero (auto-play, arrows, dots), trust strip, 2 collection banners, 'Shop by category' (max 8, chosen in admin) with 'View all categories' link, bestsellers with Festive / Anti Tarnish tabs, brand story, new arrivals, customer reviews, and Instagram gallery.<br/>"
                "• <b>Collections & Categories:</b> 2 collections, 19 categories (Festive: Kashmiri Watches, Necklaces, Heritage Bangle Kada, Pendant Sets, AD Bangle Kada, Kashmiri Earrings, Moissanite Earrings, Festive Bracelets, Stud Earrings · Anti Tarnish: Mangalsutra, Bracelet Kada, Chain Bracelets, Rings, Hoop Earrings, Danglers Earrings, Studs Earrings, Chain Necklaces, Combo Necklace Packs, Watches).<br/>"
                "• <b>Navigation:</b> Sticky header with collection mega-menus, mobile slide-in menu, rotating announcement bar (free-shipping threshold from admin settings).<br/>"
                "• <b>Shop Pages:</b> Shop all, by collection, or by category with sorting (featured, newest, price, rating), price-band and in-stock filters, category chips, and 'Show more' pagination (12 at a time).<br/>"
                "• <b>Dedicated Pages:</b> All categories, Bestsellers, New arrivals, Collections.<br/>"
                "• <b>Search:</b> Search overlay with instant results (product name and category).<br/>"
                "• <b>Product Page:</b> Photo gallery (thumbnails on desktop, swipe on phones), price with MRP and % off, rating, feature chips, stock status ('Only 3 left'), quantity selector, Add to bag / Buy now, wishlist, accordions (description, material, care, shipping), 'You may also love', sticky add-to-bag bar on phones, and automatic illustrated placeholders for products without photos.",
                table_cell
            )
        ],
        [
            Paragraph("<b>Bag, Wishlist & Checkout</b>", table_cell_bold),
            Paragraph(
                "• <b>Bag:</b> Slide-out bag drawer and full bag page with free-shipping progress bar, quantity edits, remove, 'Complete the look' suggestions, and sticky checkout button on phones.<br/>"
                "• <b>Wishlist:</b> Works for guests in browser, automatically saved and merged into account after sign-in.<br/>"
                "• <b>Checkout:</b> Contact and delivery form (pre-filled from account default address), saved-address picker, live coupon validator (re-checked on bag/payment change), UPI / card / Cash on Delivery (COD), order summary, sticky pay button on phones.<br/>"
                "• <b>Orders:</b> Order confirmation page, guest checkout supported.",
                table_cell
            )
        ],
        [
            Paragraph("<b>Customer Accounts</b>", table_cell_bold),
            Paragraph(
                "• <b>Auth:</b> Register with emailed 6-digit OTP, sign in, forgot / reset password via OTP, sign out.<br/>"
                "• <b>Account Area:</b> Overview (orders, wishlist, total spent), order history with pagination, order details with progress tracker and courier tracking number, order cancellation (while allowed), pay-again for unpaid online orders, saved address book (add/delete/default), profile edit.<br/>"
                "• <b>Guest Order Linking:</b> Guest orders placed earlier with the same email attach automatically on sign-up.",
                table_cell
            )
        ],
        [
            Paragraph("<b>Content & SEO</b>", table_cell_bold),
            Paragraph(
                "• <b>Content Pages:</b> About, Care guide, FAQ, Contact (messages saved to admin), Shipping & returns (uses live fee settings), Privacy policy, Terms.<br/>"
                "• <b>SEO:</b> Server-rendered catalogue, per-page meta titles/descriptions, Open Graph tags, product JSON-LD structured data, dynamic sitemap.xml and robots.txt, proper 404 status handling.",
                table_cell
            )
        ]
    ]

    storefront_table = Table(storefront_data, colWidths=[120, 402])
    storefront_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_ink),
        ('BOX', (0, 0), (-1, -1), 0.5, c_line),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, c_line),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ]))
    content.append(storefront_table)

    # Page Break to Page 2
    content.append(PageBreak())

    # 3. ADMIN PANEL & BACKEND (DIRECT FROM FEATURES.MD)
    content.append(Paragraph("2. Admin Panel & Backend Architecture (As specified in FEATURES.md)", h1_style))

    admin_data = [
        [
            Paragraph("<b>Section</b>", table_hdr),
            Paragraph("<b>Exact Capabilities Built (from FEATURES.md)</b>", table_hdr)
        ],
        [
            Paragraph("<b>Admin Panel (/admin)</b>", table_cell_bold),
            Paragraph(
                "• <b>Dashboard:</b> Revenue, order count (with pending), customers, products, 30-day sales chart, top categories, recent orders, low-stock list (aggregated in database).<br/>"
                "• <b>Products:</b> Paginated list (20/page) with search, category/status/stock filters, 1-click publish/unpublish, add/edit/delete, photo uploader (Cloudinary, multiple, reorder, cover), price + MRP, stock, badges, SEO slug.<br/>"
                "• <b>Categories:</b> Add/edit/delete (blocked while has products), show/hide, choose max 8 on homepage, sort order.<br/>"
                "• <b>Orders:</b> Paginated with status tabs, search, order detail, change status (Pending -> Confirmed -> Shipped -> Delivered / Cancelled), add tracking number, cancel with automatic restock & coupon release, ship/cancel emails.<br/>"
                "• <b>Customers & Coupons:</b> Customer list with order counts & spent; coupon creator (flat/percent, minimum order, per-customer limit, first-order-only, COD switch, live usage counts).<br/>"
                "• <b>Messages & Settings:</b> Contact inbox, newsletter subscriber count, shipping fee & COD fee controls, free-shipping limit, contact info, admin password change.",
                table_cell
            )
        ],
        [
            Paragraph("<b>Backend & Security</b>", table_cell_bold),
            Paragraph(
                "• <b>PostgreSQL + Prisma:</b> 19 database tables, server-side tamper-proof pricing, atomic checkout transactions (prevents overselling), 1-hour unpaid order auto-cancellation cron job.<br/>"
                "• <b>Payments & Emails (needs keys):</b> Razorpay UPI/card order creation, signature verification, webhook; Nodemailer HTML transactional emails (OTP, confirmation, shipped, cancelled); Cloudinary 8 MB photo upload.<br/>"
                "• <b>Security:</b> Bcrypt password hashing (cost 12), encrypted httpOnly SameSite sessions, 3-layer rate limiting (per-IP flood limiter, per-IP write limiter, route-specific limits), CSRF protection, and Zod input validation.",
                table_cell
            )
        ],
        [
            Paragraph("<b>Explicitly Excluded</b><br/><i>(Per FEATURES.md Section 7)</i>", table_cell_bold),
            Paragraph(
                "Automated refunds (refund manually in Razorpay), GST invoices, courier/shipping-label auto-generation, customer-submitted product reviews, multi-staff admin roles, multi-language.",
                table_cell
            )
        ]
    ]

    admin_table = Table(admin_data, colWidths=[120, 402])
    admin_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_ink),
        ('BOX', (0, 0), (-1, -1), 0.5, c_line),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, c_line),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ]))
    content.append(admin_table)
    content.append(Spacer(1, 8))

    # 4. COMMERCIAL QUOTATION & PAYMENT TERMS (Rs. 13,000)
    content.append(Paragraph("3. Commercial Quotation & Payment Terms", h1_style))
    content.append(Paragraph(
        "Fixed-price turnkey delivery for the complete website, backend database, and admin management suite:",
        body_style
    ))
    content.append(Spacer(1, 4))

    pricing_data = [
        [
            Paragraph("<b>Payment Stage / Service</b>", table_hdr),
            Paragraph("<b>Deliverable Scope</b>", table_hdr),
            Paragraph("<b>Status / Timing</b>", table_hdr),
            Paragraph("<b>Amount (INR)</b>", table_hdr)
        ],
        [
            Paragraph("<b>Advance Payment</b>", table_cell_bold),
            Paragraph("Project Kickoff, initial UI build & repository architectural setup", table_cell),
            Paragraph("<font color='#1E6B37'><b>PAID</b></font>", table_cell_bold),
            Paragraph("Rs. 2,000", table_cell_bold)
        ],
        [
            Paragraph("<b>Balance Payment</b>", table_cell_bold),
            Paragraph("Final handover, client account connections, domain setup & taking the website live", table_cell),
            Paragraph("<b>Payable When Live</b>", table_cell_bold),
            Paragraph("Rs. 11,000", table_cell_bold)
        ],
        [
            Paragraph("<b>TOTAL PROJECT FEE</b>", table_cell_bold),
            Paragraph("<b>Full custom storefront, admin panel, PostgreSQL backend & 100% code ownership</b>", table_cell_bold),
            Paragraph("<b>Fixed</b>", table_cell_bold),
            Paragraph("<font color='#1A1411'><b>Rs. 13,000</b></font>", table_cell_bold)
        ],
        [
            Paragraph("<b>Post-Launch Assistance</b>", table_cell_bold),
            Paragraph("<b>2 Weeks Free Technical Assistance:</b> Operational support, bug fixes & admin guidance following go-live", table_cell),
            Paragraph("<font color='#1E6B37'><b>Included (Free)</b></font>", table_cell_bold),
            Paragraph("<b>Rs. 0</b>", table_cell_bold)
        ],
        [
            Paragraph("<b>Post-Assistance Maintenance</b><br/><i>(Optional)</i>", table_cell_bold),
            Paragraph("Ongoing technical maintenance, updates & bug support after initial 2 weeks. <b>Completely optional (only if needed by client, available up to 1 year).</b>", table_cell),
            Paragraph("<b>Optional (If needed)</b>", table_cell_bold),
            Paragraph("<b>Rs. 2,000</b> / month", table_cell_bold)
        ]
    ]

    pricing_table = Table(pricing_data, colWidths=[110, 260, 80, 72])
    pricing_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_ink),
        ('BOX', (0, 0), (-1, -1), 0.5, c_line),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, c_line),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
        ('BACKGROUND', (0, 1), (-1, 1), c_bg_light),
        ('BACKGROUND', (0, 3), (-1, 3), c_card_bg),
        ('BACKGROUND', (0, 4), (-1, 4), c_bg_light),
    ]))
    content.append(pricing_table)
    content.append(Spacer(1, 8))

    # 5. GO-LIVE REQUIREMENTS & CLIENT ACCOUNTS
    content.append(Paragraph("4. Go-Live Requirements (What We Need from Client)", h1_style))
    content.append(Paragraph(
        "To take the website live and enable online payments and emails, the client provides their account credentials as detailed in the <i>Information Checklist</i>: "
        "<b>1. Razorpay</b> (KYC approved for live payments & webhook), "
        "<b>2. Cloudinary</b> (free tier for product photo uploads), "
        "<b>3. SMTP Email</b> (for sending OTPs and customer notifications), "
        "<b>4. Domain & DNS Access</b> (to link jewelsbyricha.in to Vercel).",
        body_style
    ))
    content.append(Spacer(1, 10))

    # 6. SIGN-OFF BLOCK
    sign_data = [
        [
            Paragraph("<b>Prepared by:</b><br/><br/>Priyank Bohra<br/>Lead Technical Developer", table_cell),
            Paragraph("<b>Accepted & Approved by:</b><br/><br/>Richa Marwaha Jain<br/>Founder, Jewels by Richa", table_cell)
        ],
        [
            Paragraph("Signature: _______________________<br/>Date: ___________________________", table_cell),
            Paragraph("Signature: _______________________<br/>Date: ___________________________", table_cell)
        ]
    ]
    sign_table = Table(sign_data, colWidths=[260, 260])
    sign_table.setStyle(TableStyle([
        ('BOX', (0, 0), (-1, -1), 0.5, c_line),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, c_line),
        ('BACKGROUND', (0, 0), (-1, -1), c_bg_light),
        ('TOPPADDING', (0, 0), (-1, -1), 4.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4.5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    content.append(sign_table)

    # Build PDF
    doc.build(content, canvasmaker=NumberedCanvas)
    print(f"Successfully generated: {filename}")

if __name__ == "__main__":
    build_pdf()
