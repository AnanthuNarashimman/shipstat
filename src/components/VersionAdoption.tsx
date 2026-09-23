import { formatCompact } from "@/lib/format";
import type { Report } from "@/lib/report";

export function VersionAdoption({ versions, latest }: { versions: Report["versions"]; latest: string }) {
  if (versions.rows.length === 0) {
    return <p className="text-sm text-muted">No downloads in the last 7 days.</p>;
  }
  const max = Math.max(...versions.rows.map((r) => r.share));
  return (
    <ul className="space-y-3">
      {versions.rows.map((row) => (
        <li key={row.version} className="grid grid-cols-[5.5rem_1fr_5.5rem] items-center gap-3 text-sm sm:grid-cols-[7rem_1fr_6rem]">
          <span className="flex items-center gap-1.5 truncate text-ink-2" title={row.version}>
            <span className="truncate">{row.version === "other" ? "Other" : row.version}</span>
            {row.version === latest && (
              <span className="rounded bg-accent-wash px-1 text-[10px] font-medium uppercase tracking-wide text-accent">
                latest
              </span>
            )}
          </span>
          <span className="h-2.5 rounded-sm bg-sunken">
            <span
              className="block h-full rounded-r-[4px] bg-accent"
              style={{ width: `${Math.max(1, (row.share / max) * 100)}%`, opacity: row.version === "other" ? 0.45 : 1 }}
            />
          </span>
          <span className="text-right tabular-nums">
            <span className="text-ink">{Math.round(row.share * 1000) / 10}%</span>
            <span className="ml-1.5 text-xs text-muted">{formatCompact(row.downloads)}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
