"use client";

import { FormEvent, useState } from "react";
import { CircleAlert, Command, IdCard, Landmark, Receipt as ReceiptIcon } from "lucide-react";
import SuperadminLayout from "../../components/superadmin-layout";
import {
  MeetingRow,
  OverviewPage,
  Panel,
  PanelBody,
  PanelGrid,
  ReceiptRow,
  StatCard,
  StatGrid,
  firstName,
  formatAmount,
  formatAmountShort,
  formatRelativeTime,
  greeting,
  statHint,
  statValue,
  todayLabel,
  upcomingMeetings,
  useLoadable,
} from "../../components/overview";
import { createUser, getStaffProfile, listAuditLogs, listMeetingRecipients, listMeetings, listMemberDirectory, listReceiptsForReview } from "../../lib/auth";
import { getLedgerOrgTotals } from "../../lib/ledger";
import { actionLabels, actionTone, actorLabel } from "../../lib/audit-actions";

type Role = "admin" | "accountant" | "member";

const roleLabels: Record<Role, string> = { admin: "Admin", accountant: "Accountant", member: "Member" };

const saFormInput = "w-full h-[42px] mt-[7px] border border-line rounded-md px-[11px] outline-none text-[#2d4037] bg-white text-xs focus:border-[#2b7358] focus:shadow-[0_0_0_3px_#2b73581a]";
const saFormLabel = "block text-[#53665c] text-[11px] font-bold";

function todayInput() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

const emptyUserForm = () => ({ userId: "", email: "", password: "", fullName: "", memberNumber: "", phone: "", joinedAt: todayInput() });

function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase() || "?";
}

function CreateUserPanel({ onCreated }: { onCreated: () => void }) {
  const [role, setRole] = useState<Role>("admin");
  const [form, setForm] = useState(emptyUserForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setIsSubmitting(true);
    try {
      await createUser({ ...form, role, ...(role === "member" ? {} : { fullName: undefined, memberNumber: undefined, phone: undefined, joinedAt: undefined }) });
      setMessage(`${roleLabels[role]} ${form.userId} was created successfully.`);
      setForm(emptyUserForm());
      onCreated();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to create this user.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="p-[25px] border border-[#e0e9e3] rounded-[10px] bg-white max-[500px]:px-4 max-[500px]:py-[19px]">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="m-0 font-display font-bold text-[23px]">Create a user</h2>
          <p className="my-[6px] text-[#8a9892] text-[11px]">Give someone access to the WAFA workspace.</p>
        </div>
        <span className="grid place-items-center w-[34px] h-[34px] rounded-[9px] text-[#236950] bg-[#e5f4e6]"><Command size={16} /></span>
      </div>
      <div className="flex gap-[22px] my-6 mb-5 border-b border-[#edf1ee]">
        {(["admin", "accountant", "member"] as Role[]).map((item) => (
          <button
            key={item}
            className={
              "border-0 border-b-2 pb-[11px] bg-transparent cursor-pointer text-[11px] " +
              (role === item ? "border-[#287257] text-[#24634e] font-bold" : "border-transparent text-[#9aa69f]")
            }
            onClick={() => { setRole(item); setError(""); setMessage(""); }}
          >
            {roleLabels[item]}
          </button>
        ))}
      </div>
      <form onSubmit={submit} className="grid gap-[15px]">
        <div className="grid grid-cols-2 gap-[14px] max-[500px]:grid-cols-1">
          <label className={saFormLabel}>User ID<input className={saFormInput} value={form.userId} onChange={(event) => updateField("userId", event.target.value)} placeholder="e.g. jane.smith" required /></label>
          <label className={saFormLabel}>Email address<input className={saFormInput} type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} placeholder="name@company.com" required /></label>
        </div>
        {role === "member" && (
          <div className="grid grid-cols-2 gap-[14px] max-[500px]:grid-cols-1">
            <label className={saFormLabel}>Full name<input className={saFormInput} value={form.fullName} onChange={(event) => updateField("fullName", event.target.value)} placeholder="Jane Smith" required /></label>
            <label className={saFormLabel}>Member number<input className={saFormInput} value={form.memberNumber} onChange={(event) => updateField("memberNumber", event.target.value)} placeholder="WFA-00042" required /></label>
          </div>
        )}
        <label className={saFormLabel}>Temporary password<input className={saFormInput} type="password" value={form.password} onChange={(event) => updateField("password", event.target.value)} placeholder="At least 8 characters" minLength={8} required /></label>
        {role === "member" && (
          <div className="grid grid-cols-2 gap-[14px] max-[500px]:grid-cols-1">
            <label className={saFormLabel}>Date of joining<input className={saFormInput} type="date" value={form.joinedAt} max={todayInput()} onChange={(event) => updateField("joinedAt", event.target.value)} required /></label>
            <label className={saFormLabel}>Phone <span className="text-[#9aa8a1] text-[10px] font-normal">Optional</span><input className={saFormInput} value={form.phone} onChange={(event) => updateField("phone", event.target.value)} placeholder="+977 ..." /></label>
          </div>
        )}
        {error && <p className="m-0 text-[11px] text-[#ae4d44]" role="alert">{error}</p>}
        {message && <p className="m-0 text-[11px] text-[#38805d]" role="status">{message}</p>}
        <button className="flex justify-center gap-3 border-0 rounded-md p-[13px] text-white bg-brand cursor-pointer text-xs font-bold disabled:opacity-65 disabled:cursor-wait" disabled={isSubmitting}>{isSubmitting ? "Creating user..." : `Create ${roleLabels[role].toLowerCase()}`} <span>→</span></button>
      </form>
    </section>
  );
}

