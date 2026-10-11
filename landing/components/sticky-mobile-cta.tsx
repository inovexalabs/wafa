"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { ArrowUpRight, MessageCircle } from "lucide-react";
import { APP_URL } from "@/lib/site";

// Pages where a "Contact us" bar would be redundant.
const HIDDEN_ON = new Set(["/thank-you"]);

// Mobile-only action bar: appears once the hero's own buttons have scrolled
// away, and steps aside while the contact form itself is on screen.
export default function StickyMobileCta() {
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const [pastHero, setPastHero] = useState(false);
  const [contactVisible, setContactVisible] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setPastHero(latest > 480);
  });

  useEffect(() => {
    const contact = document.getElementById("contact");
    if (!contact) return;
    const observer = new IntersectionObserver(
      ([entry]) => setContactVisible(entry.isIntersecting),
      { threshold: 0.15 },
    );
    observer.observe(contact);
    // Reset on navigation so a stale "visible" never hides the bar on other pages.
    return () => {
      observer.disconnect();
      setContactVisible(false);
    };
  }, [pathname]);

  const visible = pastHero && !contactVisible && !HIDDEN_ON.has(pathname);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: "120%" }}
          animate={{ y: 0 }}
          exit={{ y: "120%" }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 lg:hidden"
        >
          <div className="mx-auto flex max-w-md items-center gap-2 rounded-2xl border border-white/70 bg-white/80 p-2 shadow-[0_12px_40px_-12px_rgba(20,32,27,0.35)] backdrop-blur-xl">
            <Link
              href="/#contact"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
            >
              <MessageCircle className="h-4 w-4" />
              Contact us
            </Link>
            <Link
              href={APP_URL}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-line px-4 py-3 text-sm font-semibold text-ink transition-colors hover:border-brand hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
            >
              Member login
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
