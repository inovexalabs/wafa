"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { dashboardFor, restoreSession, saveSession, signIn } from "../lib/auth";

export default function Home() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    let active = true;
    void restoreSession().then((session) => {
      if (!active) return;
      if (session) {
        router.replace(dashboardFor(session.user.role));
      } else {
        setIsCheckingSession(false);
      }
    });
    return () => {
      active = false;
    };
  }, [router]);
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const session = await signIn(userId, password, rememberMe);
      saveSession(session, rememberMe);
      router.replace(dashboardFor(session.user.role));
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to sign in.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isCheckingSession) {
    return (
      <main className="min-h-screen px-[clamp(24px,6vw,90px)] py-[42px] bg-cream">
        <p>Loading workspace...</p>
      </main>
    );
  }

  return (
    <main className="grid min-h-screen grid-cols-[minmax(320px,.88fr)_minmax(480px,1.12fr)] max-[720px]:block">
      <section className="relative flex flex-col justify-between overflow-hidden min-h-[680px] px-[clamp(36px,7vw,104px)] py-12 text-[#f6fbf6] bg-brand max-[720px]:hidden before:absolute before:content-[''] before:border before:border-white/20 before:rounded-full before:w-[600px] before:h-[600px] before:-right-[290px] before:top-[12%] after:absolute after:content-[''] after:border after:border-white/20 after:rounded-full after:w-[390px] after:h-[390px] after:-left-[255px] after:-bottom-20">
        <div>
          <img className="block w-16 h-16 object-contain border border-white/50 rounded-[14px] bg-white" src="/logo.jpeg" alt="WAFA Group logo" />
          <p className="mt-4 text-[#e2f4e8] text-xs font-bold tracking-[.22em] uppercase">We Are For All</p>
        </div>
        <div className="relative z-10 max-w-[410px] my-auto">
          <p className="mb-[13px] text-[11px] font-bold tracking-[.18em] uppercase text-[#b6d3c4]">WAFA workspace</p>
          <h1 className="m-0 font-display font-bold text-[clamp(54px,7vw,88px)] leading-[.98] tracking-[-.05em]">Welcome back.</h1>
          <p className="max-w-[270px] mt-[25px] text-[#c5ddd0] text-lg leading-[1.55]">One secure workspace for your whole team.</p>
        </div>
      </section>

      <section className="flex flex-col justify-center items-center px-[38px] pt-12 pb-7 bg-cream max-[720px]:min-h-screen max-[720px]:px-[25px] max-[720px]:pt-[34px] max-[720px]:pb-6">
        <div></div>
        <div className="w-[min(100%,425px)]">
          <img className="hidden max-[720px]:block max-[720px]:mb-[52px] w-14 h-14 object-contain border border-brand rounded-[14px] bg-white" src="/logo.jpeg" alt="WAFA Group logo" />
          <p className="mb-[13px] text-[11px] font-bold tracking-[.18em] uppercase text-brand">Team access</p>
          <h2 className="m-0 font-display font-bold text-[clamp(30px,3vw,39px)] leading-[1.12] tracking-[-.03em]">Sign in to WAFA</h2>
          <p className="mt-[13px] mb-[33px] text-muted text-sm">Use the user ID and password provided by your administrator.</p>

          <form onSubmit={handleSubmit}>
            <label className="block mb-[9px] text-xs font-bold" htmlFor="userId">User ID or email</label>
            <input
              className="w-full h-[49px] border border-line rounded-lg outline-none px-[14px] text-ink bg-white text-sm transition-[border-color,box-shadow] duration-200 focus:border-brand focus:shadow-[0_0_0_3px_rgba(31,103,82,.1)]"
              id="userId"
              name="userId"
              type="text"
              placeholder="Enter your user ID or email"
              autoComplete="username"
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              required
            />

            <div className="flex justify-between items-baseline mt-[22px]">
              <label className="block mb-[9px] text-xs font-bold" htmlFor="password">Password</label>
              <a className="text-brand font-bold no-underline text-[11px]" href="#help">Need help?</a>
            </div>
            <div className="relative">
              <input
                className="w-full h-[49px] border border-line rounded-lg outline-none px-[14px] pr-[62px] text-ink bg-white text-sm transition-[border-color,box-shadow] duration-200 focus:border-brand focus:shadow-[0_0_0_3px_rgba(31,103,82,.1)]"
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <button
                type="button"
                className="absolute top-1/2 right-[13px] -translate-y-1/2 border-0 p-1 text-brand bg-transparent cursor-pointer text-[11px] font-bold"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <label className="flex items-center gap-[9px] mt-[18px] mb-[25px] text-muted text-xs cursor-pointer">
              <input className="w-[15px] h-[15px] m-0 accent-brand" type="checkbox" name="remember" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} />
              <span>Keep me signed in</span>
            </label>
            {error && <p className="-mt-2 mb-4 text-[#b43b3b] text-xs" role="alert">{error}</p>}
            <button
              type="submit"
              className="flex justify-center items-center gap-[13px] w-full h-[50px] border-0 rounded-lg text-white bg-brand cursor-pointer font-bold transition-[background-color,transform] duration-200 hover:bg-brand-dark hover:-translate-y-px disabled:opacity-65 disabled:cursor-wait disabled:hover:translate-y-0"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing in..." : <>Sign in <span className="text-xl font-normal" aria-hidden="true">→</span></>}
            </button>
          </form>

          <p className="mt-6 text-muted text-center text-xs">Superadmin? <a className="text-brand font-bold no-underline" href="#admin-sign-in">Use administrator access</a></p>
        </div>
        <p className="mt-auto max-[720px]:mt-[70px] text-[#9aa59f] text-[10px]">© 2026 WAFA · Authorized users only</p>
      </section>
    </main>
  );
}
