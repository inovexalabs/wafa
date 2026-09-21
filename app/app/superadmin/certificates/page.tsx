"use client";

import { FormEvent, useEffect, useState } from "react";
import { Award, Eye, Plus, AwardIcon } from "lucide-react";
import SuperadminLayout from "../../../components/superadmin-layout";
import Modal from "../../../components/modal";
import CertificateView from "../../../components/certificate-view";
import { defaultCertificateTemplate } from "../../../components/certificate-view";
import {
  AdminCertificate,
  CertificateRecipient,
  listCertificateRecipients,
  listIssuedCertificates,
  issueCertificate,
} from "../../../lib/auth";

function formatDate(isoString: string) {
  return new Date(isoString).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

const saFormInput =
  "w-full h-[42px] mt-[7px] border border-line rounded-md px-[11px] outline-none text-[#2d4037] bg-white text-xs focus:border-[#2b7358] focus:shadow-[0_0_0_3px_#2b73581a]";

function IssueCertificateModal({
  onClose,
  onIssued,
}: {
  onClose: () => void;
  onIssued: (cert: AdminCertificate) => void;
}) {
  const [recipients, setRecipients] = useState<CertificateRecipient[]>([]);
  const [isLoadingRecipients, setIsLoadingRecipients] = useState(true);
  const [recipientId, setRecipientId] = useState("");
  const [title, setTitle] = useState("Certificate of Achievement");
  const [description, setDescription] = useState("");
  const [templateHtml, setTemplateHtml] = useState(defaultCertificateTemplate());
  const [showPreview, setShowPreview] = useState(false);
  const [isIssuing, setIsIssuing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    listCertificateRecipients("superadmin")
      .then(setRecipients)
      .catch(() => setRecipients([]))
      .finally(() => setIsLoadingRecipients(false));
  }, []);

  const selectedRecipient = recipients.find((r) => r.id === recipientId);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!recipientId || !title.trim() || !templateHtml.trim()) return;
    setIsIssuing(true);
    setError("");
    setSuccess(false);
    try {
      const issued = await issueCertificate(
        {
          recipientId,
          title: title.trim(),
          description: description.trim() || undefined,
          templateHtml: templateHtml.trim(),
        },
        "superadmin",
      );
      setSuccess(true);
      onIssued({ ...issued, recipientName: selectedRecipient?.fullName ?? "Unknown", recipientRole: selectedRecipient?.role ?? "member" });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to issue certificate.");
    } finally {
      setIsIssuing(false);
    }
  }

  const grouped = recipients.reduce<Record<string, CertificateRecipient[]>>((acc, r) => {
    const group = r.role === "superadmin" || r.role === "admin" ? "Admins" : r.role === "accountant" ? "Accountants" : "Members";
    if (!acc[group]) acc[group] = [];
    acc[group].push(r);
    return acc;
  }, {});

  const canSubmit = recipientId && title.trim() && templateHtml.trim();

  return (
    <Modal title="Issue certificate" onClose={onClose} wide>
      {isLoadingRecipients ? (
        <div className="grid place-items-center py-10 text-[#a0aaa5] text-center">
          <span className="text-[28px]">◌</span>
          <p className="text-[11px] leading-[1.6]">Loading recipients...</p>
        </div>
      ) : (
        <form onSubmit={submit} className="grid gap-[15px]">
          <label className="block text-[#53665c] text-[11px] font-bold">
            Recipient
            <select
              className={saFormInput}
              value={recipientId}
              onChange={(e) => setRecipientId(e.target.value)}
              required
            >
              <option value="">Select a recipient...</option>
              {Object.entries(grouped).map(([group, people]) => (
                <optgroup key={group} label={group}>
                  {people.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.fullName} {r.email ? `(${r.email})` : ""}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>

          <label className="block text-[#53665c] text-[11px] font-bold">
            Title
            <input
              className={saFormInput}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={200}
            />
          </label>

          <label className="block text-[#53665c] text-[11px] font-bold">
            Description
            <textarea
              className="w-full mt-[7px] border border-line rounded-md px-[11px] py-2 outline-none text-[#2d4037] bg-white text-xs h-[72px] resize-none focus:border-[#2b7358] focus:shadow-[0_0_0_3px_#2b73581a]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="For outstanding contribution..."
            />
          </label>

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[#53665c] text-[11px] font-bold">Certificate HTML</span>
              <button
                type="button"
                className="text-[10px] text-brand font-bold cursor-pointer border-0 bg-transparent p-0"
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? "Hide preview" : "Show preview"}
              </button>
            </div>
            <textarea
              className="w-full mt-[3px] border border-line rounded-md px-[11px] py-2 outline-none text-[#2d4037] bg-white text-[10px] font-mono h-[180px] resize-y focus:border-[#2b7358] focus:shadow-[0_0_0_3px_#2b73581a]"
              value={templateHtml}
              onChange={(e) => setTemplateHtml(e.target.value)}
              spellCheck={false}
            />
            {showPreview && (
              <div className="mt-3 rounded-[10px] border border-[#e1e9e4] overflow-hidden">
                <CertificateView
                  templateHtml={templateHtml}
                  tokens={{
                    name: selectedRecipient?.fullName || "Recipient Name",
                    title,
                    certificateNumber: "CERT-XXXXXX",
                    date: new Date().toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" }),
                    description: description || "Certificate description appears here.",
                  }}
                  fileName="certificate-preview"
                />
              </div>
            )}
          </div>

          {error && <p className="m-0 text-[11px] text-[#ae4d44]" role="alert">{error}</p>}
          {success && <p className="m-0 text-[11px] text-[#38805d]">Certificate issued successfully.</p>}

          <div className="flex items-center gap-3">
            <button
              className="flex justify-center gap-3 border-0 rounded-md px-4 py-[10px] text-white bg-brand cursor-pointer text-xs font-bold disabled:opacity-65 disabled:cursor-wait"
              disabled={!canSubmit || isIssuing}
            >
              {isIssuing ? "Issuing..." : "Issue certificate"} <span>→</span>
            </button>
            <button
              type="button"
              className="border-0 rounded-md px-4 py-[10px] text-[#53665c] bg-[#edf1ee] cursor-pointer text-xs font-bold"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

function PreviewModal({ certificate, onClose }: { certificate: AdminCertificate; onClose: () => void }) {
  return (
    <Modal title={`Certificate · ${certificate.certificateNumber}`} onClose={onClose} wide>
      <CertificateView
        templateHtml={certificate.templateHtml}
        tokens={{
          name: certificate.recipientName,
          title: certificate.title,
          certificateNumber: certificate.certificateNumber,
          date: formatDate(certificate.issuedAt),
          description: certificate.description || "",
        }}
        fileName={`${certificate.certificateNumber}-${certificate.recipientName}`}
      />
    </Modal>
  );
}

export default function SuperadminCertificatesPage() {
  const [certificates, setCertificates] = useState<AdminCertificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [previewCertificate, setPreviewCertificate] = useState<AdminCertificate | null>(null);

  function loadCertificates() {
    setIsLoading(true);
    listIssuedCertificates("superadmin")
      .then(setCertificates)
      .catch((err) => setLoadError(err instanceof Error ? err.message : "Unable to load certificates."))
      .finally(() => setIsLoading(false));
  }

  useEffect(loadCertificates, []);

  const roleTone: Record<string, string> = {
    superadmin: "text-[#6a5fae] bg-[#ede9fb]",
    admin: "text-[#2f7a5c] bg-[#e4f4ec]",
    accountant: "text-[#b26a2c] bg-[#fbeddb]",
    member: "text-[#1f6752] bg-[#e4f4ec]",
  };

  return (
    <SuperadminLayout active="certificates">
      <main className="max-w-[1190px] mx-auto px-6 pt-20 max-[650px]:px-4 max-[650px]:pt-[68px] h-dvh flex flex-col overflow-hidden">
        <div className="shrink-0 flex justify-between items-end gap-5 mb-10 max-[780px]:items-start max-[780px]:flex-col">
          <div>
            <p className="mb-[13px] text-[11px] font-bold tracking-[.18em] uppercase text-brand">Recognition &amp; awards</p>
            <h1 className="m-0 font-display font-bold text-[clamp(32px,4vw,46px)] leading-[1.1]">Issue certificate</h1>
            <p className="mt-[9px] text-muted text-sm">Issue HTML certificates that anyone can download as PDF or PNG.</p>
          </div>
          <div className="flex items-center gap-3">
            {!isLoading && certificates.length > 0 && (
              <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-brand/10 text-brand text-xs font-bold">
                <Award size={15} /> {certificates.length} issued
              </div>
            )}
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2.5 text-xs font-bold text-white cursor-pointer border-0 transition-transform hover:-translate-y-0.5"
              onClick={() => setShowIssueModal(true)}
            >
              <Plus size={14} /> New certificate
            </button>
          </div>
        </div>

        <div className="no-scrollbar flex-1 min-h-0 overflow-y-auto pb-6">
        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-[86px] rounded-2xl bg-[#edf1ee] animate-pulse" />
            ))}
          </div>
        ) : loadError ? (
          <div className="p-5 rounded-2xl border border-[#f3d6d3] bg-[#fdf3f2] text-[#ae4d44] text-sm" role="alert">{loadError}</div>
        ) : certificates.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 px-6 rounded-2xl border border-dashed border-line bg-white text-center">
            <div className="w-14 h-14 rounded-full bg-[#eef1ee] grid place-items-center text-muted"><AwardIcon size={22} /></div>
            <p className="text-sm font-semibold text-ink">No certificates issued yet</p>
            <p className="text-xs text-muted max-w-[240px]">Issue your first certificate to get started.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-line bg-white">
            {certificates.map((cert) => (
              <div key={cert.id} className="flex items-center gap-5 p-5 border-b border-line last:border-b-0 transition-colors hover:bg-[#f8faf8]">
                <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-[#e4f4ec] text-[#1f6752] shrink-0">
                  <Award size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-[15px] text-ink truncate">{cert.title}</h3>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${roleTone[cert.recipientRole] ?? "text-[#1f6752] bg-[#e4f4ec]"}`}>
                      {cert.recipientName}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted">
                    <span>{cert.certificateNumber}</span>
                    <span>·</span>
                    <span>{formatDate(cert.issuedAt)}</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="grid place-items-center w-9 h-9 rounded-full border border-line text-muted bg-white cursor-pointer transition-colors hover:border-brand/30 hover:text-brand shrink-0"
                  onClick={() => setPreviewCertificate(cert)}
                  aria-label="Preview certificate"
                  title="Preview & download"
                >
                  <Eye size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
        </div>
      </main>

      {showIssueModal && (
        <IssueCertificateModal
          onClose={() => setShowIssueModal(false)}
          onIssued={(cert) => {
            setCertificates((prev) => [cert, ...prev]);
            setShowIssueModal(false);
          }}
        />
      )}

      {previewCertificate && (
        <PreviewModal certificate={previewCertificate} onClose={() => setPreviewCertificate(null)} />
      )}
    </SuperadminLayout>
  );
}
