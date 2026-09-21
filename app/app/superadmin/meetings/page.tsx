"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpRight, CalendarDays, CalendarX2, CheckCircle2, Clock, MapPin, Plus, Settings, Timer, Video } from "lucide-react";
import { toast } from "sonner";
import SuperadminLayout from "../../../components/superadmin-layout";
import Modal from "../../../components/modal";
import RecipientPicker, { toggleRecipient, toggleRecipientGroup, useMeetingRecipients } from "../../../components/recipient-picker";
import {
	cancelMeeting,
	getMeetingRecipients,
	listMeetings,
	Meeting,
	setMeetingRecipients,
	updateMeeting,
} from "../../../lib/auth";

const typeTone: Record<Meeting["meeting_type"], string> = {
	online: "text-[#2f7a5c] bg-[#e4f4ec]",
	physical: "text-[#b26a2c] bg-[#fbeddb]",
	hybrid: "text-[#6a5fae] bg-[#ede9fb]",
};

const typeLabel: Record<Meeting["meeting_type"], string> = {
	online: "Online",
	physical: "In person",
	hybrid: "Hybrid",
};

const typeIcon: Record<Meeting["meeting_type"], typeof Video> = {
	online: Video,
	physical: MapPin,
	hybrid: MapPin,
};

const saFormInput = "w-full h-[42px] mt-[7px] border border-line rounded-md px-[11px] outline-none text-[#2d4037] bg-white text-xs focus:border-[#2b7358] focus:shadow-[0_0_0_3px_#2b73581a]";

function formatDay(isoString: string) {
	return new Date(isoString).toLocaleDateString(undefined, { day: "2-digit" });
}

function formatMonth(isoString: string) {
	return new Date(isoString).toLocaleDateString(undefined, { month: "short" }).toUpperCase();
}

function formatWeekday(isoString: string) {
	return new Date(isoString).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}

