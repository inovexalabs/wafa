"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { BookOpenCheck } from "lucide-react";
import {
  LedgerEntry,
  LedgerMember,
  LedgerStaffRole,
  LedgerSummary,
  getLedgerSummary,
  getMyLedgerSummary,
  listLedgerEntries,
  listLedgerMembers,
  listMyLedgerEntries,
  updateLedgerSettings,
  upsertLedgerEntry,
} from "../lib/ledger";
import { bsDayOptions, bsMonthLabel, bsMonthNames, currentBsDate } from "../lib/bs-date";

type Role = "member" | LedgerStaffRole;

function formatAmount(amount: number) {
  return `Rs. ${amount.toLocaleString()}`;
}

function formatJoinedAt(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

type EntryFormState = {
  bsMonth: number;
  bsDay: number | "";
  shareValue: number | "";
  monthlyDeposit: number | "";
  wafaKosh: number | "";
  additionalDeposit: number | "";
  interest: number | "";
  fine: number | "";
  notes: string;
};

const emptyEntryForm: EntryFormState = {
  bsMonth: 1,
  bsDay: "",
  shareValue: "",
  monthlyDeposit: "",
  wafaKosh: "",
  additionalDeposit: "",
  interest: "",
  fine: "",
  notes: "",
};

function EntryForm({
  role,
  memberId,
  bsYear,
  onSaved,
}: {
  role: LedgerStaffRole;
  memberId: string;
  bsYear: number;
  onSaved: () => void;
}) {
  const [form, setForm] = useState(emptyEntryForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fieldInput = "block w-full h-[38px] mt-1 border border-line rounded-md px-2.5 outline-none text-[#2d4037] bg-white text-xs";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      await upsertLedgerEntry(role, memberId, {
        bsYear,
        bsMonth: form.bsMonth,
        bsDay: form.bsDay === "" ? undefined : Number(form.bsDay),
        shareValue: form.shareValue === "" ? 0 : Number(form.shareValue),
        monthlyDeposit: form.monthlyDeposit === "" ? 0 : Number(form.monthlyDeposit),
        wafaKosh: form.wafaKosh === "" ? 0 : Number(form.wafaKosh),
        additionalDeposit: form.additionalDeposit === "" ? 0 : Number(form.additionalDeposit),
        interest: form.interest === "" ? 0 : Number(form.interest),
        fine: form.fine === "" ? 0 : Number(form.fine),
        notes: form.notes || undefined,
      });
      setForm(emptyEntryForm);
      onSaved();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save this ledger row.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="p-5 border border-[#e1e9e4] rounded-[10px] bg-white grid grid-cols-4 gap-3 max-[700px]:grid-cols-2">
      <label className="text-[#53665c] text-[11px] font-bold">
        Month ({bsYear})
        <select className={fieldInput} value={form.bsMonth} onChange={(e) => setForm({ ...form, bsMonth: Number(e.target.value) })}>
          {bsMonthNames.map((name, index) => (
            <option key={name} value={index + 1}>{name}</option>
          ))}
        </select>
      </label>
      <label className="text-[#53665c] text-[11px] font-bold">
        Day (optional)
        <select className={fieldInput} value={form.bsDay} onChange={(e) => setForm({ ...form, bsDay: e.target.value === "" ? "" : Number(e.target.value) })}>
          <option value="">—</option>
          {bsDayOptions.map((day) => (
            <option key={day} value={day}>{day}</option>
          ))}
        </select>
      </label>
      <label className="text-[#53665c] text-[11px] font-bold">Share value<input className={fieldInput} type="number" min="0" step="0.01" value={String(form.shareValue)} onChange={(e) => setForm({ ...form, shareValue: e.target.value === "" ? "" : Number(e.target.value) })} /></label>
      <label className="text-[#53665c] text-[11px] font-bold">Monthly deposit<input className={fieldInput} type="number" min="0" step="0.01" value={String(form.monthlyDeposit)} onChange={(e) => setForm({ ...form, monthlyDeposit: e.target.value === "" ? "" : Number(e.target.value) })} /></label>
      <label className="text-[#53665c] text-[11px] font-bold">Wafa Kosh<input className={fieldInput} type="number" min="0" step="0.01" value={String(form.wafaKosh)} onChange={(e) => setForm({ ...form, wafaKosh: e.target.value === "" ? "" : Number(e.target.value) })} /></label>
      <label className="text-[#53665c] text-[11px] font-bold">Additional deposit<input className={fieldInput} type="number" min="0" step="0.01" value={String(form.additionalDeposit)} onChange={(e) => setForm({ ...form, additionalDeposit: e.target.value === "" ? "" : Number(e.target.value) })} /></label>
      <label className="text-[#53665c] text-[11px] font-bold">Interest<input className={fieldInput} type="number" min="0" step="0.01" value={String(form.interest)} onChange={(e) => setForm({ ...form, interest: e.target.value === "" ? "" : Number(e.target.value) })} /></label>
      <label className="text-[#53665c] text-[11px] font-bold">Fine<input className={fieldInput} type="number" min="0" step="0.01" value={String(form.fine)} onChange={(e) => setForm({ ...form, fine: e.target.value === "" ? "" : Number(e.target.value) })} /></label>
      <label className="text-[#53665c] text-[11px] font-bold col-span-4 max-[700px]:col-span-2">Notes<input className={fieldInput} type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional" /></label>
      {error && <p className="col-span-4 max-[700px]:col-span-2 m-0 text-[11px] text-[#ae4d44]" role="alert">{error}</p>}
      <button type="submit" disabled={isSubmitting} className="col-span-4 max-[700px]:col-span-2 border-0 rounded-md px-4 py-2.5 text-white bg-brand cursor-pointer text-xs font-bold disabled:opacity-60">
        {isSubmitting ? "Saving…" : "Save ledger row"}
      </button>
    </form>
  );
}

function SettingsForm({
  role,
  memberId,
  summary,
  onSaved,
}: {
  role: LedgerStaffRole;
  memberId: string;
  summary: LedgerSummary;
  onSaved: () => void;
}) {
  const [openingBalance, setOpeningBalance] = useState(String(summary.openingBalance));
  const [availableBalance, setAvailableBalance] = useState(
    summary.availableBalanceIsOverride ? String(summary.availableBalance) : "",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fieldInput = "block w-full h-[38px] mt-1 border border-line rounded-md px-2.5 outline-none text-[#2d4037] bg-white text-xs";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      await updateLedgerSettings(role, memberId, {
        openingBalance: Number(openingBalance || 0),
        availableBalance: availableBalance === "" ? null : Number(availableBalance),
      });
      onSaved();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save ledger settings.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="p-5 border border-[#e1e9e4] rounded-[10px] bg-white grid grid-cols-2 gap-3 max-[700px]:grid-cols-1">
      <label className="text-[#53665c] text-[11px] font-bold">Opening balance<input className={fieldInput} type="number" min="0" step="0.01" value={openingBalance} onChange={(e) => setOpeningBalance(e.target.value)} /></label>
      <label className="text-[#53665c] text-[11px] font-bold">
        Available balance override
        <input className={fieldInput} type="number" min="0" step="0.01" value={availableBalance} onChange={(e) => setAvailableBalance(e.target.value)} placeholder="Defaults to total actual balance" />
      </label>
      {error && <p className="col-span-2 max-[700px]:col-span-1 m-0 text-[11px] text-[#ae4d44]" role="alert">{error}</p>}
      <button type="submit" disabled={isSubmitting} className="col-span-2 max-[700px]:col-span-1 border-0 rounded-md px-4 py-2.5 text-[#164b3c] bg-[#e4f2e6] cursor-pointer text-xs font-bold disabled:opacity-60">
        {isSubmitting ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}

export default function LedgerTable({ role }: { role: Role }) {
  const isStaff = role === "accountant" || role === "superadmin" || role === "admin";
  const [members, setMembers] = useState<LedgerMember[]>([]);
  const [memberId, setMemberId] = useState("");
  const [summary, setSummary] = useState<LedgerSummary | null>(null);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [bsYear, setBsYear] = useState(() => currentBsDate().year);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!isStaff) return;
    listLedgerMembers(role as LedgerStaffRole)
      .then((data) => {
        setMembers(data);
        if (!memberId && data.length) setMemberId(data[0].id);
      })
      .catch((error) => setLoadError(error instanceof Error ? error.message : "Unable to load members."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  useEffect(() => {
    if (isStaff && !memberId) return;
    setIsLoading(true);
    setLoadError("");
    const summaryPromise = isStaff ? getLedgerSummary(role as LedgerStaffRole, memberId) : getMyLedgerSummary();
    const entriesPromise = isStaff
      ? listLedgerEntries(role as LedgerStaffRole, memberId, bsYear)
      : listMyLedgerEntries(bsYear);
    Promise.all([summaryPromise, entriesPromise])
      .then(([summaryData, entriesData]) => {
        setSummary(summaryData);
        setEntries(entriesData);
      })
      .catch((error) => setLoadError(error instanceof Error ? error.message : "Unable to load the ledger."))
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, memberId, bsYear, refreshKey]);

  const yearOptions = useMemo(() => {
    const current = currentBsDate().year;
    const years = new Set<number>([current, bsYear]);
    entries.forEach((entry) => years.add(entry.bsYear));
    return Array.from(years).sort((a, b) => b - a);
  }, [entries, bsYear]);

  function refresh() {
    setRefreshKey((key) => key + 1);
  }

  return (
    <main className="max-w-[1190px] mx-auto px-6 pt-20 pb-10 max-[650px]:px-4 max-[650px]:pt-[68px] min-h-[calc(100vh-76px)]">
      <div className="flex justify-between items-end gap-5 mb-[26px] max-[780px]:items-start max-[780px]:flex-col">
        <div>
          <p className="mb-[13px] text-[11px] font-bold tracking-[.18em] uppercase text-brand">Savings ledger</p>
          <h1 className="m-0 font-display font-bold text-[clamp(32px,4vw,46px)] leading-[1.1]">Personal record</h1>
          <p className="mt-[9px] text-muted text-sm">Share value, deposits, Wafa Kosh, interest and fines by Bikram Sambat year.</p>
        </div>
      </div>

      {isStaff && (
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <label className="text-[11px] font-bold text-[#53665c]">
            Member
            <select
              className="block h-[38px] mt-1 border border-line rounded-md px-2.5 outline-none text-[#2d4037] bg-white text-xs min-w-[220px]"
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
            >
              {members.map((member) => (
                <option key={member.id} value={member.id}>{member.full_name} · {member.member_number}</option>
              ))}
            </select>
          </label>
          <label className="text-[11px] font-bold text-[#53665c]">
            BS year
            <select
              className="block h-[38px] mt-1 border border-line rounded-md px-2.5 outline-none text-[#2d4037] bg-white text-xs"
              value={bsYear}
              onChange={(e) => setBsYear(Number(e.target.value))}
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </label>
        </div>
      )}

      {!isStaff && (
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <label className="text-[11px] font-bold text-[#53665c]">
            BS year
            <select
              className="block h-[38px] mt-1 border border-line rounded-md px-2.5 outline-none text-[#2d4037] bg-white text-xs"
              value={bsYear}
              onChange={(e) => setBsYear(Number(e.target.value))}
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </label>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => <div key={i} className="h-[54px] rounded-2xl bg-[#edf1ee] animate-pulse" />)}
        </div>
      ) : loadError ? (
        <div className="p-5 rounded-2xl border border-[#f3d6d3] bg-[#fdf3f2] text-[#ae4d44] text-sm" role="alert">{loadError}</div>
      ) : !summary ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 px-6 rounded-2xl border border-dashed border-line bg-white text-center">
          <div className="w-14 h-14 rounded-full bg-[#eef1ee] grid place-items-center text-muted"><BookOpenCheck size={22} /></div>
          <p className="text-sm font-semibold text-ink">No ledger yet</p>
        </div>
      ) : (
        <>
          <div className="rounded-2xl overflow-hidden border border-line mb-6">
            <div className="bg-[#164b3c] text-white px-5 py-4">
              <p className="m-0 text-sm font-bold">{summary.memberName}</p>
              <p className="m-0 mt-1 text-[11px] text-[#b5cfc1]">{summary.memberNumber} · Joined {formatJoinedAt(summary.joinedAt)}</p>
            </div>
            <div className="grid grid-cols-4 max-[780px]:grid-cols-2 divide-x divide-y divide-[#edf1ee] max-[780px]:divide-x-0 bg-white">
              {[
                ["Opening balance", summary.openingBalance],
                ["Share value", summary.totals.shareValue],
                ["Monthly deposit", summary.totals.monthlyDeposit],
                ["Wafa Kosh", summary.totals.wafaKosh],
                ["Additional deposit", summary.totals.additionalDeposit],
                ["Interest", summary.totals.interest],
                ["Fine", summary.totals.fine],
                ["Total actual balance", summary.totalActualBalance],
              ].map(([label, value]) => (
                <div key={label as string} className="p-4">
                  <p className="m-0 text-[10px] font-bold uppercase tracking-wide text-muted">{label}</p>
                  <p className="m-0 mt-1 text-sm font-bold text-ink">{formatAmount(value as number)}</p>
                </div>
              ))}
            </div>
            <div className="bg-[#e4f2e6] px-5 py-4 flex items-center justify-between">
              <p className="m-0 text-xs font-bold text-[#164b3c]">Available balance{summary.availableBalanceIsOverride ? " (manual)" : ""}</p>
              <p className="m-0 text-base font-bold text-[#164b3c]">{formatAmount(summary.availableBalance)}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-line overflow-hidden mb-6 overflow-x-auto">
            <table className="w-full border-collapse text-xs min-w-[820px]">
              <thead>
                <tr className="bg-[#164b3c] text-white text-left">
                  {["#", "Month", "Date", "Share value", "Monthly deposit", "Wafa Kosh", "Additional", "Interest", "Fine", "Total"].map((head) => (
                    <th key={head} className="px-3 py-3 font-bold text-[11px] whitespace-nowrap">{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 ? (
                  <tr><td colSpan={10} className="px-3 py-8 text-center text-muted text-xs">No entries for {bsYear} yet.</td></tr>
                ) : (
                  entries.map((entry, index) => (
                    <tr key={entry.id} className="border-t border-[#edf1ee] hover:bg-[#f8faf8]">
                      <td className="px-3 py-2.5">{index + 1}</td>
                      <td className="px-3 py-2.5 font-semibold">{bsMonthLabel(entry.bsMonth)}</td>
                      <td className="px-3 py-2.5 text-muted">{entry.bsDay ?? "—"}</td>
                      <td className="px-3 py-2.5">{formatAmount(entry.shareValue)}</td>
                      <td className="px-3 py-2.5">{formatAmount(entry.monthlyDeposit)}</td>
                      <td className="px-3 py-2.5">{formatAmount(entry.wafaKosh)}</td>
                      <td className="px-3 py-2.5">{formatAmount(entry.additionalDeposit)}</td>
                      <td className="px-3 py-2.5">{formatAmount(entry.interest)}</td>
                      <td className="px-3 py-2.5">{formatAmount(entry.fine)}</td>
                      <td className="px-3 py-2.5 font-bold">{formatAmount(entry.total)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {isStaff && memberId && (
            <div className="grid grid-cols-2 gap-5 max-[900px]:grid-cols-1">
              <div>
                <h2 className="font-display font-bold text-lg mb-3">Add / update a month</h2>
                <EntryForm role={role as LedgerStaffRole} memberId={memberId} bsYear={bsYear} onSaved={refresh} />
              </div>
              <div>
                <h2 className="font-display font-bold text-lg mb-3">Balance settings</h2>
                <SettingsForm role={role as LedgerStaffRole} memberId={memberId} summary={summary} onSaved={refresh} />
              </div>
            </div>
          )}
        </>
      )}
    </main>
  );
}
