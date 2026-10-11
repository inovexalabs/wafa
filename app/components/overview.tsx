"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronRight, MapPin, Receipt as ReceiptIcon, Video, type LucideIcon } from "lucide-react";
import { prefetchReceiptFile, type Meeting, type QuickLink, type ReceiptReviewerRole, type ReviewReceipt } from "../lib/auth";
import { paymentTypeLabels } from "./receipts-review";

// Shared building blocks for the role overview dashboards, styled to match the member overview.

export const tones = {
  green: "text-[#297256] bg-[#e2f3e4]",
  blue: "text-[#4378a3] bg-[#e6f1f8]",
  amber: "text-[#b56f36] bg-[#f9ebdc]",
  purple: "text-[#6a5fae] bg-[#ede9fb]",
  red: "text-[#ae4d44] bg-[#fae3e1]",
} as const;

export type Loadable<T> = { status: "loading" } | { status: "ready"; data: T } | { status: "error"; message: string };

/**
 * Loads one dashboard data source; each source fails on its own so the rest of the page still renders.
 * Changing `deps` reloads it in place, keeping the current data on screen until the new data arrives.
 */
export function useLoadable<T>(load: () => Promise<T>, deps: unknown[] = []): Loadable<T> {
  const [state, setState] = useState<Loadable<T>>({ status: "loading" });
  useEffect(() => {
    let cancelled = false;
    load()
      .then((data) => { if (!cancelled) setState({ status: "ready", data }); })
      .catch((error) => { if (!cancelled) setState({ status: "error", message: error instanceof Error ? error.message : "Unable to load." }); });
    return () => { cancelled = true; };
    // The loader is re-created every render; `deps` says when it should actually run again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return state;
}

export function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function firstName(fullName: string | null | undefined) {
  return fullName?.trim().split(/\s+/)[0] ?? "";
}

export function todayLabel() {
  return new Date().toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

export function formatAmount(amount: number) {
  return `Rs. ${amount.toLocaleString()}`;
}

const compactAmount = new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 2 });

/** Lakh/crore shorthand for stat cards (Rs. 12.35L); smaller amounts stay in full. */
export function formatAmountShort(amount: number) {
  return Math.abs(amount) >= 100_000 ? `Rs. ${compactAmount.format(amount)}` : formatAmount(amount);
}

export function formatDate(isoString: string) {
  return new Date(isoString).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function formatRelativeTime(isoString: string) {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(isoString).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function formatTime(isoString: string) {
  return new Date(isoString).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

/** Meetings that have not ended yet, soonest first. */
export function upcomingMeetings(meetings: Meeting[], now: number) {
  return meetings
    .filter((meeting) => now < new Date(meeting.scheduled_at).getTime() + (meeting.duration_minutes || 60) * 60 * 1000)
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
}

export function OverviewPage({ eyebrow, title, subtitle, action, children }: { eyebrow: string; title: string; subtitle: string; action?: ReactNode; children: ReactNode }) {
  return (
    <main className="max-w-[1190px] mx-auto px-6 pt-20 max-[650px]:px-4 max-[650px]:pt-[68px] h-app flex flex-col overflow-hidden">
      <div className="shrink-0 flex justify-between items-end gap-5 max-[650px]:items-start max-[650px]:flex-col">
        <div>
          <p className="mb-[13px] text-[11px] font-bold tracking-[.18em] uppercase text-brand">{eyebrow}</p>
          <h1 className="m-0 font-display font-bold text-[clamp(30px,3.4vw,44px)] leading-[1.1] max-[650px]:text-[32px]">{title}</h1>
          <p className="mt-[10px] text-muted text-sm">{subtitle}</p>
        </div>
        {action}
      </div>
      <div className="no-scrollbar flex-1 min-h-0 overflow-y-auto pb-6">{children}</div>
    </main>
  );
}

export function OverviewAction({ href, icon: Icon, children }: { href: string; icon: LucideIcon; children: ReactNode }) {
  return (
    <Link className="inline-flex items-center justify-center gap-2 border-0 rounded-[7px] px-[17px] py-3 text-white bg-brand text-xs font-bold no-underline shrink-0 max-[650px]:w-full" href={href}>
      <Icon size={15} /> {children}
    </Link>
  );
}

/**
 * Open (unboxed) stat row: each stat gets a left rule, and the grid is pulled left under an
 * overflow-hidden wrapper so the first column's rule is clipped whatever the column count.
 */
export function StatGrid({ className = "grid-cols-4 max-[1100px]:grid-cols-2", children }: { className?: string; children: ReactNode }) {
  return (
    <div className="mt-[25px] pb-7 border-b border-line">
      <div className="overflow-hidden">
        <div className={"grid gap-x-6 gap-y-6 -ml-[25px] " + className}>{children}</div>
      </div>
    </div>
  );
}

export function StatCard({ icon: Icon, tone, label, value, hint, href, title }: { icon: LucideIcon; tone: keyof typeof tones; label: string; value: ReactNode; hint?: ReactNode; href?: string; title?: string }) {
  const body = (
    <>
      <span className={"grid place-items-center shrink-0 w-[37px] h-[37px] rounded-[9px] " + tones[tone]}><Icon size={17} /></span>
      <div className="min-w-0">
        <small className="block text-[#7a8982] text-[11px]">{label}</small>
        <strong className="block my-[5px] text-[25px] leading-tight truncate transition-colors group-hover:text-brand max-[480px]:text-[22px]" title={title}>{value}</strong>
        {hint && <span className="block text-[#9aa8a2] text-[10px]">{hint}</span>}
      </div>
    </>
  );
  const className = "flex gap-[14px] min-w-0 pl-6 border-l border-line max-[480px]:flex-col max-[480px]:gap-3";
  return href ? (
    <Link href={href} className={className + " group no-underline text-inherit"}>{body}</Link>
  ) : (
    <article className={className}>{body}</article>
  );
}

export function Panel({ title, subtitle, href, linkLabel = "View all", children }: { title: string; subtitle: string; href?: string; linkLabel?: string; children: ReactNode }) {
  return (
    <section className="min-w-0">
      <div className="flex justify-between gap-3">
        <div>
          <h2 className="m-0 font-display font-bold text-[23px]">{title}</h2>
          <p className="my-[6px] text-[#8a9892] text-[11px]">{subtitle}</p>
        </div>
        {href && <Link className="shrink-0 text-[#286c54] text-[11px] font-bold no-underline" href={href}>{linkLabel} <span>→</span></Link>}
      </div>
      {children}
    </section>
  );
}

/** Renders a panel body for one data source: skeleton rows, an error line, an empty line, or the content. */
export function PanelBody<T>({ state, rows = 3, isEmpty, empty, children }: { state: Loadable<T>; rows?: number; isEmpty: (data: T) => boolean; empty: string; children: (data: T) => ReactNode }) {
  if (state.status === "loading")
    return (
      <div className="space-y-3 mt-4">
        {Array.from({ length: rows }, (_, i) => <div key={i} className="h-[52px] rounded-md bg-[#edf1ee] animate-pulse" />)}
      </div>
    );
  if (state.status === "error") return <p className="mt-4 mb-0 text-[11px] text-[#ae4d44]" role="alert">{state.message}</p>;
  if (isEmpty(state.data)) return <p className="mt-4 mb-0 text-[11px] text-[#9ba7a1]">{empty}</p>;
  return <>{children(state.data)}</>;
}

/** Stat value for a data source: "…" while loading, "—" if it failed. */
export function statValue<T>(state: Loadable<T>, render: (data: T) => ReactNode) {
  if (state.status === "loading") return "…";
  if (state.status === "error") return "—";
  return render(state.data);
}

/** Stat hint for a data source: blank until it has loaded. */
export function statHint<T>(state: Loadable<T>, render: (data: T) => ReactNode) {
  return state.status === "ready" ? render(state.data) : undefined;
}

/**
 * Meeting row; with `href` the row opens that meeting's record, while "Join" stays its own link.
 * `onPrefetch` runs on hover/focus to warm whatever the record page needs.
 */
export function MeetingRow({ meeting, href, onPrefetch }: { meeting: Meeting; href?: string; onPrefetch?: () => void }) {
  const summary = (
    <>
      <span className="grid place-items-center w-[37px] h-[37px] rounded-[9px] text-[#376b57] bg-[#e9f4e8] shrink-0">
        {meeting.meeting_type === "online" ? <Video size={16} /> : <MapPin size={16} />}
      </span>
      <div className="flex-1 min-w-0">
        <strong className="block text-[#30423a] text-xs truncate group-hover:text-brand">{meeting.title}</strong>
        <span className="block mt-1 text-[#9ba7a1] text-[10px]">{formatDate(meeting.scheduled_at)} · {formatTime(meeting.scheduled_at)} · {meeting.duration_minutes} min</span>
      </div>
    </>
  );
  const summaryClass = "flex flex-1 items-center gap-3 min-w-0 self-stretch";
  return (
    <div className="flex items-center gap-3 min-h-[67px] border-b border-[#edf1ee] last:border-b-0">
      {href ? (
        <Link className={summaryClass + " group no-underline text-inherit"} href={href} onPointerEnter={onPrefetch} onFocus={onPrefetch}>
          {summary}
          <ChevronRight size={14} className="shrink-0 text-[#9aa8a1] group-hover:text-brand" />
        </Link>
      ) : (
        <div className={summaryClass}>{summary}</div>
      )}
      {meeting.meeting_url && (
        <a className="shrink-0 text-[#286c54] text-[10px] font-bold no-underline" href={meeting.meeting_url} target="_blank" rel="noreferrer">Join →</a>
      )}
    </div>
  );
}

export function QuickLinkRow({ link }: { link: QuickLink }) {
  let host = link.url;
  try {
    host = new URL(link.url).hostname.replace(/^www\./, "");
  } catch {
    // Keep the raw URL.
  }
  return (
    <a className="flex items-center gap-3 py-[13px] border-t border-[#edf1ee] first:border-t-0 no-underline text-inherit group" href={link.url} target="_blank" rel="noopener noreferrer">
      <span className="grid place-items-center w-[33px] h-[33px] rounded-lg shrink-0 text-[#2f7a5c] bg-[#e4f4ec] text-xs font-bold uppercase">{host[0] ?? "↗"}</span>
      <div className="flex-1 min-w-0">
        <strong className="block text-[11px] truncate group-hover:text-brand">{link.title}</strong>
        <span className="block mt-1 text-[#99a49f] text-[9px] truncate">{host}</span>
      </div>
      <ArrowUpRight size={14} className="shrink-0 text-[#9aa8a1] group-hover:text-brand" />
    </a>
  );
}

/** Receipt row that opens the receipt on the review page; hovering it warms the receipt file. */
export function ReceiptRow({ receipt, role }: { receipt: ReviewReceipt; role: ReceiptReviewerRole }) {
  const prefetch = () => prefetchReceiptFile(role, receipt.id);
  return (
    <Link
      className="flex items-center gap-3 py-[13px] border-t border-[#edf1ee] first:border-t-0 no-underline text-inherit group"
      href={`/${role}/receipts?receiptId=${receipt.id}`}
      onPointerEnter={prefetch}
      onFocus={prefetch}
    >
      <span className="grid place-items-center w-[33px] h-[33px] rounded-lg shrink-0 text-[#a26e36] bg-[#faecd9]"><ReceiptIcon size={15} /></span>
      <div className="flex-1 min-w-0">
        <strong className="block text-[11px] truncate group-hover:text-brand">{receipt.memberName}</strong>
        <span className="block mt-1 text-[#99a49f] text-[9px] truncate">{paymentTypeLabels[receipt.paymentType]} · submitted {formatDate(receipt.submittedAt)}</span>
      </div>
      <b className="shrink-0 text-xs">{formatAmount(receipt.amount)}</b>
      <ChevronRight size={14} className="shrink-0 text-[#9aa8a1] group-hover:text-brand" />
    </Link>
  );
}

/** Label/amount rows for an organization savings breakdown. */
export function AmountList({ rows, total }: { rows: [string, number][]; total?: [string, number] }) {
  return (
    <dl className="m-0 mt-3">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-center justify-between gap-3 py-[9px] border-t border-[#edf1ee] first:border-t-0">
          <dt className="text-[11px] text-[#65756e]">{label}</dt>
          <dd className="m-0 text-xs font-bold text-ink">{formatAmount(value)}</dd>
        </div>
      ))}
      {total && (
        <div className="flex items-center justify-between gap-3 mt-2 px-3 py-[11px] rounded-lg bg-[#e4f2e6]">
          <dt className="text-[11px] font-bold text-[#164b3c]">{total[0]}</dt>
          <dd className="m-0 text-sm font-bold text-[#164b3c]">{formatAmount(total[1])}</dd>
        </div>
      )}
    </dl>
  );
}

/**
 * Open (unboxed) section row: panels are split by a vertical rule side by side and a horizontal
 * rule when stacked. Every child carries both rules; the pulled-in grid clips the outer ones.
 */
export function PanelGrid({ className = "grid-cols-[1.5fr_1fr]", children }: { className?: string; children: ReactNode }) {
  return (
    <div className="py-8 border-b border-line last:border-b-0">
      <div className="overflow-hidden">
        <div className={"grid gap-8 -ml-[33px] -mt-[33px] *:min-w-0 *:pl-8 *:pt-8 *:border-l *:border-t *:border-line max-[900px]:grid-cols-1 " + className}>{children}</div>
      </div>
    </div>
  );
}
