// Plain-English sentences that say what a section's numbers mean.

import { formatInterval } from "./dates";
import { formatPct } from "./format";
import type { Report } from "./report";

export function trendInsight(r: Report): string | null {
  const t = r.totals.trendPct;
  if (t === null) return null;
  if (Math.abs(t) < 3) return "Holding steady compared with the week before.";
  return `${t > 0 ? "Up" : "Down"} ${formatPct(Math.abs(t)).replace("+", "")} compared with the week before.`;
}

export function patternInsight(r: Report): string | null {
  const ratio = r.weekendRatio;
  if (ratio === null) return null;
  if (ratio < 0.6)
    return "Downloads dip on weekends, which usually means most installs come from developers at work.";
  if (ratio > 0.85)
    return "Downloads stay flat through weekends, which usually means much of this traffic is CI and automated installs.";
  return "Weekends run somewhat lower than weekdays: a mix of hands-on installs and automated ones.";
}

export function adoptionInsight(r: Report): string | null {
  const share = r.versions.latestShare;
  if (share === null || r.versions.total < 30) return null;
  const pct = Math.round(share * 100);
  if (pct >= 60) return `${pct}% of last week's downloads were the latest version. Users upgrade quickly.`;
  if (pct >= 25) return `${pct}% of last week's downloads were the latest version.`;
  const top = r.versions.rows[0];
  if (top.version === r.meta.version) return `${pct}% of last week's downloads were the latest version.`;
  return `Only ${pct}% of last week's downloads were the latest version; most people are still on ${top.version}.`;
}

export function releaseInsight(r: Report): string | null {
  const { cadenceDays } = r.releases;
  if (cadenceDays === null) return null;
  return `Recent releases have shipped ${formatInterval(cadenceDays)}.`;
}
