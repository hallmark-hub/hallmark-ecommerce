# ChefWare production-readiness audit

**Audit date:** 27 September 2026
**Source revision:** `b7d5186d8a98ac2e84c791a339a3c099dfcc332e`
**Verdict:** **Not ready for unrestricted production sales.** The core storefront exists and the current tests pass, but checkout loses delivery information, inventory can be oversold, payment recovery has consistency gaps, and ordinary quote submissions can break the admin quote list. Database access controls require immediate live verification.

This is a source and local-behavior audit, not certification of the deployed service. The recommendation is to resolve the launch blockers below before accepting general customer traffic. If already taking orders, reconcile paid orders, fulfillment details, stock and quote requests while remediation is prepared.

## 1. Scope, method and limitations

Reviewed React/Vite storefront and administration, FastAPI routes/services/repositories, SQL migrations 001–016, configuration, dependency declarations, CI, existing launch documentation and tests. Applied a software-engineering checklist covering security, correctness, resilience, maintainability, deployment, observability and testing, plus e-commerce checks for discovery, product selection, checkout, payment, fulfillment and customer support.

The audit respects the current commerce-first architecture and approved content decisions in the repository's `MEMORY.md`. Earlier notes about missing migration 007, admin API keys and Africa's Talking are superseded and are not treated as current defects. The September checklist records owner confirmation that migrations 001–015 were applied; that record is **not a fresh database inspection**.

Evidence labels:

- **Reproduced:** observed using isolated local application services and in-memory repositories, with integration credentials cleared. No real customer or provider requests were made.
- **Source-confirmed:** directly follows from the current implementation; browser or deployed behavior was not exercised.
- **Unverified gate:** deployment settings, business facts or operational controls need separate evidence.

No production database queries, migrations, payments, emails, outbound customer messages, deployments or pushes were performed. No browser, mobile-device, load, penetration, backup-restore or real PostgreSQL concurrency test was performed. Dependency checks are described precisely below; this was not a complete secret-history or backend vulnerability scan.

The local sandbox failed because `/tmp` was full (7.7 GB used, zero available). Approved execution outside that sandbox allowed source inspection and checks to finish. This is a development-environment observation, not evidence of a production storage problem. No files were deleted to free space.


## Remediation update — 27 September 2026

The source-level first remediation pass is prepared locally. The findings below document the original audit baseline; the following changes reduce several risks but do **not** close their acceptance gates. The original verification table records the pre-fix revision; post-fix checks are recorded below.

| Finding | Local work prepared | Still required before closure |
|---|---|---|
| F01 | Forward migration 017 enables RLS, removes direct API-role table access, grants the backend service role, and restricts stock RPC execution. | Review and test grants/policies against a disposable database; inspect deployed grants and verify the live target. The SQL has not been executed. |
| F02 | Checkout now requires and submits the delivery address; orders retain company/address snapshots; lookup, admin detail and receipt expose them. | Apply reviewed migration 017 after checking live schema. Existing orders keep blank legacy addresses and need customer confirmation. Business must verify delivery area/charges. |
| F03 | Migration 018 adds atomic order creation and stock reservation; the Supabase repository uses its RPC. The in-memory path serializes reservations, payment finalization avoids a second deduction, and paid settlement attempts to reacquire an expired reservation. | Validate SQL and concurrent reservations in disposable PostgreSQL, provision a trusted expiry scheduler, and define a durable paid-but-unavailable exception/refund or fulfillment workflow. Reservations are 30 minutes; provider and inventory reconciliation is not yet transactional. |
| F04 | Paystack initialization specifies GHS and validates the returned reference. Verification/webhooks require matching reference, amount and GHS currency; unknown/pending provider states remain pending. | Verify provider payload contracts in test mode and close the broader persistence/replay gaps in F05. |
| F05 | No complete settlement transaction, durable unmatched-event replay, or cross-table reconciliation worker has been implemented. | Persist unmatched events before acknowledging them; make payment/order/stock transitions atomic or safely recoverable; alert and reconcile exceptions. |
| F06 | Quote email uses `EmailStr`; admin quote fields accept legitimate null optional values. | Confirm ordinary customer submissions and admin list/detail against a real test database after these edits. |
| F08 | Admin fulfillment now allows only pending→confirmed→delivered, requires paid status and applied stock, and returns conflict for invalid transitions. Customer confirmation distinguishes unpaid orders. | Add actor/reason transition history and make transition checks atomic; verify operations rules for cancellations/exceptions. |
| F09 | Checkout retains the cart during payment, stores the pending order/item snapshot, requires confirmation when the server total differs, and removes only purchased quantities after verified success. | Resume an existing order after reload/multi-tab/network ambiguity, make order creation idempotent, and verify decline/pending MoMo/retry journeys in a browser. |
| F15 | Customer order quantities and item-list length, company/address lengths, and quote email input receive tighter validation bounds. | Shared trusted-proxy rate limits and bounded actual image upload processing remain unimplemented. |
| Other findings | No remediation claimed for F07, F10–F14, F16–F21, or the remaining F05/F11/F15 gates. | Follow the staged plan and launch checklist below. |

Post-fix verification was run at the user's request: backend `.venv/bin/python -m pytest -x -q` passed (123 tests, 2 warnings); frontend `npm run build` and `npm run lint` passed; `git diff --check` passed. No browser scenarios or database tests were possible here. Migration ordering and SQL behavior, role grants, live database state and business approvals remain unverified.

