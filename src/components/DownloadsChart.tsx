"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

import { addDays, diffDays, formatDay, formatMonth, weekdayOf } from "@/lib/dates";
import { formatCompact, formatFull } from "@/lib/format";
import { rollingAverage, sum, weeklyBuckets } from "@/lib/series";

type Release = { version: string; date: string };

type Props = {
  start: string;
  counts: (number | null)[];
  releases: Release[]; // stable releases, oldest first
  compact?: boolean; // hides the table view, for previews
};

const RANGES = [
  { key: "30d", label: "30 days", days: 30 },
  { key: "90d", label: "90 days", days: 90 },
  { key: "1y", label: "1 year", days: 365 },
  { key: "all", label: "All time", days: Infinity },
] as const;
type RangeKey = (typeof RANGES)[number]["key"];

type Point = {
  start: string;
  end: string;
  first: number; // day index within the view
  last: number;
  value: number;
  avg: number | null;
  gaps: number;
};

const HEIGHT = 260;
const M = { top: 30, right: 12, bottom: 28, left: 46 };

function niceMax(max: number): { top: number; step: number } {
  if (max <= 0) return { top: 4, step: 1 };
  const rough = max / 4;
  const pow = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= rough) ?? 10 * pow;
  return { top: Math.ceil(max / step) * step, step };
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function isWeekend(day: string): boolean {
  const wd = weekdayOf(day);
  return wd === 0 || wd === 6;
}

