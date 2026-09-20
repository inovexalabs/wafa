"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AdminLayout from "../../../../components/admin-layout";
import { getMeetingShares, listMembers, MemberOption, shareMeeting } from "../../../../lib/auth";

const draftKey = "wafa_admin_meeting_draft";

type Draft = { title: string; description: string; date: string; time: string; durationMinutes: string; memberIds: string[] };

function readDraft(): Draft | null {
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

function MembersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const meetingId = searchParams.get("meetingId");

  const [members, setMembers] = useState<MemberOption[]>([]);
  const [selection, setSelection] = useState<string[]>([]);
  const [alreadyShared, setAlreadyShared] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const memberList = await listMembers("admin");
        if (cancelled) return;
        setMembers(memberList);

        if (meetingId) {
          const shares = await getMeetingShares("admin", meetingId);
          if (cancelled) return;
          setAlreadyShared(shares);
        } else {
          const draft = readDraft();
          if (!draft) {
            router.replace("/admin/meeting");
            return;
          }
          setSelection(draft.memberIds ?? []);
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Unable to load members.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [meetingId, router]);

  function toggleMember(memberId: string) {
    setSelection((current) => (current.includes(memberId) ? current.filter((id) => id !== memberId) : [...current, memberId]));
  }

  async function saveForNewMeeting() {
    const draft = readDraft();
    if (!draft) {
      router.replace("/admin/meeting");
      return;
    }
    writeDraft({ ...draft, memberIds: selection });
    router.push("/admin/meeting");
  }

  async function shareExistingMeeting() {
    if (!meetingId || !selection.length) return;
    setIsSaving(true);
    setError("");
    setMessage("");
    try {
      const result = await shareMeeting("admin", meetingId, selection);
      setAlreadyShared((current) => Array.from(new Set([...current, ...selection])));
      setSelection([]);
      setMessage(result.added ? `Shared with ${result.added} more member${result.added === 1 ? "" : "s"}.` : "Everyone selected already had access.");
    } catch (shareError) {
      setError(shareError instanceof Error ? shareError.message : "Unable to share this meeting.");
    } finally {
      setIsSaving(false);
    }
  }

  const selectableMembers = meetingId ? members.filter((member) => !alreadyShared.includes(member.id)) : members;

  return (
    <AdminLayout active="meeting">
      <main className="member-content section-page">
        <div className="section-heading">
          <div>
            <p className="eyebrow form-eyebrow">{meetingId ? "Manage sharing" : "New meeting"}</p>
            <h1>{meetingId ? "Share with more members." : "Select members to share with."}</h1>
            <p>{meetingId ? "Add members who missed the original invite." : "Leave everyone unselected to share this meeting with all members."}</p>
          </div>
          <button type="button" className="text-action" onClick={() => router.push("/admin/meeting")}>← Back to meetings</button>
        </div>
        <section className="member-card page-card">
          {isLoading ? (
            <div className="sa-empty"><span>◌</span><p>Loading members...</p></div>
          ) : (
            <>
              {meetingId && (
                <p className="sa-meeting-panel-label">
                  {alreadyShared.length ? `Currently shared with ${alreadyShared.length} member${alreadyShared.length === 1 ? "" : "s"}.` : "Currently shared with everyone (no members selected)."}
                </p>
              )}
              <div className="sa-member-picker" style={{ maxHeight: "none" }}>
                {selectableMembers.length === 0 ? (
                  <p className="sa-member-empty">{meetingId ? "Everyone already has access." : "No active members yet."}</p>
                ) : (
                  selectableMembers.map((member) => (
                    <label className="sa-member-option" key={member.id}>
                      <input type="checkbox" checked={selection.includes(member.id)} onChange={() => toggleMember(member.id)} />
                      <span>{member.full_name} <small>{member.member_number}</small></span>
                    </label>
                  ))
                )}
              </div>
              {error && <p className="sa-form-error" role="alert">{error}</p>}
              {message && <p className="sa-form-success" role="status">{message}</p>}
              {meetingId ? (
                <button type="button" className="sa-submit sa-meeting-share-btn" disabled={isSaving || !selection.length} onClick={() => void shareExistingMeeting()}>
                  {isSaving ? "Sharing..." : "Share with selected"}
                </button>
              ) : (
                <button type="button" className="sa-submit sa-meeting-share-btn" onClick={() => void saveForNewMeeting()}>
                  Save selection
                </button>
              )}
            </>
          )}
        </section>
      </main>
    </AdminLayout>
  );
}

export default function AdminMeetingMembersPage() {
  return (
    <Suspense fallback={<main className="member-content section-page"><p>Loading...</p></main>}>
      <MembersPageContent />
    </Suspense>
  );
}
