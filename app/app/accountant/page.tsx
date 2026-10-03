"use client";

import { useState } from "react";
import { BookOpenCheck, CalendarClock, Landmark, Receipt as ReceiptIcon } from "lucide-react";
import AccountantLayout from "../../components/accountant-layout";
import {
  AmountList,
  MeetingRow,
  OverviewAction,
  OverviewPage,
  Panel,
  PanelBody,
  PanelGrid,
  QuickLinkRow,
  ReceiptRow,
  StatCard,
  StatGrid,
  firstName,
  formatAmount,
  formatAmountShort,
  formatDate,
  greeting,
  statHint,
  statValue,
  todayLabel,
  upcomingMeetings,
  useLoadable,
} from "../../components/overview";
import { getStaffProfile, listMeetings, listQuickLinks, listReceiptsForReview } from "../../lib/auth";
import { getLedgerOrgTotals } from "../../lib/ledger";
import { currentBsDate } from "../../lib/bs-date";

function AccountantWorkspace() {
  const [now] = useState(() => Date.now());
  const [bsYear] = useState(() => currentBsDate().year);
  const profile = useLoadable(() => getStaffProfile("accountant"));
  const pending = useLoadable(() => listReceiptsForReview("accountant", { status: "pending" }));
  const allTime = useLoadable(() => getLedgerOrgTotals("accountant"));
  const thisYear = useLoadable(() => getLedgerOrgTotals("accountant", bsYear));
  const meetings = useLoadable(async () => upcomingMeetings(await listMeetings("accountant"), now));
  const links = useLoadable(listQuickLinks);

  const name = profile.status === "ready" ? firstName(profile.data.fullName) : "";

  return (
    <OverviewPage
      eyebrow={todayLabel()}
      title={`${greeting()}${name ? `, ${name}` : ""}.`}
      subtitle="Receipts, savings and balances at a glance."
      action={<OverviewAction href="/accountant/receipts" icon={ReceiptIcon}>Review receipts</OverviewAction>}
    >
      <StatGrid>
        <StatCard
          icon={ReceiptIcon}
          tone="amber"
          label="Pending receipts"
          href="/accountant/receipts"
          value={statValue(pending, (data) => data.length)}
          hint={statHint(pending, (data) => (data.length ? `${formatAmount(data.reduce((sum, receipt) => sum + receipt.amount, 0))} awaiting review` : "All caught up"))}
        />
        <StatCard
          icon={Landmark}
          tone="green"
          label="Available balance"
          href="/accountant/ledger/totals"
          value={statValue(allTime, (data) => formatAmountShort(data.availableBalanceTotal))}
          title={allTime.status === "ready" ? formatAmount(allTime.data.availableBalanceTotal) : undefined}
          hint={statHint(allTime, (data) => `Across ${data.memberCount} members`)}
        />
        <StatCard
          icon={BookOpenCheck}
          tone="blue"
          label={`Recorded in ${bsYear}`}
          href="/accountant/ledger"
          value={statValue(thisYear, (data) => formatAmountShort(data.totals.total))}
          title={thisYear.status === "ready" ? formatAmount(thisYear.data.totals.total) : undefined}
          hint={statHint(thisYear, (data) => `${data.membersWithLedgerActivity} of ${data.memberCount} members have entries`)}
        />
        <StatCard
          icon={CalendarClock}
          tone="purple"
          label="Upcoming meetings"
          href="/accountant/meetings"
          value={statValue(meetings, (data) => data.length)}
          hint={statHint(meetings, (data) => (data[0] ? `Next: ${formatDate(data[0].scheduled_at)}` : "None scheduled"))}
        />
      </StatGrid>

      <PanelGrid>
        <Panel title="Receipts to review" subtitle="Oldest submissions are waiting longest." href="/accountant/receipts" linkLabel="Review all">
          <PanelBody state={pending} rows={4} isEmpty={(data) => data.length === 0} empty="No receipts waiting for review.">
            {(data) =>
              data
                .slice()
                .sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime())
                .slice(0, 4)
                .map((receipt) => <ReceiptRow key={receipt.id} receipt={receipt} />)
            }
          </PanelBody>
        </Panel>
        <Panel title={`${bsYear} breakdown`} subtitle="Every member's ledger rows this BS year." href="/accountant/ledger/totals" linkLabel="Details">
          <PanelBody state={thisYear} rows={4} isEmpty={() => false} empty="">
            {(data) => (
              <AmountList
                rows={[
                  ["Share value", data.totals.shareValue],
                  ["Monthly deposit", data.totals.monthlyDeposit],
                  ["Wafa Kosh", data.totals.wafaKosh],
                  ["Additional deposit", data.totals.additionalDeposit],
                  ["Interest", data.totals.interest],
                  ["Fine", data.totals.fine],
                ]}
                total={[`Recorded in ${bsYear}`, data.totals.total]}
              />
            )}
          </PanelBody>
        </Panel>
      </PanelGrid>

      <PanelGrid>
        <Panel title="Upcoming meetings" subtitle="Stay prepared for what's next." href="/accountant/meetings">
          <PanelBody state={meetings} isEmpty={(data) => data.length === 0} empty="No upcoming meetings right now.">
            {(data) => <div className="grid">{data.slice(0, 3).map((meeting) => <MeetingRow key={meeting.id} meeting={meeting} />)}</div>}
          </PanelBody>
        </Panel>
        <Panel title="Quick links" subtitle="Forms and portals shared with you." href="/accountant/links">
          <PanelBody state={links} isEmpty={(data) => data.length === 0} empty="No links shared with you yet.">
            {(data) => data.slice(0, 3).map((link) => <QuickLinkRow key={link.id} link={link} />)}
          </PanelBody>
        </Panel>
      </PanelGrid>
    </OverviewPage>
  );
}

export default function AccountantDashboard() {
  return (
    <AccountantLayout active="overview">
      <AccountantWorkspace />
    </AccountantLayout>
  );
}
