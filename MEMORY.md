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
