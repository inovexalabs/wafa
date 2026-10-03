"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CircleAlert, ExternalLink, Eye, FileCheck2, FileText, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import Modal from "./modal";
import {
  deleteMemberDocument,
  getMemberDocumentFile,
  listMemberDocuments,
  MemberDocumentSlot,
  MemberDocumentsOwner,
  uploadMemberDocument,
} from "../lib/auth";

const acceptedFiles = ".pdf,image/png,image/jpeg,image/webp";
const maxFileBytes = 10 * 1024 * 1024;
const fieldInput = "block w-full h-[42px] mt-[7px] border border-line rounded-md px-[11px] outline-none text-[#2d4037] bg-white text-xs focus:border-[#2b7358] focus:shadow-[0_0_0_3px_#2b73581a]";
const fieldLabel = "block text-[#53665c] text-[11px] font-bold";

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(isoString: string) {
  return new Date(isoString).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function UploadModal({
  owner,
  slot,
  onClose,
  onUploaded,
}: {
  owner: MemberDocumentsOwner;
  slot: MemberDocumentSlot;
  onClose: () => void;
  onUploaded: (slot: MemberDocumentSlot) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [documentNumber, setDocumentNumber] = useState(slot.document?.documentNumber ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setError("Choose a file to upload.");
      return;
    }
    if (file.size > maxFileBytes) {
      setError("The file must be 10 MB or smaller.");
      return;
    }
    setIsSaving(true);
    setError("");
    try {
      onUploaded(await uploadMemberDocument(owner, slot.type.id, file, documentNumber));
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Unable to upload this document.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal title={`${slot.document ? "Replace" : "Upload"} ${slot.type.name}`} onClose={onClose}>
      <form onSubmit={submit} className="grid gap-4">
        {slot.type.description && <p className="m-0 text-[11px] leading-relaxed text-[#65756e]">{slot.type.description}</p>}
        <label className={fieldLabel}>
          Document number <span className="text-[#9aa8a1] text-[10px] font-normal">Optional</span>
          <input className={fieldInput} value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} maxLength={100} placeholder="e.g. 12-01-75-01234" />
        </label>
        <label className={fieldLabel}>
          File
          <input
            className="block w-full mt-[7px] text-xs text-[#53665c] file:mr-3 file:rounded-md file:border-0 file:bg-[#e4f4ec] file:px-3 file:py-2 file:text-[11px] file:font-bold file:text-[#2f7a5c] file:cursor-pointer"
            type="file"
            accept={acceptedFiles}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            required
          />
          <span className="block mt-[6px] text-[10px] font-normal text-[#9aa8a1]">PDF, PNG, JPG, or WEBP · up to 10 MB</span>
        </label>
        {slot.document && <p className="m-0 text-[10px] text-[#b26a2c]">This replaces {slot.document.originalFilename}.</p>}
        {error && <p className="m-0 text-[11px] text-[#ae4d44]" role="alert">{error}</p>}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="border-0 text-[#286c54] bg-transparent cursor-pointer text-[11px] font-bold p-[10px]">Cancel</button>
          <button type="submit" disabled={isSaving} className="border-0 rounded-[7px] px-[17px] py-3 text-white bg-brand cursor-pointer text-xs font-bold min-w-[110px] disabled:opacity-60 disabled:cursor-not-allowed">
            {isSaving ? "Uploading…" : "Upload"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function PreviewModal({ owner, slot, onClose }: { owner: MemberDocumentsOwner; slot: MemberDocumentSlot; onClose: () => void }) {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getMemberDocumentFile(owner, slot.type.id)
      .then((file) => { if (!cancelled) setFileUrl(file.fileUrl); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : "Unable to open this document."); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [owner, slot.type.id]);

  const isImage = slot.document?.mimeType.startsWith("image/");

  return (
    <Modal title={slot.type.name} onClose={onClose} wide>
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="m-0 text-[11px] text-[#8b9992] truncate">
          {slot.document?.originalFilename}
          {slot.document?.documentNumber ? ` · No. ${slot.document.documentNumber}` : ""}
        </p>
        {fileUrl && (
          <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] font-bold text-brand no-underline shrink-0">
            Open in new tab <ExternalLink size={12} />
          </a>
        )}
      </div>
      {isLoading ? (
        <div className="h-[50vh] rounded-[10px] bg-[#edf1ee] animate-pulse" />
      ) : error ? (
        <p className="m-0 py-10 text-center text-[11px] text-[#ae4d44]" role="alert">{error}</p>
      ) : fileUrl ? (
        <div className="rounded-[10px] border border-[#e1e9e4] overflow-hidden bg-[#f6f8f6]">
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={fileUrl} alt={slot.type.name} className="block w-full max-h-[70vh] object-contain" />
          ) : (
            <iframe src={fileUrl} title={slot.type.name} className="w-full h-[70vh] border-0" />
          )}
        </div>
      ) : null}
    </Modal>
  );
}

/** Omit memberId for the signed-in member's own documents; pass it for superadmin management. */
export default function MemberDocumentsPanel({
  memberId,
  description,
}: {
  memberId?: string;
  description: string;
}) {
  const owner = useMemo<MemberDocumentsOwner>(() => (memberId ? { kind: "member", memberId } : { kind: "self" }), [memberId]);
  const [slots, setSlots] = useState<MemberDocumentSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [uploading, setUploading] = useState<MemberDocumentSlot | null>(null);
  const [previewing, setPreviewing] = useState<MemberDocumentSlot | null>(null);

  useEffect(() => {
    let cancelled = false;
    listMemberDocuments(owner)
      .then((data) => { if (!cancelled) setSlots(data); })
      .catch((error) => { if (!cancelled) setLoadError(error instanceof Error ? error.message : "Unable to load documents."); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [owner]);

  function replaceSlot(updated: MemberDocumentSlot) {
    setSlots((current) => current.map((slot) => (slot.type.id === updated.type.id ? updated : slot)));
  }

  async function remove(slot: MemberDocumentSlot) {
    if (!window.confirm(`Remove the uploaded ${slot.type.name}?`)) return;
    try {
      await deleteMemberDocument(owner, slot.type.id);
      replaceSlot({ ...slot, document: null });
      toast.success(`${slot.type.name} removed.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to remove this document.");
    }
  }

  const missingRequired = slots.filter((slot) => slot.type.isRequired && !slot.document);

  return (
    <section className="p-[29px] border border-[#e1e9e4] rounded-[10px] bg-white max-[500px]:px-4 max-[500px]:py-[19px]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="m-0 font-display font-bold text-xl text-ink">Documents</h2>
          <p className="m-0 mt-[6px] text-[#8b9992] text-[11px]">{description}</p>
        </div>
        {!isLoading && !loadError && slots.length > 0 && (
          <span className="px-[10px] py-[6px] rounded-2xl text-[10px] font-bold text-[#3c825b] bg-[#e6f3e6] whitespace-nowrap">
            {slots.filter((slot) => slot.document).length}/{slots.length} uploaded
          </span>
        )}
      </div>

      {missingRequired.length > 0 && (
        <div className="flex items-start gap-2 mt-5 p-3 rounded-lg border border-[#f4dfc4] bg-[#fdf6ec] text-[#9a5a22] text-[11px] leading-relaxed" role="status">
          <CircleAlert size={15} className="shrink-0 mt-px" />
          <span>Required: {missingRequired.map((slot) => slot.type.name).join(", ")} {missingRequired.length === 1 ? "is" : "are"} still missing.</span>
        </div>
      )}

      <div className="mt-5">
        {isLoading ? (
          <div className="space-y-3">
            {[0, 1].map((i) => <div key={i} className="h-[62px] rounded-lg bg-[#edf1ee] animate-pulse" />)}
          </div>
        ) : loadError ? (
          <p className="m-0 text-[11px] text-[#ae4d44]" role="alert">{loadError}</p>
        ) : slots.length === 0 ? (
          <p className="m-0 text-[11px] text-[#8b9992]">No document types have been set up yet.</p>
        ) : (
          slots.map((slot) => (
            <div key={slot.type.id} className="flex items-center gap-3 py-[14px] border-t border-[#edf1ee] first:border-t-0 max-[560px]:flex-wrap">
              <span className={"grid place-items-center w-9 h-9 rounded-lg shrink-0 " + (slot.document ? "text-[#2f7a5c] bg-[#e4f4ec]" : "text-[#9aa8a1] bg-[#f1f3f1]")}>
                {slot.document ? <FileCheck2 size={16} /> : <FileText size={16} />}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <strong className="text-[13px] text-ink truncate">{slot.type.name}</strong>
                  {slot.type.isRequired && <span className="px-[6px] py-px rounded text-[9px] font-bold uppercase tracking-wide text-[#9a5a22] bg-[#fbeddb]">Required</span>}
                </div>
                <p className="m-0 mt-[3px] text-[10px] text-[#8b9992] truncate">
                  {slot.document
                    ? [
                        slot.document.documentNumber ? `No. ${slot.document.documentNumber}` : null,
                        slot.document.originalFilename,
                        formatSize(slot.document.fileSize),
                        `Updated ${formatDate(slot.document.uploadedAt)}`,
                      ].filter(Boolean).join(" · ")
                    : slot.type.description || "Not uploaded yet"}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0 max-[560px]:w-full max-[560px]:justify-end">
                {slot.document ? (
                  <>
                    <button type="button" onClick={() => setPreviewing(slot)} className="inline-flex items-center gap-1 h-8 px-3 rounded-md border border-line bg-white text-[11px] font-bold text-[#2b6b54] cursor-pointer hover:border-brand/40">
                      <Eye size={13} /> View
                    </button>
                    <button type="button" onClick={() => setUploading(slot)} className="inline-flex items-center gap-1 h-8 px-3 rounded-md border border-line bg-white text-[11px] font-bold text-[#2b6b54] cursor-pointer hover:border-brand/40">
                      <Upload size={13} /> Replace
                    </button>
                    <button type="button" onClick={() => remove(slot)} className="grid place-items-center w-8 h-8 rounded-md border border-[#f3d6d3] bg-transparent text-[#ae4d44] cursor-pointer" aria-label={`Remove ${slot.type.name}`}>
                      <Trash2 size={13} />
                    </button>
                  </>
                ) : (
                  <button type="button" onClick={() => setUploading(slot)} className="inline-flex items-center gap-1 h-8 px-3 rounded-md border-0 bg-brand text-white text-[11px] font-bold cursor-pointer">
                    <Upload size={13} /> Upload
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {uploading && (
        <UploadModal
          owner={owner}
          slot={uploading}
          onClose={() => setUploading(null)}
          onUploaded={(updated) => {
            replaceSlot(updated);
            setUploading(null);
            toast.success(`${updated.type.name} uploaded.`);
          }}
        />
      )}
      {previewing && <PreviewModal owner={owner} slot={previewing} onClose={() => setPreviewing(null)} />}
    </section>
  );
}
