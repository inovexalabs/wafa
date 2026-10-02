import type { Metadata } from "next";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { getLandingContent, getLandingItems } from "@/lib/content";

export const metadata: Metadata = {
  title: "Partners",
  description: "Organizations and institutions WAFA Group partners with.",
};

export default async function PartnersPage() {
  const [content, items] = await Promise.all([
    getLandingContent(),
    getLandingItems("partner"),
  ]);

  return (
    <>
      <Navbar />
      <main className="flex-1 px-6 pb-28 pt-40">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">About WAFA</p>
          <h1 className="mt-3 font-display text-[clamp(1.8rem,4vw,2.6rem)] font-bold leading-tight tracking-tight text-ink">
            Partners
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted">
            The organizations and institutions that work alongside WAFA Group.
          </p>

          {items.length === 0 ? (
            <p className="mt-16 text-sm text-muted">Partner information coming soon.</p>
          ) : (
            <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => {
                const card = (
                  <div className="flex h-full flex-col rounded-2xl border border-line bg-cream-soft p-6 transition-colors duration-300 hover:bg-cream-soft/70">
                    <span className="relative block h-14 w-14 overflow-hidden rounded-xl bg-cream ring-1 ring-brand/15">
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
                      <p className="mt-4 font-display text-base font-bold text-ink">
                        {item.title}
                      </p>
                    ) : null}
                    {item.description ? (
                      <p className="mt-2 text-xs leading-relaxed text-muted">
                        {item.description}
                      </p>
                    ) : null}
                    {item.linkUrl ? (
                      <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-brand">
                        Visit website
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </span>
                    ) : null}
                  </div>
                );

                return item.linkUrl ? (
                  <a
                    key={item.id}
                    href={item.linkUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block"
                  >
                    {card}
                  </a>
                ) : (
                  <div key={item.id}>{card}</div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer contact={content.contact} socialLinks={content.socialLinks} />
    </>
  );
}
