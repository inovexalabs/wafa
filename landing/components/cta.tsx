"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { APP_URL } from "@/lib/site";
import type { LandingCta } from "@/lib/content";

export default function Cta({ content }: { content: LandingCta }) {
  return (
    <section id="contact" className="px-6 py-14 sm:py-20">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
        className="relative mx-auto max-w-5xl rounded-[2.6rem] bg-cream-soft/60 p-1.5 shadow-[0_40px_90px_-40px_rgba(20,32,27,0.35)] ring-1 ring-line/70"
      >
        <div className="relative overflow-hidden rounded-[2.25rem] bg-cream-soft px-8 py-10 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.7)] sm:px-16 sm:py-14">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -top-20 -left-16 h-64 w-64 animate-drift rounded-full bg-brand/15 blur-3xl" />
            <div
              className="absolute -bottom-24 -right-10 h-64 w-64 animate-drift rounded-full bg-coral/15 blur-3xl"
              style={{ animationDelay: "-5s" }}
            />
          </div>

          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">
            Ready when you are
          </p>
          <h2 className="mx-auto mt-4 max-w-xl text-balance font-display text-[clamp(1.6rem,3.5vw,2.2rem)] font-bold leading-tight tracking-tight text-ink">
            {content.heading}
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted">
            {content.body}
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <a
              href="mailto:wafagroup10@outlook.com"
              className="group inline-flex items-center gap-2.5 rounded-full bg-brand py-1.5 pl-8 pr-1.5 text-sm font-semibold text-white shadow-[0_16px_35px_-14px_rgba(31,103,82,0.75)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
            >
              Get in touch
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 transition-transform duration-300 group-hover:translate-x-1">
                <ArrowRight className="h-4 w-4" />
              </span>
            </a>
            <Link
              href={APP_URL}
              className="inline-flex items-center gap-2 rounded-full border border-line px-8 py-3.5 text-sm font-semibold text-ink transition-colors duration-300 hover:border-brand hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
            >
              Member login
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
