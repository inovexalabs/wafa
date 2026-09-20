import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../supabase.service';

type Profile = { id: string; role: string };

@Injectable()
export class PaymentsService {
  constructor(private readonly supabase: SupabaseService) {}

  private async memberIdFor(profile: Profile) {
    const { data, error } = await this.supabase.getAdminClient().from('members').select('id').eq('auth_user_id', profile.id).maybeSingle();
    if (error) throw new InternalServerErrorException('Unable to resolve your member profile.');
    if (!data) throw new BadRequestException('Member record not found.');
    return data.id as string;
  }

  async getOverviewForMember(profile: Profile) {
    const memberId = await this.memberIdFor(profile);
    const client = this.supabase.getAdminClient();

    const [depositsResult, contributionsResult, schedulesResult] = await Promise.all([
      client.from('monthly_deposits')
        .select('id, amount, period_year, period_month, payment_date, notes')
        .eq('member_id', memberId).order('payment_date', { ascending: false }),
      client.from('share_contributions')
        .select('id, amount, contribution_date, notes')
        .eq('member_id', memberId).order('contribution_date', { ascending: false }),
      client.from('payment_schedules')
        .select('id, schedule_type, amount, due_date, status')
        .eq('member_id', memberId).order('due_date', { ascending: false }),
    ]);

    if (depositsResult.error) throw new InternalServerErrorException('Unable to load your monthly deposits.');
    if (contributionsResult.error) throw new InternalServerErrorException('Unable to load your share contributions.');
    if (schedulesResult.error) throw new InternalServerErrorException('Unable to load your payment schedule.');

    const deposits = depositsResult.data ?? [];
    const contributions = contributionsResult.data ?? [];
    const schedules = schedulesResult.data ?? [];

    const paidHistory = [
      ...deposits.map((deposit) => ({
        id: deposit.id,
        label: 'Monthly deposit',
        period: `${monthName(deposit.period_month)} ${deposit.period_year}`,
        amount: Number(deposit.amount),
        date: deposit.payment_date as string,
        state: 'paid' as const,
      })),
      ...contributions.map((contribution) => ({
        id: contribution.id,
        label: 'Share contribution',
        period: contribution.notes ?? 'Additional share',
        amount: Number(contribution.amount),
        date: contribution.contribution_date as string,
        state: 'paid' as const,
      })),
    ];

    const dueHistory = schedules
      .filter((schedule) => schedule.status === 'pending' || schedule.status === 'overdue')
      .map((schedule) => ({
        id: schedule.id,
        label: scheduleLabel(schedule.schedule_type),
        period: schedule.due_date as string,
        amount: Number(schedule.amount),
        date: schedule.due_date as string,
        state: (schedule.status === 'overdue' ? 'overdue' : 'due') as 'due' | 'overdue',
      }));

    const history = [...dueHistory, ...paidHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const totalContributions = paidHistory.reduce((sum, entry) => sum + entry.amount, 0);
    const currentBalance = dueHistory.reduce((sum, entry) => sum + entry.amount, 0);

    return {
      currentBalance,
      totalContributions,
      duePaymentsCount: dueHistory.length,
      history,
    };
  }
}

function monthName(month: number) {
  return new Date(2000, month - 1, 1).toLocaleDateString(undefined, { month: 'long' });
}

function scheduleLabel(scheduleType: string) {
  if (scheduleType === 'monthly_deposit') return 'Monthly deposit';
  if (scheduleType === 'loan_installment') return 'Loan installment';
  return 'Payment';
}