Migration execution is still blocked by the available project access path: `backend/migrations/README.md` requires manual execution through Supabase SQL Editor; this checkout has no `supabase` CLI or database connection URL, and the browser inventory has no available signed-in session. The configured Supabase API credentials do not provide a safe arbitrary-SQL execution path. Migration 017 also requires confirming 016 on the target. No SQL was submitted, and no remote database was changed. Continue by running 017 then 018 in the intended Supabase project's SQL Editor after confirming 016 and taking the required backup.

## 2. Verification results

| Check | Result | What it establishes |
|---|---|---|
| Initial `git status --short` | Clean | Audit started without existing uncommitted changes. |
| `cd backend && .venv/bin/python -m pytest -x -q` | **123 passed**, 2 warnings, 2.59 seconds | Existing local regression suite passes on Python 3.13. |
| `cd frontend && npm run build` | **Passed** | Production bundle builds; main JS approximately 300.72 kB / 93.01 kB gzip. |
| `cd frontend && npm run lint` | **Passed** | Existing lint rules pass. |
| `cd backend && .venv/bin/python -m pip check` | **Passed** | Installed package requirements are compatible, not necessarily secure. |
| `cd frontend && npm audit --omit=dev --json` | **Failed security check:** 7 affected package entries | 4 high, 2 moderate, 1 low; fixes reported available. Entries are not seven distinct exploitable application vulnerabilities. |
| Installed backend version inspection | FastAPI 0.111.0, Starlette 0.37.2, Supabase 2.5.0, python-multipart 0.0.29 | Starlette version matches a published multipart DoS advisory. Full backend SCA remains outstanding. |
| Tracked environment filenames | Only `backend/.env.example`, `frontend/.env.example` | No real `.env` file found among tracked environment filenames; does not prove history or other files contain no secrets. |
| Isolated behavioral probes | Multiple defects reproduced; see below | Passing current tests does not cover these scenarios. |

Build warning: `authStore.js` is both statically and dynamically imported, so its dynamic import creates no separate chunk. This is not a release blocker. Backend warnings concern the multipart import name and deprecated `gotrue` package.

### Software-engineering and commerce checklist

| Area | Assessment | Findings / evidence |
|---|---|---|
| Layering and API structure | Partial pass | Router/service/repository boundaries and validation exist; F05 identifies transaction gaps. |
| Prices and money | Partial pass | Integer pesewas and server-side pricing; F04/F09 cover currency and customer price agreement. |
| Database access control | **Release gate** | F01: protection absent from most checked-in schema definitions; deployed grants unknown. |
| Inventory integrity | **Fail** | F03: overselling and no reservation lifecycle. |
| Checkout / delivery | **Fail** | F02/F09: lost address, premature cart clearing and stale displayed prices. |
| Payment settlement / recovery | **Fail** | F04/F05: pending-state handling and multi-step persistence. |
| Authentication / account lifecycle | Partial / gate | Server-side admin roles exist; F10 covers recovery, identity and session gaps. |
| Fulfillment controls | **Fail** | F08: unpaid orders can be marked delivered, no transition audit. |
| Quotes | **Fail** | F06/F12: nullable fields and lost product context. |
| Administration / reporting | **Fail at volume** | F13: truncated search and misleading lifetime totals. |
| Reviews and merchandising | Partial | F14/F20: browser-only reviews and unverified stock/options. |
| Dependency security / uploads | **Fail / partial** | F07/F15. |
| Abuse controls | Partial | F15: spoofable in-process throttling and unthrottled lookup/payment routes. |
| Privacy and commercial terms | **Release gate** | F11: missing privacy flow and unresolved delivery/tax wording. |
| Customer support / notifications | Operational gate | F19: notification stub is intentional; manual coverage must be explicit. |
| Accessibility | Partial, source review only | F17: cart-dialog keyboard semantics missing. |
| SEO and performance | Partial, measurements missing | F18: global metadata, no sitemap, failure-path gaps. |
| CI / deployment / recovery | Partial, live gates open | F16/F21: CI exists, but hosted checks, restore and integration acceptance unverified. |

## 3. Findings and required solutions

Priorities: **P0** = resolve or disprove immediately before exposure; **P1** = fix before general paid launch; **P2** = important hardening or operational improvement. A gate can be closed with verified existing controls; it does not automatically require new infrastructure.

### F01 — P0: Core database permissions are not secured by the checked-in migrations

**Evidence — source-confirmed / live impact unverified:** `backend/migrations/001_initial_schema.sql` creates products, orders, line items, quotes, payments and events without enabling RLS or defining grants/policies. `007_customer_profiles.sql` does the same for profiles containing the admin role. Searching all migrations finds RLS enabled only in `010_site_content.sql:16`. `008_order_stock_application.sql` does not restrict function execution or check that the order is paid.

**Impact:** If the exposed Supabase schema retains permissive table grants, direct Data API calls could bypass FastAPI authorization, expose customer/order data, modify payments or promote a customer to admin. Actual exploitability depends on deployed grants, RLS and API exposure; it was not tested. The stock RPC is invoker-security by default, so access also depends on the caller's table privileges.

**Solution:** Inspect live `pg_class`, `pg_policies`, schema/table/function grants and Supabase API exposure read-only. Then prepare a forward migration enabling RLS and least-privilege grants on every exposed table. Keep backend-only commerce writes and role changes restricted to the server role. Restrict stock/settlement RPC execution and enforce paid/settlement preconditions inside the transaction. Do not add unrestricted policies merely to make tests pass.

