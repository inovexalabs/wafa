"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Eye, Pencil, Receipt as ReceiptIcon, XCircle } from "lucide-react";
import Modal from "./modal";
import { linkedRecordClass, linkedRecordId, readLinkedParam, useLinkedRecord } from "./linked-record";
import {
  ReceiptPaymentType,
  ReceiptReviewerRole,
  ReceiptStatus,
  ReviewReceipt,
  approveReceipt,
  cachedReceiptFile,
  editReceipt,
  cachedReceiptsForReview,
  getReceiptFile,
  listReceiptsForReview,
  prefetchReceiptFile,
  rejectReceipt,
} from "../lib/auth";

const imageExtensions = new Set(["png", "jpg", "jpeg", "webp"]);

function fileExtension(fileName: string) {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

export const paymentTypeLabels: Record<ReceiptPaymentType, string> = {
  monthly_deposit: "Monthly deposit",
  share_contribution: "Share contribution",
  loan_payment: "Loan payment",
  other: "Other",
};

const statusStyles: Record<ReceiptStatus, string> = {
  approved: "text-[#3f835b] bg-[#e4f2e6]",
  pending: "text-[#a26e36] bg-[#faecd9]",
  rejected: "text-[#b0473f] bg-[#fae3e1]",
};

const statusLabels: Record<ReceiptStatus, string> = {
  approved: "Approved",
  pending: "Pending",
  rejected: "Rejected",
};

const tabs: Array<{ key: ReceiptStatus | "all"; label: string }> = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
];

function extensionLabel(fileName: string) {
  const ext = fileName.split(".").pop()?.toUpperCase() ?? "FILE";
  return ext.length > 4 ? "FILE" : ext;
}

function formatDateTime(isoString: string) {
  return new Date(isoString).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function formatDate(isoString: string) {
  return new Date(isoString).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatAmount(amount: number) {
  return `Rs. ${amount.toLocaleString()}`;
}

function RejectModal({
  role,
  receipt,
  onClose,
  onRejected,
}: {
  role: ReceiptReviewerRole;
  receipt: ReviewReceipt;
  onClose: () => void;
  onRejected: (updated: ReviewReceipt) => void;
}) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!reason.trim()) return;
    setIsSubmitting(true);
    setError("");
    try {
      const updated = await rejectReceipt(role, receipt.id, reason.trim());
      onRejected(updated);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to reject this receipt.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title={`Reject receipt · ${receipt.receiptNumber}`} onClose={onClose}>
      <p className="m-0 mb-3 text-[11px] text-[#8b9992]">
        {receipt.memberName} · {formatAmount(receipt.amount)} · {paymentTypeLabels[receipt.paymentType]}
      </p>
      <label className="block text-[#53665c] text-[11px] font-bold">
        Reason for rejection
        <textarea
          className="w-full mt-[7px] border border-line rounded-md px-[11px] py-2 outline-none text-[#2d4037] bg-white text-xs h-[92px] resize-none focus:border-[#2b7358] focus:shadow-[0_0_0_3px_#2b73581a]"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Explain why this receipt is being rejected..."
          maxLength={500}
          autoFocus
        />
      </label>
      {error && <p className="m-0 mt-3 text-[11px] text-[#ae4d44]" role="alert">{error}</p>}
      <div className="flex items-center gap-3 mt-4">
        <button
          type="button"
          className="border-0 rounded-md px-4 py-[10px] text-white bg-[#b0473f] cursor-pointer text-xs font-bold disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={!reason.trim() || isSubmitting}
          onClick={submit}
        >
          {isSubmitting ? "Rejecting…" : "Reject receipt"}
        </button>
        <button
          type="button"
          className="border-0 rounded-md px-4 py-[10px] text-[#53665c] bg-[#edf1ee] cursor-pointer text-xs font-bold"
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </Modal>
  );
}

function EditedNote({ receipt, className = "" }: { receipt: ReviewReceipt; className?: string }) {
  if (!receipt.editedAt) return null;
  return (
    <p className={"text-[11px] text-[#7a6a9a] " + className}>
      Edited by {receipt.editedByName} · {formatDateTime(receipt.editedAt)}
    </p>
  );
}

