"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { ChatMessage, getSessionSnapshot, listChatMessages, sendChatMessage } from "../lib/auth";

const pollIntervalMs = 4000;

const roleLabel: Record<string, string> = {
  superadmin: "Super admin",
  admin: "Admin",
  accountant: "Accountant",
  member: "Member",
};

const roleBadgeStyle: Record<string, string> = {
  superadmin: "text-[#8a4b9b] bg-[#f1e4f6]",
  admin: "text-[#4378a3] bg-[#e6f1f8]",
  accountant: "text-[#b56f36] bg-[#f9ebdc]",
  member: "text-[#3f835b] bg-[#e4f2e6]",
};

function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initials = (parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "");
  return initials.toUpperCase() || "?";
}

function formatTime(isoString: string) {
  return new Date(isoString).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function formatDay(isoString: string) {
  return new Date(isoString).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<ChatMessage[]>([]);
  const currentUserId = getSessionSnapshot()?.user.id;

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      const latest = messagesRef.current[messagesRef.current.length - 1];
      try {
        const incoming = await listChatMessages(latest?.createdAt);
        if (cancelled || !incoming.length) return;
        setMessages((current) => {
          const seen = new Set(current.map((message) => message.id));
          const merged = [...current, ...incoming.filter((message) => !seen.has(message.id))];
          return merged;
        });
      } catch {
        // Silent: a missed poll will be caught up by the next tick.
      }
    }

    listChatMessages()
      .then((initial) => { if (!cancelled) setMessages(initial); })
      .catch((loadError) => { if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Unable to load chat."); })
      .finally(() => { if (!cancelled) setIsLoading(false); });

    const interval = setInterval(poll, pollIntervalMs);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || isSending) return;
    setIsSending(true);
    setError("");
    try {
      const sent = await sendChatMessage(content);
      setMessages((current) => (current.some((message) => message.id === sent.id) ? current : [...current, sent]));
      setDraft("");
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Unable to send this message.");
    } finally {
      setIsSending(false);
    }
  }

  let lastDay = "";

  return (
    <main className="max-w-[900px] mx-auto px-6 pt-20 max-[650px]:px-4 max-[650px]:pt-[68px] h-dvh flex flex-col overflow-hidden">
      <div className="shrink-0 pb-5">
        <p className="mb-[13px] text-[11px] font-bold tracking-[.18em] uppercase text-brand">Team chat</p>
        <h1 className="m-0 font-display font-bold text-[clamp(28px,3vw,38px)] leading-[1.1] max-[650px]:text-[28px]">Everyone, one room.</h1>
        <p className="mt-[10px] text-muted text-sm">Broadcast a message and every member, admin, accountant, and super admin sees it here.</p>
      </div>

      <div className="flex-1 min-h-0 flex flex-col border border-[#e1e9e4] rounded-[10px] bg-white overflow-hidden">
        <div ref={scrollRef} className="no-scrollbar flex-1 min-h-0 overflow-y-auto px-5 py-4">
          {isLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => <div key={i} className="h-[52px] rounded-md bg-[#edf1ee] animate-pulse" />)}
            </div>
          ) : error && messages.length === 0 ? (
            <div className="p-5 rounded-[10px] border border-[#f3d6d3] bg-[#fdf3f2] text-[#ae4d44] text-sm" role="alert">{error}</div>
          ) : messages.length === 0 ? (
            <p className="text-[12px] text-[#9ba7a1]">No messages yet. Say hello.</p>
          ) : (
            messages.map((message) => {
              const isOwn = message.senderId === currentUserId;
              const showDayDivider = formatDay(message.createdAt) !== lastDay;
              lastDay = formatDay(message.createdAt);
              return (
                <div key={message.id}>
                  {showDayDivider && (
                    <div className="flex items-center gap-3 my-4 first:mt-0">
                      <span className="flex-1 h-px bg-[#edf1ee]" />
                      <span className="text-[10px] font-bold uppercase tracking-wide text-[#9ba7a1]">{formatDay(message.createdAt)}</span>
                      <span className="flex-1 h-px bg-[#edf1ee]" />
                    </div>
                  )}
                  <div className={"flex items-start gap-3 py-2 " + (isOwn ? "flex-row-reverse text-right" : "")}>
                    <span className="grid place-items-center flex-none w-8 h-8 rounded-full text-[#245d4a] bg-[#cde8d3] text-[10px] font-bold">{initialsFor(message.senderName)}</span>
                    <div className={"max-w-[75%] " + (isOwn ? "items-end flex flex-col" : "")}>
                      <div className={"flex items-center gap-2 mb-1 " + (isOwn ? "flex-row-reverse" : "")}>
                        <strong className="text-[12px] text-[#30423a]">{isOwn ? "You" : message.senderName}</strong>
                        <span className={"px-2 py-0.5 rounded text-[9px] font-bold " + (roleBadgeStyle[message.senderRole] ?? "text-[#65756e] bg-[#eef5f0]")}>
                          {roleLabel[message.senderRole] ?? message.senderRole}
                        </span>
                        <span className="text-[9px] text-[#9ba7a1]">{formatTime(message.createdAt)}</span>
                      </div>
                      <p className={"m-0 px-4 py-2 rounded-2xl text-[13px] leading-[1.5] whitespace-pre-wrap break-words " + (isOwn ? "bg-brand text-white rounded-tr-sm" : "bg-[#f3f6f4] text-[#2d4037] rounded-tl-sm")}>
                        {message.content}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {error && messages.length > 0 && (
          <div className="px-5 py-2 text-[11px] text-[#ae4d44] bg-[#fdf3f2] border-t border-[#f3d6d3]" role="alert">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="shrink-0 flex items-center gap-3 p-4 border-t border-[#e4ebe6]">
          <input
            className="flex-1 px-4 py-3 rounded-[8px] border border-[#e1e9e4] text-[13px] outline-none focus:border-brand"
            placeholder="Message everyone…"
            value={draft}
            maxLength={4000}
            onChange={(event) => setDraft(event.target.value)}
            disabled={isSending}
          />
          <button
            type="submit"
            className="grid place-items-center w-11 h-11 rounded-[8px] border-0 text-white bg-brand cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSending || !draft.trim()}
            aria-label="Send message"
          >
            <Send size={17} />
          </button>
        </form>
      </div>
    </main>
  );
}
