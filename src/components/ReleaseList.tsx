import { diffDays, formatAgo, formatDay, toDay } from "@/lib/dates";
import type { Release } from "@/lib/npm";

const SHOWN = 8;

export function ReleaseList({ releases }: { releases: Release[] }) {
  const today = toDay(new Date());
  const stable = releases.filter((r) => !r.prerelease).reverse();
  const list = (stable.length ? stable : releases.slice().reverse()).slice(0, SHOWN);
  const prereleases = releases.length - stable.length;

  return (
    <div>
      <ul className="divide-y divide-line">
        {list.map((r) => (
          <li key={r.version} className="flex items-baseline justify-between gap-4 py-2 text-sm">
            <span className="truncate font-mono text-[13px] text-ink">{r.version}</span>
            <span className="shrink-0 text-ink-2" title={formatDay(r.date)}>
              {formatAgo(diffDays(r.date, today))}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted">
        {releases.length} {releases.length === 1 ? "version" : "versions"} published
        {prereleases > 0 && stable.length > 0 ? `, ${prereleases} of them pre-releases` : ""}.
      </p>
    </div>
  );
}