const fieldClass =
  "w-full mt-[7px] border border-line rounded-md px-[11px] py-2 outline-none text-[#2d4037] bg-white text-xs focus:border-[#2b7358] focus:shadow-[0_0_0_3px_#2b73581a]";

function EditModal({
  role,
  receipt,
  onClose,
  onSaved,
}: {
  role: ReceiptReviewerRole;
  receipt: ReviewReceipt;
  onClose: () => void;
  onSaved: (updated: ReviewReceipt) => void;
}) {
  const [amount, setAmount] = useState(String(receipt.amount));
  const [paymentType, setPaymentType] = useState<ReceiptPaymentType>(receipt.paymentType);
  const [paymentDate, setPaymentDate] = useState(receipt.paymentDate.slice(0, 10));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const parsedAmount = Number(amount);
  const isValid = Number.isFinite(parsedAmount) && parsedAmount > 0 && Boolean(paymentDate);
  const isChanged =
    parsedAmount !== Number(receipt.amount) || paymentType !== receipt.paymentType || paymentDate !== receipt.paymentDate.slice(0, 10);

  async function submit() {
    if (!isValid || !isChanged) return;
    setIsSubmitting(true);
    setError("");
    try {
      onSaved(await editReceipt(role, receipt.id, { amount: parsedAmount, paymentType, paymentDate }));
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save this receipt.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title={`Edit receipt · ${receipt.receiptNumber}`} onClose={onClose}>
      <p className="m-0 mb-3 text-[11px] text-[#8b9992]">
        Submitted by {receipt.memberName}. Your name will be recorded on this receipt as the editor.
      </p>
      <div className="grid gap-3">
        <label className="block text-[#53665c] text-[11px] font-bold">
          Amount (Rs.)
          <input
            type="number"
            min="1"
            step="0.01"
            inputMode="decimal"
            className={fieldClass}
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            autoFocus
          />
        </label>
        <label className="block text-[#53665c] text-[11px] font-bold">
          Payment type
          <select className={fieldClass} value={paymentType} onChange={(event) => setPaymentType(event.target.value as ReceiptPaymentType)}>
            {(Object.keys(paymentTypeLabels) as ReceiptPaymentType[]).map((type) => (
              <option key={type} value={type}>{paymentTypeLabels[type]}</option>
            ))}
          </select>
        </label>
        <label className="block text-[#53665c] text-[11px] font-bold">
          Payment date
          <input type="date" className={fieldClass} value={paymentDate} onChange={(event) => setPaymentDate(event.target.value)} />
        </label>
      </div>
      {error && <p className="m-0 mt-3 text-[11px] text-[#ae4d44]" role="alert">{error}</p>}
      <div className="flex items-center gap-3 mt-4">
        <button
          type="button"
          className="border-0 rounded-md px-4 py-[10px] text-white bg-brand cursor-pointer text-xs font-bold disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={!isValid || !isChanged || isSubmitting}
          onClick={submit}
        >
          {isSubmitting ? "Saving…" : "Save changes"}
        </button>
        <button
          type="button"
          className="border-0 rounded-md px-4 py-[10px] text-[#53665c] bg-[#edf1ee] cursor-pointer text-xs font-bold"
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </Modal>
  );
}

function PreviewModal({
  role,
  receipt,
  onClose,
  isBusy,
  actionError,
  onApprove,
  onReject,
  onEdit,
}: {
  role: ReceiptReviewerRole;
  receipt: ReviewReceipt;
  onClose: () => void;
  isBusy: boolean;
  actionError: string;
  onApprove: () => void;
  onReject: () => void;
  onEdit: () => void;
}) {
  // Usually already warmed by hovering the row, so the file shows without a loading state.
  const [fileUrl, setFileUrl] = useState<string | null>(() => cachedReceiptFile(role, receipt.id)?.fileUrl ?? null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(() => !cachedReceiptFile(role, receipt.id));

  useEffect(() => {
    if (cachedReceiptFile(role, receipt.id)) return;
    let cancelled = false;
    getReceiptFile(role, receipt.id)
      .then((file) => { if (!cancelled) setFileUrl(file.fileUrl); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : "Unable to load this receipt file."); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [role, receipt.id]);

  const isImage = imageExtensions.has(fileExtension(receipt.fileName));

  return (
    <Modal title={`Receipt · ${receipt.receiptNumber}`} onClose={onClose} wide>
      <p className="m-0 mb-3 text-[11px] text-[#8b9992]">
        {receipt.memberName} · {formatAmount(receipt.amount)} · {paymentTypeLabels[receipt.paymentType]} · {formatDate(receipt.paymentDate)}
      </p>
      <EditedNote receipt={receipt} className="m-0 -mt-2 mb-3" />
      {isLoading ? (
        <div className="grid place-items-center py-16 text-[#a0aaa5] text-center">
          <span className="text-[28px]">◌</span>
          <p className="text-[11px] leading-[1.6]">Loading receipt…</p>
        </div>
      ) : error ? (
        <p className="m-0 py-10 text-center text-[11px] text-[#ae4d44]" role="alert">{error}</p>
      ) : fileUrl ? (
        <div className="rounded-[10px] border border-[#e1e9e4] overflow-hidden bg-[#f6f8f6]">
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={fileUrl} alt={`Receipt file ${receipt.fileName}`} className="block w-full max-h-[70vh] object-contain" />
          ) : (
            <iframe src={fileUrl} title={`Receipt file ${receipt.fileName}`} className="w-full h-[70vh] border-0" />
          )}
        </div>
      ) : null}
      {actionError && <p className="m-0 mt-4 text-[11px] text-[#ae4d44]" role="alert">{actionError}</p>}
      {receipt.status !== "approved" && (
        <div className="flex gap-2 mt-4 justify-end max-[500px]:*:flex-1 max-[500px]:*:justify-center">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-4 py-2 text-[11px] font-bold text-[#53665c] cursor-pointer disabled:opacity-60"
            disabled={isBusy}
            onClick={onEdit}
          >
            <Pencil size={13} /> Edit
          </button>
          {receipt.status === "pending" && (
            <>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#fae3e1] px-4 py-2 text-[11px] font-bold text-[#b0473f] cursor-pointer border-0 disabled:opacity-60"
                disabled={isBusy}
                onClick={onReject}
              >
                <XCircle size={14} /> Reject
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#e4f2e6] px-4 py-2 text-[11px] font-bold text-[#3f835b] cursor-pointer border-0 disabled:opacity-60"
                disabled={isBusy}
                onClick={onApprove}
              >
                <CheckCircle2 size={14} /> {isBusy ? "Approving…" : "Approve"}
              </button>
            </>
          )}
        </div>
      )}
    </Modal>
  );
}

export default function ReceiptsReview({ role }: { role: ReceiptReviewerRole }) {
  // Lists the dashboard already loaded paint instantly; every list still refreshes in the background.
  const [receipts, setReceipts] = useState<ReviewReceipt[]>(() => cachedReceiptsForReview(role, { status: "pending" }) ?? []);
  const [isLoading, setIsLoading] = useState(() => !cachedReceiptsForReview(role, { status: "pending" }));
  const [loadError, setLoadError] = useState("");
  const [activeTab, setActiveTab] = useState<ReceiptStatus | "all">("pending");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [rejectTarget, setRejectTarget] = useState<ReviewReceipt | null>(null);
  const [editTarget, setEditTarget] = useState<ReviewReceipt | null>(null);
  // Arriving from a dashboard row opens that receipt straight away when it is already loaded.
  const [linkedId] = useState(() => readLinkedParam("receiptId"));
  const [previewTarget, setPreviewTarget] = useState<ReviewReceipt | null>(
    () => (linkedId && cachedReceiptsForReview(role, { status: "pending" })?.find((receipt) => receipt.id === linkedId)) || null,
  );
  const focusId = useLinkedRecord("receiptId", !isLoading);
  // The linked receipt is opened once: here if it was cached, otherwise on the load that finds it.
  const linkHandled = useRef(previewTarget !== null);

  function selectTab(tab: ReceiptStatus | "all") {
    if (tab === activeTab) return;
    const cached = cachedReceiptsForReview(role, { status: tab });
    if (cached) setReceipts(cached);
    setIsLoading(!cached);
    setLoadError("");
    setActiveTab(tab);
  }

  useEffect(() => {
    let cancelled = false;
    listReceiptsForReview(role, { status: activeTab })
      .then((data) => {
        if (cancelled) return;
        const wanted = linkHandled.current ? null : linkedId;
        const linked = wanted ? data.find((receipt) => receipt.id === wanted) : undefined;
        // Already reviewed receipts drop off the pending tab, so look for it under "All" before giving up.
        if (wanted && !linked && activeTab !== "all") return selectTab("all");
        setReceipts(data);
        setIsLoading(false);
        if (!wanted) return;
        linkHandled.current = true;
        if (linked) setPreviewTarget(linked);
        else setActionError("That receipt could not be found. It may have been removed.");
      })
      .catch((error) => {
        if (cancelled) return;
        setLoadError(error instanceof Error ? error.message : "Unable to load receipts.");
        setIsLoading(false);
      });
    return () => { cancelled = true; };
    // selectTab only reads activeTab, which is already a dependency; linkedId never changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, activeTab]);

  async function approve(receipt: ReviewReceipt) {
    setBusyId(receipt.id);
    setActionError("");
    try {
      await approveReceipt(role, receipt.id);
      setReceipts((prev) => prev.filter((item) => item.id !== receipt.id));
      setPreviewTarget((current) => (current?.id === receipt.id ? null : current));
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to approve this receipt.");
    } finally {
      setBusyId(null);
    }
  }

  const pendingCount = receipts.filter((receipt) => receipt.status === "pending").length;

  return (
    <main className="max-w-[1190px] mx-auto px-6 pt-20 pb-2 max-[650px]:px-4 max-[650px]:pt-[68px] max-[650px]:pb-2 min-h-[calc(100vh-76px)]">
      <div className="flex justify-between items-end gap-5 mb-[26px] max-[780px]:items-start max-[780px]:flex-col">
        <div>
          <p className="mb-[13px] text-[11px] font-bold tracking-[.18em] uppercase text-brand">Proof of payment</p>
          <h1 className="m-0 font-display font-bold text-[clamp(32px,4vw,46px)] leading-[1.1]">Receipt approvals</h1>
          <p className="mt-[9px] text-muted text-sm">Review, approve, or reject payment receipts uploaded by members.</p>
        </div>
        {activeTab === "pending" && !isLoading && pendingCount > 0 && (
          <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-brand/10 text-brand text-xs font-bold shrink-0">
            <ReceiptIcon size={15} /> {pendingCount} awaiting review
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={
              "px-4 py-2 rounded-full text-xs font-bold border cursor-pointer transition-colors " +
              (activeTab === tab.key
                ? "bg-brand text-white border-brand"
                : "bg-white text-[#53665c] border-line hover:border-brand/40")
            }
            onClick={() => selectTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {actionError && (
        <div className="p-4 mb-4 rounded-xl border border-[#f3d6d3] bg-[#fdf3f2] text-[#ae4d44] text-xs" role="alert">{actionError}</div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => <div key={i} className="h-[86px] rounded-2xl bg-[#edf1ee] animate-pulse" />)}
        </div>
      ) : loadError ? (
        <div className="p-5 rounded-2xl border border-[#f3d6d3] bg-[#fdf3f2] text-[#ae4d44] text-sm" role="alert">{loadError}</div>
      ) : receipts.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 px-6 rounded-2xl border border-dashed border-line bg-white text-center">
          <div className="w-14 h-14 rounded-full bg-[#eef1ee] grid place-items-center text-muted"><ReceiptIcon size={22} /></div>
          <p className="text-sm font-semibold text-ink">No {activeTab === "all" ? "" : statusLabels[activeTab as ReceiptStatus].toLowerCase()} receipts</p>
          <p className="text-xs text-muted max-w-[260px]">Receipts uploaded by members will show up here.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-line bg-white">
          {receipts.map((receipt) => (
            <div
              key={receipt.id}
              id={linkedRecordId(receipt.id)}
              className={
                "flex items-center gap-5 p-5 border-b border-line last:border-b-0 transition-colors scroll-mt-24 max-[700px]:flex-wrap max-[500px]:gap-x-3 max-[500px]:gap-y-4 max-[500px]:p-4 first:rounded-t-2xl last:rounded-b-2xl " +
                (receipt.id === focusId ? linkedRecordClass : "hover:bg-[#f8faf8]")
              }
            >
              <span className="grid place-items-center w-11 h-11 rounded-xl text-[#b05f4b] bg-[#fae9e3] text-[9px] font-bold shrink-0">{extensionLabel(receipt.fileName)}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="font-semibold text-[14px] text-ink truncate m-0">{receipt.memberName}</h3>
                  <b className={"shrink-0 inline-block px-2 py-[3px] rounded text-[9px] font-bold " + statusStyles[receipt.status]}>{statusLabels[receipt.status]}</b>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted flex-wrap">
                  <span>{receipt.receiptNumber}</span>
                  <span>·</span>
                  <span>{formatAmount(receipt.amount)}</span>
                  <span>·</span>
                  <span>{paymentTypeLabels[receipt.paymentType]}</span>
                  <span>·</span>
                  <span>Paid {formatDate(receipt.paymentDate)}</span>
                  <span>·</span>
                  <span>Submitted {formatDateTime(receipt.submittedAt)}</span>
                </div>
                {receipt.status === "rejected" && receipt.rejectionReason && (
                  <p className="m-0 mt-1.5 text-[11px] text-[#b0473f]">Reason: {receipt.rejectionReason}</p>
                )}
                <EditedNote receipt={receipt} className="m-0 mt-1.5" />
              </div>
              <div className="flex items-center gap-2 shrink-0 max-[700px]:w-full max-[700px]:justify-end">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-line bg-white text-[#53665c] text-[11px] font-bold cursor-pointer hover:border-brand/40 whitespace-nowrap max-[500px]:flex-1 max-[500px]:justify-center"
                  onPointerEnter={() => prefetchReceiptFile(role, receipt.id)}
                  onFocus={() => prefetchReceiptFile(role, receipt.id)}
                  onClick={() => { setActionError(""); setPreviewTarget(receipt); }}
                >
                  <Eye size={13} /> View receipt
                </button>
                {receipt.status !== "approved" && (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-line bg-white text-[#53665c] text-[11px] font-bold cursor-pointer hover:border-brand/40 whitespace-nowrap disabled:opacity-60 max-[500px]:flex-1 max-[500px]:justify-center"
                    disabled={busyId === receipt.id}
                    onClick={() => setEditTarget(receipt)}
                  >
                    <Pencil size={13} /> Edit
                  </button>
                )}
                {receipt.status === "pending" && (
                  <>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#e4f2e6] px-3 py-2 text-[11px] font-bold text-[#3f835b] cursor-pointer border-0 disabled:opacity-60 whitespace-nowrap max-[500px]:flex-1 max-[500px]:justify-center"
                      disabled={busyId === receipt.id}
                      onClick={() => approve(receipt)}
                    >
                      <CheckCircle2 size={14} /> {busyId === receipt.id ? "Approving…" : "Approve"}
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#fae3e1] px-3 py-2 text-[11px] font-bold text-[#b0473f] cursor-pointer border-0 disabled:opacity-60 whitespace-nowrap max-[500px]:flex-1 max-[500px]:justify-center"
                      disabled={busyId === receipt.id}
                      onClick={() => setRejectTarget(receipt)}
                    >
                      <XCircle size={14} /> Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {rejectTarget && (
        <RejectModal
          role={role}
          receipt={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onRejected={() => {
            setReceipts((prev) => prev.filter((item) => item.id !== rejectTarget.id));
            setRejectTarget(null);
          }}
        />
      )}

      {previewTarget && (
        <PreviewModal
          role={role}
          receipt={previewTarget}
          onClose={() => setPreviewTarget(null)}
          isBusy={busyId === previewTarget.id}
          actionError={actionError}
          onApprove={() => approve(previewTarget)}
          onReject={() => {
            setRejectTarget(previewTarget);
            setPreviewTarget(null);
          }}
          onEdit={() => {
            setEditTarget(previewTarget);
            setPreviewTarget(null);
          }}
        />
      )}

      {editTarget && (
        <EditModal
          role={role}
          receipt={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={(updated) => {
            setReceipts((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
            setEditTarget(null);
          }}
        />
      )}
    </main>
  );
}
