Maintain this file. After any significant decision, about direction, format, content, approach, or strategy, add an entry:

## [Date], [Decision]
**What was decided:** [the choice made]
**Why:** [the reasoning]
**What was rejected:** [alternatives considered and why they were ruled out]

Read MEMORY.md at the start of every session before doing anything. Never contradict a logged decision without flagging it first.

---

## 2026-09-20, Homepage map section + Terms page from documented policy fragments
**What was decided:** Add a keyless Google Maps embed (address-string geocoded, no GPS pin needed) plus a "Get Directions on Google Maps" link in a "Find Us Here" homepage section placed immediately before the final "Need a Custom Quote?" CTA, alongside the admin-managed address, phones, email and business hours (new `mapsEmbedUrl`/`mapsDirectionsUrl` helpers in `frontend/src/config/contact.js`). Add a `/terms` Terms & Conditions page drafted strictly from the client-documented policy fragments — Paystack payment, 24-hour delivery after full payment / 6–8 weeks preorders, 3-day returns/no refunds with exchange for defects, custom items non-returnable, warranty summary — linked from the footer Company column. Owner confirmed 2026-09-20 that **all migrations 001–015 are applied** in Supabase.
**Why:** The owner wanted a clickable map for directions keyed off the existing address (the address resolves GPS, so no coordinates are needed) and asked for it as a visible homepage section rather than the footer; the client docs contain no actual Terms & Conditions text, so the page uses only supplied facts and avoids fabricated legal clauses, mirroring the conservative warranty/returns approach.
**What was rejected:** Embedding a GPS-pin map (no confirmed coordinates yet; address-based geocoding avoids a wrong pin); hiding the map in the footer (owner: "you are hiding it" — it belongs on the homepage before the final CTA); publishing full legal terms or a Privacy Policy (not supplied and still an open §17 item); leaving the migration state marked "apply pending" after the owner's in-session confirmation.

## 2026-09-20, Client catalogue seeded with client-supplied prices
**What was decided:** Migration `015_seed_client_catalog.sql` seeds the 13 client-supplied catalogue items (from the supplied photography in `frontend/public/media/chefware/products/`). Prices come from the client's own photo filenames (e.g. "WHITE WITH GOLD STRIPES POLYCOTTON GHC240.jpeg" → GHC 240); the banqueting trolley and all three robotics items are quote-only (`price_label: 'Request a quote'`) because no price was supplied for them. ChefWare confirms/updates prices through the Admin -> Inventory dashboard. The homepage "Industries we serve" chips were removed because the new "Trusted by Businesses Across Ghana" clients marquee covers that ground — **this supersedes the doc §6 industries chips on the homepage** (recorded per the source-of-truth doc rule).
**Why:** The client supplied photos with embedded GHC prices in the filenames, so those prices are authoritative supplier data rather than invented figures; the shop works end to end without fabrication. The named-clients marquee replaces the generic industry list on the homepage per project-owner instruction.
**What was rejected:** Leaving the catalogue empty until prices arrive, inventing definitive prices that contradict the supplied filename prices, or using early placeholder prices once the filename prices were discovered.

## 2026-09-20, Featured client names published as a marquee strip
**What was decided:** Add a "Trusted by Businesses Across Ghana" marquee to the homepage listing the exact documented client names: Labadi Beach Hotel, Lancaster Hotels, Pomona, Moka's Express, Hallmark Cafe. Logos will be added later (name-only text for now), so each entry has an optional `logo_url` field. Motion is a slow left-to-right marquee (`marquee-track-ltr`, 60s) that pauses on hover.
**Why:** The client document's "Projects & Clients" section lists these as featured clients, and the project owner explicitly authorized displaying the names now.
**What was rejected:** Continuing to withhold the client names (they are now client-approved to display as text); the logos themselves still require the doc's permission step and remain in `TRUSTED_BY` with `logo_url: null`.
**Amended 2026-09-20:** ChefWare supplied logo files for Labadi Beach Hotel, Lancaster Hotels, Moka's Express and Hallmark Cafe into `frontend/public/clients-logo/`; they now render on the marquee. Pomona has no logo yet and stays text-only.

