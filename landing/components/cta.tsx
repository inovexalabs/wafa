"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { APP_URL } from "@/lib/site";
import type { LandingCta } from "@/lib/content";

export default function Cta({ content }: { content: LandingCta }) {
  return (
    <section id="contact" className="px-6 py-24 sm:py-28">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative mx-auto max-w-5xl overflow-hidden rounded-[2.5rem] border border-line bg-cream-soft px-8 py-16 text-center shadow-[0_40px_90px_-40px_rgba(20,32,27,0.35)] sm:px-16"
      >
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
            className="group inline-flex items-center gap-2 rounded-full bg-brand px-8 py-3.5 text-sm font-semibold text-white shadow-[0_16px_35px_-14px_rgba(31,103,82,0.75)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-dark"
          >
            Get in touch
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </a>
          <Link
            href={APP_URL}
            className="inline-flex items-center gap-2 rounded-full border border-line px-8 py-3.5 text-sm font-semibold text-ink transition-colors duration-300 hover:border-brand hover:text-brand"
          >
            Member login
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
