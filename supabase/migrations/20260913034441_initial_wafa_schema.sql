-- ============================================================
-- WAFA â€” Initial Database Schema
-- Supabase / PostgreSQL
--
-- NOTE:
-- Final RLS / RBAC policies are intentionally NOT included.
-- They will be implemented after application development.
-- ============================================================

create extension if not exists "pgcrypto";


-- ============================================================
-- ENUMS
-- ============================================================

create type public.member_status as enum (
  'active',
  'inactive',
  'suspended',
  'left'
);

create type public.ledger_entry_type as enum (
  'monthly_deposit',
  'share_contribution',
  'wafa_fund',
  'loan_disbursement',
  'loan_payment',
  'interest',
  'fine',
  'dividend',
  'expense',
  'income',
  'adjustment',
  'other'
);

create type public.ledger_direction as enum (
  'debit',
  'credit'
);

create type public.category_type as enum (
  'deposit',
  'share',
  'loan',
  'loan_payment',
  'fine',
  'expense',
  'income',
  'wafa_fund',
  'dividend',
  'other'
);

create type public.wafa_fund_transaction_type as enum (
  'contribution',
  'withdrawal',
  'income',
  'expense',
  'transfer',
  'adjustment'
);

create type public.loan_interest_type as enum (
  'flat',
  'reducing_balance',
  'simple',
  'custom'
);

create type public.loan_status as enum (
  'pending',
  'approved',
  'active',
  'completed',
  'overdue',
  'defaulted',
  'cancelled'
);

create type public.installment_status as enum (
  'pending',
  'partially_paid',
  'paid',
  'overdue',
  'waived'
);

create type public.fine_status as enum (
  'active',
  'paid',
  'waived'
);

create type public.dividend_run_status as enum (
  'draft',
  'calculated',
  'approved',
  'finalized',
  'cancelled'
);

create type public.dividend_distribution_status as enum (
  'pending',
  'paid',
  'cancelled'
);

create type public.receipt_payment_type as enum (
  'monthly_deposit',
  'share_contribution',
  'loan_payment',
  'other'
);

create type public.receipt_status as enum (
  'pending',
  'approved',
  'rejected'
);

create type public.document_visibility as enum (
  'members',
  'admin_only'
);

create type public.meeting_type as enum (
  'online',
  'physical',
  'hybrid'
);

create type public.meeting_status as enum (
  'scheduled',
  'completed',
  'cancelled'
);

create type public.notification_type as enum (
  'loan_due',
  'payment_due',
  'receipt_approved',
  'receipt_rejected',
  'meeting',
  'dividend',
  'system'
);

create type public.notification_channel as enum (
  'in_app',
  'email'
);

create type public.delivery_status as enum (
  'pending',
  'sent',
  'failed'
);

create type public.media_type as enum (
  'video',
  'image',
  'external'
);

create type public.media_visibility as enum (
  'members',
  'admin_only'
);

create type public.schedule_type as enum (
  'monthly_deposit',
  'loan_installment',
  'other'
);

create type public.schedule_status as enum (
  'pending',
  'paid',
  'overdue',
  'cancelled'
);


-- ============================================================
-- MEMBERS
-- ============================================================

create table public.members (
  id uuid primary key default gen_random_uuid(),

  auth_user_id uuid unique
    references auth.users(id)
    on delete restrict,

  member_number varchar(50) unique not null,

  full_name varchar(150) not null,
  email varchar(255),
  phone varchar(30),

  status public.member_status not null default 'active',

  joined_at timestamptz not null default now(),
  left_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint members_left_date_check
    check (
      status <> 'left'
      or left_at is not null
    )
);


-- ============================================================
-- MEMBER PROFILES
-- ============================================================

