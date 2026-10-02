import type { Metadata } from "next";
import Image from "next/image";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { getLandingContent, getLandingPeople } from "@/lib/content";

export const metadata: Metadata = {
  title: "Board & Direction",
  description: "Meet the board members guiding WAFA Group's direction.",
};

export default async function BoardPage() {
  const [content, people] = await Promise.all([
    getLandingContent(),
    getLandingPeople("board"),
  ]);

  return (
    <>
      <Navbar />
      <main className="flex-1 px-6 pb-28 pt-40">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">Governance</p>
          <h1 className="mt-3 font-display text-[clamp(1.8rem,4vw,2.6rem)] font-bold leading-tight tracking-tight text-ink">
            Board & Direction
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted">
            The board members setting direction and holding WAFA Group accountable to its
            members.
          </p>

          {people.length === 0 ? (
            <p className="mt-16 text-sm text-muted">Board information coming soon.</p>
          ) : (
            <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {people.map((person) => (
                <div
                  key={person.id}
                  className="rounded-2xl border border-line bg-cream-soft p-6 transition-colors duration-300 hover:bg-cream-soft/70"
                >
                  <span className="relative block h-20 w-20 overflow-hidden rounded-2xl bg-cream ring-1 ring-brand/15">
                    {person.photoUrl ? (
                      <Image
                        src={person.photoUrl}
                        alt={person.name}
                        fill
                        className="object-cover"
                      />
                    ) : null}
                  </span>
                  <p className="mt-4 font-display text-base font-bold text-ink">{person.name}</p>
                  {person.title ? (
                    <p className="text-xs font-semibold uppercase tracking-[0.1em] text-brand">
                      {person.title}
                    </p>
                  ) : null}
                  {person.bio ? (
                    <p className="mt-2 text-xs leading-relaxed text-muted">{person.bio}</p>
                  ) : null}
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
