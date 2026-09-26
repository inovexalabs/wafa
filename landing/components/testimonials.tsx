"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Quote } from "lucide-react";
import type { LandingTestimonial } from "@/lib/content";

export default function Testimonials({ testimonials }: { testimonials: LandingTestimonial[] }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (testimonials.length < 2) return;
    const id = setInterval(() => {
      setActive((v) => (v + 1) % testimonials.length);
    }, 5200);
    return () => clearInterval(id);
  }, [testimonials.length]);

  const current = testimonials[active] ?? testimonials[0];
  if (!current) return null;

  return (
    <section
      id="impact"
      className="relative mt-10 flex min-h-[55vh] items-center overflow-hidden bg-brand px-6 py-12 text-white sm:mt-14 sm:min-h-[50vh] sm:py-16"
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 left-1/4 h-72 w-72 animate-drift rounded-full bg-white/10 blur-3xl" />
        <div
          className="absolute bottom-0 right-1/5 h-80 w-80 animate-drift rounded-full bg-gold/20 blur-3xl"
          style={{ animationDelay: "-6s" }}
        />
      </div>

      <div className="mx-auto w-full max-w-3xl text-center">
        <Quote className="mx-auto h-7 w-7 text-white/40" />
        <div className="relative mt-6 min-h-[130px] sm:min-h-[110px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="text-balance font-display text-lg font-semibold leading-relaxed sm:text-xl">
                &ldquo;{current.quote}&rdquo;
              </p>
              <p className="mt-6 text-xs font-semibold text-white/90">
                {current.name}
              </p>
              <p className="text-xs uppercase tracking-[0.15em] text-white/60">
                {current.role}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-7 flex items-center justify-center gap-2">
          {testimonials.map((quote, i) => (
            <button
              key={quote.name}
              type="button"
              aria-label={`Show testimonial ${i + 1}`}
              onClick={() => setActive(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === active ? "w-8 bg-white" : "w-1.5 bg-white/35 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
