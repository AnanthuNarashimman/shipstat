const full = new Intl.NumberFormat("en-US");

export function formatFull(n: number): string {
  return full.format(n);
}

// 983 · 12.9K · 5.26M · 1.2B
export function formatCompact(n: number): string {
  const abs = Math.abs(n);
  if (abs < 1_000) return full.format(n);
  const units: [number, string][] = [
    [1e9, "B"],
    [1e6, "M"],
    [1e3, "K"],
  ];
  for (const [size, suffix] of units) {
    if (abs >= size) {
      const v = n / size;
      const digits = Math.abs(v) >= 100 ? 0 : Math.abs(v) >= 10 ? 1 : 2;
      return `${stripZeros(v.toFixed(digits))}${suffix}`;
    }
  }
  return full.format(n);
}

function stripZeros(s: string): string {
  return s.includes(".") ? s.replace(/\.?0+$/, "") : s;
}

export function formatPct(p: number): string {
  const v = Math.abs(p) < 10 ? Math.round(p * 10) / 10 : Math.round(p);
  return `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v)}%`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${stripZeros((bytes / 1024).toFixed(1))} kB`;
  return `${stripZeros((bytes / 1024 / 1024).toFixed(1))} MB`;
}
