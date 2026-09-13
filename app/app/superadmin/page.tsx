"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "../lib/auth";
import Dashboard from "../components/dashboard";
import { createUser, UserRole } from "../lib/auth";

type Role = "admin" | "accountant" | "member";
type CreatedUser = { id: string; userId: string; role: UserRole };

const roleLabels: Record<Role, string> = { admin: "Admin", accountant: "Accountant", member: "Member" };

function SuperadminWorkspace() {
  const router = useRouter();
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

  return <div className="sa-shell">
    <header className="sa-topbar"><div className="sa-brand"><span className="sa-mark">W</span><span>WAFA CONTROL CENTER</span></div><div className="sa-topbar-user"><span className="sa-avatar">SA</span><span><strong>Superadmin</strong><small>Full workspace access</small></span><button className="sa-signout" onClick={() => { void signOut(); router.replace("/"); }}>Sign out</button></div></header>
    <main className="sa-content"><div className="sa-heading"><div><p className="eyebrow form-eyebrow">System administration</p><h1>Good morning.</h1><p>Manage access, roles, and the people who keep WAFA moving.</p></div><span className="sa-status"><i /> System operational</span></div>
      <div className="sa-stats"><article><span className="sa-stat-icon">♙</span><div><small>Total users</small><strong>{42 + createdUsers.length}</strong><em>↑ 8% this month</em></div></article><article><span className="sa-stat-icon blue">▣</span><div><small>Administrators</small><strong>{4 + createdUsers.filter((user) => user.role === "admin").length}</strong><em>Across all teams</em></div></article><article><span className="sa-stat-icon orange">◉</span><div><small>Members</small><strong>{38 + createdUsers.filter((user) => user.role === "member").length}</strong><em>Active accounts</em></div></article></div>
      <div className="sa-grid"><section className="sa-card sa-create-card"><div className="sa-card-title"><div><h2>Create a user</h2><p>Give someone access to the WAFA workspace.</p></div><span className="sa-lock">⌘</span></div><div className="sa-role-tabs">{(["admin", "accountant", "member"] as Role[]).map((item) => <button key={item} className={role === item ? "selected" : ""} onClick={() => { setRole(item); setError(""); setMessage(""); }}>{roleLabels[item]}</button>)}</div><form onSubmit={submit} className="sa-form"><div className="sa-form-grid"><label>User ID<input value={form.userId} onChange={(event) => updateField("userId", event.target.value)} placeholder="e.g. jane.smith" required /></label><label>Email address<input type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} placeholder="name@company.com" required /></label></div>{role === "member" && <div className="sa-form-grid"><label>Full name<input value={form.fullName} onChange={(event) => updateField("fullName", event.target.value)} placeholder="Jane Smith" required /></label><label>Member number<input value={form.memberNumber} onChange={(event) => updateField("memberNumber", event.target.value)} placeholder="WFA-00042" required /></label></div>}<label>Temporary password<input type="password" value={form.password} onChange={(event) => updateField("password", event.target.value)} placeholder="At least 8 characters" minLength={8} required /></label>{role === "member" && <label>Phone <span className="optional">Optional</span><input value={form.phone} onChange={(event) => updateField("phone", event.target.value)} placeholder="+977 ..." /></label>}{error && <p className="sa-form-error" role="alert">{error}</p>}{message && <p className="sa-form-success" role="status">{message}</p>}<button className="sa-submit" disabled={isSubmitting}>{isSubmitting ? "Creating user..." : `Create ${roleLabels[role].toLowerCase()}`} <span>→</span></button></form></section>
        <section className="sa-card sa-activity-card"><div className="sa-card-title"><div><h2>Recent activity</h2><p>Latest access changes.</p></div><button className="sa-more" aria-label="More activity options">•••</button></div><div className="sa-activity-list">{createdUsers.length === 0 ? <div className="sa-empty"><span>◌</span><p>No new accounts yet.<br />Created users will appear here.</p></div> : createdUsers.map((user) => <div className="sa-activity-row" key={user.id}><span className="sa-activity-avatar">{user.userId.slice(0, 2).toUpperCase()}</span><div><strong>{user.userId}</strong><span>{roleLabels[user.role as Role] ?? user.role} account created just now</span></div><b>Now</b></div>)}</div><a className="sa-view-all" href="#activity">View audit log <span>→</span></a></section></div>
      <section className="sa-security"><span className="sa-security-icon">✓</span><div><strong>Protected by role-based access control</strong><p>Only authenticated superadmins can create administrators. Admins have their own restricted route for accountants and members.</p></div><span className="sa-shield">◈</span></section>
    </main>
  </div>;
}

export default function SuperadminDashboard() {
  return <Dashboard role="superadmin" fullPage><SuperadminWorkspace /></Dashboard>;
}


