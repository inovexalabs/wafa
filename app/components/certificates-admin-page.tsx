"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Award, AwardIcon, CheckCircle2, Eye, Loader2, Plus, Trash2, Upload, X } from "lucide-react";
import AdminLayout from "./admin-layout";
import SuperadminLayout from "./superadmin-layout";
import Modal from "./modal";
import CertificateView from "./certificate-view";
import {
  AdminCertificate,
  CertificateIssuerRole,
  CertificateRecipient,
  deleteCertificate,
  issueCertificate,
  listCertificateRecipients,
  listIssuedCertificates,
} from "../lib/auth";

const maxCertificateBytes = 10 * 1024 * 1024;

function formatDate(isoString: string) {
  return new Date(isoString).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function formatSize(bytes: number) {
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function normalizeName(value: string) {
  return value.toLowerCase().replace(/\.[a-z0-9]+$/, "").replace(/[^a-z0-9]+/g, " ").trim();
}

/** Pick the recipient whose name matches the file name, e.g. "ram-bahadur-thapa.png" -> "Ram Bahadur Thapa". */
function guessRecipient(fileName: string, recipients: CertificateRecipient[]) {
  const name = normalizeName(fileName);
  if (!name) return "";
  const exact = recipients.filter((r) => normalizeName(r.fullName) === name);
  if (exact.length === 1) return exact[0].id;
  const contained = recipients.filter((r) => {
    const fullName = normalizeName(r.fullName);
    return fullName && ` ${name} `.includes(` ${fullName} `);
  });
  return contained.length === 1 ? contained[0].id : "";
}

const saFormInput =
  "w-full h-[42px] mt-[7px] border border-line rounded-md px-[11px] outline-none text-[#2d4037] bg-white text-xs focus:border-[#2b7358] focus:shadow-[0_0_0_3px_#2b73581a]";

type UploadRow = {
  key: string;
  file: File;
  previewUrl: string;
  recipientId: string;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
};

function IssueCertificatesModal({
  role,
  onClose,
  onIssued,
}: {
  role: CertificateIssuerRole;
  onClose: () => void;
  onIssued: (cert: AdminCertificate) => void;
}) {
  const [recipients, setRecipients] = useState<CertificateRecipient[]>([]);
  const [isLoadingRecipients, setIsLoadingRecipients] = useState(true);
  const [title, setTitle] = useState("Certificate of Achievement");
  const [description, setDescription] = useState("");
  const [rows, setRows] = useState<UploadRow[]>([]);
  const [isIssuing, setIsIssuing] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlsRef = useRef(new Set<string>());

  useEffect(() => {
    listCertificateRecipients(role)
      .then(setRecipients)
      .catch(() => setRecipients([]))
      .finally(() => setIsLoadingRecipients(false));
  }, [role]);

  // Release preview object URLs when the modal closes.
  useEffect(() => {
    const previewUrls = previewUrlsRef.current;
    return () => previewUrls.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const grouped = useMemo(
    () =>
      recipients.reduce<Record<string, CertificateRecipient[]>>((acc, r) => {
        const group = r.role === "superadmin" || r.role === "admin" ? "Admins" : r.role === "accountant" ? "Accountants" : "Members";
        (acc[group] ??= []).push(r);
        return acc;
      }, {}),
    [recipients],
  );

  function addFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    const rejected: string[] = [];
    const added: UploadRow[] = [];
    for (const file of files) {
      if (file.type !== "image/png") {
        rejected.push(`${file.name} is not a PNG`);
        continue;
      }
      if (file.size > maxCertificateBytes) {
        rejected.push(`${file.name} is larger than 10 MB`);
        continue;
      }
      const previewUrl = URL.createObjectURL(file);
      previewUrlsRef.current.add(previewUrl);
      added.push({
        key: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
        file,
        previewUrl,
        recipientId: guessRecipient(file.name, recipients),
        status: "pending",
      });
    }
    setError(rejected.length ? `Skipped: ${rejected.join("; ")}.` : "");
    setRows((prev) => [...prev, ...added]);
  }

  function updateRow(key: string, patch: Partial<UploadRow>) {
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  function removeRow(key: string) {
    setRows((prev) => {
      const row = prev.find((r) => r.key === key);
      if (row) {
        URL.revokeObjectURL(row.previewUrl);
        previewUrlsRef.current.delete(row.previewUrl);
      }
      return prev.filter((r) => r.key !== key);
    });
  }

  const pendingRows = rows.filter((row) => row.status !== "done");
  const missingRecipient = pendingRows.some((row) => !row.recipientId);
  const canSubmit = title.trim() && pendingRows.length > 0 && !missingRecipient;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit || isIssuing) return;
    setIsIssuing(true);
    setError("");
    let failures = 0;
    for (const row of pendingRows) {
      updateRow(row.key, { status: "uploading", error: undefined });
      try {
        const issued = await issueCertificate(
          { recipientId: row.recipientId, title: title.trim(), description: description.trim() || undefined, file: row.file },
          role,
        );
        const recipient = recipients.find((r) => r.id === row.recipientId);
        onIssued({ ...issued, recipientName: recipient?.fullName ?? "Unknown recipient", recipientRole: recipient?.role ?? "member" });
        updateRow(row.key, { status: "done" });
      } catch (issueError) {
        failures += 1;
        updateRow(row.key, { status: "error", error: issueError instanceof Error ? issueError.message : "Unable to issue this certificate." });
      }
    }
    setIsIssuing(false);
    if (failures === 0) onClose();
    else setError(`${failures} certificate${failures === 1 ? "" : "s"} could not be issued. Fix them and try again.`);
  }

  return (
    <Modal title="Issue certificates" onClose={isIssuing ? () => {} : onClose} wide>
      {isLoadingRecipients ? (
        <div className="grid place-items-center py-10 text-[#a0aaa5] text-center">
          <Loader2 size={22} className="animate-spin" />
          <p className="text-[11px] leading-[1.6]">Loading recipients...</p>
        </div>
      ) : (
        <form onSubmit={submit} className="grid gap-[15px]">
          <label className="block text-[#53665c] text-[11px] font-bold">
            Title
            <input className={saFormInput} value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} disabled={isIssuing} />
          </label>

          <label className="block text-[#53665c] text-[11px] font-bold">
            Description
            <textarea
              className="w-full mt-[7px] border border-line rounded-md px-[11px] py-2 outline-none text-[#2d4037] bg-white text-xs h-[64px] resize-none focus:border-[#2b7358] focus:shadow-[0_0_0_3px_#2b73581a]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="For outstanding contribution..."
              disabled={isIssuing}
            />
          </label>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#53665c] text-[11px] font-bold">Certificate images</span>
              {rows.length > 0 && <span className="text-[10px] text-muted">{rows.length} file{rows.length === 1 ? "" : "s"}</span>}
            </div>
            <button
              type="button"
              className="w-full flex flex-col items-center justify-center gap-1.5 py-6 px-4 rounded-[10px] border border-dashed border-[#b9cdc3] bg-[#f8faf8] text-center cursor-pointer transition-colors hover:border-brand hover:bg-[#f1f7f3] disabled:cursor-wait disabled:opacity-60"
              onClick={() => fileInputRef.current?.click()}
              disabled={isIssuing}
            >
              <Upload size={18} className="text-brand" />
              <span className="text-xs font-bold text-ink">Choose PNG files</span>
              <span className="text-[10px] text-muted">One PNG per person, up to 10 MB each. Name files after the recipient to match them automatically.</span>
            </button>
            <input ref={fileInputRef} type="file" accept="image/png" multiple className="hidden" onChange={addFiles} />

            {rows.length > 0 && (
              <ul className="m-0 mt-3 p-0 list-none grid gap-2">
                {rows.map((row) => (
                  <li key={row.key} className="flex items-center gap-3 p-2.5 rounded-[10px] border border-line bg-white max-[560px]:flex-wrap">
                    <img src={row.previewUrl} alt="" className="w-16 h-11 rounded-md object-cover border border-[#edf1ee] shrink-0" />
                    <div className="flex-1 min-w-[140px]">
                      <p className="m-0 text-[11px] font-semibold text-ink truncate" title={row.file.name}>{row.file.name}</p>
                      <p className="m-0 text-[10px] text-muted">{formatSize(row.file.size)}</p>
                      {row.status === "error" && <p className="m-0 mt-0.5 text-[10px] text-[#ae4d44]" role="alert">{row.error}</p>}
                    </div>
                    <select
                      className="h-[34px] w-[210px] max-[560px]:w-full border border-line rounded-md px-2 outline-none text-[#2d4037] bg-white text-[11px] focus:border-[#2b7358] disabled:bg-[#f5f7f5]"
                      value={row.recipientId}
                      onChange={(e) => updateRow(row.key, { recipientId: e.target.value })}
                      disabled={isIssuing || row.status === "done"}
                      aria-label={`Recipient for ${row.file.name}`}
                    >
                      <option value="">Select recipient...</option>
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
                    <span className="grid place-items-center w-8 h-8 shrink-0">
                      {row.status === "uploading" ? (
                        <Loader2 size={15} className="animate-spin text-brand" />
                      ) : row.status === "done" ? (
                        <CheckCircle2 size={16} className="text-[#38805d]" />
                      ) : (
                        <button
                          type="button"
                          className="grid place-items-center w-8 h-8 rounded-full border-0 bg-transparent text-muted cursor-pointer hover:bg-[#f0f2f0] hover:text-[#ae4d44] disabled:cursor-wait"
                          onClick={() => removeRow(row.key)}
                          disabled={isIssuing}
                          aria-label={`Remove ${row.file.name}`}
                        >
                          <X size={15} />
                        </button>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {missingRecipient && !isIssuing && <p className="m-0 mt-2 text-[10px] text-[#b26a2c]">Choose a recipient for every file.</p>}
          </div>

          {error && <p className="m-0 text-[11px] text-[#ae4d44]" role="alert">{error}</p>}

          <div className="flex items-center gap-3">
            <button
              className="flex justify-center gap-3 border-0 rounded-md px-4 py-[10px] text-white bg-brand cursor-pointer text-xs font-bold disabled:opacity-65 disabled:cursor-not-allowed"
              disabled={!canSubmit || isIssuing}
            >
              {isIssuing ? "Issuing..." : pendingRows.length > 1 ? `Issue ${pendingRows.length} certificates` : "Issue certificate"} <span>→</span>
            </button>
            <button
              type="button"
              className="border-0 rounded-md px-4 py-[10px] text-[#53665c] bg-[#edf1ee] cursor-pointer text-xs font-bold disabled:opacity-65 disabled:cursor-wait"
              onClick={onClose}
              disabled={isIssuing}
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
        certificate={certificate}
        fileName={`${certificate.certificateNumber}-${certificate.recipientName}`}
        header={
          <div className="min-w-0">
            <p className="m-0 text-sm font-semibold text-ink truncate">{certificate.title}</p>
            <p className="m-0 text-xs text-muted truncate">{certificate.recipientName} · {formatDate(certificate.issuedAt)}</p>
          </div>
        }
      />
    </Modal>
  );
}

const roleTone: Record<string, string> = {
  superadmin: "text-[#6a5fae] bg-[#ede9fb]",
  admin: "text-[#2f7a5c] bg-[#e4f4ec]",
  accountant: "text-[#b26a2c] bg-[#fbeddb]",
  member: "text-[#1f6752] bg-[#e4f4ec]",
};

/** Certificate management for admins and superadmins: upload one PNG per recipient, preview, and delete. */
export default function CertificatesAdminPage({ role }: { role: CertificateIssuerRole }) {
  const [certificates, setCertificates] = useState<AdminCertificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [previewCertificate, setPreviewCertificate] = useState<AdminCertificate | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    listIssuedCertificates(role)
      .then(setCertificates)
      .catch((err) => setLoadError(err instanceof Error ? err.message : "Unable to load certificates."))
      .finally(() => setIsLoading(false));
  }, [role]);

  async function remove(cert: AdminCertificate) {
    if (!window.confirm(`Delete "${cert.title}" for ${cert.recipientName}? They will no longer see it.`)) return;
    setDeletingId(cert.id);
    setActionError("");
    try {
      await deleteCertificate(cert.id, role);
      setCertificates((prev) => prev.filter((c) => c.id !== cert.id));
    } catch (deleteError) {
      setActionError(deleteError instanceof Error ? deleteError.message : "Unable to delete this certificate.");
    } finally {
      setDeletingId(null);
    }
  }

  const Layout = role === "superadmin" ? SuperadminLayout : AdminLayout;

  return (
    <Layout active="certificates">
      <main className="max-w-[1190px] mx-auto px-6 pt-20 max-[650px]:px-4 max-[650px]:pt-[68px] h-app flex flex-col overflow-hidden">
        <div className="shrink-0 flex justify-between items-end gap-5 mb-10 max-[780px]:items-start max-[780px]:flex-col">
          <div>
            <p className="mb-[13px] text-[11px] font-bold tracking-[.18em] uppercase text-brand">Recognition &amp; awards</p>
            <h1 className="m-0 font-display font-bold text-[clamp(32px,4vw,46px)] leading-[1.1]">{role === "superadmin" ? "Issue certificate" : "Certificates"}</h1>
            <p className="mt-[9px] text-muted text-sm">Upload each person&apos;s certificate as a PNG. They can view and download it as PNG or PDF.</p>
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
              <Plus size={14} /> Upload certificates
            </button>
          </div>
        </div>

        {actionError && <p className="shrink-0 m-0 mb-3 text-[11px] text-[#ae4d44]" role="alert">{actionError}</p>}

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
            <p className="text-xs text-muted max-w-[240px]">Upload your first certificate to get started.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-line bg-white">
            {certificates.map((cert) => (
              <div key={cert.id} className="flex items-center gap-5 p-5 border-b border-line last:border-b-0 transition-colors hover:bg-[#f8faf8] max-[560px]:gap-3 max-[560px]:p-4">
                <div className="grid place-items-center w-20 h-14 rounded-xl overflow-hidden bg-[#e4f4ec] text-[#1f6752] shrink-0 max-[560px]:w-14 max-[560px]:h-11">
                  {cert.imageUrl ? <img src={cert.imageUrl} alt="" className="w-full h-full object-cover" /> : <Award size={20} />}
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
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    className="grid place-items-center w-9 h-9 rounded-full border border-line text-muted bg-white cursor-pointer transition-colors hover:border-brand/30 hover:text-brand"
                    onClick={() => setPreviewCertificate(cert)}
                    aria-label="Preview certificate"
                    title="Preview & download"
                  >
                    <Eye size={15} />
                  </button>
                  <button
                    type="button"
                    className="grid place-items-center w-9 h-9 rounded-full border border-line text-muted bg-white cursor-pointer transition-colors hover:border-[#ae4d44]/30 hover:text-[#ae4d44] disabled:cursor-wait disabled:opacity-60"
                    onClick={() => void remove(cert)}
                    disabled={deletingId === cert.id}
                    aria-label="Delete certificate"
                    title="Delete"
                  >
                    {deletingId === cert.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </main>

      {showIssueModal && (
        <IssueCertificatesModal
          role={role}
          onClose={() => setShowIssueModal(false)}
          onIssued={(cert) => setCertificates((prev) => [cert, ...prev])}
        />
      )}

      {previewCertificate && <PreviewModal certificate={previewCertificate} onClose={() => setPreviewCertificate(null)} />}
    </Layout>
  );
}
