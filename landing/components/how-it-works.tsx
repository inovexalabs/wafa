"use client";

import { motion } from "motion/react";
import { CheckCircle2, PiggyBank, TrendingUp, UserPlus } from "lucide-react";
import type { LandingStep } from "@/lib/content";

const ICONS = [UserPlus, PiggyBank, CheckCircle2, TrendingUp];

export default function HowItWorks({ steps }: { steps: LandingStep[] }) {
  return (
    <section id="how-it-works" className="px-6 py-28 sm:py-36">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-xs font-bold uppercase tracking-[0.2em] text-brand"
          >
            How it works
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="mt-3 text-balance font-display text-[clamp(1.6rem,3vw,2.3rem)] font-bold leading-tight tracking-tight text-ink"
          >
            From your first deposit to your first dividend
          </motion.h2>
        </div>

        <div className="relative mt-20">
          <div className="absolute left-6 top-6 hidden h-[calc(100%-3rem)] w-px bg-line lg:left-1/2 lg:block" />
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-4 lg:gap-6">
            {steps.map((step, i) => {
              const Icon = ICONS[i % ICONS.length];
              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.6, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                  className="relative flex flex-col items-start gap-4 rounded-2xl border border-line bg-cream-soft p-6 lg:items-center lg:text-center"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand text-sm font-bold text-white shadow-[0_10px_25px_-8px_rgba(31,103,82,0.7)]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10 text-brand">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-display text-sm font-bold text-ink">{step.title}</p>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted">{step.text}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
