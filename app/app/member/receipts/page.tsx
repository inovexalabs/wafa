"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import MemberLayout from "../../../components/member-layout";
import { listReceipts, Receipt, ReceiptPaymentType, submitReceipt } from "../../../lib/auth";

const paymentTypeLabels: Record<ReceiptPaymentType, string> = {
  monthly_deposit: "Monthly deposit",
  share_contribution: "Share contribution",
  loan_payment: "Loan payment",
  other: "Other",
};

const statusStyles: Record<Receipt["status"], string> = {
  approved: "text-[#3f835b] bg-[#e4f2e6]",
  pending: "text-[#a26e36] bg-[#faecd9]",
  rejected: "text-[#b0473f] bg-[#fae3e1]",
};

const statusLabels: Record<Receipt["status"], string> = {
  approved: "Approved",
  pending: "Pending",
  rejected: "Rejected",
};

function extensionLabel(fileName: string) {
  const ext = fileName.split(".").pop()?.toUpperCase() ?? "FILE";
  return ext.length > 4 ? "FILE" : ext;
}

function formatDate(isoString: string) {
  return new Date(isoString).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatAmount(amount: number) {
  return `Rs. ${amount.toLocaleString()}`;
}

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [paymentType, setPaymentType] = useState<ReceiptPaymentType>("monthly_deposit");
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [sent, setSent] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    listReceipts()
      .then(setReceipts)
      .catch((error) => setLoadError(error instanceof Error ? error.message : "Unable to load your receipts."))
      .finally(() => setIsLoading(false));
  }, [refreshKey]);

  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    setFile(event.target.files?.[0] ?? null);
    setSent(false);
    setSubmitError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return;
    setIsSubmitting(true);
    setSubmitError("");
    setSent(false);
    try {
      await submitReceipt({ amount: Number(amount), paymentType, paymentDate, file });
      setSent(true);
      setAmount("");
      setFile(null);
      const fileInput = document.getElementById("receipt-file-input") as HTMLInputElement | null;
      if (fileInput) fileInput.value = "";
      setRefreshKey((key) => key + 1);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to submit this receipt.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const fieldInput = "block w-full h-[42px] mt-[7px] border border-line rounded-md px-[11px] outline-none text-[#2d4037] bg-white font-inherit text-xs";

  return (
    <MemberLayout active="receipts">
      <main className="max-w-[1190px] mx-auto px-6 pt-20 max-[650px]:px-4 max-[650px]:pt-[68px] h-dvh flex flex-col overflow-hidden">
        <div className="shrink-0 flex justify-between items-end gap-5 mb-[30px] max-[780px]:items-start max-[780px]:flex-col">
          <div>
            <p className="mb-[13px] text-[11px] font-bold tracking-[.18em] uppercase text-brand">Proof of payment</p>
            <h1 className="m-0 font-display font-bold text-[clamp(32px,4vw,46px)] leading-[1.1]">Upload receipt</h1>
            <p className="mt-[9px] text-muted text-sm">Send a payment receipt for review by the WAFA team.</p>
          </div>
        </div>
        <div className="no-scrollbar flex-1 min-h-0 overflow-y-auto pb-6 grid grid-cols-[1.2fr_.8fr] gap-[18px] items-start max-[780px]:grid-cols-1">
          <section className="p-6 border border-[#e1e9e4] rounded-[10px] bg-white max-[500px]:px-4 max-[500px]:py-[19px]">
            <h2 className="m-0 font-display font-bold text-[23px]">New receipt</h2>
            <p className="my-[7px] mb-[22px] text-[#8b9992] text-[11px]">Upload a clear image or PDF of your payment confirmation.</p>
            <form onSubmit={submit}>
              <label className="block mt-4 text-[#53665c] text-[11px] font-bold">
                Payment type
                <select className={fieldInput} value={paymentType} onChange={(event) => setPaymentType(event.target.value as ReceiptPaymentType)}>
                  {(Object.keys(paymentTypeLabels) as ReceiptPaymentType[]).map((type) => (
                    <option key={type} value={type}>{paymentTypeLabels[type]}</option>
                  ))}
                </select>
              </label>
              <label className="block mt-4 text-[#53665c] text-[11px] font-bold">Amount<input className={fieldInput + " [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"} type="number" min="0" step="0.01" placeholder="0.00" value={amount} onChange={(event) => setAmount(event.target.value)} required /></label>
              <label className="block mt-4 text-[#53665c] text-[11px] font-bold">Payment date<input className={fieldInput} type="date" value={paymentDate} onChange={(event) => setPaymentDate(event.target.value)} required /></label>
              <label className="grid place-items-center gap-[7px] mt-[19px] px-[15px] py-[25px] border border-dashed border-[#abcbb4] rounded-lg text-[#4b8864] bg-[#f3faf1] text-center cursor-pointer">
                <input id="receipt-file-input" className="hidden" type="file" accept="image/png,image/jpeg,image/webp,.pdf" onChange={chooseFile} />
                <span className="text-[23px]">＋</span>
                <strong className="text-xs">{file?.name || "Choose a file to upload"}</strong>
                <small className="text-[#92a29a] text-[9px]">PNG, JPG, WEBP or PDF · Max 10 MB</small>
              </label>
              {submitError && <p className="m-0 mt-4 text-[11px] text-[#ae4d44]" role="alert">{submitError}</p>}
              {sent && !submitError && <p className="m-0 mt-4 text-[11px] text-[#38805d]">Receipt submitted successfully for review.</p>}
              <button type="submit" className="border-0 rounded-[7px] px-[17px] py-3 text-white bg-brand cursor-pointer text-xs font-bold w-full mt-[18px] disabled:opacity-55 disabled:cursor-not-allowed" disabled={!file || !amount || isSubmitting}>
                {isSubmitting ? "Submitting…" : "Submit receipt"} <span>→</span>
              </button>
            </form>
          </section>
          <section className="p-6 border border-[#e1e9e4] rounded-[10px] bg-white max-[500px]:px-4 max-[500px]:py-[19px]">
            <h2 className="m-0 font-display font-bold text-[23px]">Recent receipts</h2>
            <p className="my-[7px] mb-[22px] text-[#8b9992] text-[11px]">Track the status of your submissions.</p>
            {isLoading ? (
              <div className="space-y-3">
                {[0, 1].map((i) => <div key={i} className="h-[54px] rounded-md bg-[#edf1ee] animate-pulse" />)}
              </div>
            ) : loadError ? (
              <p className="m-0 text-[11px] text-[#ae4d44]" role="alert">{loadError}</p>
            ) : receipts.length === 0 ? (
              <p className="m-0 text-[11px] text-[#9ba7a1]">You haven&apos;t submitted any receipts yet.</p>
            ) : (
              <div>
                {receipts.map((receipt) => (
                  <div key={receipt.id} className="flex items-center gap-[10px] py-[14px] border-t border-[#edf1ee] first:border-t-0">
                    <span className="grid place-items-center w-8 h-[34px] rounded-md text-[#b05f4b] bg-[#fae9e3] text-[9px] font-bold shrink-0">{extensionLabel(receipt.fileName)}</span>
                    <p className="flex-1 min-w-0 m-0">
                      {receipt.fileUrl ? (
                        <a className="block text-[10px] font-bold text-[#2d4037] truncate no-underline hover:underline" href={receipt.fileUrl} target="_blank" rel="noreferrer">{receipt.fileName}</a>
                      ) : (
                        <strong className="block text-[10px] truncate">{receipt.fileName}</strong>
                      )}
                      <small className="block mt-1 text-[#9ba7a1] text-[9px]">{formatAmount(receipt.amount)} · {formatDate(receipt.paymentDate)} · {paymentTypeLabels[receipt.paymentType]}</small>
                      {receipt.status === "rejected" && receipt.rejectionReason && (
                        <small className="block mt-1 text-[#b0473f] text-[9px]">{receipt.rejectionReason}</small>
                      )}
                    </p>
                    <b className={"shrink-0 inline-block px-2 py-[5px] rounded text-[9px] font-bold " + statusStyles[receipt.status]}>{statusLabels[receipt.status]}</b>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </MemberLayout>
  );
}
