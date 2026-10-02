"use client";

import { FormEvent, useEffect, useState } from "react";
import { ExternalLink, Trash2 } from "lucide-react";
import SuperadminLayout from "../../../../components/superadmin-layout";
import {
  PublicDocument,
  deletePublicDocument,
  listPublicDocuments,
  updatePublicDocumentMeta,
  uploadPublicDocument,
} from "../../../../lib/auth";

const fieldInput =
  "block w-full h-[42px] mt-[7px] border border-line rounded-md px-[11px] outline-none text-[#2d4037] bg-white font-inherit text-xs";
const fieldTextarea =
  "block w-full mt-[7px] border border-line rounded-md px-[11px] py-[9px] outline-none text-[#2d4037] bg-white font-inherit text-xs leading-relaxed resize-y";
const label = "text-[#53665c] text-[11px] font-bold";
const card = "p-6 border border-[#e1e9e4] rounded-[10px] bg-white p-[24px] max-[500px]:px-4 max-[500px]:py-[16px]";
const sectionTitle = "m-0 font-display font-bold text-lg text-ink";
const sectionHint = "m-0 mt-1 text-[#8b9992] text-[11px]";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function SuperadminLandingDocumentsPage() {
  const [documents, setDocuments] = useState<PublicDocument[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ title: string; description: string; sortOrder: number; isPublished: boolean } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState("");

  useEffect(() => {
    listPublicDocuments()
      .then(setDocuments)
      .catch((error) => setLoadError(error instanceof Error ? error.message : "Unable to load documents."))
      .finally(() => setIsLoading(false));
  }, []);

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!uploadFile) {
      setUploadError("Choose a file to upload.");
      return;
    }
    setIsUploading(true);
    setUploadError("");
    try {
      const created = await uploadPublicDocument(uploadFile, {
        title: uploadTitle.trim() || undefined,
        description: uploadDescription.trim() || undefined,
      });
      setDocuments((current) => [...(current ?? []), created]);
      setUploadFile(null);
      setUploadTitle("");
      setUploadDescription("");
      const fileInput = document.getElementById("doc-file-input") as HTMLInputElement | null;
      if (fileInput) fileInput.value = "";
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Unable to upload this document.");
    } finally {
      setIsUploading(false);
    }
  }

  function startEdit(doc: PublicDocument) {
    setEditingId(doc.id);
    setEditForm({
      title: doc.title,
      description: doc.description ?? "",
      sortOrder: doc.sortOrder,
      isPublished: doc.isPublished,
    });
    setEditError("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(null);
    setEditError("");
  }

  async function saveEdit() {
    if (!editingId || !editForm) return;
    setIsSaving(true);
    setEditError("");
    try {
      const updated = await updatePublicDocumentMeta(editingId, editForm);
      setDocuments((current) => (current ?? []).map((d) => (d.id === editingId ? updated : d)));
      cancelEdit();
    } catch (error) {
      setEditError(error instanceof Error ? error.message : "Unable to update this document.");
    } finally {
      setIsSaving(false);
    }
  }

  async function remove(id: string) {
    try {
      await deletePublicDocument(id);
      setDocuments((current) => (current ?? []).filter((d) => d.id !== id));
      if (editingId === id) cancelEdit();
    } catch (error) {
      setEditError(error instanceof Error ? error.message : "Unable to delete this document.");
    }
  }

  return (
    <SuperadminLayout active="landing-documents">
      <main className="max-w-[1000px] mx-auto px-6 pt-20 pb-14 max-[650px]:px-4 max-[650px]:pt-[68px]">
        <div className="mb-[30px]">
          <p className="mb-[13px] text-[11px] font-bold tracking-[.18em] uppercase text-brand">Public site</p>
          <h1 className="m-0 font-display font-bold text-[clamp(28px,4vw,40px)] leading-[1.1]">Documents</h1>
          <p className="mt-[9px] text-muted text-sm">Manage downloadable documents shown on the public site.</p>
        </div>

        {isLoading ? (
          <div className="h-[300px] rounded-[10px] bg-[#edf1ee] animate-pulse" />
        ) : loadError ? (
          <div className="p-5 rounded-2xl border border-[#f3d6d3] bg-[#fdf3f2] text-[#ae4d44] text-sm" role="alert">{loadError}</div>
        ) : (
          <div className="flex flex-col gap-6">
            <form onSubmit={handleUpload} className={card}>
              <h2 className={sectionTitle}>Upload document</h2>
              <p className={sectionHint}>PDFs and other files visitors can download from the public site.</p>
              <label className={label + " block mt-4"}>
                File
                <input
                  id="doc-file-input"
                  type="file"
                  className={fieldInput + " py-2"}
                  onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                />
              </label>
              <div className="grid grid-cols-2 gap-[16px] mt-4 max-[650px]:grid-cols-1">
                <label className={label}>
                  Title (optional)
                  <input className={fieldInput} value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} />
                </label>
              </div>
              <label className={label + " block mt-4"}>
                Description (optional)
                <textarea rows={2} className={fieldTextarea} value={uploadDescription} onChange={(e) => setUploadDescription(e.target.value)} />
              </label>

              {uploadError && <p className="m-0 mt-3 text-[11px] text-[#ae4d44]" role="alert">{uploadError}</p>}

              <div className="mt-5">
                <button type="submit" disabled={isUploading} className="border-0 rounded-[7px] px-[22px] py-3 text-white bg-brand cursor-pointer text-xs font-bold min-w-[140px] disabled:opacity-60 disabled:cursor-not-allowed">
                  {isUploading ? "Uploading…" : "Upload"}
                </button>
              </div>
            </form>

            <section className={card}>
              <h2 className={sectionTitle}>Documents</h2>
              <p className={sectionHint}>{(documents ?? []).length} total</p>
              {editError && <p className="m-0 mt-3 text-[11px] text-[#ae4d44]" role="alert">{editError}</p>}
              <div className="flex flex-col gap-3 mt-4">
                {(documents ?? []).length === 0 && <p className="text-[12px] text-[#8b9992]">No documents yet.</p>}
                {(documents ?? [])
                  .slice()
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((doc) =>
                    editingId === doc.id && editForm ? (
                      <div key={doc.id} className="p-4 border border-[#edf1ee] rounded-lg">
                        <label className={label}>
                          Title
                          <input className={fieldInput} value={editForm.title} onChange={(e) => setEditForm((f) => (f ? { ...f, title: e.target.value } : f))} />
                        </label>
                        <label className={label + " block mt-3"}>
                          Description
                          <textarea rows={2} className={fieldTextarea} value={editForm.description} onChange={(e) => setEditForm((f) => (f ? { ...f, description: e.target.value } : f))} />
                        </label>
                        <div className="grid grid-cols-2 gap-[16px] mt-3 max-[650px]:grid-cols-1">
                          <label className={label}>
                            Sort order
                            <input type="number" className={fieldInput} value={editForm.sortOrder} onChange={(e) => setEditForm((f) => (f ? { ...f, sortOrder: Number(e.target.value) } : f))} />
                          </label>
                          <label className={label + " flex items-center gap-2 mt-[7px]"}>
                            <input type="checkbox" checked={editForm.isPublished} onChange={(e) => setEditForm((f) => (f ? { ...f, isPublished: e.target.checked } : f))} />
                            Published
                          </label>
                        </div>
                        <div className="flex gap-[10px] mt-4">
                          <button type="button" disabled={isSaving} onClick={saveEdit} className="border-0 rounded-[7px] px-[18px] py-2.5 text-white bg-brand cursor-pointer text-xs font-bold disabled:opacity-60">
                            {isSaving ? "Saving…" : "Save"}
                          </button>
                          <button type="button" onClick={cancelEdit} className="rounded-[7px] px-[18px] py-2.5 bg-transparent border border-line text-xs font-bold text-ink cursor-pointer">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div key={doc.id} className="flex items-center gap-4 p-4 border border-[#edf1ee] rounded-lg">
                        <div className="flex-1 min-w-0">
                          <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-bold text-ink no-underline hover:text-brand">
                            {doc.title} <ExternalLink size={12} />
                          </a>
                          <p className="m-0 mt-1 text-[11px] text-[#8b9992] truncate">
                            {doc.originalFilename} · {formatBytes(doc.fileSize)}
                          </p>
                        </div>
                        {!doc.isPublished && (
                          <span className="text-[10px] font-bold uppercase tracking-wide text-[#8b9992] border border-[#e1e9e4] rounded-full px-2 py-0.5">Hidden</span>
                        )}
                        <button type="button" onClick={() => startEdit(doc)} className="text-[11px] font-bold text-brand bg-transparent border-0 cursor-pointer">
                          Edit
                        </button>
                        <button type="button" onClick={() => remove(doc.id)} className="h-[34px] w-[34px] grid place-items-center rounded-md border border-[#f3d6d3] text-[#ae4d44] bg-transparent cursor-pointer flex-shrink-0">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ),
                  )}
              </div>
            </section>
          </div>
        )}
      </main>
    </SuperadminLayout>
  );
}