## 2026-09-20, Services, quote options, and footer realigned to the client document
**What was decided:** Make the client document (`docs/PROJECT_DETAILS/Chefware_Enterprise_Professional_Website_Structure.docx`) the only source of truth for service groups and contact options. The five service slugs are now `uniforms`, `branding-embroidery`, `kitchen-solutions`, `disposables`, `robotics`; the quote/contact dropdown uses exactly the document's seven options (`uniforms`, `branding-embroidery`, `kitchen-equipment`, `kitchen-setup`, `disposables`, `robotics`, `other`) — this **supersedes** the old six-slug service rule ("six slugs remain validated system routes") and the old quote categories (machine-preorders, machine-customization, embroidery, logo-printing-branding are deactivated in code/migration 014). FAQ and warranty/returns copy now live in the storefront footer (accordion + warranty block) instead of standalone pages. Migration `014_doc_aligned_categories_and_quote_options.sql` adds the 5 service categories, renames robotics → "Hospitality Robotics" and kitchen-setup → "Kitchen Setup", deactivates the legacy quote categories, and rewrites the `site_content` JSONB.
**Why:** The web document is the client-approved single source of truth, so the catalogue/services model, dropdown options, and footer support content must match it exactly. FAQ/warranty/returns stay outside unbuilt corporate pages while keeping e-commerce the primary journey.
**What was rejected:** Keeping the six legacy service slugs or adding the old quote categories; hardcoding service detail/quote labels in React (new `frontend/src/config/quoteCategories.js` centralizes labels); building standalone FAQ/Projects/Industries/CEO pages instead of the footer + existing homepage.
**Amended 2026-09-20:** The FAQ accordion was removed from the storefront footer per project-owner instruction; only the Warranty & Returns block remains there. **Further amended:** Warranty & Returns moved off the footer onto its own `/warranty-returns` page, linked from the footer's Company column.

## 2026-09-20, Services use admin-managed detail pages
**What was decided:** Quote services are links to `/services/:slug` detail pages with a primary quote action. Service titles, descriptions, and images live in the existing admin-managed `site_content` record, while the six slugs remain validated system routes.
**Why:** Services are not inventory filters. A short explanatory page gives buyers enough context to request a quote, and administrators can update public copy and images without a code release.
**What was rejected:** Filtering the product grid by service category; embedding new service copy directly in React; creating a second enquiry flow.

## 2026-09-20, Catalog sidebar uses one Services entry
**What was decided:** Replace the individual service links in the product-catalog sidebar with one `Services` link to the services overview.
**Why:** The sidebar is product navigation. One entry gives visitors a simple, clear way to discover all services without presenting services as product categories.
**What was rejected:** Listing every service in the catalog sidebar or sending the visitor directly into a single service without the overview.

## 2026-09-20, Client production catalogue loaded with conservative pricing rules
**What was decided:** Load the 13 client-supplied catalogue items with their distinct supplied images and initial stock quantity 10. Use filename prices only where a price was explicitly supplied; keep the unpriced banqueting trolley and three robotics items quote-only.
**Why:** This replaces the deleted test catalogue with traceable client material without inventing prices or repeating placeholder imagery.
**What was rejected:** Generic repeated product photos, fabricated pricing, and keeping unpriced items out of the catalogue entirely.

## 2026-09-20, Supabase data clients are isolated per repository
**What was decided:** Create a fresh synchronous Supabase data client for each repository instead of sharing one cached client across API requests. Keep the separate auth client cache because auth and service-role sessions must remain isolated.
**Why:** Concurrent browser requests corrupted the shared HTTP/2 session (`LocalProtocolError` and stream `KeyError`), leaving the catalogue loading. Per-repository clients remove unsafe cross-thread session sharing.
**What was rejected:** Increasing frontend timeouts, serializing all database traffic behind a global lock, or sharing the auth client with data repositories.

## 2026-09-20, HTTP transport debug logs are suppressed
**What was decided:** Keep application DEBUG logging in local development, but force `httpx`, `httpcore`, and `hpack` to WARNING in every environment.
**Why:** Low-level HTTP/2 debug output can include Authorization and API-key headers, which must never be copied into application or hosting logs.
**What was rejected:** Disabling useful application debug logs entirely or relying on operators to redact transport output after collection.

## 2026-09-20, Public company content is admin-managed
**What was decided:** Store public company identity, contact details, SEO text, homepage marketing sections, About content, Robotics content, page visibility, quote imagery, and replaceable media URLs in one validated `site_content` record. The storefront reads that record through `/api/v1/site-content`; authenticated administrators edit it through the Website Content dashboard and existing Cloudinary upload route. Product catalogue and inventory data remain in their existing product administration flow.
**Why:** Client-supplied company information and marketing images will change, and those changes must not require editing React or shipping a new frontend release. A bounded schema keeps the editor usable while preserving the commerce-first information architecture.
**What was rejected:** Leaving client content and image paths embedded in page components; introducing a full generic CMS or arbitrary JSON editor, which would be harder for the client to operate and larger than the current need.

## 2026-09-20, Commerce-first company and robotics architecture
**What was decided:** Keep Shop and Request a Quote as the primary storefront journeys. Use the new professional company document as a content source rather than a literal sitemap, with dedicated About and Robotics pages, a compact company story on the homepage, and a quote-only `robotics` category backed by manual migration `009_add_robotics_category.sql`. Use the latest client-supplied public contact details and selected supplied imagery; continue withholding client, partnership, warranty, delivery, and project claims that still need approval or evidence.
**Why:** Copying every corporate section onto the homepage would bury product discovery and checkout. Separate high-value solution pages strengthen business credibility and lead capture while preserving the working e-commerce path.
**What was rejected:** Turning the homepage into the full corporate brochure, publishing named clients or manufacturer partnerships without approval, reviving manual bank-transfer instructions, or adding an unpersistable frontend-only robotics enquiry option.

