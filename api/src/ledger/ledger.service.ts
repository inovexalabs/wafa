import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import NepaliDate from 'nepali-date-converter';
import { SupabaseService } from '../supabase.service';
import { AuditService } from '../audit/audit.service';

type Profile = { id: string; role: string };

type LedgerEntryRow = {
  id: string;
  member_id: string;
  bs_year: number;
  bs_month: number;
  bs_day: number | null;
  ad_transaction_date: string | null;
  share_value: string | number;
  monthly_deposit: string | number;
  wafa_kosh: string | number;
  additional_deposit: string | number;
  interest: string | number;
  fine: string | number;
  total: string | number;
  source: 'manual' | 'auto';
  notes: string | null;
};

type UpsertEntryInput = {
  bsYear: number;
  bsMonth: number;
  bsDay?: number | null;
  shareValue?: number;
  monthlyDeposit?: number;
  wafaKosh?: number;
  additionalDeposit?: number;
  interest?: number;
  fine?: number;
  notes?: string;
};

type UpdateSettingsInput = {
  openingBalance?: number;
  openingBsYear?: number;
  openingBsMonth?: number;
  openingBsDay?: number;
  availableBalance?: number | null;
};

type AutoSyncInput = {
  memberId: string;
  bsYear: number;
  bsMonth: number;
  bsDay?: number | null;
  field: 'monthly_deposit' | 'share_value';
  amount: number;
  monthlyDepositId?: string;
  shareContributionId?: string;
};

const numericFields = [
  'shareValue',
  'monthlyDeposit',
  'wafaKosh',
  'additionalDeposit',
  'interest',
  'fine',
] as const;

function toNumber(value: string | number | null | undefined) {
  return Number(value ?? 0);
}

function adDateFor(bsYear: number, bsMonth: number, bsDay?: number | null) {
  try {
    const date = new NepaliDate(bsYear, bsMonth - 1, bsDay ?? 1);
    return date.toJsDate().toISOString().slice(0, 10);
  } catch {
    return null;
  }
}

function serializeEntry(row: LedgerEntryRow) {
  return {
    id: row.id,
    bsYear: row.bs_year,
    bsMonth: row.bs_month,
    bsDay: row.bs_day,
    adTransactionDate: row.ad_transaction_date,
    shareValue: toNumber(row.share_value),
    monthlyDeposit: toNumber(row.monthly_deposit),
    wafaKosh: toNumber(row.wafa_kosh),
    additionalDeposit: toNumber(row.additional_deposit),
    interest: toNumber(row.interest),
    fine: toNumber(row.fine),
    total: toNumber(row.total),
    source: row.source,
    notes: row.notes,
  };
}

