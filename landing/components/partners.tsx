"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import type { LandingItem } from "@/lib/content";

export default function Partners({ items }: { items: LandingItem[] }) {
  if (items.length === 0) return null;

  return (
    <section id="partners" className="bg-cream-soft px-6 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">About WAFA</p>
          <h2 className="mt-3 text-balance font-display text-[clamp(1.6rem,3vw,2.3rem)] font-bold leading-tight tracking-tight text-ink">
            Partners
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            The organizations and institutions that work alongside WAFA Group.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => {
            const card = (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.55, delay: (i % 3) * 0.08 }}
                className="flex h-full flex-col rounded-2xl border border-line bg-cream p-6 transition-colors duration-300 hover:bg-cream/70"
              >
                <span className="relative block h-14 w-14 overflow-hidden rounded-xl bg-cream-soft ring-1 ring-brand/15">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.title ?? "Partner logo"}
                      fill
                      className="object-contain p-2"
                    />
                  ) : null}
                </span>
                {item.title ? (
                  <p className="mt-4 font-display text-base font-bold text-ink">{item.title}</p>
                ) : null}
                {item.description ? (
                  <p className="mt-2 text-xs leading-relaxed text-muted">{item.description}</p>
                ) : null}
                {item.linkUrl ? (
                  <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-brand">
                    Visit website
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </span>
                ) : null}
              </motion.div>
            );

            return item.linkUrl ? (
              <a key={item.id} href={item.linkUrl} target="_blank" rel="noreferrer" className="block">
                {card}
              </a>
            ) : (
              <div key={item.id}>{card}</div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
