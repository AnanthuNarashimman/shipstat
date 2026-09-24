"use client";

import { formatCompact } from "@/lib/format";

import type { Hit } from "./usePackageSearch";

type Props = {
  listId: string;
  hits: Hit[];
  active: number;
  setActive: (i: number) => void;
  go: (name: string) => void;
};

export function SearchResults({ listId, hits, active, setActive, go }: Props) {
  return (
    <ul
      id={listId}
      role="listbox"
      className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-line bg-surface py-1 text-left"
    >
      {hits.map((hit, i) => (
        <li
          key={hit.name}
          id={`${listId}-${i}`}
          role="option"
          aria-selected={i === active}
          onPointerDown={(e) => {
            e.preventDefault();
            go(hit.name);
          }}
          onPointerEnter={() => setActive(i)}
          className={`flex cursor-pointer items-baseline justify-between gap-4 px-4 py-2.5 ${
            i === active ? "bg-sunken" : ""
          }`}
        >
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-ink">{hit.name}</div>
            {hit.description && <div className="truncate text-xs text-muted">{hit.description}</div>}
          </div>
          {hit.weekly !== null && (
            <div className="shrink-0 text-xs tabular-nums text-ink-2">{formatCompact(hit.weekly)}/wk</div>
          )}
        </li>
      ))}
    </ul>
  );
}
