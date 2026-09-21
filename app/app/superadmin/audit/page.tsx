"use client";

import { useEffect, useState } from "react";
import { ClipboardList, Filter, RotateCcw } from "lucide-react";
import SuperadminLayout from "../../../components/superadmin-layout";
import { AuditLogEntry, listAuditLogs } from "../../../lib/auth";

const actionOptions = [
	{ value: "", label: "All actions" },
	{ value: "auth.login", label: "Login" },
	{ value: "auth.login_failed", label: "Login failed" },
	{ value: "auth.logout", label: "Logout" },
	{ value: "user.created", label: "User created" },
	{ value: "meeting.created", label: "Meeting created" },
	{ value: "meeting.updated", label: "Meeting updated" },
	{ value: "meeting.cancelled", label: "Meeting cancelled" },
	{ value: "meeting.recipients_updated", label: "Meeting recipients changed" },
	{ value: "notification.announced", label: "Announcement sent" },
	{ value: "profile.updated", label: "Profile updated" },
	{ value: "member.profile_updated", label: "Member profile updated" },
	{ value: "receipt.submitted", label: "Receipt submitted" },
];

const actionLabels: Record<string, string> = Object.fromEntries(actionOptions.filter((o) => o.value).map((o) => [o.value, o.label]));

const actionTone: Record<string, string> = {
	"auth.login": "text-[#2f7a5c] bg-[#e4f4ec]",
	"auth.login_failed": "text-[#ae4d44] bg-[#fdf3f2]",
	"auth.logout": "text-[#6b7a72] bg-[#f1f3f1]",
	"user.created": "text-[#6a5fae] bg-[#ede9fb]",
	"meeting.created": "text-[#2f7a5c] bg-[#e4f4ec]",
	"meeting.updated": "text-[#b26a2c] bg-[#fbeddb]",
	"meeting.cancelled": "text-[#ae4d44] bg-[#fdf3f2]",
	"meeting.recipients_updated": "text-[#b26a2c] bg-[#fbeddb]",
	"notification.announced": "text-[#6a5fae] bg-[#ede9fb]",
	"profile.updated": "text-[#b26a2c] bg-[#fbeddb]",
	"member.profile_updated": "text-[#b26a2c] bg-[#fbeddb]",
	"receipt.submitted": "text-[#2f7a5c] bg-[#e4f4ec]",
};

const pageSize = 25;

