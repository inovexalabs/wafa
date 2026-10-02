import type { Metadata } from "next";
import { Globe, Mail, MapPin, Phone } from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import ContactForm from "@/components/contact-form";
import { getLandingContent } from "@/lib/content";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with WAFA Group.",
};

export default async function ContactPage() {
  const content = await getLandingContent();
  const { contact } = content;

  return (
    <>
      <Navbar />
      <main className="flex-1 px-6 pb-28 pt-40">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">Get in touch</p>
          <h1 className="mt-3 font-display text-[clamp(1.8rem,4vw,2.6rem)] font-bold leading-tight tracking-tight text-ink">
            Contact Us
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted">
            Questions about membership, savings, or loans? Reach out — we&apos;re happy to help.
          </p>

          <div className="mt-14 grid grid-cols-1 gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <ul className="flex flex-col gap-5">
              <li className="flex items-start gap-3.5 rounded-2xl border border-line bg-cream-soft p-5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.1em] text-ink">Address</p>
                  <p className="mt-1 text-sm text-muted">{contact.address}</p>
                </div>
              </li>
              <li className="flex items-start gap-3.5 rounded-2xl border border-line bg-cream-soft p-5">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.1em] text-ink">Email</p>
                  <p className="mt-1 text-sm text-muted">{contact.email}</p>
                </div>
              </li>
              <li className="flex items-start gap-3.5 rounded-2xl border border-line bg-cream-soft p-5">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.1em] text-ink">Phone</p>
                  <p className="mt-1 text-sm text-muted">{contact.phone}</p>
                </div>
              </li>
              <li className="flex items-start gap-3.5 rounded-2xl border border-line bg-cream-soft p-5">
                <Globe className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.1em] text-ink">Website</p>
                  <p className="mt-1 text-sm text-muted">{contact.website}</p>
                </div>
              </li>
            </ul>

            <div className="rounded-2xl border border-line bg-cream-soft p-7">
              <p className="font-display text-lg font-bold text-ink">Send us a message</p>
              <p className="mt-1 text-xs text-muted">
                This opens your email app with your message pre-filled to {contact.email}.
              </p>
              <div className="mt-6">
                <ContactForm email={contact.email} />
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer contact={content.contact} socialLinks={content.socialLinks} />
    </>
  );
}
