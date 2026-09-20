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
    return <main className="dashboard-page"><p>Loading workspace...</p></main>;
  }

  return (
    <main className="login-page">
      <section className="brand-panel">
        <div>
          <img className="brand-mark" src="/logo.jpeg" alt="WAFA Group logo" />
          <p className="brand-tagline">We Are For All</p>
        </div>
        <div className="brand-copy">
          <p className="eyebrow">WAFA workspace</p>
          <h1>Welcome back.</h1>
          <p className="tagline">One secure workspace for your whole team.</p>
        </div>
      </section>

      <section className="form-panel">
        <div></div>
        <div className="form-wrap">
          <img className="mobile-logo" src="/logo.jpeg" alt="WAFA Group logo" />
          <p className="eyebrow form-eyebrow">Team access</p>
          <h2>Sign in to WAFA</h2>
          <p className="form-intro">Use the user ID and password provided by your administrator.</p>

          <form onSubmit={handleSubmit}>
            <label htmlFor="userId">User ID or email</label>
            <input id="userId" name="userId" type="text" placeholder="Enter your user ID or email" autoComplete="username" value={userId} onChange={(event) => setUserId(event.target.value)} required />

            <div className="password-label-row">
              <label htmlFor="password">Password</label>
              <a href="#help">Need help?</a>
            </div>
            <div className="password-field">
              <input id="password" name="password" type={showPassword ? "text" : "password"} placeholder="Enter your password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
              <button type="button" className="show-password" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"}>
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <label className="remember-me"><input type="checkbox" name="remember" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} /><span>Keep me signed in</span></label>
            {error && <p className="login-error" role="alert">{error}</p>}
            <button type="submit" className="submit-button" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : <>Sign in <span aria-hidden="true">→</span></>}
            </button>
          </form>

          <p className="admin-link">Superadmin? <a href="#admin-sign-in">Use administrator access</a></p>
        </div>
        <p className="legal-copy">© 2026 WAFA · Authorized users only</p>
      </section>
    </main>
  );
}
