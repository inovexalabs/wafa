import { PILLAR } from "@/lib/clusters";

export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";

export type NavLink =
  | { label: string; href: string }
  | { label: string; children: { label: string; href: string }[] };

// Section links are written as "/#id" so they still work without JavaScript;
// SectionLinks intercepts them and scrolls smoothly without a hash in the URL.
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

// "/#id" or "#id" -> "id"; anything else -> null.
export function sectionIdFromHref(href: string) {
  if (href.startsWith("/#")) return href.slice(2) || null;
  if (href.startsWith("#")) return href.slice(1) || null;
  return null;
}

// Smoothly scrolls to a homepage section; false if it isn't on this page.
export function scrollToSection(id: string) {
  const target = document.getElementById(id);
  if (!target) return false;
  target.scrollIntoView({
    behavior: "smooth",
    block: id === "impact" ? "center" : "start",
  });
  return true;
}