create table public.member_profiles (
  id uuid primary key default gen_random_uuid(),

  member_id uuid unique not null
    references public.members(id)
    on delete cascade,

  date_of_birth date,
  address text,
  occupation varchar(150),
  emergency_contact varchar(100),

  profile_image_key text,

  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- ============================================================
-- MEMBER LIMITS
-- ============================================================

create table public.member_limits (
  id uuid primary key default gen_random_uuid(),

  member_id uuid not null
    references public.members(id)
    on delete cascade,

  monthly_deposit_limit numeric(14,2),
  additional_share_limit numeric(14,2),
  maximum_loan_amount numeric(14,2),
  maximum_outstanding_loan numeric(14,2),

  effective_from date not null,
  effective_until date,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint member_limits_positive
    check (
      coalesce(monthly_deposit_limit, 0) >= 0
      and coalesce(additional_share_limit, 0) >= 0
      and coalesce(maximum_loan_amount, 0) >= 0
      and coalesce(maximum_outstanding_loan, 0) >= 0
    ),

  constraint member_limits_date_check
    check (
      effective_until is null
      or effective_until >= effective_from
    )
);


-- ============================================================
-- MEMBER BENEFITS
-- ============================================================

create table public.member_benefits (
  id uuid primary key default gen_random_uuid(),

  member_id uuid not null
    references public.members(id)
    on delete cascade,

  benefit_type varchar(100) not null,
  title varchar(200) not null,
  description text,

  amount numeric(14,2),

  status varchar(30) not null default 'active',

  valid_from date,
  valid_until date,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint member_benefits_amount_check
    check (amount is null or amount >= 0),

  constraint member_benefits_date_check
    check (
      valid_until is null
      or valid_from is null
      or valid_until >= valid_from
    )
);


-- ============================================================
-- CATEGORIES
-- ============================================================

create table public.categories (
  id uuid primary key default gen_random_uuid(),

  name varchar(100) not null,
  category_type public.category_type not null,

  description text,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint categories_name_type_unique
    unique (name, category_type)
);


-- ============================================================
-- LEDGER ENTRIES
-- ============================================================

create sequence public.ledger_entry_number_seq
  as bigint
  start with 100001
  increment by 1;

create table public.ledger_entries (
  id uuid primary key default gen_random_uuid(),

  entry_number bigint not null
    default nextval('public.ledger_entry_number_seq')
    unique,

  member_id uuid
    references public.members(id)
    on delete restrict,

  category_id uuid
    references public.categories(id)
    on delete restrict,

  entry_type public.ledger_entry_type not null,

  amount numeric(14,2) not null,

  direction public.ledger_direction not null,

  transaction_date timestamptz not null default now(),

  description text,

  reference_type varchar(100),
  reference_id uuid,

  metadata jsonb not null default '{}'::jsonb,

  created_by uuid
    references auth.users(id)
    on delete set null,

  created_at timestamptz not null default now(),

  constraint ledger_amount_positive
    check (amount > 0)
);


-- ============================================================
-- MONTHLY DEPOSITS
-- ============================================================

create table public.monthly_deposits (
  id uuid primary key default gen_random_uuid(),

  member_id uuid not null
    references public.members(id)
    on delete restrict,

  period_year smallint not null,
  period_month smallint not null,

  amount numeric(14,2) not null,

  ledger_entry_id uuid unique not null
    references public.ledger_entries(id)
    on delete restrict,

  payment_date timestamptz not null default now(),

  notes text,

  created_by uuid
    references auth.users(id)
    on delete set null,

  created_at timestamptz not null default now(),

  constraint monthly_deposit_amount_positive
    check (amount > 0),

  constraint monthly_deposit_month_check
    check (period_month between 1 and 12),

  constraint monthly_deposit_year_check
    check (period_year between 2000 and 2100),

  constraint monthly_deposit_unique_period
    unique (member_id, period_year, period_month)
);


-- ============================================================
-- SHARE CONTRIBUTIONS
-- ============================================================

create table public.share_contributions (
  id uuid primary key default gen_random_uuid(),

  member_id uuid not null
    references public.members(id)
    on delete restrict,

  amount numeric(14,2) not null,

  contribution_date timestamptz not null default now(),

  ledger_entry_id uuid unique not null
    references public.ledger_entries(id)
    on delete restrict,

  notes text,

  created_by uuid
    references auth.users(id)
    on delete set null,

  created_at timestamptz not null default now(),

  constraint share_contribution_amount_positive
    check (amount > 0)
);


-- ============================================================
-- WAFA FUND
-- ============================================================

create table public.wafa_fund_transactions (
  id uuid primary key default gen_random_uuid(),

  transaction_type public.wafa_fund_transaction_type not null,

  amount numeric(14,2) not null,

  ledger_entry_id uuid unique not null
    references public.ledger_entries(id)
    on delete restrict,

  transaction_date timestamptz not null default now(),

  description text,

  reference_type varchar(100),
  reference_id uuid,

  created_by uuid
    references auth.users(id)
    on delete set null,

  created_at timestamptz not null default now(),

  constraint wafa_fund_amount_positive
    check (amount > 0)
);


-- ============================================================
-- LOANS
-- ============================================================

create sequence public.loan_number_seq
  as bigint
  start with 1001
  increment by 1;

create table public.loans (
  id uuid primary key default gen_random_uuid(),

  loan_number varchar(50) not null unique
    default (
      'LOAN-' || nextval('public.loan_number_seq')::text
    ),

  member_id uuid not null
    references public.members(id)
    on delete restrict,

  principal_amount numeric(14,2) not null,

  interest_type public.loan_interest_type not null,

  interest_rate numeric(8,4) not null,

  term_months integer,

  disbursed_at timestamptz,
  maturity_date date,

  status public.loan_status not null default 'pending',

  purpose text,
  notes text,

  created_by uuid
    references auth.users(id)
    on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint loan_principal_positive
    check (principal_amount > 0),

  constraint loan_interest_rate_nonnegative
    check (interest_rate >= 0),

  constraint loan_term_positive
    check (term_months is null or term_months > 0),

  constraint loan_maturity_check
    check (
      maturity_date is null
      or disbursed_at is null
      or maturity_date >= disbursed_at::date
    )
);


-- ============================================================
-- LOAN INSTALLMENTS
-- ============================================================

create table public.loan_installments (
  id uuid primary key default gen_random_uuid(),

  loan_id uuid not null
    references public.loans(id)
    on delete restrict,

  installment_number integer not null,

  due_date date not null,

  principal_due numeric(14,2) not null default 0,
  interest_due numeric(14,2) not null default 0,
  fine_due numeric(14,2) not null default 0,

  principal_paid numeric(14,2) not null default 0,
  interest_paid numeric(14,2) not null default 0,
  fine_paid numeric(14,2) not null default 0,

  status public.installment_status not null default 'pending',

  paid_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint installment_number_positive
    check (installment_number > 0),

  constraint installment_amounts_nonnegative
    check (
      principal_due >= 0
      and interest_due >= 0
      and fine_due >= 0
      and principal_paid >= 0
      and interest_paid >= 0
      and fine_paid >= 0
    ),

  constraint installment_principal_not_overpaid
    check (principal_paid <= principal_due),

  constraint installment_interest_not_overpaid
    check (interest_paid <= interest_due),

  constraint installment_fine_not_overpaid
    check (fine_paid <= fine_due),

  constraint loan_installment_unique_number
    unique (loan_id, installment_number)
);


-- ============================================================
-- LOAN PAYMENTS
-- ============================================================

create table public.loan_payments (
  id uuid primary key default gen_random_uuid(),

  loan_id uuid not null
    references public.loans(id)
    on delete restrict,

  installment_id uuid
    references public.loan_installments(id)
    on delete restrict,

  amount numeric(14,2) not null,

  principal_amount numeric(14,2) not null default 0,
  interest_amount numeric(14,2) not null default 0,
  fine_amount numeric(14,2) not null default 0,

  payment_date timestamptz not null default now(),

  ledger_entry_id uuid unique not null
    references public.ledger_entries(id)
    on delete restrict,

  reference varchar(100),
  notes text,

  created_by uuid
    references auth.users(id)
    on delete set null,

  created_at timestamptz not null default now(),

  constraint loan_payment_amount_positive
    check (amount > 0),

  constraint loan_payment_components_nonnegative
    check (
      principal_amount >= 0
      and interest_amount >= 0
      and fine_amount >= 0
    ),

  constraint loan_payment_components_match
    check (
      amount = principal_amount + interest_amount + fine_amount
    )
);


-- ============================================================
-- LOAN FINES
-- ============================================================

create table public.loan_fines (
  id uuid primary key default gen_random_uuid(),

  loan_id uuid not null
    references public.loans(id)
    on delete restrict,

  installment_id uuid
    references public.loan_installments(id)
    on delete restrict,

  amount numeric(14,2) not null,

  reason text not null,

  days_overdue integer,

  fine_rate numeric(8,4),

  status public.fine_status not null default 'active',

  applied_at timestamptz not null default now(),

  waived_at timestamptz,
  waived_by uuid
    references auth.users(id)
    on delete set null,

  ledger_entry_id uuid unique
    references public.ledger_entries(id)
    on delete restrict,

  created_by uuid
    references auth.users(id)
    on delete set null,

  created_at timestamptz not null default now(),

  constraint loan_fine_amount_positive
    check (amount > 0),

  constraint loan_fine_days_nonnegative
    check (
      days_overdue is null
      or days_overdue >= 0
    ),

  constraint loan_fine_rate_nonnegative
    check (
      fine_rate is null
      or fine_rate >= 0
    )
);


-- ============================================================
-- DIVIDEND RUNS
-- ============================================================

create table public.dividend_runs (
  id uuid primary key default gen_random_uuid(),

  financial_year varchar(20) not null,

  profit_amount numeric(14,2) not null,

  distribution_rate numeric(8,4) not null,

  total_share_base numeric(14,2) not null default 0,

  total_distributable numeric(14,2) not null default 0,

  status public.dividend_run_status not null default 'draft',

  calculated_at timestamptz,
  finalized_at timestamptz,

  created_by uuid
    references auth.users(id)
    on delete set null,

  finalized_by uuid
    references auth.users(id)
    on delete set null,

  created_at timestamptz not null default now(),

  constraint dividend_profit_nonnegative
    check (profit_amount >= 0),

  constraint dividend_rate_nonnegative
    check (distribution_rate >= 0),

  constraint dividend_share_base_nonnegative
    check (total_share_base >= 0),

  constraint dividend_distributable_nonnegative
    check (total_distributable >= 0)
);


-- ============================================================
-- DIVIDEND DISTRIBUTIONS
-- ============================================================

create table public.dividend_distributions (
  id uuid primary key default gen_random_uuid(),

  dividend_run_id uuid not null
    references public.dividend_runs(id)
    on delete restrict,

  member_id uuid not null
    references public.members(id)
    on delete restrict,

  share_base numeric(14,2) not null,

  percentage numeric(8,4) not null,

  gross_amount numeric(14,2) not null,

  adjustment_amount numeric(14,2) not null default 0,

  final_amount numeric(14,2) not null,

  status public.dividend_distribution_status not null default 'pending',

  ledger_entry_id uuid unique
    references public.ledger_entries(id)
    on delete restrict,

  created_at timestamptz not null default now(),

  constraint dividend_distribution_share_nonnegative
    check (share_base >= 0),

  constraint dividend_distribution_percentage_nonnegative
    check (percentage >= 0),

  constraint dividend_distribution_gross_nonnegative
    check (gross_amount >= 0),

  constraint dividend_distribution_final_nonnegative
    check (final_amount >= 0),

  constraint dividend_distribution_unique_member
    unique (dividend_run_id, member_id)
);


-- ============================================================
-- PAYMENT RECEIPTS
-- ============================================================

create sequence public.receipt_number_seq
  as bigint
  start with 100001
  increment by 1;

create table public.payment_receipts (
  id uuid primary key default gen_random_uuid(),

  receipt_number varchar(50) not null unique
    default (
      'REC-' || nextval('public.receipt_number_seq')::text
    ),

  member_id uuid not null
    references public.members(id)
    on delete restrict,

  amount numeric(14,2) not null,

  payment_type public.receipt_payment_type not null,

  payment_date date not null,

  file_key text not null,

  status public.receipt_status not null default 'pending',

  submitted_at timestamptz not null default now(),

  reviewed_at timestamptz,

  reviewed_by uuid
    references auth.users(id)
    on delete set null,

  rejection_reason text,

  ledger_entry_id uuid unique
    references public.ledger_entries(id)
    on delete restrict,

  notes text,

  constraint payment_receipt_amount_positive
    check (amount > 0),

  constraint rejected_receipt_reason
    check (
      status <> 'rejected'
      or rejection_reason is not null
    ),

  constraint approved_receipt_ledger
    check (
      status <> 'approved'
      or ledger_entry_id is not null
    )
);


-- ============================================================
-- DOCUMENTS
-- ============================================================

create table public.documents (
  id uuid primary key default gen_random_uuid(),

  title varchar(200) not null,
  description text,

  document_type varchar(100) not null,

  category_id uuid
    references public.categories(id)
    on delete set null,

  file_key text not null,
  original_filename text not null,

  mime_type varchar(150) not null,
  file_size bigint not null,

  visibility public.document_visibility not null default 'members',

  uploaded_by uuid
    references auth.users(id)
    on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  deleted_at timestamptz,

  constraint document_file_size_positive
    check (file_size > 0)
);


-- ============================================================
-- MEETINGS
-- ============================================================

create table public.meetings (
  id uuid primary key default gen_random_uuid(),

  title varchar(200) not null,
  description text,

  meeting_type public.meeting_type not null,

  scheduled_at timestamptz not null,

  duration_minutes integer,

  meeting_url text,

  status public.meeting_status not null default 'scheduled',

  created_by uuid
    references auth.users(id)
    on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint meeting_duration_positive
    check (
      duration_minutes is null
      or duration_minutes > 0
    )
);


-- ============================================================
-- MEETING NOTIFICATIONS
-- ============================================================

create table public.meeting_notifications (
  id uuid primary key default gen_random_uuid(),

  meeting_id uuid not null
    references public.meetings(id)
    on delete cascade,

  member_id uuid not null
    references public.members(id)
    on delete cascade,

  notification_type public.notification_channel not null,

  sent_at timestamptz,

  read_at timestamptz,

  status public.delivery_status not null default 'pending',

  created_at timestamptz not null default now(),

  constraint meeting_notification_unique
    unique (meeting_id, member_id, notification_type)
);


-- ============================================================
-- NOTIFICATIONS
-- ============================================================

create table public.notifications (
  id uuid primary key default gen_random_uuid(),

  member_id uuid
    references public.members(id)
    on delete cascade,

  type public.notification_type not null,

  title varchar(200) not null,

  message text not null,

  reference_type varchar(100),
  reference_id uuid,

  read_at timestamptz,

  created_at timestamptz not null default now()
);


-- ============================================================
-- NOTIFICATION DELIVERIES
-- ============================================================

create table public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),

  notification_id uuid not null
    references public.notifications(id)
    on delete cascade,

  channel public.notification_channel not null,

  status public.delivery_status not null default 'pending',

  provider_message_id text,

  sent_at timestamptz,

  failed_at timestamptz,

  error_message text,

  created_at timestamptz not null default now(),

  constraint notification_delivery_unique
    unique (notification_id, channel)
);


