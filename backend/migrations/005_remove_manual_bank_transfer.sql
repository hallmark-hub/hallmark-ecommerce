-- Remove manual bank transfer storage now that bank rails are handled by Paystack.
-- Existing databases that already applied 001 may still have payment_method values
-- beyond paystack; the application no longer accepts or writes bank_transfer.

alter table payments
    drop column if exists bank;

drop type if exists bank_code;
