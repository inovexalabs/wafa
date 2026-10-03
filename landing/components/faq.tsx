"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useState } from "react";
import { ArrowUpRight, Plus } from "lucide-react";
import type { LandingFaq } from "@/lib/content";
import { smoothScrollTo } from "@/lib/site";

export default function Faq({
  faqs,
  id = "faq",
  eyebrow = "FAQs",
  heading = "Frequently asked questions",
  showLinks = true,
}: {
  faqs: LandingFaq[];
  id?: string;
  eyebrow?: string;
  heading?: string;
  showLinks?: boolean;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (faqs.length === 0) return null;

  return (
    <section id={id} className="px-6 py-16 sm:py-24">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">{eyebrow}</p>
          <h2 className="mt-3 text-balance font-display text-[clamp(1.6rem,3vw,2.3rem)] font-bold leading-tight tracking-tight text-ink">
            {heading}
          </h2>
          {showLinks ? (
            <>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
                Can&apos;t find what you&apos;re looking for? Our team is happy to help.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  href="/#contact"
                  onClick={(event) => smoothScrollTo(event, "/#contact")}
                  className="inline-flex items-center gap-1.5 rounded-full bg-brand px-5 py-2.5 text-xs font-semibold text-white transition-colors duration-300 hover:bg-brand-dark"
                >
                  Contact us
                </Link>
                <Link
                  href="/services"
                  className="inline-flex items-center gap-1.5 rounded-full border border-line px-5 py-2.5 text-xs font-semibold text-ink transition-colors duration-300 hover:bg-brand/10 hover:text-brand"
                >
                  Services guide
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </>
          ) : null}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className="flex flex-col gap-3"
        >
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            const answerId = `${id}-answer-${i}`;
            const questionId = `${id}-question-${i}`;
            return (
              <div key={i} className="rounded-2xl border border-line bg-cream-soft">
                <h3>
                  <button
                    id={questionId}
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    aria-controls={answerId}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-display text-sm font-bold text-ink sm:px-6"
                  >
                    {faq.question}
                    <Plus
                      className={`h-4 w-4 shrink-0 text-brand transition-transform duration-300 ${
                        isOpen ? "rotate-45" : ""
                      }`}
                    />
                  </button>
                </h3>
                {/* Answers stay in the DOM when collapsed so crawlers see the
                    same text that the FAQPage structured data declares. */}
                <div
                  id={answerId}
                  role="region"
                  aria-labelledby={questionId}
                  className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden" inert={!isOpen}>
                    <p className="px-5 pb-5 text-sm leading-relaxed text-muted sm:px-6">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