-- ============================================================
-- MEDIA
-- ============================================================

create table public.media (
  id uuid primary key default gen_random_uuid(),

  title varchar(200) not null,

  description text,

  media_type public.media_type not null,

  external_url text,
  thumbnail_url text,

  visibility public.media_visibility not null default 'members',

  published_at timestamptz,

  created_by uuid
    references auth.users(id)
    on delete set null,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now(),

  constraint media_source_required
    check (
      external_url is not null
      or media_type <> 'external'
    )
);


-- ============================================================
-- PAYMENT SCHEDULES
-- ============================================================

create table public.payment_schedules (
  id uuid primary key default gen_random_uuid(),

  member_id uuid not null
    references public.members(id)
    on delete cascade,

  schedule_type public.schedule_type not null,

  reference_type varchar(100) not null,
  reference_id uuid,

  amount numeric(14,2) not null,

  due_date date not null,

  status public.schedule_status not null default 'pending',

  reminder_sent_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint payment_schedule_amount_positive
    check (amount > 0)
);


-- ============================================================
-- AUDIT LOGS
-- ============================================================

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),

  actor_user_id uuid
    references auth.users(id)
    on delete set null,

  actor_member_id uuid
    references public.members(id)
    on delete set null,

  action varchar(100) not null,

  entity_type varchar(100) not null,

  entity_id uuid,

  old_data jsonb,

  new_data jsonb,

  ip_address inet,

  user_agent text,

  created_at timestamptz not null default now()
);


