# Frontend Checklist — ChefWare Enterprise
> Living document. Update status as work completes.
> Design ref: `design/` | API ref: `docs/API_CONTRACT.md` | Design system: `design/heritage_industrial/DESIGN.md`

**Stack:** React + Vite · Tailwind CSS · Zustand · React Router  
**Brand:** Heritage Industrial — Forest Green `#005127`, Gold `#C9951A`, Inter font, 8px base spacing

---

## Legend
- `[ ]` Not started
- `[~]` In progress
- `[x]` Done
- `[-]` Deferred / out of scope for now

---

## 1. Project Scaffold

- [ ] `npm create vite@latest frontend -- --template react`
- [ ] Install deps: `tailwindcss`, `react-router-dom`, `zustand`, `lucide-react`
- [ ] Tailwind config — wire Heritage Industrial design tokens (colors, spacing, radii, fonts)
- [ ] Load Inter from Google Fonts
- [ ] `.env.example` with `VITE_API_URL=http://localhost:8000` (base only, no `/api/v1` suffix — paths are explicit per call)
- [ ] `frontend/src/api/` directory structure
- [ ] `frontend/src/store/` directory structure
- [ ] `frontend/src/hooks/` directory structure
- [ ] `frontend/src/utils/` — `formatPrice(pesewas)` → `GH₵ 250.00`, `formatPhone()`
- [ ] Vite proxy config for local backend (`localhost:8000`)
- [ ] `npm run build` passes clean

---

## 2. API Layer (Mocks → Real)

- [ ] `api/client.js` — base fetch wrapper, reads `VITE_API_URL`, prepends full path per call, attaches auth header
- [ ] `api/categories.js` — `getCategories()` → `GET /api/v1/categories`
- [ ] `api/products.js` — `getProducts(params)` → `GET /api/v1/products`, `getProduct(slug)` → `GET /api/v1/products/{slug}`
- [ ] `api/orders.js` — `createOrder(payload)` → `POST /api/v1/orders`, `lookupOrder(reference, phone)` → `GET /api/v1/orders/lookup`
- [ ] `api/payments.js` — `initializePaystack(orderId)` → `POST /api/v1/payments/paystack/initialize`, `verifyPaystack(reference)` → `GET /api/v1/payments/paystack/verify/{reference}`
- [ ] `api/quotes.js` — `submitQuote(payload)` → `POST /api/v1/quote-requests`
- [ ] All mocks return correct shape from API contract
- [ ] Swap flag: single `VITE_API_URL` change switches mock → real

---

## 3. State Management (Zustand)

- [ ] `store/cartStore.js` — items, addItem, removeItem, updateQty, clearCart, totals
- [ ] `store/authStore.js` — user, token, login, logout
- [ ] Cart persisted to `localStorage`

---

## 4. Shared Components

- [ ] `Navbar` — logo, nav links (Uniforms, Equipment, Services), search bar, cart icon + count, account icon
- [ ] `Footer` — company info, Accra office, MTN MoMo support, links
- [ ] `ProductCard` — image, category label, name, `GH₵` price, quick-add button, "Request Quote" variant
- [ ] `CategoryChip` — pill with icon, used on mobile homepage
- [ ] `CartDrawer` — slide-in, item list, qty controls, subtotal, delivery fee (Accra Central), "Proceed to Checkout"
- [ ] `Button` — Primary (green), CTA (gold), Ghost variants
- [ ] `Badge` — "In Stock" (green), "Out of Stock" (grey), "Request Quote" (amber)
- [ ] `PriceDisplay` — formats pesewas → `GH₵ X,XXX.XX`
- [ ] `PageLoader` / skeleton states
- [ ] `ErrorBoundary`

---

## 5. Pages

### Storefront Homepage
- [ ] Hero section — dark overlay on kitchen image, headline, "Request Quote" + "Explore Uniforms" CTAs
- [ ] Featured Categories grid — Chef Uniforms, Equipment, Branding (3 cards desktop, icon chips mobile)
- [ ] Top Ghanaian Essentials — 4-product row, pulled from `getProducts({ limit: 4 })`
- [ ] Trust strip — Accra-based support, free delivery note, premium warranty
- [ ] Mobile layout (see `design/storefront_homepage_mobile/screen.png`)

### Product Catalog
- [ ] Left sidebar — category filter, brand filter, price range slider, size
- [ ] Product grid — 3 col desktop, 2 col mobile, `ProductCard` per item
- [ ] Sort dropdown — Recommended, Price low-high, Price high-low, Newest
- [ ] "Request Quote" floating button (for quote-type categories)
- [ ] Pagination
- [ ] Empty state
- [ ] Mobile layout (see `design/product_catalog_mobile/screen.png`)

### Product Detail
- [ ] Image gallery — main image + thumbnail row
- [ ] Product name, category label, star rating placeholder
- [ ] `GH₵` price (large, bold)
- [ ] Feature bullets (returns policy note)
- [ ] "Add to Cart" button (direct checkout products)
- [ ] "Request Professional Installation" secondary button (equipment)
- [ ] "Request Quote" button (quote-type products)
- [ ] Next-day delivery note
- [ ] Technical Details table — alternating green-tint rows
- [ ] "Complete Your Kitchen" related products row

### Shopping Cart Drawer
- [ ] Opens from navbar cart icon
- [ ] Item rows — image, name, size, qty stepper, remove, price
- [ ] Subtotal + Delivery Fee (Accra Central) + Total
- [ ] "Proceed to Checkout" CTA
- [ ] Empty cart state

