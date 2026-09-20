import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid place-content-center justify-items-center min-h-screen p-6 text-center bg-cream">
      <p className="mb-[13px] text-[11px] font-bold tracking-[.18em] uppercase text-brand">404 error</p>
      <h1 className="m-0 font-display font-bold text-[clamp(42px,7vw,86px)] leading-none tracking-[-.04em]">Page not found</h1>
      <p className="mt-[18px] mb-7 text-muted">The page you are looking for does not exist.</p>
      <Link className="text-brand text-[13px] font-bold no-underline" href="/">Return to sign in</Link>
    </main>
  );
}
