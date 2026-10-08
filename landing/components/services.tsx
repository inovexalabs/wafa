"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowUpRight,
  Award,
  BookOpenText,
  CalendarClock,
  MessageSquare,
  PiggyBank,
  ReceiptText,
} from "lucide-react";
import { CLUSTERS, PILLAR, clusterPath } from "@/lib/clusters";
import type { LandingServiceItem } from "@/lib/content";

const ICON_STYLE = [
  { icon: PiggyBank, color: "#1f6752" },
  { icon: ReceiptText, color: "#d98a2b" },
  { icon: BookOpenText, color: "#2e78b5" },
  { icon: Award, color: "#d1553f" },
  { icon: CalendarClock, color: "#2f8a6e" },
  { icon: MessageSquare, color: "#7a4fb0" },
];

export default function Services({ services }: { services: LandingServiceItem[] }) {
  return (
    <section id="services" className="bg-cream-soft px-6 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-xs font-bold uppercase tracking-[0.2em] text-brand"
          >
            What WAFA offers
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="mt-3 text-balance font-display text-[clamp(1.6rem,3vw,2.3rem)] font-bold leading-tight tracking-tight text-ink"
          >
            Everything a cooperative needs, in one workspace
          </motion.h2>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, i) => {
            const style = ICON_STYLE[i % ICON_STYLE.length];
            return (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 26 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.55, delay: (i % 3) * 0.08 }}
                whileHover={{ y: -6 }}
                className="group relative overflow-hidden rounded-2xl border border-line bg-cream p-7 transition-shadow duration-300 hover:shadow-[0_25px_60px_-30px_rgba(20,32,27,0.4)]"
              >
                <span
                  className="absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-25"
                  style={{ backgroundColor: style.color }}
                />
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-105"
                  style={{ backgroundColor: `${style.color}1a`, color: style.color }}
                >
                  <style.icon className="h-5.5 w-5.5" />
                </span>
                <h3 className="mt-5 font-display text-base font-bold text-ink">{service.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted">{service.text}</p>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-12 flex flex-wrap justify-center gap-3">
          {CLUSTERS.map((cluster) => (
            <Link
              key={cluster.slug}
              href={clusterPath(cluster.slug)}
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-cream px-5 py-2.5 text-xs font-semibold text-ink transition-colors duration-300 hover:bg-brand/10 hover:text-brand"
            >
              {cluster.navLabel}
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          ))}
          <Link
            href={PILLAR.path}
            className="inline-flex items-center gap-1.5 rounded-full bg-brand px-5 py-2.5 text-xs font-semibold text-white transition-colors duration-300 hover:bg-brand-dark"
          >
            View all services
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
