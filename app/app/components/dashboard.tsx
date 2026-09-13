"use client";

import { ReactNode, useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { getSessionSnapshot, restoreSession, signOut, subscribeSession, UserRole } from "../lib/auth";

const labels: Record<UserRole, string> = { superadmin: "Superadmin", admin: "Admin", accountant: "Accountant", member: "Member" };

type DashboardProps = { role: UserRole; children?: ReactNode; fullPage?: boolean };

export default function Dashboard({ role, children, fullPage = false }: DashboardProps) {
  const router = useRouter();
  const session = useSyncExternalStore(subscribeSession, getSessionSnapshot, () => undefined);

  useEffect(() => {
    if (session === undefined) void restoreSession();
    else if (!session) router.replace("/");
  }, [router, session]);

  if (session === undefined || session === null) return <main className="dashboard-page"><p>Loading workspace...</p></main>;

  if (session.user.role !== role) return <main className="not-found-page"><p className="eyebrow form-eyebrow">404 error</p><h1>Page not found</h1><p>You do not have access to this dashboard.</p><button className="submit-button not-found-button" onClick={() => router.replace(`/${session.user.role}`)}>Return to your dashboard</button></main>;

  if (fullPage) return <>{children}</>;

  return <main className="dashboard-page"><header className="dashboard-header"><div className="brand-mark dashboard-mark">W</div><div><p className="eyebrow form-eyebrow">{labels[role]} dashboard</p><h1>Welcome to WAFA</h1></div><button className="logout-button" onClick={() => { void signOut(); router.replace("/"); }}>Sign out</button></header><section className="dashboard-content"><p className="eyebrow form-eyebrow">Authorized workspace</p><h2>{labels[role]} overview</h2><p>{children ?? `This space is reserved for ${labels[role].toLowerCase()} users.`}</p></section></main>;
}
