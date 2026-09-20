"use client";

import { FormEvent, useState } from "react";
import MemberLayout from "../../../components/member-layout";

export default function ProfilePage() {
  const [saved, setSaved] = useState(false);
  function save(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setSaved(true); }
  return <MemberLayout active="profile"><main className="member-content section-page"><div className="section-heading"><div><p className="eyebrow form-eyebrow">Account settings</p><h1>My profile</h1><p>Keep your personal details up to date.</p></div><span className="profile-badge">Active member</span></div><form className="member-card profile-card" onSubmit={save}><div className="profile-header"><span className="profile-avatar">AR</span><div><h2>Alex Rivera</h2><p>Member since January 2024 · alex.rivera@example.com</p></div><button type="button" className="outline-action">Change photo</button></div><div className="profile-fields"><label>Full name<input defaultValue="Alex Rivera" /></label><label>Email address<input type="email" defaultValue="alex.rivera@example.com" /></label><label>Phone number<input defaultValue="+977 9800000000" /></label><label>Occupation<input defaultValue="Product designer" /></label><label className="wide-field">Address<textarea defaultValue="Kathmandu, Nepal" /></label></div>{saved && <p className="sa-form-success">Profile saved successfully.</p>}<div className="profile-actions"><button type="button" className="text-action">Cancel</button><button className="primary-action">Save changes</button></div></form></main></MemberLayout>;
}
