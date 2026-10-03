"use client";

import { useState } from "react";
import { Award, CalendarClock, Landmark, Plus, Users } from "lucide-react";
import AdminLayout from "../../components/admin-layout";
import {
  AmountList,
  MeetingRow,
  OverviewAction,
  OverviewPage,
  Panel,
  PanelBody,
  PanelGrid,
  QuickLinkRow,
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
import { getStaffProfile, listIssuedCertificates, listMeetingRecipients, listMeetings, listQuickLinks } from "../../lib/auth";
import { getLedgerOrgTotals } from "../../lib/ledger";

function AdminWorkspace() {
  const [now] = useState(() => Date.now());
  const profile = useLoadable(() => getStaffProfile("admin"));
  const meetings = useLoadable(async () => upcomingMeetings(await listMeetings("admin"), now));
  const people = useLoadable(() => listMeetingRecipients("admin"));
  const certificates = useLoadable(() => listIssuedCertificates("admin"));
  const totals = useLoadable(() => getLedgerOrgTotals("admin"));
  const links = useLoadable(listQuickLinks);

  const name = profile.status === "ready" ? firstName(profile.data.fullName) : "";
  const thisMonth = new Date(now).toISOString().slice(0, 7);

  return (
    <OverviewPage
      eyebrow={todayLabel()}
      title={`${greeting()}${name ? `, ${name}` : ""}.`}
      subtitle="Meetings, members and recognition across WAFA."
      action={<OverviewAction href="/admin/meetings/create" icon={Plus}>New meeting</OverviewAction>}
    >
      <StatGrid>
        <StatCard
          icon={Users}
          tone="green"
          label="Members"
          value={statValue(people, (data) => data.filter((person) => person.role === "member").length)}
          hint={statHint(people, (data) => `${data.filter((person) => person.role !== "member").length} staff accounts`)}
        />
        <StatCard
          icon={CalendarClock}
          tone="blue"
          label="Upcoming meetings"
          href="/admin/meetings"
          value={statValue(meetings, (data) => data.length)}
          hint={statHint(meetings, (data) => (data[0] ? `Next: ${formatDate(data[0].scheduled_at)}` : "None scheduled"))}
        />
        <StatCard
          icon={Award}
          tone="amber"
          label="Certificates issued"
          href="/admin/certificates"
          value={statValue(certificates, (data) => data.length)}
          hint={statHint(certificates, (data) => `${data.filter((cert) => cert.issuedAt.startsWith(thisMonth)).length} this month`)}
        />
        <StatCard
          icon={Landmark}
          tone="purple"
          label="Available balance"
          href="/admin/ledger/totals"
          value={statValue(totals, (data) => formatAmountShort(data.availableBalanceTotal))}
          title={totals.status === "ready" ? formatAmount(totals.data.availableBalanceTotal) : undefined}
          hint={statHint(totals, (data) => `Across ${data.memberCount} members`)}
        />
      </StatGrid>

      <PanelGrid>
        <Panel title="Upcoming meetings" subtitle="What's next on the calendar." href="/admin/meetings">
          <PanelBody state={meetings} isEmpty={(data) => data.length === 0} empty="No upcoming meetings. Schedule one to get started.">
            {(data) => <div className="grid">{data.slice(0, 3).map((meeting) => <MeetingRow key={meeting.id} meeting={meeting} />)}</div>}
          </PanelBody>
        </Panel>
        <Panel title="Savings snapshot" subtitle="Organization totals, all years." href="/admin/ledger/totals" linkLabel="Details">
          <PanelBody state={totals} rows={4} isEmpty={() => false} empty="">
            {(data) => (
              <AmountList
                rows={[
                  ["Share value", data.totals.shareValue],
                  ["Monthly deposit", data.totals.monthlyDeposit],
                  ["Wafa Kosh", data.totals.wafaKosh],
                  ["Interest", data.totals.interest],
                ]}
                total={["Total actual balance", data.totalActualBalance]}
              />
            )}
          </PanelBody>
        </Panel>
      </PanelGrid>

      <PanelGrid>
        <Panel title="Recent certificates" subtitle="The latest recognitions you've issued." href="/admin/certificates">
          <PanelBody state={certificates} isEmpty={(data) => data.length === 0} empty="No certificates issued yet.">
            {(data) =>
              data.slice(0, 3).map((cert) => (
                <div key={cert.id} className="flex items-center gap-3 py-[13px] border-t border-[#edf1ee] first:border-t-0">
                  <span className="grid place-items-center w-[33px] h-[33px] rounded-lg shrink-0 text-[#b56f36] bg-[#f9ebdc]"><Award size={15} /></span>
                  <div className="flex-1 min-w-0">
                    <strong className="block text-[11px] truncate">{cert.title}</strong>
                    <span className="block mt-1 text-[#99a49f] text-[9px] truncate">{cert.recipientName} · {cert.certificateNumber}</span>
                  </div>
                  <span className="shrink-0 text-[#99a49f] text-[10px]">{formatDate(cert.issuedAt)}</span>
                </div>
              ))
            }
          </PanelBody>
        </Panel>
        <Panel title="Quick links" subtitle="Forms and portals shared with the team." href="/admin/links">
          <PanelBody state={links} isEmpty={(data) => data.length === 0} empty="No links shared yet.">
            {(data) => data.slice(0, 3).map((link) => <QuickLinkRow key={link.id} link={link} />)}
          </PanelBody>
        </Panel>
      </PanelGrid>
    </OverviewPage>
  );
}

export default function AdminOverviewPage() {
  return (
    <AdminLayout active="overview">
      <AdminWorkspace />
    </AdminLayout>
  );
}
