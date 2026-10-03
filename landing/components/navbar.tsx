"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useScroll, useMotionValueEvent } from "motion/react";
import { useState } from "react";
import { Menu, X, ArrowUpRight, ChevronDown } from "lucide-react";
import { APP_URL, NAV_LINKS, smoothScrollTo } from "@/lib/site";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [openMobileGroup, setOpenMobileGroup] = useState<string | null>(null);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 24);
  });

  function closeMobileMenu() {
    setOpen(false);
    setOpenMobileGroup(null);
  }

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4"
    >
      <div
        className={`flex w-full max-w-6xl items-center justify-between rounded-2xl border px-4 py-2.5 transition-all duration-500 sm:px-6 ${
          scrolled
            ? "border-line/80 bg-cream-soft/90 shadow-[0_10px_40px_-18px_rgba(20,32,27,0.25)] backdrop-blur-xl"
            : "border-transparent bg-transparent"
        }`}
      >
        <Link
          href="/#top"
          onClick={(event) => smoothScrollTo(event, "/#top")}
          className="flex items-center gap-3"
        >
          <span className="relative block h-10 w-10 overflow-hidden rounded-xl ring-1 ring-brand/15">
            <Image src="/logo.jpeg" alt="WAFA Group" fill className="object-cover" priority />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-display text-base font-bold tracking-tight text-ink">
              WAFA Group
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand">
              We Are For All
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => {
            if ("children" in link) {
              const isOpen = openDropdown === link.label;
              return (
                <div
                  key={link.label}
                  className="relative"
                  onMouseEnter={() => setOpenDropdown(link.label)}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <button
                    type="button"
                    onFocus={() => setOpenDropdown(link.label)}
                    onClick={() => setOpenDropdown(isOpen ? null : link.label)}
                    aria-expanded={isOpen}
                    className="group flex items-center gap-1 text-xs font-medium text-ink/75 transition-colors hover:text-ink"
                  >
                    {link.label}
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform duration-300 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.98 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute left-1/2 top-full mt-3 w-60 -translate-x-1/2 rounded-2xl border border-line bg-cream-soft p-2 shadow-[0_20px_50px_-20px_rgba(20,32,27,0.3)]"
                      >
                        {link.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={(event) => {
                              smoothScrollTo(event, child.href);
                              setOpenDropdown(null);
                            }}
                            className="block rounded-xl px-3.5 py-2.5 text-xs font-medium text-ink/75 transition-colors hover:bg-brand/10 hover:text-brand"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            }

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={(event) => smoothScrollTo(event, link.href)}
                className="group relative text-xs font-medium text-ink/75 transition-colors hover:text-ink"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 h-px w-0 bg-brand transition-all duration-300 group-hover:w-full" />
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href={APP_URL}
            className="group inline-flex items-center gap-2 rounded-full bg-brand py-1.5 pl-5 pr-1.5 text-sm font-semibold text-white shadow-[0_10px_25px_-10px_rgba(31,103,82,0.65)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-dark hover:shadow-[0_14px_30px_-10px_rgba(31,103,82,0.75)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
          >
            Member Login
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          className="flex h-11 w-11 items-center justify-center rounded-full text-ink md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.98 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="absolute left-4 right-4 top-[74px] max-h-[75vh] overflow-y-auto rounded-2xl border border-line bg-cream-soft p-5 shadow-xl md:hidden"
          >
            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => {
                if ("children" in link) {
                  const isOpen = openMobileGroup === link.label;
                  return (
                    <div key={link.label} className="border-b border-line/70 py-2 last:border-none">
                      <button
                        type="button"
                        onClick={() => setOpenMobileGroup(isOpen ? null : link.label)}
                        aria-expanded={isOpen}
                        className="flex w-full items-center justify-between py-3 text-sm font-medium text-ink/80"
                      >
                        {link.label}
                        <ChevronDown
                          className={`h-4 w-4 transition-transform duration-300 ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                            className="overflow-hidden"
                          >
                            <div className="flex flex-col gap-1 py-1 pl-3">
                              {link.children.map((child) => (
                                <Link
                                  key={child.href}
                                  href={child.href}
                                  onClick={(event) => {
                                    smoothScrollTo(event, child.href);
                                    closeMobileMenu();
                                  }}
                                  className="block py-2.5 text-sm text-ink/70"
                                >
                                  {child.label}
                                </Link>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                }

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={(event) => {
                      smoothScrollTo(event, link.href);
                      closeMobileMenu();
                    }}
                    className="border-b border-line/70 py-3 text-sm font-medium text-ink/80 last:border-none"
                  >
                    {link.label}
                  </Link>
                );
              })}
              <Link
                href={APP_URL}
                onClick={closeMobileMenu}
                className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white"
              >
                Member Login
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
