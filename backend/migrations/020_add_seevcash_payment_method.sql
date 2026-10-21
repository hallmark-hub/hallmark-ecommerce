-- Add SeevCash (Seev Plus) as a payment provider alongside Paystack and Moolre.
-- Apply manually after 019_add_moolre_payment_method.sql, BEFORE deploying the SeevCash checkout.
-- ALTER TYPE ... ADD VALUE cannot run inside a transaction block; run on its own.

alter type payment_method add value if not exists 'seevcash';
