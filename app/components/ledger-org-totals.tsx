"use client";

import { useEffect, useMemo, useState } from "react";
import { Landmark } from "lucide-react";
import { LedgerOrgTotals, LedgerStaffRole, getLedgerOrgTotals } from "../lib/ledger";
import { currentBsDate } from "../lib/bs-date";

function formatAmount(amount: number) {
  return `Rs. ${amount.toLocaleString()}`;
}

export default function LedgerOrgTotalsPage({ role }: { role: LedgerStaffRole }) {
  const [bsYear, setBsYear] = useState<number | "all">(() => currentBsDate().year);
  const [totals, setTotals] = useState<LedgerOrgTotals | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    setIsLoading(true);
    setLoadError("");
    getLedgerOrgTotals(role, bsYear === "all" ? undefined : bsYear)
      .then(setTotals)
      .catch((error) => setLoadError(error instanceof Error ? error.message : "Unable to load organization totals."))
      .finally(() => setIsLoading(false));
  }, [role, bsYear]);

  const yearOptions = useMemo(() => {
    const current = currentBsDate().year;
    const years = new Set<number>([current]);
    if (typeof bsYear === "number") years.add(bsYear);
    return Array.from(years).sort((a, b) => b - a);
  }, [bsYear]);

  return (
    <main className="max-w-[1190px] mx-auto px-6 pt-20 pb-10 max-[650px]:px-4 max-[650px]:pt-[68px] min-h-[calc(100vh-76px)]">
      <div className="flex justify-between items-end gap-5 mb-[26px] max-[780px]:items-start max-[780px]:flex-col">
        <div>
          <p className="mb-[13px] text-[11px] font-bold tracking-[.18em] uppercase text-brand">Savings ledger</p>
          <h1 className="m-0 font-display font-bold text-[clamp(32px,4vw,46px)] leading-[1.1]">Organization totals</h1>
          <p className="mt-[9px] text-muted text-sm">Combined share value, deposits, Wafa Kosh, interest and fines across every member.</p>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <label className="text-[11px] font-bold text-[#53665c]">
          BS year
          <select
            className="block h-[38px] mt-1 border border-line rounded-md px-2.5 outline-none text-[#2d4037] bg-white text-xs"
            value={bsYear}
            onChange={(e) => setBsYear(e.target.value === "all" ? "all" : Number(e.target.value))}
          >
            <option value="all">All years</option>
            {yearOptions.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </label>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1].map((i) => <div key={i} className="h-[54px] rounded-2xl bg-[#edf1ee] animate-pulse" />)}
        </div>
      ) : loadError ? (
        <div className="p-5 rounded-2xl border border-[#f3d6d3] bg-[#fdf3f2] text-[#ae4d44] text-sm" role="alert">{loadError}</div>
      ) : !totals ? null : (
        <div className="rounded-2xl overflow-hidden border border-line mb-6">
          <div className="bg-[#0f3629] text-white px-5 py-4 flex items-center gap-2.5">
            <Landmark size={16} />
            <div>
              <p className="m-0 text-sm font-bold">Organization totals</p>
              <p className="m-0 mt-0.5 text-[11px] text-[#b5cfc1]">
                {totals.membersWithLedgerActivity} of {totals.memberCount} active members have ledger entries{totals.bsYear ? ` · ${totals.bsYear}` : ""}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-4 max-[780px]:grid-cols-2 divide-x divide-y divide-[#edf1ee] max-[780px]:divide-x-0 bg-white">
            {[
              ["Opening balance", totals.openingBalanceTotal],
              ["Share value", totals.totals.shareValue],
              ["Monthly deposit", totals.totals.monthlyDeposit],
              ["Wafa Kosh", totals.totals.wafaKosh],
              ["Additional deposit", totals.totals.additionalDeposit],
              ["Interest", totals.totals.interest],
              ["Fine", totals.totals.fine],
              ["Total actual balance (all-time)", totals.totalActualBalance],
            ].map(([label, value]) => (
              <div key={label as string} className="p-4">
                <p className="m-0 text-[10px] font-bold uppercase tracking-wide text-muted">{label}</p>
                <p className="m-0 mt-1 text-sm font-bold text-ink">{formatAmount(value as number)}</p>
              </div>
            ))}
          </div>
          <div className="bg-[#e4f2e6] px-5 py-4 flex items-center justify-between">
            <p className="m-0 text-xs font-bold text-[#164b3c]">Available balance (all members)</p>
            <p className="m-0 text-base font-bold text-[#164b3c]">{formatAmount(totals.availableBalanceTotal)}</p>
          </div>
        </div>
      )}
    </main>
  );
}
