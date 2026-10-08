"use client";

import { motion } from "motion/react";
import { Globe, Mail, MapPin, Phone } from "lucide-react";
import ContactForm from "@/components/contact-form";
import type { LandingContact } from "@/lib/content";

export default function Contact({ contact }: { contact: LandingContact }) {
  return (
    <section id="contact" className="bg-cream-soft px-6 py-16 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">Get in touch</p>
          <h2 className="mt-3 text-balance font-display text-[clamp(1.6rem,3vw,2.3rem)] font-bold leading-tight tracking-tight text-ink">
            Contact Us
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Questions about membership, savings, or loans? Reach out — we&apos;re happy to help.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className="mt-14 grid grid-cols-1 gap-12 lg:grid-cols-[0.8fr_1.2fr]"
        >
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:flex lg:flex-col">
            <li className="flex items-start gap-3.5 rounded-2xl border border-line bg-cream p-5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.1em] text-ink">Address</p>
                <p className="mt-1 text-sm text-muted">{contact.address}</p>
              </div>
            </li>
            <li className="flex items-start gap-3.5 rounded-2xl border border-line bg-cream p-5">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.1em] text-ink">Email</p>
                <p className="mt-1 text-sm text-muted [overflow-wrap:anywhere]">{contact.email}</p>
              </div>
            </li>
            <li className="flex items-start gap-3.5 rounded-2xl border border-line bg-cream p-5">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.1em] text-ink">Phone</p>
                <p className="mt-1 text-sm text-muted">{contact.phone}</p>
              </div>
            </li>
            <li className="flex items-start gap-3.5 rounded-2xl border border-line bg-cream p-5">
              <Globe className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.1em] text-ink">Website</p>
                <p className="mt-1 text-sm text-muted">{contact.website}</p>
              </div>
            </li>
          </ul>

          <div className="rounded-2xl border border-line bg-cream p-7">
            <p className="font-display text-lg font-bold text-ink">Send us a message</p>
            <p className="mt-1 text-xs text-muted">
              This opens your email app with your message pre-filled to {contact.email}.
            </p>
            <div className="mt-6">
              <ContactForm email={contact.email} />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
