import { BadRequestException } from '@nestjs/common';

// members.joined_at is a timestamptz, but a joining date is a calendar date.
// Storing it at 12:00 UTC keeps the same calendar day when it is displayed in
// any timezone between UTC-11 and UTC+11 (Nepal is UTC+5:45).
export function joinedAtFromDate(value: string): string {
  const date = value?.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? ''))
    throw new BadRequestException(
      'Date of joining must be a date in YYYY-MM-DD format.',
    );
  const parsed = new Date(`${date}T12:00:00Z`);
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== date
  )
    throw new BadRequestException('Date of joining is not a valid date.');
  // One day of slack so "today" in Nepal is accepted while the server is still on yesterday (UTC).
  if (parsed.getTime() > Date.now() + 24 * 60 * 60 * 1000)
    throw new BadRequestException('Date of joining cannot be in the future.');
  return parsed.toISOString();
}
