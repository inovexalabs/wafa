import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import Footer from "@/components/footer";
import { getLandingContent } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

// Only reachable after submitting the contact form, so keep it out of search.
export const metadata: Metadata = {
  ...pageMetadata({
    title: "Message sent",
    description: "Thanks for contacting WAFA Group. We have received your message.",
    path: "/thank-you",
  }),
  robots: { index: false, follow: true },
};

export default async function ThankYouPage() {
  const content = await getLandingContent();

  return (
    <>
      <main className="flex flex-1 flex-col items-center justify-center px-6 pb-28 pt-40 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand/10">
          <CheckCircle2 className="h-8 w-8 text-brand" />
        </span>
        <h1 className="mt-6 text-balance font-display text-[clamp(1.8rem,4vw,2.6rem)] font-bold leading-tight tracking-tight text-ink">
          Thank you, your message is on its way.
        </h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
          Our team will reply to the email address you gave us. If it&apos;s urgent, call us on{" "}
          <span className="font-semibold text-ink">{content.contact.phone}</span>.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-brand px-7 py-3.5 text-sm font-semibold text-white shadow-[0_16px_35px_-14px_rgba(31,103,82,0.75)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
          >
            Back to homepage
          </Link>
          <Link
            href="/#news"
            className="inline-flex items-center gap-2 rounded-full border border-line px-7 py-3.5 text-sm font-semibold text-ink transition-colors duration-300 hover:border-brand hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
          >
            Read news &amp; notices
          </Link>
        </div>
      </main>
      <Footer contact={content.contact} />
    </>
  );
}
