import { apiFetch } from "./auth";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export type LedgerStaffRole = "accountant" | "superadmin" | "admin";

export interface LedgerTotals {
  shareValue: number;
  monthlyDeposit: number;
  wafaKosh: number;
  additionalDeposit: number;
  interest: number;
  fine: number;
  total: number;
}

export interface LedgerSummary {
  memberId: string;
  memberName: string;
  memberNumber: string;
  joinedAt: string;
  openingBalance: number;
  openingBsYear: number | null;
  openingBsMonth: number | null;
  openingBsDay: number | null;
  totals: LedgerTotals;
  totalActualBalance: number;
  availableBalance: number;
  availableBalanceIsOverride: boolean;
}

export interface LedgerEntry {
  id: string;
  bsYear: number;
  bsMonth: number;
  bsDay: number | null;
  adTransactionDate: string | null;
  shareValue: number;
  monthlyDeposit: number;
  wafaKosh: number;
  additionalDeposit: number;
  interest: number;
  fine: number;
  total: number;
  source: "manual" | "auto";
  notes: string | null;
}

export interface UpsertLedgerEntryInput {
  bsYear: number;
  bsMonth: number;
  bsDay?: number;
  shareValue?: number;
  monthlyDeposit?: number;
  wafaKosh?: number;
  additionalDeposit?: number;
  interest?: number;
  fine?: number;
  notes?: string;
}

export interface UpdateLedgerSettingsInput {
  openingBalance?: number;
  openingBsYear?: number;
  openingBsMonth?: number;
  openingBsDay?: number;
  availableBalance?: number | null;
}

export interface LedgerOrgTotals {
  memberCount: number;
  membersWithLedgerActivity: number;
  bsYear: number | null;
  openingBalanceTotal: number;
  totals: LedgerTotals;
  totalActualBalance: number;
  availableBalanceTotal: number;
}

export interface LedgerMember {
  id: string;
  full_name: string;
  member_number: string;
  email: string | null;
}

async function readJson(response: Response) {
  return response.json().catch(() => ({}));
}

export async function getMyLedgerSummary(): Promise<LedgerSummary> {
  const response = await apiFetch(`${apiUrl}/api/member/ledger/summary`);
  const body = await readJson(response);
  if (!response.ok) throw new Error(body.message ?? "Unable to load your ledger.");
  return body as LedgerSummary;
}

export async function listMyLedgerEntries(year?: number): Promise<LedgerEntry[]> {
  const query = year ? `?year=${year}` : "";
  const response = await apiFetch(`${apiUrl}/api/member/ledger/entries${query}`);
  const body = await readJson(response);
  if (!response.ok) throw new Error(body.message ?? "Unable to load your ledger entries.");
  return body as LedgerEntry[];
}

export async function getLedgerOrgTotals(role: LedgerStaffRole, year?: number): Promise<LedgerOrgTotals> {
  const query = year ? `?year=${year}` : "";
  const response = await apiFetch(`${apiUrl}/api/${role}/ledger/totals${query}`);
  const body = await readJson(response);
  if (!response.ok) throw new Error(body.message ?? "Unable to load organization totals.");
  return body as LedgerOrgTotals;
}

export async function listLedgerMembers(role: LedgerStaffRole): Promise<LedgerMember[]> {
  const response = await apiFetch(`${apiUrl}/api/${role}/members`);
  const body = await readJson(response);
  if (!response.ok) throw new Error(body.message ?? "Unable to load members.");
  return body as LedgerMember[];
}

export async function getLedgerSummary(role: LedgerStaffRole, memberId: string): Promise<LedgerSummary> {
  const response = await apiFetch(`${apiUrl}/api/${role}/ledger/${memberId}/summary`);
  const body = await readJson(response);
  if (!response.ok) throw new Error(body.message ?? "Unable to load this member's ledger.");
  return body as LedgerSummary;
}

export async function listLedgerEntries(role: LedgerStaffRole, memberId: string, year?: number): Promise<LedgerEntry[]> {
  const query = year ? `?year=${year}` : "";
  const response = await apiFetch(`${apiUrl}/api/${role}/ledger/${memberId}/entries${query}`);
  const body = await readJson(response);
  if (!response.ok) throw new Error(body.message ?? "Unable to load ledger entries.");
  return body as LedgerEntry[];
}

export async function upsertLedgerEntry(role: LedgerStaffRole, memberId: string, input: UpsertLedgerEntryInput): Promise<LedgerEntry> {
  const response = await apiFetch(`${apiUrl}/api/${role}/ledger/${memberId}/entries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await readJson(response);
  if (!response.ok) throw new Error(body.message ?? "Unable to save this ledger row.");
  return body as LedgerEntry;
}

export async function updateLedgerSettings(role: LedgerStaffRole, memberId: string, input: UpdateLedgerSettingsInput): Promise<LedgerSummary> {
  const response = await apiFetch(`${apiUrl}/api/${role}/ledger/${memberId}/settings`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await readJson(response);
  if (!response.ok) throw new Error(body.message ?? "Unable to save ledger settings.");
  return body as LedgerSummary;
}
