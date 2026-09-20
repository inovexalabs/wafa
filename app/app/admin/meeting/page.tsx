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

  return (
    <AdminLayout active="meeting">
      <main className="member-content section-page">
        <div className="section-heading">
          <div>
            <p className="eyebrow form-eyebrow">Team coordination</p>
            <h1>Schedule a meeting.</h1>
            <p>Meetings created here get a Zoom link automatically.</p>
          </div>
        </div>
        <div className="member-grid">
          <section className="member-card page-card">
            <div className="card-heading">
              <div><h2>Create a meeting</h2><p>A Zoom meeting is created and linked automatically.</p></div>
            </div>
            <form onSubmit={submit} className="sa-form">
              <label>Title<input value={form.title} onChange={(event) => updateField("title", event.target.value)} placeholder="Monthly member forum" required /></label>
              <label>Description <span className="optional">Optional</span><input value={form.description} onChange={(event) => updateField("description", event.target.value)} placeholder="Agenda or notes" /></label>
              <div className="sa-form-grid">
                <label>Date<input type="date" value={form.date} onChange={(event) => updateField("date", event.target.value)} required /></label>
                <label>Time<input type="time" value={form.time} onChange={(event) => updateField("time", event.target.value)} required /></label>
              </div>
              <label>Duration (minutes)<input type="number" min={15} step={15} value={form.durationMinutes} onChange={(event) => updateField("durationMinutes", event.target.value)} required /></label>
              <div className="sa-member-summary">
                <span>{selectedMemberIds.length ? `Sharing with ${selectedMemberIds.length} selected member${selectedMemberIds.length === 1 ? "" : "s"}.` : "Sharing with everyone (no members selected)."}</span>
                <button type="button" className="text-action" onClick={goSelectMembers}>Select members →</button>
              </div>
              {error && <p className="sa-form-error" role="alert">{error}</p>}
              {message && <p className="sa-form-success" role="status">{message}</p>}
              <button className="sa-submit" disabled={isSubmitting}>{isSubmitting ? "Creating meeting..." : "Create meeting"} <span>→</span></button>
            </form>
          </section>
          <section className="member-card page-card">
            <div className="card-heading">
              <div><h2>Upcoming meetings</h2><p>Manage sharing, or cancel before they end.</p></div>
            </div>
            <div className="sa-activity-list">
              {isLoading ? (
                <div className="sa-empty"><span>◌</span><p>Loading meetings...</p></div>
              ) : meetings.length === 0 ? (
                <div className="sa-empty"><span>◌</span><p>No meetings yet.<br />Created meetings will appear here.</p></div>
              ) : (
                meetings.map((meeting) => {
                  const ended = hasEnded(meeting);
                  return (
                    <div className="sa-meeting-item" key={meeting.id}>
                      <div className="sa-activity-row">
                        <span className="sa-activity-avatar">{meeting.title.slice(0, 2).toUpperCase()}</span>
                        <div>
                          <strong>{meeting.title}</strong>
                          <span>{formatSchedule(meeting.scheduled_at)}</span>
                          {meeting.meeting_url && <a href={meeting.meeting_url} target="_blank" rel="noreferrer">Join link →</a>}
                        </div>
                        {ended ? (
                          <span className="sa-meeting-ended">Ended</span>
                        ) : (
                          <div className="sa-meeting-actions">
                            <button type="button" className="text-action" onClick={() => router.push(`/admin/meeting/members?meetingId=${meeting.id}`)}>Manage</button>
                            <button type="button" className="sa-meeting-cancel" onClick={() => void cancel(meeting.id)}>Cancel</button>
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
