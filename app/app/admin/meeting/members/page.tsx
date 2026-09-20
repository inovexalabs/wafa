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
      <main className="max-w-[1190px] mx-auto px-6 pt-20 pb-2 max-[650px]:px-4 max-[650px]:pt-[68px] max-[650px]:pb-2 min-h-[calc(100vh-76px)]">
        <div className="flex justify-between items-end gap-5 mb-4 max-[780px]:items-start max-[780px]:flex-col">
          <div>
            <p className="mb-[13px] text-[11px] font-bold tracking-[.18em] uppercase text-brand">{meetingId ? "Manage sharing" : "New meeting"}</p>
            <h1 className="m-0 font-display font-bold text-[clamp(32px,4vw,46px)] leading-[1.1]">{meetingId ? "Share with more members." : "Select members to share with."}</h1>
            <p className="mt-[9px] text-muted text-sm">{meetingId ? "Add members who missed the original invite." : "Leave everyone unselected to share this meeting with all members."}</p>
          </div>
          <button type="button" className="border-0 text-[#286c54] bg-transparent cursor-pointer text-[11px] font-bold" onClick={() => router.push("/admin/meeting")}>← Back to meetings</button>
        </div>
        <section className="p-4 border border-[#e1e9e4] rounded-[10px] bg-white">
          {isLoading ? (
            <div className="grid place-items-center py-6 text-[#a0aaa5] text-center"><span className="text-[28px]">◌</span><p className="text-[11px] leading-[1.6]">Loading members...</p></div>
          ) : (
            <>
              {meetingId && (
                <p className="m-0 mb-2 text-muted text-[11px]">
                  {alreadyShared.length ? `Currently shared with ${alreadyShared.length} member${alreadyShared.length === 1 ? "" : "s"}.` : "Currently shared with everyone (no members selected)."}
                </p>
              )}
              <div className="overflow-y-auto border border-line rounded-md px-1 py-[6px] mt-[7px]" style={{ maxHeight: "none" }}>
                {selectableMembers.length === 0 ? (
                  <p className="px-[7px] py-2 text-[#9aa8a1] text-[11px]">{meetingId ? "Everyone already has access." : "No active members yet."}</p>
                ) : (
                  selectableMembers.map((member) => (
                    <label className="flex items-center gap-[9px] px-[7px] py-2 rounded-md text-xs text-[#2d4037] cursor-pointer hover:bg-[#f2f7f3]" key={member.id}>
                      <input className="w-auto h-auto m-0" type="checkbox" checked={selection.includes(member.id)} onChange={() => toggleMember(member.id)} />
                      <span>{member.full_name} <small className="text-[#8b9992] text-[10px]">{member.member_number}</small></span>
                    </label>
                  ))
                )}
              </div>
              {error && <p className="m-0 text-[11px] text-[#ae4d44]" role="alert">{error}</p>}
              {message && <p className="m-0 text-[11px] text-[#38805d]" role="status">{message}</p>}
              {meetingId ? (
                <button type="button" className="flex justify-center gap-3 border-0 rounded-md p-[13px] text-white bg-brand cursor-pointer text-xs font-bold disabled:opacity-65 disabled:cursor-wait w-auto mt-3 px-4 py-[10px]" disabled={isSaving || !selection.length} onClick={() => void shareExistingMeeting()}>
                  {isSaving ? "Sharing..." : "Share with selected"}
                </button>
              ) : (
                <button type="button" className="flex justify-center gap-3 border-0 rounded-md p-[13px] text-white bg-brand cursor-pointer text-xs font-bold w-auto mt-3 px-4 py-[10px]" onClick={() => void saveForNewMeeting()}>
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
    <Suspense fallback={<main className="max-w-[1190px] mx-auto px-6 pt-20 pb-2 min-h-[calc(100vh-76px)]"><p>Loading...</p></main>}>
      <MembersPageContent />
    </Suspense>
  );
}
