import Link from "next/link";

import { DownloadsChart } from "@/components/DownloadsChart";
import { formatDay } from "@/lib/dates";
import { formatCompact, formatFull, formatPct } from "@/lib/format";
import { getReport } from "@/lib/report";
import { packagePath } from "@/lib/site";

// A real package, rendered live, inside a browser frame. If npm is unavailable the preview is skipped.
export async function ProductPreview({ name }: { name: string }) {
  const report = await getReport(name).catch(() => null);
  if (!report) return null;
  const { meta, totals } = report;
  const trend = totals.trendPct;

  const stats = [
    { label: "This week", value: formatCompact(totals.lastWeek) },
    { label: "Last 30 days", value: formatCompact(totals.lastMonth) },
    { label: "Best week", value: totals.peakWeek ? formatCompact(totals.peakWeek.downloads) : "–" },
  ];

  return (
    <div className="relative rounded-[22px] border border-line bg-sunken/70 p-2">
      {/* window chrome */}
      <div className="flex items-center gap-3 px-3 pt-1.5 pb-3">
        <div className="flex gap-1.5">
          <span className="size-2.5 rounded-full border border-line bg-surface" />
          <span className="size-2.5 rounded-full border border-line bg-surface" />
          <span className="size-2.5 rounded-full border border-line bg-surface" />
        </div>
        <div className="mx-auto flex max-w-sm flex-1 items-center justify-center gap-2 rounded-lg border border-line bg-surface px-3 py-1 text-xs text-muted">
          <svg aria-hidden viewBox="0 0 16 16" className="size-3">
            <rect x="3.5" y="7" width="9" height="6.5" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
            <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" fill="none" stroke="currentColor" strokeWidth="1.3" />
          </svg>
          shipstat{packagePath(meta.name)}
        </div>
        <Link
          href={packagePath(meta.name)}
          className="hidden text-xs text-ink-2 underline decoration-line underline-offset-4 hover:text-ink sm:block"
        >
          Open full page
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        <div className="flex flex-wrap items-end justify-between gap-6 border-b border-line px-5 py-6 sm:px-8">
          <div>
            <div className="flex items-baseline gap-2.5">
              <span className="text-2xl font-semibold tracking-tight text-ink">{meta.name}</span>
              <span className="rounded-md bg-sunken px-1.5 py-0.5 font-mono text-xs text-ink-2">v{meta.version}</span>
            </div>
            <div className="mt-4 text-xs text-muted">All-time downloads</div>
            <div className="mt-1 flex items-baseline gap-3">
              <span className="text-4xl font-semibold tracking-[-0.01em] text-ink sm:text-5xl">
                {formatFull(totals.allTime)}
              </span>
              {trend !== null && (
                <span className={`text-sm ${trend >= 0 ? "text-up" : "text-down"}`}>
                  {trend > 0 ? "▲" : trend < 0 ? "▼" : ""} {formatPct(trend)} this week
                </span>
              )}
            </div>
          </div>
          <dl className="flex gap-8 sm:gap-10">
            {stats.map((s) => (
              <div key={s.label}>
                <dt className="text-xs text-muted">{s.label}</dt>
                <dd className="mt-1 text-lg font-semibold tracking-tight text-ink">{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="px-5 py-6 sm:px-8">
          <DownloadsChart
            start={report.daily.start}
            counts={report.daily.counts}
            releases={meta.releases.filter((r) => !r.prerelease)}
            compact
          />
        </div>
      </div>
      <p className="px-3 pt-2.5 pb-1 text-center text-[11px] text-muted">
        Live data for {meta.name}, through {formatDay(report.lastDay)}. Hover the chart.
      </p>
    </div>
  );
}
