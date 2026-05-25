# Backend Session: Paystack Webhook

Date: 2026-05-25

## Scope

Implemented Paystack webhook handling:

- `POST /api/v1/payments/paystack/webhook`
- HMAC SHA-512 signature validation using `PAYSTACK_SECRET_KEY`
- `charge.success` mapping to paid/failed payment status
- Payment status update
- Order payment status update
- Provider event persistence through the payment repository

## Notes

- No migrations were run.
- Tests use signed local payloads and do not call Paystack.
- Webhooks require `PAYSTACK_SECRET_KEY`; unsigned or incorrectly signed payloads
  are rejected.

## Verification

Run:

```bash
cd backend
python -m pytest -x -q
```

Result: `47 passed in 1.04s`
