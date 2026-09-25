"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  Check,
  CircleDashed,
  Command,
  ShieldCheck,
  Sparkles,
  UserCog,
  Users,
} from "lucide-react";
import SuperadminLayout from "../../components/superadmin-layout";
import { createUser, listMeetingRecipients, UserRole } from "../../lib/auth";

type Role = "admin" | "accountant" | "member";
type CreatedUser = { id: string; userId: string; role: UserRole };

const roleLabels: Record<Role, string> = { admin: "Admin", accountant: "Accountant", member: "Member" };

const saFormInput = "w-full h-[42px] mt-[7px] border border-line rounded-md px-[11px] outline-none text-[#2d4037] bg-white text-xs focus:border-[#2b7358] focus:shadow-[0_0_0_3px_#2b73581a]";
const saFormLabel = "block text-[#53665c] text-[11px] font-bold";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning.";
  if (hour < 18) return "Good afternoon.";
  return "Good evening.";
}

function SuperadminWorkspace() {
  const [role, setRole] = useState<Role>("admin");
  const [form, setForm] = useState({ userId: "", email: "", password: "", fullName: "", memberNumber: "", phone: "" });
  const [createdUsers, setCreatedUsers] = useState<CreatedUser[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [counts, setCounts] = useState<{ total: number; staff: number; members: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    listMeetingRecipients("superadmin")
      .then((recipients) => {
        if (cancelled) return;
        const staff = recipients.filter((r) => r.role !== "member").length;
        const members = recipients.filter((r) => r.role === "member").length;
        setCounts({ total: recipients.length, staff, members });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setIsSubmitting(true);
    try {
      const created = await createUser({ ...form, role, ...(role === "member" ? {} : { fullName: undefined, memberNumber: undefined, phone: undefined }) });
      setCreatedUsers((current) => [created, ...current]);
      setCounts((current) =>
        current
          ? {
              total: current.total + 1,
              staff: current.staff + (role === "member" ? 0 : 1),
              members: current.members + (role === "member" ? 1 : 0),
            }
          : current,
      );
      setMessage(`${roleLabels[role]} ${form.userId} was created successfully.`);
      setForm({ userId: "", email: "", password: "", fullName: "", memberNumber: "", phone: "" });
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to create this user.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <main className="max-w-[1190px] mx-auto px-6 pt-20 max-[650px]:px-4 max-[650px]:pt-[68px] h-dvh flex flex-col overflow-hidden">
        <div className="shrink-0 flex justify-between items-end gap-5 max-[760px]:items-start max-[760px]:flex-col">
          <div>
            <p className="mb-[13px] text-[11px] font-bold tracking-[.18em] uppercase text-brand">System administration</p>
            <h1 className="m-0 font-display font-bold text-[clamp(32px,4vw,48px)] leading-[1.1] tracking-[-.04em]">{greeting()}</h1>
            <p className="mt-[10px] text-muted text-sm">Manage access, roles, and the people who keep WAFA moving.</p>
          </div>
        </div>

        <div className="no-scrollbar flex-1 min-h-0 overflow-y-auto pb-6">
        <div className="grid grid-cols-3 gap-4 mt-[35px] max-[760px]:grid-cols-1">
          <article className="flex items-start gap-[15px] p-5 border border-[#e0e9e3] rounded-[10px] bg-white">
            <span className="grid place-items-center w-[38px] h-[38px] rounded-[9px] text-[#2a7657] bg-[#e1f2e4]"><Users size={17} /></span>
            <div>
              <small className="block text-[#7c8a83] text-[11px]">Total users</small>
              <strong className="block my-1 text-2xl">{counts ? counts.total : "—"}</strong>
              <em className="block text-[#6b9d78] text-[10px] not-italic">Across every role</em>
            </div>
          </article>
          <article className="flex items-start gap-[15px] p-5 border border-[#e0e9e3] rounded-[10px] bg-white">
            <span className="grid place-items-center w-[38px] h-[38px] rounded-[9px] text-[#4b7ea4] bg-[#e5f0f8]"><UserCog size={17} /></span>
            <div>
              <small className="block text-[#7c8a83] text-[11px]">Staff</small>
              <strong className="block my-1 text-2xl">{counts ? counts.staff : "—"}</strong>
              <em className="block text-[#6b9d78] text-[10px] not-italic">Superadmins, admins & accountants</em>
            </div>
          </article>
          <article className="flex items-start gap-[15px] p-5 border border-[#e0e9e3] rounded-[10px] bg-white">
            <span className="grid place-items-center w-[38px] h-[38px] rounded-[9px] text-[#b56f36] bg-[#f8eadc]"><ShieldCheck size={17} /></span>
            <div>
              <small className="block text-[#7c8a83] text-[11px]">Members</small>
              <strong className="block my-1 text-2xl">{counts ? counts.members : "—"}</strong>
              <em className="block text-[#6b9d78] text-[10px] not-italic">Active accounts</em>
            </div>
          </article>
        </div>

        <div className="grid grid-cols-[1.3fr_.7fr] gap-[18px] mt-5 max-[760px]:grid-cols-1">
          <section className="p-[25px] border border-[#e0e9e3] rounded-[10px] bg-white max-[500px]:px-4 max-[500px]:py-[19px]">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="m-0 font-display font-bold text-2xl tracking-[-.025em]">Create a user</h2>
                <p className="mt-[6px] text-[#8b9992] text-[11px]">Give someone access to the WAFA workspace.</p>
              </div>
              <span className="grid place-items-center w-[34px] h-[34px] rounded-[9px] text-[#236950] bg-[#e5f4e6]"><Command size={16} /></span>
            </div>
            <div className="flex gap-[22px] my-6 mb-5 border-b border-[#edf1ee]">
              {(["admin", "accountant", "member"] as Role[]).map((item) => (
                <button
                  key={item}
                  className={
                    "border-0 border-b-2 pb-[11px] bg-transparent cursor-pointer text-[11px] " +
                    (role === item ? "border-[#287257] text-[#24634e] font-bold" : "border-transparent text-[#9aa69f]")
                  }
                  onClick={() => { setRole(item); setError(""); setMessage(""); }}
                >
                  {roleLabels[item]}
                </button>
              ))}
            </div>
            <form onSubmit={submit} className="grid gap-[15px]">
              <div className="grid grid-cols-2 gap-[14px] max-[500px]:grid-cols-1">
                <label className={saFormLabel}>User ID<input className={saFormInput} value={form.userId} onChange={(event) => updateField("userId", event.target.value)} placeholder="e.g. jane.smith" required /></label>
                <label className={saFormLabel}>Email address<input className={saFormInput} type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} placeholder="name@company.com" required /></label>
              </div>
              {role === "member" && (
                <div className="grid grid-cols-2 gap-[14px] max-[500px]:grid-cols-1">
                  <label className={saFormLabel}>Full name<input className={saFormInput} value={form.fullName} onChange={(event) => updateField("fullName", event.target.value)} placeholder="Jane Smith" required /></label>
                  <label className={saFormLabel}>Member number<input className={saFormInput} value={form.memberNumber} onChange={(event) => updateField("memberNumber", event.target.value)} placeholder="WFA-00042" required /></label>
                </div>
              )}
              <label className={saFormLabel}>Temporary password<input className={saFormInput} type="password" value={form.password} onChange={(event) => updateField("password", event.target.value)} placeholder="At least 8 characters" minLength={8} required /></label>
              {role === "member" && (
                <label className={saFormLabel}>Phone <span className="text-[#9aa8a1] text-[10px] font-normal">Optional</span><input className={saFormInput} value={form.phone} onChange={(event) => updateField("phone", event.target.value)} placeholder="+977 ..." /></label>
              )}
              {error && <p className="m-0 text-[11px] text-[#ae4d44]" role="alert">{error}</p>}
              {message && <p className="m-0 text-[11px] text-[#38805d]" role="status">{message}</p>}
              <button className="flex justify-center gap-3 border-0 rounded-md p-[13px] text-white bg-brand cursor-pointer text-xs font-bold disabled:opacity-65 disabled:cursor-wait" disabled={isSubmitting}>{isSubmitting ? "Creating user..." : `Create ${roleLabels[role].toLowerCase()}`} <span>→</span></button>
            </form>
          </section>
          <section className="p-[25px] border border-[#e0e9e3] rounded-[10px] bg-white min-h-[370px] max-[500px]:px-4 max-[500px]:py-[19px]">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="m-0 font-display font-bold text-2xl tracking-[-.025em]">Recent activity</h2>
                <p className="mt-[6px] text-[#8b9992] text-[11px]">Latest access changes.</p>
              </div>
              <span className="grid place-items-center w-[34px] h-[34px] rounded-[9px] text-[#236950] bg-[#e5f4e6]"><Activity size={16} /></span>
            </div>
            <div className="mt-[26px]">
              {createdUsers.length === 0 ? (
                <div className="grid place-items-center py-10 text-[#a0aaa5] text-center">
                  <CircleDashed size={26} />
                  <p className="mt-2 text-[11px] leading-[1.6]">No new accounts yet.<br />Created users will appear here.</p>
                </div>
              ) : (
                createdUsers.map((user) => (
                  <div className="flex items-center gap-[10px] py-[13px] border-t border-[#edf1ee]" key={user.id}>
                    <span className="grid place-items-center w-[31px] h-[31px] rounded-full text-[#2d7257] bg-[#e4f2e5] text-[9px] font-bold">{user.userId.slice(0, 2).toUpperCase()}</span>
                    <div className="flex-1">
                      <strong className="block text-[11px]">{user.userId}</strong>
                      <span className="block mt-[3px] text-[#9aa69f] text-[9px]">{roleLabels[user.role as Role] ?? user.role} account created just now</span>
                    </div>
                    <b className="text-[#a0aaa5] text-[9px] font-normal">Now</b>
                  </div>
                ))
              )}
            </div>
            <Link className="block mt-5 text-[#286c54] text-[11px] font-bold no-underline" href="/superadmin/audit">View audit log <span>→</span></Link>
          </section>
        </div>
        </div>
      </main>
    </>
  );
}

export default function SuperadminDashboard() {
  return (
    <SuperadminLayout active="overview">
      <SuperadminWorkspace />
    </SuperadminLayout>
  );
}
