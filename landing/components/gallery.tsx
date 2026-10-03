"use client";

import Image from "next/image";
import { motion } from "motion/react";
import type { LandingItem } from "@/lib/content";
import { useShowMore } from "@/lib/use-show-more";

const LIMIT = 6;

export default function Gallery({ items }: { items: LandingItem[] }) {
  const { visible, hasMore, showAll, setShowAll } = useShowMore(items, LIMIT);

  if (items.length === 0) return null;

  return (
    <section id="gallery" className="bg-cream-soft px-6 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">About WAFA</p>
          <h2 className="mt-3 text-balance font-display text-[clamp(1.6rem,3vw,2.3rem)] font-bold leading-tight tracking-tight text-ink">
            Gallery
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Moments from meetings, member events, and cooperative milestones.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((item, i) => (
            <motion.figure
              key={item.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: (i % 3) * 0.08 }}
              className="overflow-hidden rounded-2xl border border-line bg-cream"
            >
              <div className="relative aspect-[4/3] w-full">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.title ?? "Gallery image"}
                    fill
                    className="object-cover"
                  />
                ) : null}
              </div>
              {(item.title || item.description) && (
                <figcaption className="p-4">
                  {item.title ? <p className="text-sm font-semibold text-ink">{item.title}</p> : null}
                  {item.description ? (
                    <p className="mt-1 text-xs leading-relaxed text-muted">{item.description}</p>
                  ) : null}
                </figcaption>
              )}
            </motion.figure>
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