-- ============================================================
-- SYSTEM SETTINGS
-- ============================================================

create table public.system_settings (
  id uuid primary key default gen_random_uuid(),

  key varchar(100) unique not null,

  value jsonb not null default '{}'::jsonb,

  description text,

  updated_by uuid
    references auth.users(id)
    on delete set null,

  updated_at timestamptz not null default now()
);


-- ============================================================
-- INDEXES
-- ============================================================

-- Members
create index idx_members_status
  on public.members(status);

create index idx_members_auth_user_id
  on public.members(auth_user_id);

-- Profiles
create index idx_member_profiles_member_id
  on public.member_profiles(member_id);

-- Limits
create index idx_member_limits_member_id
  on public.member_limits(member_id);

create index idx_member_limits_effective_dates
  on public.member_limits(member_id, effective_from, effective_until);

-- Benefits
create index idx_member_benefits_member_id
  on public.member_benefits(member_id);

-- Categories
create index idx_categories_type
  on public.categories(category_type);

-- Ledger
create index idx_ledger_member_date
  on public.ledger_entries(member_id, transaction_date desc);

create index idx_ledger_entry_type
  on public.ledger_entries(entry_type);

create index idx_ledger_category
  on public.ledger_entries(category_id);

create index idx_ledger_reference
  on public.ledger_entries(reference_type, reference_id);