@Injectable()
export class LedgerService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly audit: AuditService,
  ) {}

  async memberIdFor(profile: Profile) {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('members')
      .select('id')
      .eq('auth_user_id', profile.id)
      .maybeSingle();
    if (error)
      throw new InternalServerErrorException(
        'Unable to resolve your member profile.',
      );
    if (!data) throw new BadRequestException('Member record not found.');
    return data.id as string;
  }

  private async requireMember(memberId: string) {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('members')
      .select('id, full_name, member_number, joined_at')
      .eq('id', memberId)
      .maybeSingle();
    if (error)
      throw new InternalServerErrorException('Unable to load this member.');
    if (!data) throw new NotFoundException('Member not found.');
    return data;
  }

  async getSummaryForMember(memberId: string) {
    const client = this.supabase.getAdminClient();
    const member = await this.requireMember(memberId);

    const [
      { data: settings, error: settingsError },
      { data: entries, error: entriesError },
    ] = await Promise.all([
      client
        .from('member_ledger_settings')
        .select(
          'opening_balance, opening_bs_year, opening_bs_month, opening_bs_day, available_balance',
        )
        .eq('member_id', memberId)
        .maybeSingle(),
      client
        .from('savings_ledger_entries')
        .select(
          'share_value, monthly_deposit, wafa_kosh, additional_deposit, interest, fine, total',
        )
        .eq('member_id', memberId),
    ]);

    if (settingsError)
      throw new InternalServerErrorException('Unable to load ledger settings.');
    if (entriesError)
      throw new InternalServerErrorException('Unable to load ledger entries.');

    const openingBalance = toNumber(settings?.opening_balance);
    const rows = entries ?? [];
    const totals = rows.reduce(
      (sum, row) => ({
        shareValue: sum.shareValue + toNumber(row.share_value),
        monthlyDeposit: sum.monthlyDeposit + toNumber(row.monthly_deposit),
        wafaKosh: sum.wafaKosh + toNumber(row.wafa_kosh),
        additionalDeposit:
          sum.additionalDeposit + toNumber(row.additional_deposit),
        interest: sum.interest + toNumber(row.interest),
        fine: sum.fine + toNumber(row.fine),
        total: sum.total + toNumber(row.total),
      }),
      {
        shareValue: 0,
        monthlyDeposit: 0,
        wafaKosh: 0,
        additionalDeposit: 0,
        interest: 0,
        fine: 0,
        total: 0,
      },
    );

    const totalActualBalance = openingBalance + totals.total;
    const availableBalance =
      settings?.available_balance != null
        ? toNumber(settings.available_balance)
        : totalActualBalance;

    return {
      memberId,
      memberName: member.full_name,
      memberNumber: member.member_number,
      joinedAt: member.joined_at,
      openingBalance,
      openingBsYear: settings?.opening_bs_year ?? null,
      openingBsMonth: settings?.opening_bs_month ?? null,
      openingBsDay: settings?.opening_bs_day ?? null,
      totals,
      totalActualBalance,
      availableBalance,
      availableBalanceIsOverride: settings?.available_balance != null,
    };
  }

  async listEntriesForMember(memberId: string, bsYear?: number) {
    await this.requireMember(memberId);
    const client = this.supabase.getAdminClient();
    let query = client
      .from('savings_ledger_entries')
      .select(
        'id, member_id, bs_year, bs_month, bs_day, ad_transaction_date, share_value, monthly_deposit, wafa_kosh, additional_deposit, interest, fine, total, source, notes',
      )
      .eq('member_id', memberId)
      .order('bs_year', { ascending: true })
      .order('bs_month', { ascending: true });
    if (bsYear) query = query.eq('bs_year', bsYear);

    const { data, error } = await query;
    if (error)
      throw new InternalServerErrorException('Unable to load ledger entries.');
    return ((data as LedgerEntryRow[] | null) ?? []).map(serializeEntry);
  }

  async upsertEntry(
    profile: Profile,
    memberId: string,
    input: UpsertEntryInput,
  ) {
    await this.requireMember(memberId);
    if (!input.bsYear || !input.bsMonth)
      throw new BadRequestException('BS year and month are required.');
    if (input.bsMonth < 1 || input.bsMonth > 12)
      throw new BadRequestException('BS month must be between 1 and 12.');

    for (const field of numericFields) {
      const value = input[field];
      if (value !== undefined && (!Number.isFinite(value) || value < 0))
        throw new BadRequestException(
          `${field} must be a non-negative number.`,
        );
    }

    const client = this.supabase.getAdminClient();
    const { data: existing, error: fetchError } = await client
      .from('savings_ledger_entries')
      .select('id')
      .eq('member_id', memberId)
      .eq('bs_year', input.bsYear)
      .eq('bs_month', input.bsMonth)
      .maybeSingle();
    if (fetchError)
      throw new InternalServerErrorException('Unable to load this ledger row.');

    const payload = {
      member_id: memberId,
      bs_year: input.bsYear,
      bs_month: input.bsMonth,
      bs_day: input.bsDay ?? null,
      ad_transaction_date: adDateFor(input.bsYear, input.bsMonth, input.bsDay),
      share_value: input.shareValue ?? 0,
      monthly_deposit: input.monthlyDeposit ?? 0,
      wafa_kosh: input.wafaKosh ?? 0,
      additional_deposit: input.additionalDeposit ?? 0,
      interest: input.interest ?? 0,
      fine: input.fine ?? 0,
      source: 'manual' as const,
      notes: input.notes?.trim() || null,
      updated_at: new Date().toISOString(),
    };

    const query = existing
      ? client
          .from('savings_ledger_entries')
          .update(payload)
          .eq('id', existing.id)
      : client
          .from('savings_ledger_entries')
          .insert({ ...payload, created_by: profile.id });

    const { data, error } = await query
      .select(
        'id, member_id, bs_year, bs_month, bs_day, ad_transaction_date, share_value, monthly_deposit, wafa_kosh, additional_deposit, interest, fine, total, source, notes',
      )
      .single();
    if (error) throw new BadRequestException(error.message);

    await this.audit.log({
      actor: { userId: profile.id },
      action: existing ? 'ledger.entry_updated' : 'ledger.entry_created',
      entityType: 'savings_ledger_entry',
      entityId: data.id,
      newData: payload,
    });

    return serializeEntry(data);
  }

  async updateSettings(
    profile: Profile,
    memberId: string,
    input: UpdateSettingsInput,
  ) {
    await this.requireMember(memberId);
    if (
      input.openingBalance !== undefined &&
      (!Number.isFinite(input.openingBalance) || input.openingBalance < 0)
    )
      throw new BadRequestException(
        'Opening balance must be a non-negative number.',
      );
    if (
      input.availableBalance !== undefined &&
      input.availableBalance !== null &&
      (!Number.isFinite(input.availableBalance) || input.availableBalance < 0)
    )
      throw new BadRequestException(
        'Available balance must be a non-negative number.',
      );

    const client = this.supabase.getAdminClient();
    const payload: Record<string, unknown> = {
      member_id: memberId,
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    };
    if (input.openingBalance !== undefined)
      payload.opening_balance = input.openingBalance;
    if (input.openingBsYear !== undefined)
      payload.opening_bs_year = input.openingBsYear;
    if (input.openingBsMonth !== undefined)
      payload.opening_bs_month = input.openingBsMonth;
    if (input.openingBsDay !== undefined)
      payload.opening_bs_day = input.openingBsDay;
    if (input.availableBalance !== undefined)
      payload.available_balance = input.availableBalance;

    const { error } = await client
      .from('member_ledger_settings')
      .upsert(payload, { onConflict: 'member_id' });
    if (error) throw new BadRequestException(error.message);

    await this.audit.log({
      actor: { userId: profile.id },
      action: 'ledger.settings_updated',
      entityType: 'member_ledger_settings',
      entityId: memberId,
      newData: payload,
    });

    return this.getSummaryForMember(memberId);
  }

  async getOrgTotals(bsYear?: number) {
    const client = this.supabase.getAdminClient();
    const [
      { data: allEntries, error: entriesError },
      { data: settings, error: settingsError },
      { count: memberCount, error: memberCountError },
    ] = await Promise.all([
      client
        .from('savings_ledger_entries')
        .select(
          'member_id, bs_year, share_value, monthly_deposit, wafa_kosh, additional_deposit, interest, fine, total',
        ),
      client
        .from('member_ledger_settings')
        .select('member_id, opening_balance, available_balance'),
      client
        .from('members')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active'),
    ]);
    if (entriesError || settingsError || memberCountError)
      throw new InternalServerErrorException(
        'Unable to load organization totals.',
      );

    const rows = allEntries ?? [];
    const settingsRows = settings ?? [];

    const zeroTotals = {
      shareValue: 0,
      monthlyDeposit: 0,
      wafaKosh: 0,
      additionalDeposit: 0,
      interest: 0,
      fine: 0,
      total: 0,
    };
    const sumFields = (list: typeof rows) =>
      list.reduce(
        (sum, row) => ({
          shareValue: sum.shareValue + toNumber(row.share_value),
          monthlyDeposit: sum.monthlyDeposit + toNumber(row.monthly_deposit),
          wafaKosh: sum.wafaKosh + toNumber(row.wafa_kosh),
          additionalDeposit:
            sum.additionalDeposit + toNumber(row.additional_deposit),
          interest: sum.interest + toNumber(row.interest),
          fine: sum.fine + toNumber(row.fine),
          total: sum.total + toNumber(row.total),
        }),
        zeroTotals,
      );

    const allTimeTotals = sumFields(rows);
    const totals = bsYear
      ? sumFields(rows.filter((row) => row.bs_year === bsYear))
      : allTimeTotals;

    const openingBalanceTotal = settingsRows.reduce(
      (sum, row) => sum + toNumber(row.opening_balance),
      0,
    );

    const perMemberTotal = new Map<string, number>();
    for (const row of rows) {
      perMemberTotal.set(
        row.member_id,
        (perMemberTotal.get(row.member_id) ?? 0) + toNumber(row.total),
      );
    }
    const openingByMember = new Map(
      settingsRows.map((row) => [row.member_id, toNumber(row.opening_balance)]),
    );
    const overrideByMember = new Map(
      settingsRows
        .filter((row) => row.available_balance != null)
        .map((row) => [row.member_id, toNumber(row.available_balance)]),
    );
    const memberIds = new Set([
      ...openingByMember.keys(),
      ...perMemberTotal.keys(),
    ]);
    let availableBalanceTotal = 0;
    for (const id of memberIds) {
      const actual = (openingByMember.get(id) ?? 0) + (perMemberTotal.get(id) ?? 0);
      availableBalanceTotal += overrideByMember.get(id) ?? actual;
    }

    return {
      memberCount: memberCount ?? 0,
      membersWithLedgerActivity: memberIds.size,
      bsYear: bsYear ?? null,
      openingBalanceTotal,
      totals,
      totalActualBalance: openingBalanceTotal + allTimeTotals.total,
      availableBalanceTotal,
    };
  }

  /**
   * Called from other flows (e.g. receipt approval) when a monthly deposit
   * or share contribution is recorded, so the ledger row for that BS month
   * stays in sync without the accountant re-entering it by hand.
   */
  async syncAutoEntry(input: AutoSyncInput) {
    const client = this.supabase.getAdminClient();
    const { data: existing, error: fetchError } = await client
      .from('savings_ledger_entries')
      .select('id, monthly_deposit_id, share_contribution_id')
      .eq('member_id', input.memberId)
      .eq('bs_year', input.bsYear)
      .eq('bs_month', input.bsMonth)
      .maybeSingle();
    if (fetchError) return;

    const columnField =
      input.field === 'monthly_deposit' ? 'monthly_deposit' : 'share_value';

    if (!existing) {
      await client.from('savings_ledger_entries').insert({
        member_id: input.memberId,
        bs_year: input.bsYear,
        bs_month: input.bsMonth,
        bs_day: input.bsDay ?? null,
        ad_transaction_date: adDateFor(
          input.bsYear,
          input.bsMonth,
          input.bsDay,
        ),
        [columnField]: input.amount,
        monthly_deposit_id: input.monthlyDepositId ?? null,
        share_contribution_id: input.shareContributionId ?? null,
        source: 'auto',
      });
      return;
    }

    await client
      .from('savings_ledger_entries')
      .update({
        [columnField]: input.amount,
        monthly_deposit_id:
          input.monthlyDepositId ?? existing.monthly_deposit_id,
        share_contribution_id:
          input.shareContributionId ?? existing.share_contribution_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
  }
}
