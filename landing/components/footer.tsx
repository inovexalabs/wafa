"use client";

import Image from "next/image";
import Link from "next/link";
import { Globe, Link2, Mail, MapPin, Phone } from "lucide-react";
import type { LandingContact, LandingSocialLink } from "@/lib/content";
import { CLUSTERS, PILLAR, clusterPath } from "@/lib/clusters";
import type { SVGProps } from "react";

// lucide-react no longer ships brand/social icons, so these are small
// inline outlines kept consistent with lucide's stroke-based style.
function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M14 9h3V5h-3a4 4 0 0 0-4 4v2H7v4h3v6h4v-6h3l1-4h-4v-2a1 1 0 0 1 1-1Z" />
    </svg>
  );
}

function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TwitterIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 5.8c-.7.3-1.5.6-2.3.7a4 4 0 0 0 1.8-2.2 8 8 0 0 1-2.5 1 4 4 0 0 0-6.9 3.6A11.4 11.4 0 0 1 3.9 4.6a4 4 0 0 0 1.2 5.3 4 4 0 0 1-1.8-.5v.1a4 4 0 0 0 3.2 3.9 4 4 0 0 1-1.8.1 4 4 0 0 0 3.7 2.8A8 8 0 0 1 2 17.9a11.3 11.3 0 0 0 6.1 1.8c7.3 0 11.3-6.1 11.3-11.3v-.5A8 8 0 0 0 22 5.8Z" />
    </svg>
  );
}

function LinkedinIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="8" y1="11" x2="8" y2="16" />
      <line x1="8" y1="8" x2="8" y2="8" />
      <path d="M12 16v-3a2 2 0 0 1 4 0v3" />
      <line x1="16" y1="11" x2="16" y2="16" />
    </svg>
  );
}

function YoutubeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="2" y="6" width="20" height="12" rx="4" />
      <polygon points="10 9.5 15 12 10 14.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

const FOOTER_LINKS = [
  { href: "/#about", label: "About" },
  { href: "/#board", label: "Board & Direction" },
  { href: "/#news", label: "News & Notices" },
  { href: "/#documents", label: "Documents" },
  { href: "/#faq", label: "FAQs" },
  { href: "/#contact", label: "Contact" },
];

const SERVICE_LINKS = [
  ...CLUSTERS.map((cluster) => ({ href: clusterPath(cluster.slug), label: cluster.navLabel })),
  { href: PILLAR.path, label: PILLAR.navLabel },
];

type IconComponent = (props: SVGProps<SVGSVGElement>) => ReturnType<typeof FacebookIcon>;

const SOCIAL_ICONS: Record<string, IconComponent> = {
  facebook: FacebookIcon,
  instagram: InstagramIcon,
  twitter: TwitterIcon,
  x: TwitterIcon,
  linkedin: LinkedinIcon,
  youtube: YoutubeIcon,
};

function iconFor(platform: string) {
  const Icon = SOCIAL_ICONS[platform.trim().toLowerCase()];
  return Icon ?? Link2;
}

export default function Footer({
  contact,
  socialLinks = [],
}: {
  contact: LandingContact;
  socialLinks?: LandingSocialLink[];
}) {
  return (
    <footer className="border-t border-line bg-cream-soft px-6 pb-8 pt-16">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <span className="relative block h-10 w-10 overflow-hidden rounded-xl ring-1 ring-brand/15">
              <Image src="/logo.jpeg" alt="WAFA Group" fill className="object-cover" />
            </span>
            <span className="font-display text-lg font-bold text-ink">WAFA Group</span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
            A member-owned savings and credit cooperative, established 2080
            B.S., built on transparency and shared growth.
          </p>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-ink">Explore</p>
          <ul className="mt-4 space-y-2.5">
            {FOOTER_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-xs text-muted transition-colors hover:text-brand"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-ink">Services</p>
          <ul className="mt-4 space-y-2.5">
            {SERVICE_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-xs text-muted transition-colors hover:text-brand"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-ink">Get in touch</p>
          <ul className="mt-4 space-y-3">
            <li className="flex items-start gap-2.5 text-xs text-muted">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
              {contact.address}
            </li>
            <li className="flex items-center gap-2.5 text-xs text-muted">
              <Mail className="h-3.5 w-3.5 shrink-0 text-brand" />
              {contact.email}
            </li>
            <li className="flex items-center gap-2.5 text-xs text-muted">
              <Phone className="h-3.5 w-3.5 shrink-0 text-brand" />
              {contact.phone}
            </li>
            <li className="flex items-center gap-2.5 text-xs text-muted">
              <Globe className="h-3.5 w-3.5 shrink-0 text-brand" />
              {contact.website}
            </li>
          </ul>

          {socialLinks.length > 0 && (
            <div className="mt-5 flex items-center gap-2.5">
              {socialLinks.map((social) => {
                const Icon = iconFor(social.platform);
                return (
                  <a
                    key={social.url}
                    href={social.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={social.platform}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 text-brand transition-colors hover:bg-brand hover:text-white"
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto mt-14 flex max-w-6xl flex-col items-center justify-between gap-3 border-t border-line pt-6 text-xs text-muted sm:flex-row">
        <p>&copy; {new Date().getFullYear()} WAFA Group. All rights reserved.</p>
        <div className="flex items-center gap-5">
          <Link href="/privacy" className="text-muted transition-colors hover:text-brand">
            Privacy Policy
          </Link>
          <Link href="/terms" className="text-muted transition-colors hover:text-brand">
            Terms of Service
          </Link>
        </div>
      </div>
    </footer>
  );
}
