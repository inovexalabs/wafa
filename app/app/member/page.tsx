"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "../../lib/auth";
import Dashboard from "../../components/dashboard";

type Task = { id: number; title: string; project: string; due: string; priority: "High" | "Medium" | "Low"; done: boolean };
const seed: Task[] = [
  { id: 1, title: "Review the Q3 campaign brief", project: "Brand refresh", due: "Today", priority: "High", done: false },
  { id: 2, title: "Share your weekly progress update", project: "Team operations", due: "Tomorrow", priority: "Medium", done: false },
  { id: 3, title: "Update your skills and interests", project: "Your profile", due: "Fri, Sep 18", priority: "Low", done: true },
  { id: 4, title: "Complete security awareness training", project: "People ops", due: "Sep 22", priority: "Medium", done: false },
];

function MemberWorkspace() {
  const router = useRouter();
  const [tasks, setTasks] = useState(seed);
  const [filter, setFilter] = useState<"All" | "Open" | "Done">("All");
  const [checkedIn, setCheckedIn] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaveSent, setLeaveSent] = useState(false);
  const [notice, setNotice] = useState(true);
  const openTasks = tasks.filter((task) => !task.done).length;
  const shown = useMemo(() => tasks.filter((task) => filter === "All" || (filter === "Done" ? task.done : !task.done)), [filter, tasks]);
  const toggle = (id: number) => setTasks((current) => current.map((task) => task.id === id ? { ...task, done: !task.done } : task));

  return <div className="member-shell">
    <aside className="member-sidebar"><div className="sidebar-brand"><img className="sidebar-mark" src="/logo.jpeg" alt="WAFA Group logo" /><span>WAFA</span></div><nav className="member-nav"><Link className="member-nav-item active" href="/member"><span>⌂</span> Overview</Link><Link className="member-nav-item" href="/member/meetings"><span>◷</span> Meetings</Link><Link className="member-nav-item" href="/member/payments"><span>◈</span> Payments</Link><Link className="member-nav-item" href="/member/receipts"><span>▤</span> Receipts</Link><Link className="member-nav-item" href="/member/profile"><span>◎</span> My profile</Link></nav><div className="sidebar-bottom"><a className="member-nav-item" href="#help"><span>?</span> Help center</a><div className="sidebar-user"><span className="avatar">AR</span><span><strong>Alex Rivera</strong><small>Member</small></span><span className="user-dots">•••</span></div></div></aside>
    <section className="member-main"><header className="member-topbar"><div className="mobile-brand"><img className="sidebar-mark" src="/logo.jpeg" alt="WAFA Group logo" /> WAFA</div><div className="topbar-actions"><button className="icon-button" aria-label="Notifications">♢<i /></button><span className="topbar-divider" /><span className="topbar-avatar">AR</span><span className="topbar-name">Alex Rivera</span><span className="chevron">⌄</span><button className="member-signout" onClick={() => { void signOut(); router.replace("/"); }}>Sign out</button></div></header>
      <main className="member-content" id="overview"><div className="member-heading"><div><p className="eyebrow form-eyebrow">Monday, September 14, 2026</p><h1>Good morning, Alex.</h1><p className="member-subtitle">Here&apos;s what&apos;s happening with your workspace today.</p></div><button className="primary-action" onClick={() => setLeaveOpen(true)}>＋ <span>Request time off</span></button></div>
        {notice && <div className="member-notice"><span className="notice-icon">✦</span><div><strong>Welcome to your new workspace</strong><p>Find your tasks, stay up to date with the team, and manage your time in one place.</p></div><button onClick={() => setNotice(false)} aria-label="Dismiss announcement">×</button></div>}
        <div className="member-stats"><article className="member-stat"><span className="stat-icon green">✓</span><div><small>Tasks completed</small><strong>{tasks.filter((task) => task.done).length}<em> / {tasks.length}</em></strong><span className="stat-trend">↑ 12% <i>this week</i></span></div></article><article className="member-stat"><span className="stat-icon blue">◷</span><div><small>Hours this week</small><strong>32<em>h 40m</em></strong><span className="stat-trend neutral">On track <i>for 40h</i></span></div></article><article className="member-stat"><span className="stat-icon orange">◉</span><div><small>Leave balance</small><strong>14<em> days</em></strong><span className="stat-trend neutral">Annual leave <i>remaining</i></span></div></article></div>
        <div className="member-grid"><section className="member-card tasks-card" id="tasks"><div className="card-heading"><div><h2>My tasks</h2><p>Keep your work moving forward.</p></div><a href="#tasks">View all <span>→</span></a></div><div className="task-tabs">{(["All", "Open", "Done"] as const).map((item) => <button key={item} className={filter === item ? "selected" : ""} onClick={() => setFilter(item)}>{item}{item === "Open" && <b>{openTasks}</b>}</button>)}</div><div className="task-list">{shown.map((task) => <div className={"task-row " + (task.done ? "task-done" : "")} key={task.id}><button className="task-check" onClick={() => toggle(task.id)} aria-label={task.done ? "Reopen task" : "Complete task"}>{task.done ? "✓" : ""}</button><div className="task-copy"><strong>{task.title}</strong><span>{task.project}</span></div><span className={"priority " + task.priority.toLowerCase()}>{task.priority}</span><span className="task-due">{task.due}</span><button className="more-button" aria-label="More options">•••</button></div>)}</div></section>
          <div className="member-side-column"><section className="member-card attendance-card" id="attendance"><div className="card-heading"><div><h2>Today&apos;s attendance</h2><p>Monday, September 14</p></div><span className="live-dot">● Live</span></div><div className="attendance-status"><div className="attendance-ring"><span>{checkedIn ? "04:12" : "00:00"}</span><small>{checkedIn ? "hours" : "not started"}</small></div><div><strong>{checkedIn ? "You&apos;re checked in" : "Ready to start?"}</strong><p>{checkedIn ? "Have a productive day, Alex." : "Check in when you begin work."}</p><button className={checkedIn ? "outline-action" : "small-action"} onClick={() => setCheckedIn(!checkedIn)}>{checkedIn ? "Check out" : "Check in"}</button></div></div><div className="attendance-times"><span>Clock in<strong>{checkedIn ? "09:08 AM" : "—"}</strong></span><span>Clock out<strong>—</strong></span></div></section><section className="member-card events-card"><div className="card-heading"><div><h2>Upcoming</h2><p>What&apos;s next on your calendar.</p></div><a href="#calendar">Calendar <span>→</span></a></div><div className="event-row"><span className="event-date"><b>18</b><small>SEP</small></span><div><strong>Design sync</strong><span>10:00 AM · Meeting room 2</span></div><span className="event-dot" /></div><div className="event-row"><span className="event-date"><b>22</b><small>SEP</small></span><div><strong>All-hands meeting</strong><span>2:00 PM · Main conference</span></div><span className="event-dot purple" /></div></section></div></div>
      </main></section>
    {leaveOpen && <div className="modal-backdrop" onClick={() => setLeaveOpen(false)}><div className="leave-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setLeaveOpen(false)} aria-label="Close">×</button>{leaveSent ? <><span className="success-badge">✓</span><h2>Request submitted</h2><p>Your time-off request has been sent to your manager for review.</p><button className="primary-action modal-action" onClick={() => { setLeaveOpen(false); setLeaveSent(false); }}>Done</button></> : <><p className="eyebrow form-eyebrow">New request</p><h2>Request time off</h2><p>Choose the dates you&apos;d like to be away. Your manager will review this request.</p><label>Leave type<select defaultValue="Annual leave"><option>Annual leave</option><option>Sick leave</option><option>Personal day</option></select></label><div className="date-fields"><label>From<input type="date" defaultValue="2026-09-24" /></label><label>To<input type="date" defaultValue="2026-09-25" /></label></div><button className="primary-action modal-action" onClick={() => setLeaveSent(true)}>Send request <span>→</span></button></>}</div></div>}
  </div>;
}

export default function MemberDashboard() { return <Dashboard role="member" fullPage><MemberWorkspace /></Dashboard>; }



