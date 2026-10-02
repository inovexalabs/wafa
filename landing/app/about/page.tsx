import type { Metadata } from "next";
import Image from "next/image";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { getLandingContent } from "@/lib/content";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about WAFA Group's vision, mission, values, and a message from our chairman.",
};

export default async function AboutPage() {
  const content = await getLandingContent();
  const { about } = content;

  return (
    <>
      <Navbar />
      <main className="flex-1 px-6 pb-28 pt-40">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">
            {about.eyebrow}
          </p>
          <h1 className="mt-3 max-w-3xl text-balance font-display text-[clamp(1.8rem,4vw,2.6rem)] font-bold leading-tight tracking-tight text-ink">
            {about.heading}
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted">{about.body}</p>

          <div className="mt-16 grid grid-cols-1 gap-10 border-y border-line py-12 sm:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">
                Our Vision
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted">{about.vision}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">
                Our Mission
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted">{about.mission}</p>
            </div>
          </div>

          <div className="mt-16">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">
              Our Values
            </p>
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
              {about.values.map((value) => (
                <div
                  key={value.title}
                  className="rounded-2xl border border-line bg-cream-soft p-6 transition-colors duration-300 hover:bg-cream-soft/70"
                >
                  <p className="font-display text-base font-bold text-ink">{value.title}</p>
                  <p className="mt-2 text-xs leading-relaxed text-muted">{value.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-16 rounded-[2.25rem] bg-cream-soft/60 p-1.5 shadow-[0_30px_80px_-30px_rgba(20,32,27,0.3)] ring-1 ring-line/70">
            <div className="overflow-hidden rounded-[1.9rem] bg-cream-soft p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.7)] sm:p-10">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">
                Chairman&apos;s Message
              </p>
              <div className="mt-6 flex flex-col items-start gap-6 sm:flex-row">
                <span className="relative block h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-cream ring-1 ring-brand/15">
                  {about.chairmanMessage.photoUrl ? (
                    <Image
                      src={about.chairmanMessage.photoUrl}
                      alt={about.chairmanMessage.name}
                      fill
                      className="object-cover"
                    />
                  ) : null}
                </span>
                <div>
                  <p className="font-display text-lg italic leading-relaxed text-ink">
                    &ldquo;{about.chairmanMessage.message}&rdquo;
                  </p>
                  <p className="mt-4 text-sm font-semibold text-ink">
                    {about.chairmanMessage.name}
                  </p>
                  <p className="text-xs text-muted">{about.chairmanMessage.role}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer contact={content.contact} socialLinks={content.socialLinks} />
    </>
  );
}
