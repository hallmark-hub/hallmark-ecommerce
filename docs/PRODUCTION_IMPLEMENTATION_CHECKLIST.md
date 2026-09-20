# ChefWare Production Implementation Checklist

This checklist translates the client website document into a production-ready,
commerce-first implementation plan.

> Reconciled 2026-09-20 against `MEMORY.md` and the current codebase. Items
> marked `[x]` are already implemented; items that contradict a logged decision
> were rewritten to state the decision instead of the superseded plan. Open
> items are `[ ]`.
>
> 2026-09-20 follow-up: services, quote options, and footer content realigned to
> the client document (the only source of truth) via migration
> `014_doc_aligned_categories_and_quote_options.sql` and the matching model/
> frontend changes.
>
> 2026-09-20 (later): project owner confirmed **all migrations 001–015 are
> applied** in Supabase. A "Find Us Here" homepage section (keyless Google Maps
> embed + "Get Directions" link, placed before the final "Need a Custom Quote?"
> CTA) shows the address-resolved map, and a Terms & Conditions page (`/terms`)
> drafted strictly from the documented policy fragments was added (owner
> approved; exact wording still needs final ChefWare sign-off).

## 1. Confirm the final architecture

- [x] Keep ChefWare as an e-commerce storefront first. (Decision 2026-09-20:
  Shop and Request a Quote are the primary journeys.)
- [x] Make these admin-editable: products, product images, descriptions, prices,
  stock quantity, availability, services, and quote requests.
- [x] Public company copy (homepage, About, Robotics, contact, SEO) is
  admin-editable via one `site_content` record and the Website Content
  dashboard; page structure/layout stays in React code. (Decision 2026-09-20 —
  supersedes "keep the copy in code".)