-- Monthly deposits
create index idx_monthly_deposits_member
  on public.monthly_deposits(member_id);

create index idx_monthly_deposits_date
  on public.monthly_deposits(payment_date desc);

-- Shares
create index idx_share_contributions_member
  on public.share_contributions(member_id);

create index idx_share_contributions_date
  on public.share_contributions(contribution_date desc);

-- WAFA fund
create index idx_wafa_fund_date
  on public.wafa_fund_transactions(transaction_date desc);

-- Loans
create index idx_loans_member
  on public.loans(member_id);

create index idx_loans_status
  on public.loans(status);

create index idx_loans_member_status
  on public.loans(member_id, status);

-- Installments
create index idx_loan_installments_loan
  on public.loan_installments(loan_id);

create index idx_loan_installments_due_date
  on public.loan_installments(due_date);

create index idx_loan_installments_status
  on public.loan_installments(status);

-- Payments
create index idx_loan_payments_loan
  on public.loan_payments(loan_id);

create index idx_loan_payments_installment
  on public.loan_payments(installment_id);

create index idx_loan_payments_date
  on public.loan_payments(payment_date desc);

-- Fines
create index idx_loan_fines_loan
  on public.loan_fines(loan_id);

create index idx_loan_fines_status
  on public.loan_fines(status);

