"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Check, Megaphone } from "lucide-react";
import { toast } from "sonner";
import {
	AnnounceRequest,
	AppNotification,
	UserRole,
	announceNotification,
	listNotifications,
	markAllNotificationsRead,
	markNotificationRead,
	unreadNotificationCount,
} from "../lib/auth";
import Modal from "./modal";
import RecipientPicker, { toggleRecipient, toggleRecipientGroup, useMeetingRecipients } from "./recipient-picker";

function formatRelativeTime(isoString: string) {
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

function AnnounceModal({ role, onClose, onSent }: { role: "admin" | "superadmin"; onClose: () => void; onSent: () => void }) {
	const { recipients, isLoading, error: recipientsError } = useMeetingRecipients(role);
	const [selection, setSelection] = useState<string[]>([]);
	const [title, setTitle] = useState("");
	const [message, setMessage] = useState("");
	const [isSending, setIsSending] = useState(false);

	const inputClass = "w-full h-[42px] mt-[7px] border border-line rounded-md px-[11px] outline-none text-[#2d4037] bg-white text-xs focus:border-[#2b7358] focus:shadow-[0_0_0_3px_#2b73581a]";

	async function send() {
		if (!title.trim() || !message.trim()) {
			toast.error("Title and message are required.");
			return;
		}
		setIsSending(true);
		try {
			const input: AnnounceRequest = { title: title.trim(), message: message.trim(), recipientIds: selection.length ? selection : undefined };
			const result = await announceNotification(role, input);
			toast.success(`Announcement sent to ${result.sentTo} ${result.sentTo === 1 ? "person" : "people"}.`);
			onSent();
			onClose();
		} catch (sendError) {
			toast.error(sendError instanceof Error ? sendError.message : "Unable to send this announcement.");
		} finally {
			setIsSending(false);
		}
	}

	return (
		<Modal title="Send announcement" onClose={onClose} wide>
			<div className="grid gap-[15px]">
				<label className="block text-[#53665c] text-[11px] font-bold">Title<input className={inputClass} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Important update" /></label>
				<label className="block text-[#53665c] text-[11px] font-bold">Message<textarea className={inputClass.replace("h-[42px]", "h-[84px] py-[9px]")} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Write your announcement..." /></label>
				<div>
					<div className="flex items-center justify-between mb-1">
						<span className="text-[#53665c] text-[11px] font-bold">Send to</span>
						<span className="text-[10px] text-[#9aa8a1]">{selection.length ? `${selection.length} selected` : "Everyone"}</span>
					</div>
					{isLoading ? (
						<div className="grid place-items-center py-6 text-[#a0aaa5] text-center"><span className="text-[28px]">◌</span><p className="text-[11px] leading-[1.6]">Loading recipients...</p></div>
					) : (
						<div className="overflow-y-auto" style={{ maxHeight: "260px" }}>
							<RecipientPicker
								recipients={recipients}
								selection={selection}
								onToggle={(id) => setSelection((current) => toggleRecipient(current, id))}
								onToggleGroup={(ids, checked) => setSelection((current) => toggleRecipientGroup(current, ids, checked))}
							/>
						</div>
					)}
					{recipientsError && <p className="m-0 mt-2 text-[11px] text-[#ae4d44]" role="alert">{recipientsError}</p>}
				</div>
				<button
					type="button"
					className="flex justify-center gap-3 border-0 rounded-md px-4 py-[10px] text-white bg-brand cursor-pointer text-xs font-bold disabled:opacity-65 disabled:cursor-wait"
					disabled={isSending}
					onClick={() => void send()}
				>
					{isSending ? "Sending..." : "Send announcement"}
				</button>
			</div>
		</Modal>
	);
}

export default function NotificationBell({ role, canAnnounce }: { role: UserRole; canAnnounce?: boolean }) {
	const [open, setOpen] = useState(false);
	const [notifications, setNotifications] = useState<AppNotification[]>([]);
	const [unreadCount, setUnreadCount] = useState(0);
	const [isLoading, setIsLoading] = useState(false);
	const [showAnnounceModal, setShowAnnounceModal] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		let cancelled = false;
		unreadNotificationCount(role)
			.then((count) => { if (!cancelled) setUnreadCount(count); })
			.catch(() => {});
		const id = setInterval(() => {
			unreadNotificationCount(role)
				.then((count) => { if (!cancelled) setUnreadCount(count); })
				.catch(() => {});
		}, 30000);
		return () => {
			cancelled = true;
			clearInterval(id);
		};
	}, [role]);

	useEffect(() => {
		if (!open) return;
		function handleClickOutside(event: MouseEvent) {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpen(false);
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [open]);

	function loadNotifications() {
		setIsLoading(true);
		listNotifications(role)
			.then(setNotifications)
			.catch((error) => toast.error(error instanceof Error ? error.message : "Unable to load notifications."))
			.finally(() => setIsLoading(false));
	}

	function toggleOpen() {
		setOpen((current) => {
			const next = !current;
			if (next) loadNotifications();
			return next;
		});
	}

	async function markOneRead(notificationId: string) {
		setNotifications((current) => current.map((n) => (n.id === notificationId ? { ...n, read_at: n.read_at ?? new Date().toISOString() } : n)));
		setUnreadCount((current) => Math.max(0, current - 1));
		try {
			await markNotificationRead(role, notificationId);
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Unable to update this notification.");
		}
	}

	async function markAllRead() {
		const previousUnread = unreadCount;
		setNotifications((current) => current.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
		setUnreadCount(0);
		try {
			await markAllNotificationsRead(role);
			toast.success("All notifications marked as read.");
		} catch (error) {
			setUnreadCount(previousUnread);
			toast.error(error instanceof Error ? error.message : "Unable to update notifications.");
		}
	}

	return (
		<div className="relative" ref={menuRef}>
			<button
				type="button"
				className="relative grid place-items-center w-9 h-9 border-0 rounded-lg text-[#3f5a4e] bg-transparent cursor-pointer hover:bg-[#eef5f0]"
				onClick={toggleOpen}
				aria-label="Notifications"
				aria-haspopup="menu"
				aria-expanded={open}
			>
				<Bell size={18} />
				{unreadCount > 0 && (
					<span className="absolute top-1 right-1 min-w-[15px] h-[15px] px-[3px] grid place-items-center rounded-full bg-[#ae4d44] text-white text-[9px] font-bold leading-none">
						{unreadCount > 9 ? "9+" : unreadCount}
					</span>
				)}
			</button>

			{open && (
				<div role="menu" className="absolute right-0 top-[calc(100%+8px)] w-[340px] max-h-[440px] flex flex-col rounded-lg border border-[#e4ebe6] bg-white shadow-[0_12px_28px_-12px_rgba(22,75,60,0.25)] overflow-hidden z-30">
					<div className="flex items-center justify-between px-4 py-3 border-b border-[#edf1ee]">
						<span className="text-xs font-bold text-[#2d4037]">Notifications</span>
						<div className="flex items-center gap-3">
							{canAnnounce && (
								<button type="button" className="inline-flex items-center gap-1 border-0 bg-transparent cursor-pointer text-[#286c54] text-[10px] font-bold" onClick={() => { setOpen(false); setShowAnnounceModal(true); }}>
									<Megaphone size={12} /> Announce
								</button>
							)}
							{unreadCount > 0 && (
								<button type="button" className="inline-flex items-center gap-1 border-0 bg-transparent cursor-pointer text-[#286c54] text-[10px] font-bold" onClick={() => void markAllRead()}>
									<Check size={12} /> Mark all read
								</button>
							)}
						</div>
					</div>
					<div className="overflow-y-auto flex-1">
						{isLoading ? (
							<div className="grid place-items-center py-8 text-[#a0aaa5] text-center"><span className="text-[24px]">◌</span><p className="text-[11px] leading-[1.6]">Loading...</p></div>
						) : notifications.length === 0 ? (
							<div className="grid place-items-center py-10 px-4 text-center">
								<Bell size={20} className="text-[#c3cdc7] mb-2" />
								<p className="text-[11px] text-[#9aa8a1]">No notifications yet.</p>
							</div>
						) : (
							notifications.map((notification) => (
								<button
									key={notification.id}
									type="button"
									className={"block w-full text-left px-4 py-3 border-0 border-t border-[#f2f5f2] first:border-t-0 cursor-pointer hover:bg-[#f7faf7] " + (notification.read_at ? "bg-white" : "bg-[#f2f9f4]")}
									onClick={() => { if (!notification.read_at) void markOneRead(notification.id); }}
								>
									<div className="flex items-start gap-2">
										{!notification.read_at && <span className="mt-1 w-1.5 h-1.5 rounded-full bg-brand shrink-0" aria-hidden="true" />}
										<div className="flex-1 min-w-0">
											<p className="m-0 text-[11px] font-bold text-[#2d4037]">{notification.title}</p>
											<p className="m-0 mt-0.5 text-[11px] text-[#6b7a72] line-clamp-2">{notification.message}</p>
											<p className="m-0 mt-1 text-[9px] text-[#9aa8a1]">{formatRelativeTime(notification.created_at)}</p>
										</div>
									</div>
								</button>
							))
						)}
					</div>
				</div>
			)}

			{showAnnounceModal && canAnnounce && (role === "admin" || role === "superadmin") && (
				<AnnounceModal role={role} onClose={() => setShowAnnounceModal(false)} onSent={() => { if (open) loadNotifications(); }} />
			)}
		</div>
	);
}
