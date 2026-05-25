# Backend Session: Remove Manual Bank Transfer

Date: 2026-05-25

## Scope

Removed the manual bank-transfer checkout path because bank settlement will be
configured inside Paystack.

## Changes

- Removed `bank_transfer` as an accepted backend payment method.
- Removed `POST /api/v1/payments/bank-transfer`.
- Removed manual bank-transfer request/response schemas and service tests.
- Updated the initial schema for fresh installs to Paystack-only payment
  methods.
- Added `005_remove_manual_bank_transfer.sql` for existing Supabase projects to
  drop the old `payments.bank` column and `bank_code` enum.
- Updated the shared API contract and backend checklist to reflect Paystack-only
  checkout payments.

## Notes

- Paystack initialize, verify, webhook validation, idempotency, amount checks,
  and webhook deduplication remain intact.
- Existing databases that already applied the old `payment_method` enum may
  still contain the legacy enum value, but the backend no longer accepts or
  writes it.