### Checkout
- [ ] Step 1: Shipping Information — name, company, address, Accra delivery note, phone (`+233XXXXXXXXX`)
- [ ] Step 2: Payment Method — show Paystack-backed payment options; all checkout payments send `payment_method: "paystack"` in the order payload
- [ ] Order Summary sidebar — items, subtotal, delivery; do NOT calculate or display VAT until client confirms whether prices are VAT-inclusive or VAT-added
- [ ] Returns policy notice — "No refunds. Exchange only within 3 days of purchase." must be visible and acknowledged before submit
- [ ] `accepted_returns_policy: true` sent to `POST /api/v1/orders`
- [ ] Paystack redirect flow — call `POST /api/v1/payments/paystack/initialize`, redirect to `authorization_url`
- [-] Bank transfer flow — removed; bank rails are handled inside Paystack
- [ ] Phone number validation — `+233XXXXXXXXX`

### Post-Paystack Return (`/payment/verify`)
- [ ] Call `GET /api/v1/payments/paystack/verify/{reference}` on mount
- [ ] Redirect to order confirmation on success, show error on failure

### Order Confirmation
- [ ] Green checkmark, "Order Confirmed!", order reference
- [ ] SMS notice — "We'll send confirmation updates to [phone]" (not "You will receive an SMS shortly" — notifications are environment-gated)
- [ ] Delivery details card + Payment method card
- [ ] Items purchased list with quantities and prices
- [ ] Subtotal + Delivery + Total (no VAT line until confirmed)
- [ ] "Back to Home" + "Print Receipt" buttons
- [ ] "Medaase!" thank-you line (Twi for thank you)

### Quote Request
- [ ] Triggered from quote-type product pages / floating button
- [ ] Form: name, email, phone (`+233...`), category, message, product selection
- [ ] Submits to `POST /api/v1/quote-requests`
- [ ] Success state with reference number

### Customer Account Dashboard
- [ ] Build as mocked UI only — no real auth wired until backend auth contract is defined
- [ ] "Welcome back, [name]" header
- [ ] Stats: Active Orders, Equipment in Service, Service Requests, Loyalty Tier
- [ ] Recent Orders table — Order ID, Date, Status (colour-coded), Total, View link
- [ ] Order lookup by reference + phone (uses `GET /api/v1/orders/lookup`)
- [ ] Quick Procurement category shortcuts
- [ ] Kitchen Audit promo card
- [ ] New Heritage Collection promo card

### Auth (Login / Register)
- [ ] Build as mocked UI only — backend has no auth contract yet
- [ ] Login form — email + password
- [ ] Register form — name, email, phone, password
- [ ] Ghana phone validation
- [ ] Protected routes redirect to login (mock guard using hardcoded flag for now)

---

## 6. Admin Dashboard

- [ ] Build as mocked UI only — no real admin auth contract yet
- [ ] Sidebar nav — Dashboard, Orders, Inventory, Kitchen Services, Branding, Settings
- [ ] Enterprise Overview — Total Orders, Revenue (`GH₵`), Active Services/Contracts
- [ ] Recent Orders table — Order ID, Client, Amount, Status, Action
- [ ] Inventory Alerts panel — critical stock items, "Reorder All Low Stock"
- [ ] New Quote Requests panel — "Respond Now" CTA
- [ ] Admin Orders Management page (see `design/admin_orders_management_desktop/screen.png`)
- [ ] Admin Inventory Management page (see `design/admin_inventory_management_desktop/screen.png`)
- [ ] Route-guard: mock admin flag only until backend auth is defined

---

## 7. Routing

- [ ] `/` — Homepage
- [ ] `/products` — Catalog
- [ ] `/products/:slug` — Product Detail
- [ ] `/checkout` — Checkout
- [ ] `/payment/verify` — Post-Paystack verification
- [ ] `/order-confirmation/:reference` — Confirmation
- [ ] `/quote` — Quote Request
- [ ] `/account` — Customer Dashboard (mock-protected)
- [ ] `/admin` — Admin Dashboard (mock-protected)
- [ ] `/admin/orders` — Admin Orders
- [ ] `/admin/inventory` — Admin Inventory
- [ ] 404 page

---

## 8. Hooks

- [ ] `useCart()` — wraps cartStore
- [ ] `useAuth()` — wraps authStore
- [ ] `useProducts(params)` — fetch + loading + error
- [ ] `useProduct(slug)` — single product
- [ ] `useCategories()` — fetch + cache
- [ ] `useOrderLookup()` — reference + phone lookup

---

## 9. Verification

- [ ] `npm run build` passes
- [ ] `npm run lint` passes
- [ ] All pages render without console errors
- [ ] Cart persists on page refresh
- [ ] All prices display as `GH₵ X,XXX.XX` (symbol, not ISO code)
- [ ] Phone inputs enforce `+233XXXXXXXXX`
- [ ] Returns policy visible and required before checkout submits
- [-] Bank details rendered from API response only — removed with manual bank transfer flow
- [ ] Mobile: homepage + catalog match design screens
- [ ] Paystack redirect → verify → confirmation flow works end-to-end (once backend live)

---

## Pending Client Confirmations (blocks specific checklist items)

- `[ ]` **VAT** — are prices VAT-inclusive or VAT-added? Blocks order summary totals.
- `[-]` **Bank details** — no longer needed; bank settlement is configured in Paystack.
