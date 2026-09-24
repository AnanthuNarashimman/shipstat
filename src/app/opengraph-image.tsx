import { ImageResponse } from "next/og";

import { OG, OG_FONT, OgPixelWaves, WAVE_PITCH, loadOgFonts } from "@/lib/og";
import { siteUrl } from "@/lib/site";

// Link preview for the site itself (home page and any page without its own image).
// Package pages use their own share card instead.
export const alt = "shipstat: see how your npm package is really shipping";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const WAVE_ROWS = 6;

// Rising bars, the logo's idea at poster size.
const BARS = [
  { h: 150, color: "#ffc1b6" },
  { h: 210, color: "#ffd2a8" },
  { h: 180, color: "#ffe6a0" },
  { h: 270, color: "#ff9a3d" },
  { h: 340, color: "#e8590c" },
];

export default async function Image() {
  const fonts = await loadOgFonts();
  const host = new URL(siteUrl).host;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: OG.bg,
          color: OG.ink,
          fontFamily: OG_FONT,
          padding: "64px 72px",
          paddingBottom: WAVE_ROWS * WAVE_PITCH + 40,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
          {/* Logo + wordmark, address on the right */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: 6,
                  width: 64,
                  height: 64,
                  padding: "15px 13px",
                  borderRadius: 16,
                  background: OG.ink,
                }}
              >
                <div style={{ width: 10, height: 16, borderRadius: 3, background: "#fffaf5", opacity: 0.55 }} />
                <div style={{ width: 10, height: 25, borderRadius: 3, background: "#fffaf5", opacity: 0.85 }} />
                <div style={{ width: 10, height: 34, borderRadius: 3, background: "#ff8a3d" }} />
              </div>
              <span style={{ fontSize: 44, fontWeight: 800, letterSpacing: -1.5 }}>shipstat</span>
            </div>
            <span style={{ display: "flex", fontSize: 24, color: OG.muted }}>{host}</span>
          </div>

          {/* Headline, kept clear of the bars on the right */}
          <div style={{ display: "flex", flexDirection: "column", maxWidth: 820 }}>
            <div style={{ display: "flex", fontSize: 76, fontWeight: 800, letterSpacing: -3, lineHeight: 1.02 }}>
              See how your package
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 76,
                fontWeight: 800,
                letterSpacing: -3,
                lineHeight: 1.08,
                alignSelf: "flex-start", // gradient spans the words, not the whole row
                backgroundImage: `linear-gradient(90deg, ${OG.red}, ${OG.accent})`,
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              is really shipping
            </div>
            <div style={{ display: "flex", marginTop: 22, maxWidth: 640, fontSize: 30, lineHeight: 1.35, color: OG.ink2 }}>
              Honest download stats for any npm package. Nothing estimated.
            </div>
          </div>
        </div>

        {/* Rising bars on the right */}
        <div
          style={{
            position: "absolute",
            right: 72,
            bottom: WAVE_ROWS * WAVE_PITCH + 24,
            display: "flex",
            alignItems: "flex-end",
            gap: 14,
          }}
        >
          {BARS.map((b, i) => (
            <div key={i} style={{ width: 34, height: b.h, borderRadius: 10, background: b.color }} />
          ))}
        </div>

        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, display: "flex" }}>
          <OgPixelWaves width={size.width} rows={WAVE_ROWS} phase={23} />
        </div>
      </div>
    ),
    { ...size, fonts: fonts.length ? fonts : undefined },
  );
}
