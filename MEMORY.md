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

## 2026-05-25, Frontend scaffold complete
**What was decided:** Full React + Vite frontend scaffolded at `frontend/` with Heritage Industrial design tokens, mock API layer, Zustand state, and all pages from `docs/FRONTEND_CHECKLIST.md`. Build passes clean (1.83s). All mocks return correct API contract shapes. Single `VITE_API_URL` change switches mock → real.
**Why:** Frontend must be fully buildable before the backend is live so Evans can demo and iterate on design without waiting.
**What was rejected:** Starting with only a few pages — the full checklist was completed in one session because the mock layer makes every page immediately runnable without a backend.
