-- Accountants and the superadmin can correct a member's receipt details
-- (amount, payment type, payment date) before it is approved. The receipt
-- keeps who last edited it and when; each edit's old/new values go to the
-- audit log as `receipt.edited`.

alter table public.payment_receipts
  add column edited_at timestamptz,
  add column edited_by uuid
    references public.profiles(id)
    on delete set null;
