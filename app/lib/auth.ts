export type UserRole = 'superadmin' | 'admin' | 'accountant' | 'member';

export interface WafaUser {
  id: string;
  userId: string;
  role: UserRole;
}

export interface WafaSession {
  user: WafaUser;
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const legacySessionKey = 'wafa_session';
const userSnapshotKey = 'wafa_user_snapshot';
const rememberedSessionKey = 'wafa_remembered';
let sessionCache: WafaSession | null | undefined;
let refreshInFlight: Promise<WafaSession | null> | null = null;
const listeners = new Set<() => void>();

function clearLegacySession() {
  window.localStorage.removeItem(legacySessionKey);
  window.sessionStorage.removeItem(legacySessionKey);
}

function readUserSnapshot(): WafaSession | null {
  const raw = window.sessionStorage.getItem(userSnapshotKey);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as WafaSession;
  } catch {
    window.sessionStorage.removeItem(userSnapshotKey);
    return null;
  }
}

function publish(session: WafaSession | null) {
  sessionCache = session;
  if (session) {
    window.sessionStorage.setItem(userSnapshotKey, JSON.stringify({ user: session.user }));
  } else {
    window.sessionStorage.removeItem(userSnapshotKey);
  }
  listeners.forEach((listener) => listener());
}

async function requestSession(path: string, options?: RequestInit) {
  const response = await fetch(`${apiUrl}/api/auth/${path}`, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message ?? 'Your session has expired.');
  return body as WafaSession;
}

export async function signIn(userId: string, password: string, rememberMe: boolean): Promise<WafaSession> {
  return requestSession('login', {
    method: 'POST',
    body: JSON.stringify({ userId, password, rememberMe }),
  });
}

export function refreshSession(): Promise<WafaSession | null> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = requestSession('refresh', { method: 'POST' })
    .then((session) => {
      publish(session);
      return session;
    })
    .catch(() => {
      publish(null);
      return null;
    })
    .finally(() => {
      refreshInFlight = null;
    });

  return refreshInFlight;
}

export async function restoreSession(): Promise<WafaSession | null> {
  clearLegacySession();
  const hasCurrentTabSession = Boolean(readUserSnapshot());
  const shouldRestoreRememberedSession = window.localStorage.getItem(rememberedSessionKey) === '1';
  if (!hasCurrentTabSession && !shouldRestoreRememberedSession) {
    publish(null);
    return null;
  }
  return refreshSession();
}
export async function apiFetch(input: RequestInfo | URL, init?: RequestInit) {
  const request = () => fetch(input, { ...init, credentials: 'include' });
  let response = await request();

  if (response.status !== 401) return response;

  const session = await refreshSession();
  if (!session) return response;

  response = await request();
  return response;
}

