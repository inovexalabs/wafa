"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { HeartHandshake, Landmark, Users } from "lucide-react";
import type { LandingAbout } from "@/lib/content";

const PILLARS = [
  {
    icon: HeartHandshake,
    title: "Built on trust",
    text: "Every rupee saved and every loan issued is recorded openly, so members always know where things stand.",
  },
  {
    icon: Users,
    title: "Owned by members",
    text: "WAFA isn't a bank chasing profit. Decisions are made for the people who make up the cooperative.",
  },
  {
    icon: Landmark,
    title: "Built to last",
    text: "Structured governance across superadmin, admin, accountant and member roles keeps operations accountable.",
  },
];

export default function About({ content }: { content: LandingAbout }) {
  return (
    <section id="about" className="px-6 py-28 sm:py-36">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-[0.85fr_1.15fr]">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="relative mx-auto w-full max-w-sm"
          >
            <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-br from-brand/15 via-gold/10 to-sky/10 blur-2xl" />
            <div className="overflow-hidden rounded-[2rem] border border-line bg-cream-soft p-10 shadow-[0_30px_80px_-30px_rgba(20,32,27,0.3)]">
              <Image
                src="/logo.jpeg"
                alt="WAFA Group"
                width={160}
                height={160}
                className="mx-auto h-40 w-40 rounded-2xl object-contain"
              />
              <p className="mt-6 text-center font-display text-lg font-bold text-ink">
                {content.quote}
              </p>
              <p className="mt-2 text-center text-xs text-muted">
                {content.quoteCaption}
              </p>
            </div>
          </motion.div>

          <div>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-xs font-bold uppercase tracking-[0.2em] text-brand"
            >
              {content.eyebrow}
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="mt-3 text-balance font-display text-[clamp(1.6rem,3vw,2.3rem)] font-bold leading-tight tracking-tight text-ink"
            >
              {content.heading}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mt-5 max-w-xl text-sm leading-relaxed text-muted"
            >
              {content.body}
            </motion.p>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {PILLARS.map((pillar, i) => (
            <motion.div
              key={pillar.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: i * 0.1 }}
              className="group flex items-start gap-4 rounded-2xl border border-transparent p-3 transition-colors duration-300 hover:border-line hover:bg-cream-soft"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand transition-transform duration-300 group-hover:scale-110">
                <pillar.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">{pillar.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">{pillar.text}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
