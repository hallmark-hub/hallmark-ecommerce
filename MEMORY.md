Maintain this file. After any significant decision, about direction, format, content, approach, or strategy, add an entry:

## [Date], [Decision]
**What was decided:** [the choice made]
**Why:** [the reasoning]
**What was rejected:** [alternatives considered and why they were ruled out]

Read MEMORY.md at the start of every session before doing anything. Never contradict a logged decision without flagging it first.

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
