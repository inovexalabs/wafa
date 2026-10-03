"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import type { LandingItem } from "@/lib/content";
import { useShowMore } from "@/lib/use-show-more";

const LIMIT = 4;

export default function Investments({ items }: { items: LandingItem[] }) {
  const { visible, hasMore, showAll, setShowAll } = useShowMore(items, LIMIT);

  if (items.length === 0) return null;

  return (
    <section id="investments" className="px-6 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">About WAFA</p>
          <h2 className="mt-3 text-balance font-display text-[clamp(1.6rem,3vw,2.3rem)] font-bold leading-tight tracking-tight text-ink">
            Investments, Projects & Business
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Where member savings go to work — the projects and ventures WAFA Group invests in.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-10 sm:grid-cols-2">
          {visible.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: (i % 2) * 0.1 }}
              className="overflow-hidden rounded-[1.75rem] border border-line bg-cream-soft"
            >
              <div className="relative aspect-[16/10] w-full">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.title ?? "Investment"}
                    fill
                    className="object-cover"
                  />
                ) : null}
              </div>
              <div className="p-7">
                {item.title ? (
                  <p className="font-display text-lg font-bold text-ink">{item.title}</p>
                ) : null}
                {item.description ? (
                  <p className="mt-2 text-sm leading-relaxed text-muted">{item.description}</p>
                ) : null}
                {item.linkUrl ? (
                  <a
                    href={item.linkUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-brand"
                  >
                    Learn more
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                ) : null}
              </div>
            </motion.div>
          ))}
        </div>

        {hasMore ? (
          <div className="mt-10 flex justify-center">
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-full border border-line px-5 py-2.5 text-xs font-semibold text-ink transition-colors duration-300 hover:bg-brand/10 hover:text-brand"
            >
              {showAll ? "Show less" : `View all (${items.length})`}
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
