"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ExternalLink, ImagePlus, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import SuperadminLayout from "../../../../components/superadmin-layout";
import {
  BlogPost,
  SaveBlogPostInput,
  createBlogPost,
  deleteBlogPost,
  listBlogPosts,
  updateBlogPost,
  uploadLandingMedia,
} from "../../../../lib/auth";

const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL ?? "http://localhost:3003";

const fieldInput =
  "block w-full h-[42px] mt-[7px] border border-line rounded-md px-[11px] outline-none text-[#2d4037] bg-white font-inherit text-xs focus:border-brand";
const fieldTextarea =
  "block w-full mt-[7px] border border-line rounded-md px-[11px] py-[9px] outline-none text-[#2d4037] bg-white font-inherit text-xs leading-relaxed resize-y focus:border-brand";
const label = "text-[#53665c] text-[11px] font-bold";
const card = "border border-[#e1e9e4] rounded-[10px] bg-white p-[24px] max-[500px]:px-4 max-[500px]:py-[16px]";
const sectionTitle = "m-0 font-display font-bold text-lg text-ink";
const sectionHint = "m-0 mt-1 text-[#8b9992] text-[11px]";

const EXCERPT_MAX = 300;

type Form = {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  coverImageUrl: string;
  authorName: string;
  tags: string;
  isPublished: boolean;
  publishedAt: string;
};

const emptyForm: Form = {
  title: "",
  slug: "",
  excerpt: "",
  body: "",
  coverImageUrl: "",
  authorName: "",
  tags: "",
  isPublished: false,
  publishedAt: "",
};

