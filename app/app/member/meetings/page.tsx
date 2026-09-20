"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, CalendarDays, CalendarX2, CheckCircle2, Clock, MapPin, Timer, Video } from "lucide-react";
import MemberLayout from "../../../components/member-layout";
import { listMeetings, Meeting } from "../../../lib/auth";

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

function MeetingCard({ meeting, now }: { meeting: Meeting; now: number }) {
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
			{!meeting.meeting_url ? (
				<span className="text-[11px] text-muted whitespace-nowrap shrink-0">No link yet</span>
			) : startable ? (
				<a
					className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 text-brand px-4 py-2.5 text-xs font-bold whitespace-nowrap no-underline transition-colors hover:bg-brand hover:text-white shrink-0"
					href={meeting.meeting_url}
					target="_blank"
					rel="noreferrer"
				>
					Join <ArrowUpRight size={14} />
				</a>
			) : (
				<span className="inline-flex items-center gap-1.5 rounded-full border border-line text-muted px-4 py-2.5 text-xs font-bold whitespace-nowrap shrink-0 cursor-not-allowed">
					<Clock size={13} /> Opens {formatTime(meeting.scheduled_at)}
				</span>
			)}
		</article>
	);
}

export default function MeetingsPage() {
	const [meetings, setMeetings] = useState<Meeting[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState("");
	const [now, setNow] = useState(() => Date.now());

	useEffect(() => {
		listMeetings("member")
			.then(setMeetings)
			.catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Unable to load meetings."))
			.finally(() => setIsLoading(false));
	}, []);

	useEffect(() => {
		const id = setInterval(() => setNow(Date.now()), 30000);
		return () => clearInterval(id);
	}, []);

	const upcoming = meetings.filter((meeting) => !hasEnded(meeting, now));
	const past = meetings.filter((meeting) => hasEnded(meeting, now)).slice().reverse();
	const [next, ...rest] = upcoming;

	return (
		<MemberLayout active="meetings">
			<main className="max-w-[1190px] mx-auto px-6 pt-20 pb-2 max-[650px]:px-4 max-[650px]:pt-[68px] max-[650px]:pb-2 min-h-[calc(100vh-76px)]">
				<div className="flex justify-between items-end gap-5 mb-10 max-[780px]:items-start max-[780px]:flex-col">
					<div>
						<p className="mb-[13px] text-[11px] font-bold tracking-[.18em] uppercase text-brand">Your calendar</p>
						<h1 className="m-0 font-display font-bold text-[clamp(32px,4vw,46px)] leading-[1.1]">Meetings</h1>
						<p className="mt-[9px] text-muted text-sm">Stay prepared for what&apos;s coming up.</p>
					</div>
					{!isLoading && upcoming.length > 0 && (
						<div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-brand/10 text-brand text-xs font-bold">
							<CalendarDays size={15} /> {upcoming.length} upcoming
						</div>
					)}
				</div>

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
						<p className="text-xs text-muted max-w-[240px]">Meetings your admins share with you will show up here.</p>
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
									<p className="mb-2 text-[11px] font-bold tracking-[.18em] uppercase text-white/70">Next up</p>
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
										<MeetingCard key={meeting.id} meeting={meeting} now={now} />
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
			</main>
		</MemberLayout>
	);
}