**Acceptance:** Against a disposable database with the same grants, anon and customer roles cannot read another customer's records, change roles/prices/payment state or invoke stock mutations; legitimate backend operations still work. Record equivalent production policy evidence before launch. **Owner:** backend/security + database operator.

### F02 — P1: Required delivery information is discarded

**Evidence — source-confirmed and model probe:** `frontend/src/pages/CheckoutPage.jsx:43` captures company/address and line 59 requires the address. The payload at line 78 sends only name, email and phone. `backend/app/models/orders.py:35`, order persistence and the orders schema contain no delivery address. Even supplying an extra address to the current Pydantic customer model silently drops it.

**Impact:** A paid order cannot be dispatched using its stored record. Staff must contact the buyer again and cannot reliably recover the original delivery instruction.

**Solution:** Add a validated delivery/pickup model, persist an immutable address/contact/company snapshot on the order, and show it in admin detail and confirmation. Validate the supported delivery area server-side and persist the agreed delivery charge. Handle historical orders explicitly as needing address confirmation; do not invent addresses.

**Acceptance:** Enter an address and company, create the order, reload on another session and verify the exact fulfillment details in storage, admin and receipt. Unsupported locations cannot silently receive a free-delivery promise. **Owner:** frontend + backend.

### F03 — P1: Stock checks permit multiple paid orders for the same inventory

**Evidence — reproduced:** `OrderService.create_order` checks availability but does not reserve it. `backend/migrations/008_order_stock_application.sql` applies stock later using `greatest(stock_qty - quantity, 0)`. Local probe: one unit, two orders created before payment, then both verified → both `paid`, remaining stock `0`. The SQL shows the same shortage-clamping behavior; no concurrent database execution was performed.

**Impact:** Exactly-once deduction per order does not prevent overselling between orders. The clamp also hides the shortage. Old payment links can remain payable after stock changes.

**Solution:** Reserve quantities atomically before issuing checkout, lock products in deterministic order, give reservations an expiry, and commit or release them through explicit transitions. Define late-payment handling for expired reservations. If stock cannot be fulfilled after money is received, record a paid fulfillment exception and an operator resolution/refund path; never erase the payment fact.

**Acceptance:** Two simultaneous buyers for the last unit cannot both receive a valid reservation. Duplicate callbacks consume once; expired/abandoned reservations release once; late successes enter a visible exception workflow. Test this against real disposable PostgreSQL. **Owner:** backend/database.

### F04 — P1: Payment validation is incomplete and pending payments become failed

**Evidence — reproduced / source-confirmed:** `backend/app/services/paystack_service.py:172` maps every provider status other than `success` to `failed`. A mocked provider `pending` result produced `failed`. `_validate_payment_amount` at line 313 accepts a missing amount, and currency is not checked. A probe with the correct numeric amount and `currency='USD'` was accepted as paid. The HTTP gateway omits explicit `currency='GHS'` during initialization and substitutes the requested reference in the verification result instead of validating the provider-returned reference.

**Impact:** Pending MoMo transactions can look failed, encouraging another attempt. Payment acceptance does not fully bind the provider result to the expected amount, currency and transaction. This is a validation defect, not proof that an attacker can forge a signed Paystack event.

