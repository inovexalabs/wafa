import { PILLAR } from "@/lib/clusters";

export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// Canonical URLs, the sitemap and robots.txt are all built from this. When
// NEXT_PUBLIC_SITE_URL isn't set, fall back to the production domain Vercel
// exposes to the build, so production never advertises a localhost URL.
const vercelProductionHost = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL;
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (vercelProductionHost ? `https://${vercelProductionHost}` : "http://localhost:3003");

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

// Cloudflare Turnstile site key for the contact form captcha. Unset = no captcha
// widget (the API only requires a token when TURNSTILE_SECRET_KEY is set).
export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

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
  { label: "Blog", href: "/blog" },
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
