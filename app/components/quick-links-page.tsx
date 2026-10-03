"use client";

import { FormEvent, useEffect, useState } from "react";
import { ArrowUpRight, Link2, Pencil, Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import Modal from "./modal";
import RecipientPicker, { toggleRecipient, toggleRecipientGroup, useMeetingRecipients } from "./recipient-picker";
import { createQuickLink, deleteQuickLink, listQuickLinks, QuickLink, updateQuickLink, UserRole } from "../lib/auth";

type ManagerRole = "superadmin" | "admin";

const fieldInput = "block w-full h-[42px] mt-[7px] border border-line rounded-md px-[11px] outline-none text-[#2d4037] bg-white text-xs focus:border-[#2b7358] focus:shadow-[0_0_0_3px_#2b73581a]";
const fieldLabel = "block text-[#53665c] text-[11px] font-bold";

function hostnameOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function formatDate(isoString: string) {
  return new Date(isoString).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

type FormState = { title: string; url: string; description: string; audience: "everyone" | "selected"; recipientIds: string[]; notify: boolean };
const emptyForm: FormState = { title: "", url: "", description: "", audience: "everyone", recipientIds: [], notify: true };

function LinkCard({ link, audience, onEdit, onDelete }: { link: QuickLink; audience?: string; onEdit?: () => void; onDelete?: () => void }) {
  const host = hostnameOf(link.url);
  return (
    <article className="group flex flex-col p-5 rounded-2xl border border-line bg-white transition-all hover:border-brand/30 hover:shadow-[0_8px_24px_-12px_rgba(31,103,82,0.25)]">
      <div className="flex items-start gap-4">
        <span className="grid place-items-center w-11 h-11 rounded-xl shrink-0 text-[#2f7a5c] bg-[#e4f4ec] text-base font-bold uppercase">
          {host[0] ?? <Link2 size={18} />}
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="m-0 font-semibold text-[15px] text-ink truncate">{link.title}</h3>
          <p className="m-0 mt-0.5 text-[11px] text-muted truncate">{host}</p>
        </div>
        <a
          className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 text-brand px-4 py-2 text-xs font-bold whitespace-nowrap no-underline shrink-0 transition-colors hover:bg-brand hover:text-white"
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open <ArrowUpRight size={14} />
        </a>
      </div>
      {link.description && <p className="m-0 mt-3 text-xs leading-relaxed text-[#53665c] line-clamp-3 whitespace-pre-line">{link.description}</p>}
      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#edf1ee] text-[10px] text-[#8b9992]">
        <span className="flex-1 min-w-0 truncate">
          {link.createdByName ? `Shared by ${link.createdByName} · ` : ""}{formatDate(link.createdAt)}
        </span>
        {audience && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#f1f5f2] text-[#53665c] font-bold shrink-0">
            <Users size={11} /> {audience}
          </span>
        )}
        {onEdit && (
          <button type="button" onClick={onEdit} className="grid place-items-center w-7 h-7 rounded-md border-0 bg-transparent text-muted cursor-pointer hover:bg-[#f0f5f1] hover:text-brand" aria-label={`Edit ${link.title}`}>
            <Pencil size={13} />
          </button>
        )}
        {onDelete && (
          <button type="button" onClick={onDelete} className="grid place-items-center w-7 h-7 rounded-md border-0 bg-transparent text-[#ae4d44] cursor-pointer hover:bg-[#fdf3f2]" aria-label={`Delete ${link.title}`}>
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </article>
  );
}

function LinkFormModal({
  role,
  editing,
  onClose,
  onSaved,
}: {
  role: ManagerRole;
  editing: QuickLink | null;
  onClose: () => void;
  onSaved: (link: QuickLink) => void;
}) {
  const { recipients, isLoading: recipientsLoading, error: recipientsError } = useMeetingRecipients(role);
  const [form, setForm] = useState<FormState>(() =>
    editing
      ? {
          title: editing.title,
          url: editing.url,
          description: editing.description ?? "",
          audience: editing.recipientIds?.length ? "selected" : "everyone",
          recipientIds: editing.recipientIds ?? [],
          notify: false,
        }
      : emptyForm,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (form.audience === "selected" && form.recipientIds.length === 0) {
      setError("Pick at least one person, or share with everyone.");
      return;
    }
    setIsSaving(true);
    setError("");
    const input = {
      title: form.title,
      url: form.url,
      description: form.description,
      recipientIds: form.audience === "everyone" ? [] : form.recipientIds,
    };
    try {
      const saved = editing ? await updateQuickLink(editing.id, input) : await createQuickLink({ ...input, notify: form.notify });
      onSaved(saved);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save this link.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal title={editing ? "Edit link" : "Share a link"} onClose={onClose} wide>
      <form onSubmit={submit} className="grid gap-4">
        <label className={fieldLabel}>
          Title
          <input className={fieldInput} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Monthly deposit form" maxLength={200} required />
        </label>
        <label className={fieldLabel}>
          URL
          <input className={fieldInput} value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} placeholder="https://" inputMode="url" required />
        </label>
        <label className={fieldLabel}>
          Description <span className="text-[#9aa8a1] text-[10px] font-normal">Optional</span>
          <textarea
            className={fieldInput + " h-20 py-[9px] resize-y leading-relaxed"}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="What is this link for?"
          />
        </label>
        <fieldset className="m-0 p-0 border-0">
          <legend className={fieldLabel}>Who can see this</legend>
          <div className="flex gap-2 mt-[7px]">
            {(["everyone", "selected"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setForm((f) => ({ ...f, audience: option }))}
                className={
                  "flex-1 h-[38px] rounded-md border text-xs font-bold cursor-pointer " +
                  (form.audience === option ? "border-brand bg-brand/10 text-brand" : "border-line bg-white text-[#65756e]")
                }
              >
                {option === "everyone" ? "Everyone" : `Selected people${form.recipientIds.length ? ` (${form.recipientIds.length})` : ""}`}
              </button>
            ))}
          </div>
        </fieldset>
        {form.audience === "selected" && (
          <div className="max-h-[260px] overflow-y-auto">
            {recipientsLoading ? (
              <div className="h-24 rounded-md bg-[#edf1ee] animate-pulse" />
            ) : recipientsError ? (
              <p className="m-0 text-[11px] text-[#ae4d44]" role="alert">{recipientsError}</p>
            ) : (
              <RecipientPicker
                recipients={recipients}
                selection={form.recipientIds}
                onToggle={(id) => setForm((f) => ({ ...f, recipientIds: toggleRecipient(f.recipientIds, id) }))}
                onToggleGroup={(ids, checked) => setForm((f) => ({ ...f, recipientIds: toggleRecipientGroup(f.recipientIds, ids, checked) }))}
              />
            )}
          </div>
        )}
        {!editing && (
          <label className="flex items-center gap-2 text-[11px] text-[#53665c]">
            <input type="checkbox" checked={form.notify} onChange={(e) => setForm((f) => ({ ...f, notify: e.target.checked }))} />
            Notify them (in-app and email)
          </label>
        )}
        {error && <p className="m-0 text-[11px] text-[#ae4d44]" role="alert">{error}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="border-0 text-[#286c54] bg-transparent cursor-pointer text-[11px] font-bold p-[10px]">Cancel</button>
          <button type="submit" disabled={isSaving} className="border-0 rounded-[7px] px-[17px] py-3 text-white bg-brand cursor-pointer text-xs font-bold min-w-[120px] disabled:opacity-60 disabled:cursor-not-allowed">
            {isSaving ? "Saving…" : editing ? "Save changes" : "Share link"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function QuickLinksPage({ role }: { role: UserRole }) {
  const managerRole: ManagerRole | null = role === "superadmin" || role === "admin" ? role : null;
  const [links, setLinks] = useState<QuickLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState<{ editing: QuickLink | null } | null>(null);

  useEffect(() => {
    listQuickLinks()
      .then(setLinks)
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Unable to load quick links."))
      .finally(() => setIsLoading(false));
  }, []);

  function saved(link: QuickLink) {
    setLinks((current) => (current.some((item) => item.id === link.id) ? current.map((item) => (item.id === link.id ? link : item)) : [link, ...current]));
    toast.success(modal?.editing ? "Link updated." : "Link shared.");
    setModal(null);
  }

  async function remove(link: QuickLink) {
    if (!window.confirm(`Delete "${link.title}"? People it was shared with will no longer see it.`)) return;
    try {
      await deleteQuickLink(link.id);
      setLinks((current) => current.filter((item) => item.id !== link.id));
      toast.success("Link deleted.");
    } catch (deleteError) {
      toast.error(deleteError instanceof Error ? deleteError.message : "Unable to delete this link.");
    }
  }

  function audienceOf(link: QuickLink) {
    const count = link.recipientIds?.length ?? 0;
    if (!count) return "Everyone";
    return count === 1 ? "1 person" : `${count} people`;
  }

  return (
    <main className="max-w-[1190px] mx-auto px-6 pt-20 max-[650px]:px-4 max-[650px]:pt-[68px] h-dvh flex flex-col overflow-hidden">
      <div className="shrink-0 flex justify-between items-end gap-5 mb-8 max-[780px]:items-start max-[780px]:flex-col">
        <div>
          <p className="mb-[13px] text-[11px] font-bold tracking-[.18em] uppercase text-brand">Quick links</p>
          <h1 className="m-0 font-display font-bold text-[clamp(28px,3.4vw,42px)] leading-[1.1]">Everything you need, one click away.</h1>
          <p className="mt-[10px] text-muted text-sm">
            {managerRole ? "Share forms, drives, and portals with everyone or only the people who need them." : "Links your admins have shared with you."}
          </p>
        </div>
        {managerRole && (
          <button
            type="button"
            onClick={() => setModal({ editing: null })}
            className="inline-flex items-center gap-2 border-0 rounded-[7px] px-[17px] py-3 text-white bg-brand cursor-pointer text-xs font-bold shrink-0"
          >
            <Plus size={15} /> Add link
          </button>
        )}
      </div>

      <div className="no-scrollbar flex-1 min-h-0 overflow-y-auto pb-6">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 max-[780px]:grid-cols-1">
            {[0, 1, 2, 3].map((i) => <div key={i} className="h-[150px] rounded-2xl bg-[#edf1ee] animate-pulse" />)}
          </div>
        ) : error ? (
          <div className="p-5 rounded-2xl border border-[#f3d6d3] bg-[#fdf3f2] text-[#ae4d44] text-sm" role="alert">{error}</div>
        ) : links.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 px-6 rounded-2xl border border-dashed border-line bg-white text-center">
            <div className="w-14 h-14 rounded-full bg-[#eef1ee] grid place-items-center text-muted"><Link2 size={22} /></div>
            <p className="text-sm font-semibold text-ink">No links yet</p>
            <p className="text-xs text-muted max-w-[260px]">
              {managerRole ? "Add the first link to share it with your team." : "Links shared with you will show up here."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 max-[780px]:grid-cols-1">
            {links.map((link) => (
              <LinkCard
                key={link.id}
                link={link}
                audience={managerRole ? audienceOf(link) : undefined}
                onEdit={managerRole ? () => setModal({ editing: link }) : undefined}
                onDelete={managerRole ? () => remove(link) : undefined}
              />
            ))}
          </div>
        )}
      </div>

      {managerRole && modal && <LinkFormModal role={managerRole} editing={modal.editing} onClose={() => setModal(null)} onSaved={saved} />}
    </main>
  );
}
