import type { MouseEvent } from "react";
import { PILLAR } from "@/lib/clusters";

export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";

export type NavLink =
  | { label: string; href: string }
  | { label: string; children: { label: string; href: string }[] };

// Section links are written as "/#id" so they also work from other pages;
// on the homepage smoothScrollTo intercepts them and scrolls in place.
export const NAV_LINKS: NavLink[] = [
  {
    label: "About",
    children: [
      { label: "Overview", href: "/#about" },
      { label: "Our Team", href: "/#team" },
      { label: "Board & Direction", href: "/#board" },
      { label: "Gallery", href: "/#gallery" },
      { label: "Career", href: "/#career" },
      { label: "Partners", href: "/#partners" },
      { label: "Investments & Projects", href: "/#investments" },
    ],
  },
  { label: "Services", href: PILLAR.path },
  { label: "How it works", href: "/#how-it-works" },
  { label: "News & Notices", href: "/#news" },
  { label: "Documents", href: "/#documents" },
  { label: "Contact", href: "/#contact" },
];

export function isSectionLink(href: string) {
  return href.startsWith("#") || href.startsWith("/#");
}

export function smoothScrollTo(
  event: MouseEvent<HTMLAnchorElement>,
  href: string,
) {
  if (!isSectionLink(href)) return;
  const hash = href.slice(href.indexOf("#"));
  // Off the homepage the section doesn't exist, so let the link navigate.
  const target = document.getElementById(hash.slice(1));
  if (!target) return;
  event.preventDefault();
  target.scrollIntoView({
    behavior: "smooth",
    block: hash === "#impact" ? "center" : "start",
  });
}
