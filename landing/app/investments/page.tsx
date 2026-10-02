import type { Metadata } from "next";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { getLandingContent, getLandingItems } from "@/lib/content";

export const metadata: Metadata = {
  title: "Investments, Projects & Business",
  description: "Investments, projects, and business ventures led by WAFA Group.",
};

export default async function InvestmentsPage() {
  const [content, items] = await Promise.all([
    getLandingContent(),
    getLandingItems("investment"),
  ]);

  return (
    <>
      <Navbar />
      <main className="flex-1 px-6 pb-28 pt-40">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">About WAFA</p>
          <h1 className="mt-3 font-display text-[clamp(1.8rem,4vw,2.6rem)] font-bold leading-tight tracking-tight text-ink">
            Investments, Projects & Business
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted">
            Where member savings go to work — the projects and ventures WAFA Group invests in.
          </p>

          {items.length === 0 ? (
            <p className="mt-16 text-sm text-muted">
              Investment and project details coming soon.
            </p>
          ) : (
            <div className="mt-14 grid grid-cols-1 gap-10 sm:grid-cols-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="overflow-hidden rounded-[1.75rem] border border-line bg-cream-soft"
                >
                  <div className="relative aspect-[16/10] w-full">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.title ?? "Investment"}
                        fill
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="p-7">
                    {item.title ? (
                      <p className="font-display text-lg font-bold text-ink">{item.title}</p>
                    ) : null}
                    {item.description ? (
                      <p className="mt-2 text-sm leading-relaxed text-muted">
                        {item.description}
                      </p>
                    ) : null}
                    {item.linkUrl ? (
                      <a
                        href={item.linkUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-brand"
                      >
                        Learn more
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </a>
                    ) : null}
                  </div>
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
