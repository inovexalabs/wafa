import type { Metadata } from "next";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { getLandingContent } from "@/lib/content";

export const metadata: Metadata = {
  title: "Terms of Service",
};

export default async function TermsOfServicePage() {
  const content = await getLandingContent();
  const paragraphs = content.legal.termsOfService.split(/\n+/).filter(Boolean);

  return (
    <>
      <Navbar />
      <main className="flex-1 px-6 pb-28 pt-40">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">Legal</p>
          <h1 className="mt-3 font-display text-[clamp(1.8rem,4vw,2.6rem)] font-bold leading-tight tracking-tight text-ink">
            Terms of Service
          </h1>
          <div className="mt-8 flex flex-col gap-5 text-sm leading-relaxed text-muted">
            {paragraphs.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        </div>
      </main>
      <Footer contact={content.contact} />
    </>
  );
}