export function saveSession(session: WafaSession, rememberMe: boolean) {
  clearLegacySession();
  if (rememberMe) {
    window.localStorage.setItem(rememberedSessionKey, '1');
  } else {
    window.localStorage.removeItem(rememberedSessionKey);
  }
  publish(session);
}
export function subscribeSession(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSessionSnapshot() {
  if (sessionCache === undefined) {
    const storedSession = readUserSnapshot();
    if (storedSession) sessionCache = storedSession;
  }
  return sessionCache;
}

export async function signOut() {
  clearLegacySession();
  window.localStorage.removeItem(rememberedSessionKey);
  publish(null);
  try {
    await requestSession('logout', { method: 'POST' });
  } finally {
    publish(null);
  }
}

export function dashboardFor(role: UserRole) {
  return `/${role}`;
}

export interface CreateUserRequest {
  userId: string;
  email: string;
  password: string;
  role: "admin" | "member" | "accountant";
  fullName?: string;
  memberNumber?: string;
  phone?: string;
}

export async function createUser(input: CreateUserRequest) {
  const response = await apiFetch(`${apiUrl}/api/auth/superadmin/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message ?? "Unable to create this user.");
  return body as { id: string; userId: string; role: UserRole };
}

export interface Meeting {
  id: string;
  title: string;
  description: string | null;
  meeting_type: "online" | "physical" | "hybrid";
  scheduled_at: string;
  duration_minutes: number;
  meeting_url: string | null;
  status: string;
}

export interface CreateMeetingRequest {
  title: string;
  description?: string;
  scheduledAt: string;
  durationMinutes?: number;
  meetingType?: "online" | "physical" | "hybrid";
  meetingUrl?: string;
  recipientIds?: string[];
}

export async function listMeetings(role: UserRole): Promise<Meeting[]> {
  const response = await apiFetch(`${apiUrl}/api/${role}/meetings`);
  const body = await response.json().catch(() => []);
  if (!response.ok) throw new Error(body.message ?? "Unable to load meetings.");
  return body as Meeting[];
}

export async function createMeeting(role: "admin" | "superadmin", input: CreateMeetingRequest) {
  const response = await apiFetch(`${apiUrl}/api/${role}/meetings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message ?? "Unable to create this meeting.");
  return body as Meeting & { zoomMeetingId: string | null; hostUrl: string | null; sharedWithCount: number };
}

export interface MeetingRecipient {
  id: string;
  fullName: string;
  email: string | null;
  role: UserRole;
}

export async function listMeetingRecipients(role: "admin" | "superadmin"): Promise<MeetingRecipient[]> {
  const response = await apiFetch(`${apiUrl}/api/${role}/meetings/recipients`);
  const body = await response.json().catch(() => []);
  if (!response.ok) throw new Error(body.message ?? "Unable to load recipients.");
  return body as MeetingRecipient[];
}

export async function getMeetingRecipients(role: "admin" | "superadmin", meetingId: string): Promise<string[]> {
  const response = await apiFetch(`${apiUrl}/api/${role}/meetings/${meetingId}/recipients`);
  const body = await response.json().catch(() => []);
  if (!response.ok) throw new Error(body.message ?? "Unable to load who this meeting is shared with.");
  return body as string[];
}

export async function setMeetingRecipients(role: "admin" | "superadmin", meetingId: string, recipientIds: string[]) {
  const response = await apiFetch(`${apiUrl}/api/${role}/meetings/${meetingId}/recipients`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recipientIds }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message ?? "Unable to update who this meeting is shared with.");
  return body as { recipientIds: string[] };
}

export interface UpdateMeetingRequest {
  title?: string;
  description?: string;
  scheduledAt?: string;
  durationMinutes?: number;
  meetingType?: "online" | "physical" | "hybrid";
}

