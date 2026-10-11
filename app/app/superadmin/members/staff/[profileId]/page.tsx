"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import SuperadminLayout from "../../../../../components/superadmin-layout";
import MemberDocumentsPanel from "../../../../../components/member-documents-panel";
import { listStaffDirectory, StaffDirectoryEntry, staffRoleLabels } from "../../../../../lib/auth";

function initialsFor(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const initials = (parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "");
  return initials.toUpperCase() || "?";
}

export default function SuperadminStaffDetailPage() {
  const { profileId } = useParams<{ profileId: string }>();
  const [user, setUser] = useState<StaffDirectoryEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    listStaffDirectory()
      .then((staff) => {
        const found = staff.find((entry) => entry.id === profileId);
        if (found) setUser(found);
        else setLoadError("This staff user could not be found.");
      })
      .catch((error) => setLoadError(error instanceof Error ? error.message : "Unable to load this staff user."))
      .finally(() => setIsLoading(false));
  }, [profileId]);

  return (
    <SuperadminLayout active="members">
      <main className="max-w-[1000px] mx-auto px-6 pt-20 pb-14 max-[650px]:px-4 max-[650px]:pt-[68px]">
        <Link href="/superadmin/members/staff" className="inline-flex items-center gap-1.5 mb-6 text-[11px] font-bold text-brand no-underline">
          <ArrowLeft size={14} /> All staff
        </Link>

        {isLoading ? (
          <div className="h-[320px] rounded-[10px] bg-[#edf1ee] animate-pulse" />
        ) : loadError || !user ? (
          <div className="p-5 rounded-2xl border border-[#f3d6d3] bg-[#fdf3f2] text-[#ae4d44] text-sm" role="alert">{loadError || "This staff user could not be found."}</div>
        ) : (
          <div className="flex flex-col gap-5">
            <section className="p-[29px] border border-[#e1e9e4] rounded-[10px] bg-white max-[500px]:px-4 max-[500px]:py-[19px]">
              <div className="flex items-center gap-[14px]">
                <span className="grid place-items-center w-[58px] h-[58px] rounded-full text-[#276b52] bg-[#cfe8d4] text-base font-bold shrink-0">{initialsFor(user.fullName)}</span>
                <div className="min-w-0">
                  <h1 className="m-0 leading-tight font-display font-bold text-2xl truncate">{user.fullName}</h1>
                  <p className="m-0 mt-[6px] text-[#8b9992] text-[11px] truncate">
                    {user.userId} · {user.email}
                    {user.phone ? ` · ${user.phone}` : ""}
                  </p>
                </div>
                <span className="ml-auto px-[10px] py-[7px] rounded-2xl text-[#6a5fae] bg-[#ede9fb] text-[10px] font-bold shrink-0">{staffRoleLabels[user.role]}</span>
              </div>
            </section>

            <MemberDocumentsPanel
              owner={{ kind: "staffUser", profileId: user.id }}
              description="Review, upload, or replace this staff user's documents. Files are private to them and super admins."
            />
          </div>
        )}
      </main>
    </SuperadminLayout>
  );
}
