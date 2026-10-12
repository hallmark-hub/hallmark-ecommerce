# ChefWare Enterprise — UI/UX Audit

**Date:** 2026-10-12
**Scope:** Storefront (16 routes), customer account, checkout and payment, admin dashboard (5 routes), and how the build compares with the `design/` mockups.
**Method:**
- Live site (hallmarkgroupgh.org) reviewed at 390px (phone), 768–1366px (tablet) and 1440px (desktop).
- Read-only code review of `frontend/src`.
- Comparison with the mockups in `design/`.

**Not seen live:** logged-in checkout, the account page and the admin screens all need a login. They were audited from code only.

Severity:
- **Critical:** loses sales, breaks a business rule, or is an accessibility failure.
- **High:** a real friction or trust problem.
- **Medium:** polish that customers notice.
- **Low:** consistency issues and housekeeping.

---

## Top 10 priorities

| # | Issue | Area | Severity |
|---|---|---|---|
| 1 | ~~Test product "Dress" is live~~ — intentional test product (Evans, 2026-10-12) | Catalogue | n/a |
| 2 | Prices and "Request a quote" are clipped on mobile product cards | Catalogue | Critical |
| 3 | "Try Again" after a failed or cancelled payment creates a duplicate order | Checkout | Critical |
| 4 | Admin has no order-detail view: no line items or delivery address, so orders can't be fulfilled from the dashboard | Admin | Critical |
| 5 | Admin can't edit or archive a product after creating it | Admin | Critical |
| 6 | Returns-policy wording differs between product, checkout, terms and confirmation, and is missing on confirmation if the API leaves it empty | Policy | Critical |
| 7 | Product "reviews" are stored only in the visitor's own browser | Product page | High |
| 8 | Gold buttons fail contrast (white on #C9951A = 2.69:1, needs 4.5:1) | Brand / a11y | High |
| 9 | Dashboard counts are wrong: quotes capped at 5, "lifetime" revenue taken from the last 100 orders | Admin | High |
| 10 | Every page has the same browser-tab title | SEO / navigation | High |

---

## 1. Storefront — seen on the live site

### Critical
- **A test product is live.** "Dress", GH₵1.00, SKU "D", description "Top uniforms for hotels", appears first under "Recommended" on the catalogue and in "Complete Your Kitchen". It makes the whole shop look unfinished. Archive it (admin currently can't; see §4).
- **Prices are clipped on mobile cards.** At 390px, `GH₵12,000.0…`, `GH₵4,800.00` (cut off on the right) and `Request a quo…` overflow their two-column cards. The price is the most important text on the card.
  - Fix: smaller price size on mobile, `text-xl` at the base breakpoint.
  - For quote items, show a short "Quote only" instead of "Request a quote", since the gold button already says "Get Quote".

### High
- **Every route uses the same `<title>`** ("ChefWare Enterprise — Complete Hospitality Solutions in Ghana"). Browser tabs, history and Google results can't tell pages apart. Set a title per page, e.g. "Blue Collar Chef Top · ChefWare".
- **The Tawk.to chat widget, with its "We Are Here" badge, covers product cards and form fields** on phone and desktop. On the quote form it sits over the Project Location field.
  - There is also a separate WhatsApp float, so phones get two floating chat buttons.
  - Fix: pick one channel, or move Tawk up and shrink it, and hide the badge on phones.
- **The quote form is cramped on phones.** Nested `px-8` padding leaves inputs about 190px wide. Placeholders are cut off ("kwame@example.", "Select a catego") and the submit button wraps to two lines.
  - Evidence: `QuoteRequestPage.jsx:97`; checkout has the same pattern at `CheckoutPage.jsx:186, 215`.
  - Fix: card padding `p-5 sm:p-8`.

### Medium
- ~~Desktop catalogue grid has no right-hand margin; sidebar background stops part-way.~~ Retracted: both were full-page screenshot artifacts. The grid keeps a 24px gutter and the sidebar is sticky.
- **Category badges are truncated on mobile** ("CHEF UNIFO…", "KITCHEN EQUIPMENT T…"). Use shorter labels or drop the badge on small cards.
- **14 products are split into 2 pages of 12.** Show all 14, or use "Load more" (the mobile mockup uses "Load more").
- **The product page "Technical Details" table is cramped on mobile.** The Payment and Warranty values wrap awkwardly against their labels. Stack the label above the value below 640px.
- **On mobile, the hero arrows are hidden and the 3.5s auto-advance has no pause control** (WCAG 2.2.2). `HeroSlider.jsx:8, 27, 94`.

### Fixed this session (not yet deployed)
- Tablet font sizes and navbar wrapping. See MEMORY.md, 2026-10-12.

---

## 2. Checkout, payment and orders (from code)

### Critical
- **"Try Again" after a failed payment creates a duplicate order.** It goes to `/checkout`, the pending order is dropped, and "Place Order" calls `createOrder` again.
  - Evidence: `PaymentVerifyPage.jsx:62`, `CheckoutPage.jsx:40, 92`.
  - Fix: retry payment on the stored `reference`.
- **A cancelled payment shows "Payment Verification Failed"** with a red X (`PaymentVerifyPage.jsx:59`). That alarms customers who simply backed out. Use a separate "Payment not completed" message.
- **The returns policy on order confirmation can disappear.** It renders `{order.returns_policy}` with no fallback (`OrderConfirmationPage.jsx:185`). CLAUDE.md requires it there. Use the same constant as checkout.

### High
- **The returns wording contradicts itself.**
  - Product page: "Exchange within 3 days for manufacturing defects. Custom-branded items are not returnable", in red (`ProductDetailPage.jsx:126, 198`).
  - Terms page: different wording again (`TermsConditionsPage.jsx:19`).
  - Checkout: the canonical text.
  - Fix: use one shared string everywhere.
- **The payment-method radios do nothing.** MTN / Telecel / AT only change local state, and the order always sends `payment_method: 'moolre'` (`CheckoutPage.jsx:50, 87`). Moolre picks the network on its own page anyway, so either remove the radios or show the networks as logos. Don't present a choice that is ignored.
- **The 6–8 week preorder lead time appears only on the Terms page.** Show it on preorder product pages and at checkout.
- **The product page says "Delivery and collection options are confirmed at checkout"**, but checkout has no collection option (`ProductDetailPage.jsx:122`, `CheckoutPage.jsx:217`).
- **Logged-in customers must re-enter their phone to view their own order** (`OrderConfirmationPage.jsx:31-35`).

### Medium
- **Checkout, login and quote form fields are missing `autocomplete` and `inputMode="tel"`.** Errors appear as one banner at the top, not next to the field, and have no `role="alert"`.
- **Confirmation shows a green check even when payment is pending.** The payment method shows the raw value "moolre". The copy says "save your reference above" when the reference is actually below (`OrderConfirmationPage.jsx:112, 115, 176`).
- **"VAT treatment TBC" is visible to customers** (`CheckoutPage.jsx:390`).
- **Quantity can go above the stock available** (`ProductDetailPage.jsx:161`, `CartDrawer.jsx:49`).
- **The footer "Track Order" link needs a login.** There is no guest order lookup by reference and phone (`Footer.jsx:128`).

---

## 3. Accessibility (from code)

| Severity | Issue | Evidence |
|---|---|---|
| Critical | Cart drawer is not a dialog: no `role="dialog"`, Escape or focus trap. When closed it is only moved off-screen, so keyboard users can tab into its hidden buttons | `CartDrawer.jsx:15-16` |
| High | White on gold is 2.69:1. Affects the gold buttons, "Get Quote", the hero eyebrow and the 9px "Quote" badge (~2.3:1) | `Button.jsx:7`, `Navbar.jsx:54,185`, `HeroSlider.jsx:64` |
| High | Custom checkbox and radios at checkout show no keyboard focus | `CheckoutPage.jsx:293, 324` |
| High | Account order rows are clickable `<tr>`s with no link, so they can't be opened from the keyboard | `AccountPage.jsx:130-133` |
| High | The WhatsApp float sits over "Proceed to Checkout" in the mobile cart drawer (both `z-50`) | `WhatsAppButton.jsx:13`, `CartDrawer.jsx:16,73` |
| Medium | Touch targets under 44px: cart +/−/remove (~22px), catalogue chips, pagination (36px) | `CartDrawer.jsx:45-56`, `ProductCatalogPage.jsx:188,249` |
| Medium | Unlabelled controls: search inputs, mobile search submit, Sort select, review form, star buttons | `Navbar.jsx:173,239,246`, `ProductCatalogPage.jsx:173`, `ProductDetailPage.jsx:257-284` |
| Medium | `<Button>` nested inside `<Link>` (invalid markup) | `CartDrawer.jsx:72-74` |
| Medium | Account tables have no horizontal-scroll wrapper on mobile | `AccountPage.jsx:118,159` |

Suggested gold fix: keep #C9951A for decoration, and use about #8A6410 (or dark text on the gold) wherever the gold sits behind text.

---

## 4. Admin dashboard (from code)

### Critical
- **There is no order-detail view.** Line items and the delivery address are never shown. `GET /admin/orders/{reference}` exists but isn't used (`AdminOrdersPage.jsx:103-129`). Add a row drawer with items, address, contact, payment reference and status history.
- **Products can't be edited or archived.** `PATCH /products/{slug}` and `/active` exist in the backend but aren't wired into `api/admin.js`. Reuse `AddProductModal` for editing.
- **Promo and discount codes are in the brief but not built**, in either frontend or backend. This is a scope gap; flag it to the client.

### High
- **Dashboard numbers are wrong.**
  - The quote count is capped at 5 (`AdminDashboardPage.jsx:61,73,104`).
  - "Lifetime" and "all-time" figures come from the last 100 orders, and the revenue windows from the last 50.
  - Fix: aggregate on the server.
- **"Orders by category" (in the brief) is missing**, and `orders_by_status` is returned but never shown.
- **Archived products are invisible in Inventory.** It loads the public catalogue, which returns active items only and caps at 100 (`AdminInventoryPage.jsx:69`).
- **Order status changes on select with no confirmation or success message.** "Delivered" can be set on an unpaid order. There are no cancelled, processing or shipped statuses (`AdminOrdersPage.jsx:52-62`).

### Medium
- **Unsaved work is lost without warning** in Add Product (Escape or a backdrop click) and on the long Website Content page.
- **Image upload problems:** no size check before upload, one image per product (the product page supports a gallery), and only a stage label for progress.
- **No sorting, pagination, CSV export or bulk actions** on the Orders or Inventory tables. Orders are capped at 100.
- **Payment status is hidden on phones** in the orders table (`AdminOrdersPage.jsx:96,115`).
- **Stock can only change by ±1 or +10**, with no exact-quantity input. The low-stock threshold is hard-coded at 5.

### Low
- **The route is `/admin/settings` but the nav label is "Website Content".**
- **Quotes have status only:** no internal notes, assignee or quoted amount.

---

## 5. Consistency and content

- **Prices print as `GH₵250.00`.** The brief says `GH₵ 250.00` with a space. This is a one-line fix in `utils/format.js:4`.
- **Catalogue sorting only re-orders the current page, and "Newest" does nothing** (`ProductCatalogPage.jsx:57-58`). Sort on the server or remove the option.
- **The product page shows a made-up SKU and the raw category slug** (`ProductDetailPage.jsx:103, 195`).
- **The Account page offers an unconfirmed "Free expert review"**, and its quick links for quote-only items (Kitchen Setup, Embroidery, Pre-orders) point to `/products` (`AccountPage.jsx:192-195, 229`).
- **The quote page ignores the `?product=` value** that product cards send, so the customer has to retype the product (`QuoteRequestPage.jsx:30`).
- **Typography mixes three systems:** the design-token sizes (`text-body`, `text-h2`), Tailwind defaults (`text-sm/xl/3xl`) and 10 one-off `text-[..]` values. Converge on the tokens.
- **The WhatsApp green is an inline style in 3 places.** Add a Tailwind colour.
- **The login page has no "Forgot password" link.**
- **Order confirmation and Account show plain "Loading…" text** where other pages use skeletons.

---

## 6. Build vs design mockups

| Screen | Divergence | Recommendation |
|---|---|---|
| Homepage (desktop and mobile) | Build adds a stats bar, Shop by Category and Featured Products | Keep. Richer than the mockup |
| Catalogue | No price or brand filter. Sort is client-side only | Keep the layout. Fix sorting |
| Catalogue (mobile) | Has category chips. No "Load more" | Add "Load more" |
| Product detail | Has gallery, related products and a spec table. Reviews are local-only | Fix or remove reviews |
| Cart drawer | Close match. No delivery-fee line | Keep |
| Checkout | 2 steps instead of 3, a decorative image panel, no region or city fields | Drop the image panel on small screens. Add region and city |
| Order confirmation | Matches, plus the returns notice | Keep |
| Customer account | Mockup reused the admin sidebar. Build is more honest to scope | Keep |
| Admin dashboard | Missing trends, export, period selector | Add later |
| Admin orders and inventory | Missing pagination, item/detail view, CSV, reorder level, per-row edit | Align. These are needed to run the business |

---

## What's working well

- Phone input is normalised to `+233XXXXXXXXX`, and the format is shown under the field.
- The shared `Button` has consistent sizes, a focus ring, a loading spinner and double-submit protection.
- Checkout makes the customer accept the returns policy and handles price changes between cart and order.
- The catalogue has skeletons, error-with-retry and helpful empty states that route made-to-order categories to the quote form.
- Login sends the customer back to checkout afterwards, and the site has a 404 page, an error boundary and a site-content retry screen.
- No page scrolls sideways at 390px or 1440px.
- The hero respects reduced-motion.
- Admin has optimistic updates with rollback, skeletons and a working mobile sidebar.

## Suggested order of work

1. **Same day:**
   - Archive the "Dress" product.
   - Fix the price format, the mobile price clipping and the quote-form padding.
   - Make the returns policy one constant.
   - Set per-page titles.
2. **This week:**
   - Retry payment without creating a duplicate order, and add a "payment not completed" message.
   - Admin order detail, and product edit/archive.
   - Make the cart drawer accessible.
   - Darken the gold where it sits behind text.
   - Remove or replace local-only reviews.
3. **Next:**
   - Correct dashboard aggregates.
   - Pagination, sorting and CSV for admin tables.
   - Preorder lead-time messaging, and guest order tracking.
   - Decide on promo codes with the client.
