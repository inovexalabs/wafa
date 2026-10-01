-- Baseline defense-in-depth: enable Row Level Security on every table in the
-- public schema with no policies attached.
--
-- The API (api/) is the only consumer of this database and always connects
-- with the Supabase service_role key, which bypasses RLS unconditionally —
-- so this migration has zero effect on current application behavior.
-- Its purpose is to ensure that if the anon/authenticated key were ever
-- exposed to a client, or a future endpoint used it by mistake, every table
-- here defaults to deny-all instead of relying solely on hand-written
-- authorization checks in application code.

alter table public.profiles enable row level security;
alter table public.members enable row level security;
alter table public.member_profiles enable row level security;
alter table public.member_limits enable row level security;
alter table public.member_benefits enable row level security;
alter table public.categories enable row level security;
alter table public.ledger_entries enable row level security;
alter table public.monthly_deposits enable row level security;
alter table public.share_contributions enable row level security;
alter table public.wafa_fund_transactions enable row level security;
alter table public.loans enable row level security;
alter table public.loan_installments enable row level security;
alter table public.loan_payments enable row level security;
alter table public.loan_fines enable row level security;
alter table public.dividend_runs enable row level security;
alter table public.dividend_distributions enable row level security;
alter table public.payment_receipts enable row level security;
alter table public.documents enable row level security;
alter table public.meetings enable row level security;
alter table public.meeting_notifications enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_deliveries enable row level security;
alter table public.media enable row level security;
alter table public.payment_schedules enable row level security;
alter table public.audit_logs enable row level security;
alter table public.system_settings enable row level security;
alter table public.certificates enable row level security;
alter table public.chat_messages enable row level security;
alter table public.member_ledger_settings enable row level security;
alter table public.savings_ledger_entries enable row level security;
alter table public.landing_content enable row level security;
