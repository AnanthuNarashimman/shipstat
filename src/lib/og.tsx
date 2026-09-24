// Shared pieces for generated images (share cards, link previews): palette, fonts, the pixel-wave strip.

// Light-theme palette; generated images always use the light look.
export const OG = {
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
export const NPM_MARK =
  "M1.763 0C.786 0 0 .786 0 1.763v20.474C0 23.214.786 24 1.763 24h20.474c.977 0 1.763-.786 1.763-1.763V1.763C24 .786 23.214 0 22.237 0zM5.13 5.323l13.837.019-.009 13.836h-3.464l.01-10.382h-3.456L12.04 19.17H5.113z";

// The hero's pixel-wave palette (light theme), bottom to crest: red → orange → yellow.
const WAVE_SOFT = ["#ffc1b6", "#ffd2a8", "#ffe6a0"];
const WAVE_STRONG = ["#ff7a66", "#ff9a3d", "#ffc83d"];
const WAVE_CELL = 12;
export const WAVE_PITCH = 15;

function hash(x: number, y: number, seed: number): number {
  const v = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453;
  return v - Math.floor(v);
}

// A still frame of the hero waves: same shape, dithered crest and colour bands.
export function OgPixelWaves({ width, rows = 5, phase = 0 }: { width: number; rows?: number; phase?: number }) {
  const cols = Math.ceil(width / WAVE_PITCH);
  const height = rows * WAVE_PITCH;
  const cells: { x: number; y: number; fill: string }[] = [];
  for (let i = 0; i < cols; i++) {
    const k = i + phase;
    const wave = 0.46 + 0.2 * Math.sin(k * 0.11) + 0.12 * Math.sin(k * 0.043 + 1.3) + 0.06 * Math.sin(k * 0.31);
    const h = wave * rows;
    const full = Math.floor(h);
    for (let j = 0; j <= full; j++) {
      if (j === full && hash(k, j, 1) > h - full) continue;
      const depth = j / Math.max(1, h);
      const band = depth < 0.34 ? 0 : depth < 0.72 ? 1 : 2;
      const strong = hash(k, j, 8) < 0.06 + depth * 0.1;
      cells.push({
        x: i * WAVE_PITCH,
        y: height - (j + 1) * WAVE_PITCH + (WAVE_PITCH - WAVE_CELL),
        fill: strong ? WAVE_STRONG[band] : WAVE_SOFT[band],
      });
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
      await fetch(`https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}:wght@${weight}`, {
        cache: "force-cache",
      })
    ).text();
    const url = css.match(/src: url\((.+?)\) format\('(?:truetype|opentype)'\)/)?.[1];
    if (!url) return null;
    return await (await fetch(url, { cache: "force-cache" })).arrayBuffer();
  } catch {
    return null;
  }
}

export const OG_FONT = "Google Sans Flex";

// The static Google Sans files use a font feature the image renderer can't parse; Flex renders fine.
// Returns whatever loaded; an empty list means the renderer's built-in font is used.
export async function loadOgFonts() {
  const [regular, semibold, bold] = await Promise.all([
    loadFont(OG_FONT, 400),
    loadFont(OG_FONT, 600),
    loadFont(OG_FONT, 800),
  ]);
  return [
    ...(regular ? [{ name: OG_FONT, data: regular, weight: 400 as const, style: "normal" as const }] : []),
    ...(semibold ? [{ name: OG_FONT, data: semibold, weight: 600 as const, style: "normal" as const }] : []),
    ...(bold ? [{ name: OG_FONT, data: bold, weight: 800 as const, style: "normal" as const }] : []),
  ];
}
