"use client";

import { FormEvent, useState } from "react";
import SuperadminLayout from "../../components/superadmin-layout";
import { createUser, UserRole } from "../../lib/auth";

type Role = "admin" | "accountant" | "member";
type CreatedUser = { id: string; userId: string; role: UserRole };

const roleLabels: Record<Role, string> = { admin: "Admin", accountant: "Accountant", member: "Member" };

const saFormInput = "w-full h-[42px] mt-[7px] border border-line rounded-md px-[11px] outline-none text-[#2d4037] bg-white text-xs focus:border-[#2b7358] focus:shadow-[0_0_0_3px_#2b73581a]";
const saFormLabel = "block text-[#53665c] text-[11px] font-bold";

function SuperadminWorkspace() {
  const [role, setRole] = useState<Role>("admin");
  const [form, setForm] = useState({ userId: "", email: "", password: "", fullName: "", memberNumber: "", phone: "" });
  const [createdUsers, setCreatedUsers] = useState<CreatedUser[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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
      <main className="max-w-[1190px] mx-auto px-6 pt-20 pb-2 max-[650px]:px-4 max-[650px]:pt-[68px] max-[650px]:pb-2 min-h-[calc(100vh-76px)]">
        <div className="flex justify-between items-end gap-5 max-[760px]:items-start max-[760px]:flex-col">
          <div>
            <p className="mb-[13px] text-[11px] font-bold tracking-[.18em] uppercase text-brand">System administration</p>
            <h1 className="m-0 font-display font-bold text-[clamp(32px,4vw,48px)] leading-[1.1] tracking-[-.04em]">Good morning.</h1>
            <p className="mt-[10px] text-muted text-sm">Manage access, roles, and the people who keep WAFA moving.</p>
          </div>
          <span className="flex items-center gap-[7px] px-[11px] py-2 border border-[#d6e7d9] rounded-[20px] text-[#4b8560] bg-[#f0f8ef] text-[10px] font-bold max-[760px]:self-start"><i className="block w-[7px] h-[7px] rounded-full bg-[#58a86e]" /> System operational</span>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-[35px] max-[760px]:grid-cols-1">
          <article className="flex items-start gap-[15px] p-5 border border-[#e0e9e3] rounded-[10px] bg-white">
            <span className="grid place-items-center w-[38px] h-[38px] rounded-[9px] text-[#2a7657] bg-[#e1f2e4]">♙</span>
            <div>
              <small className="block text-[#7c8a83] text-[11px]">Total users</small>
              <strong className="block my-1 text-2xl">{42 + createdUsers.length}</strong>
              <em className="block text-[#6b9d78] text-[10px] not-italic">↑ 8% this month</em>
            </div>
          </article>
          <article className="flex items-start gap-[15px] p-5 border border-[#e0e9e3] rounded-[10px] bg-white">
            <span className="grid place-items-center w-[38px] h-[38px] rounded-[9px] text-[#4b7ea4] bg-[#e5f0f8]">▣</span>
            <div>
              <small className="block text-[#7c8a83] text-[11px]">Administrators</small>
              <strong className="block my-1 text-2xl">{4 + createdUsers.filter((user) => user.role === "admin").length}</strong>
              <em className="block text-[#6b9d78] text-[10px] not-italic">Across all teams</em>
            </div>
          </article>
          <article className="flex items-start gap-[15px] p-5 border border-[#e0e9e3] rounded-[10px] bg-white">
            <span className="grid place-items-center w-[38px] h-[38px] rounded-[9px] text-[#b56f36] bg-[#f8eadc]">◉</span>
            <div>
              <small className="block text-[#7c8a83] text-[11px]">Members</small>
              <strong className="block my-1 text-2xl">{38 + createdUsers.filter((user) => user.role === "member").length}</strong>
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
              <span className="grid place-items-center w-[34px] h-[34px] rounded-[9px] text-[#236950] bg-[#e5f4e6]">⌘</span>
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
              <button className="border-0 text-[#9aa8a1] bg-transparent tracking-[2px] cursor-pointer" aria-label="More activity options">•••</button>
            </div>
            <div className="mt-[26px]">
              {createdUsers.length === 0 ? (
                <div className="grid place-items-center py-10 text-[#a0aaa5] text-center">
                  <span className="text-[28px]">◌</span>
                  <p className="text-[11px] leading-[1.6]">No new accounts yet.<br />Created users will appear here.</p>
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
            <a className="block mt-5 text-[#286c54] text-[11px] font-bold no-underline" href="#activity">View audit log <span>→</span></a>
          </section>
        </div>
        <section className="flex items-center gap-[13px] mt-5 px-5 py-[17px] border border-[#dce8df] rounded-[9px] bg-[#f0f7ee] max-[500px]:items-start">
          <span className="grid place-items-center w-[27px] h-[27px] rounded-full text-white bg-[#5b9c70] text-xs">✓</span>
          <div>
            <strong className="text-xs">Protected by role-based access control</strong>
            <p className="mt-1 text-[#809087] text-[10px]">Only authenticated superadmins can create administrators. Admins have their own restricted route for accountants and members.</p>
          </div>
          <span className="ml-auto text-[#a5c8ac] text-2xl max-[500px]:hidden">◈</span>
        </section>
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