function barPath(x: number, y: number, w: number, h: number): string {
  const r = Math.min(4, w / 2, h);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

export function DownloadsChart({ start, counts, releases, compact = false }: Props) {
  const enabled = (i: number) => i === 0 || counts.length > RANGES[i - 1].days;
  const [range, setRange] = useState<RangeKey>(enabled(1) ? "90d" : "30d");
  const [hover, setHover] = useState<number | null>(null);
  const [width, setWidth] = useState(720);
  const areaId = useId();
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const days = RANGES.find((r) => r.key === range)!.days;
  const weekly = days > 90;

  const view = useMemo(() => {
    const n = Math.min(counts.length, days);
    const offset = counts.length - n;
    const viewStart = addDays(start, offset);
    const slice = counts.slice(offset);
    let points: Point[];
    if (!weekly) {
      const avg = rollingAverage(counts).slice(offset);
      points = slice.map((c, i) => ({
        start: addDays(viewStart, i),
        end: addDays(viewStart, i),
        first: i,
        last: i,
        value: c ?? 0,
        avg: avg[i],
        gaps: c === null ? 1 : 0,
      }));
    } else {
      points = weeklyBuckets({ start: viewStart, counts: slice }).map((b) => ({
        start: b.start,
        end: b.end,
        first: diffDays(viewStart, b.start),
        last: diffDays(viewStart, b.end),
        value: b.downloads,
        avg: null,
        gaps: b.gaps,
      }));
    }
    const viewEnd = addDays(viewStart, n - 1);
    return {
      n,
      viewStart,
      points,
      total: sum(slice),
      gapDays: slice.filter((c) => c === null).length,
      releases: releases.filter((r) => r.date >= viewStart && r.date <= viewEnd),
    };
  }, [counts, start, days, weekly, releases]);

  const innerW = Math.max(120, width - M.left - M.right);
  const innerH = HEIGHT - M.top - M.bottom;
  const { top: yTop, step: yStep } = niceMax(
    Math.max(0, ...view.points.map((p) => Math.max(p.value, p.avg ?? 0))),
  );
  const y = (v: number) => M.top + innerH - (v / yTop) * innerH;
  // One horizontal scale in day units, so bars, weekly points and release markers share it.
  const xDay = (d: number) => M.left + ((d + 0.5) / Math.max(1, view.n)) * innerW;
  const xPoint = (p: Point) => xDay((p.first + p.last) / 2);

  const slot = innerW / Math.max(1, view.n);
  const barW = Math.max(1, Math.min(24, slot - 2));

  // Label releases right to left so the newest always gets a label; skip ones that would collide.
  const markerReleases = useMemo(() => {
    let list = view.releases;
    if (list.length > innerW / 10) list = list.filter((r) => /^\d+\.\d+\.0$/.test(r.version));
    const markers: (Release & { x: number; labeled: boolean })[] = [];
    let lastLabelX = Infinity;
    for (let i = list.length - 1; i >= 0; i--) {
      const x = M.left + ((diffDays(view.viewStart, list[i].date) + 0.5) / Math.max(1, view.n)) * innerW;
      const labeled = lastLabelX - x >= 64;
      if (labeled) lastLabelX = x;
      markers.push({ ...list[i], x, labeled });
    }
    return markers;
  }, [view, innerW]);

  const xTicks = useMemo(() => {
    const maxLabels = Math.max(2, Math.floor(innerW / 90));
    if (!weekly) {
      const every = Math.ceil(view.n / maxLabels);
      const ticks: { x: number; label: string }[] = [];
      for (let i = view.n - 1; i >= 0; i -= every) {
        ticks.unshift({ x: xDay(i), label: formatDay(addDays(view.viewStart, i), false) });
      }
      return ticks;
    }
    const monthStarts: { x: number; label: string }[] = [];
    for (let i = 0; i < view.n; i++) {
      const day = addDays(view.viewStart, i);
      if (day.endsWith("-01")) monthStarts.push({ x: xDay(i), label: formatMonth(day) });
    }
    const every = Math.ceil(monthStarts.length / maxLabels);
    return monthStarts.filter((_, i) => (monthStarts.length - 1 - i) % every === 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, innerW, weekly]);

  const yTicks: number[] = [];
  for (let v = 0; v <= yTop + 1e-9; v += yStep) yTicks.push(v);

  const pointerToIndex = (clientX: number) => {
    const rect = boxRef.current?.getBoundingClientRect();
    if (!rect || view.points.length === 0) return null;
    const px = clientX - rect.left;
    let best = 0;
    for (let i = 1; i < view.points.length; i++) {
      if (Math.abs(xPoint(view.points[i]) - px) < Math.abs(xPoint(view.points[best]) - px)) best = i;
    }
    return best;
  };

  const onKey = (e: React.KeyboardEvent) => {
    const last = view.points.length - 1;
    if (e.key === "ArrowLeft") setHover((h) => Math.max(0, (h ?? last + 1) - 1));
    else if (e.key === "ArrowRight") setHover((h) => Math.min(last, (h ?? -1) + 1));
    else if (e.key === "Escape") setHover(null);
    else return;
    e.preventDefault();
  };

  const hovered = hover !== null ? view.points[hover] : null;
  const hoveredReleases = hovered ? view.releases.filter((r) => r.date >= hovered.start && r.date <= hovered.end) : [];

  const linePath = (values: (number | null)[]) => {
    let d = "";
    let pen = false;
    values.forEach((v, i) => {
      if (v === null) {
        pen = false;
        return;
      }
      d += `${pen ? "L" : "M"}${xPoint(view.points[i]).toFixed(1)},${y(v).toFixed(1)}`;
      pen = true;
    });
    return d;
  };

  const rangeLabel = RANGES.find((r) => r.key === range)!.label.toLowerCase();

  return (
    <section aria-labelledby="chart-title">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="chart-title" className="text-sm font-medium text-ink-2">
            {weekly ? "Weekly downloads" : "Daily downloads"}
          </h2>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-ink">
            {formatFull(view.total)}
            <span className="ml-2 text-sm font-normal text-muted">
              {range === "all" ? "all time" : view.n < days ? `since first publish` : `in the last ${rangeLabel}`}
            </span>
          </p>
        </div>
        <div role="group" aria-label="Date range" className="flex gap-1 rounded-lg border border-line bg-surface p-1">
          {RANGES.map((r, i) => (
            <button
              key={r.key}
              type="button"
              disabled={!enabled(i)}
              aria-pressed={range === r.key}
              onClick={() => {
                setRange(r.key);
                setHover(null);
              }}
              className={`rounded-md px-3 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-35 ${
                range === r.key ? "bg-sunken font-medium text-ink" : "text-ink-2 hover:text-ink"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-2">
        {!weekly && (
          <>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-[2px] bg-weekday opacity-60" /> Weekday
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-[2px] bg-weekend opacity-60" /> Weekend
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-3.5 rounded bg-avg" /> 7-day average
            </span>
          </>
        )}
        {markerReleases.length > 0 && (
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-px bg-marker" /> Release
          </span>
        )}
        {view.gapDays > 0 && (
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2 rounded-full border border-muted" /> No data from npm ({view.gapDays}{" "}
            {view.gapDays === 1 ? "day" : "days"})
          </span>
        )}
      </div>

      <div ref={boxRef} className="relative mt-3 select-none">
        <svg
          width="100%"
          height={HEIGHT}
          role="img"
          aria-label={`${weekly ? "Weekly" : "Daily"} downloads, ${formatFull(view.total)} in total. Use arrow keys to inspect values.`}
          tabIndex={0}
          onKeyDown={onKey}
          onBlur={() => setHover(null)}
          onPointerMove={(e) => setHover(pointerToIndex(e.clientX))}
          onPointerLeave={() => setHover(null)}
          className="block overflow-visible outline-none focus-visible:rounded-md focus-visible:outline-2 focus-visible:outline-accent"
        >
          {yTicks.map((v) => (
            <g key={v}>
              <line x1={M.left} x2={M.left + innerW} y1={y(v)} y2={y(v)} stroke="var(--grid)" strokeWidth={1} />
              <text
                x={M.left - 8}
                y={y(v)}
                dy="0.32em"
                textAnchor="end"
                fontSize={11}
                fill="var(--muted)"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {formatCompact(v)}
              </text>
            </g>
          ))}

          {xTicks.map((t) => (
            <text key={t.label + t.x} x={t.x} y={HEIGHT - 8} textAnchor="middle" fontSize={11} fill="var(--muted)">
              {t.label}
            </text>
          ))}

          {markerReleases.map((r) => (
            <g key={r.version}>
              <line
                x1={r.x}
                x2={r.x}
                y1={M.top - 6}
                y2={M.top + innerH}
                stroke="var(--marker)"
                strokeWidth={1}
                opacity={0.55}
              />
              {r.labeled && (
                <>
                  <circle cx={r.x} cy={M.top - 6} r={3} fill="var(--marker)" stroke="var(--surface)" strokeWidth={2} />
                  <text x={r.x} y={M.top - 14} textAnchor="middle" fontSize={10.5} fill="var(--ink-2)">
                    {r.version}
                  </text>
                </>
              )}
            </g>
          ))}

          {!weekly &&
            view.points.map((p, i) => {
              const cx = xPoint(p);
              if (p.gaps) {
                return (
                  <circle
                    key={p.start}
                    cx={cx}
                    cy={M.top + innerH - 4}
                    r={2.5}
                    fill="none"
                    stroke="var(--muted)"
                    strokeWidth={1}
                  />
                );
              }
              const h = M.top + innerH - y(p.value);
              if (h <= 0) return null;
              return (
                <path
                  key={p.start}
                  d={barPath(cx - barW / 2, y(p.value), barW, h)}
                  fill={isWeekend(p.start) ? "var(--weekend)" : "var(--weekday)"}
                  opacity={hover === null ? 0.55 : hover === i ? 0.9 : 0.3}
                />
              );
            })}

          {!weekly && (
            <path
              d={linePath(view.points.map((p) => p.avg))}
              fill="none"
              stroke="var(--avg)"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}

          {weekly && view.points.length > 0 && (
            <>
              <defs>
                <linearGradient id={areaId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" style={{ stopColor: "var(--accent)", stopOpacity: 0.22 }} />
                  <stop offset="100%" style={{ stopColor: "var(--yellow)", stopOpacity: 0.06 }} />
                </linearGradient>
              </defs>
              <path
                d={`${linePath(view.points.map((p) => p.value))}L${xPoint(view.points.at(-1)!)},${M.top + innerH}L${xPoint(view.points[0])},${M.top + innerH}Z`}
                fill={`url(#${areaId})`}
              />
              <path
                d={linePath(view.points.map((p) => p.value))}
                fill="none"
                stroke="var(--accent)"
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              <circle
                cx={xPoint(view.points.at(-1)!)}
                cy={y(view.points.at(-1)!.value)}
                r={4}
                fill="var(--accent)"
                stroke="var(--surface)"
                strokeWidth={2}
              />
            </>
          )}

          {hovered && (
            <g pointerEvents="none">
              <line
                x1={xPoint(hovered)}
                x2={xPoint(hovered)}
                y1={M.top}
                y2={M.top + innerH}
                stroke="var(--ink-2)"
                strokeWidth={1}
                opacity={0.4}
              />
              {(weekly ? hovered.value : hovered.avg) !== null && (
                <circle
                  cx={xPoint(hovered)}
                  cy={y((weekly ? hovered.value : hovered.avg)!)}
                  r={4}
                  fill={weekly ? "var(--accent)" : "var(--avg)"}
                  stroke="var(--surface)"
                  strokeWidth={2}
                />
              )}
            </g>
          )}
        </svg>

        {hovered && (
          <div
            className="pointer-events-none absolute top-2 z-10 min-w-40 rounded-lg border border-line bg-surface px-3 py-2.5 text-xs"
            style={
              xPoint(hovered) > width / 2
                ? { right: width - xPoint(hovered) + 12 }
                : { left: xPoint(hovered) + 12 }
            }
          >
            <div className="text-muted">
              {weekly ? (
                `${formatDay(hovered.start, false)} – ${formatDay(hovered.end)}`
              ) : (
                <span className="flex items-center gap-1.5">
                  <span
                    className={`inline-block size-2 rounded-[2px] ${isWeekend(hovered.start) ? "bg-weekend" : "bg-weekday"}`}
                  />
                  {WEEKDAYS[weekdayOf(hovered.start)]}, {formatDay(hovered.start)}
                </span>
              )}
            </div>
            {hovered.gaps && !weekly ? (
              <div className="mt-1 text-ink-2">npm has no data for this day</div>
            ) : (
              <div className="mt-1 flex items-center justify-between gap-4">
                <span className="text-base font-semibold text-ink tabular-nums">{formatFull(hovered.value)}</span>
                <span className="text-muted">{weekly ? "that week" : "that day"}</span>
              </div>
            )}
            {!weekly && hovered.avg !== null && (
              <div className="mt-1 flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-ink tabular-nums">
                  <span className="inline-block h-0.5 w-3 rounded bg-avg" />
                  {formatFull(Math.round(hovered.avg))}
                </span>
                <span className="text-muted">7-day avg</span>
              </div>
            )}
            {weekly && hovered.gaps > 0 && (
              <div className="mt-1 text-muted">
                Missing {hovered.gaps} {hovered.gaps === 1 ? "day" : "days"} of npm data
              </div>
            )}
            {hoveredReleases.length > 0 && (
              <div className="mt-1.5 flex items-center gap-1.5 border-t border-line pt-1.5 text-ink-2">
                <span className="inline-block h-3 w-px bg-marker" />
                Released {hoveredReleases.map((r) => r.version).join(", ")}
              </div>
            )}
          </div>
        )}
      </div>

      {!compact && (
      <details className="mt-4 text-sm">
        <summary className="cursor-pointer text-muted hover:text-ink-2">Show as table</summary>
        <div className="mt-3 max-h-72 overflow-auto rounded-lg border border-line">
          <table className="w-full text-left text-sm tabular-nums">
            <thead className="sticky top-0 bg-sunken text-xs text-ink-2">
              <tr>
                <th className="px-3 py-2 font-medium">{weekly ? "Week" : "Day"}</th>
                <th className="px-3 py-2 text-right font-medium">Downloads</th>
                {!weekly && <th className="px-3 py-2 text-right font-medium">7-day avg</th>}
              </tr>
            </thead>
            <tbody>
              {view.points
                .slice()
                .reverse()
                .map((p) => (
                  <tr key={p.start} className="border-t border-line">
                    <td className="px-3 py-1.5 text-ink-2">
                      {weekly ? `${formatDay(p.start, false)} – ${formatDay(p.end)}` : formatDay(p.start)}
                    </td>
                    <td className="px-3 py-1.5 text-right text-ink">
                      {!weekly && p.gaps ? "no data" : formatFull(p.value)}
                    </td>
                    {!weekly && (
                      <td className="px-3 py-1.5 text-right text-ink-2">
                        {p.avg === null ? "–" : formatFull(Math.round(p.avg))}
                      </td>
                    )}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </details>
      )}
    </section>
  );
}
