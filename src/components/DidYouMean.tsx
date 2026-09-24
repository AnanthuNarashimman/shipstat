"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { formatCompact } from "@/lib/format";
import { packagePath } from "@/lib/site";

import type { Hit } from "./usePackageSearch";

// On the not-found page: take the name from the URL and suggest close matches from npm search.
export function DidYouMean() {
  const pathname = usePathname();
  const typed = decodeURIComponent(pathname.replace(/^\//, "")).trim();
  const [hits, setHits] = useState<Hit[] | null>(null);

  useEffect(() => {
    if (typed.length < 2) return;
    const controller = new AbortController();
    fetch(`/api/search?q=${encodeURIComponent(typed)}`, { signal: controller.signal })
      .then((r) => r.json() as Promise<{ results: Hit[] }>)
      .then((d) => setHits(d.results.slice(0, 5)))
      .catch(() => setHits([]));
    return () => controller.abort();
  }, [typed]);

  if (typed.length < 2 || !hits?.length) return null;

  return (
    <div className="mt-10">
      <p className="text-sm text-muted">
        Did you mean <span className="text-ink-2">one of these</span>?
      </p>
      <ul className="mt-3 divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
        {hits.map((hit) => (
          <li key={hit.name}>
            <Link
              href={packagePath(hit.name)}
              className="flex items-baseline justify-between gap-4 px-4 py-3 transition-colors hover:bg-sunken"
            >
              <span className="min-w-0">
                <span className="block truncate font-medium text-ink">{hit.name}</span>
                {hit.description && <span className="block truncate text-xs text-muted">{hit.description}</span>}
              </span>
              {hit.weekly !== null && (
                <span className="shrink-0 text-xs tabular-nums text-ink-2">{formatCompact(hit.weekly)}/wk</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
