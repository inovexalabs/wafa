"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Award, CalendarClock, ChevronDown, ChevronRight, LayoutDashboard, LogOut, MessageCircle, UserCircle } from "lucide-react";
import Dashboard from "./dashboard";
import NotificationBell from "./notification-bell";
import { getStaffProfile, signOut } from "../lib/auth";
import { useSidebarCollapsed } from "../lib/use-sidebar-collapsed";

type AccountantLayoutProps = { active: "overview" | "meetings" | "certificates" | "chat" | "profile"; children: ReactNode };

function initialsFor(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const initials = (parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "");
  return initials.toUpperCase() || "?";
}

function labelClass(collapsed: boolean) {
  return (
    "overflow-hidden whitespace-nowrap transition-[opacity,max-width] duration-300 ease-in-out " +
    (collapsed ? "opacity-0 max-w-0" : "opacity-100 max-w-[170px]")
  );
}

const links = [
  ["overview", "Overview", "/accountant", LayoutDashboard],
  ["meetings", "Meetings", "/accountant/meetings", CalendarClock],
  ["certificates", "Certificates", "/accountant/certificates", Award],
  ["chat", "Chat", "/accountant/chat", MessageCircle],
  ["profile", "My profile", "/accountant/profile", UserCircle],
] as const;

export default function AccountantLayout({ active, children }: AccountantLayoutProps) {
  const router = useRouter();
  const { collapsed, toggle } = useSidebarCollapsed();
  const [fullName, setFullName] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    getStaffProfile("accountant")
      .then((profile) => { if (!cancelled) setFullName(profile.fullName ?? profile.userId); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const initials = fullName ? initialsFor(fullName) : "";
  const currentLink = links.find(([key]) => key === active);
  return (
    <Dashboard role="accountant" fullPage>
      <div className="min-h-screen bg-cream">
        <aside
          className={
            "flex flex-col fixed top-0 left-0 z-10 h-dvh py-7 overflow-y-auto overflow-x-hidden text-[#d9e9df] bg-[#164b3c] transition-[width] duration-300 ease-in-out max-[650px]:hidden " +
            (collapsed ? "w-[72px] px-4" : "w-[238px] px-4 max-[900px]:w-[205px]")
          }
        >
          <div
            className={
              "flex items-center mb-[22px] pb-[15px] border-b border-white/[.15] text-white font-bold tracking-[.12em] transition-[gap,padding] duration-300 ease-in-out " +
              (collapsed ? "gap-0 px-1" : "gap-[10px] px-[13px]")
            }
          >
            <Image className="block w-[31px] h-[31px] object-contain border border-[#b5d6c1] rounded-[9px] bg-white shrink-0" src="/logo.jpeg" alt="WAFA Group logo" width={32} height={32} />
            <span className={labelClass(collapsed)}>WAFA FINANCE</span>
          </div>
          <nav className="grid gap-[6px] mt-[12px]" aria-label="Accountant navigation">
            {links.map(([key, label, href, Icon]) => (
              <Link
                key={key}
                className={
                  "flex items-center w-full rounded-lg text-[13px] no-underline transition-[gap,padding,background-color,color] duration-300 ease-in-out hover:text-white hover:bg-white/[.12] " +
                  (collapsed ? "gap-0 px-[11px] py-3 " : "gap-[13px] px-[13px] py-3 ") +
                  (active === key ? "text-white bg-white/[.12]" : "text-[#b5cfc1]")
                }
                href={href}
                title={label}
              >
                <span className="inline-flex items-center justify-center flex-none w-[18px]"><Icon size={18} /></span>
                <span className={labelClass(collapsed)}>{label}</span>
              </Link>
            ))}
          </nav>
          <div className="mt-auto">
            <button
              type="button"
              className={
                "flex items-center w-full mb-[6px] rounded-lg border-0 text-[13px] text-[#b5cfc1] bg-transparent cursor-pointer transition-[gap,padding,background-color,color] duration-300 ease-in-out hover:text-white hover:bg-white/[.12] " +
                (collapsed ? "gap-0 px-[11px] py-3" : "gap-[13px] px-[13px] py-3")
              }
              onClick={toggle}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <span className="inline-flex items-center justify-center flex-none w-[18px]">{collapsed ? <ArrowRight size={18} /> : <ArrowLeft size={18} />}</span>
              <span className={labelClass(collapsed)}>Collapse</span>
            </button>
            <div className="flex items-center gap-[9px] mt-[22px] pt-[15px] border-t border-white/[.15] text-xs">
              <span className="grid place-items-center flex-none w-8 h-8 rounded-full text-[#245d4a] bg-[#cde8d3] text-[10px] font-bold">{initials}</span>
              <span className={labelClass(collapsed)}>
                <strong className="block whitespace-nowrap">{fullName || "Loading…"}</strong>
                <small className="block mt-[3px] text-[#91b7a3] text-[10px] whitespace-nowrap">Accountant</small>
              </span>
            </div>
          </div>
        </aside>
        <section className={"min-w-0 transition-[margin-left] duration-300 ease-in-out max-[650px]:ml-0 " + (collapsed ? "ml-[72px]" : "ml-[238px] max-[900px]:ml-[205px]")}>
          <header
            className={
              "flex justify-between items-center h-[76px] px-6 border-b border-[#e4ebe6] bg-white fixed top-0 right-0 z-20 transition-[left] duration-300 ease-in-out max-[650px]:left-0 max-[650px]:h-16 max-[650px]:px-5 " +
              (collapsed ? "left-[72px]" : "left-[238px] max-[900px]:left-[205px]")
            }
          >
            <div className="flex items-center gap-[14px]">
              <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[13px] max-[650px]:hidden">
                <Link href="/accountant" className={"no-underline transition-colors duration-200 " + (active === "overview" ? "text-ink font-semibold" : "text-muted hover:text-brand")}>
                  Accountant
                </Link>
                {active !== "overview" && currentLink && (
                  <span key={active} className="flex items-center gap-2 animate-[breadcrumb-in_250ms_ease-out]">
                    <ChevronRight size={14} className="text-muted" />
                    <span className="text-ink font-semibold">{currentLink[1]}</span>
                  </span>
                )}
              </nav>
              <div className="hidden max-[650px]:flex items-center gap-2 text-brand text-sm font-bold">
                <Image className="block w-[27px] h-[27px] object-contain border border-brand rounded-[9px] bg-white" src="/logo.jpeg" alt="WAFA Group logo" width={32} height={32} /> WAFA FINANCE
              </div>
            </div>
            <div className="flex items-center gap-[10px]">
              <NotificationBell role="accountant" />
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  className="flex items-center gap-3 text-[#65756e] text-xs bg-transparent border-0 cursor-pointer px-2 py-1.5 rounded-lg hover:bg-[#eef5f0]"
                  onClick={() => setMenuOpen((open) => !open)}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                >
                  <span className="grid place-items-center w-[30px] h-[30px] rounded-full text-[#245d4a] bg-[#cde8d3] text-[10px] font-bold">{initials}</span>
                  <span className="max-[650px]:hidden">{fullName || "Loading…"}</span>
                  <ChevronDown size={14} className={"max-[650px]:hidden transition-transform " + (menuOpen ? "rotate-180" : "")} />
                </button>
                {menuOpen && (
                  <div role="menu" className="absolute right-0 top-[calc(100%+8px)] w-[190px] rounded-lg border border-[#e4ebe6] bg-white shadow-[0_12px_28px_-12px_rgba(22,75,60,0.25)] overflow-hidden">
                    <Link
                      role="menuitem"
                      href="/accountant/profile"
                      className="flex items-center gap-[10px] px-4 py-3 text-[#2d4037] text-xs no-underline hover:bg-[#f0f7f0]"
                      onClick={() => setMenuOpen(false)}
                    >
                      <UserCircle size={15} /> Profile
                    </Link>
                    <button
                      role="menuitem"
                      type="button"
                      className="flex items-center gap-[10px] w-full px-4 py-3 border-0 border-t border-[#edf1ee] text-[#286c54] bg-white cursor-pointer text-xs font-bold hover:bg-[#f0f7f0]"
                      onClick={() => { setMenuOpen(false); void signOut(); router.replace("/"); }}
                    >
                      <LogOut size={15} /> Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>
          {children}
        </section>
      </div>
    </Dashboard>
  );
}
