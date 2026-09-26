"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { APP_URL, smoothScrollTo } from "@/lib/site";
import type { LandingHero } from "@/lib/content";

export default function Hero({ content }: { content: LandingHero }) {
  const headline = content.headline;
  return (
    <section
      id="top"
      className="relative flex h-screen flex-col justify-end overflow-hidden pt-20 pb-10 sm:pb-14"
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 -right-32 h-[520px] w-[520px] animate-drift rounded-full bg-brand/15 blur-3xl" />
        <div
          className="absolute top-1/3 -left-40 h-[420px] w-[420px] animate-drift rounded-full bg-gold/15 blur-3xl"
          style={{ animationDelay: "-4s" }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(20,32,27,0.06)_1px,transparent_0)] bg-[size:28px_28px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,#000_20%,transparent_75%)]" />
        <div className="absolute inset-0 overflow-hidden opacity-[0.22] mix-blend-multiply [mask-image:radial-gradient(circle_at_50%_50%,#000_45%,transparent_78%)]">
          <Image
            src="/logo.jpeg"
            alt=""
            fill
            className="scale-75 object-contain object-center"
            priority
            aria-hidden="true"
          />
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-[96rem] grid-cols-1 items-center gap-16 px-6 sm:px-10 lg:grid-cols-2 lg:gap-10 xl:gap-24 2xl:px-20">
        <div className="flex max-w-xl flex-col justify-center">
          <p className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-line/70 bg-cream-soft/70 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-brand backdrop-blur-sm">
            {content.eyebrow}
          </p>
          <h1 className="font-display text-balance text-[clamp(2.1rem,5vw,3.6rem)] font-bold leading-[1.05] tracking-[-0.03em] text-ink">
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
                className="block overflow-hidden"
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
              onClick={(event) => smoothScrollTo(event, "#about")}
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

        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-md rounded-[2rem] bg-cream-soft/60 p-1.5 shadow-[0_40px_90px_-30px_rgba(20,32,27,0.35)] ring-1 ring-line/70 lg:ml-auto"
        >
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[1.7rem] shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)]">
            <Image
              src="https://picsum.photos/seed/wafa-cooperative/900/1125"
              alt="WAFA members at a cooperative savings meeting"
              fill
              sizes="(max-width: 1024px) 90vw, 480px"
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/35 via-transparent to-transparent" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
