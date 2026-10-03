"use client";

import Image from "next/image";
import { motion } from "motion/react";
import type { LandingPerson } from "@/lib/content";

export default function Team({ people }: { people: LandingPerson[] }) {
  if (people.length === 0) return null;

  return (
    <section id="team" className="bg-cream-soft px-6 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">About WAFA</p>
          <h2 className="mt-3 text-balance font-display text-[clamp(1.6rem,3vw,2.3rem)] font-bold leading-tight tracking-tight text-ink">
            The people who keep WAFA running
          </h2>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {people.map((person, i) => (
            <motion.div
              key={person.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: (i % 3) * 0.08 }}
              className="rounded-2xl border border-line bg-cream p-6 transition-colors duration-300 hover:bg-cream/70"
            >
              <span className="relative block h-20 w-20 overflow-hidden rounded-2xl bg-cream-soft ring-1 ring-brand/15">
                {person.photoUrl ? (
                  <Image src={person.photoUrl} alt={person.name} fill className="object-cover" />
                ) : null}
              </span>
              <p className="mt-4 font-display text-base font-bold text-ink">{person.name}</p>
              {person.title ? (
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-brand">
                  {person.title}
                </p>
              ) : null}
              {person.bio ? (
                <p className="mt-2 text-xs leading-relaxed text-muted">{person.bio}</p>
              ) : null}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
