import type { AuditLogEntry } from "./auth";

export const actionOptions = [
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

export const actionLabels: Record<string, string> = Object.fromEntries(actionOptions.filter((o) => o.value).map((o) => [o.value, o.label]));

export const actionTone: Record<string, string> = {
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

export function actorLabel(entry: AuditLogEntry) {
  if (entry.actor_full_name) return entry.actor_full_name;
  if (entry.actor_email) return entry.actor_email;
  if (entry.actor_user_id) return entry.actor_user_id.slice(0, 8);
  return "System";
}
