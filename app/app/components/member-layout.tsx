"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import Dashboard from "./dashboard";
import { signOut } from "../lib/auth";

type MemberLayoutProps = { active: "overview" | "meetings" | "payments" | "receipts" | "profile"; children: ReactNode };

const links = [
  ["overview", "Overview", "/member"],
  ["meetings", "Meetings", "/member/meetings"],
  ["payments", "Payments", "/member/payments"],
  ["receipts", "Receipts", "/member/receipts"],
  ["profile", "My profile", "/member/profile"],
] as const;

export default function MemberLayout({ active, children }: MemberLayoutProps) {
  const router = useRouter();
  return <Dashboard role="member" fullPage><div className="member-shell"><aside className="member-sidebar"><div className="sidebar-brand"><span className="sidebar-mark">W</span><span>WAFA</span></div><nav className="member-nav" aria-label="Member navigation">{links.map(([key, label, href]) => <a key={key} className={active === key ? "member-nav-item active" : "member-nav-item"} href={href}><span>{key === "overview" ? "⌂" : key === "meetings" ? "◷" : key === "payments" ? "◈" : key === "receipts" ? "▤" : "◎"}</span>{label}</a>)}</nav><div className="sidebar-bottom"><a className="member-nav-item" href="#help"><span>?</span> Help center</a><div className="sidebar-user"><span className="avatar">AR</span><span><strong>Alex Rivera</strong><small>Member</small></span></div></div></aside><section className="member-main"><header className="member-topbar"><div className="mobile-brand"><span className="sidebar-mark">W</span> WAFA</div><div className="topbar-actions"><span className="topbar-avatar">AR</span><span className="topbar-name">Alex Rivera</span><button className="member-signout" onClick={() => { void signOut(); router.replace("/"); }}>Sign out</button></div></header>{children}</section></div></Dashboard>;
}
