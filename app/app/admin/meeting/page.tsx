"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "../../../components/admin-layout";
import { cancelMeeting, createMeeting, listMeetings, Meeting } from "../../../lib/auth";

const emptyForm = { title: "", description: "", date: "", time: "", durationMinutes: "60" };
const draftKey = "wafa_admin_meeting_draft";

type Draft = typeof emptyForm & { memberIds: string[] };

function readDraft(): Draft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(draftKey);
    return raw ? (JSON.parse(raw) as Draft) : null;
  } catch {
    return null;
  }
}

function writeDraft(draft: Draft) {
  window.sessionStorage.setItem(draftKey, JSON.stringify(draft));
}

function clearDraft() {
  window.sessionStorage.removeItem(draftKey);
}

function formatSchedule(isoString: string) {
  const date = new Date(isoString);
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function hasEnded(meeting: Meeting) {
  const durationMs = (meeting.duration_minutes || 60) * 60 * 1000;
  return Date.now() > new Date(meeting.scheduled_at).getTime() + durationMs;
}

export default function AdminMeetingPage() {
  const router = useRouter();
  const [form, setForm] = useState(() => {
    const draft = readDraft();
    return draft ? { title: draft.title, description: draft.description, date: draft.date, time: draft.time, durationMinutes: draft.durationMinutes } : emptyForm;
  });
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(() => readDraft()?.memberIds ?? []);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    listMeetings("admin")
      .then(setMeetings)
      .catch(() => setMeetings([]))
      .finally(() => setIsLoading(false));
  }, []);

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function goSelectMembers() {
    writeDraft({ ...form, memberIds: selectedMemberIds });
    router.push("/admin/meeting/members");
  }

  function removeMeeting(meetingId: string) {
    setMeetings((current) => current.filter((meeting) => meeting.id !== meetingId));
  }

  async function cancel(meetingId: string) {
    try {
      await cancelMeeting("admin", meetingId);
      removeMeeting(meetingId);
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : "Unable to cancel this meeting.");
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setIsSubmitting(true);
    try {
      const scheduledAt = new Date(`${form.date}T${form.time}`).toISOString();
      const created = await createMeeting("admin", {
        title: form.title,
        description: form.description || undefined,
        scheduledAt,
        durationMinutes: Number(form.durationMinutes) || 60,
        meetingType: "online",
        memberIds: selectedMemberIds.length ? selectedMemberIds : undefined,
      });
      setMeetings((current) => [created, ...current]);
      setMessage(
        created.sharedWithCount
          ? `Meeting created and shared with ${created.sharedWithCount} member${created.sharedWithCount === 1 ? "" : "s"}.`
          : "Meeting created and shared with everyone.",
      );
      setForm(emptyForm);
      setSelectedMemberIds([]);
      clearDraft();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to create this meeting.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const saFormInput = "w-full h-[42px] mt-[7px] border border-line rounded-md px-[11px] outline-none text-[#2d4037] bg-white text-xs focus:border-[#2b7358] focus:shadow-[0_0_0_3px_#2b73581a]";

  return (
    <AdminLayout active="meeting">
      <main className="max-w-[1190px] mx-auto px-6 pt-20 pb-2 max-[650px]:px-4 max-[650px]:pt-[68px] max-[650px]:pb-2 min-h-[calc(100vh-76px)]">
        <div className="flex justify-between items-end gap-5 mb-4 max-[780px]:items-start max-[780px]:flex-col">
          <div>
            <p className="mb-[13px] text-[11px] font-bold tracking-[.18em] uppercase text-brand">Team coordination</p>
            <h1 className="m-0 font-display font-bold text-[clamp(32px,4vw,46px)] leading-[1.1]">Schedule a meeting.</h1>
            <p className="mt-[9px] text-muted text-sm">Meetings created here get a Zoom link automatically.</p>
          </div>
        </div>
        <div className="grid grid-cols-[1.5fr_1fr] gap-3 max-[900px]:grid-cols-1">
          <section className="p-4 border border-[#e1e9e4] rounded-[10px] bg-white">
            <div className="flex justify-between">
              <div><h2 className="m-0 font-display font-bold text-[23px]">Create a meeting</h2><p className="my-[6px] text-[#8a9892] text-[11px]">A Zoom meeting is created and linked automatically.</p></div>
            </div>
            <form onSubmit={submit} className="grid gap-[15px] mt-1">
              <label className="block text-[#53665c] text-[11px] font-bold">Title<input className={saFormInput} value={form.title} onChange={(event) => updateField("title", event.target.value)} placeholder="Monthly member forum" required /></label>
              <label className="block text-[#53665c] text-[11px] font-bold">Description <span className="text-[#9aa8a1] text-[10px] font-normal">Optional</span><input className={saFormInput} value={form.description} onChange={(event) => updateField("description", event.target.value)} placeholder="Agenda or notes" /></label>
              <div className="grid grid-cols-2 gap-[14px] max-[500px]:grid-cols-1">
                <label className="block text-[#53665c] text-[11px] font-bold">Date<input className={saFormInput} type="date" value={form.date} onChange={(event) => updateField("date", event.target.value)} required /></label>
                <label className="block text-[#53665c] text-[11px] font-bold">Time<input className={saFormInput} type="time" value={form.time} onChange={(event) => updateField("time", event.target.value)} required /></label>
              </div>
              <label className="block text-[#53665c] text-[11px] font-bold">Duration (minutes)<input className={saFormInput} type="number" min={15} step={15} value={form.durationMinutes} onChange={(event) => updateField("durationMinutes", event.target.value)} required /></label>
              <div className="flex items-center justify-between gap-3 px-[13px] py-[11px] border border-line rounded-md bg-[#f7faf7] text-[11px] text-[#53665c]">
                <span>{selectedMemberIds.length ? `Sharing with ${selectedMemberIds.length} selected member${selectedMemberIds.length === 1 ? "" : "s"}.` : "Sharing with everyone (no members selected)."}</span>
                <button type="button" className="border-0 text-[#286c54] bg-transparent cursor-pointer text-[11px] font-bold" onClick={goSelectMembers}>Select members →</button>
              </div>
              {error && <p className="m-0 text-[11px] text-[#ae4d44]" role="alert">{error}</p>}
              {message && <p className="m-0 text-[11px] text-[#38805d]" role="status">{message}</p>}
              <button className="flex justify-center gap-3 border-0 rounded-md p-[13px] text-white bg-brand cursor-pointer text-xs font-bold disabled:opacity-65 disabled:cursor-wait" disabled={isSubmitting}>{isSubmitting ? "Creating meeting..." : "Create meeting"} <span>→</span></button>
            </form>
          </section>
          <section className="p-4 border border-[#e1e9e4] rounded-[10px] bg-white">
            <div className="flex justify-between">
              <div><h2 className="m-0 font-display font-bold text-[23px]">Upcoming meetings</h2><p className="my-[6px] text-[#8a9892] text-[11px]">Manage sharing, or cancel before they end.</p></div>
            </div>
            <div className="mt-3">
              {isLoading ? (
                <div className="grid place-items-center py-6 text-[#a0aaa5] text-center"><span className="text-[28px]">◌</span><p className="text-[11px] leading-[1.6]">Loading meetings...</p></div>
              ) : meetings.length === 0 ? (
                <div className="grid place-items-center py-6 text-[#a0aaa5] text-center"><span className="text-[28px]">◌</span><p className="text-[11px] leading-[1.6]">No meetings yet.<br />Created meetings will appear here.</p></div>
              ) : (
                meetings.map((meeting) => {
                  const ended = hasEnded(meeting);
                  return (
                    <div className="border-t border-[#edf1ee] first:border-t-0" key={meeting.id}>
                      <div className="flex items-center gap-[10px] py-[13px]">
                        <span className="grid place-items-center w-[31px] h-[31px] rounded-full text-[#2d7257] bg-[#e4f2e5] text-[9px] font-bold">{meeting.title.slice(0, 2).toUpperCase()}</span>
                        <div className="flex-1">
                          <strong className="block text-[11px]">{meeting.title}</strong>
                          <span className="block mt-[3px] text-[#9aa69f] text-[9px]">{formatSchedule(meeting.scheduled_at)}</span>
                          {meeting.meeting_url && <a className="text-[#286c54] text-[11px] font-bold no-underline" href={meeting.meeting_url} target="_blank" rel="noreferrer">Join link →</a>}
                        </div>
                        {ended ? (
                          <span className="px-[9px] py-[5px] rounded-xl text-[#8b9992] bg-[#f0f2f0] text-[9px] font-bold">Ended</span>
                        ) : (
                          <div className="flex items-center gap-[10px]">
                            <button type="button" className="border-0 text-[#286c54] bg-transparent cursor-pointer text-[11px] font-bold" onClick={() => router.push(`/admin/meeting/members?meetingId=${meeting.id}`)}>Manage</button>
                            <button type="button" className="border-0 text-[#ae4d44] bg-transparent cursor-pointer text-[11px] font-bold disabled:opacity-60 disabled:cursor-wait" onClick={() => void cancel(meeting.id)}>Cancel</button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </main>
    </AdminLayout>
  );
}
