"use client";

import { useEffect, useState } from "react";
import { Wallet } from "lucide-react";
import MemberLayout from "../../../components/member-layout";
import { getPaymentsOverview, PaymentEntry, PaymentsOverview } from "../../../lib/auth";

const stateLabel: Record<PaymentEntry["state"], string> = {
  paid: "Paid",
  due: "Due",
  overdue: "Overdue",
};

const stateStyle: Record<PaymentEntry["state"], string> = {
  paid: "text-[#3f835b] bg-[#e4f2e6]",
  due: "text-[#a26e36] bg-[#faecd9]",
  overdue: "text-[#b0473f] bg-[#fae3e1]",
};

function formatAmount(amount: number) {
  return `Rs. ${amount.toLocaleString()}`;
}

function formatDate(isoString: string) {
  return new Date(isoString).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function PaymentsPage() {
  const [overview, setOverview] = useState<PaymentsOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getPaymentsOverview()
      .then(setOverview)
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Unable to load your payments."))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <MemberLayout active="payments">
      <main className="max-w-[1190px] mx-auto px-6 pt-20 max-[650px]:px-4 max-[650px]:pt-[68px] h-dvh flex flex-col overflow-hidden">
        <div className="shrink-0 flex justify-between items-end gap-5 mb-[30px] max-[780px]:items-start max-[780px]:flex-col">
          <div>
            <p className="mb-[13px] text-[11px] font-bold tracking-[.18em] uppercase text-brand">Financial overview</p>
            <h1 className="m-0 font-display font-bold text-[clamp(32px,4vw,46px)] leading-[1.1]">Payments</h1>
            <p className="mt-[9px] text-muted text-sm">Track your contributions and payment schedule.</p>
          </div>
        </div>

        <div className="no-scrollbar flex-1 min-h-0 overflow-y-auto pb-6">
        {error ? (
          <div className="p-5 rounded-[10px] border border-[#f3d6d3] bg-[#fdf3f2] text-[#ae4d44] text-sm" role="alert">{error}</div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4 max-[780px]:grid-cols-1">
              <article className="p-5 border border-[#e0e9e3] rounded-[10px] bg-white">
                <small className="block text-[#7c8a83] text-[11px]">Current balance</small>
                <strong className="block my-[7px] text-2xl">{isLoading ? "…" : formatAmount(overview?.currentBalance ?? 0)}</strong>
                <span className="block text-[#9aa69f] text-[10px]">Due this month</span>
              </article>
              <article className="p-5 border border-[#e0e9e3] rounded-[10px] bg-white">
                <small className="block text-[#7c8a83] text-[11px]">Total contributions</small>
                <strong className="block my-[7px] text-2xl">{isLoading ? "…" : formatAmount(overview?.totalContributions ?? 0)}</strong>
                <span className="block text-[#9aa69f] text-[10px]">Since joining</span>
              </article>
              <article className="p-5 border border-[#e0e9e3] rounded-[10px] bg-white">
                <small className="block text-[#7c8a83] text-[11px]">Payment status</small>
                <strong className={"block my-[7px] text-2xl " + (!isLoading && (overview?.duePaymentsCount ?? 0) > 0 ? "text-[#a26e36]" : "text-[#3f8b61]")}>
                  {isLoading ? "…" : (overview?.duePaymentsCount ?? 0) > 0 ? "Payment due" : "Up to date"}
                </strong>
                <span className="block text-[#9aa69f] text-[10px]">{isLoading ? "" : `${overview?.duePaymentsCount ?? 0} payment${(overview?.duePaymentsCount ?? 0) === 1 ? "" : "s"} due`}</span>
              </article>
            </div>
            <section className="p-6 border border-[#e1e9e4] rounded-[10px] bg-white mt-5 max-[500px]:px-4 max-[500px]:py-[19px]">
              <div className="flex justify-between">
                <div><h2 className="m-0 font-display font-bold text-[23px]">Payment history</h2><p className="my-[6px] text-[#8a9892] text-[11px]">Your recent contributions.</p></div>
              </div>
              <div className="mt-[23px]">
                {isLoading ? (
                  <div className="space-y-3">
                    {[0, 1, 2].map((i) => <div key={i} className="h-[54px] rounded-md bg-[#edf1ee] animate-pulse" />)}
                  </div>
                ) : (overview?.history.length ?? 0) === 0 ? (
                  <p className="m-0 text-[11px] text-[#9ba7a1]">No payment activity yet.</p>
                ) : (
                  overview?.history.map((payment) => (
                    <article className="flex items-center gap-4 py-[17px] border-t border-[#edf1ee] first:border-t-0" key={payment.id}>
                      <span className="grid place-items-center w-[33px] h-[33px] rounded-lg text-[#286d54] bg-[#e4f2e5]"><Wallet size={15} /></span>
                      <div className="flex-1"><strong className="text-xs">{payment.label}</strong><p className="my-[5px] text-[#909e97] text-[10px]">{payment.period}</p></div>
                      <b className="text-xs">{formatAmount(payment.amount)}</b>
                      <span className={"inline-block px-2 py-[5px] rounded text-[9px] font-bold " + stateStyle[payment.state]}>{stateLabel[payment.state]} {formatDate(payment.date)}</span>
                    </article>
                  ))
                )}
              </div>
            </section>
          </>
        )}
        </div>
      </main>
    </MemberLayout>
  );
}
