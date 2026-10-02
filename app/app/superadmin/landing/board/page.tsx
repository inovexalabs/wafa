"use client";

import { FormEvent, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import SuperadminLayout from "../../../../components/superadmin-layout";
import {
  LandingPerson,
  SaveLandingPersonInput,
  createLandingPerson,
  deleteLandingPerson,
  listLandingPeople,
  updateLandingPerson,
  uploadLandingMedia,
} from "../../../../lib/auth";

const fieldInput =
  "block w-full h-[42px] mt-[7px] border border-line rounded-md px-[11px] outline-none text-[#2d4037] bg-white font-inherit text-xs";
const fieldTextarea =
  "block w-full mt-[7px] border border-line rounded-md px-[11px] py-[9px] outline-none text-[#2d4037] bg-white font-inherit text-xs leading-relaxed resize-y";
const label = "text-[#53665c] text-[11px] font-bold";
const card = "p-6 border border-[#e1e9e4] rounded-[10px] bg-white p-[24px] max-[500px]:px-4 max-[500px]:py-[16px]";
const sectionTitle = "m-0 font-display font-bold text-lg text-ink";
const sectionHint = "m-0 mt-1 text-[#8b9992] text-[11px]";

const emptyForm: SaveLandingPersonInput = {
  kind: "board",
  name: "",
  title: "",
  photoUrl: "",
  bio: "",
  sortOrder: 0,
  isPublished: true,
};

export default function SuperadminLandingBoardPage() {
  const [people, setPeople] = useState<LandingPerson[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [form, setForm] = useState<SaveLandingPersonInput>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    listLandingPeople("board")
      .then(setPeople)
      .catch((error) => setLoadError(error instanceof Error ? error.message : "Unable to load the board members."))
      .finally(() => setIsLoading(false));
  }, []);

  function startEdit(person: LandingPerson) {
    setEditingId(person.id);
    setForm({
      kind: "board",
      name: person.name,
      title: person.title ?? "",
      photoUrl: person.photoUrl ?? "",
      bio: person.bio ?? "",
      sortOrder: person.sortOrder,
      isPublished: person.isPublished,
    });
    setSaveError("");
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setSaveError("");
  }

  async function handlePhotoChange(file: File | null) {
    if (!file) return;
    setIsUploading(true);
    setSaveError("");
    try {
      const { url } = await uploadLandingMedia(file);
      setForm((f) => ({ ...f, photoUrl: url }));
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Unable to upload this photo.");
    } finally {
      setIsUploading(false);
    }
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
        const updated = await updateLandingPerson(editingId, form);
        setPeople((current) => (current ?? []).map((p) => (p.id === editingId ? updated : p)));
      } else {
        const created = await createLandingPerson(form);
        setPeople((current) => [...(current ?? []), created]);
      }
      resetForm();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Unable to save this board member.");
    } finally {
      setIsSaving(false);
    }
  }

  async function remove(id: string) {
    try {
      await deleteLandingPerson(id);
      setPeople((current) => (current ?? []).filter((p) => p.id !== id));
      if (editingId === id) resetForm();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Unable to delete this board member.");
    }
  }

  return (
    <SuperadminLayout active="landing-board">
      <main className="max-w-[1000px] mx-auto px-6 pt-20 pb-14 max-[650px]:px-4 max-[650px]:pt-[68px]">
        <div className="mb-[30px]">
          <p className="mb-[13px] text-[11px] font-bold tracking-[.18em] uppercase text-brand">Public site</p>
          <h1 className="m-0 font-display font-bold text-[clamp(28px,4vw,40px)] leading-[1.1]">Board & Direction</h1>
          <p className="mt-[9px] text-muted text-sm">Manage the people shown on the board section of the landing page.</p>
        </div>

        {isLoading ? (
          <div className="h-[300px] rounded-[10px] bg-[#edf1ee] animate-pulse" />
        ) : loadError ? (
          <div className="p-5 rounded-2xl border border-[#f3d6d3] bg-[#fdf3f2] text-[#ae4d44] text-sm" role="alert">{loadError}</div>
        ) : (
          <div className="flex flex-col gap-6">
            <form onSubmit={save} className={card}>
              <h2 className={sectionTitle}>{editingId ? "Edit board member" : "Add board member"}</h2>
              <p className={sectionHint}>Fill in the details below.</p>
              <div className="grid grid-cols-2 gap-[16px] mt-5 max-[650px]:grid-cols-1">
                <label className={label}>
                  Name
                  <input className={fieldInput} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                </label>
                <label className={label}>
                  Title
                  <input className={fieldInput} value={form.title ?? ""} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
                </label>
                <label className={label}>
                  Sort order
                  <input type="number" className={fieldInput} value={form.sortOrder ?? 0} onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))} />
                </label>
                <label className={label + " flex items-center gap-2 mt-[7px]"}>
                  <input type="checkbox" checked={form.isPublished ?? true} onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))} />
                  Published
                </label>
              </div>
              <label className={label + " block mt-4"}>
                Photo
                <input type="file" accept="image/*" className={fieldInput + " py-2"} onChange={(e) => handlePhotoChange(e.target.files?.[0] ?? null)} />
              </label>
              {isUploading && <p className="mt-2 text-[11px] text-[#8b9992]">Uploading…</p>}
              {form.photoUrl && <img src={form.photoUrl} alt="" className="mt-3 h-20 w-20 rounded-lg object-cover border border-[#edf1ee]" />}
              <label className={label + " block mt-4"}>
                Bio
                <textarea rows={3} className={fieldTextarea} value={form.bio ?? ""} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} />
              </label>

              {saveError && <p className="m-0 mt-3 text-[11px] text-[#ae4d44]" role="alert">{saveError}</p>}

              <div className="flex gap-[12px] mt-5">
                <button type="submit" disabled={isSaving} className="border-0 rounded-[7px] px-[22px] py-3 text-white bg-brand cursor-pointer text-xs font-bold min-w-[140px] disabled:opacity-60 disabled:cursor-not-allowed">
                  {isSaving ? "Saving…" : editingId ? "Save changes" : "Add board member"}
                </button>
                {editingId && (
                  <button type="button" onClick={resetForm} className="rounded-[7px] px-[22px] py-3 bg-transparent border border-line text-xs font-bold text-ink cursor-pointer">
                    Cancel
                  </button>
                )}
              </div>
            </form>

            <section className={card}>
              <h2 className={sectionTitle}>Board members</h2>
              <p className={sectionHint}>{(people ?? []).length} total</p>
              <div className="flex flex-col gap-3 mt-4">
                {(people ?? []).length === 0 && <p className="text-[12px] text-[#8b9992]">No board members yet.</p>}
                {(people ?? [])
                  .slice()
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((person) => (
                    <div key={person.id} className="flex items-center gap-4 p-4 border border-[#edf1ee] rounded-lg">
                      {person.photoUrl ? (
                        <img src={person.photoUrl} alt="" className="h-12 w-12 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-[#edf1ee] flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="m-0 text-sm font-bold text-ink truncate">{person.name}</p>
                        <p className="m-0 text-[11px] text-[#8b9992] truncate">{person.title || "—"}</p>
                      </div>
                      {!person.isPublished && (
                        <span className="text-[10px] font-bold uppercase tracking-wide text-[#8b9992] border border-[#e1e9e4] rounded-full px-2 py-0.5">Hidden</span>
                      )}
                      <button type="button" onClick={() => startEdit(person)} className="text-[11px] font-bold text-brand bg-transparent border-0 cursor-pointer">
                        Edit
                      </button>
                      <button type="button" onClick={() => remove(person.id)} className="h-[34px] w-[34px] grid place-items-center rounded-md border border-[#f3d6d3] text-[#ae4d44] bg-transparent cursor-pointer flex-shrink-0">
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
