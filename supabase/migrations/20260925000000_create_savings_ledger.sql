-- ============================================================
-- WAFA — Personal savings ledger (accounting module)
--
-- Mirrors the finance department's spreadsheet: a per-member,
-- per Bikram-Sambat-month record of share value, monthly deposit,
-- Wafa Kosh, additional deposit, interest, and fine, plus a
-- one-time opening balance / manual available-balance override.
--
-- NOTE: matching the rest of this schema, no RLS policies are
-- defined — access control lives entirely in the Nest API.
-- ============================================================

create table public.member_ledger_settings (
  member_id uuid primary key
    references public.members(id)
    on delete cascade,

  opening_balance numeric(14,2) not null default 0,

  opening_bs_year smallint,
  opening_bs_month smallint
    check (opening_bs_month is null or opening_bs_month between 1 and 12),
  opening_bs_day smallint,

  available_balance numeric(14,2),

  updated_by uuid
    references auth.users(id)
    on delete set null,

  updated_at timestamptz not null default now()
);


create table public.savings_ledger_entries (
  id uuid primary key default gen_random_uuid(),

  member_id uuid not null
    references public.members(id)
    on delete restrict,

  bs_year smallint not null,
  bs_month smallint not null
    check (bs_month between 1 and 12),
  bs_day smallint,

  ad_transaction_date date,

  share_value numeric(14,2) not null default 0,
  monthly_deposit numeric(14,2) not null default 0,
  wafa_kosh numeric(14,2) not null default 0,
  additional_deposit numeric(14,2) not null default 0,
  interest numeric(14,2) not null default 0,
  fine numeric(14,2) not null default 0,

  total numeric(14,2) generated always as (
    share_value + monthly_deposit + wafa_kosh + additional_deposit + interest + fine
  ) stored,

  monthly_deposit_id uuid
    references public.monthly_deposits(id)
    on delete set null,

  share_contribution_id uuid
    references public.share_contributions(id)
    on delete set null,

  source varchar(20) not null default 'manual'
    constraint savings_ledger_source_check
      check (source in ('manual', 'auto')),

  notes text,

  created_by uuid
    references auth.users(id)
    on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint savings_ledger_unique_period
    unique (member_id, bs_year, bs_month),

  constraint savings_ledger_amounts_nonnegative
    check (
      share_value >= 0
      and monthly_deposit >= 0
      and wafa_kosh >= 0
      and additional_deposit >= 0
      and interest >= 0
      and fine >= 0
    )
);

create index idx_savings_ledger_member_period
  on public.savings_ledger_entries(member_id, bs_year, bs_month);

create index idx_savings_ledger_ad_date
  on public.savings_ledger_entries(ad_transaction_date);
