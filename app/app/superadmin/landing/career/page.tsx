"use client";

import { FormEvent, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import SuperadminLayout from "../../../../components/superadmin-layout";
import {
  CareerOpening,
  SaveCareerOpeningInput,
  createCareerOpening,
  deleteCareerOpening,
  listCareerOpenings,
  updateCareerOpening,
} from "../../../../lib/auth";

const fieldInput =
  "block w-full h-[42px] mt-[7px] border border-line rounded-md px-[11px] outline-none text-[#2d4037] bg-white font-inherit text-xs";
const fieldTextarea =
  "block w-full mt-[7px] border border-line rounded-md px-[11px] py-[9px] outline-none text-[#2d4037] bg-white font-inherit text-xs leading-relaxed resize-y";
const label = "text-[#53665c] text-[11px] font-bold";
const card = "p-6 border border-[#e1e9e4] rounded-[10px] bg-white p-[24px] max-[500px]:px-4 max-[500px]:py-[16px]";
const sectionTitle = "m-0 font-display font-bold text-lg text-ink";
const sectionHint = "m-0 mt-1 text-[#8b9992] text-[11px]";

const emptyForm: SaveCareerOpeningInput = {
  title: "",
  description: "",
  location: "",
  employmentType: "",
  applyEmail: "",
  applyUrl: "",
  isOpen: true,
};

export default function SuperadminLandingCareerPage() {
  const [openings, setOpenings] = useState<CareerOpening[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [form, setForm] = useState<SaveCareerOpeningInput>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    listCareerOpenings()
      .then(setOpenings)
      .catch((error) => setLoadError(error instanceof Error ? error.message : "Unable to load career openings."))
      .finally(() => setIsLoading(false));
  }, []);

  function startEdit(opening: CareerOpening) {
    setEditingId(opening.id);
    setForm({
      title: opening.title,
      description: opening.description ?? "",
      location: opening.location ?? "",
      employmentType: opening.employmentType ?? "",
      applyEmail: opening.applyEmail ?? "",
      applyUrl: opening.applyUrl ?? "",
      isOpen: opening.isOpen,
    });
    setSaveError("");
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setSaveError("");
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.title.trim()) {
      setSaveError("Title is required.");
      return;
    }
    setIsSaving(true);
    setSaveError("");
    try {
      if (editingId) {
        const updated = await updateCareerOpening(editingId, form);
        setOpenings((current) => (current ?? []).map((o) => (o.id === editingId ? updated : o)));
      } else {
        const created = await createCareerOpening(form);
        setOpenings((current) => [...(current ?? []), created]);
      }
      resetForm();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Unable to save this opening.");
    } finally {
      setIsSaving(false);
    }
  }

  async function remove(id: string) {
    try {
      await deleteCareerOpening(id);
      setOpenings((current) => (current ?? []).filter((o) => o.id !== id));
      if (editingId === id) resetForm();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Unable to delete this opening.");
    }
  }

  return (
    <SuperadminLayout active="landing-career">
      <main className="max-w-[1000px] mx-auto px-6 pt-20 pb-14 max-[650px]:px-4 max-[650px]:pt-[68px]">
        <div className="mb-[30px]">
          <p className="mb-[13px] text-[11px] font-bold tracking-[.18em] uppercase text-brand">Public site</p>
          <h1 className="m-0 font-display font-bold text-[clamp(28px,4vw,40px)] leading-[1.1]">Careers</h1>
          <p className="mt-[9px] text-muted text-sm">Manage job openings shown on the public careers page.</p>
        </div>

        {isLoading ? (
          <div className="h-[300px] rounded-[10px] bg-[#edf1ee] animate-pulse" />
        ) : loadError ? (
          <div className="p-5 rounded-2xl border border-[#f3d6d3] bg-[#fdf3f2] text-[#ae4d44] text-sm" role="alert">{loadError}</div>
        ) : (
          <div className="flex flex-col gap-6">
            <form onSubmit={save} className={card}>
              <h2 className={sectionTitle}>{editingId ? "Edit opening" : "Add opening"}</h2>
              <p className={sectionHint}>Fill in the details below.</p>
              <label className={label + " block mt-4"}>
                Title
                <input className={fieldInput} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
              </label>
              <div className="grid grid-cols-2 gap-[16px] mt-4 max-[650px]:grid-cols-1">
                <label className={label}>
                  Location
                  <input className={fieldInput} value={form.location ?? ""} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
                </label>
                <label className={label}>
                  Employment type
                  <input className={fieldInput} placeholder="Full-time" value={form.employmentType ?? ""} onChange={(e) => setForm((f) => ({ ...f, employmentType: e.target.value }))} />
                </label>
                <label className={label}>
                  Apply email
                  <input className={fieldInput} value={form.applyEmail ?? ""} onChange={(e) => setForm((f) => ({ ...f, applyEmail: e.target.value }))} />
                </label>
                <label className={label}>
                  Apply URL
                  <input className={fieldInput} value={form.applyUrl ?? ""} onChange={(e) => setForm((f) => ({ ...f, applyUrl: e.target.value }))} />
                </label>
              </div>
              <label className={label + " block mt-4"}>
                Description
                <textarea rows={4} className={fieldTextarea} value={form.description ?? ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </label>
              <label className={label + " flex items-center gap-2 mt-4"}>
                <input type="checkbox" checked={form.isOpen ?? true} onChange={(e) => setForm((f) => ({ ...f, isOpen: e.target.checked }))} />
                Open for applications
              </label>

              {saveError && <p className="m-0 mt-3 text-[11px] text-[#ae4d44]" role="alert">{saveError}</p>}

              <div className="flex gap-[12px] mt-5">
                <button type="submit" disabled={isSaving} className="border-0 rounded-[7px] px-[22px] py-3 text-white bg-brand cursor-pointer text-xs font-bold min-w-[140px] disabled:opacity-60 disabled:cursor-not-allowed">
                  {isSaving ? "Saving…" : editingId ? "Save changes" : "Add opening"}
                </button>
                {editingId && (
                  <button type="button" onClick={resetForm} className="rounded-[7px] px-[22px] py-3 bg-transparent border border-line text-xs font-bold text-ink cursor-pointer">
                    Cancel
                  </button>
                )}
              </div>
            </form>

            <section className={card}>
              <h2 className={sectionTitle}>Openings</h2>
              <p className={sectionHint}>{(openings ?? []).length} total</p>
              <div className="flex flex-col gap-3 mt-4">
                {(openings ?? []).length === 0 && <p className="text-[12px] text-[#8b9992]">No openings yet.</p>}
                {(openings ?? []).map((opening) => (
                  <div key={opening.id} className="flex items-center gap-4 p-4 border border-[#edf1ee] rounded-lg max-[500px]:gap-3 max-[500px]:p-3">
                    <div className="flex-1 min-w-0">
                      <p className="m-0 text-sm font-bold text-ink truncate">{opening.title}</p>
                      <p className="m-0 text-[11px] text-[#8b9992] truncate">
                        {[opening.location, opening.employmentType].filter(Boolean).join(" · ") || "—"}
                      </p>
                    </div>
                    <span
                      className={
                        "text-[10px] font-bold uppercase tracking-wide rounded-full px-2 py-0.5 border " +
                        (opening.isOpen ? "text-[#38805d] border-[#cfe8db]" : "text-[#8b9992] border-[#e1e9e4]")
                      }
                    >
                      {opening.isOpen ? "Open" : "Closed"}
                    </span>
                    <button type="button" onClick={() => startEdit(opening)} className="text-[11px] font-bold text-brand bg-transparent border-0 cursor-pointer">
                      Edit
                    </button>
                    <button type="button" onClick={() => remove(opening.id)} className="h-[34px] w-[34px] grid place-items-center rounded-md border border-[#f3d6d3] text-[#ae4d44] bg-transparent cursor-pointer flex-shrink-0">
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