function SuperadminWorkspace() {
  const [now] = useState(() => Date.now());
  // Bumped after a user is created so the people counts and activity feed catch up.
  const [refreshKey, setRefreshKey] = useState(0);
  const profile = useLoadable(() => getStaffProfile("superadmin"));
  const people = useLoadable(() => listMeetingRecipients("superadmin"), [refreshKey]);
  const activity = useLoadable(() => listAuditLogs({ limit: 6 }), [refreshKey]);
  const directory = useLoadable(listMemberDirectory, [refreshKey]);
  const pending = useLoadable(() => listReceiptsForReview("superadmin", { status: "pending" }));
  const totals = useLoadable(() => getLedgerOrgTotals("superadmin"));
  const meetings = useLoadable(async () => upcomingMeetings(await listMeetings("superadmin"), now));

  const name = profile.status === "ready" ? firstName(profile.data.fullName) : "";

  return (
    <OverviewPage eyebrow={todayLabel()} title={`${greeting()}${name ? `, ${name}` : ""}.`} subtitle="Manage access, roles, and the people who keep WAFA moving.">
      <StatGrid>
        <StatCard
          icon={IdCard}
          tone="green"
          label="Members"
          href="/superadmin/members"
          value={statValue(people, (data) => data.filter((person) => person.role === "member").length)}
          hint={statHint(people, (data) => `${data.filter((person) => person.role !== "member").length} staff accounts`)}
        />
        <StatCard
          icon={ReceiptIcon}
          tone="amber"
          label="Pending receipts"
          href="/superadmin/receipts"
          value={statValue(pending, (data) => data.length)}
          hint={statHint(pending, (data) => (data.length ? `${formatAmount(data.reduce((sum, receipt) => sum + receipt.amount, 0))} awaiting review` : "All caught up"))}
        />
        <StatCard
          icon={CircleAlert}
          tone="red"
          label="Missing documents"
          href="/superadmin/members"
          value={statValue(directory, (data) => data.filter((member) => member.missingRequired.length > 0).length)}
          hint={statHint(directory, (data) => `of ${data.length} members`)}
        />
        <StatCard
          icon={Landmark}
          tone="purple"
          label="Available balance"
          href="/superadmin/ledger/totals"
          value={statValue(totals, (data) => formatAmountShort(data.availableBalanceTotal))}
          title={totals.status === "ready" ? formatAmount(totals.data.availableBalanceTotal) : undefined}
          hint={statHint(totals, (data) => `Across ${data.memberCount} members`)}
        />
      </StatGrid>

      <div className="grid grid-cols-[1.3fr_.7fr] gap-[18px] mt-5 max-[900px]:grid-cols-1">
        <CreateUserPanel onCreated={() => setRefreshKey((key) => key + 1)} />
        <Panel title="Recent activity" subtitle="Sign-ins, changes and new accounts." href="/superadmin/audit" linkLabel="Activity log">
          <PanelBody state={activity} rows={5} isEmpty={(data) => data.items.length === 0} empty="No activity recorded yet.">
            {(data) =>
              data.items.map((entry) => (
                <div key={entry.id} className="flex items-center gap-[10px] py-[11px] border-t border-[#edf1ee] first:border-t-0">
                  <span className="grid place-items-center shrink-0 w-[31px] h-[31px] rounded-full text-[#2d7257] bg-[#e4f2e5] text-[9px] font-bold">{initialsFor(actorLabel(entry))}</span>
                  <div className="flex-1 min-w-0">
                    <strong className="block text-[11px] truncate">{actorLabel(entry)}</strong>
                    <span className="block mt-[3px] text-[#9aa69f] text-[9px]">{formatRelativeTime(entry.created_at)}</span>
                  </div>
                  <span className={"shrink-0 px-2 py-0.5 rounded-full text-[9px] font-bold " + (actionTone[entry.action] ?? "text-[#6b7a72] bg-[#f1f3f1]")}>
                    {actionLabels[entry.action] ?? entry.action}
                  </span>
                </div>
              ))
            }
          </PanelBody>
        </Panel>
      </div>

      <PanelGrid>
        <Panel title="Upcoming meetings" subtitle="What's next on the calendar." href="/superadmin/meetings">
          <PanelBody state={meetings} isEmpty={(data) => data.length === 0} empty="No upcoming meetings right now.">
            {(data) => <div className="grid">{data.slice(0, 3).map((meeting) => <MeetingRow key={meeting.id} meeting={meeting} />)}</div>}
          </PanelBody>
        </Panel>
        <Panel title="Receipts to review" subtitle="Oldest submissions first." href="/superadmin/receipts" linkLabel="Review all">
          <PanelBody state={pending} isEmpty={(data) => data.length === 0} empty="No receipts waiting for review.">
            {(data) =>
              data
                .slice()
                .sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime())
                .slice(0, 3)
                .map((receipt) => <ReceiptRow key={receipt.id} receipt={receipt} />)
            }
          </PanelBody>
        </Panel>
      </PanelGrid>
    </OverviewPage>
  );
}

export default function SuperadminDashboard() {
  return (
    <SuperadminLayout active="overview">
      <SuperadminWorkspace />
    </SuperadminLayout>
  );
}
