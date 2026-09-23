// All dates in this app are UTC calendar days in "YYYY-MM-DD" form, matching the npm downloads API.

const DAY_MS = 86_400_000;

export function toDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function parseDay(day: string): number {
  return Date.UTC(+day.slice(0, 4), +day.slice(5, 7) - 1, +day.slice(8, 10));
}

export function addDays(day: string, n: number): string {
  return toDay(new Date(parseDay(day) + n * DAY_MS));
}

export function diffDays(from: string, to: string): number {
  return Math.round((parseDay(to) - parseDay(from)) / DAY_MS);
}

export function weekdayOf(day: string): number {
  return new Date(parseDay(day)).getUTCDay();
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatDay(day: string, withYear = true): string {
  const m = MONTHS[+day.slice(5, 7) - 1];
  const d = +day.slice(8, 10);
  return withYear ? `${m} ${d}, ${day.slice(0, 4)}` : `${m} ${d}`;
}

export function formatMonth(day: string): string {
  return `${MONTHS[+day.slice(5, 7) - 1]} ${day.slice(0, 4)}`;
}

export function formatAgo(days: number): string {
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 45) return `${days} days ago`;
  if (days < 365) return `${Math.round(days / 30)} months ago`;
  const years = days / 365;
  return years < 1.5 ? "1 year ago" : `${Math.round(years)} years ago`;
}

export function formatInterval(days: number): string {
  if (days < 2) return "daily";
  if (days < 10) return `every ~${Math.round(days)} days`;
  if (days < 60) return `every ~${Math.round(days / 7)} weeks`;
  return `every ~${Math.round(days / 30)} months`;
}
