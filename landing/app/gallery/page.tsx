import type { Metadata } from "next";
import Image from "next/image";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { getLandingContent, getLandingItems } from "@/lib/content";

export const metadata: Metadata = {
  title: "Gallery",
  description: "A look at WAFA Group's cooperative life in pictures.",
};

export default async function GalleryPage() {
  const [content, items] = await Promise.all([
    getLandingContent(),
    getLandingItems("gallery"),
  ]);

  return (
    <>
      <Navbar />
      <main className="flex-1 px-6 pb-28 pt-40">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">About WAFA</p>
          <h1 className="mt-3 font-display text-[clamp(1.8rem,4vw,2.6rem)] font-bold leading-tight tracking-tight text-ink">
            Gallery
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted">
            Moments from meetings, member events, and cooperative milestones.
          </p>

          {items.length === 0 ? (
            <p className="mt-16 text-sm text-muted">Gallery images coming soon.</p>
          ) : (
            <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <figure
                  key={item.id}
                  className="overflow-hidden rounded-2xl border border-line bg-cream-soft"
                >
                  <div className="relative aspect-[4/3] w-full">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.title ?? "Gallery image"}
                        fill
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  {(item.title || item.description) && (
                    <figcaption className="p-4">
                      {item.title ? (
                        <p className="text-sm font-semibold text-ink">{item.title}</p>
                      ) : null}
                      {item.description ? (
                        <p className="mt-1 text-xs leading-relaxed text-muted">
                          {item.description}
                        </p>
                      ) : null}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer contact={content.contact} socialLinks={content.socialLinks} />
    </>
  );
}
