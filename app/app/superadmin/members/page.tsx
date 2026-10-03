"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, CircleAlert, CheckCircle2, Search, Users } from "lucide-react";
import SuperadminLayout from "../../../components/superadmin-layout";
import SuperadminMembersTabs from "../../../components/superadmin-members-tabs";
import { listMemberDirectory, MemberDirectoryEntry } from "../../../lib/auth";
import { formatBsDate } from "../../../lib/bs-date";

function initialsFor(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const initials = (parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "");
  return initials.toUpperCase() || "?";
}

function formatDate(isoString: string) {
  return new Date(isoString).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export default function SuperadminMembersPage() {
  const [members, setMembers] = useState<MemberDirectoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [onlyMissing, setOnlyMissing] = useState(false);

  useEffect(() => {
    listMemberDirectory()
      .then(setMembers)
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Unable to load members."))
      .finally(() => setIsLoading(false));
  }, []);

  const missingCount = members.filter((member) => member.missingRequired.length > 0).length;
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return members.filter((member) => {
      if (onlyMissing && member.missingRequired.length === 0) return false;
      if (!needle) return true;
      return [member.fullName, member.memberNumber, member.email ?? ""].some((value) => value.toLowerCase().includes(needle));
    });
  }, [members, query, onlyMissing]);

  return (
    <SuperadminLayout active="members">
      <main className="max-w-[1190px] mx-auto px-6 pt-20 max-[650px]:px-4 max-[650px]:pt-[68px] h-dvh flex flex-col overflow-hidden">
        <div className="shrink-0">
          <p className="mb-[13px] text-[11px] font-bold tracking-[.18em] uppercase text-brand">People</p>
          <h1 className="m-0 font-display font-bold text-[clamp(28px,4vw,42px)] leading-[1.1]">Members</h1>
          <p className="mt-[9px] mb-6 text-muted text-sm">Joining dates and documents for every member.</p>
          <SuperadminMembersTabs active="directory" />
        </div>

        <div className="no-scrollbar flex-1 min-h-0 overflow-y-auto pt-5 pb-6">
          {isLoading ? (
            <div className="space-y-3">
              {[0, 1, 2, 3].map((i) => <div key={i} className="h-[64px] rounded-[10px] bg-[#edf1ee] animate-pulse" />)}
            </div>
          ) : error ? (
            <div className="p-5 rounded-2xl border border-[#f3d6d3] bg-[#fdf3f2] text-[#ae4d44] text-sm" role="alert">{error}</div>
          ) : members.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 px-6 rounded-2xl border border-dashed border-line bg-white text-center">
              <div className="w-14 h-14 rounded-full bg-[#eef1ee] grid place-items-center text-muted"><Users size={22} /></div>
              <p className="text-sm font-semibold text-ink">No members yet</p>
              <p className="text-xs text-muted max-w-[260px]">Create a member from the control center and they will appear here.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-4 max-[650px]:flex-col max-[650px]:items-stretch">
                <label className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9aa8a1]" />
                  <input
                    className="w-full h-[40px] border border-line rounded-md pl-9 pr-3 outline-none text-[#2d4037] bg-white text-xs focus:border-[#2b7358]"
                    placeholder="Search by name, member number, or email"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    aria-label="Search members"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setOnlyMissing((value) => !value)}
                  className={
                    "inline-flex items-center justify-center gap-2 h-[40px] px-4 rounded-md border text-xs font-bold cursor-pointer whitespace-nowrap " +
                    (onlyMissing ? "border-[#e8c79f] bg-[#fdf6ec] text-[#9a5a22]" : "border-line bg-white text-[#65756e]")
                  }
                  aria-pressed={onlyMissing}
                >
                  <CircleAlert size={14} /> Missing documents ({missingCount})
                </button>
              </div>

              <div className="rounded-[10px] border border-[#e1e9e4] bg-white overflow-hidden">
                <div className="grid grid-cols-[1.6fr_1.2fr_1.4fr_24px] gap-4 px-5 py-3 border-b border-[#edf1ee] bg-[#f7faf7] text-[10px] font-bold uppercase tracking-wide text-[#8b9992] max-[780px]:hidden">
                  <span>Member</span>
                  <span>Date of joining</span>
                  <span>Documents</span>
                  <span />
                </div>
                {visible.length === 0 && <p className="m-0 px-5 py-6 text-[12px] text-[#8b9992]">No members match.</p>}
                {visible.map((member) => (
                  <Link
                    key={member.id}
                    href={`/superadmin/members/${member.id}`}
                    className="grid grid-cols-[1.6fr_1.2fr_1.4fr_24px] items-center gap-4 px-5 py-[14px] border-t border-[#edf1ee] first:border-t-0 no-underline text-inherit hover:bg-[#f7faf7] max-[780px]:grid-cols-[1fr_24px] max-[780px]:gap-2"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="grid place-items-center flex-none w-9 h-9 rounded-full text-[#245d4a] bg-[#cde8d3] text-[10px] font-bold">{initialsFor(member.fullName)}</span>
                      <div className="min-w-0">
                        <strong className="block text-[13px] text-ink truncate">{member.fullName}</strong>
                        <span className="block mt-[2px] text-[10px] text-[#8b9992] truncate">
                          {member.memberNumber}
                          {member.status !== "active" ? ` · ${member.status}` : ""}
                          {member.email ? ` · ${member.email}` : ""}
                        </span>
                      </div>
                    </div>
                    <div className="text-[12px] text-[#2d4037] max-[780px]:col-start-1 max-[780px]:pl-12">
                      {formatDate(member.joinedAt)}
                      <span className="block mt-[2px] text-[10px] text-[#8b9992]">{formatBsDate(member.joinedAt)}</span>
                    </div>
                    <div className="text-[11px] max-[780px]:col-start-1 max-[780px]:pl-12">
                      {member.missingRequired.length > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full font-bold text-[#9a5a22] bg-[#fdf1e1]">
                          <CircleAlert size={12} /> Missing {member.missingRequired.join(", ")}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full font-bold text-[#3c825b] bg-[#e6f3e6]">
                          <CheckCircle2 size={12} /> Required complete
                        </span>
                      )}
                      <span className="block mt-1 text-[10px] text-[#8b9992]">{member.documentsUploaded}/{member.documentsTotal} uploaded</span>
                    </div>
                    <ChevronRight size={16} className="text-[#9aa8a1] max-[780px]:row-start-1 max-[780px]:col-start-2" />
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </SuperadminLayout>
  );
}
