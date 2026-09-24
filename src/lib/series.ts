// Pure series math shared by the server (report) and the client (chart).
// A daily series is a start day plus one count per day; `null` marks a day npm has no data for.

import { addDays, weekdayOf } from "./dates";

export type Daily = { start: string; counts: (number | null)[] };

export type Bucket = {
  start: string;
  end: string;
  downloads: number;
  gaps: number;
};

export function sum(counts: (number | null)[]): number {
  let s = 0;
  for (const c of counts) s += c ?? 0;
  return s;
}

// Mean over days that have data; null when too few days to say anything.
export function validMean(counts: (number | null)[], minDays: number): number | null {
  let s = 0;
  let n = 0;
  for (const c of counts) {
    if (c !== null) {
      s += c;
      n++;
    }
  }
  return n >= minDays ? s / n : null;
}

// npm occasionally reports 0 for a whole day across every package (an outage on their side).
// A zero surrounded by a clearly non-zero neighbourhood is treated as missing data, not a real zero.
export function markGaps(counts: number[]): (number | null)[] {
  const out: (number | null)[] = counts.slice();
  for (let i = 0; i < counts.length; i++) {
    if (counts[i] !== 0) continue;
    const around: number[] = [];
    for (let j = Math.max(0, i - 7); j <= Math.min(counts.length - 1, i + 7); j++) {
      if (j !== i && counts[j] > 0) around.push(counts[j]);
    }
    if (around.length < 6) continue;
    around.sort((a, b) => a - b);
    const median = around[Math.floor(around.length / 2)];
    if (median >= 20) out[i] = null;
  }
  return out;
}

// Marks days npm has no data for, using a reference package that is never genuinely at zero:
// a day where the reference reads 0 is an outage on npm's side, for every package, big or small.
export function markOutages(counts: number[], reference: number[]): (number | null)[] {
  return counts.map((c, i) => (c === 0 && reference[i] === 0 ? null : c));
}

// Consecutive 7-day buckets aligned so the last bucket ends on the last day.
export function weeklyBuckets(series: Daily): Bucket[] {
  const { start, counts } = series;
  const buckets: Bucket[] = [];
  for (let end = counts.length - 1; end >= 0; end -= 7) {
    const from = Math.max(0, end - 6);
    const slice = counts.slice(from, end + 1);
    buckets.unshift({
      start: addDays(start, from),
      end: addDays(start, end),
      downloads: sum(slice),
      gaps: slice.filter((c) => c === null).length,
    });
  }
  // A partial first bucket would read as a fake dip; drop it when there is history to spare.
  if (buckets.length > 1 && counts.length % 7 !== 0) buckets.shift();
  return buckets;
}

// Trailing 7-day average that ignores missing days.
export function rollingAverage(counts: (number | null)[], window = 7): (number | null)[] {
  return counts.map((_, i) => validMean(counts.slice(Math.max(0, i - window + 1), i + 1), Math.min(3, i + 1)));
}

// Weekend average relative to weekday average over the given window.
export function weekendRatio(series: Daily): number | null {
  const weekday: number[] = [];
  const weekend: number[] = [];
  series.counts.forEach((c, i) => {
    if (c === null) return;
    const wd = weekdayOf(addDays(series.start, i));
    (wd === 0 || wd === 6 ? weekend : weekday).push(c);
  });
  if (weekday.length < 10 || weekend.length < 4) return null;
  const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const wd = avg(weekday);
  return wd > 0 ? avg(weekend) / wd : null;
}