**Solution:** Initialize explicitly in GHS. Require the expected provider reference, exact integer amount and currency for real settlement. Keep pending/processing states pending and distinguish failure, timeout and unknown results. Restrict test-gateway exceptions to test code. Enforce monotonic paid-state transitions transactionally, not only with a read-then-write Python check. Follow [Paystack verification guidance](https://paystack.com/docs/payments/verify-payments/).

**Acceptance:** Missing/mismatched amount, reference or currency cannot settle; pending stays pending; transport errors do not assert failure; a stale verification cannot overwrite a concurrently settled payment. **Owner:** backend/payments.

### F05 — P1: Order, payment, stock and webhook processing lack one durable recovery model

**Evidence — reproduced / source-confirmed:** `paystack_service.py:190–198` writes payment status, order status and stock separately. A simulated stock RPC failure left the order `paid` with `stock_applied=False`. The webhook path at line 229 deduplicates any recorded event, including an event received before its local payment exists. Probe: valid signed event first, local payment inserted later, same event retried → order remains pending. `order_repository.py:176` inserts the order and items separately with a best-effort compensating delete. Payment initialization performs a remote request before the payment insert, and concurrent initialization is not atomically claimed.

**Impact:** Provider success can coexist with incomplete fulfillment state. An acknowledged but unmatched event can be permanently skipped. Timeouts/crashes can leave orphan orders, duplicate attempts or a provider transaction without a usable local record.

**Solution:** Persist an order plus lines and checkout idempotency key in one database transaction/RPC. Persist and atomically claim a payment attempt before provider initialization. Store verified webhook events in a durable inbox with received/processing/applied/unmatched states; deduplicate completed processing, not mere receipt. Settle local payment/order/stock effects transactionally or expose an explicit recoverable fulfillment exception. Add reconciliation for old pending/unmatched attempts and a transactional outbox if notifications are later enabled. Acknowledge webhooks only after durable receipt; Paystack documents [retry behavior](https://paystack.com/docs/payments/webhooks/).

**Acceptance:** Inject failure at each boundary, restart processing, and converge to one correct order/payment/stock outcome. Replay unmatched events after linking. Concurrent callbacks, initialization requests and verification calls remain safe. **Owner:** backend/database/payments.

### F06 — P1: Blank optional quote fields can break the admin quote list

**Evidence — reproduced:** `backend/app/services/quote_service.py:60` converts blank company, location and quantity to `None`; `backend/app/models/quotes.py:60` declares each as non-nullable `str`. A normal quote with these optional fields blank creates successfully, but `AdminQuoteSummary.model_validate` raises three validation errors. List/detail/status responses use that model.

**Impact:** A single ordinary quote in the fetched results can cause the entire admin quote list to fail, obscuring other enquiries.

**Solution:** Choose one nullable-field contract and apply it consistently across request, database, response and frontend. Normalize historical nulls at the response boundary or retain null explicitly. Do not require buyers to fill fields that the form labels optional.

**Acceptance:** Submit with all optional fields blank, then list, open and update it successfully through the admin API and UI alongside fully populated and historical quotes. **Owner:** backend + frontend.

### F07 — P1: Dependency security has known unresolved findings

**Evidence — current checks:** Installed Starlette `0.37.2` matches the maintainer's [multipart denial-of-service advisory](https://github.com/Kludex/starlette/security/advisories/GHSA-f96h-pmfr-66vw). FastAPI is pinned to `0.111.0`. Updating `python-multipart` alone does not resolve a Starlette parser defect. No load/DoS exploit was run. `pip-audit` was not installed, so this is not an exhaustive Python advisory inventory.

`npm audit --omit=dev --json` reports: high — `browserslist`, `nanoid`, `postcss`, `react-router`; moderate — `baseline-browser-mapping`, `react-router-dom`; low — `postcss-selector-parser`. The tool reports fixes available. Several packages are build tooling classified under production dependencies; React Router's RSC/SSR advisories do not automatically apply to this client-rendered Vite app. Its router package and redirect handling still need review.

**Solution:** Upgrade FastAPI and its compatible Starlette dependency together, scan the complete resolved Python graph, and commit a reproducible resolution. Update affected JS packages/lockfile after reviewing advisory applicability. Use `npm ci` in deployment, add ongoing dependency scanning, and avoid blind forced upgrades.

**Acceptance:** Fresh installs, all regression checks and upload/auth/checkout flows pass; no applicable unresolved high/critical advisory remains. Document non-applicable findings with reasons and review dates. **Owner:** engineering/security.

### F08 — P1: Fulfillment can bypass payment and has no transition history

**Evidence — reproduced / source-confirmed:** `backend/app/services/admin_order_service.py` forwards requested statuses directly to the repository. An unpaid order was successfully changed to `delivered`. `OrderStatus` has only pending/confirmed/delivered; there is no actor/reason transition ledger or cancellation/exception state. The confirmation page at lines 113 and 155 always says “Order Confirmed!” and “Total Paid”, even for an order whose payment is pending or failed.

**Impact:** Staff can dispatch unpaid orders or reverse lifecycle states without a record. Customers can receive a misleading printable confirmation.

**Solution:** Define allowed payment/fulfillment transitions with paid and stock/reservation preconditions. Record actor, time, prior/new states and reason. Add bounded cancellation, exchange and payment-exception handling consistent with approved policies. Render confirmation headings and amounts from actual payment and fulfillment state.

**Acceptance:** Unpaid delivery, invalid reversals and duplicate transitions are rejected; permitted changes have an audit trail. Pending/failed orders never display “Total Paid”. **Owner:** backend + operations + frontend.

### F09 — P1: Payment cancellation loses the cart; the agreed price can be stale

**Evidence — source-confirmed:** `CheckoutPage.jsx:99` calls `clearCart()` before redirecting to Paystack. `PaymentVerifyPage.jsx` handles failure by linking “Try Again” to `/checkout`, which now renders an empty cart. Checkout displays persisted cart prices, while the backend recalculates current prices; the returned total is not presented for buyer acceptance before initialization. Re-submitting always creates a new order.

**Impact:** Declines, cancellation and network loss abandon the buying journey. A price change can produce a provider amount different from the checkout display. Retrying after an ambiguous response can duplicate orders.

**Solution:** Retain the cart and durable pending-order identity until authoritative success; resume/recheck the existing attempt. Obtain an authoritative checkout summary including price, availability and delivery charge, and ask the customer to accept any changes before payment. Clear only the purchased snapshot so later cart additions are preserved. Bind retry behavior to F05's idempotency key.

**Acceptance:** Test cancel, decline, pending MoMo, timeout, reload, back navigation and multi-tab changes. Each resumes safely, preserves items and shows the amount actually charged. **Owner:** frontend + backend.

### F10 — P1: Account recovery, ownership and session expiry need completion

**Evidence — source-confirmed / configuration-dependent:** `AuthPage.jsx:46` navigates after signup without handling the no-session/email-confirmation state supported by `customer_repository.py`. No reset-password/resend-confirmation flow appears in the auth routes or UI. `require_admin` returns 403 for an expired token, but `frontend/src/api/client.js` refreshes only on 401. Orders and quotes are associated with accounts by submitted email, not a stored authenticated customer ID. Checkout requires a frontend token but order creation is an unauthenticated API call. `authStore.logout` clears browser state without revoking the provider session. Login accepts an unvalidated `redirect` query parameter.

**Impact:** Mandatory account creation can strand customers when email confirmation is enabled; expired admin sessions can fail until reauthentication. Email-based ownership becomes unsafe if email verification is disabled, and editable checkout email can detach a purchase from the buyer's account. Logout does not invalidate a copied refresh token. Redirect handling needs restriction, especially with F07's router advisories.

**Solution:** Implement explicit confirm-email, resend, reset and session-revocation journeys; return 401 for absent/expired authentication and 403 for insufficient privilege. Attach authenticated orders/quotes to immutable customer IDs. If guest checkout is desired, define it explicitly and verify ownership when claiming guest history. Allow only approved same-origin redirect paths. Verify provider email confirmation and admin MFA/session settings.

**Acceptance:** Test verified/unverified signup, expired customer/admin sessions, password reset, logout/revocation, malicious redirects and cross-account history access. Do not solve onboarding friction by silently disabling email verification. **Owner:** frontend + backend + identity operator.

### F11 — P1 release gate: Privacy disclosures and commercial terms are incomplete

**Evidence — source-confirmed / owner decisions required:** There are Terms and Warranty pages but no privacy route/disclosure flow. `frontend/index.html:16` loads Tawk globally after page load, including auth/admin routes. Auth and refresh tokens persist in localStorage. Checkout says “Free (Accra)” and “VAT treatment TBC. Prices shown inclusive.” No server delivery/tax model substantiates those totals. Warranty/returns wording is spread across pages and the backend policy constant; the existing checklist still asks for final policy wording approval.

**Impact:** Customers lack a clear account of data collection/recipients/retention and may receive unresolved price or delivery promises. Third-party scripts share the page execution environment with locally stored session tokens; this is exposure to assess, not observed token theft.

**Solution:** Obtain approved privacy, retention, support and commercial-policy text for the actual integrations. Inventory Tawk, Maps, media, hosting, auth and payment data flows; apply appropriate consent/loading behavior for the chosen policy and applicable requirements. Limit optional scripts on sensitive pages, deploy a tested CSP, and assess a more isolated session-storage model. Confirm delivery zones/fees and tax treatment with the business/accountant. Version accepted terms with each order. Do not fabricate statutory rates or rewrite the approved exchange policy without review.

**Acceptance:** Published and checkout terms agree with stored totals and fulfillment rules; privacy information is accessible at data collection; retention/deletion requests have an owner and procedure; optional integrations behave as disclosed. **Owner:** business owner + engineering + relevant policy/accounting reviewers.

### F12 — P2: Quote context and persistence need hardening

**Evidence — source-confirmed:** `ProductDetailPage.jsx:138` links with `product=<id>`, but `QuoteRequestPage.jsx` reads only `category` and never submits `product_ids`. Quote detail/list queries do not load the product association. `quote_service.py:103` uses only a four-digit random daily reference suffix without collision retry. Quote and product-association inserts are separate. `CreateQuoteRequest.email` is a minimum-length string; a probe accepted `bad` as an email.

**Impact:** Sales staff lose which product prompted the enquiry. Reference collisions produce failed requests; partial writes can lose product associations. Invalid contact data is accepted through the API.

**Solution:** Map catalogue categories to valid quote options, include selected product IDs, persist quote plus associations atomically and return product context to admins. Use collision-resistant references with bounded retry, `EmailStr`, sensible length/list bounds and canonicalized email matching.

**Acceptance:** A quote from each quote-only product reaches the correct form and admin record with the selected product; forced collisions retry safely; partial writes and invalid contact data fail safely. **Owner:** frontend + backend.

### F13 — P2: Admin history and “lifetime” analytics silently truncate

**Evidence — reproduced / source-confirmed:** `admin_analytics_service.py:14` reads at most 100 orders; `AdminDashboardPage.jsx:53` labels the results “lifetime” and “all-time count”. Probe: 102 stored orders yielded 100. Order/quote lists expose a limit without cursor/offset, and UI filters only the returned subset (`AdminOrdersPage.jsx:67`, `AdminQuotesPage.jsx:51`).

**Impact:** Older outstanding work becomes hard to find and revenue totals understate activity as volume grows.

**Solution:** Add server-side pagination/search/status/date filters with total counts. Calculate totals and date buckets in database aggregates over the intended period. Label deliberately sampled views explicitly. Keep these tools focused on existing commerce operations.

**Acceptance:** Seed more than 100 mixed-age records; retrieve an old pending order/quote and reconcile lifetime/monthly totals with database aggregates. **Owner:** backend + frontend.

### F14 — P2: Product reviews are browser-only and presented as a real feature

**Evidence — source-confirmed:** `ProductDetailPage.jsx:22–68` stores reviews in localStorage and shows successful submission. There is no review API, durable record, moderation or verified-purchase check.

**Impact:** Customers expect feedback to reach the business and other shoppers. It currently exists only in their own browser.

**Solution:** Hide/disable review submission for launch with owner approval, or implement a bounded persisted and moderated review workflow. Do not invent reviews or verified-buyer labels.

**Acceptance:** Either no public submission promise remains, or a submitted review persists across devices and follows published moderation rules. **Owner:** product owner + engineering.

### F15 — P2, with F07 security dependency: Abuse controls and upload limits are incomplete

**Evidence — source-confirmed:** `rate_limit.py:49–58` trusts the first X-Forwarded-For value, which its comment acknowledges is spoofable. Counters live per process. Order lookup and Paystack initialize/verify lack endpoint throttles. Several fields and lists lack upper bounds. `admin_media.py:24` reads the whole file synchronously before checking its size; image validation trusts supplied MIME type.

**Impact:** Requests can bypass application throttles, trigger excessive provider/database work or consume memory before rejection. Unbounded parsing intersects the framework advisory.

**Solution:** Derive identity through trusted proxies; use appropriate per-IP/account/reference limits and shared enforcement for multiple workers. Limit requests at the edge/parser, read at most the allowed bytes plus one, inspect actual image format/dimensions, and bound inputs. Preserve legitimate signed webhook retries.

**Acceptance:** Forged forwarding headers cannot bypass limits; oversized multipart requests are rejected before excessive buffering; malformed images and huge lists fail safely; normal checkout/webhook bursts work. **Owner:** backend/security + hosting operator.

### F16 — P2 / live release gate: Configuration and operational recovery lack evidence

**Evidence — source-confirmed / live unverified:** APP_ENV defaults to local; production guards run only for the exact production environment. The required frontend URL has a localhost default, so non-empty validation does not reject it. The frontend API client also falls back to localhost. Readiness checks only a categories query, not commerce schema/RPC capability. Neither Vercel config defines security headers; platform headers remain unverified. The old backend production guide documents removed admin-key/notification behavior and stops its migration list at 007. No tested restore, reconciliation alerts or rollback evidence was found in reviewed operational docs.

**Solution:** Fail closed for deployed environments with invalid URLs, missing live settings or unintended test keys/fallbacks; validate the frontend API URL at build. Verify project roots, start commands, exact CORS, TLS/security headers and Supabase target. Maintain a migration ledger and bounded schema checks. Document backup scope, recovery objectives, restore rehearsal, rollback, alert ownership and secret rotation. Alert on paid/unapplied stock, unmatched events, stale pending payments and API failures. Preserve manual migration approval.

**Acceptance:** Misconfiguration cannot accept fake/local payments or memory-only orders. Demonstrate isolated restore and rollback, verify health/alerts, and record deployment configuration without exporting secret values. **Owner:** hosting/database operator + backend.

### F17 — P2: Cart accessibility and form feedback need fixes and verification

**Evidence — source-confirmed:** `CartDrawer.jsx` remains mounted while visually off-screen, without dialog semantics, focus trap/return, Escape handling or inert/hidden closed-state behavior. Checkout errors are generic banners rather than field-associated announced messages. Its phone error incorrectly says ten digits after +233; the backend requires nine.

**Solution:** Implement an accessible dialog with managed focus. Associate errors with inputs, announce submission status, focus the first invalid field and fix the phone hint. Audit contrast, zoom, targets, menus and reduced motion against [WCAG 2.2](https://www.w3.org/TR/WCAG22/).

**Acceptance:** Complete discovery, cart, checkout and quotes with keyboard/screen reader; closed cart controls are unreachable and focus returns to the opener. Check 200% zoom and narrow viewports. This source audit does not establish WCAG conformance. **Owner:** frontend/QA.

### F18 — P2: Discovery metadata, performance evidence and failure recovery are incomplete

**Evidence — source-confirmed / performance unmeasured:** `App.jsx` sets one global SEO title/description. No product canonical/structured data, sitemap or robots file was found. Catch-all SPA rewrites risk soft 404s. `ProductDetailPage.jsx:29–42` lacks catch/finally; failed product or related-product requests can leave a permanent loader. The API client has no request timeout. Storefront rendering, including payment returns, waits for site content. Route splitting, parallel prefetch and mobile video deferral already exist.

**Solution:** Add route/product metadata, canonical, share data, truthful Product structured data and sitemap; define nonpublic indexing behavior. Verify crawler/404 behavior and prerender only where justified. Handle related-product failures independently, with bounded loading/retry. Keep payment recovery usable during marketing-content outages. Measure cold/warm API timing and mobile assets before adding caching.

**Acceptance:** Invalid slugs show a recoverable not-found state; related-product failure does not hide the product. Target field p75 LCP ≤2.5 s, INP ≤200 ms and CLS ≤0.1, distinguishing lab from field results, per [Core Web Vitals](https://web.dev/articles/vitals). **Owner:** frontend + backend/QA.

### F19 — P2 / operational gate: Receipts and admin alerts are intentionally not sent

**Evidence — source-confirmed:** `notification_service.py` returns false and logs skipped notifications. WhatsApp is click-to-chat. The repository deliberately defers an outbound provider; a particular provider is not a mandatory audit recommendation.

**Impact:** Buyers must save references; staff must actively monitor orders/enquiries. An unowned manual process can miss sales and exceptions.

**Solution:** Name an operator, establish a checked order/quote queue and response schedule, and provide durable printable/downloadable receipts and support instructions. Approve that manual model or separately authorize a transactional provider with retry/delivery tracking and a durable outbox. Do not assume provider payment receipts replace fulfillment receipts.

**Acceptance:** Demonstrate how an order/quote reaches responsible staff and how a buyer recovers a reference after losing browser state. If notifications are enabled, test failure/retry and distinguish provider acceptance from delivery. **Owner:** operations + engineering.

### F20 — P1 business gate: Saleable stock and uniform options remain unverified

**Evidence — source-confirmed / live business state unverified:** Migration 015 seeds quantity 10 per product and updates stock on conflict; the existing checklist leaves stock confirmation open. Filename-derived prices are not evidence of current approved prices. Product/cart/order models have no size/color variants or per-variant stock despite selling uniforms. Separate products per size may already be the intended operational approach; this was not verified.

**Impact:** Buyers may purchase setup quantities or garments without an agreed size. Rerunning the seed can overwrite operational stock/prices.

**Solution:** Obtain current stock/price sign-off and define each uniform SKU's size/color. Use separate explicit SKUs where sufficient; otherwise add validated variants and order-line snapshots. Keep unconfirmed/custom items quote-only with owner approval. Do not use historical seeds as an inventory sync.

**Acceptance:** Every direct-sale item has approved price, stock and fulfillable options; orders unambiguously identify what staff must supply. Setup changes cannot accidentally reset live quantities. **Owner:** catalogue/business operator + engineering.

### F21 — P1 release gate: CI lacks end-to-end and real-database acceptance

**Evidence — source-confirmed:** `.github/workflows/verify.yml` runs backend tests on Python 3.11/3.13 and frontend build/lint on Node 20. Migration tests largely inspect SQL text and services use mocks/in-memory repositories. No frontend test script or checked-in browser journey suite was found. Hosted CI, branch protection, deployed revision and provider acceptance were not verified.

**Solution:** Add focused regressions for F02–F10/F12/F13, real disposable PostgreSQL tests for RLS/transactions/reservations, and browser tests for paid/quote journeys. Test representative staging data and Paystack test mode in an explicitly approved environment. Add dependency checks and required CI gates; keep local tests isolated from real credentials. Correct checklist items that currently describe intentions as demonstrated guarantees.

**Acceptance:** The matrix below passes with artifacts tied to a commit/environment. Any test migration must use an explicitly authorized disposable database; production migration execution is separate. **Owner:** engineering/QA + release owner.

## 4. Isolated reproduction evidence

The probes imported `backend/tests/conftest.py` first, which sets APP_ENV=test and blanks Supabase, Paystack and Cloudinary credentials. They constructed fresh in-memory repositories and an explicit synthetic product (100 pesewas, a UUID, controlled stock). They invoked application services directly; provider replies were deterministic test doubles. Signed-webhook probes used a fake audit-only secret. These results establish application behavior, not real PostgreSQL locking or live-provider behavior.

| Scenario / reproduction recipe | Observed outcome |
|---|---|
| Validate CreateOrderRequest with an extra customer address | Address absent from validated model. |
| Set stock to 1; create two orders before verifying either; initialize/verify both | Both paid; stock clamped to 0. |
| Gateway returns status=pending and the correct amount | Application records failed. |
| Invoke AdminOrderService.update_order_status(delivered) on unpaid order | Accepted as delivered. |
| Make apply_order_stock raise during successful verification | Order already paid; stock_applied remains false. |
| Deliver signed success before local payment insertion; insert payment; replay same event | Order remains pending because recorded event is skipped. |
| Create quote with company/location/quantity blank; validate admin summary | Three validation errors for those nullable fields. |
| Construct quote request with email=bad | Accepted by request model. |
| Put 102 orders in repository; request analytics summary | Reports 100. |
| Gateway returns success, expected amount, currency=USD | Accepted as paid. |

The initial probe script stopped at a test-double setup error because its patched Settings object lacked frontend_url. That fixture was corrected and the remaining probes ran successfully. The application findings above are the resulting observations; no fixture error is counted as a product defect.

## 5. Remediation sequence

| Stage | Work | Dependency / exit condition |
|---|---|---|
| 1 — Verify exposure and fix immediate failures | Inspect deployed grants/RLS (F01); prepare compatible dependency upgrades (F07); fix quote null contract (F06); confirm real catalogue quantities/options (F20). | Database access is proved restricted; ordinary quotes work; dependency risk and saleable inventory are understood. |
| 2 — Make paid commerce reliable | Implement address/fulfillment snapshot (F02), reservation lifecycle (F03), provider-state validation (F04), durable idempotent settlement/reconciliation (F05), fulfillment rules (F08) and retry/price-confirmation UI (F09). | One consistent checkout contract and fault-tested payment/stock behavior. Design these together to avoid repeated schema changes. |
| 3 — Complete customer and operator journeys | Account recovery/ownership (F10), quote context (F12), paginated operations/reporting (F13), honest reviews (F14), abuse controls (F15), accessible interactions (F17), support process (F19). | Customers can buy, recover and contact support; staff can find and fulfill all work safely. |
| 4 — Prove release readiness | Business/privacy terms (F11), deployment/restore/alerts (F16), failure/performance/SEO checks (F18), automated integration and staged acceptance (F21). | All P0/P1 findings resolved or an existing control demonstrated; remaining P2 items have owners and explicit acceptance. |

Do not apply fixes by silently rewriting historical orders, replaying seeds, deleting migrations or changing approved commercial policies. Schema changes need a reviewed forward migration, conflict preflight, backup and approval. Keep the stack and commerce-focused admin scope; there is no need for a wholesale rewrite.

## 6. Required acceptance scenarios

| Scenario | Required evidence |
|---|---|
| Direct purchase | Real SKU/options, authoritative price, stored address, correct GHS amount, one paid order, correct stock and receipt. |
| Last unit / simultaneous buyers | Real database test: one reservation wins, the other receives a useful availability error. |
| Duplicate submission / refresh / timeout | One checkout intent, safe retry, no duplicate payable order or double stock deduction. |
| MoMo pending → success | Pending UI remains accurate; delayed webhook settles once even after browser closure. |
| Decline / cancel / gateway unavailable | Cart and existing attempt preserved; buyer can resume without an unintended new charge. |
| Event arrives before local linkage | Durable unmatched event is reconciled, not permanently discarded. |
| Crash after each persistence step | Recovery converges without paid/unapplied stock being hidden; exceptions alert staff. |
| Payment mismatch / forged webhook | Wrong amount/currency/reference and invalid signature cannot settle an order. |
| Quote with blank optional fields | Customer submission, admin list/detail and status change succeed. |
| Product-initiated quote | Selected product and correct quote category persist and appear to staff. |
| Account lifecycle / authorization | Confirmation, reset, expiry and logout work; customer A cannot access B; nonadmins cannot mutate admin resources. |
| Direct Supabase API / RPC access | Anon/customer privileges cannot bypass backend access controls or modify settlement/roles. |
| More than 100 records | Old pending work is searchable; counts and revenue reconcile without truncation. |
| Mobile / keyboard / accessibility | Real clicks and visible state transitions at representative widths; keyboard and screen-reader completion. |
| Backup / restore / rollback | Documented rehearsal in isolation, recovery time and restored data completeness. |
| Provider acceptance | Approved Paystack test-mode evidence; live merchant/channel/webhook configuration separately verified. Any live transaction requires authorization. |

## 7. Launch sign-off checklist

- [ ] F01: deployed RLS, grants and RPC restrictions independently verified; no unauthorized customer/role/payment access.
- [ ] F02–F05/F08/F09: paid checkout and fulfillment invariants pass integration, concurrency and recovery tests.
- [ ] F06/F12: quote submissions remain visible/actionable, including null optional fields and product context.
- [ ] F07: resolved dependency inventory scanned; applicable security findings remediated or formally assessed.
- [ ] F10: identity ownership, email confirmation, admin expiry, reset and logout verified with deployment settings.
- [ ] F11/F20: owner approves current stock/options/prices, tax/delivery treatment, privacy and commercial terms.
- [ ] F19: responsible operators and customer receipt/reference recovery process demonstrated.
- [ ] F16: correct domains, CORS, environment mode, integrations, schema, HTTPS/headers, health checks and alerts verified.
- [ ] Backup and restore rehearsal completed; rollback owner and procedure recorded.
- [ ] F17/F18/F21: browser/mobile journeys, failure states and agreed performance/accessibility checks pass.
- [ ] Required hosted CI checks pass on the release commit; deployment revision and branch protection verified.
- [ ] Remaining lower-priority work has an owner, due date and explicit risk acceptance.

## 8. Standards and primary references

This report uses the following as review guidance; it does not claim formal certification, comprehensive penetration testing, legal compliance or every ASVS requirement being tested.

- [OWASP ASVS 5.0](https://owasp.org/projects/asvs) — security review framework for authentication, authorization, validation and operational controls.
- [OWASP Business Logic Security](https://cheatsheetseries.owasp.org/cheatsheets/Business_Logic_Security_Cheat_Sheet.html) — state transitions and resource/concurrency integrity.
- [Supabase row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security) — database protection independent of frontend/API assumptions.
- [Supabase signup behavior](https://supabase.com/docs/reference/javascript/auth-signup) — confirmation-dependent sessions; the provider concept also applies to the Python-backed signup journey.
- [Paystack verification](https://paystack.com/docs/payments/verify-payments/) and [webhooks](https://paystack.com/docs/payments/webhooks/) — authoritative payment results, authenticity and retries.
- [Starlette maintainer security advisory](https://github.com/Kludex/starlette/security/advisories/GHSA-f96h-pmfr-66vw) — matching installed-version security evidence.
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/) and [Core Web Vitals](https://web.dev/articles/vitals) — accessibility review and measurable performance targets.

## 9. Audit delivery status

**Files changed:** `backend/app/models/orders.py`, `backend/app/models/quotes.py`, `backend/app/repositories/order_repository.py`, `backend/app/routers/admin_orders.py`, `backend/app/services/admin_order_service.py`, `backend/app/services/order_service.py`, `backend/app/services/paystack_service.py`, `backend/migrations/README.md`, `backend/migrations/017_production_access_and_order_details.sql`, `backend/migrations/018_atomic_order_stock_reservations.sql`, affected existing backend test fixtures/migration expectations, `frontend/src/pages/CheckoutPage.jsx`, `frontend/src/pages/OrderConfirmationPage.jsx`, `frontend/src/pages/PaymentVerifyPage.jsx`, `frontend/src/store/cartStore.js`, and this report.

**What was modified:** Added required delivery snapshots and bounded request validation; prepared forward-only database access and atomic stock-reservation migrations; wired order creation to the reservation RPC; fixed the admin order-detail select fields; updated the migration sequence and manual execution safeguards; strengthened Paystack amount/currency/reference/state checks; restricted fulfillment transitions and stock-ineligible fulfillment; made checkout preserve cart contents and confirm changed totals; fixed nullable quote summary fields; updated existing fixtures and migration expectations for the changed contracts.

**Files intentionally not touched:** Deployed database/configuration, real customer/payment records, dependencies, catalog claims/prices, approved commercial policy, and unrelated app areas.

**Follow-up needed:** Run migrations 017 and 018 in the intended Supabase project after confirming 016 and using the manual migration process; verify grants and exercise database race/expiry/payment cases. Then complete unresolved findings and operational/business release gates. No migration, deployment, push or customer contact was performed.
