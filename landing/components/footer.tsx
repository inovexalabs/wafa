"use client";

import Image from "next/image";
import { Globe, Mail, MapPin, Phone } from "lucide-react";
import { NAV_LINKS, smoothScrollTo } from "@/lib/site";
import type { LandingContact } from "@/lib/content";

export default function Footer({ contact }: { contact: LandingContact }) {
  return (
    <footer className="border-t border-line bg-cream-soft px-6 pb-8 pt-16">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 sm:grid-cols-[1.2fr_1fr_1fr]">
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
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={(event) => smoothScrollTo(event, link.href)}
                  className="text-xs text-muted transition-colors hover:text-brand"
                >
                  {link.label}
                </a>
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
        </div>
      </div>

      <div className="mx-auto mt-14 flex max-w-6xl flex-col items-center justify-between gap-3 border-t border-line pt-6 text-xs text-muted sm:flex-row">
        <p>&copy; {new Date().getFullYear()} WAFA Group. All rights reserved.</p>
        <p>We Are For All</p>
      </div>
    </footer>
  );
}
