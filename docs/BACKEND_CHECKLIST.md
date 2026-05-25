# Backend Checklist — ChefWare Enterprise

Last updated: 2026-05-25

Status key:
- `[ ]` Not started
- `[~]` In progress
- `[x]` Done
- `[!]` Blocked / needs decision

## Working Rules

- Update this checklist after each backend work session.
- Keep backend work inside `backend/` unless a shared contract/doc update is needed.
- Match `docs/API_CONTRACT.md` unless a change is agreed and logged in `MEMORY.md`.
- Do not run migrations, deploy, push, or call real external services without explicit in-session approval.
- Verification target for backend work: `cd backend && python -m pytest -x -q`.

## Foundation

- `[x]` Scaffold FastAPI project structure under `backend/`.
- `[x]` Add `requirements.txt` with pinned backend dependencies.
- `[x]` Add `backend/.env.example` with required variables and no secrets.
- `[x]` Add app configuration via environment variables.
- `[x]` Add CORS configuration for local frontend and deployed frontend URL.
- `[x]` Add standard response envelope helper: `{ "success": bool, "data": ..., "message": str }`.
- `[x]` Add custom exception handling for validation errors and unhandled errors.
- `[x]` Add `GET /health`.
- `[x]` Add backend README or run instructions if needed.

## API v1 Catalog

- `[x]` Add `GET /api/v1/categories`.
- `[x]` Add seeded category data matching `docs/API_CONTRACT.md`.
- `[x]` Add `GET /api/v1/products`.
- `[x]` Add product filtering by category.
- `[x]` Add product search.
- `[x]` Add product stock filtering.
- `[x]` Add pagination with `page`, `limit`, `total`, and `pages`.
- `[x]` Add `GET /api/v1/products/{slug}`.
- `[x]` Support nullable `price_pesewas` and `price_label` for quote-only products.

## Orders

- `[ ]` Add `POST /api/v1/orders`.
- `[ ]` Validate Ghana phone numbers as `+233XXXXXXXXX`.
- `[ ]` Require `accepted_returns_policy: true`.
- `[ ]` Reject quote-only products from direct orders.
- `[ ]` Calculate totals in pesewas.
- `[ ]` Generate order references.
- `[ ]` Add `GET /api/v1/orders/lookup` using `reference` plus `phone`.
- `[ ]` Include returns policy text in order responses.

## Quote Requests

- `[ ]` Add `POST /api/v1/quote-requests`.
- `[ ]` Generate quote references.
- `[ ]` Validate quote category/product usage.
- `[ ]` Gate admin notifications by environment and configured credentials.
- `[ ]` Ensure local tests/dev never send real SMS.

## Payments

- `[ ]` Add `POST /api/v1/payments/paystack/initialize`.
- `[ ]` Add `GET /api/v1/payments/paystack/verify/{reference}`.
- `[ ]` Persist Paystack verification results to order `payment_status`.
- `[ ]` Add `POST /api/v1/payments/paystack/webhook`.
- `[ ]` Validate Paystack webhook signatures before processing.
- `[ ]` Persist validated Paystack webhook events to order/payment records.
- `[ ]` Add `POST /api/v1/payments/bank-transfer`.
- `[!]` Confirm official GCB and Stanbic bank details before enabling production bank transfer instructions.

## Supabase Integration

- `[x]` Create Supabase client wrapper.
- `[x]` Add manual SQL migrations under `backend/migrations/`.
- `[~]` Define table access layer through services only.
- `[~]` Replace in-memory catalog data with Supabase reads.
- `[ ]` Replace in-memory order writes with Supabase writes.
- `[ ]` Replace in-memory quote request writes with Supabase writes.
- `[ ]` Replace in-memory payment status updates with Supabase writes.
- `[!]` Confirm schema before any migration or database-changing action.

## Admin Backend

- `[ ]` Define admin authentication approach.
- `[ ]` Add product management endpoints.
- `[ ]` Add order management endpoints.
- `[ ]` Add manual bank transfer confirmation endpoint.
- `[ ]` Add basic analytics endpoints.
- `[ ]` Add inventory update endpoints.

## Testing

- `[x]` Add health endpoint tests.
- `[x]` Add response envelope tests.
- `[x]` Add validation error envelope tests.
- `[x]` Add category/product endpoint tests.
- `[ ]` Add order creation tests.
- `[ ]` Add order lookup security tests.
- `[ ]` Add quote request tests.
- `[ ]` Add payment initialization tests with mocked Paystack.
- `[ ]` Add webhook signature tests.
- `[x]` Add migration file structure tests.
- `[x]` Add Supabase catalog repository selection tests.
- `[x]` Keep `cd backend && python -m pytest -x -q` passing after each backend change.

## Documentation

- `[ ]` Keep `docs/API_CONTRACT.md` synchronized with implemented routes.
- `[x]` Document required backend environment variables.
- `[x]` Document local backend startup command.
- `[x]` Document manual migration execution order.
- `[ ]` Document known production blockers before launch.
