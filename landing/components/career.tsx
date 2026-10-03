"use client";

import { motion } from "motion/react";
import { ArrowUpRight, MapPin } from "lucide-react";
import type { CareerOpening } from "@/lib/content";

export default function Career({ openings }: { openings: CareerOpening[] }) {
  return (
    <section id="career" className="px-6 py-16 sm:py-24">
      <div className="mx-auto max-w-4xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">About WAFA</p>
          <h2 className="mt-3 text-balance font-display text-[clamp(1.6rem,3vw,2.3rem)] font-bold leading-tight tracking-tight text-ink">
            Career
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Join the team building a transparent, member-owned cooperative.
          </p>
        </div>

        {openings.length === 0 ? (
          <p className="mt-14 text-center text-sm text-muted">
            No open roles right now — check back soon.
          </p>
        ) : (
          <div className="mt-14 flex flex-col divide-y divide-line border-y border-line">
            {openings.map((opening, i) => (
              <motion.div
                key={opening.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: (i % 4) * 0.06 }}
                className="flex flex-col gap-4 py-7 sm:flex-row sm:items-start sm:justify-between"
              >
                <div>
                  <p className="font-display text-lg font-bold text-ink">{opening.title}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {opening.location ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-3 py-1 text-[11px] font-semibold text-brand">
                        <MapPin className="h-3 w-3" />
                        {opening.location}
                      </span>
                    ) : null}
                    {opening.employmentType ? (
                      <span className="inline-flex items-center rounded-full bg-gold/15 px-3 py-1 text-[11px] font-semibold text-ink/70">
                        {opening.employmentType}
                      </span>
                    ) : null}
                  </div>
                  {opening.description ? (
                    <p className="mt-3 max-w-xl text-xs leading-relaxed text-muted">
                      {opening.description}
                    </p>
                  ) : null}
                </div>
                <a
                  href={opening.applyUrl || (opening.applyEmail ? `mailto:${opening.applyEmail}` : "#")}
                  target={opening.applyUrl ? "_blank" : undefined}
                  rel={opening.applyUrl ? "noreferrer" : undefined}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-brand px-5 py-2.5 text-xs font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5"
                >
                  Apply
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
