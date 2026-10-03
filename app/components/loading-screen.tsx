import Image from "next/image";

type LoadingScreenProps = { message?: string; detail?: string };

/** Full-screen branded status shown while the session is checked, restored, or signed out. */
export default function LoadingScreen({ message = "Loading your workspace…", detail }: LoadingScreenProps) {
  return (
    <main className="relative grid place-items-center min-h-dvh overflow-hidden px-6 text-[#f6fbf6] bg-gradient-to-br from-brand to-brand-dark" role="status" aria-live="polite">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />
      <div className="relative flex flex-col items-center text-center">
        <Image
          className="block w-28 h-28 object-contain border border-white/50 rounded-[20px] bg-white shadow-[0_22px_44px_-20px_rgba(0,0,0,0.5)] max-[650px]:w-24 max-[650px]:h-24"
          src="/logo.jpeg"
          alt="WAFA Group logo"
          width={112}
          height={112}
          priority
        />
        <p className="mt-4 mb-0 text-[#e2f4e8] text-xs font-bold tracking-[.22em] uppercase">We Are For All</p>
        <p className="mt-10 mb-0 font-display font-bold text-[clamp(28px,4vw,40px)] leading-[1.1] tracking-[-.03em]">{message}</p>
        {detail && <p className="mt-3 mb-0 max-w-[280px] text-[#c5ddd0] text-sm leading-[1.55]">{detail}</p>}
        <div className="relative w-40 h-[3px] mt-7 overflow-hidden rounded-full bg-white/20" aria-hidden="true">
          <span className="absolute inset-y-0 left-0 w-2/5 rounded-full bg-white animate-[loading-bar_1.3s_ease-in-out_infinite] motion-reduce:animate-none" />
        </div>
      </div>
    </main>
  );
}
