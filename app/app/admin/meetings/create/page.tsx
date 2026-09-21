"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "../../../../components/admin-layout";
import Modal from "../../../../components/modal";
import RecipientPicker, { toggleRecipient, toggleRecipientGroup, useMeetingRecipients } from "../../../../components/recipient-picker";
import { createMeeting } from "../../../../lib/auth";

const emptyForm = { title: "", description: "", date: "", time: "", durationMinutes: "60" };

const saFormInput = "w-full h-[42px] mt-[7px] border border-line rounded-md px-[11px] outline-none text-[#2d4037] bg-white text-xs focus:border-[#2b7358] focus:shadow-[0_0_0_3px_#2b73581a]";

function SelectRecipientsModal({ isSubmitting, onClose, onConfirm }: { isSubmitting: boolean; onClose: () => void; onConfirm: (recipientIds: string[]) => void }) {
  const { recipients, isLoading, error } = useMeetingRecipients("admin");
  const [selection, setSelection] = useState<string[]>([]);

  return (
    <Modal title="Select recipients" onClose={onClose}>
      <p className="m-0 mb-3 text-[#8a9892] text-[11px]">Leave everyone unselected to share this meeting with all members. Pick a whole group or individual people from admins, accountants, and members.</p>
      {isLoading ? (
        <div className="grid place-items-center py-6 text-[#a0aaa5] text-center"><span className="text-[28px]">◌</span><p className="text-[11px] leading-[1.6]">Loading recipients...</p></div>
      ) : (
        <>
          <div className="overflow-y-auto" style={{ maxHeight: "380px" }}>
            <RecipientPicker
              recipients={recipients}
              selection={selection}
              onToggle={(id) => setSelection((current) => toggleRecipient(current, id))}
              onToggleGroup={(ids, checked) => setSelection((current) => toggleRecipientGroup(current, ids, checked))}
            />
          </div>
          {error && <p className="m-0 mt-2 text-[11px] text-[#ae4d44]" role="alert">{error}</p>}
          <div className="flex items-center justify-between gap-3 mt-4">
            <span className="text-[11px] text-[#53665c]">{selection.length ? `${selection.length} selected` : "Sharing with everyone"}</span>
            <button
              type="button"
              className="flex justify-center gap-3 border-0 rounded-md px-4 py-[10px] text-white bg-brand cursor-pointer text-xs font-bold disabled:opacity-65 disabled:cursor-wait"
              disabled={isSubmitting}
              onClick={() => onConfirm(selection)}
            >
              {isSubmitting ? "Creating meeting..." : "Create meeting"}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}

export default function CreateMeetingPage() {
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showRecipientsModal, setShowRecipientsModal] = useState(false);

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function openRecipientsModal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!event.currentTarget.reportValidity()) return;
    setError("");
    setShowRecipientsModal(true);
  }

  async function confirmCreate(recipientIds: string[]) {
    setIsSubmitting(true);
    setError("");
    try {
      const scheduledAt = new Date(`${form.date}T${form.time}`).toISOString();
      await createMeeting("admin", {
        title: form.title,
        description: form.description || undefined,
        scheduledAt,
        durationMinutes: Number(form.durationMinutes) || 60,
        meetingType: "online",
        recipientIds: recipientIds.length ? recipientIds : undefined,
      });
      router.push("/admin/meetings");
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to create this meeting.");
      setIsSubmitting(false);
    }
  }

  return (
    <AdminLayout active="meetings">
      <main className="max-w-[720px] mx-auto px-6 pt-20 pb-2 max-[650px]:px-4 max-[650px]:pt-[68px] max-[650px]:pb-2 min-h-[calc(100vh-76px)]">
        <div className="mb-4">
          <p className="mb-[13px] text-[11px] font-bold tracking-[.18em] uppercase text-brand">Team coordination</p>
          <h1 className="m-0 font-display font-bold text-[clamp(32px,4vw,46px)] leading-[1.1]">Schedule a meeting.</h1>
          <p className="mt-[9px] text-muted text-sm">Meetings created here get a Zoom link automatically.</p>
        </div>
        <section className="p-4 border border-[#e1e9e4] rounded-[10px] bg-white">
          <div className="flex justify-between">
            <div><h2 className="m-0 font-display font-bold text-[23px]">Create a meeting</h2><p className="my-[6px] text-[#8a9892] text-[11px]">A Zoom meeting is created and linked automatically.</p></div>
          </div>
          <form onSubmit={openRecipientsModal} className="grid gap-[15px] mt-1">
            <label className="block text-[#53665c] text-[11px] font-bold">Title<input className={saFormInput} value={form.title} onChange={(event) => updateField("title", event.target.value)} placeholder="Monthly member forum" required /></label>
            <label className="block text-[#53665c] text-[11px] font-bold">Description <span className="text-[#9aa8a1] text-[10px] font-normal">Optional</span><input className={saFormInput} value={form.description} onChange={(event) => updateField("description", event.target.value)} placeholder="Agenda or notes" /></label>
            <div className="grid grid-cols-2 gap-[14px] max-[500px]:grid-cols-1">
              <label className="block text-[#53665c] text-[11px] font-bold">Date<input className={saFormInput} type="date" value={form.date} onChange={(event) => updateField("date", event.target.value)} required /></label>
              <label className="block text-[#53665c] text-[11px] font-bold">Time<input className={saFormInput} type="time" value={form.time} onChange={(event) => updateField("time", event.target.value)} required /></label>
            </div>
            <label className="block text-[#53665c] text-[11px] font-bold">Duration (minutes)<input className={saFormInput} type="number" min={15} step={15} value={form.durationMinutes} onChange={(event) => updateField("durationMinutes", event.target.value)} required /></label>
            {error && <p className="m-0 text-[11px] text-[#ae4d44]" role="alert">{error}</p>}
            <button className="flex justify-center gap-3 border-0 rounded-md p-[13px] text-white bg-brand cursor-pointer text-xs font-bold disabled:opacity-65 disabled:cursor-wait" disabled={isSubmitting}>Select recipients <span>→</span></button>
          </form>
        </section>
      </main>

      {showRecipientsModal && (
        <SelectRecipientsModal
          isSubmitting={isSubmitting}
          onClose={() => setShowRecipientsModal(false)}
          onConfirm={(recipientIds) => void confirmCreate(recipientIds)}
        />
      )}
    </AdminLayout>
  );
}
