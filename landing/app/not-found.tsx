import Link from "next/link";
import { APP_URL } from "@/lib/site";

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-24 text-center">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -right-24 h-[420px] w-[420px] animate-drift rounded-full bg-brand/15 blur-3xl" />
        <div
          className="absolute bottom-0 -left-24 h-[360px] w-[360px] animate-drift rounded-full bg-gold/15 blur-3xl"
          style={{ animationDelay: "-4s" }}
        />
      </div>

      <p className="font-display text-[clamp(4rem,12vw,7rem)] font-bold leading-none tracking-tight text-brand/20">
        404
      </p>
      <h1 className="mt-2 text-balance font-display text-[clamp(1.6rem,3vw,2.3rem)] font-bold leading-tight tracking-tight text-ink">
        This page moved or never existed.
      </h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
        The link you followed may be out of date. Head back to the homepage,
        or sign in to your WAFA workspace.
      </p>

      <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full bg-brand px-7 py-3.5 text-sm font-semibold text-white shadow-[0_16px_35px_-14px_rgba(31,103,82,0.75)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
        >
          Back to homepage
        </Link>
        <Link
          href={APP_URL}
          className="inline-flex items-center gap-2 rounded-full border border-line px-7 py-3.5 text-sm font-semibold text-ink transition-colors duration-300 hover:border-brand hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
        >
          Member login
        </Link>
      </div>
    </main>
  );
}
