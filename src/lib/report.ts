import "server-only";

import { unstable_cache } from "next/cache";

import { addDays, diffDays, toDay } from "./dates";
import {
  DOWNLOADS_EPOCH,
  fetchDailyDownloads,
  fetchLastDay,
  fetchPackageMeta,
  fetchVersionDownloads,
  type PackageMeta,
} from "./npm";
import { markGaps, sum, validMean, weekendRatio, weeklyBuckets, type Bucket, type Daily } from "./series";

export type VersionShare = { version: string; downloads: number; share: number };

export type Report = {
  meta: PackageMeta;
  lastDay: string;
  daily: Daily; // from max(created, npm epoch) through lastDay
  totals: {
    lastWeek: number;
    lastMonth: number;
    allTime: number;
    trendPct: number | null; // last 7 days vs the 7 before, on days with data
    gapsLastWeek: number;
    peakWeek: Bucket | null;
  };
  sparkline: number[]; // last 12 weeks, as downloads per day; shape only
  weekendRatio: number | null;
  versions: {
    rows: VersionShare[]; // top versions, then "other"
    latestShare: number | null;
    total: number;
  };
  releases: {
    daysSinceLast: number;
    cadenceDays: number | null;
  };
};

const TOP_VERSIONS = 6;

function versionShares(byVersion: Record<string, number>): Report["versions"]["rows"] {
  const entries = Object.entries(byVersion)
    .filter(([, d]) => d > 0)
    .sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((s, [, d]) => s + d, 0);
  if (total === 0) return [];
  const rows = entries.slice(0, TOP_VERSIONS).map(([version, downloads]) => ({
    version,
    downloads,
    share: downloads / total,
  }));
  const rest = entries.slice(TOP_VERSIONS).reduce((s, [, d]) => s + d, 0);
  if (rest > 0) rows.push({ version: "other", downloads: rest, share: rest / total });
  return rows;
}

// Median gap between the last ten stable release days. Several versions shipped the same day
// (backport patches) count as one release day.
function releaseCadence(meta: PackageMeta): number | null {
  const days = [...new Set(meta.releases.filter((r) => !r.prerelease).map((r) => r.date))].slice(-10);
  if (days.length < 3) return null;
  const gaps = days.slice(1).map((d, i) => diffDays(days[i], d));
  gaps.sort((a, b) => a - b);
  return gaps[Math.floor(gaps.length / 2)];
}

async function buildReport(name: string): Promise<Report | null> {
  const [meta, lastDay] = await Promise.all([fetchPackageMeta(name), fetchLastDay()]);
  if (!meta) return null;

  const start = meta.created > DOWNLOADS_EPOCH ? meta.created : DOWNLOADS_EPOCH;
  const [raw, byVersion] = await Promise.all([
    fetchDailyDownloads(meta.name, start, lastDay),
    fetchVersionDownloads(meta.name),
  ]);

  const daily: Daily = { start, counts: markGaps(raw) };
  const counts = daily.counts;
  const lastWeekCounts = counts.slice(-7);
  const prevWeekCounts = counts.slice(-14, -7);

  const lastMean = validMean(lastWeekCounts, 4);
  const prevMean = counts.length >= 14 ? validMean(prevWeekCounts, 4) : null;
  // With a handful of downloads, a percentage is noise (1 vs 16 reads as "−94%").
  const enoughVolume = sum(lastWeekCounts) + sum(prevWeekCounts) >= 30;
  const trendPct =
    enoughVolume && lastMean !== null && prevMean ? ((lastMean - prevMean) / prevMean) * 100 : null;

  const weeks = weeklyBuckets(daily);
  const peakWeek = weeks.reduce<Bucket | null>((best, w) => (!best || w.downloads > best.downloads ? w : best), null);

  const recent = counts.slice(-84);
  const rows = versionShares(byVersion);
  const latestRow = rows.find((r) => r.version === meta.version);

  const lastRelease = meta.releases.filter((r) => !r.prerelease).at(-1) ?? meta.releases.at(-1);

  return {
    meta,
    lastDay,
    daily,
    totals: {
      lastWeek: sum(lastWeekCounts),
      lastMonth: sum(counts.slice(-30)),
      allTime: sum(counts),
      trendPct,
      gapsLastWeek: lastWeekCounts.filter((c) => c === null).length,
      peakWeek: peakWeek && peakWeek.downloads > 0 ? peakWeek : null,
    },
    // Average per day with data, so a week with an npm outage doesn't draw as a dip.
    sparkline: weeks.slice(-12).map((w) => (w.gaps < 7 ? w.downloads / (7 - w.gaps) : 0)),
    // Too little traffic makes the weekday pattern noise.
    // Needs steady current traffic (~100/week over the last 4 weeks), or a launch spike reads as a pattern.
    weekendRatio:
      sum(counts.slice(-28)) >= 400
        ? weekendRatio({ start: addDays(lastDay, 1 - recent.length), counts: recent })
        : null,
    versions: {
      rows,
      latestShare: rows.length ? (latestRow?.share ?? 0) : null,
      total: rows.reduce((s, r) => s + r.downloads, 0),
    },
    releases: {
      daysSinceLast: lastRelease ? diffDays(lastRelease.date, toDay(new Date())) : 0,
      cadenceDays: releaseCadence(meta),
    },
  };
}

// The whole report is cached per package; one visitor or ten thousand, npm is asked once per window.
export const getReport = unstable_cache(buildReport, ["report-v1"], { revalidate: 21600 });