// datetime-local wants local "YYYY-MM-DDTHH:mm"; the API stores UTC ISO.
function toLocalInput(iso: string) {
  const date = new Date(iso);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function statusOf(post: BlogPost) {
  if (!post.isPublished) return { label: "Draft", className: "text-[#8b9992] border-[#e1e9e4]" };
  if (new Date(post.publishedAt).getTime() > Date.now())
    return { label: "Scheduled", className: "text-[#9a6b12] border-[#f1dfb5]" };
  return { label: "Published", className: "text-[#38805d] border-[#cfe8db]" };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default function SuperadminLandingBlogPage() {
  const [posts, setPosts] = useState<BlogPost[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");

  // null = list view; "new" or a post id = editor view.
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    listBlogPosts()
      .then(setPosts)
      .catch((error) => setLoadError(error instanceof Error ? error.message : "Unable to load posts."));
  }, []);

  const visiblePosts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return posts ?? [];
    return (posts ?? []).filter(
      (post) => post.title.toLowerCase().includes(q) || post.tags.some((tag) => tag.includes(q)),
    );
  }, [posts, query]);

  const editingPost = editing && editing !== "new" ? posts?.find((p) => p.id === editing) ?? null : null;

  function openNew() {
    setEditing("new");
    setForm(emptyForm);
    setSaveError("");
  }

  function openEdit(post: BlogPost) {
    setEditing(post.id);
    setForm({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      body: post.body,
      coverImageUrl: post.coverImageUrl ?? "",
      authorName: post.authorName ?? "",
      tags: post.tags.join(", "),
      isPublished: post.isPublished,
      publishedAt: toLocalInput(post.publishedAt),
    });
    setSaveError("");
  }

  function closeEditor() {
    setEditing(null);
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
    if (!form.title.trim()) return setSaveError("Title is required.");
    if (!form.body.trim()) return setSaveError("Write the post body before saving.");
    if (form.excerpt.length > EXCERPT_MAX) return setSaveError(`Excerpt must be ${EXCERPT_MAX} characters or fewer.`);

    setIsSaving(true);
    setSaveError("");
    const payload: SaveBlogPostInput = {
      title: form.title.trim(),
      excerpt: form.excerpt.trim(),
      body: form.body,
      coverImageUrl: form.coverImageUrl,
      authorName: form.authorName.trim(),
      tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      isPublished: form.isPublished,
      ...(form.slug.trim() ? { slug: form.slug.trim() } : {}),
      ...(form.publishedAt ? { publishedAt: new Date(form.publishedAt).toISOString() } : {}),
    };
    try {
      if (editingPost) {
        const updated = await updateBlogPost(editingPost.id, payload);
        setPosts((current) => (current ?? []).map((p) => (p.id === updated.id ? updated : p)));
        toast.success(updated.isPublished ? "Post saved. The site updates within a minute." : "Draft saved.");
      } else {
        const created = await createBlogPost(payload);
        setPosts((current) => [created, ...(current ?? [])]);
        toast.success(created.isPublished ? "Post published. It appears on the site within a minute." : "Draft created.");
      }
      closeEditor();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Unable to save this post.");
    } finally {
      setIsSaving(false);
    }
  }

  async function remove(post: BlogPost) {
    if (!window.confirm(`Delete "${post.title}"? This can't be undone.`)) return;
    try {
      await deleteBlogPost(post.id);
      setPosts((current) => (current ?? []).filter((p) => p.id !== post.id));
      if (editing === post.id) closeEditor();
      toast.success("Post deleted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete this post.");
    }
  }

  return (
    <SuperadminLayout active="landing-blog">
      <main className="max-w-[1000px] mx-auto px-6 pt-20 pb-14 max-[650px]:px-4 max-[650px]:pt-[68px]">
        <div className="mb-[30px] flex items-end justify-between gap-4 flex-wrap">
          <div>
            <p className="mb-[13px] text-[11px] font-bold tracking-[.18em] uppercase text-brand">Public site</p>
            <h1 className="m-0 font-display font-bold text-[clamp(28px,4vw,40px)] leading-[1.1]">Blog</h1>
            <p className="mt-[9px] text-muted text-sm">Write long-form posts for the public blog at /blog.</p>
          </div>
          {editing === null && posts && (
            <button
              type="button"
              onClick={openNew}
              className="inline-flex items-center gap-2 border-0 rounded-[7px] px-[18px] py-3 text-white bg-brand cursor-pointer text-xs font-bold"
            >
              <Plus size={14} /> New post
            </button>
          )}
        </div>

        {loadError ? (
          <div className="p-5 rounded-2xl border border-[#f3d6d3] bg-[#fdf3f2] text-[#ae4d44] text-sm" role="alert">{loadError}</div>
        ) : posts === null ? (
          <div className="h-[300px] rounded-[10px] bg-[#edf1ee] animate-pulse" />
        ) : editing !== null ? (
          <form onSubmit={save} className="flex flex-col gap-6">
            <button
              type="button"
              onClick={closeEditor}
              className="self-start inline-flex items-center gap-1.5 bg-transparent border-0 p-0 text-xs font-bold text-brand cursor-pointer"
            >
              <ArrowLeft size={14} /> All posts
            </button>

            <section className={card}>
              <h2 className={sectionTitle}>{editingPost ? "Edit post" : "New post"}</h2>
              <p className={sectionHint}>Posts start as drafts. Tick “Published” when it&apos;s ready to go live.</p>
              <label className={label + " block mt-5"}>
                Title
                <input
                  className={fieldInput + " h-[48px] text-base font-display font-bold"}
                  value={form.title}
                  maxLength={200}
                  placeholder="A clear, specific headline"
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </label>
              <label className={label + " block mt-4"}>
                Excerpt <span className="font-normal text-[#8b9992]">({form.excerpt.length}/{EXCERPT_MAX})</span>
                <textarea
                  rows={2}
                  maxLength={EXCERPT_MAX}
                  className={fieldTextarea}
                  value={form.excerpt}
                  placeholder="One or two sentences shown on the blog list and in search results. Leave blank to use the start of the post."
                  onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                />
              </label>
              <label className={label + " block mt-4"}>
                Body
                <textarea
                  rows={20}
                  maxLength={50000}
                  className={fieldTextarea + " font-mono text-[12.5px]"}
                  value={form.body}
                  onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                />
              </label>
              <p className={sectionHint + " mt-2 leading-relaxed"}>
                Formatting: <code>## Heading</code>, <code>### Subheading</code>, <code>**bold**</code>, <code>*italic*</code>,{" "}
                <code>[link text](https://…)</code>, <code>- list item</code>, <code>1. numbered</code>, <code>&gt; quote</code>,{" "}
                <code>![image alt](https://…)</code>. Leave a blank line between paragraphs.
              </p>
            </section>

            <section className={card}>
              <h2 className={sectionTitle}>Details</h2>
              <div className="grid grid-cols-2 gap-[16px] mt-5 max-[650px]:grid-cols-1">
                <label className={label}>
                  Author (optional)
                  <input
                    className={fieldInput}
                    value={form.authorName}
                    maxLength={120}
                    placeholder="Shown as “WAFA Group” if blank"
                    onChange={(e) => setForm((f) => ({ ...f, authorName: e.target.value }))}
                  />
                </label>
                <label className={label}>
                  Tags (comma separated)
                  <input
                    className={fieldInput}
                    value={form.tags}
                    placeholder="savings, members, guides"
                    onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                  />
                </label>
                <label className={label}>
                  Slug (optional)
                  <input
                    className={fieldInput}
                    value={form.slug}
                    placeholder="Generated from the title"
                    onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  />
                </label>
                <label className={label}>
                  Publish date (optional)
                  <input
                    type="datetime-local"
                    className={fieldInput}
                    value={form.publishedAt}
                    onChange={(e) => setForm((f) => ({ ...f, publishedAt: e.target.value }))}
                  />
                </label>
              </div>
              <p className={sectionHint + " mt-2"}>A future publish date schedules the post: it stays hidden until then.</p>

              <div className="mt-5">
                <span className={label}>Cover image</span>
                {form.coverImageUrl ? (
                  <div className="relative mt-[7px] w-full max-w-md">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={form.coverImageUrl} alt="" className="aspect-[16/9] w-full rounded-lg object-cover border border-[#edf1ee]" />
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, coverImageUrl: "" }))}
                      className="absolute right-2 top-2 h-8 w-8 grid place-items-center rounded-full border-0 bg-white/90 text-ink cursor-pointer"
                      aria-label="Remove cover image"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <label className="mt-[7px] flex h-[120px] max-w-md cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line text-[11px] font-semibold text-[#8b9992] hover:border-brand hover:text-brand">
                    <ImagePlus size={20} />
                    {isUploading ? "Uploading…" : "Upload a PNG, JPG or WEBP (16:9 works best)"}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="sr-only"
                      disabled={isUploading}
                      onChange={(e) => handleCoverChange(e.target.files?.[0] ?? null)}
                    />
                  </label>
                )}
              </div>

              <label className={label + " flex items-center gap-2 mt-6"}>
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
                />
                Published — visible on the public blog
              </label>
            </section>

            {saveError && <p className="m-0 text-[12px] text-[#ae4d44]" role="alert">{saveError}</p>}

            <div className="flex gap-[12px] flex-wrap">
              <button
                type="submit"
                disabled={isSaving || isUploading}
                className="border-0 rounded-[7px] px-[22px] py-3 text-white bg-brand cursor-pointer text-xs font-bold min-w-[140px] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSaving ? "Saving…" : form.isPublished ? "Save & publish" : "Save draft"}
              </button>
              <button type="button" onClick={closeEditor} className="rounded-[7px] px-[22px] py-3 bg-transparent border border-line text-xs font-bold text-ink cursor-pointer">
                Cancel
              </button>
              {editingPost && (
                <button
                  type="button"
                  onClick={() => remove(editingPost)}
                  className="ml-auto inline-flex items-center gap-1.5 rounded-[7px] px-[18px] py-3 bg-transparent border border-[#f3d6d3] text-xs font-bold text-[#ae4d44] cursor-pointer"
                >
                  <Trash2 size={13} /> Delete
                </button>
              )}
            </div>
          </form>
        ) : (
          <section className={card}>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className={sectionTitle}>Posts</h2>
                <p className={sectionHint}>
                  {posts.length} total · {posts.filter((p) => statusOf(p).label === "Published").length} live
                </p>
              </div>
              {posts.length > 0 && (
                <label className="relative w-full max-w-[260px] max-[500px]:max-w-none">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b9992]" />
                  <input
                    className={fieldInput + " mt-0 pl-8"}
                    placeholder="Search title or tag"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </label>
              )}
            </div>

            <div className="flex flex-col gap-3 mt-5">
              {posts.length === 0 && (
                <div className="py-10 text-center">
                  <p className="m-0 text-sm font-bold text-ink">No blog posts yet</p>
                  <p className="m-0 mt-1 text-[12px] text-[#8b9992]">Write your first post — it starts as a private draft.</p>
                </div>
              )}
              {posts.length > 0 && visiblePosts.length === 0 && (
                <p className="text-[12px] text-[#8b9992]">No posts match “{query}”.</p>
              )}
              {visiblePosts.map((post) => {
                const status = statusOf(post);
                return (
                  <div key={post.id} className="flex items-center gap-4 p-4 border border-[#edf1ee] rounded-lg max-[500px]:gap-3 max-[500px]:p-3">
                    {post.coverImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={post.coverImageUrl} alt="" className="h-12 w-20 rounded-md object-cover flex-shrink-0 max-[500px]:hidden" />
                    ) : (
                      <div className="h-12 w-20 rounded-md bg-[#edf1ee] flex-shrink-0 max-[500px]:hidden" />
                    )}
                    <button type="button" onClick={() => openEdit(post)} className="flex-1 min-w-0 text-left bg-transparent border-0 p-0 cursor-pointer">
                      <p className="m-0 text-sm font-bold text-ink truncate">{post.title}</p>
                      <p className="m-0 mt-0.5 text-[11px] text-[#8b9992] truncate">
                        {formatDate(post.publishedAt)} · {post.readingMinutes} min read
                        {post.tags.length ? ` · ${post.tags.join(", ")}` : ""}
                      </p>
                    </button>
                    <span className={"text-[10px] font-bold uppercase tracking-wide rounded-full px-2 py-0.5 border flex-shrink-0 " + status.className}>
                      {status.label}
                    </span>
                    {status.label === "Published" && (
                      <a
                        href={`${landingUrl}/blog/${post.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="h-[34px] w-[34px] grid place-items-center rounded-md border border-[#e1e9e4] text-[#53665c] flex-shrink-0"
                        aria-label={`View "${post.title}" on the site`}
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => remove(post)}
                      className="h-[34px] w-[34px] grid place-items-center rounded-md border border-[#f3d6d3] text-[#ae4d44] bg-transparent cursor-pointer flex-shrink-0"
                      aria-label={`Delete "${post.title}"`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </SuperadminLayout>
  );
}