-- Dividends
create index idx_dividend_runs_year
  on public.dividend_runs(financial_year);

create index idx_dividend_distributions_member
  on public.dividend_distributions(member_id);

create index idx_dividend_distributions_run
  on public.dividend_distributions(dividend_run_id);

-- Receipts
create index idx_payment_receipts_member
  on public.payment_receipts(member_id);

create index idx_payment_receipts_status
  on public.payment_receipts(status);

create index idx_payment_receipts_submitted
  on public.payment_receipts(submitted_at desc);

-- Documents
create index idx_documents_category
  on public.documents(category_id);

create index idx_documents_visibility
  on public.documents(visibility);

create index idx_documents_uploaded_by
  on public.documents(uploaded_by);

-- Meetings
create index idx_meetings_scheduled
  on public.meetings(scheduled_at);

create index idx_meetings_status
  on public.meetings(status);

-- Meeting notifications
create index idx_meeting_notifications_member
  on public.meeting_notifications(member_id);

-- Notifications
create index idx_notifications_member_created
  on public.notifications(member_id, created_at desc);

create index idx_notifications_unread
  on public.notifications(member_id, read_at);

-- Notification deliveries
create index idx_notification_deliveries_status
  on public.notification_deliveries(status);

-- Media
create index idx_media_visibility
  on public.media(visibility);

