"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import SuperadminLayout from "../../../../components/superadmin-layout";
import MemberDocumentsPanel from "../../../../components/member-documents-panel";
import { listMemberDirectory, MemberDirectoryEntry, updateMemberJoinedAt } from "../../../../lib/auth";
import { formatBsDate } from "../../../../lib/bs-date";

function initialsFor(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const initials = (parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "");
  return initials.toUpperCase() || "?";
}

function toDateInput(isoString: string) {
  const date = new Date(isoString);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function todayInput() {
  return toDateInput(new Date().toISOString());
}

export default function SuperadminMemberDetailPage() {
  const { memberId } = useParams<{ memberId: string }>();
  const [member, setMember] = useState<MemberDirectoryEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [joinedAt, setJoinedAt] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    listMemberDirectory()
      .then((members) => {
        const found = members.find((entry) => entry.id === memberId);
        if (!found) {
          setLoadError("This member could not be found.");
          return;
        }
        setMember(found);
        setJoinedAt(toDateInput(found.joinedAt));
      })
      .catch((error) => setLoadError(error instanceof Error ? error.message : "Unable to load this member."))
      .finally(() => setIsLoading(false));
  }, [memberId]);

  async function saveJoinedAt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!member) return;
    setIsSaving(true);
    setSaveError("");
    try {
      const updated = await updateMemberJoinedAt(member.id, joinedAt);
      setMember({ ...member, joinedAt: updated.joinedAt });
      toast.success("Date of joining updated.");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Unable to update the date of joining.");
    } finally {
      setIsSaving(false);
    }
  }

  const isDirty = member ? joinedAt !== toDateInput(member.joinedAt) : false;

  return (
    <SuperadminLayout active="members">
      <main className="max-w-[1000px] mx-auto px-6 pt-20 pb-14 max-[650px]:px-4 max-[650px]:pt-[68px]">
        <Link href="/superadmin/members" className="inline-flex items-center gap-1.5 mb-6 text-[11px] font-bold text-brand no-underline">
          <ArrowLeft size={14} /> All members
        </Link>

        {isLoading ? (
          <div className="h-[320px] rounded-[10px] bg-[#edf1ee] animate-pulse" />
        ) : loadError || !member ? (
          <div className="p-5 rounded-2xl border border-[#f3d6d3] bg-[#fdf3f2] text-[#ae4d44] text-sm" role="alert">{loadError || "This member could not be found."}</div>
        ) : (
          <div className="flex flex-col gap-5">
            <section className="p-[29px] border border-[#e1e9e4] rounded-[10px] bg-white max-[500px]:px-4 max-[500px]:py-[19px]">
              <div className="flex items-center gap-[14px] pb-[22px] border-b border-[#edf1ee]">
                <span className="grid place-items-center w-[58px] h-[58px] rounded-full text-[#276b52] bg-[#cfe8d4] text-base font-bold shrink-0">{initialsFor(member.fullName)}</span>
                <div className="min-w-0">
                  <h1 className="m-0 leading-tight font-display font-bold text-2xl truncate">{member.fullName}</h1>
                  <p className="m-0 mt-[6px] text-[#8b9992] text-[11px] truncate">
                    {member.memberNumber} · {member.email ?? "No email on file"}
                    {member.phone ? ` · ${member.phone}` : ""}
                  </p>
                </div>
                <span className="ml-auto px-[10px] py-[7px] rounded-2xl text-[#3c825b] bg-[#e6f3e6] text-[10px] font-bold capitalize shrink-0">{member.status}</span>
              </div>

              <form onSubmit={saveJoinedAt} className="flex items-end gap-3 mt-[22px] max-[560px]:flex-col max-[560px]:items-stretch">
                <label className="flex-1 text-[#53665c] text-[11px] font-bold">
                  Date of joining
                  <input
                    className="block w-full h-[42px] mt-[7px] border border-line rounded-md px-[11px] outline-none text-[#2d4037] bg-white text-xs focus:border-[#2b7358]"
                    type="date"
                    value={joinedAt}
                    max={todayInput()}
                    onChange={(event) => setJoinedAt(event.target.value)}
                    required
                  />
                </label>
                <span className="inline-flex items-center gap-1.5 h-[42px] px-3 rounded-md bg-[#f5f7f6] text-[11px] text-[#65756e] whitespace-nowrap">
                  <CalendarDays size={13} /> {joinedAt ? formatBsDate(`${joinedAt}T12:00:00Z`) : "—"}
                </span>
                <button
                  type="submit"
                  disabled={isSaving || !isDirty}
                  className="h-[42px] border-0 rounded-[7px] px-[17px] text-white bg-brand cursor-pointer text-xs font-bold min-w-[110px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? "Saving…" : "Save date"}
                </button>
              </form>
              {saveError && <p className="m-0 mt-3 text-[11px] text-[#ae4d44]" role="alert">{saveError}</p>}
            </section>

            <MemberDocumentsPanel memberId={member.id} description="Review, upload, or replace this member's documents. Files are private to the member and super admins." />
          </div>
        )}
      </main>
    </SuperadminLayout>
  );
}
