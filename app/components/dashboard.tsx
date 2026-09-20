"use client";

import { ReactNode, useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { getSessionSnapshot, restoreSession, signOut, subscribeSession, UserRole } from "../lib/auth";

const labels: Record<UserRole, string> = {
	superadmin: "Superadmin",
	admin: "Admin",
	accountant: "Accountant",
	member: "Member",
};

type DashboardProps = { role: UserRole; children?: ReactNode; fullPage?: boolean };

export default function Dashboard({ role, children, fullPage = false }: DashboardProps) {
	const router = useRouter();
	const session = useSyncExternalStore(subscribeSession, getSessionSnapshot, () => undefined);

	useEffect(() => {
		if (session === undefined) void restoreSession();
		else if (!session) router.replace("/");
	}, [router, session]);

	if (session === undefined || session === null)
		return (
			<main className="min-h-screen px-[clamp(24px,6vw,90px)] py-[42px] bg-cream">
				<p>Loading workspace...</p>
			</main>
		);

	if (session.user.role !== role)
		return (
			<main className="grid place-content-center justify-items-center min-h-screen p-6 text-center bg-cream">
				<p className="mb-[13px] text-[11px] font-bold tracking-[.18em] uppercase text-brand">404 error</p>
				<h1 className="m-0 font-display font-bold text-[clamp(42px,7vw,86px)] leading-none tracking-[-.04em]">Page not found</h1>
				<p className="mt-[18px] mb-7 text-muted">You do not have access to this dashboard.</p>
				<button
					className="flex justify-center items-center gap-[13px] w-auto h-[50px] border-0 rounded-lg px-[22px] text-white bg-brand cursor-pointer font-bold transition-[background-color,transform] duration-200 hover:bg-brand-dark hover:-translate-y-px"
					onClick={() => router.replace(`/${session.user.role}`)}
				>
					Return to your dashboard
				</button>
			</main>
		);

	if (fullPage) return <>{children}</>;

	return (
		<main className="min-h-screen px-[clamp(24px,6vw,90px)] py-[42px] bg-cream">
			<header className="flex items-center gap-4 max-w-[980px] mx-auto">
				<img className="block flex-none w-[42px] h-[42px] object-contain border border-brand rounded-xl bg-white" src="/logo.jpeg" alt="WAFA Group logo" />
				<div>
					<p className="mb-[13px] text-[11px] font-bold tracking-[.18em] uppercase text-brand">{labels[role]} dashboard</p>
					<h1 className="m-0 font-display font-bold text-[clamp(27px,4vw,46px)] leading-[1.1]">Welcome to WAFA</h1>
				</div>
				<button
					className="ml-auto border border-line rounded-lg px-4 py-[11px] text-brand bg-white cursor-pointer text-xs font-bold"
					onClick={() => {
						void signOut();
						router.replace("/");
					}}
				>
					Sign out
				</button>
			</header>
			<section className="max-w-[980px] mx-auto mt-[70px] p-[clamp(24px,5vw,52px)] border border-line rounded-2xl bg-white">
				<p className="mb-[13px] text-[11px] font-bold tracking-[.18em] uppercase text-brand">Authorized workspace</p>
				<h2 className="m-0 mb-3 font-display font-bold text-[clamp(28px,4vw,48px)] leading-[1.1]">{labels[role]} overview</h2>
				<p className="text-muted">{children ?? `This space is reserved for ${labels[role].toLowerCase()} users.`}</p>
			</section>
		</main>
	);
}