export async function updateMeeting(role: "admin" | "superadmin", meetingId: string, input: UpdateMeetingRequest) {
  const response = await apiFetch(`${apiUrl}/api/${role}/meetings/${meetingId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message ?? "Unable to update this meeting.");
  return body as Meeting;
}

export async function cancelMeeting(role: "admin" | "superadmin", meetingId: string) {
  const response = await apiFetch(`${apiUrl}/api/${role}/meetings/${meetingId}`, { method: "DELETE" });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message ?? "Unable to cancel this meeting.");
  return body as { id: string; status: string };
}

export interface MemberProfile {
  id: string;
  memberNumber: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  status: string;
  joinedAt: string;
  address: string | null;
  occupation: string | null;
  dateOfBirth: string | null;
  emergencyContact: string | null;
}

export interface UpdateMemberProfileRequest {
  fullName?: string;
  phone?: string;
  address?: string;
  occupation?: string;
}

export async function getMemberProfile(): Promise<MemberProfile> {
  const response = await apiFetch(`${apiUrl}/api/member/profile`);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message ?? "Unable to load your profile.");
  return body as MemberProfile;
}

export async function updateMemberProfile(input: UpdateMemberProfileRequest): Promise<MemberProfile> {
  const response = await apiFetch(`${apiUrl}/api/member/profile`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message ?? "Unable to save your profile.");
  return body as MemberProfile;
}

export type StaffRole = "admin" | "superadmin" | "accountant";

export interface StaffProfile {
  id: string;
  userId: string;
  email: string;
  role: StaffRole;
  fullName: string | null;
  phone: string | null;
  joinedAt: string;
}

export interface UpdateStaffProfileRequest {
  fullName?: string;
  phone?: string;
}

export async function getStaffProfile(role: StaffRole): Promise<StaffProfile> {
  const response = await apiFetch(`${apiUrl}/api/${role}/profile`);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message ?? "Unable to load your profile.");
  return body as StaffProfile;
}

export async function updateStaffProfile(role: StaffRole, input: UpdateStaffProfileRequest): Promise<StaffProfile> {
  const response = await apiFetch(`${apiUrl}/api/${role}/profile`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message ?? "Unable to save your profile.");
  return body as StaffProfile;
}

export type ReceiptPaymentType = "monthly_deposit" | "share_contribution" | "loan_payment" | "other";
export type ReceiptStatus = "pending" | "approved" | "rejected";

export interface Receipt {
  id: string;
  receiptNumber: string;
  amount: number;
  paymentType: ReceiptPaymentType;
  paymentDate: string;
  status: ReceiptStatus;
  submittedAt: string;
  rejectionReason: string | null;
  fileName: string;
  fileUrl: string | null;
}

export interface SubmitReceiptRequest {
  amount: number;
  paymentType: ReceiptPaymentType;
  paymentDate: string;
  file: File;
}

export async function listReceipts(): Promise<Receipt[]> {
  const response = await apiFetch(`${apiUrl}/api/member/receipts`);
  const body = await response.json().catch(() => []);
  if (!response.ok) throw new Error(body.message ?? "Unable to load your receipts.");
  return body as Receipt[];
}

export async function submitReceipt(input: SubmitReceiptRequest): Promise<Receipt> {
  const formData = new FormData();
  formData.append("amount", String(input.amount));
  formData.append("paymentType", input.paymentType);
  formData.append("paymentDate", input.paymentDate);
  formData.append("file", input.file);

  const response = await apiFetch(`${apiUrl}/api/member/receipts`, { method: "POST", body: formData });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message ?? "Unable to submit this receipt.");
  return body as Receipt;
}

export type PaymentEntryState = "due" | "overdue" | "paid";

export interface PaymentEntry {
  id: string;
  label: string;
  period: string;
  amount: number;
  date: string;
  state: PaymentEntryState;
}

export interface PaymentsOverview {
  currentBalance: number;
  totalContributions: number;
  duePaymentsCount: number;
  history: PaymentEntry[];
}

export async function getPaymentsOverview(): Promise<PaymentsOverview> {
  const response = await apiFetch(`${apiUrl}/api/member/payments`);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message ?? "Unable to load your payments.");
  return body as PaymentsOverview;
}

export type CertificateRecipientRole = "superadmin" | "admin" | "accountant" | "member";

export interface CertificateRecipient {
  id: string;
  fullName: string;
  email: string | null;
  role: CertificateRecipientRole;
}

export interface Certificate {
  id: string;
  certificateNumber: string;
  title: string;
  description: string | null;
  templateHtml: string;
  issuedAt: string;
}

export interface AdminCertificate extends Certificate {
  recipientName: string;
  recipientRole: CertificateRecipientRole;
}

export interface IssueCertificateRequest {
  recipientId: string;
  title: string;
  description?: string;
  templateHtml: string;
}

export async function listCertificateRecipients(): Promise<CertificateRecipient[]> {
  const response = await apiFetch(`${apiUrl}/api/admin/certificates/recipients`);
  const body = await response.json().catch(() => []);
  if (!response.ok) throw new Error(body.message ?? "Unable to load recipients.");
  return body as CertificateRecipient[];
}

export async function listIssuedCertificates(): Promise<AdminCertificate[]> {
  const response = await apiFetch(`${apiUrl}/api/admin/certificates`);
  const body = await response.json().catch(() => []);
  if (!response.ok) throw new Error(body.message ?? "Unable to load certificates.");
  return body as AdminCertificate[];
}

export async function issueCertificate(input: IssueCertificateRequest): Promise<AdminCertificate & { certificateNumber: string }> {
  const response = await apiFetch(`${apiUrl}/api/admin/certificates`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message ?? "Unable to issue this certificate.");
  return body as AdminCertificate & { certificateNumber: string };
}

export async function listMyCertificates(): Promise<Certificate[]> {
  const response = await apiFetch(`${apiUrl}/api/member/certificates`);
  const body = await response.json().catch(() => []);
  if (!response.ok) throw new Error(body.message ?? "Unable to load your certificates.");
  return body as Certificate[];
}

export async function listMyAccountantCertificates(): Promise<Certificate[]> {
  const response = await apiFetch(`${apiUrl}/api/accountant/certificates`);
  const body = await response.json().catch(() => []);
  if (!response.ok) throw new Error(body.message ?? "Unable to load your certificates.");
  return body as Certificate[];
}

export type NotificationType = "loan_due" | "payment_due" | "receipt_approved" | "receipt_rejected" | "meeting" | "dividend" | "system";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  reference_type: string | null;
  reference_id: string | null;
  read_at: string | null;
  created_at: string;
}

export async function listNotifications(role: UserRole): Promise<AppNotification[]> {
  const response = await apiFetch(`${apiUrl}/api/${role}/notifications`);
  const body = await response.json().catch(() => []);
  if (!response.ok) throw new Error(body.message ?? "Unable to load notifications.");
  return body as AppNotification[];
}

export async function unreadNotificationCount(role: UserRole): Promise<number> {
  const response = await apiFetch(`${apiUrl}/api/${role}/notifications/unread-count`);
  const body = await response.json().catch(() => ({ count: 0 }));
  if (!response.ok) throw new Error(body.message ?? "Unable to load unread notifications.");
  return (body as { count: number }).count;
}

export async function markNotificationRead(role: UserRole, notificationId: string) {
  const response = await apiFetch(`${apiUrl}/api/${role}/notifications/${notificationId}/read`, { method: "POST" });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message ?? "Unable to update this notification.");
  return body as { id: string };
}

export async function markAllNotificationsRead(role: UserRole) {
  const response = await apiFetch(`${apiUrl}/api/${role}/notifications/read-all`, { method: "POST" });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message ?? "Unable to update notifications.");
  return body as { ok: boolean };
}

export interface AnnounceRequest {
  title: string;
  message: string;
  recipientIds?: string[];
}

export async function announceNotification(role: "admin" | "superadmin", input: AnnounceRequest) {
  const response = await apiFetch(`${apiUrl}/api/${role}/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message ?? "Unable to send this announcement.");
  return body as { sentTo: number };
}

export interface AuditLogEntry {
  id: string;
  actor_user_id: string | null;
  actor_member_id: string | null;
  actor_role: string | null;
  actor_email: string | null;
  actor_full_name: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

export interface AuditLogFilters {
  actorId?: string;
  action?: string;
  entityType?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

export async function listAuditLogs(filters: AuditLogFilters = {}): Promise<{ items: AuditLogEntry[]; total: number }> {
  const params = new URLSearchParams();
  if (filters.actorId) params.set("actorId", filters.actorId);
  if (filters.action) params.set("action", filters.action);
  if (filters.entityType) params.set("entityType", filters.entityType);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.offset) params.set("offset", String(filters.offset));
  const query = params.toString();
  const response = await apiFetch(`${apiUrl}/api/superadmin/audit-logs${query ? `?${query}` : ""}`);
  const body = await response.json().catch(() => ({ items: [], total: 0 }));
  if (!response.ok) throw new Error(body.message ?? "Unable to load audit logs.");
  return body as { items: AuditLogEntry[]; total: number };
}




