"use client";

import { useMemo, useState } from "react";
import MemberLayout from "../../components/member-layout";

type Task = { id: number; title: string; project: string; due: string; priority: "High" | "Medium" | "Low"; done: boolean };
const seed: Task[] = [
  { id: 1, title: "Review the Q3 campaign brief", project: "Brand refresh", due: "Today", priority: "High", done: false },
  { id: 2, title: "Share your weekly progress update", project: "Team operations", due: "Tomorrow", priority: "Medium", done: false },
  { id: 3, title: "Update your skills and interests", project: "Your profile", due: "Fri, Sep 18", priority: "Low", done: true },
  { id: 4, title: "Complete security awareness training", project: "People ops", due: "Sep 22", priority: "Medium", done: false },
];

const outlineAction = "border border-[#c8dad0] rounded-[5px] px-[13px] py-2 text-[#2b6b54] bg-white text-[10px]";
const smallAction = "border-0 rounded-[5px] px-[13px] py-2 text-white bg-brand text-[10px]";
const primaryAction = "border-0 rounded-[7px] px-[17px] py-3 text-white bg-brand cursor-pointer text-xs font-bold max-[650px]:w-full";
const cardHeading = "flex justify-between";

function MemberWorkspace() {
  const [tasks, setTasks] = useState(seed);
  const [filter, setFilter] = useState<"All" | "Open" | "Done">("All");
  const [checkedIn, setCheckedIn] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaveSent, setLeaveSent] = useState(false);
  const [notice, setNotice] = useState(true);
  const openTasks = tasks.filter((task) => !task.done).length;
  const shown = useMemo(() => tasks.filter((task) => filter === "All" || (filter === "Done" ? task.done : !task.done)), [filter, tasks]);
  const toggle = (id: number) => setTasks((current) => current.map((task) => task.id === id ? { ...task, done: !task.done } : task));

  return (
    <>
        <main className="max-w-[1190px] mx-auto px-6 pt-20 pb-2 max-[650px]:px-4 max-[650px]:pt-[68px] max-[650px]:pb-2" id="overview">
          <div className="flex justify-between items-end gap-5 max-[650px]:items-start max-[650px]:flex-col">
            <div>
              <p className="mb-[13px] text-[11px] font-bold tracking-[.18em] uppercase text-brand">Monday, September 14, 2026</p>
              <h1 className="m-0 font-display font-bold text-[clamp(30px,3.4vw,44px)] leading-[1.1] max-[650px]:text-[32px]">Good morning, Alex.</h1>
              <p className="mt-[10px] text-muted text-sm">Here&apos;s what&apos;s happening with your workspace today.</p>
            </div>
            <button className={primaryAction} onClick={() => setLeaveOpen(true)}>＋ <span>Request time off</span></button>
          </div>

          {notice && (
            <div className="flex items-center gap-[14px] mt-[38px] px-5 py-[17px] border border-[#d9e8dc] rounded-[10px] bg-[#eef7ed]">
              <span className="p-2 rounded-full text-white bg-[#74a879]">✦</span>
              <div>
                <strong className="text-[13px]">Welcome to your new workspace</strong>
                <p className="mt-1 text-[#6e8077] text-xs">Find your tasks, stay up to date with the team, and manage your time in one place.</p>
              </div>
              <button className="ml-auto border-0 bg-transparent text-xl" onClick={() => setNotice(false)} aria-label="Dismiss announcement">×</button>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 mt-[25px] max-[650px]:grid-cols-1">
            <article className="flex gap-[14px] p-5 border border-[#e1e9e4] rounded-[10px] bg-white">
              <span className="grid place-items-center w-[37px] h-[37px] rounded-[9px] text-[#297256] bg-[#e2f3e4]">✓</span>
              <div>
                <small className="block text-[#7a8982] text-[11px]">Tasks completed</small>
                <strong className="block my-[5px] text-[25px]">{tasks.filter((task) => task.done).length}<em className="text-[#a2ada7] text-[13px] not-italic"> / {tasks.length}</em></strong>
                <span className="block text-[#3b9167] text-[10px]">↑ 12% <i className="text-[#9aa8a2] not-italic">this week</i></span>
              </div>
            </article>
            <article className="flex gap-[14px] p-5 border border-[#e1e9e4] rounded-[10px] bg-white">
              <span className="grid place-items-center w-[37px] h-[37px] rounded-[9px] text-[#4378a3] bg-[#e6f1f8]">◷</span>
              <div>
                <small className="block text-[#7a8982] text-[11px]">Hours this week</small>
                <strong className="block my-[5px] text-[25px]">32<em className="text-[#a2ada7] text-[13px] not-italic">h 40m</em></strong>
                <span className="block text-[#9aa8a2] text-[10px]">On track <i className="text-[#9aa8a2] not-italic">for 40h</i></span>
              </div>
            </article>
            <article className="flex gap-[14px] p-5 border border-[#e1e9e4] rounded-[10px] bg-white">
              <span className="grid place-items-center w-[37px] h-[37px] rounded-[9px] text-[#b56f36] bg-[#f9ebdc]">◉</span>
              <div>
                <small className="block text-[#7a8982] text-[11px]">Leave balance</small>
                <strong className="block my-[5px] text-[25px]">14<em className="text-[#a2ada7] text-[13px] not-italic"> days</em></strong>
                <span className="block text-[#9aa8a2] text-[10px]">Annual leave <i className="text-[#9aa8a2] not-italic">remaining</i></span>
              </div>
            </article>
          </div>

          <div className="grid grid-cols-[1.5fr_1fr] gap-[18px] mt-5 max-[900px]:grid-cols-1">
            <section className="p-6 border border-[#e1e9e4] rounded-[10px] bg-white max-[500px]:px-4 max-[500px]:py-[19px]" id="tasks">
              <div className={cardHeading}>
                <div>
                  <h2 className="m-0 font-display font-bold text-[23px]">My tasks</h2>
                  <p className="my-[6px] text-[#8a9892] text-[11px]">Keep your work moving forward.</p>
                </div>
                <a className="text-[#286c54] text-[11px] font-bold no-underline" href="#tasks">View all <span>→</span></a>
              </div>
              <div className="flex gap-[21px] mt-5 border-b border-[#edf1ee]">
                {(["All", "Open", "Done"] as const).map((item) => (
                  <button
                    key={item}
                    className={
                      "border-0 border-b-2 pb-[11px] bg-transparent text-[11px] " +
                      (filter === item ? "border-[#2c765c] text-[#245f4b]" : "border-transparent text-[#9aa69f]")
                    }
                    onClick={() => setFilter(item)}
                  >
                    {item}{item === "Open" && <b>{openTasks}</b>}
                  </button>
                ))}
              </div>
              <div className="grid">
                {shown.map((task) => (
                  <div className="flex items-center gap-3 min-h-[67px] border-b border-[#edf1ee]" key={task.id}>
                    <button
                      className={"w-[18px] h-[18px] border border-[#c9d8d0] rounded-[5px] text-white " + (task.done ? "bg-[#3a8b6a]" : "bg-white")}
                      onClick={() => toggle(task.id)}
                      aria-label={task.done ? "Reopen task" : "Complete task"}
                    >
                      {task.done ? "✓" : ""}
                    </button>
                    <div className="flex-1">
                      <strong className="block text-[#30423a] text-xs">{task.title}</strong>
                      <span className="block mt-1 text-[#9ba7a1] text-[10px]">{task.project}</span>
                    </div>
                    <span
                      className={
                        "px-[7px] py-1 rounded text-[9px] max-[500px]:hidden " +
                        (task.priority === "High" ? "text-[#ad5b4e] bg-[#fbe8e3]" : task.priority === "Medium" ? "text-[#967138] bg-[#f9f0d9]" : "text-[#5b7f70] bg-[#e5f1e9]")
                      }
                    >
                      {task.priority}
                    </span>
                    <span className="w-[67px] text-[#82918a] text-[10px] max-[500px]:hidden">{task.due}</span>
                    <button className="border-0 text-[#a2b0a8] bg-transparent" aria-label="More options">•••</button>
                  </div>
                ))}
              </div>
            </section>

            <div className="grid gap-[18px] max-[900px]:grid-cols-2 max-[650px]:grid-cols-1">
              <section className="p-6 border border-[#e1e9e4] rounded-[10px] bg-white max-[500px]:px-4 max-[500px]:py-[19px]" id="attendance">
                <div className={cardHeading}>
                  <div>
                    <h2 className="m-0 font-display font-bold text-[23px]">Today&apos;s attendance</h2>
                    <p className="my-[6px] text-[#8a9892] text-[11px]">Monday, September 14</p>
                  </div>
                  <span className="text-[10px] font-bold text-[#3b9167]">● Live</span>
                </div>
                <div className="flex items-center gap-[19px] my-[26px]">
                  <div className="grid place-content-center w-[91px] h-[91px] border-[7px] border-[#dcefe0] border-r-[#4f986e] rounded-full text-center">
                    <span className="block text-base font-bold">{checkedIn ? "04:12" : "00:00"}</span>
                    <small className="block text-[#9aa8a1] text-[9px]">{checkedIn ? "hours" : "not started"}</small>
                  </div>
                  <div>
                    <strong className="text-[13px]">{checkedIn ? "You're checked in" : "Ready to start?"}</strong>
                    <p className="my-[6px] mb-3 text-[#8c9993] text-[10px]">{checkedIn ? "Have a productive day, Alex." : "Check in when you begin work."}</p>
                    <button className={checkedIn ? outlineAction : smallAction} onClick={() => setCheckedIn(!checkedIn)}>{checkedIn ? "Check out" : "Check in"}</button>
                  </div>
                </div>
                <div className="flex gap-10 pt-[17px] border-t border-[#edf1ee] text-[#93a099] text-[10px]">
                  <span>Clock in<strong className="block mt-[5px] text-[#3a5147]">{checkedIn ? "09:08 AM" : "—"}</strong></span>
                  <span>Clock out<strong className="block mt-[5px] text-[#3a5147]">—</strong></span>
                </div>
              </section>
              <section className="p-6 border border-[#e1e9e4] rounded-[10px] bg-white max-[500px]:px-4 max-[500px]:py-[19px]">
                <div className={cardHeading}>
                  <div>
                    <h2 className="m-0 font-display font-bold text-[23px]">Upcoming</h2>
                    <p className="my-[6px] text-[#8a9892] text-[11px]">What&apos;s next on your calendar.</p>
                  </div>
                  <a className="text-[#286c54] text-[11px] font-bold no-underline" href="#calendar">Calendar <span>→</span></a>
                </div>
                <div className="flex items-center gap-3 py-[13px] border-t border-[#edf1ee]">
                  <span className="grid place-items-center w-[33px] h-[37px] rounded-md text-[#376b57] bg-[#e9f4e8]"><b className="block">18</b><small className="block text-[8px]">SEP</small></span>
                  <div className="flex-1">
                    <strong className="block text-[11px]">Design sync</strong>
                    <span className="block mt-1 text-[#99a49f] text-[9px]">10:00 AM · Meeting room 2</span>
                  </div>
                  <span className="w-[7px] h-[7px] rounded-full bg-[#dd9369]" />
                </div>
                <div className="flex items-center gap-3 py-[13px] border-t border-[#edf1ee]">
                  <span className="grid place-items-center w-[33px] h-[37px] rounded-md text-[#376b57] bg-[#e9f4e8]"><b className="block">22</b><small className="block text-[8px]">SEP</small></span>
                  <div className="flex-1">
                    <strong className="block text-[11px]">All-hands meeting</strong>
                    <span className="block mt-1 text-[#99a49f] text-[9px]">2:00 PM · Main conference</span>
                  </div>
                  <span className="w-[7px] h-[7px] rounded-full bg-[#8c82bf]" />
                </div>
              </section>
            </div>
          </div>
        </main>

      {leaveOpen && (
        <div className="fixed inset-0 z-[5] grid place-items-center bg-[#16372b59]" onClick={() => setLeaveOpen(false)}>
          <div className="relative w-[min(100%-40px,430px)] p-[34px] rounded-xl bg-white" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <button className="absolute top-[15px] right-[17px] border-0 bg-transparent text-[22px]" onClick={() => setLeaveOpen(false)} aria-label="Close">×</button>
            {leaveSent ? (
              <>
                <span className="grid place-items-center w-[42px] h-[42px] rounded-full text-white bg-[#4d956c]">✓</span>
                <h2 className="font-display font-bold text-[29px]">Request submitted</h2>
                <p>Your time-off request has been sent to your manager for review.</p>
                <button className={primaryAction + " w-full mt-6"} onClick={() => { setLeaveOpen(false); setLeaveSent(false); }}>Done</button>
              </>
            ) : (
              <>
                <p className="mb-[13px] text-[11px] font-bold tracking-[.18em] uppercase text-brand">New request</p>
                <h2 className="font-display font-bold text-[29px]">Request time off</h2>
                <p>Choose the dates you&apos;d like to be away. Your manager will review this request.</p>
                <label className="block mt-[18px] text-[11px] font-bold">
                  Leave type
                  <select className="w-full h-10 mt-[7px] border border-line rounded-md px-[10px]" defaultValue="Annual leave">
                    <option>Annual leave</option>
                    <option>Sick leave</option>
                    <option>Personal day</option>
                  </select>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block mt-[18px] text-[11px] font-bold">From<input className="w-full h-10 mt-[7px] border border-line rounded-md px-[10px]" type="date" defaultValue="2026-09-24" /></label>
                  <label className="block mt-[18px] text-[11px] font-bold">To<input className="w-full h-10 mt-[7px] border border-line rounded-md px-[10px]" type="date" defaultValue="2026-09-25" /></label>
                </div>
                <button className={primaryAction + " w-full mt-6"} onClick={() => setLeaveSent(true)}>Send request <span>→</span></button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default function MemberDashboard() {
  return (
    <MemberLayout active="overview">
      <MemberWorkspace />
    </MemberLayout>
  );
}
