"use client";

import { FormEvent, useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import SuperadminLayout from "../../../../components/superadmin-layout";
import SuperadminMembersTabs from "../../../../components/superadmin-members-tabs";
import {
  createDocumentType,
  deleteDocumentType,
  listDocumentTypes,
  MemberDocumentType,
  SaveDocumentTypeInput,
  updateDocumentType,
} from "../../../../lib/auth";

const fieldInput =
  "block w-full h-[42px] mt-[7px] border border-line rounded-md px-[11px] outline-none text-[#2d4037] bg-white font-inherit text-xs";
const fieldTextarea =
  "block w-full mt-[7px] border border-line rounded-md px-[11px] py-[9px] outline-none text-[#2d4037] bg-white font-inherit text-xs leading-relaxed resize-y";
const label = "text-[#53665c] text-[11px] font-bold";
const card = "p-[24px] border border-[#e1e9e4] rounded-[10px] bg-white max-[500px]:px-4 max-[500px]:py-[16px]";
const sectionTitle = "m-0 font-display font-bold text-lg text-ink";
const sectionHint = "m-0 mt-1 text-[#8b9992] text-[11px]";

const emptyForm: SaveDocumentTypeInput = { name: "", description: "", isRequired: false, sortOrder: 0 };

function sortTypes(types: MemberDocumentType[]) {
  return [...types].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
}

export default function SuperadminDocumentTypesPage() {
  const [types, setTypes] = useState<MemberDocumentType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [form, setForm] = useState<SaveDocumentTypeInput>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    listDocumentTypes()
      .then(setTypes)
      .catch((error) => setLoadError(error instanceof Error ? error.message : "Unable to load document types."))
      .finally(() => setIsLoading(false));
  }, []);

  function startEdit(type: MemberDocumentType) {
    setEditingId(type.id);
    setForm({ name: type.name, description: type.description ?? "", isRequired: type.isRequired, sortOrder: type.sortOrder });
    setSaveError("");
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setSaveError("");
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.name.trim()) {
      setSaveError("Name is required.");
      return;
    }
    setIsSaving(true);
    setSaveError("");
    try {
      if (editingId) {
        const updated = await updateDocumentType(editingId, form);
        setTypes((current) => sortTypes(current.map((type) => (type.id === editingId ? updated : type))));
        toast.success("Document type updated.");
      } else {
        const created = await createDocumentType(form);
        setTypes((current) => sortTypes([...current, created]));
        toast.success("Document type added.");
      }
      resetForm();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Unable to save this document type.");
    } finally {
      setIsSaving(false);
    }
  }

  async function remove(type: MemberDocumentType) {
    const uploads = type.uploadCount ?? 0;
    const warning = uploads
      ? `Delete "${type.name}"? ${uploads} member upload${uploads === 1 ? "" : "s"} of this document will be permanently deleted too.`
      : `Delete "${type.name}"?`;
    if (!window.confirm(warning)) return;
    try {
      await deleteDocumentType(type.id);
      setTypes((current) => current.filter((item) => item.id !== type.id));
      if (editingId === type.id) resetForm();
      toast.success("Document type deleted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete this document type.");
    }
  }

  return (
    <SuperadminLayout active="members">
      <main className="max-w-[1000px] mx-auto px-6 pt-20 pb-14 max-[650px]:px-4 max-[650px]:pt-[68px]">
        <div className="mb-6">
          <p className="mb-[13px] text-[11px] font-bold tracking-[.18em] uppercase text-brand">People</p>
          <h1 className="m-0 font-display font-bold text-[clamp(28px,4vw,42px)] leading-[1.1]">Members</h1>
          <p className="mt-[9px] mb-6 text-muted text-sm">Choose which documents members upload to their profile.</p>
          <SuperadminMembersTabs active="document-types" />
        </div>

        {isLoading ? (
          <div className="h-[300px] rounded-[10px] bg-[#edf1ee] animate-pulse" />
        ) : loadError ? (
          <div className="p-5 rounded-2xl border border-[#f3d6d3] bg-[#fdf3f2] text-[#ae4d44] text-sm" role="alert">{loadError}</div>
        ) : (
          <div className="flex flex-col gap-6">
            <form onSubmit={save} className={card}>
              <h2 className={sectionTitle}>{editingId ? "Edit document type" : "Add document type"}</h2>
              <p className={sectionHint}>Members see every type on their profile. Required types are flagged until uploaded.</p>
              <div className="grid grid-cols-[1fr_140px] gap-[16px] mt-4 max-[650px]:grid-cols-1">
                <label className={label}>
                  Name
                  <input className={fieldInput} value={form.name} maxLength={100} placeholder="e.g. PAN card" onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                </label>
                <label className={label}>
                  Sort order
                  <input
                    className={fieldInput}
                    type="number"
                    value={form.sortOrder ?? 0}
                    onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) || 0 }))}
                  />
                </label>
              </div>
              <label className={label + " block mt-4"}>
                Instructions for members <span className="text-[#9aa8a1] text-[10px] font-normal">Optional</span>
                <textarea rows={2} className={fieldTextarea} placeholder="e.g. Front and back in one PDF." value={form.description ?? ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </label>
              <label className={label + " flex items-center gap-2 mt-4"}>
                <input type="checkbox" checked={form.isRequired ?? false} onChange={(e) => setForm((f) => ({ ...f, isRequired: e.target.checked }))} />
                Required for every member
              </label>

              {saveError && <p className="m-0 mt-3 text-[11px] text-[#ae4d44]" role="alert">{saveError}</p>}

              <div className="flex gap-[12px] mt-5">
                <button type="submit" disabled={isSaving} className="border-0 rounded-[7px] px-[22px] py-3 text-white bg-brand cursor-pointer text-xs font-bold min-w-[140px] disabled:opacity-60 disabled:cursor-not-allowed">
                  {isSaving ? "Saving…" : editingId ? "Save changes" : "Add type"}
                </button>
                {editingId && (
                  <button type="button" onClick={resetForm} className="rounded-[7px] px-[22px] py-3 bg-transparent border border-line text-xs font-bold text-ink cursor-pointer">
                    Cancel
                  </button>
                )}
              </div>
            </form>

            <section className={card}>
              <h2 className={sectionTitle}>Document types</h2>
              <p className={sectionHint}>{types.length} total</p>
              <div className="flex flex-col gap-3 mt-4">
                {types.length === 0 && <p className="text-[12px] text-[#8b9992]">No document types yet. Add one above.</p>}
                {types.map((type) => (
                  <div key={type.id} className={"flex items-center gap-4 p-4 border rounded-lg " + (editingId === type.id ? "border-brand/40 bg-[#f7faf7]" : "border-[#edf1ee]")}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="m-0 text-sm font-bold text-ink truncate">{type.name}</p>
                        {type.isRequired && <span className="px-[6px] py-px rounded text-[9px] font-bold uppercase tracking-wide text-[#9a5a22] bg-[#fbeddb]">Required</span>}
                      </div>
                      <p className="m-0 mt-[3px] text-[11px] text-[#8b9992] truncate">
                        {type.uploadCount ?? 0} upload{type.uploadCount === 1 ? "" : "s"}
                        {type.description ? ` · ${type.description}` : ""}
                      </p>
                    </div>
                    <button type="button" onClick={() => startEdit(type)} className="grid place-items-center h-[34px] w-[34px] rounded-md border border-line text-brand bg-transparent cursor-pointer flex-shrink-0" aria-label={`Edit ${type.name}`}>
                      <Pencil size={14} />
                    </button>
                    <button type="button" onClick={() => remove(type)} className="h-[34px] w-[34px] grid place-items-center rounded-md border border-[#f3d6d3] text-[#ae4d44] bg-transparent cursor-pointer flex-shrink-0" aria-label={`Delete ${type.name}`}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </main>
    </SuperadminLayout>
  );
}
