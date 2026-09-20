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
  memberIds?: string[];
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

export interface MemberOption {
  id: string;
  full_name: string;
  member_number: string;
  email: string | null;
}

export async function listMembers(role: "admin" | "superadmin"): Promise<MemberOption[]> {
  const response = await apiFetch(`${apiUrl}/api/${role}/members`);
  const body = await response.json().catch(() => []);
  if (!response.ok) throw new Error(body.message ?? "Unable to load members.");
  return body as MemberOption[];
}

export async function getMeetingShares(role: "admin" | "superadmin", meetingId: string): Promise<string[]> {
  const response = await apiFetch(`${apiUrl}/api/${role}/meetings/${meetingId}/shares`);
  const body = await response.json().catch(() => []);
  if (!response.ok) throw new Error(body.message ?? "Unable to load who this meeting is shared with.");
  return body as string[];
}

export async function shareMeeting(role: "admin" | "superadmin", meetingId: string, memberIds: string[]) {
  const response = await apiFetch(`${apiUrl}/api/${role}/meetings/${meetingId}/share`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ memberIds }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message ?? "Unable to share this meeting.");
  return body as { added: number };
}

export async function cancelMeeting(role: "admin" | "superadmin", meetingId: string) {
  const response = await apiFetch(`${apiUrl}/api/${role}/meetings/${meetingId}`, { method: "DELETE" });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message ?? "Unable to cancel this meeting.");
  return body as { id: string; status: string };
}




