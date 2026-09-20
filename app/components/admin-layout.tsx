"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Dashboard from "./dashboard";
import { signOut } from "../lib/auth";
import { useSidebarCollapsed } from "../lib/use-sidebar-collapsed";

type AdminLayoutProps = { active: "overview" | "meeting"; children: ReactNode };

const links = [
  ["overview", "Overview", "/admin"],
  ["meeting", "Meetings", "/admin/meeting"],
] as const;

export default function AdminLayout({ active, children }: AdminLayoutProps) {
  const router = useRouter();
  const { collapsed, toggle } = useSidebarCollapsed();
  return (
    <Dashboard role="admin" fullPage>
      <div className={collapsed ? "member-shell collapsed" : "member-shell"}>
        <aside className="member-sidebar">
          <button type="button" className="sidebar-toggle" onClick={toggle} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
            {collapsed ? "»" : "«"}
          </button>
          <div className="sidebar-brand">
            <img className="sidebar-mark" src="/logo.jpeg" alt="WAFA Group logo" />
            <span className="nav-label">WAFA ADMIN</span>
          </div>
          <nav className="member-nav" aria-label="Admin navigation">
            {links.map(([key, label, href]) => (
              <Link key={key} className={active === key ? "member-nav-item active" : "member-nav-item"} href={href} title={label}>
                <span className="nav-icon">{key === "overview" ? "⌂" : "◷"}</span>
                <span className="nav-label">{label}</span>
              </Link>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <div className="sidebar-user">
              <span className="avatar">AD</span>
              <span className="nav-label"><strong>Admin</strong><small>Administrator</small></span>
            </div>
          </div>
        </aside>
        <section className="member-main">
          <header className="member-topbar">
            <div className="mobile-brand"><img className="sidebar-mark" src="/logo.jpeg" alt="WAFA Group logo" /> WAFA</div>
            <div className="topbar-actions">
              <span className="topbar-avatar">AD</span>
              <span className="topbar-name">Admin</span>
              <button className="member-signout" onClick={() => { void signOut(); router.replace("/"); }}>Sign out</button>
            </div>
          </header>
          {children}
        </section>
      </div>
    </Dashboard>
  );
}
