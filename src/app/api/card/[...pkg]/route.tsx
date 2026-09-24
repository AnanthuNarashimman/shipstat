import { ImageResponse } from "next/og";

import { formatDay, toDay } from "@/lib/dates";
import { formatCompact, formatFull } from "@/lib/format";
import { isValidPackageName } from "@/lib/npm";
import { makerOf } from "@/lib/people";
import { NPM_MARK, OG, OG_FONT, OgPixelWaves, WAVE_PITCH, loadOgFonts } from "@/lib/og";
import { getReport } from "@/lib/report";

const C = OG;

// Rows in the pixel-wave strip along the bottom of the card.
const WAVE_ROWS = 5;

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

// The maker's GitHub avatar as a data URL, or null if GitHub is slow or has none. Cached for a day.
async function loadAvatar(url: string | null): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(2500), next: { revalidate: 86400 } });
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || !/^image\/(png|jpeg)/.test(type)) return null;
    return `data:${type.split(";")[0]};base64,${Buffer.from(await res.arrayBuffer()).toString("base64")}`;
  } catch {
    return null;
  }
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
  const sparkH = square ? 240 : 140;
  const path = spark ? sparkPath(spark, sparkW, sparkH) : null;

  const maker = makerOf(meta.people);
  const [fonts, avatar] = await Promise.all([loadOgFonts(), loadAvatar(maker?.avatar ?? null)]);

  const nameSize = meta.name.length > 28 ? 44 : meta.name.length > 18 ? 54 : 64;
  // Long names leave no room for the labelled badge, so it shrinks to the mark alone.
  const compactBadge = meta.name.length + meta.version.length > (square ? 16 : 26);
  // Exact counts are the point for small packages; past a million, compact reads better and fits.
  const exactOrCompact = (n: number) => (n >= 1_000_000 ? formatCompact(n) : formatFull(n));
  const total = exactOrCompact(totals.allTime);
  const weekly = exactOrCompact(totals.lastWeek);
  const totalSize = square ? 156 : total.length > 6 ? 96 : 112;

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
          fontFamily: OG_FONT,
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
          {maker && (
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 14, fontSize: 24, color: C.ink2 }}>
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element -- rendered by the image generator, not the browser
                <img src={avatar} alt="" width={40} height={40} style={{ borderRadius: 999, border: `2px solid ${C.line}` }} />
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 40,
                    height: 40,
                    borderRadius: 999,
                    background: "#fff1c2",
                    color: C.ink,
                    fontWeight: 700,
                  }}
                >
                  {maker.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span style={{ display: "flex", gap: 7 }}>
                by <span style={{ color: C.ink, fontWeight: 600 }}>{truncate(maker.name, 36)}</span>
              </span>
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
          <OgPixelWaves width={width} rows={WAVE_ROWS} />
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
