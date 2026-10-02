import type { Metadata } from "next";
import { ArrowUpRight, MapPin } from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { getCareerOpenings, getLandingContent } from "@/lib/content";

export const metadata: Metadata = {
  title: "Career",
  description: "Open roles at WAFA Group.",
};

export default async function CareerPage() {
  const [content, openings] = await Promise.all([
    getLandingContent(),
    getCareerOpenings(),
  ]);

  return (
    <>
      <Navbar />
      <main className="flex-1 px-6 pb-28 pt-40">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">About WAFA</p>
          <h1 className="mt-3 font-display text-[clamp(1.8rem,4vw,2.6rem)] font-bold leading-tight tracking-tight text-ink">
            Career
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted">
            Join the team building a transparent, member-owned cooperative.
          </p>

          {openings.length === 0 ? (
            <p className="mt-16 text-sm text-muted">
              No open roles right now — check back soon.
            </p>
          ) : (
            <div className="mt-14 flex flex-col divide-y divide-line border-y border-line">
              {openings.map((opening) => (
                <div key={opening.id} className="flex flex-col gap-4 py-7 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-display text-lg font-bold text-ink">{opening.title}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {opening.location ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-3 py-1 text-[11px] font-semibold text-brand">
                          <MapPin className="h-3 w-3" />
                          {opening.location}
                        </span>
                      ) : null}
                      {opening.employmentType ? (
                        <span className="inline-flex items-center rounded-full bg-gold/15 px-3 py-1 text-[11px] font-semibold text-ink/70">
                          {opening.employmentType}
                        </span>
                      ) : null}
                    </div>
                    {opening.description ? (
                      <p className="mt-3 max-w-xl text-xs leading-relaxed text-muted">
                        {opening.description}
                      </p>
                    ) : null}
                  </div>
                  <a
                    href={opening.applyUrl || (opening.applyEmail ? `mailto:${opening.applyEmail}` : "#")}
                    target={opening.applyUrl ? "_blank" : undefined}
                    rel={opening.applyUrl ? "noreferrer" : undefined}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-brand px-5 py-2.5 text-xs font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5"
                  >
                    Apply
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer contact={content.contact} socialLinks={content.socialLinks} />
    </>
  );
}
