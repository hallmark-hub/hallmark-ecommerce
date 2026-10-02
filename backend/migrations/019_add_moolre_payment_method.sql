-- Add Moolre as a payment provider alongside Paystack.
-- Apply manually after 018_atomic_order_stock_reservations.sql.
-- ALTER TYPE ... ADD VALUE cannot run inside a transaction block; run on its own.

alter type payment_method add value if not exists 'moolre';
