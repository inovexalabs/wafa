"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, LogOut, Menu, X, type LucideIcon } from "lucide-react";

type NavLink = readonly [key: string, label: string, href: string, icon: LucideIcon];

type MobileNavProps = {
  links: readonly NavLink[];
  active: string;
  /** Keys shown in the bottom bar, with the short label to use there. Everything else lives under "More". */
  tabs: readonly (readonly [key: string, label: string])[];
  /** Optional headings for the "More" sheet; links not listed fall into a trailing untitled group. */
  groups?: readonly (readonly [title: string, keys: readonly string[]])[];
  /** Link opened from the account row at the top of the sheet instead of a tile. */
  profileKey: string;
  fullName: string;
  initials: string;
  roleLabel: string;
  extra?: ReactNode;
  onSignOut: () => void;
};

/** Bottom tab bar + "More" sheet that replaces the sidebar at phone widths (≤650px). */
export default function MobileNav({ links, active, tabs, groups = [], profileKey, fullName, initials, roleLabel, extra, onSignOut }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const tabKeys = new Set(tabs.map(([key]) => key));
  const profileLink = links.find(([key]) => key === profileKey);
  const rest = links.filter(([key]) => !tabKeys.has(key) && key !== profileKey);
  const grouped = groups
    .map(([title, keys]) => [title, rest.filter(([key]) => keys.includes(key))] as const)
    .filter(([, items]) => items.length > 0);
  const groupedKeys = new Set(grouped.flatMap(([, items]) => items.map(([key]) => key)));
  const ungrouped = rest.filter(([key]) => !groupedKeys.has(key));
  const sections = ungrouped.length ? [...grouped, ["", ungrouped] as const] : grouped;
  const moreActive = !tabKeys.has(active);

  return (
    <>
      <nav
        className="hidden max-[650px]:flex fixed inset-x-0 bottom-0 z-10 h-[var(--mobile-nav-h)] pb-[env(safe-area-inset-bottom)] border-t border-[#e4ebe6] bg-white/95 backdrop-blur"
        aria-label="Primary"
      >
        {tabs.map(([key, label]) => {
          const link = links.find(([linkKey]) => linkKey === key);
          if (!link) return null;
          const [, , href, Icon] = link;
          const isActive = active === key;
          return (
            <Link
              key={key}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={"flex flex-1 flex-col items-center justify-center gap-[3px] min-w-0 text-[10px] font-bold no-underline " + (isActive ? "text-brand" : "text-[#8b9992]")}
            >
              <span className={"grid place-items-center w-12 h-7 rounded-full transition-colors " + (isActive ? "bg-brand/10" : "")}>
                <Icon size={19} />
              </span>
              <span className="truncate max-w-full px-1">{label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
          className={"flex flex-1 flex-col items-center justify-center gap-[3px] min-w-0 border-0 bg-transparent cursor-pointer text-[10px] font-bold " + (moreActive ? "text-brand" : "text-[#8b9992]")}
        >
          <span className={"grid place-items-center w-12 h-7 rounded-full transition-colors " + (moreActive ? "bg-brand/10" : "")}>
            <Menu size={19} />
          </span>
          More
        </button>
      </nav>

      <div
        className={"min-[651px]:hidden fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 " + (open ? "opacity-100" : "opacity-0 pointer-events-none")}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        inert={!open}
        className={
          "min-[651px]:hidden fixed inset-x-0 bottom-0 z-50 flex flex-col max-h-[88dvh] rounded-t-[20px] bg-white shadow-[0_-18px_40px_-20px_rgba(22,75,60,0.35)] transition-transform duration-300 ease-out " +
          (open ? "translate-y-0" : "translate-y-full")
        }
      >
        <div className="shrink-0 px-5 pt-2.5">
          <span className="block w-10 h-1 mx-auto rounded-full bg-[#dfe8e3]" aria-hidden="true" />
          <div className="flex items-center gap-3 mt-4 pb-4 border-b border-[#edf1ee]">
            <Link
              href={profileLink?.[2] ?? "#"}
              onClick={() => setOpen(false)}
              aria-current={active === profileKey ? "page" : undefined}
              className="flex flex-1 items-center gap-3 min-w-0 -m-1.5 p-1.5 rounded-xl no-underline text-inherit active:bg-[#f2f7f3]"
            >
              <span className="grid place-items-center flex-none w-10 h-10 rounded-full text-[#245d4a] bg-[#cde8d3] text-xs font-bold">{initials}</span>
              <span className="flex-1 min-w-0">
                <strong className="block text-sm text-ink truncate">{fullName || "Loading…"}</strong>
                <small className="block mt-0.5 text-[11px] text-[#8b9992]">{roleLabel} · View profile</small>
              </span>
              <ChevronRight size={16} className="text-[#9aa8a1]" />
            </Link>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="grid place-items-center w-9 h-9 rounded-full border-0 bg-[#f1f5f2] text-muted cursor-pointer"
              aria-label="Close menu"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        <div className="no-scrollbar flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 pt-4 pb-[calc(20px+env(safe-area-inset-bottom))]">
          {sections.map(([title, items]) => (
            <section key={title || "more"} className="mb-5 last:mb-0">
              {title && <h2 className="m-0 mb-2 text-[10px] font-bold uppercase tracking-[.14em] text-[#8b9992]">{title}</h2>}
              <div className="grid grid-cols-3 gap-2">
                {items.map(([key, label, href, Icon]) => (
                  <Link
                    key={key}
                    href={href}
                    onClick={() => setOpen(false)}
                    aria-current={active === key ? "page" : undefined}
                    className={
                      "flex flex-col items-center gap-2 rounded-xl px-1.5 py-3 text-center text-[11px] font-semibold leading-tight no-underline " +
                      (active === key ? "bg-[#eef6f1] text-brand" : "text-[#2d4037] active:bg-[#f2f7f3]")
                    }
                  >
                    <span className={"grid place-items-center w-11 h-11 rounded-xl " + (active === key ? "bg-brand text-white" : "bg-[#eef6f1] text-brand")}>
                      <Icon size={19} />
                    </span>
                    {label}
                  </Link>
                ))}
              </div>
            </section>
          ))}

          <div className="grid gap-2 mt-5 pt-4 border-t border-[#edf1ee]">
            {extra}
            <button
              type="button"
              onClick={() => { setOpen(false); onSignOut(); }}
              className="flex items-center justify-center gap-2 h-11 rounded-xl border-0 bg-[#fdf3f2] text-[#ae4d44] cursor-pointer text-xs font-bold"
            >
              <LogOut size={15} /> Sign out
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
