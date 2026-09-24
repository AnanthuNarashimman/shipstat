import { ImageResponse } from "next/og";

import { formatDay, toDay } from "@/lib/dates";
import { formatCompact, formatFull } from "@/lib/format";
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

// npm's logo mark (a square with a cut-out "n"), used to say "this is an npm package".
const NPM_MARK =
  "M1.763 0C.786 0 0 .786 0 1.763v20.474C0 23.214.786 24 1.763 24h20.474c.977 0 1.763-.786 1.763-1.763V1.763C24 .786 23.214 0 22.237 0zM5.13 5.323l13.837.019-.009 13.836h-3.464l.01-10.382h-3.456L12.04 19.17H5.113z";

// The hero's pixel-wave palette (light theme), bottom to crest: red → orange → yellow.
const WAVE_SOFT = ["#ffc1b6", "#ffd2a8", "#ffe6a0"];
const WAVE_STRONG = ["#ff7a66", "#ff9a3d", "#ffc83d"];
const WAVE_CELL = 12;
const WAVE_PITCH = 15;
const WAVE_ROWS = 5;

function hash(x: number, y: number, seed: number): number {
  const v = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453;
  return v - Math.floor(v);
}

// A still frame of the hero waves: same shape, dithered crest and colour bands.
function PixelWaves({ width }: { width: number }) {
  const cols = Math.ceil(width / WAVE_PITCH);
  const height = WAVE_ROWS * WAVE_PITCH;
  const cells: { x: number; y: number; fill: string }[] = [];
  for (let i = 0; i < cols; i++) {
    const wave = 0.46 + 0.2 * Math.sin(i * 0.11) + 0.12 * Math.sin(i * 0.043 + 1.3) + 0.06 * Math.sin(i * 0.31);
    const h = wave * WAVE_ROWS;
    const full = Math.floor(h);
    for (let j = 0; j <= full; j++) {
      if (j === full && hash(i, j, 1) > h - full) continue;
      const depth = j / Math.max(1, h);
      const band = depth < 0.34 ? 0 : depth < 0.72 ? 1 : 2;
      const strong = hash(i, j, 8) < 0.06 + depth * 0.1;
      cells.push({ x: i * WAVE_PITCH, y: height - (j + 1) * WAVE_PITCH + (WAVE_PITCH - WAVE_CELL), fill: strong ? WAVE_STRONG[band] : WAVE_SOFT[band] });
    }
  }
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {cells.map((c) => (
        <rect key={`${c.x}-${c.y}`} x={c.x} y={c.y} width={WAVE_CELL} height={WAVE_CELL} fill={c.fill} />
      ))}
    </svg>
  );
}

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
  const spark = report.sparkline.length >= 2 ? report.sparkline : null;
  const sparkW = square ? 936 : 400;
  const sparkH = square ? 260 : 170;
  const path = spark ? sparkPath(spark, sparkW, sparkH) : null;

  const [regular, semibold, display] = await Promise.all([
    // The static Google Sans files use a font feature the image renderer can't parse; Flex renders fine.
    loadFont("Google Sans Flex", 400),
    loadFont("Google Sans Flex", 600),
    loadFont("Google Sans Flex", 800),
  ]);
  const fonts = [
    ...(regular ? [{ name: "Google Sans Flex", data: regular, weight: 400 as const, style: "normal" as const }] : []),
    ...(semibold ? [{ name: "Google Sans Flex", data: semibold, weight: 600 as const, style: "normal" as const }] : []),
    ...(display ? [{ name: "Google Sans Flex", data: display, weight: 800 as const, style: "normal" as const }] : []),
  ];

  const nameSize = meta.name.length > 28 ? 44 : meta.name.length > 18 ? 54 : 64;
  // Long names leave no room for the labelled badge, so it shrinks to the mark alone.
  const compactBadge = meta.name.length + meta.version.length > (square ? 16 : 26);
  // Exact counts are the point for small packages; past a million, compact reads better and fits.
  const exactOrCompact = (n: number) => (n >= 1_000_000 ? formatCompact(n) : formatFull(n));
  const total = exactOrCompact(totals.allTime);
  const weekly = exactOrCompact(totals.lastWeek);
  const totalSize = square ? 168 : total.length > 6 ? 112 : 132;

  const headline = (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 18 }}>
        <div style={{ fontSize: totalSize, fontWeight: 800, letterSpacing: -4, lineHeight: 1 }}>{total}</div>
      </div>
      <div style={{ display: "flex", marginTop: 12, fontSize: 28, color: C.ink2 }}>downloads all time</div>
      <div style={{ display: "flex", alignItems: "center", marginTop: 18, fontSize: 24, color: C.ink2 }}>
        <span style={{ display: "flex", gap: 7 }}>
          <span style={{ color: C.ink, fontWeight: 600 }}>{weekly}</span>
          in the last 7 days
        </span>
        <span style={{ display: "flex", margin: "0 14px", color: C.muted }}>·</span>
        <span style={{ display: "flex", gap: 7 }}>
          <span style={{ color: C.ink, fontWeight: 600 }}>{exactOrCompact(totals.lastMonth)}</span>
          in 30 days
        </span>
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

  const card = (

      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: square ? 72 : 64,
          paddingBottom: WAVE_ROWS * WAVE_PITCH + (square ? 40 : 28),
          position: "relative",
          background: C.bg,
          color: C.ink,
          fontFamily: "Google Sans Flex",
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
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                flexShrink: 0,
                padding: compactBadge ? 0 : "8px 16px 8px 8px",
                borderRadius: 14,
                border: compactBadge ? "none" : `2px solid ${C.line}`,
                background: compactBadge ? "transparent" : C.surface,
                fontSize: 22,
                fontWeight: 600,
                color: C.ink2,
              }}
            >
              <svg width={compactBadge ? 52 : 40} height={compactBadge ? 52 : 40} viewBox="0 0 24 24">
                <path d={NPM_MARK} fill="#cb3837" />
              </svg>
              {!compactBadge && "npm package"}
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
            Generated {formatDay(toDay(new Date()))} · npm data through {formatDay(report.lastDay)}
          </span>
          <span style={{ color: C.accent, fontWeight: 800 }}>shipstat</span>
        </div>

        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, display: "flex" }}>
          <PixelWaves width={width} />
        </div>
      </div>
  );

  // Render fully before responding. If a font trips up the renderer, fall back to its built-in font
  // rather than sending a broken image.
  let png: ArrayBuffer;
  try {
    png = await new ImageResponse(card, { width, height, fonts: fonts.length ? fonts : undefined }).arrayBuffer();
  } catch (e) {
    console.error("card render failed with custom fonts, retrying with the default font", e);
    png = await new ImageResponse(card, { width, height }).arrayBuffer();
  }

  const headers = new Headers({ "content-type": "image/png" });
  // Browsers always revalidate (so a new card design shows up at once); the CDN keeps it for 6 hours.
  headers.set("cache-control", "public, max-age=0, s-maxage=21600, stale-while-revalidate=86400");
  if (search.get("download")) {
    const file = meta.name.replace(/^@/, "").replace(/\//g, "-");
    headers.set("content-disposition", `attachment; filename="${file}-shipstat${square ? "-square" : ""}.png"`);
  }
  return new Response(png, { status: 200, headers });
}
