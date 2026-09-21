"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Award, CalendarClock, Clock, Receipt as ReceiptIcon, Video, MapPin } from "lucide-react";
import MemberLayout from "../../components/member-layout";
import {
  Certificate,
  Meeting,
  MemberProfile,
  PaymentsOverview,
  Receipt,
  getMemberProfile,
  getPaymentsOverview,
  listMeetings,
  listMyCertificates,
  listReceipts,
} from "../../lib/auth";

const primaryAction = "border-0 rounded-[7px] px-[17px] py-3 text-white bg-brand cursor-pointer text-xs font-bold no-underline inline-block max-[650px]:w-full max-[650px]:text-center";
const cardHeading = "flex justify-between";

const receiptStatusStyle: Record<Receipt["status"], string> = {
  pending: "text-[#a26e36] bg-[#faecd9]",
  approved: "text-[#3f835b] bg-[#e4f2e6]",
  rejected: "text-[#b0473f] bg-[#fae3e1]",
};

function formatAmount(amount: number) {
  return `Rs. ${amount.toLocaleString()}`;
}

function formatDate(isoString: string) {
  return new Date(isoString).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatTime(isoString: string) {
  return new Date(isoString).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function firstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

function MemberWorkspace() {
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [payments, setPayments] = useState<PaymentsOverview | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [now] = useState(() => Date.now());

  useEffect(() => {
    Promise.all([getMemberProfile(), getPaymentsOverview(), listMeetings("member"), listMyCertificates(), listReceipts()])
      .then(([profileData, paymentsData, meetingsData, certificatesData, receiptsData]) => {
        setProfile(profileData);
        setPayments(paymentsData);
        setMeetings(meetingsData);
        setCertificates(certificatesData);
        setReceipts(receiptsData);
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Unable to load your dashboard."))
      .finally(() => setIsLoading(false));
  }, []);

  const upcomingMeetings = useMemo(
    () =>
      meetings
        .filter((meeting) => now < new Date(meeting.scheduled_at).getTime() + (meeting.duration_minutes || 60) * 60 * 1000)
        .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
        .slice(0, 3),
    [meetings, now]
  );

  const recentReceipts = useMemo(
    () => receipts.slice().sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()).slice(0, 3),
    [receipts]
  );

  const today = useMemo(
    () => new Date().toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
    []
  );

  return (
    <main className="max-w-[1190px] mx-auto px-6 pt-20 max-[650px]:px-4 max-[650px]:pt-[68px] h-dvh flex flex-col overflow-hidden" id="overview">
      <div className="shrink-0 flex justify-between items-end gap-5 max-[650px]:items-start max-[650px]:flex-col">
        <div>
          <p className="mb-[13px] text-[11px] font-bold tracking-[.18em] uppercase text-brand">{today}</p>
          <h1 className="m-0 font-display font-bold text-[clamp(30px,3.4vw,44px)] leading-[1.1] max-[650px]:text-[32px]">
            {greeting()}{profile ? `, ${firstName(profile.fullName)}.` : "."}
          </h1>
          <p className="mt-[10px] text-muted text-sm">Here&apos;s what&apos;s happening with your account today.</p>
        </div>
        <Link className={primaryAction} href="/member/receipts">＋ <span>Submit a receipt</span></Link>
      </div>

      <div className="no-scrollbar flex-1 min-h-0 overflow-y-auto pb-6">
        {error ? (
          <div className="mt-[38px] p-5 rounded-[10px] border border-[#f3d6d3] bg-[#fdf3f2] text-[#ae4d44] text-sm" role="alert">{error}</div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4 mt-[25px] max-[650px]:grid-cols-1">
              <article className="flex gap-[14px] p-5 border border-[#e1e9e4] rounded-[10px] bg-white">
                <span className="grid place-items-center w-[37px] h-[37px] rounded-[9px] text-[#297256] bg-[#e2f3e4]">◈</span>
                <div>
                  <small className="block text-[#7a8982] text-[11px]">Current balance</small>
                  <strong className="block my-[5px] text-[25px]">{isLoading ? "…" : formatAmount(payments?.currentBalance ?? 0)}</strong>
                  <span className="block text-[#9aa8a2] text-[10px]">{isLoading ? "" : (payments?.duePaymentsCount ?? 0) > 0 ? `${payments?.duePaymentsCount} payment${payments?.duePaymentsCount === 1 ? "" : "s"} due` : "Up to date"}</span>
                </div>
              </article>
              <article className="flex gap-[14px] p-5 border border-[#e1e9e4] rounded-[10px] bg-white">
                <span className="grid place-items-center w-[37px] h-[37px] rounded-[9px] text-[#4378a3] bg-[#e6f1f8]"><CalendarClock size={17} /></span>
                <div>
                  <small className="block text-[#7a8982] text-[11px]">Upcoming meetings</small>
                  <strong className="block my-[5px] text-[25px]">{isLoading ? "…" : upcomingMeetings.length}</strong>
                  <span className="block text-[#9aa8a2] text-[10px]">{isLoading ? "" : upcomingMeetings.length > 0 ? `Next: ${formatDate(upcomingMeetings[0].scheduled_at)}` : "None scheduled"}</span>
                </div>
              </article>
              <article className="flex gap-[14px] p-5 border border-[#e1e9e4] rounded-[10px] bg-white">
                <span className="grid place-items-center w-[37px] h-[37px] rounded-[9px] text-[#b56f36] bg-[#f9ebdc]"><Award size={17} /></span>
                <div>
                  <small className="block text-[#7a8982] text-[11px]">Certificates earned</small>
                  <strong className="block my-[5px] text-[25px]">{isLoading ? "…" : certificates.length}</strong>
                  <span className="block text-[#9aa8a2] text-[10px]">Awarded to you</span>
                </div>
              </article>
            </div>

            <div className="grid grid-cols-[1.5fr_1fr] gap-[18px] mt-5 max-[900px]:grid-cols-1">
              <section className="p-6 border border-[#e1e9e4] rounded-[10px] bg-white max-[500px]:px-4 max-[500px]:py-[19px]" id="meetings">
                <div className={cardHeading}>
                  <div>
                    <h2 className="m-0 font-display font-bold text-[23px]">Upcoming meetings</h2>
                    <p className="my-[6px] text-[#8a9892] text-[11px]">Stay prepared for what&apos;s next.</p>
                  </div>
                  <Link className="text-[#286c54] text-[11px] font-bold no-underline" href="/member/meetings">View all <span>→</span></Link>
                </div>
                <div className="grid">
                  {isLoading ? (
                    <div className="space-y-3 mt-4">
                      {[0, 1, 2].map((i) => <div key={i} className="h-[67px] rounded-md bg-[#edf1ee] animate-pulse" />)}
                    </div>
                  ) : upcomingMeetings.length === 0 ? (
                    <p className="mt-4 text-[11px] text-[#9ba7a1]">No upcoming meetings right now.</p>
                  ) : (
                    upcomingMeetings.map((meeting) => (
                      <div className="flex items-center gap-3 min-h-[67px] border-b border-[#edf1ee] last:border-b-0" key={meeting.id}>
                        <span className="grid place-items-center w-[37px] h-[37px] rounded-[9px] text-[#376b57] bg-[#e9f4e8] shrink-0">
                          {meeting.meeting_type === "online" ? <Video size={16} /> : <MapPin size={16} />}
                        </span>
                        <div className="flex-1">
                          <strong className="block text-[#30423a] text-xs">{meeting.title}</strong>
                          <span className="block mt-1 text-[#9ba7a1] text-[10px]">{formatDate(meeting.scheduled_at)} · {formatTime(meeting.scheduled_at)}</span>
                        </div>
                        {meeting.meeting_url ? (
                          <a className="text-[#286c54] text-[10px] font-bold no-underline" href={meeting.meeting_url} target="_blank" rel="noreferrer">Join →</a>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </section>

              <div className="grid gap-[18px] max-[900px]:grid-cols-2 max-[650px]:grid-cols-1">
                <section className="p-6 border border-[#e1e9e4] rounded-[10px] bg-white max-[500px]:px-4 max-[500px]:py-[19px]">
                  <div className={cardHeading}>
                    <div>
                      <h2 className="m-0 font-display font-bold text-[23px]">Recent receipts</h2>
                      <p className="my-[6px] text-[#8a9892] text-[11px]">Your latest submissions.</p>
                    </div>
                    <Link className="text-[#286c54] text-[11px] font-bold no-underline" href="/member/receipts">View all <span>→</span></Link>
                  </div>
                  {isLoading ? (
                    <div className="space-y-3 mt-4">
                      {[0, 1].map((i) => <div key={i} className="h-[52px] rounded-md bg-[#edf1ee] animate-pulse" />)}
                    </div>
                  ) : recentReceipts.length === 0 ? (
                    <p className="mt-4 text-[11px] text-[#9ba7a1]">You haven&apos;t submitted any receipts yet.</p>
                  ) : (
                    recentReceipts.map((receipt) => (
                      <div className="flex items-center gap-3 py-[13px] border-t border-[#edf1ee] first:border-t-0" key={receipt.id}>
                        <span className="grid place-items-center w-[33px] h-[37px] rounded-md text-[#376b57] bg-[#e9f4e8] shrink-0"><ReceiptIcon size={15} /></span>
                        <div className="flex-1">
                          <strong className="block text-[11px]">{formatAmount(receipt.amount)}</strong>
                          <span className="block mt-1 text-[#99a49f] text-[9px]">{formatDate(receipt.submittedAt)}</span>
                        </div>
                        <span className={"px-2 py-1 rounded text-[9px] font-bold " + receiptStatusStyle[receipt.status]}>{receipt.status}</span>
                      </div>
                    ))
                  )}
                </section>
                <section className="p-6 border border-[#e1e9e4] rounded-[10px] bg-white max-[500px]:px-4 max-[500px]:py-[19px]">
                  <div className={cardHeading}>
                    <div>
                      <h2 className="m-0 font-display font-bold text-[23px]">Payment status</h2>
                      <p className="my-[6px] text-[#8a9892] text-[11px]">Your contribution history.</p>
                    </div>
                    <Link className="text-[#286c54] text-[11px] font-bold no-underline" href="/member/payments">Details <span>→</span></Link>
                  </div>
                  <div className="flex items-center gap-[19px] my-[10px]">
                    <div className="flex-1">
                      <span className="block text-[#8c9993] text-[10px]">Total contributions</span>
                      <strong className="block mt-1 text-lg">{isLoading ? "…" : formatAmount(payments?.totalContributions ?? 0)}</strong>
                    </div>
                    <span className={"px-2 py-1 rounded text-[9px] font-bold flex items-center gap-1 " + ((payments?.duePaymentsCount ?? 0) > 0 ? "text-[#a26e36] bg-[#faecd9]" : "text-[#3f835b] bg-[#e4f2e6]")}>
                      <Clock size={11} /> {isLoading ? "" : (payments?.duePaymentsCount ?? 0) > 0 ? "Payment due" : "Up to date"}
                    </span>
                  </div>
                </section>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default function MemberDashboard() {
  return (
    <MemberLayout active="overview">
      <MemberWorkspace />
    </MemberLayout>
  );
}