function formatDateTime(isoString: string) {
	return new Date(isoString).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function actorLabel(entry: AuditLogEntry) {
	if (entry.actor_full_name) return entry.actor_full_name;
	if (entry.actor_email) return entry.actor_email;
	if (entry.actor_user_id) return entry.actor_user_id.slice(0, 8);
	return "System";
}

function describeMetadata(entry: AuditLogEntry) {
	if (!entry.new_data) return null;
	const parts = Object.entries(entry.new_data)
		.filter(([, value]) => value !== null && value !== undefined && value !== "")
		.map(([key, value]) => `${key}: ${typeof value === "object" ? JSON.stringify(value) : String(value)}`);
	return parts.length ? parts.join(" · ") : null;
}

const inputClass = "h-[38px] border border-line rounded-md px-[11px] outline-none text-[#2d4037] bg-white text-xs focus:border-[#2b7358] focus:shadow-[0_0_0_3px_#2b73581a]";

export default function AuditLogPage() {
	const [entries, setEntries] = useState<AuditLogEntry[]>([]);
	const [total, setTotal] = useState(0);
	const [page, setPage] = useState(0);
	const [action, setAction] = useState("");
	const [from, setFrom] = useState("");
	const [to, setTo] = useState("");
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		let cancelled = false;
		listAuditLogs({
			action: action || undefined,
			from: from ? new Date(from).toISOString() : undefined,
			to: to ? new Date(`${to}T23:59:59`).toISOString() : undefined,
			limit: pageSize,
			offset: page * pageSize,
		})
			.then((result) => {
				if (cancelled) return;
				setEntries(result.items);
				setTotal(result.total);
				setError("");
			})
			.catch((loadError) => {
				if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Unable to load audit logs.");
			})
			.finally(() => {
				if (!cancelled) setIsLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [action, from, to, page]);

	function updateFilter(apply: () => void) {
		setIsLoading(true);
		apply();
	}

	function resetFilters() {
		updateFilter(() => {
			setAction("");
			setFrom("");
			setTo("");
			setPage(0);
		});
	}

	const totalPages = Math.max(1, Math.ceil(total / pageSize));

	return (
		<SuperadminLayout active="audit">
			<main className="max-w-[1190px] mx-auto px-6 pt-20 pb-2 max-[650px]:px-4 max-[650px]:pt-[68px] max-[650px]:pb-2 min-h-[calc(100vh-76px)]">
				<div className="mb-6">
					<p className="mb-[13px] text-[11px] font-bold tracking-[.18em] uppercase text-brand">System management</p>
					<h1 className="m-0 font-display font-bold text-[clamp(32px,4vw,46px)] leading-[1.1]">Activity log.</h1>
					<p className="mt-[9px] text-muted text-sm">Who did what, when — logins, meetings, announcements, and profile changes.</p>
				</div>

				<div className="flex items-end gap-4 flex-wrap mb-4 p-4 border border-[#e1e9e4] rounded-[10px] bg-white">
					<div className="flex items-center gap-2 text-[#53665c] text-[11px] font-bold pb-[9px]"><Filter size={13} /> Filters</div>
					<label className="flex flex-col gap-[5px] text-[#53665c] text-[10px] font-bold">
						Action
						<select className={inputClass + " w-[220px] max-[500px]:w-full"} value={action} onChange={(event) => { const value = event.target.value; updateFilter(() => { setAction(value); setPage(0); }); }}>
							{actionOptions.map((option) => (
								<option key={option.value} value={option.value}>{option.label}</option>
							))}
						</select>
					</label>
					<label className="flex flex-col gap-[5px] text-[#53665c] text-[10px] font-bold">
						From
						<input className={inputClass + " w-[150px] max-[500px]:w-full"} type="date" value={from} onChange={(event) => { const value = event.target.value; updateFilter(() => { setFrom(value); setPage(0); }); }} />
					</label>
					<label className="flex flex-col gap-[5px] text-[#53665c] text-[10px] font-bold">
						To
						<input className={inputClass + " w-[150px] max-[500px]:w-full"} type="date" value={to} onChange={(event) => { const value = event.target.value; updateFilter(() => { setTo(value); setPage(0); }); }} />
					</label>
					{(action || from || to) && (
						<button type="button" className="inline-flex items-center gap-1.5 h-[38px] px-3 border-0 rounded-md text-[#286c54] bg-[#f2f7f3] cursor-pointer text-[11px] font-bold" onClick={resetFilters}>
							<RotateCcw size={12} /> Reset
						</button>
					)}
					<span className="ml-auto text-[11px] text-[#9aa8a1] pb-[9px]">{total} {total === 1 ? "entry" : "entries"}</span>
				</div>

				{isLoading ? (
					<div className="space-y-2">
						{[0, 1, 2, 3, 4].map((i) => (
							<div key={i} className="h-[52px] rounded-lg bg-[#edf1ee] animate-pulse" />
						))}
					</div>
				) : error ? (
					<div className="p-5 rounded-2xl border border-[#f3d6d3] bg-[#fdf3f2] text-[#ae4d44] text-sm" role="alert">{error}</div>
				) : entries.length === 0 ? (
					<div className="flex flex-col items-center justify-center gap-3 py-20 px-6 rounded-2xl border border-dashed border-line bg-white text-center">
						<div className="w-14 h-14 rounded-full bg-[#eef1ee] grid place-items-center text-muted"><ClipboardList size={22} /></div>
						<p className="text-sm font-semibold text-ink">No activity recorded</p>
						<p className="text-xs text-muted max-w-[280px]">Try widening your filters, or check back once people start using the system.</p>
					</div>
				) : (
					<div className="rounded-[10px] border border-[#e1e9e4] bg-white overflow-hidden">
						{entries.map((entry) => {
							const details = describeMetadata(entry);
							return (
								<div key={entry.id} className="flex items-start gap-3 px-4 py-3 border-t border-[#edf1ee] first:border-t-0">
									<div className="w-[150px] shrink-0 text-[10px] text-[#8b9992] pt-[3px]">{formatDateTime(entry.created_at)}</div>
									<div className="w-[160px] shrink-0">
										<p className="m-0 text-[11px] font-bold text-[#2d4037]">{actorLabel(entry)}</p>
										{entry.actor_role && <p className="m-0 mt-0.5 text-[9px] uppercase tracking-wide text-[#9aa8a1]">{entry.actor_role}</p>}
									</div>
									<div className="shrink-0">
										<span className={"inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold " + (actionTone[entry.action] ?? "text-[#6b7a72] bg-[#f1f3f1]")}>
											{actionLabels[entry.action] ?? entry.action}
										</span>
									</div>
									<div className="flex-1 min-w-0 text-[11px] text-[#6b7a72]">
										{entry.entity_type && <span className="text-[#9aa8a1]">{entry.entity_type}{entry.entity_id ? ` #${entry.entity_id.slice(0, 8)}` : ""} — </span>}
										{details ?? <span className="text-[#c3cdc7]">No additional details.</span>}
									</div>
									{entry.ip_address && <div className="w-[110px] shrink-0 text-right text-[9px] text-[#c3cdc7]">{entry.ip_address}</div>}
								</div>
							);
						})}
					</div>
				)}

				{!isLoading && !error && entries.length > 0 && totalPages > 1 && (
					<div className="flex items-center justify-between mt-4">
						<button type="button" className="border-0 rounded-md px-3 py-2 text-[#286c54] bg-[#f2f7f3] cursor-pointer text-[11px] font-bold disabled:opacity-40 disabled:cursor-not-allowed" disabled={page === 0} onClick={() => updateFilter(() => setPage((current) => Math.max(0, current - 1)))}>
							← Previous
						</button>
						<span className="text-[11px] text-[#9aa8a1]">Page {page + 1} of {totalPages}</span>
						<button type="button" className="border-0 rounded-md px-3 py-2 text-[#286c54] bg-[#f2f7f3] cursor-pointer text-[11px] font-bold disabled:opacity-40 disabled:cursor-not-allowed" disabled={page + 1 >= totalPages} onClick={() => updateFilter(() => setPage((current) => current + 1))}>
							Next →
						</button>
					</div>
				)}
			</main>
		</SuperadminLayout>
	);
}
