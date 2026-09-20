"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Dashboard from "./dashboard";
import { signOut } from "../lib/auth";
import { useSidebarCollapsed } from "../lib/use-sidebar-collapsed";

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
  const { collapsed, toggle } = useSidebarCollapsed();
  return (
    <Dashboard role="member" fullPage>
      <div className={collapsed ? "member-shell collapsed" : "member-shell"}>
        <aside className="member-sidebar">
          <button type="button" className="sidebar-toggle" onClick={toggle} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
            {collapsed ? "»" : "«"}
          </button>
          <div className="sidebar-brand">
            <img className="sidebar-mark" src="/logo.jpeg" alt="WAFA Group logo" />
            <span className="nav-label">WAFA</span>
          </div>
          <nav className="member-nav" aria-label="Member navigation">
            {links.map(([key, label, href]) => (
              <Link key={key} className={active === key ? "member-nav-item active" : "member-nav-item"} href={href} title={label}>
                <span className="nav-icon">{key === "overview" ? "⌂" : key === "meetings" ? "◷" : key === "payments" ? "◈" : key === "receipts" ? "▤" : "◎"}</span>
                <span className="nav-label">{label}</span>
              </Link>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <a className="member-nav-item" href="#help" title="Help center">
              <span className="nav-icon">?</span>
              <span className="nav-label">Help center</span>
            </a>
            <div className="sidebar-user">
              <span className="avatar">AR</span>
              <span className="nav-label"><strong>Alex Rivera</strong><small>Member</small></span>
            </div>
          </div>
        </aside>
        <section className="member-main">
          <header className="member-topbar">
            <div className="mobile-brand"><img className="sidebar-mark" src="/logo.jpeg" alt="WAFA Group logo" /> WAFA</div>
            <div className="topbar-actions">
              <span className="topbar-avatar">AR</span>
              <span className="topbar-name">Alex Rivera</span>
              <button className="member-signout" onClick={() => { void signOut(); router.replace("/"); }}>Sign out</button>
            </div>
          </header>
          {children}
        </section>
      </div>
    </Dashboard>
  );
}
