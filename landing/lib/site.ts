import type { MouseEvent } from "react";

export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";

export type NavLink =
  | { label: string; href: string }
  | { label: string; children: { label: string; href: string }[] };

export const NAV_LINKS: NavLink[] = [
  {
    label: "About",
    children: [
      { label: "Overview", href: "#about" },
      { label: "Our Team", href: "#team" },
      { label: "Board & Direction", href: "#board" },
      { label: "Gallery", href: "#gallery" },
      { label: "Career", href: "#career" },
      { label: "Partners", href: "#partners" },
      { label: "Investments & Projects", href: "#investments" },
    ],
  },
  { label: "Services", href: "#services" },
  { label: "How it works", href: "#how-it-works" },
  { label: "News & Notices", href: "#news" },
  { label: "Documents", href: "#documents" },
  { label: "Contact", href: "#contact" },
];

export function smoothScrollTo(
  event: MouseEvent<HTMLAnchorElement>,
  href: string,
) {
  if (!href.startsWith("#")) return;
  const target = document.getElementById(href.slice(1));
  if (!target) return;
  event.preventDefault();
  target.scrollIntoView({
    behavior: "smooth",
    block: href === "#impact" ? "center" : "start",
  });
}