create index idx_media_published
  on public.media(published_at desc);

-- Payment schedules
create index idx_payment_schedules_member
  on public.payment_schedules(member_id);

create index idx_payment_schedules_due
  on public.payment_schedules(due_date, status);

-- Audit
create index idx_audit_logs_actor
  on public.audit_logs(actor_user_id);

create index idx_audit_logs_entity
  on public.audit_logs(entity_type, entity_id);

create index idx_audit_logs_created
  on public.audit_logs(created_at desc);


-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


create trigger trg_members_updated_at
before update on public.members
for each row execute function public.set_updated_at();

create trigger trg_member_profiles_updated_at
before update on public.member_profiles
for each row execute function public.set_updated_at();

create trigger trg_member_limits_updated_at
before update on public.member_limits
for each row execute function public.set_updated_at();

create trigger trg_member_benefits_updated_at
before update on public.member_benefits
for each row execute function public.set_updated_at();

create trigger trg_categories_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

create trigger trg_loans_updated_at
before update on public.loans
for each row execute function public.set_updated_at();

create trigger trg_loan_installments_updated_at
before update on public.loan_installments
for each row execute function public.set_updated_at();

create trigger trg_documents_updated_at
before update on public.documents
for each row execute function public.set_updated_at();

create trigger trg_meetings_updated_at
before update on public.meetings
for each row execute function public.set_updated_at();

create trigger trg_media_updated_at
before update on public.media
for each row execute function public.set_updated_at();

create trigger trg_payment_schedules_updated_at
before update on public.payment_schedules
for each row execute function public.set_updated_at();

create trigger trg_system_settings_updated_at
before update on public.system_settings
for each row execute function public.set_updated_at();


-- ============================================================
-- BASIC SEED CATEGORIES
-- ============================================================

insert into public.categories
  (name, category_type, description)
values
  ('Monthly Deposit', 'deposit', 'Regular monthly member deposit'),
  ('Additional Share', 'share', 'Additional share capital contribution'),
  ('Loan', 'loan', 'Loan related transaction'),
  ('Loan Payment', 'loan_payment', 'Loan repayment'),
  ('Fine', 'fine', 'Overdue or penalty fine'),
  ('WAFA Fund', 'wafa_fund', 'WAFA central fund'),
  ('Dividend', 'dividend', 'Member profit/dividend distribution'),
  ('Income', 'income', 'Other organizational income'),
  ('Expense', 'expense', 'Operational or organizational expense'),
  ('Other', 'other', 'Miscellaneous transaction')
on conflict (name, category_type) do nothing;


-- ============================================================
-- BASIC SYSTEM SETTINGS
-- ============================================================

insert into public.system_settings
  (key, value, description)
values
  (
    'monthly_deposit_day',
    '{"day": 10}'::jsonb,
    'Default day of month for monthly deposits'
  ),
  (
    'default_currency',
    '{"code": "NPR", "symbol": "Rs."}'::jsonb,
    'WAFA default currency'
  )
on conflict (key) do nothing;


-- ============================================================
-- IMPORTANT
--
-- RLS intentionally not enabled in this migration.
--
-- Final security phase will add:
--
-- 1. RLS on every table
-- 2. Member self-access policies
-- 3. Admin/accountant policies
-- 4. Super-admin policies
-- 5. Storage/R2 authorization
-- 6. RPC/function authorization
-- 7. Financial transaction safeguards
--
-- Do NOT expose this database directly to untrusted clients
-- before the final RLS/security layer is implemented.
-- ============================================================
