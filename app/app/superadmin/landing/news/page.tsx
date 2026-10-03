"use client";

import { FormEvent, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import SuperadminLayout from "../../../../components/superadmin-layout";
import {
  NewsPost,
  SaveNewsPostInput,
  createNewsPost,
  deleteNewsPost,
  listNewsPosts,
  updateNewsPost,
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

const emptyForm: SaveNewsPostInput = {
  category: "news",
  title: "",
  slug: "",
  body: "",
  coverImageUrl: "",
  isPublished: true,
  publishedAt: "",
};

export default function SuperadminLandingNewsPage() {
  const [posts, setPosts] = useState<NewsPost[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [form, setForm] = useState<SaveNewsPostInput>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    listNewsPosts()
      .then(setPosts)
      .catch((error) => setLoadError(error instanceof Error ? error.message : "Unable to load posts."))
      .finally(() => setIsLoading(false));
  }, []);

  function startEdit(post: NewsPost) {
    setEditingId(post.id);
    setForm({
      category: post.category,
      title: post.title,
      slug: post.slug ?? "",
      body: post.body,
      coverImageUrl: post.coverImageUrl ?? "",
      isPublished: post.isPublished,
      publishedAt: post.publishedAt ? post.publishedAt.slice(0, 16) : "",
    });
    setSaveError("");
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setSaveError("");
  }

  async function handleCoverChange(file: File | null) {
    if (!file) return;
    setIsUploading(true);
    setSaveError("");
    try {
      const { url } = await uploadLandingMedia(file);
      setForm((f) => ({ ...f, coverImageUrl: url }));
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Unable to upload this image.");
    } finally {
      setIsUploading(false);
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.title.trim()) {
      setSaveError("Title is required.");
      return;
    }
    if (!form.body.trim()) {
      setSaveError("Body is required.");
      return;
    }
    setIsSaving(true);
    setSaveError("");
    try {
      const payload: SaveNewsPostInput = {
        ...form,
        slug: form.slug?.trim() || undefined,
        publishedAt: form.publishedAt?.trim() || undefined,
      };
      if (editingId) {
        const updated = await updateNewsPost(editingId, payload);
        setPosts((current) => (current ?? []).map((p) => (p.id === editingId ? updated : p)));
      } else {
        const created = await createNewsPost(payload);
        setPosts((current) => [...(current ?? []), created]);
      }
      resetForm();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Unable to save this post.");
    } finally {
      setIsSaving(false);
    }
  }

  async function remove(id: string) {
    try {
      await deleteNewsPost(id);
      setPosts((current) => (current ?? []).filter((p) => p.id !== id));
      if (editingId === id) resetForm();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Unable to delete this post.");
    }
  }

  return (
    <SuperadminLayout active="landing-news">
      <main className="max-w-[1000px] mx-auto px-6 pt-20 pb-14 max-[650px]:px-4 max-[650px]:pt-[68px]">
        <div className="mb-[30px]">
          <p className="mb-[13px] text-[11px] font-bold tracking-[.18em] uppercase text-brand">Public site</p>
          <h1 className="m-0 font-display font-bold text-[clamp(28px,4vw,40px)] leading-[1.1]">News &amp; Notices</h1>
          <p className="mt-[9px] text-muted text-sm">Manage news articles and notices shown on the public site.</p>
        </div>

        {isLoading ? (
          <div className="h-[300px] rounded-[10px] bg-[#edf1ee] animate-pulse" />
        ) : loadError ? (
          <div className="p-5 rounded-2xl border border-[#f3d6d3] bg-[#fdf3f2] text-[#ae4d44] text-sm" role="alert">{loadError}</div>
        ) : (
          <div className="flex flex-col gap-6">
            <form onSubmit={save} className={card}>
              <h2 className={sectionTitle}>{editingId ? "Edit post" : "Add post"}</h2>
              <p className={sectionHint}>Fill in the details below.</p>
              <div className="grid grid-cols-2 gap-[16px] mt-5 max-[650px]:grid-cols-1">
                <label className={label}>
                  Category
                  <select
                    className={fieldInput}
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as "news" | "notice" }))}
                  >
                    <option value="news">News</option>
                    <option value="notice">Notice</option>
                  </select>
                </label>
                <label className={label}>
                  Title
                  <input className={fieldInput} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
                </label>
                <label className={label}>
                  Slug (optional)
                  <input className={fieldInput} value={form.slug ?? ""} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
                </label>
                <label className={label}>
                  Published at (optional)
                  <input type="datetime-local" className={fieldInput} value={form.publishedAt ?? ""} onChange={(e) => setForm((f) => ({ ...f, publishedAt: e.target.value }))} />
                </label>
              </div>
              <p className={sectionHint + " mt-1"}>Leave slug blank to auto-generate it from the title.</p>
              <label className={label + " block mt-4"}>
                Cover image
                <input type="file" accept="image/*" className={fieldInput + " py-2"} onChange={(e) => handleCoverChange(e.target.files?.[0] ?? null)} />
              </label>
              {isUploading && <p className="mt-2 text-[11px] text-[#8b9992]">Uploading…</p>}
              {form.coverImageUrl && <img src={form.coverImageUrl} alt="" className="mt-3 h-24 w-full max-w-sm rounded-lg object-cover border border-[#edf1ee]" />}
              <label className={label + " block mt-4"}>
                Body
                <textarea rows={8} className={fieldTextarea} value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} />
              </label>
              <label className={label + " flex items-center gap-2 mt-4"}>
                <input type="checkbox" checked={form.isPublished ?? true} onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))} />
                Published
              </label>

              {saveError && <p className="m-0 mt-3 text-[11px] text-[#ae4d44]" role="alert">{saveError}</p>}

              <div className="flex gap-[12px] mt-5">
                <button type="submit" disabled={isSaving} className="border-0 rounded-[7px] px-[22px] py-3 text-white bg-brand cursor-pointer text-xs font-bold min-w-[140px] disabled:opacity-60 disabled:cursor-not-allowed">
                  {isSaving ? "Saving…" : editingId ? "Save changes" : "Add post"}
                </button>
                {editingId && (
                  <button type="button" onClick={resetForm} className="rounded-[7px] px-[22px] py-3 bg-transparent border border-line text-xs font-bold text-ink cursor-pointer">
                    Cancel
                  </button>
                )}
              </div>
            </form>

            <section className={card}>
              <h2 className={sectionTitle}>Posts</h2>
              <p className={sectionHint}>{(posts ?? []).length} total</p>
              <div className="flex flex-col gap-3 mt-4">
                {(posts ?? []).length === 0 && <p className="text-[12px] text-[#8b9992]">No posts yet.</p>}
                {(posts ?? []).map((post) => (
                  <div key={post.id} className="flex items-center gap-4 p-4 border border-[#edf1ee] rounded-lg max-[500px]:gap-3 max-[500px]:p-3">
                    <span
                      className={
                        "text-[10px] font-bold uppercase tracking-wide rounded-full px-2 py-0.5 border flex-shrink-0 " +
                        (post.category === "notice" ? "text-[#ae4d44] border-[#f3d6d3]" : "text-[#38805d] border-[#cfe8db]")
                      }
                    >
                      {post.category}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="m-0 text-sm font-bold text-ink truncate">{post.title}</p>
                      <p className="m-0 text-[11px] text-[#8b9992] truncate">{post.slug}</p>
                    </div>
                    {!post.isPublished && (
                      <span className="text-[10px] font-bold uppercase tracking-wide text-[#8b9992] border border-[#e1e9e4] rounded-full px-2 py-0.5">Hidden</span>
                    )}
                    <button type="button" onClick={() => startEdit(post)} className="text-[11px] font-bold text-brand bg-transparent border-0 cursor-pointer">
                      Edit
                    </button>
                    <button type="button" onClick={() => remove(post.id)} className="h-[34px] w-[34px] grid place-items-center rounded-md border border-[#f3d6d3] text-[#ae4d44] bg-transparent cursor-pointer flex-shrink-0">
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
