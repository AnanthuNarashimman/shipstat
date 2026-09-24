import { ImageResponse } from "next/og";

import { formatAgo } from "@/lib/dates";
import { formatCompact, formatFull, formatPct } from "@/lib/format";
import { isValidPackageName } from "@/lib/npm";
import { getReport } from "@/lib/report";

const C = {
  bg: "#fffaf5",
  surface: "#ffffff",
  ink: "#231a15",
  ink2: "#5c4b42",
  muted: "#7d6c63",
  line: "#f1e1d2",
  accent: "#e8590c",
  red: "#e03a2f",
  wash: "rgba(232,89,12,0.10)",
  up: "#2b8a3e",
  down: "#d9342b",
};

// Same pixel palette as the hero waves, shown beside the wordmark.
const PIXELS = ["#ffc1b6", "#ff7a66", "#ffd2a8", "#ff9a3d", "#ffe6a0", "#ffc83d"];

// Google Fonts serves TTF (which the image renderer needs) when no browser user agent is sent.
async function loadFont(family: string, weight: number): Promise<ArrayBuffer | null> {
  try {
    const css = await (
      await fetch(`https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}:wght@${weight}`, { cache: "force-cache" })
    ).text();
    const url = css.match(/src: url\((.+?)\) format\('(?:truetype|opentype)'\)/)?.[1];
    if (!url) return null;
    return await (await fetch(url, { cache: "force-cache" })).arrayBuffer();
  } catch {
    return null;
  }
}

function sparkPath(values: number[], w: number, h: number) {
  const max = Math.max(...values, 1);
  const pad = 14; // room for the end dot
  const pts = values.map((v, i) => [
    (i / Math.max(1, values.length - 1)) * (w - pad),
    pad + (1 - v / max) * (h - pad * 2),
  ]);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join("");
  const last = pts.at(-1)!;
  return { line, area: `${line}L${last[0]},${h}L0,${h}Z`, last };
}

// Cut at a word boundary so the card never ends on half a word.
function truncate(s: string, n: number) {
  if (s.length <= n) return s;
  const cut = s.slice(0, n - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > n * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,.;:–-]+$/, "")}…`;
}

export async function GET(request: Request, ctx: RouteContext<"/api/card/[...pkg]">) {
  const { pkg } = await ctx.params;
  const name = pkg.map((s) => decodeURIComponent(s)).join("/");
  if (!isValidPackageName(name)) return new Response("Not found", { status: 404 });
  const report = await getReport(name);
  if (!report) return new Response("Not found", { status: 404 });

  const search = new URL(request.url).searchParams;
  const square = search.get("format") === "square";
  const width = square ? 1080 : 1200;
  const height = square ? 1080 : 630;

  const { meta, totals } = report;
  const trend = totals.trendPct;
  const spark = report.sparkline.length >= 2 ? report.sparkline : null;
  const sparkW = square ? 936 : 400;
  const sparkH = square ? 260 : 170;
  const path = spark ? sparkPath(spark, sparkW, sparkH) : null;

  const [regular, semibold, display] = await Promise.all([
    loadFont("Google Sans", 400),
    loadFont("Google Sans", 600),
    loadFont("Google Sans", 700),
  ]);
  const fonts = [
    ...(regular ? [{ name: "Google Sans", data: regular, weight: 400 as const, style: "normal" as const }] : []),
    ...(semibold ? [{ name: "Google Sans", data: semibold, weight: 600 as const, style: "normal" as const }] : []),
    ...(display ? [{ name: "Google Sans", data: display, weight: 800 as const, style: "normal" as const }] : []),
  ];

  const nameSize = meta.name.length > 28 ? 44 : meta.name.length > 18 ? 54 : 64;
  // Exact counts are the point for small packages; past a million, compact reads better and fits.
  const weekly = totals.lastWeek >= 1_000_000 ? formatCompact(totals.lastWeek) : formatFull(totals.lastWeek);
  const weeklySize = square ? 168 : weekly.length > 6 ? 112 : 132;

  const headline = (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 18 }}>
        <div style={{ fontSize: weeklySize, fontWeight: 800, letterSpacing: -4, lineHeight: 1 }}>{weekly}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 14, fontSize: 28 }}>
        <span style={{ color: C.ink2 }}>weekly downloads</span>
        {trend !== null && (
          <span
            style={{
              display: "flex",
              padding: "4px 14px",
              borderRadius: 999,
              background: trend >= 0 ? "rgba(43,138,62,0.12)" : "rgba(217,52,43,0.12)",
              color: trend >= 0 ? C.up : C.down,
              fontWeight: 600,
              alignItems: "center",
            }}
          >
            {trend !== 0 && (
              // The card fonts have no ▲/▼ glyphs, so the arrow is drawn.
              <svg width="18" height="16" viewBox="0 0 18 16" style={{ marginRight: 10 }}>
                <path d={trend > 0 ? "M9 1 17 15H1Z" : "M9 15 1 1h16Z"} fill="currentColor" />
              </svg>
            )}
            {formatPct(trend)}
          </span>
        )}
      </div>
    </div>
  );

  const sparkline = path && (
    <svg width={sparkW} height={sparkH} viewBox={`0 0 ${sparkW} ${sparkH}`} style={{ overflow: "visible" }}>
      <path d={path.area} fill={C.wash} />
      <path d={path.line} fill="none" stroke={C.accent} strokeWidth={4} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={path.last[0]} cy={path.last[1]} r={9} fill={C.accent} stroke={C.bg} strokeWidth={4} />
    </svg>
  );

  const image = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: square ? 72 : 64,
          background: C.bg,
          color: C.ink,
          fontFamily: "Google Sans",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <span style={{ fontSize: nameSize, fontWeight: 800, letterSpacing: -2 }}>{meta.name}</span>
              <span
                style={{
                  display: "flex",
                  fontSize: 24,
                  color: C.ink2,
                  background: C.surface,
                  border: `2px solid ${C.line}`,
                  borderRadius: 10,
                  padding: "4px 12px",
                }}
              >
                v{meta.version}
              </span>
            </div>
          </div>
          {meta.description && (
            <div style={{ display: "flex", marginTop: 14, fontSize: 26, color: C.muted, maxWidth: 1000 }}>
              {truncate(meta.description, square ? 64 : 72)}
            </div>
          )}
        </div>

        {square ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 56 }}>
            {headline}
            {sparkline}
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 48 }}>
            {headline}
            {sparkline}
          </div>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: `2px solid ${C.line}`,
            paddingTop: 24,
            fontSize: 24,
            color: C.ink2,
          }}
        >
          <span>
            {formatCompact(totals.allTime)} all time · released {formatAgo(report.releases.daysSinceLast)}
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ display: "flex", gap: 4 }}>
              {PIXELS.map((c) => (
                <span key={c} style={{ width: 14, height: 14, background: c }} />
              ))}
            </span>
            <span style={{ color: C.accent, fontWeight: 800 }}>shipstat</span>
          </span>
        </div>
      </div>
    ),
    { width, height, fonts: fonts.length ? fonts : undefined },
  );

  const headers = new Headers(image.headers);
  headers.set("cache-control", "public, max-age=3600, s-maxage=21600, stale-while-revalidate=86400");
  if (search.get("download")) {
    const file = meta.name.replace(/^@/, "").replace(/\//g, "-");
    headers.set("content-disposition", `attachment; filename="${file}-shipstat${square ? "-square" : ""}.png"`);
  }
  return new Response(image.body, { status: 200, headers });
}
