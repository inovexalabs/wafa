"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, BellRing } from "lucide-react";
import { excerpt, formatDate } from "@/components/news";
import { APP_URL } from "@/lib/site";
import type { LandingHero, NewsPost } from "@/lib/content";

const NOTICE_LIMIT = 4;

export default function Hero({ content, notices }: { content: LandingHero; notices: NewsPost[] }) {
  const headline = content.headline;
  const latestNotices = notices.slice(0, NOTICE_LIMIT);
  return (
    <section
      id="top"
      className="relative flex min-h-svh flex-col justify-end overflow-hidden pt-28 pb-10 sm:pb-14 lg:justify-center lg:pt-32"
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 -right-32 h-[520px] w-[520px] animate-drift rounded-full bg-brand/15 blur-3xl" />
        <div
          className="absolute top-1/3 -left-40 h-[420px] w-[420px] animate-drift rounded-full bg-gold/15 blur-3xl"
          style={{ animationDelay: "-4s" }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(20,32,27,0.06)_1px,transparent_0)] bg-[size:28px_28px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,#000_20%,transparent_75%)]" />
        <div className="absolute inset-0 hidden overflow-hidden opacity-[0.22] mix-blend-multiply [mask-image:radial-gradient(circle_at_50%_50%,#000_45%,transparent_78%)] lg:block">
          <Image
            src="/logo.jpeg"
            alt=""
            fill
            sizes="100vw"
            className="scale-75 object-contain object-center"
            priority
            aria-hidden="true"
          />
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-[96rem] grid-cols-1 items-center gap-10 px-6 sm:gap-16 sm:px-10 lg:grid-cols-2 lg:gap-10 xl:gap-24 2xl:px-20">
        <div className="flex max-w-xl flex-col justify-center max-lg:mx-auto max-lg:w-full">
          <div className="relative -mt-4 mb-6 h-48 w-[70%] self-center opacity-[0.3] mix-blend-multiply min-[400px]:h-56 sm:mb-8 sm:h-72 lg:hidden [@media(max-height:500px)]:hidden">
            <Image src="/logo.jpeg" alt="" fill sizes="80vw" className="object-contain" priority aria-hidden="true" />
          </div>
          <h1 className="font-display text-balance text-[clamp(2.4rem,6vw,4.2rem)] font-bold leading-[1.15] tracking-[-0.02em] text-ink">
            {headline.map((line, i) => (
              <motion.span
                key={line}
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.7,
                  delay: 0.15 + i * 0.12,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="block overflow-hidden pb-1"
              >
                {i === 1 ? (
                  <span className="bg-gradient-to-r from-brand via-brand-light to-sky bg-clip-text text-transparent">
                    {line}
                  </span>
                ) : (
                  line
                )}
              </motion.span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.55, ease: "easeOut" }}
            className="mt-7 max-w-lg text-base leading-relaxed text-muted"
          >
            {content.subtext}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7, ease: "easeOut" }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <a
              href="#about"
              className="group inline-flex items-center gap-2.5 rounded-full bg-brand py-1.5 pl-7 pr-1.5 text-sm font-semibold text-white shadow-[0_16px_35px_-14px_rgba(31,103,82,0.75)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
            >
              {content.primaryCta}
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 transition-transform duration-300 group-hover:translate-x-1">
                <ArrowRight className="h-4 w-4" />
              </span>
            </a>
            <Link
              href={APP_URL}
              className="inline-flex items-center gap-2 rounded-full border border-line px-7 py-3.5 text-sm font-semibold text-ink transition-colors duration-300 hover:border-brand hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
            >
              {content.secondaryCta}
            </Link>
          </motion.div>
        </div>

        <motion.aside
          aria-labelledby="hero-notices-title"
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-xl overflow-hidden rounded-[2rem] border border-white/70 bg-white/40 shadow-[0_30px_80px_-30px_rgba(20,32,27,0.3),inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-2xl backdrop-saturate-150 max-lg:mx-auto lg:ml-auto lg:max-w-sm"
        >
          {/* Same green-to-sky gradient as the "Grow together." line. */}
          <div className="h-1 bg-gradient-to-r from-brand via-brand-light to-sky" aria-hidden="true" />
          <div className="flex flex-col p-6 sm:p-7 lg:min-h-[34rem]">
            <div className="flex items-center gap-3.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand ring-1 ring-brand/15">
                <BellRing className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand">
                  Stay informed
                </p>
                <p id="hero-notices-title" className="font-display text-lg font-bold leading-tight text-ink">
                  Notice board
                </p>
              </div>
            </div>

            {latestNotices.length === 0 ? (
              <p className="mt-6 flex flex-1 items-center justify-center rounded-2xl border border-dashed border-brand/20 bg-white/30 px-5 py-8 text-center text-sm leading-relaxed text-muted">
                No notices right now. Official announcements will appear here.
              </p>
            ) : (
              <ul className="mt-5 divide-y divide-ink/10 border-y border-ink/10">
                {latestNotices.map((notice) => (
                  <li key={notice.id}>
                    <Link href="/#news" className="group block py-5">
                      <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-brand">
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-light" aria-hidden="true" />
                        {formatDate(notice.publishedAt)}
                      </p>
                      <p className="mt-1 line-clamp-2 text-sm font-semibold text-ink transition-colors duration-300 group-hover:text-brand">
                        {notice.title}
                      </p>
                      <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-muted">
                        {excerpt(notice.body, 160)}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-auto pt-6">
              <Link
                href="/#news"
                className="group inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-white/50 px-4 py-2 text-xs font-semibold text-brand transition-colors duration-300 hover:bg-brand hover:text-white"
              >
                View all news & notices
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </motion.aside>
      </div>
    </section>
  );
}