## 2026-08-21, Customer contact is WhatsApp click-to-chat, not outbound messaging
**What was decided:** Customers reach reps by clicking through to WhatsApp (floating button on every storefront page, footer link, and a CTA on the quote request page). No outbound notification provider will be wired. All contact details now live in `frontend/src/config/contact.js`, driven by `VITE_WHATSAPP_NUMBER` / `VITE_CONTACT_PHONE` / `VITE_CONTACT_EMAIL` / `VITE_CONTACT_ADDRESS` with TBC fallbacks.
**Why:** Click-to-chat needs no provider account, no per-message cost, and no delivery monitoring, and it puts the customer in a channel Ghanaian buyers already use. The number was previously hardcoded as a placeholder in two files, so swapping in the real one was error-prone.
**What was rejected:** Building the WAHA integration for outbound receipts (no instance available, and it makes ChefWare responsible for delivery failures). Africa's Talking SMS (already dropped). The `AT_*`, `ADMIN_NOTIFICATION_PHONE`, and `ADMIN_API_KEY` env vars are now commented as DEPRECATED in `.env.example` rather than deleted, pending Evans's confirmation.

## 2026-08-21, Order status is never inferred client-side
**What was decided:** `OrderConfirmationPage` reads order status only from the backend lookup. When the checkout phone is missing from sessionStorage it prompts the customer to enter it, rather than rendering a success screen.
**Why:** The page previously fabricated `payment_status: 'paid'`, `order_status: 'confirmed'`, and a GH₵0.00 total whenever sessionStorage lacked the phone — so a customer opening the confirmation link on another device, or returning later, saw a failed order presented as paid. Landing on the confirmation URL is not evidence that a payment succeeded.
**What was rejected:** Trusting the URL reference alone (the reference is guessable-adjacent and proves nothing about payment) and showing a bare error page (loses the customer's ability to self-serve their receipt).

**Chatbot:** deferred — Evans is building the FAQ chatbot himself. Nothing scaffolded for it.

## 2026-08-21, Production hardening pass before client handover
**What was decided:** Close the pre-handover blockers found in the readiness audit: pin JWT verification algorithms instead of trusting the token header, fail fast in production when required env vars are missing, add stdout logging across the backend, replace the 4-digit order reference suffix with a 6-character 32-symbol suffix plus conflict retry, validate stock at checkout and decrement it through an idempotent `apply_order_stock` database function, wrap every blocking service call in `run_in_threadpool`, add an in-process per-IP rate limiter, add a `/auth/refresh` endpoint with silent client-side token refresh, and add a GitHub Actions verify workflow.
**Why:** The audit found an auth bypass (an unset `SUPABASE_JWT_SECRET` let a token forged with an empty HMAC secret verify), a ~39%-per-day order reference collision rate against a `unique` constraint, silent in-memory fallbacks that would have lost real orders on any Render restart, zero logging behind a 500 handler that swallowed exceptions, sync Supabase/Paystack I/O stalling the event loop, and hour-long sessions dying with no recovery path.
**What was rejected:** Converting route handlers from `async def` to `def` to get FastAPI's automatic threadpool — smaller diff, but it contradicts the 2026-05-25 async-route decision and risks the sandbox hang that decision was made to avoid. Adding `slowapi` for rate limiting — a new dependency outside the locked stack for something ~40 lines covers at current scale. Wiring a real notification provider — WAHA has no instance URL yet, so the stub now logs every skipped receipt instead of failing silently.

## 2026-08-21, Rate limiting is per-worker and skipped in tests
**What was decided:** The sliding-window limiter keeps state in process memory and returns early when `APP_ENV=test`; the limiter itself is covered by direct unit tests in `test_rate_limit.py`.
**Why:** Route tests drive many requests from one address and would trip the limit as the suite grows, making failures look like product bugs. Per-worker state is sufficient for the current single-worker Render deployment.
**What was rejected:** Redis-backed shared counters (no Redis in the stack, and one worker does not need it) and raising the limits high enough for tests to pass (would have made the limits useless in production). Note: this must be revisited before scaling to multiple workers.

## 2026-06-09, Supabase auth must use a separate client (never the service-role data client)
**What was decided:** Auth calls (`sign_in_with_password`, `sign_up`, `get_user`) run on a dedicated `get_supabase_auth_client()` (anon key), never on the shared `get_supabase_client()` service-role singleton. The service-role client is reserved strictly for table/data operations.
**Why:** supabase-py auth calls set the session on whichever client makes them. Running them on the shared service-role singleton overwrote its session with the end user's JWT, so every query after *any* login ran as that RLS-restricted user — admin "list all" returned ~0 rows, inserts (orders, quote requests) failed with `42501` RLS violations, and the customer dashboard only worked when the client's session happened to be that same customer. A server restart appeared to "fix" it, but only until the next login. A separate auth client leaves the data client's service-role session intact.
**What was rejected:** Restarting the worker / chasing a stale `.env` (treated symptoms, not the cause); creating a fresh client per auth request (needless overhead — one cached anon auth client suffices, since the session is read from the auth *response*, not from client state).

## 2026-06-09, Supabase JWTs are ES256 — verify via JWKS, requires `cryptography`
**What was decided:** Local JWT verification routes by the token's actual `alg`: ES256 (Supabase asymmetric signing keys) is verified against the project JWKS endpoint via a cached `PyJWKClient`; HS256 falls back to the shared secret. `cryptography` is pinned in requirements (PyJWT needs it for ES256).
**Why:** The project's Supabase signs tokens with ES256, but verification was hardcoded to HS256 → every authenticated request 401'd (`alg not allowed`), and without `cryptography` installed PyJWT raised `MissingCryptographyError`. JWKS keeps verification local (key is cached) so there's no per-request auth round-trip.
**What was rejected:** Removing `SUPABASE_JWT_SECRET` to fall back to the slow `auth.get_user()` API round-trip; switching the Supabase project back to legacy HS256 secrets.
**Amended 2026-08-21:** "routes by the token's actual `alg`" now means the header alg only *selects the key*; the `algorithms` list passed to `jwt.decode` is pinned to that key's family, and the HS branch is refused outright when `SUPABASE_JWT_SECRET` is blank. Verifying with whatever alg the token names was an auth bypass.

---

## 2026-05-25, Codex project reference
**What was decided:** Add `AGENTS.md` as the Codex entry point and keep `CLAUDE.md` as the canonical project contract.
**Why:** The project was already set up for Claude, and Codex needs a stable local reference that points to the same client rules without creating competing instructions.
**What was rejected:** Duplicating all Claude instructions into a separate Codex-only file, because duplicated rules would drift and create ambiguity.

## 2026-05-25, API contract hardening
**What was decided:** Keep the shared API contract explicit about base URL composition, secure order lookup by reference plus phone, checkout policy acceptance, nullable quote pricing, environment-gated notifications, placeholder bank details, and envelope-wrapped validation errors.
**Why:** These choices let backend and frontend work in parallel without duplicate route prefixes, accidental customer data exposure, real external side effects in dev/test, or unconfirmed payment instructions.
**What was rejected:** Building against the first draft unchanged, because it had integration ambiguity and a few production-risk details.

## 2026-05-25, Backend checklist tracker
**What was decided:** Maintain `docs/BACKEND_CHECKLIST.md` as the running backend progress tracker for Codex-owned work.
**Why:** Backend and frontend work will happen in parallel, so the backend needs a clear checklist for scope, status, blockers, and verification.
**What was rejected:** Tracking backend progress only in chat, because it would be easy to lose across sessions.

## 2026-05-25, Backend foundation and catalog first slice
**What was decided:** Scaffold the backend with FastAPI health and catalog endpoints using in-memory seed data that matches `docs/API_CONTRACT.md`.
**Why:** The backend directory was empty, and frontend integration needs stable contract-compliant routes before Supabase schema work is confirmed.
**What was rejected:** Starting with Supabase persistence or payment/notification integrations, because schema, credentials, and production side-effect rules are not confirmed yet.

## 2026-05-25, Backend ASGI test approach
**What was decided:** Use async route handlers and `httpx.AsyncClient` with ASGI transport for route tests.
**Why:** Synchronous FastAPI route execution and `TestClient` hung in the current sandbox, while async ASGI tests execute reliably and still exercise the app routes.
**What was rejected:** Keeping `fastapi.testclient.TestClient` route tests, because the local verification command stalled before reporting results.

## 2026-05-25, Manual backend migrations
**What was decided:** Keep ordered SQL migrations in `backend/migrations/` for manual Supabase execution.
**Why:** Render free tier will not reliably run automatic migration jobs, and Evans needs copy/paste SQL files that can be applied in order.
**What was rejected:** Auto-running migrations from the app startup path, because production database changes require explicit manual control and Render free tier startup behavior is not a safe migration runner.

## 2026-05-25, Supabase catalog repository
**What was decided:** Add a Supabase-backed catalog repository and use local seed data only when Supabase credentials are not configured.
**Why:** Production should read catalog data from Supabase, but local tests and development still need to run without real database credentials or external calls.
**What was rejected:** Removing seed fallback immediately, because it would make local verification depend on a configured remote Supabase project.

## 2026-05-25, Orders API repository pattern
**What was decided:** Implement orders through router -> service -> repository, using Supabase when configured and an in-memory repository for local tests/dev.
**Why:** Checkout needs order creation and secure lookup now, while local verification must remain independent of Supabase credentials.
**What was rejected:** Writing order logic directly in routers or requiring Supabase for tests, because that would violate the project structure and slow local verification.

## 2026-05-25, Quote requests with notification gating
**What was decided:** Implement quote requests through router -> service -> repository, with Supabase when configured, local fallback for tests/dev, and a no-op environment gate for admin SMS notifications.
**Why:** Quote-only categories need backend support now, but local/dev/test must never send real SMS and Africa's Talking integration can be added after credentials and production messaging rules are confirmed.
**What was rejected:** Calling Africa's Talking from the first quote request slice, because that would introduce external side effects before credentials and operational rules are confirmed.

## 2026-05-25, Paystack initialize and verify
**What was decided:** Add Paystack initialize and verify endpoints with a gateway boundary, using a local no-network gateway when Paystack credentials are absent.
**Why:** Frontend checkout needs payment initialization and verification routes now, while tests and local development must not call Paystack or depend on live credentials.
**What was rejected:** Implementing webhook processing in the same slice, because webhook signature validation and event persistence should be handled separately with focused tests.

## 2026-05-25, Paystack webhook validation
**What was decided:** Add Paystack webhook processing with HMAC SHA-512 signature validation, event persistence, and payment/order status updates for `charge.success`.
**Why:** Webhooks are the authoritative async payment signal and must be validated before changing payment state.
**What was rejected:** Accepting unsigned webhook payloads or processing webhook updates without storing the provider event, because that would weaken payment auditability and security.

## 2026-05-25, Bank transfer placeholders
**What was decided:** Add the bank transfer endpoint using placeholder GCB and Stanbic account details marked as `TBC`.
**Why:** Frontend checkout can integrate the manual transfer flow now, while production bank account details remain unconfirmed.
**What was rejected:** Hardcoding real-looking bank details, because official account information has not been confirmed and wrong payment instructions would be a production risk.

## 2026-05-25, Paystack reliability hardening
**What was decided:** Make Paystack initialization idempotent, verify Paystack amounts before marking payments paid, and prevent paid payments from being downgraded by later failed signals.
**Why:** Payment endpoints can be retried by browsers, webhooks, and operators; retries and late events must not create duplicate records or corrupt paid order state.
**What was rejected:** Trusting status alone from verify/webhook responses, because amount mismatches and late failed events are common payment integration risks.

## 2026-05-25, Paystack error wrapping
**What was decided:** Normalize Paystack HTTP, network, and malformed response failures into `PaymentValidationError` messages.
**Why:** API clients should receive stable envelope-wrapped errors instead of raw `httpx` exceptions or internal parsing failures.
**What was rejected:** Letting gateway exceptions bubble out of services, because that would produce inconsistent error responses.

## 2026-05-25, Paystack webhook deduplication
**What was decided:** Add `event_key`-based Paystack webhook deduplication with a manual migration and service-level duplicate skip.
**Why:** Paystack may retry webhook delivery, and duplicate events must not reapply payment transitions or create repeated audit rows.
**What was rejected:** Ignoring duplicate protection until later, because webhook retries are normal payment-provider behavior.

## 2026-05-25, Backend production readiness doc
**What was decided:** Add a concise backend production readiness document covering Render setup, env vars, manual migrations, Paystack webhook URL, frontend API URL, and known blockers.
**Why:** Deployment needs a single operational checklist that avoids relying on chat history.
**What was rejected:** Expanding into a full deployment runbook, because admin features and final bank details are still pending.

## 2026-05-25, Minimal admin order management
**What was decided:** Add admin order list, detail, and status update endpoints behind a simple `X-Admin-API-Key` guard.
**Why:** Admin order operations are the next useful backend capability, and an API key is enough for this phase without building full user auth.
**What was rejected:** Building a full admin user/auth system now, because it would add scope beyond the current backend needs.

## 2026-05-25, Minimal admin product management
**What was decided:** Add admin product create/update, stock update, and active-state endpoints behind the existing admin API-key guard.
**Why:** Admin product and inventory operations are needed for the dashboard, and the smallest useful surface can reuse the current catalog schema.
**What was rejected:** Building bulk imports, media upload workflows, or complex product lifecycle states, because those would expand scope beyond the current admin baseline.

## 2026-05-25, Minimal admin analytics
**What was decided:** Add a basic admin analytics summary endpoint aggregating recent orders in application code.
**Why:** The admin dashboard needs simple order/revenue counts, and this avoids adding SQL views or migrations for the first version.
**What was rejected:** Building a full reporting subsystem, because current needs are limited to dashboard summary metrics.

## 2026-05-25, Frontend scaffold complete
**What was decided:** Full React + Vite frontend scaffolded at `frontend/` with Heritage Industrial design tokens, mock API layer, Zustand state, and all pages from `docs/FRONTEND_CHECKLIST.md`. Build passes clean (1.83s). All mocks return correct API contract shapes. Single `VITE_API_URL` change switches mock → real.
**Why:** Frontend must be fully buildable before the backend is live so Evans can demo and iterate on design without waiting.
**What was rejected:** Starting with only a few pages — the full checklist was completed in one session because the mock layer makes every page immediately runnable without a backend.

## 2026-05-25, Paystack-only checkout payments
**What was decided:** Remove the manual bank transfer checkout path; bank rails will be connected inside Paystack and the app will submit orders with `payment_method: "paystack"`.
**Why:** Paystack can handle card, MoMo, and bank settlement without exposing manual account details or requiring manual bank-transfer confirmation in the e-commerce backend.
**What was rejected:** Keeping placeholder GCB/Stanbic instructions and a separate manual transfer confirmation flow, because it adds operational risk and is no longer needed for checkout.

## 2026-05-28, Backend checklist completion
**What was decided:** Mark backend Supabase repository integration complete in code, keep production schema confirmation blocked until explicit migration approval, renumber the product-image SQL fix to `006_fix_product_images.sql`, and force pytest runs to blank external-service credentials.
**Why:** The backend now routes Supabase access through repositories with in-memory fallback for local verification, migration filenames need a single documented apply order, and tests must not mutate real Supabase data when `.env` contains credentials.
**What was rejected:** Running migrations or validating against the live Supabase project in this session, because database-changing actions require explicit approval.

## 2026-05-28, Frontend-backend wiring
**What was decided:** Wire the Claude-built frontend to the FastAPI backend through the centralized API layer, including real checkout payloads, Paystack verification return handling, admin analytics/orders, and inventory stock updates.
**Why:** The database and backend are now connected, so the frontend should use the implemented API contract instead of local mock data wherever backend routes exist.
**What was rejected:** Keeping admin orders/inventory/dashboard as static mocks, because those views now have usable backend routes; admin quote listing remains pending because no backend list endpoint exists yet.

## 2026-05-28, Production account architecture
**What was decided:** Use Supabase Auth bearer tokens for customer login/register and admin dashboard access, with `customer_profiles.role = 'admin'` controlling admin authorization and `ADMIN_API_KEY` retained only as a backend fallback.
**Why:** Customer dashboards need real identities, and exposing an admin API key in Vercel/frontend code would not be production safe.
**What was rejected:** Continuing with mock customer auth or shipping `VITE_ADMIN_API_KEY`, because those approaches cannot safely protect customer/admin production data.

## 2026-05-28, Product image source
**What was decided:** Product images are sourced from the backend `products.images` array, with a shared frontend fallback only when the DB image URL is missing or fails to load.
**Why:** Supabase is now the catalog source of truth, but live test rows contained broken placeholder URLs such as `https://example.com/hat.jpg`, causing blank images.
**What was rejected:** Embedding product-specific image mappings in the frontend, because that would drift from the database-backed catalog.

## 2026-05-28, Post-wiring integration check — known broken state
**What was decided:** Log the current end-to-end state after wiring the frontend to the real backend so Codex and Evans share one snapshot of what is broken and what needs explicit approval.
**Why:** Categories sidebar groups render empty and customer auth fails, but the frontend code is correct — the failures are CORS, missing migration 007, and test pollution in the live `products` table.
**What was rejected:** Patching the frontend to hide the symptoms (e.g. hardcoding category lists or silencing auth errors), because the real fixes belong on the backend/DB side and hiding them would mask the production-readiness gap.

Findings (as of 2026-05-28):
1. **CORS** — Backend `allow_origins` in `backend/app/main.py` is a single string `settings.frontend_url` = `http://localhost:5173`. Two Vite servers are alive (5173 and 5174); requests from 5174 are rejected with `Disallowed CORS origin`. Decision: standardize on 5173 locally, or have Codex widen `allow_origins` to a list.
2. **Live `products` table is nearly empty and polluted** — 7 rows total, 4 are pytest artifacts (`admin-test-chef-hat`, `admin-update-hat`, `admin-stock-hat`, `admin-active-hat`) with `https://example.com/hat.jpg`. Only categories `chef-uniforms` and `kitchen-setup` have any real rows; categories 2, 3, 5–8 are empty. Pytest must be locked out of prod Supabase before anything else.
3. **Migration 007 not applied** — `customer_profiles` table is missing in live Supabase (`PGRST205`). `/api/v1/auth/register` succeeds at Supabase Auth then fails the profile insert and returns the generic `"Customer registration failed"`. Customer login, `/auth/me`, and `/customer/orders` all blocked until migration 007 runs. Requires explicit Evans approval per hard-stop rule.
4. **Admin login chain blocked on migration 007** — Frontend only sends the Supabase JWT; backend `require_admin` accepts that JWT only if the matching `customer_profiles` row has `role='admin'`. After 007 is applied, Evans's account must be promoted manually: `UPDATE customer_profiles SET role='admin' WHERE email='okyerevansjohn@gmail.com';`. No `VITE_ADMIN_API_KEY` is shipped to the client — that is intentional and must stay that way.
5. **Images** — Frontend already falls back via `frontend/src/utils/images.js` `useFallbackImage`. Real Unsplash URLs in the DB render fine; only the 4 admin-test rows look broken. Cloudinary upload is independent and can wait.

How to apply: Treat this as the active punch list. Hand items 1–4 to Codex (backend/DB); item 5 is informational. Do not paper over any of these on the frontend. Update or remove this entry once each item is resolved.

## 2026-05-28, CORS env-driven allowlist
**What was decided:** Replace the single-origin `allow_origins=[settings.frontend_url]` with an env-driven `CORS_ALLOWED_ORIGINS` comma-separated list, falling back to `FRONTEND_URL` when unset. Local `.env` sets it to `http://localhost:5173,http://localhost:5174`.
**Why:** Production best practice is a strict explicit allowlist (no wildcards with credentials), and the current Vite setup runs two dev ports — the previous single-origin config silently broke whichever browser tab was on the wrong port. Env-driven means production deploys can set the exact Vercel origin without code changes.
**What was rejected:** Wildcard `allow_origins=["*"]` (incompatible with `allow_credentials=True` and unsafe), and hardcoding multiple origins in `app/main.py` (would couple deploy targets to code).

## 2026-05-28, Production admin product uploads
**What was decided:** Admin product images upload through a protected backend endpoint that validates file type/size, signs Cloudinary uploads server-side, and stores returned `secure_url` values in `products.images`.
**Why:** Product media must not rely on manual URL pasting or expose Cloudinary credentials in the browser. The backend is the right boundary for validation, signing, and auditability.
**What was rejected:** Direct browser uploads with Cloudinary API secrets, and a manual “paste image URL” workflow, because both are unsafe or operationally weak for production.

## 2026-05-28, Admin role routing
**What was decided:** After login, route users with `customer_profiles.role = 'admin'` to `/admin`, refresh the stored profile role before account/admin access decisions, and make the navbar account link point to the admin dashboard for admins.
**Why:** Promoting an existing customer to admin in Supabase can leave an old customer role cached in browser storage, and the previous login flow always navigated to the customer dashboard.
**What was rejected:** Asking admins to manually clear local storage or manually type `/admin`, because routing should follow the authenticated profile role.

## 2026-05-28, Admin image input options
**What was decided:** The admin product form supports either uploading an image file through the backend Cloudinary path or using an existing HTTPS image URL; file upload wins when both are provided.
**Why:** Production product management should support direct uploads while still allowing already-hosted approved product assets to be reused without re-uploading.
**What was rejected:** Requiring only manual URLs or only file uploads, because either option alone creates unnecessary operational friction.

## 2026-05-28, Setup-phase test data
**What was decided:** Allow existing test products/orders to remain during setup and defer cleanup until public launch preparation.
**Why:** Evans is still validating admin workflows and may not upload final product images yet, so removing test data now would slow iteration.
**What was rejected:** Treating test data cleanup as an immediate blocker; it remains a launch checklist item, not a current development blocker.

## 2026-05-28, Admin quote management
**What was decided:** Expose admin quote request list, detail, and status update endpoints, and wire the admin dashboard quote panel to those backend routes.
**Why:** Quote-only services need a real admin workflow instead of a placeholder, and status updates let admins track requests from received through contacted, quoted, and closed.
**What was rejected:** Leaving the quote panel as static text or a one-way "mark contacted" action, because that would not be enough for production quote handling.

## 2026-06-09, Quote category lookup moved to code

**What was decided:** `SupabaseQuoteRepository.get_category_by_slug` now looks up `_CATEGORY_DATA` in application code instead of querying the Supabase `categories` table.
**Why:** Quote service categories (Kitchen Setup, Embroidery, etc.) are application-defined constants — they do not live in Supabase. Querying the DB for them caused "Quote category not found" errors because the `categories` table was never seeded.
**What was rejected:** Seeding the Supabase `categories` table as the fix — the migration `002_seed_categories.sql` exists but the architectural decision is that these are code-owned constants, not DB-owned data.

## 2026-06-09, Admin auth simplified to Supabase role only

**What was decided:** `require_admin` validates a bearer token against `customer_profiles.role = 'admin'` only. The `ADMIN_API_KEY` env var and its fallback path are removed.
**Why:** Setting `role = 'admin'` in Supabase is the correct production mechanism. The API key was a secondary fallback that caused "Admin API key is not configured" errors in production when it wasn't set.
**What was rejected:** Keeping the API key fallback — it added confusion and a production error path with no real benefit now that Supabase auth is wired end-to-end.

## 2026-06-09, Navbar user icon routing

**What was decided:** The navbar user icon checks `token` first: no token → `/login`, admin → `/admin`, customer → `/account`.
**Why:** The previous check only read `isAdmin` (persisted in Zustand), so a stale `isAdmin: true` in localStorage sent unauthenticated users directly to `/admin`.
**What was rejected:** Relying on `AccountPage`'s redirect guard — it works but forces an unnecessary page load before the redirect.

## 2026-06-09, Customer quote requests on account dashboard

**What was decided:** Added `GET /api/v1/customer/quotes` endpoint that returns the authenticated customer's quote requests matched by email, and the account dashboard now shows a "Service Requests" table alongside orders.
**Why:** Customers had no visibility into submitted quote requests from their dashboard.
**What was rejected:** Matching by phone instead of email — email is the auth identity and is more reliable as a lookup key.

## 2026-06-09, Africa's Talking removed — NotificationService is a stub

**What was decided:** All Africa's Talking code (API calls, config fields `AT_API_KEY`, `AT_USERNAME`, `AT_SENDER_ID`, `AT_SENDER_EMAIL`, `ADMIN_NOTIFICATION_PHONE`) is removed. `NotificationService` is now a no-op stub with `send_order_receipt`, `notify_quote_request`, and `should_send_admin_notifications` all returning `False`.
**Why:** Africa's Talking pricing is too high. The stub keeps all notification hooks wired in place for when a provider is chosen.
**What was rejected:** Africa's Talking email and SMS — cost ruled out.

## 2026-06-09, WAHA chosen as future WhatsApp messaging provider

**What was decided:** WAHA (self-hosted WhatsApp HTTP API) is the planned provider for order receipts and quote follow-ups sent to customers on WhatsApp. Implementation is deferred until a 24/7 server is available.
**Why:** Free per-message cost, sends to WhatsApp which customers already use, simple REST API (`POST /api/sendText`). Ghana phone `+233XXXXXXXXX` → chatId `233XXXXXXXXX@c.us`.
**What was rejected:** Running WAHA locally — laptop downtime would silently drop notifications. Needs a VPS (Hetzner/DigitalOcean ~$5/month) or Railway to run 24/7.

## 2026-09-04, Evidence-first public marketing content
**What was decided:** Replace unverified homepage leadership claims, delivery/warranty promises, and named hotel testimonials with factual buying paths until ChefWare supplies approved evidence. Request real product, team, leadership, completed-work, and company-history content in a structured brief before building the About Us page or publishing proof statements.
**Why:** Generic stock photography and unverified client names or performance claims weaken trust and create publishing risk. A business buyer needs demonstrable work and real assets before a high-value quote conversion path can be credible.
**What was rejected:** Inventing company history, testimonials, customer logos, delivery/warranty conditions, or AI-generated substitutes for ChefWare's actual work.

## 2026-05-30, Backend verification hardening
**What was decided:** Keep external media credentials blank during tests, make remaining FastAPI dependency providers async, and pin the test/runtime multipart stack used by upload routes.
**Why:** The backend test suite was hanging in admin media route tests because the active Python environment could enter external Cloudinary or sync dependency/threadpool paths during verification. Tests must stay local, deterministic, and free of real external side effects.
**What was rejected:** Treating the hang as an environment-only issue or skipping admin media route tests, because production upload behavior and CI confidence depend on that route being testable.

---

## 2026-09-20, Global partnerships published (owner-approved)
**What was decided:** Publish the client-documented Global Partnerships on the Robotics page — KEENON (hospitality & service robotics), ALPHA ROBOTICS COMPANY (robotics), PIMAK TURKIYE (kitchen/disposables sourcing) — via a new admin-managed `global_partners` site-content collection, the `016_global_partners_content.sql` migration, and a "Global Partnerships" editor section in the Website Content dashboard. The homepage Robotics section also features a "Robotics partners" strip (KEENON logo + ALPHA ROBOTICS name) per owner request. The §5 Partnerships line ("subject to confirmation of authorized branding") and the §17 "Authorized use of KEENON/ALPHA names/logos" box are interpreted as the client document itself being the approval; the owner confirmed in-session on 2026-09-20 that ChefWare submitted the names to be featured. This **supersedes** the earlier "partnerships withheld until explicitly cleared" note.
**Why:** The owner holds the approval authority for public copy and states the featured names were submitted deliberately; the KEENON logo was supplied 2026-09-20 and is now editable through the partnerships image field, while ALPHA ROBOTICS and PIMAK TURKIYE logo files are still pending.
**What was rejected:** Continuing to withhold KEENON/ALPHA/PIMAK names after the owner's explicit in-session approval; requiring a logo file before publishing the text names (copy can ship now, logos later via the existing asset workflow).

## 2026-09-20, Client website document strengthens the e-commerce content model

**What was decided:** Use the client-provided company profile to update the admin-managed storefront content: hospitality-solution positioning, founder date, solution descriptions, five robotics use cases, the second phone number, business hours, and business-quote capture fields. Keep products and checkout as the primary customer journey; the new information supports product discovery and quote conversion rather than creating a corporate brochure site.
**Why:** The supplied document answers the earlier content gap with clear company identity, audience, services and contact information, while larger kitchen, branding, disposables and robotics requirements still need a scoped enquiry rather than an invented catalogue or checkout path.
**What was rejected:** Publishing named clients, Hallmark Cafe as a case study, nationwide or West Africa delivery claims, or warranty and returns terms. The supplied document itself marks those for confirmation or approval, so they remain out of public copy until explicitly cleared.
**Amended 2026-09-20:** KEENON/ALPHA/PIMAK partnerships were published by owner approval — see the "Global partnerships published (owner-approved)" entry above.