function formatTime(isoString: string) {
	return new Date(isoString).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function hasStarted(meeting: Meeting, now: number) {
	return now >= new Date(meeting.scheduled_at).getTime();
}

function hasEnded(meeting: Meeting, now: number) {
	const durationMs = (meeting.duration_minutes || 60) * 60 * 1000;
	return now > new Date(meeting.scheduled_at).getTime() + durationMs;
}

function formatDate(isoString: string) {
	return new Date(isoString).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function toDateInput(isoString: string) {
	const date = new Date(isoString);
	const offset = date.getTimezoneOffset();
	return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 10);
}

function toTimeInput(isoString: string) {
	const date = new Date(isoString);
	const offset = date.getTimezoneOffset();
	return new Date(date.getTime() - offset * 60000).toISOString().slice(11, 16);
}

function PastMeetingRow({ meeting }: { meeting: Meeting }) {
	return (
		<div className="flex items-center gap-4 py-4 border-t border-line first:border-t-0">
			<div className="flex flex-col items-center justify-center w-11 h-11 rounded-lg bg-[#f1f3f1] text-muted shrink-0">
				<span className="text-sm font-bold leading-none">{formatDay(meeting.scheduled_at)}</span>
				<span className="text-[8px] font-bold tracking-wider mt-0.5">{formatMonth(meeting.scheduled_at)}</span>
			</div>
			<div className="flex-1 min-w-0">
				<h4 className="text-sm font-medium text-ink truncate">{meeting.title}</h4>
				<p className="mt-0.5 text-[11px] text-muted">{formatDate(meeting.scheduled_at)} · {formatTime(meeting.scheduled_at)} · {meeting.duration_minutes} min · {typeLabel[meeting.meeting_type]}</p>
			</div>
			<span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#f1f3f1] text-muted text-[10px] font-bold shrink-0">
				<CheckCircle2 size={12} /> Ended
			</span>
		</div>
	);
}

function MeetingCard({ meeting, now, onManage }: { meeting: Meeting; now: number; onManage: (meetingId: string) => void }) {
	const TypeIcon = typeIcon[meeting.meeting_type];
	const startable = hasStarted(meeting, now);
	return (
		<article className="group flex items-center gap-5 p-5 rounded-2xl border border-line bg-white transition-all hover:border-brand/30 hover:shadow-[0_8px_24px_-12px_rgba(31,103,82,0.25)]">
			<div className={"flex flex-col items-center justify-center w-14 h-14 rounded-xl shrink-0 " + typeTone[meeting.meeting_type]}>
				<span className="text-lg font-bold leading-none">{formatDay(meeting.scheduled_at)}</span>
				<span className="text-[9px] font-bold tracking-wider mt-1">{formatMonth(meeting.scheduled_at)}</span>
			</div>
			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2 flex-wrap mb-1.5">
					<h3 className="font-semibold text-[15px] text-ink truncate">{meeting.title}</h3>
					<span className={"inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold " + typeTone[meeting.meeting_type]}>
						<TypeIcon size={11} /> {typeLabel[meeting.meeting_type]}
					</span>
				</div>
				<div className="flex items-center gap-4 text-xs text-muted">
					<span className="inline-flex items-center gap-1.5"><Clock size={13} /> {formatTime(meeting.scheduled_at)}</span>
					<span className="inline-flex items-center gap-1.5"><Timer size={13} /> {meeting.duration_minutes} min</span>
				</div>
			</div>
			<div className="flex items-center gap-2 shrink-0">
				{!meeting.meeting_url ? (
					<span className="text-[11px] text-muted whitespace-nowrap">No link yet</span>
				) : startable ? (
					<a
						className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 text-brand px-4 py-2.5 text-xs font-bold whitespace-nowrap no-underline transition-colors hover:bg-brand hover:text-white"
						href={meeting.meeting_url}
						target="_blank"
						rel="noreferrer"
					>
						Join <ArrowUpRight size={14} />
					</a>
				) : (
					<span className="inline-flex items-center gap-1.5 rounded-full border border-line text-muted px-4 py-2.5 text-xs font-bold whitespace-nowrap cursor-not-allowed">
						<Clock size={13} /> Opens {formatTime(meeting.scheduled_at)}
					</span>
				)}
				<button
					type="button"
					className="grid place-items-center w-9 h-9 rounded-full border border-line text-muted bg-white cursor-pointer transition-colors hover:border-brand/30 hover:text-brand"
					onClick={() => onManage(meeting.id)}
					aria-label="Manage meeting"
					title="Manage meeting"
				>
					<Settings size={15} />
				</button>
			</div>
		</article>
	);
}

function ManageMeetingModal({ meetingId, onClose, onUpdated, onCancelled }: { meetingId: string; onClose: () => void; onUpdated: (meeting: Meeting) => void; onCancelled: (meetingId: string) => void }) {
	const { recipients, isLoading: isLoadingRecipients, error: recipientsError } = useMeetingRecipients("superadmin");
	const [selection, setSelection] = useState<string[]>([]);
	const [initialSelection, setInitialSelection] = useState<string[]>([]);
	const [form, setForm] = useState({ title: "", date: "", time: "", durationMinutes: "60" });
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [isCancelling, setIsCancelling] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		let cancelled = false;
		async function load() {
			try {
				const [meetings, shares] = await Promise.all([
					listMeetings("superadmin"),
					getMeetingRecipients("superadmin", meetingId),
				]);
				if (cancelled) return;
				setSelection(shares);
				setInitialSelection(shares);

				const meeting = meetings.find((m) => m.id === meetingId);
				if (!meeting) {
					setError("Meeting not found.");
					return;
				}
				setForm({
					title: meeting.title,
					date: toDateInput(meeting.scheduled_at),
					time: toTimeInput(meeting.scheduled_at),
					durationMinutes: String(meeting.duration_minutes ?? 60),
				});
			} catch (loadError) {
				if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Unable to load this meeting.");
			} finally {
				if (!cancelled) setIsLoading(false);
			}
		}
		void load();
		return () => {
			cancelled = true;
		};
	}, [meetingId]);

	function updateField(field: keyof typeof form, value: string) {
		setForm((current) => ({ ...current, [field]: value }));
	}

	async function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError("");
		setIsSaving(true);
		try {
			const scheduledAt = new Date(`${form.date}T${form.time}`).toISOString();
			const updated = await updateMeeting("superadmin", meetingId, {
				title: form.title,
				scheduledAt,
				durationMinutes: Number(form.durationMinutes) || 60,
			});
			const recipientsChanged = selection.length !== initialSelection.length || selection.some((id) => !initialSelection.includes(id));
			if (recipientsChanged) {
				await setMeetingRecipients("superadmin", meetingId, selection);
				setInitialSelection(selection);
			}
			onUpdated(updated);
			toast.success("Meeting updated.");
			onClose();
		} catch (submissionError) {
			const message = submissionError instanceof Error ? submissionError.message : "Unable to update this meeting.";
			setError(message);
			toast.error(message);
		} finally {
			setIsSaving(false);
		}
	}

	async function cancelThisMeeting() {
		if (!window.confirm("Cancel this meeting? This can't be undone.")) return;
		setIsCancelling(true);
		setError("");
		try {
			await cancelMeeting("superadmin", meetingId);
			toast.success("Meeting cancelled.");
			onCancelled(meetingId);
		} catch (cancelError) {
			const message = cancelError instanceof Error ? cancelError.message : "Unable to cancel this meeting.";
			setError(message);
			toast.error(message);
		} finally {
			setIsCancelling(false);
		}
	}

	return (
		<Modal title="Manage meeting" onClose={onClose} wide>
			{isLoading || isLoadingRecipients ? (
				<div className="grid place-items-center py-10 text-[#a0aaa5] text-center"><span className="text-[28px]">◌</span><p className="text-[11px] leading-[1.6]">Loading meeting...</p></div>
			) : (
				<form onSubmit={submit} className="grid gap-[15px]">
					<label className="block text-[#53665c] text-[11px] font-bold">Title<input className={saFormInput} value={form.title} onChange={(event) => updateField("title", event.target.value)} required /></label>
					<div className="grid grid-cols-2 gap-[14px] max-[500px]:grid-cols-1">
						<label className="block text-[#53665c] text-[11px] font-bold">Date<input className={saFormInput} type="date" value={form.date} onChange={(event) => updateField("date", event.target.value)} required /></label>
						<label className="block text-[#53665c] text-[11px] font-bold">Time<input className={saFormInput} type="time" value={form.time} onChange={(event) => updateField("time", event.target.value)} required /></label>
					</div>
					<label className="block text-[#53665c] text-[11px] font-bold">Duration (minutes)<input className={saFormInput} type="number" min={15} step={15} value={form.durationMinutes} onChange={(event) => updateField("durationMinutes", event.target.value)} required /></label>

					<div>
						<div className="flex items-center justify-between mb-1">
							<span className="text-[#53665c] text-[11px] font-bold">Shared with</span>
							<span className="text-[10px] text-[#9aa8a1]">{selection.length ? `${selection.length} selected` : "Everyone"}</span>
						</div>
						<div className="overflow-y-auto" style={{ maxHeight: "260px" }}>
							<RecipientPicker
								recipients={recipients}
								selection={selection}
								onToggle={(id) => setSelection((current) => toggleRecipient(current, id))}
								onToggleGroup={(ids, checked) => setSelection((current) => toggleRecipientGroup(current, ids, checked))}
							/>
						</div>
					</div>

					{recipientsError && <p className="m-0 text-[11px] text-[#ae4d44]" role="alert">{recipientsError}</p>}
					{error && <p className="m-0 text-[11px] text-[#ae4d44]" role="alert">{error}</p>}

					<div className="flex items-center gap-3">
						<button className="flex justify-center gap-3 border-0 rounded-md px-4 py-[10px] text-white bg-brand cursor-pointer text-xs font-bold disabled:opacity-65 disabled:cursor-wait" disabled={isSaving}>{isSaving ? "Saving..." : "Save changes"}</button>
						<button type="button" className="border-0 rounded-md px-4 py-[10px] text-[#ae4d44] bg-[#fdf3f2] cursor-pointer text-xs font-bold disabled:opacity-60 disabled:cursor-wait" disabled={isCancelling} onClick={() => void cancelThisMeeting()}>{isCancelling ? "Cancelling..." : "Cancel meeting"}</button>
					</div>
				</form>
			)}
		</Modal>
	);
}

function SuperadminMeetingsPageContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const manageMeetingId = searchParams.get("meetingId");

	const [meetings, setMeetings] = useState<Meeting[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState("");
	const [now, setNow] = useState(() => Date.now());

	useEffect(() => {
		listMeetings("superadmin")
			.then(setMeetings)
			.catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Unable to load meetings."))
			.finally(() => setIsLoading(false));
	}, []);

	useEffect(() => {
		const id = setInterval(() => setNow(Date.now()), 30000);
		return () => clearInterval(id);
	}, []);

	function openManage(meetingId: string) {
		router.push(`/superadmin/meetings?meetingId=${meetingId}`);
	}

	function closeManage() {
		router.push("/superadmin/meetings");
	}

	function removeMeeting(meetingId: string) {
		setMeetings((current) => current.filter((meeting) => meeting.id !== meetingId));
	}

	const upcoming = meetings.filter((meeting) => !hasEnded(meeting, now));
	const past = meetings.filter((meeting) => hasEnded(meeting, now)).slice().reverse();
	const [next, ...rest] = upcoming;

	return (
		<SuperadminLayout active="meetings">
			<main className="max-w-[1190px] mx-auto px-6 pt-20 max-[650px]:px-4 max-[650px]:pt-[68px] h-dvh flex flex-col overflow-hidden">
				<div className="shrink-0 flex justify-between items-end gap-5 mb-10 max-[780px]:items-start max-[780px]:flex-col">
					<div>
						<p className="mb-[13px] text-[11px] font-bold tracking-[.18em] uppercase text-brand">Team coordination</p>
						<h1 className="m-0 font-display font-bold text-[clamp(32px,4vw,46px)] leading-[1.1]">Meetings</h1>
						<p className="mt-[9px] text-muted text-sm">Stay prepared for what&apos;s coming up.</p>
					</div>
					<div className="flex items-center gap-3">
						{!isLoading && upcoming.length > 0 && (
							<div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-brand/10 text-brand text-xs font-bold">
								<CalendarDays size={15} /> {upcoming.length} upcoming
							</div>
						)}
						<Link
							href="/superadmin/meetings/create"
							className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2.5 text-xs font-bold text-white no-underline transition-transform hover:-translate-y-0.5"
						>
							<Plus size={14} /> New meeting
						</Link>
					</div>
				</div>

				<div className="no-scrollbar flex-1 min-h-0 overflow-y-auto pb-6">
				{isLoading ? (
					<div className="space-y-3">
						{[0, 1, 2].map((i) => (
							<div key={i} className="h-[86px] rounded-2xl bg-[#edf1ee] animate-pulse" />
						))}
					</div>
				) : error ? (
					<div className="p-5 rounded-2xl border border-[#f3d6d3] bg-[#fdf3f2] text-[#ae4d44] text-sm" role="alert">{error}</div>
				) : meetings.length === 0 ? (
					<div className="flex flex-col items-center justify-center gap-3 py-20 px-6 rounded-2xl border border-dashed border-line bg-white text-center">
						<div className="w-14 h-14 rounded-full bg-[#eef1ee] grid place-items-center text-muted"><CalendarX2 size={22} /></div>
						<p className="text-sm font-semibold text-ink">No meetings yet</p>
						<p className="text-xs text-muted max-w-[240px]">Meetings you create will show up here.</p>
					</div>
				) : (
					<div className="space-y-8">
						{!next && (
							<div className="p-5 rounded-2xl border border-dashed border-line bg-white text-center text-sm text-muted">No upcoming meetings right now.</div>
						)}
						{next && (
							<section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand to-brand-dark p-8 text-white shadow-[0_20px_40px_-20px_rgba(22,75,60,0.55)] max-[500px]:p-6">
								<div className="absolute -right-16 -top-24 w-72 h-72 rounded-full bg-white/10 blur-[2px]" aria-hidden="true" />
								<div className="absolute -right-6 -bottom-20 w-40 h-40 rounded-full border border-white/10" aria-hidden="true" />
								<div className="relative">
									<div className="flex items-start justify-between gap-3">
										<p className="mb-2 text-[11px] font-bold tracking-[.18em] uppercase text-white/70">Next up</p>
										<button
											type="button"
											className="grid place-items-center w-9 h-9 rounded-full border border-white/25 text-white bg-white/10 cursor-pointer transition-colors hover:bg-white/20"
											onClick={() => openManage(next.id)}
											aria-label="Manage meeting"
											title="Manage meeting"
										>
											<Settings size={15} />
										</button>
									</div>
									<h2 className="m-0 font-display font-bold text-2xl max-[500px]:text-xl">{next.title}</h2>
									<p className="mt-2 text-sm text-white/85">{formatWeekday(next.scheduled_at)} · {formatTime(next.scheduled_at)} · {next.duration_minutes} min</p>
									<div className="mt-6 flex items-center gap-3 flex-wrap">
										{!next.meeting_url ? (
											<span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-5 py-3 text-sm font-semibold text-white/85">Link not shared yet</span>
										) : hasStarted(next, now) ? (
											<a
												className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-brand-dark no-underline transition-transform hover:-translate-y-0.5"
												href={next.meeting_url}
												target="_blank"
												rel="noreferrer"
											>
												<Video size={16} /> Join meeting
											</a>
										) : (
											<span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-5 py-3 text-sm font-semibold text-white/85 cursor-not-allowed">
												<Clock size={16} /> Opens at {formatTime(next.scheduled_at)}
											</span>
										)}
										<span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-2 text-xs font-bold text-white">
											{typeLabel[next.meeting_type]}
										</span>
									</div>
								</div>
							</section>
						)}

						{rest.length > 0 && (
							<section>
								<h2 className="mb-4 text-xs font-bold uppercase tracking-[.14em] text-muted">Also coming up</h2>
								<div className="space-y-3">
									{rest.map((meeting) => (
										<MeetingCard key={meeting.id} meeting={meeting} now={now} onManage={openManage} />
									))}
								</div>
							</section>
						)}

						{past.length > 0 && (
							<section>
								<h2 className="mb-4 text-xs font-bold uppercase tracking-[.14em] text-muted">Past meetings</h2>
								<div className="rounded-2xl border border-line bg-white px-5">
									{past.map((meeting) => (
										<PastMeetingRow key={meeting.id} meeting={meeting} />
									))}
								</div>
							</section>
						)}
					</div>
				)}
				</div>
			</main>

			{manageMeetingId && (
				<ManageMeetingModal
					meetingId={manageMeetingId}
					onClose={closeManage}
					onUpdated={(updated) => setMeetings((current) => current.map((meeting) => (meeting.id === updated.id ? { ...meeting, ...updated } : meeting)))}
					onCancelled={(meetingId) => {
						removeMeeting(meetingId);
						closeManage();
					}}
				/>
			)}
		</SuperadminLayout>
	);
}

export default function SuperadminMeetingsPage() {
	return (
		<Suspense fallback={<main className="max-w-[1190px] mx-auto px-6 pt-20 pb-2 min-h-[calc(100vh-76px)]"><p>Loading...</p></main>}>
			<SuperadminMeetingsPageContent />
		</Suspense>
	);
}