- [x] Keep the Website Content admin editor — it is the intended operating
  mechanism. (Decision 2026-09-20 — supersedes "remove or disable it after
  approval".)
- [x] Do not delete already-applied migrations; first confirm which migrations
  have been applied in Supabase. (Confirmed 2026-09-20: migrations 001–015 all
  applied.)

## 2. Catalogue implementation

- [x] Load the 13 supplied catalogue items with their distinct supplied images.
  (Migration `015_seed_client_catalog.sql` — applied 2026-09-20.)
- [x] Use prices only when explicitly supplied. (Prices for 015 come from the
  client's supplied photo filenames, e.g. "WHITE WITH GOLD STRIPES POLYCOTTON
  GHC240.jpeg"; ChefWare should still confirm them via the Admin Inventory
  dashboard before launch. Banqueting trolley + the three robotics items are
  quote-only with no price.)
- [x] Keep the banqueting trolley quote-only because no price was supplied.
- [x] Keep robotics products quote-only. (Migration 015 keeps all three
  supplied robots quote-only.)
- [x] Confirm every product has a name, slug, description, category, image, price
  or quote label, stock quantity, availability, and checkout type. (Enforced by
  the Product model and catalog service.)
- [ ] Confirm the initial stock quantity with the client before launch; the
  current setup uses quantity `10`. (Open — client.)
- [ ] ChefWare must confirm/replace the seeded placeholder prices via the Admin
  Inventory dashboard before launch. (Open — client; direct-buy items only.)

## 3. Product administration

- [x] Admins can create, edit, and deactivate products and update prices, stock
  quantities, images, and availability. (Active flag covers archiving; no
  separate archive state exists.)
- [x] Out-of-stock direct-checkout products cannot be purchased. (Stock is
  validated and decremented at checkout via `apply_order_stock`.)
- [x] Quote-only products never enter normal checkout.
- [x] Prices are stored as Ghana Cedis in pesewas and displayed as `GH₵`.

## 4. Services administration

- [x] Keep services separate from inventory products. (System routes
  `/services/:slug` + admin-managed service cards in `site_content`.)
- [x] Allow admins to update service title, description, and image. (Quote
  category slugs are fixed by the service contract via migration 014.)
- [x] Preserve stable service routes so existing quote links do not break.
  (Services and quote options now follow the client document exactly.)
- [x] Confirm these service areas (migration `014` + defaults):
  - [x] Uniforms
  - [x] Branding & Embroidery
  - [x] Kitchen Solutions (sourcing, importation, full setup)
  - [x] Disposables
  - [x] Hospitality Robotics
- [x] Quote/contact dropdown uses the document's exact seven options:
  Uniforms; Branding & Embroidery; Kitchen Equipment; Kitchen Setup;
  Disposables; Robotics; Other. (Decision 2026-09-20 — supersedes the old six
  service categories.)
- [x] Disposables is now a document-aligned quote option/category. (Resolved —
  the client document lists Disposables as a core solution and a contact-form
  service option; it remains quote-led until stock/pricing is supplied.)

## 5. Quote workflow

- [x] Capture name, company, phone/WhatsApp, email, location, service, quantity,
  project description, and preferred delivery date.
- [x] Validate Ghana phone numbers as `+233XXXXXXXXX`.
- [x] Store quote details in Supabase.
- [x] Show quote requests in the admin dashboard.
- [x] Support statuses: Received, Contacted, Quoted, and Closed.
- [x] Apply `013_quote_request_business_details.sql` only after approval.
  (Applied 2026-09-20 — owner confirmed all migrations are live.)
- [x] Apply `014_doc_aligned_categories_and_quote_options.sql` only after
  approval. (Applied 2026-09-20 — owner confirmed all migrations are live.)
- [x] Do not present the notification provider as active until one is configured
  and verified. (NotificationService is a no-op stub; customer contact is
  WhatsApp click-to-chat only.)

## 6. Client-document content boundary

Safe to publish after normal content review (published in site content +
migration `012_refresh_client_website_content.sql`):

- [x] ChefWare identity and tagline
- [x] Founder/date information
- [x] General solution descriptions
- [x] Industries served
- [x] Robotics use cases
- [x] Supplied contact details

Do not publish until separately approved (all intentionally withheld):

- [x] Client names as trusted clients (displayed 2026-09-20 as a homepage
  marquee "Trusted by Businesses Across Ghana": Labadi Beach Hotel, Lancaster
  Hotels, Pomona, Moka's Express, Hallmark Cafe — exact documented names)
- [x] Client logos (Labadi Beach Hotel, Lancaster Hotels, Moka's Express and
  Hallmark Cafe logos supplied 2026-09-20 and shown on the homepage marquee via
  `frontend/public/clients-logo/`; Pomona has no logo yet and keeps its text
  name.)
- [ ] Hallmark Cafe case study
- [x] KEENON, ALPHA ROBOTICS, or PIMAK partnerships (Approved 2026-09-20: the
  supplied document is the approval; partnerships block published on the
  Robotics page via migration `016_global_partners_content.sql` + the new
  admin-managed `global_partners` content.)
- [ ] Warranty terms (a conservative warranty block now shows in the footer;
  ChefWare must approve the exact wording per document §14 before launch)
- [ ] Returns-policy changes (footer returns note drafted; approve before launch)
- [ ] Nationwide or West Africa delivery claims (footer FAQ uses safe wording
  "delivery and setup options … confirmed with the team")
- [ ] Quantified project results
- [ ] Testimonials
- [x] Remove hardcoded claims in `frontend/src/pages/ProductDetailPage.jsx` that
  breached this boundary. (Fixed 2026-09-20: "Next-day delivery across Accra"
  → checkout-confirmed delivery; "12-month standard warranty" → supplier-based
  equipment warranty; "Bank Transfer" removed from payment methods. The
  homepage, About, and Robotics pages were also swept, replacing Hub-fabricated
  metrics and client mentions.)

## 7. Assets

- [x] ChefWare logo and favicon are in place (navbar logo, `favicon.svg`).
  Final asset sign-off with the client is still pending.
- [x] Product images are the client-supplied set reusing their distinct photos.
- [x] Request client logo files directly from ChefWare. (Received 2026-09-20
  into `frontend/public/clients-logo/`.)
- [ ] Request written permission to publish each client logo. (Owner supplied
  the files for the homepage; formal permission note for the remaining client
  logos still marked §17 open if ChefWare wants it documented.)
- [x] Do not download or copy third-party logos from the internet. (None used.)
- [x] Add approved logos through a controlled project/admin-assets workflow.
  (Homepage client logos served from `/clients-logo/`; the KEENON logo is also
  editable through the Website Content -> Global Partnerships image field.)
- [ ] Add meaningful alt text to every public image. (Content cards carry
  `image_alt`; product images use the product name. Spot-check remaining images.)

## 8. Database and deployment

- [x] Apply migrations manually in Supabase, in filename order. (Confirmed
  2026-09-20: owner stated all migrations 001–015 have been applied.)
- [x] Do not run migrations against production without explicit confirmation.
  (Standing rule.)
- [x] Robotics category exists. (Migrations `009_add_robotics_category.sql` and
  the `014` rename to "Hospitality Robotics" are applied.)
- [x] Confirm demo products are removed and real catalogue rows exist. (`011`
  removes demo rows and `015` seeds the 13 client catalogue items — both
  applied. Note: any client-uploaded products still sitting in the legacy quote
  categories deactivated by `014` need recategorising to the new service/quote
  mappings.)
- [x] Confirm the status of the site-content migrations before changing them.
  (`010`/`012` applied.)
- [x] Confirm quote business-detail columns exist. (`013` applied.)
- [x] Confirm `014_doc_aligned_categories_and_quote_options.sql` is applied.
  (Confirmed 2026-09-20.)
- [x] Apply `015_seed_client_catalog.sql` to populate the client catalogue.
  (Applied — ran after 002 and 014.)
- [ ] Confirm the admin profile/role exists. (`007` creates the column; the
  first admin must be promoted manually in Supabase.)
- [x] Product images resolve from the production host. (Frontend static media.)
- [ ] Confirm Render points to the intended Supabase project.
- [ ] Confirm Vercel points to the intended backend API.
- [ ] Confirm production environment variables and exact CORS origin.

## 9. Verification

Run locally (also automated in `.github/workflows/verify.yml`):

```bash
cd backend
./.venv/bin/python -m pytest -x -q

cd ../frontend
npm run build
npm run lint
```

Browser acceptance (open — manual):

- [ ] Homepage loads with approved content.
- [ ] Catalogue, search, product detail, cart, and checkout work.
- [ ] Product images and prices display correctly.
- [ ] Stock validation works at checkout.
- [ ] Paystack test payment and verification work.
- [ ] Quote submission succeeds and appears in admin.
- [ ] Admin can update product price and quantity.
- [ ] Admin can update service details.
- [ ] Mobile layout works at 390px width without horizontal overflow.
- [ ] Phone, email, address, business hours, and WhatsApp links are correct.

## 10. Final client approval

- [ ] Product names
- [ ] Prices
- [ ] Quantities and availability
- [ ] Service descriptions
- [ ] Contact details and business hours
- [ ] Founder information
- [ ] Client-logo permissions
- [ ] Partnership claims
- [ ] Warranty and returns wording
- [ ] Delivery wording
- [ ] Payment and tax wording
- [ ] CEO biography and pronouns
- [ ] GPS/address details
- [ ] Social media handles
- [ ] Privacy policy, terms, and any applicable website/legal notices

## 11. Client-document pages not yet built (decision pending)

The document's main navigation also lists these; none are built or decided:

- [x] Contact details and the quote form serve as the contact route. (No
  separate Contact page: site content holds contact details, and the quote
  page's dropdown uses the document's seven service options.)
- [x] Warranty & Returns live on a dedicated `/warranty-returns` page linked
  from the footer Company column. (Decision 2026-09-20: conservative wording
  pending final ChefWare approval per §6. The FAQ accordion was removed from
  the footer on 2026-09-20 at the owner's request.)
- [ ] Projects / case-studies page. (Not built and not decided; blocked on
  client-logo and client-name permission per §6/§7.)
- [ ] Industries page. (Not built; homepage "industries served" chips cover the
  content. Only build a page if the client asks.)
- [ ] About / Robotics pages remain as-is (already built and doc-aligned); a
  standalone CEO/company-history page is not built. (Open — only if the client
  asks.)

### Handoff instruction

How to apply: (1) replace the seeded placeholder prices via the Admin Inventory
dashboard and confirm initial stock quantities; (2) recategorise any
client products sitting in the legacy quote categories that `014` deactivates;
(3) promote the admin role in Supabase (if not already set); (4) confirm the
client-approval section (client logos, exact warranty/delivery wording, CEO bio
and pronouns, GPS pin, socials) before launch; (5) add the privacy policy/legal
notices once ChefWare supplies or approves the text.