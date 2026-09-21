"use client";

import { FormEvent, useEffect, useState } from "react";
import AccountantLayout from "../../../components/accountant-layout";
import { getStaffProfile, StaffProfile, updateStaffProfile } from "../../../lib/auth";

function initialsFor(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const initials = (parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "");
  return initials.toUpperCase() || "?";
}

function memberSince(isoString: string) {
  return new Date(isoString).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

export default function AccountantProfilePage() {
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(false);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    getStaffProfile("accountant")
      .then((data) => {
        setProfile(data);
        setFullName(data.fullName ?? "");
        setPhone(data.phone ?? "");
      })
      .catch((error) => setLoadError(error instanceof Error ? error.message : "Unable to load your profile."))
      .finally(() => setIsLoading(false));
  }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setSaveError("");
    setSaved(false);
    try {
      const updated = await updateStaffProfile("accountant", { fullName, phone });
      setProfile(updated);
      setSaved(true);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Unable to save your profile.");
    } finally {
      setIsSaving(false);
    }
  }

  function cancel() {
    if (!profile) return;
    setFullName(profile.fullName ?? "");
    setPhone(profile.phone ?? "");
    setSaveError("");
    setSaved(false);
  }

  const fieldInput = "block w-full h-[42px] mt-[7px] border border-line rounded-md px-[11px] outline-none text-[#2d4037] bg-white font-inherit text-xs";

  return (
    <AccountantLayout active="profile">
      <main className="max-w-[1190px] mx-auto px-6 pt-20 pb-2 max-[650px]:px-4 max-[650px]:pt-[68px] max-[650px]:pb-2 min-h-[calc(100vh-76px)]">
        <div className="flex justify-between items-end gap-5 mb-[30px] max-[780px]:items-start max-[780px]:flex-col">
          <div>
            <p className="mb-[13px] text-[11px] font-bold tracking-[.18em] uppercase text-brand">Account settings</p>
            <h1 className="m-0 font-display font-bold text-[clamp(32px,4vw,46px)] leading-[1.1]">My profile</h1>
            <p className="mt-[9px] text-muted text-sm">Manage your accountant account details.</p>
          </div>
          <span className="px-[10px] py-[7px] rounded-2xl text-[#3c825b] bg-[#e6f3e6] text-[10px] font-bold">Accountant</span>
        </div>

        {isLoading ? (
          <div className="h-[300px] rounded-[10px] bg-[#edf1ee] animate-pulse" />
        ) : loadError ? (
          <div className="p-5 rounded-2xl border border-[#f3d6d3] bg-[#fdf3f2] text-[#ae4d44] text-sm" role="alert">{loadError}</div>
        ) : profile && (
          <form className="p-6 border border-[#e1e9e4] rounded-[10px] bg-white p-[29px] max-[500px]:px-4 max-[500px]:py-[19px]" onSubmit={save}>
            <div className="flex items-center gap-[14px] pb-[25px] border-b border-[#edf1ee] max-[780px]:items-start max-[780px]:flex-wrap">
              <span className="grid place-items-center w-[58px] h-[58px] rounded-full text-[#276b52] bg-[#cfe8d4] text-base font-bold">{initialsFor(profile.fullName ?? profile.userId)}</span>
              <div className="flex-1">
                <h2 className="m-0 leading-none font-display font-bold text-xl">{profile.fullName || profile.userId}</h2>
                <p className="m-0 mt-[6px] leading-none text-[#8b9992] text-[10px]">Accountant since {memberSince(profile.joinedAt)} · {profile.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-[19px_16px] mt-[25px] max-[780px]:grid-cols-1">
              <label className="text-[#53665c] text-[11px] font-bold">Full name<input className={fieldInput} value={fullName} onChange={(event) => setFullName(event.target.value)} required /></label>
              <label className="text-[#53665c] text-[11px] font-bold">User ID<input className={fieldInput + " bg-[#f5f7f6] text-[#8b9992]"} value={profile.userId} readOnly /></label>
              <label className="text-[#53665c] text-[11px] font-bold">Email address<input className={fieldInput + " bg-[#f5f7f6] text-[#8b9992]"} type="email" value={profile.email} readOnly /></label>
              <label className="text-[#53665c] text-[11px] font-bold">Phone number<input className={fieldInput} value={phone} onChange={(event) => setPhone(event.target.value)} /></label>
            </div>
            {saveError && <p className="m-0 mt-4 text-[11px] text-[#ae4d44]" role="alert">{saveError}</p>}
            {saved && !saveError && <p className="m-0 mt-4 text-[11px] text-[#38805d]">Profile saved successfully.</p>}
            <div className="flex justify-end gap-[15px] mt-[25px] pt-5 border-t border-[#edf1ee]">
              <button type="button" onClick={cancel} className="border-0 text-[#286c54] bg-transparent cursor-pointer text-[11px] font-bold p-[10px]">Cancel</button>
              <button type="submit" disabled={isSaving} className="border-0 rounded-[7px] px-[17px] py-3 text-white bg-brand cursor-pointer text-xs font-bold min-w-[120px] disabled:opacity-60 disabled:cursor-not-allowed">
                {isSaving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>
        )}
      </main>
    </AccountantLayout>
  );
}
