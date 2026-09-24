// Stable pseudo-random value per cell (same idea as the hero canvas).
function hash(x: number, y: number, seed: number): number {
  const v = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453;
  return v - Math.floor(v);
}

/**
 * A still frame of the hero's pixel waves: same wave shape, dithered crest and red → orange → yellow bands.
 * Rendered on the server as plain SVG and coloured with the theme's --wave-* tokens.
 * `phase` shifts the wave sideways so two skylines on one page don't look identical.
 */
export function PixelSkyline({ className = "", rows = 7, phase = 0 }: { className?: string; rows?: number; phase?: number }) {
  const cols = 160;
  const size = 10;
  const pitch = 12;
  const rects: { x: number; y: number; fill: string }[] = [];
  for (let i = 0; i < cols; i++) {
    const k = i + phase;
    const wave = 0.46 + 0.2 * Math.sin(k * 0.11) + 0.12 * Math.sin(k * 0.043 + 1.3) + 0.06 * Math.sin(k * 0.31);
    const h = wave * rows;
    const full = Math.floor(h);
    for (let j = 0; j <= full; j++) {
      if (j === full && hash(k, j, 1) > h - full) continue;
      const depth = j / Math.max(1, h);
      const band = depth < 0.34 ? "red" : depth < 0.72 ? "orange" : "yellow";
      const strong = hash(k, j, 8) < 0.06 + depth * 0.1;
      rects.push({ x: i * pitch, y: (rows - 1 - j) * pitch, fill: `var(--wave-${band}${strong ? "-strong" : ""})` });
    }
  }
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${cols * pitch - (pitch - size)} ${rows * pitch - (pitch - size)}`}
      preserveAspectRatio="xMidYMax slice"
      className={className}
    >
      {rects.map((r) => (
        <rect key={`${r.x}-${r.y}`} x={r.x} y={r.y} width={size} height={size} style={{ fill: r.fill }} />
      ))}
    </svg>
  );
}
