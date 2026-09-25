"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { APP_URL, smoothScrollTo } from "@/lib/site";
import type { LandingHero } from "@/lib/content";

const dotColors = ["#d1553f", "#d98a2b", "#2e78b5", "#1f6752", "#2f8a6e"];

export default function Hero({ content }: { content: LandingHero }) {
  const headline = content.headline;
  return (
    <section
      id="top"
      className="relative flex h-screen flex-col justify-end overflow-hidden pt-28 pb-16 sm:pb-20"
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 -right-32 h-[520px] w-[520px] animate-drift rounded-full bg-brand/15 blur-3xl" />
        <div
          className="absolute top-1/3 -left-40 h-[420px] w-[420px] animate-drift rounded-full bg-gold/15 blur-3xl"
          style={{ animationDelay: "-4s" }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(20,32,27,0.06)_1px,transparent_0)] bg-[size:28px_28px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,#000_20%,transparent_75%)]" />
      </div>

      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-end gap-16 px-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="flex flex-col justify-end">
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
              className="group inline-flex items-center gap-2 rounded-full bg-brand px-7 py-3.5 text-sm font-semibold text-white shadow-[0_16px_35px_-14px_rgba(31,103,82,0.75)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-dark"
            >
              {content.primaryCta}
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </a>
            <Link
              href={APP_URL}
              className="inline-flex items-center gap-2 rounded-full border border-line px-7 py-3.5 text-sm font-semibold text-ink transition-colors duration-300 hover:border-brand hover:text-brand"
            >
              {content.secondaryCta}
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative mx-auto flex aspect-square w-full max-w-md items-center justify-center"
        >
          <div className="absolute inset-0 animate-spin-slow rounded-full border border-dashed border-brand/25" />
          <div className="absolute inset-8 animate-spin-slow-reverse rounded-full border border-dashed border-gold/30" />

          {dotColors.map((color, i) => {
            const angle = (i / dotColors.length) * 2 * Math.PI;
            const radius = 44;
            const x = 50 + radius * Math.cos(angle);
            const y = 50 + radius * Math.sin(angle);
            return (
              <span
                key={color}
                className="animate-float-y absolute h-4 w-4 rounded-full shadow-lg"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  backgroundColor: color,
                  animationDelay: `${i * 0.4}s`,
                }}
              />
            );
          })}

          <div className="relative flex h-56 w-56 items-center justify-center rounded-full bg-cream-soft shadow-[0_30px_80px_-20px_rgba(20,32,27,0.35)] ring-1 ring-line sm:h-64 sm:w-64">
            <Image
              src="/logo.jpeg"
              alt="WAFA Group emblem"
              width={192}
              height={192}
              className="h-40 w-40 rounded-[2.5rem] object-contain sm:h-48 sm:w-48"
              priority
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
