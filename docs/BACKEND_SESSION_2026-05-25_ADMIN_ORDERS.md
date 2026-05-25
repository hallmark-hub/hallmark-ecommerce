# Backend Session: Admin Orders

Date: 2026-05-25

## Scope

Added minimal admin order management:

- `GET /api/v1/admin/orders`
- `GET /api/v1/admin/orders/{reference}`
- `PATCH /api/v1/admin/orders/{reference}/status`
- `X-Admin-API-Key` guard using `ADMIN_API_KEY`

## Notes

- No migrations were run.
- In production, `ADMIN_API_KEY` must be configured.
- In local/test without `ADMIN_API_KEY`, admin routes remain open for development
  and automated tests.
- This is not a full admin user system.

## Verification

Run:

```bash
cd backend
python -m pytest -x -q
```

Result: `65 passed in 0.89s`
