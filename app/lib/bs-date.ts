import NepaliDate from "nepali-date-converter";

export const bsMonthNames = [
  "Baishakh",
  "Jestha",
  "Ashadh",
  "Shrawan",
  "Bhadra",
  "Ashwin",
  "Kartik",
  "Mangsir",
  "Poush",
  "Magh",
  "Falgun",
  "Chaitra",
];

export function currentBsDate(): { year: number; month: number; day: number } {
  const bs = new NepaliDate().getBS();
  return { year: bs.year, month: bs.month + 1, day: bs.date };
}

export function bsMonthLabel(month: number): string {
  return bsMonthNames[month - 1] ?? `Month ${month}`;
}

// BS months run 29-32 days depending on the year; offer the full range and
// let the accountant pick the right day rather than guessing per-year lengths.
export const bsDayOptions = Array.from({ length: 32 }, (_, index) => index + 1);
