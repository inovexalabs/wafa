"use client";

import { FormEvent, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import SuperadminLayout from "../../../../components/superadmin-layout";
import {
  LandingItem,
  SaveLandingItemInput,
  createLandingItem,
  deleteLandingItem,
  listLandingItems,
  updateLandingItem,
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

const emptyForm: SaveLandingItemInput = {
  kind: "gallery",
  title: "",
  description: "",
  imageUrl: "",
  sortOrder: 0,
  isPublished: true,
};

export default function SuperadminLandingGalleryPage() {
  const [items, setItems] = useState<LandingItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [form, setForm] = useState<SaveLandingItemInput>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    listLandingItems("gallery")
      .then(setItems)
      .catch((error) => setLoadError(error instanceof Error ? error.message : "Unable to load the gallery."))
      .finally(() => setIsLoading(false));
  }, []);

  function startEdit(item: LandingItem) {
    setEditingId(item.id);
    setForm({
      kind: "gallery",
      title: item.title ?? "",
      description: item.description ?? "",
      imageUrl: item.imageUrl ?? "",
      sortOrder: item.sortOrder,
      isPublished: item.isPublished,
    });
    setSaveError("");
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setSaveError("");
  }

  async function handleImageChange(file: File | null) {
    if (!file) return;
    setIsUploading(true);
    setSaveError("");
    try {
      const { url } = await uploadLandingMedia(file);
      setForm((f) => ({ ...f, imageUrl: url }));
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Unable to upload this image.");
    } finally {
      setIsUploading(false);
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.imageUrl) {
      setSaveError("An image is required.");
      return;
    }
    setIsSaving(true);
    setSaveError("");
    try {
      if (editingId) {
        const updated = await updateLandingItem(editingId, form);
        setItems((current) => (current ?? []).map((i) => (i.id === editingId ? updated : i)));
      } else {
        const created = await createLandingItem(form);
        setItems((current) => [...(current ?? []), created]);
      }
      resetForm();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Unable to save this image.");
    } finally {
      setIsSaving(false);
    }
  }

  async function remove(id: string) {
    try {
      await deleteLandingItem(id);
      setItems((current) => (current ?? []).filter((i) => i.id !== id));
      if (editingId === id) resetForm();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Unable to delete this image.");
    }
  }

  return (
    <SuperadminLayout active="landing-gallery">
      <main className="max-w-[1000px] mx-auto px-6 pt-20 pb-14 max-[650px]:px-4 max-[650px]:pt-[68px]">
        <div className="mb-[30px]">
          <p className="mb-[13px] text-[11px] font-bold tracking-[.18em] uppercase text-brand">Public site</p>
          <h1 className="m-0 font-display font-bold text-[clamp(28px,4vw,40px)] leading-[1.1]">Gallery</h1>
          <p className="mt-[9px] text-muted text-sm">Manage the photo gallery shown on the landing page.</p>
        </div>

        {isLoading ? (
          <div className="h-[300px] rounded-[10px] bg-[#edf1ee] animate-pulse" />
        ) : loadError ? (
          <div className="p-5 rounded-2xl border border-[#f3d6d3] bg-[#fdf3f2] text-[#ae4d44] text-sm" role="alert">{loadError}</div>
        ) : (
          <div className="flex flex-col gap-6">
            <form onSubmit={save} className={card}>
              <h2 className={sectionTitle}>{editingId ? "Edit image" : "Add image"}</h2>
              <p className={sectionHint}>Upload a photo and optional caption.</p>
              <label className={label + " block mt-4"}>
                Image
                <input type="file" accept="image/*" className={fieldInput + " py-2"} onChange={(e) => handleImageChange(e.target.files?.[0] ?? null)} />
              </label>
              {isUploading && <p className="mt-2 text-[11px] text-[#8b9992]">Uploading…</p>}
              {form.imageUrl && <img src={form.imageUrl} alt="" className="mt-3 h-24 w-24 rounded-lg object-cover border border-[#edf1ee]" />}
              <div className="grid grid-cols-2 gap-[16px] mt-4 max-[650px]:grid-cols-1">
                <label className={label}>
                  Caption (optional)
                  <input className={fieldInput} value={form.title ?? ""} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
                </label>
                <label className={label}>
                  Sort order
                  <input type="number" className={fieldInput} value={form.sortOrder ?? 0} onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))} />
                </label>
              </div>
              <label className={label + " block mt-4"}>
                Details (optional)
                <textarea rows={2} className={fieldTextarea} value={form.description ?? ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </label>
              <label className={label + " flex items-center gap-2 mt-4"}>
                <input type="checkbox" checked={form.isPublished ?? true} onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))} />
                Published
              </label>

              {saveError && <p className="m-0 mt-3 text-[11px] text-[#ae4d44]" role="alert">{saveError}</p>}

              <div className="flex gap-[12px] mt-5">
                <button type="submit" disabled={isSaving} className="border-0 rounded-[7px] px-[22px] py-3 text-white bg-brand cursor-pointer text-xs font-bold min-w-[140px] disabled:opacity-60 disabled:cursor-not-allowed">
                  {isSaving ? "Saving…" : editingId ? "Save changes" : "Add image"}
                </button>
                {editingId && (
                  <button type="button" onClick={resetForm} className="rounded-[7px] px-[22px] py-3 bg-transparent border border-line text-xs font-bold text-ink cursor-pointer">
                    Cancel
                  </button>
                )}
              </div>
            </form>

            <section className={card}>
              <h2 className={sectionTitle}>Gallery images</h2>
              <p className={sectionHint}>{(items ?? []).length} total</p>
              <div className="grid grid-cols-3 gap-4 mt-4 max-[650px]:grid-cols-2 max-[420px]:grid-cols-1">
                {(items ?? []).length === 0 && <p className="text-[12px] text-[#8b9992]">No images yet.</p>}
                {(items ?? [])
                  .slice()
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((item) => (
                    <div key={item.id} className="border border-[#edf1ee] rounded-lg overflow-hidden">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt="" className="h-32 w-full object-cover" />
                      ) : (
                        <div className="h-32 w-full bg-[#edf1ee]" />
                      )}
                      <div className="p-3">
                        <p className="m-0 text-[11px] font-bold text-ink truncate">{item.title || "Untitled"}</p>
                        {!item.isPublished && <p className="m-0 mt-1 text-[10px] font-bold uppercase tracking-wide text-[#8b9992]">Hidden</p>}
                        <div className="flex gap-3 mt-2">
                          <button type="button" onClick={() => startEdit(item)} className="text-[11px] font-bold text-brand bg-transparent border-0 cursor-pointer">
                            Edit
                          </button>
                          <button type="button" onClick={() => remove(item.id)} className="text-[11px] font-bold text-[#ae4d44] bg-transparent border-0 cursor-pointer inline-flex items-center gap-1">
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      </div>
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
