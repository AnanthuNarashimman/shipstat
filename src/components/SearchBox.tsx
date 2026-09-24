"use client";

import { SearchResults } from "./SearchResults";
import { usePackageSearch } from "./usePackageSearch";

export function SearchBox({ size = "lg", autoFocus = false }: { size?: "lg" | "sm"; autoFocus?: boolean }) {
  const { boxRef, listId, hits, active, setActive, visible, go, inputProps } = usePackageSearch();
  const large = size === "lg";

  return (
    <div ref={boxRef} className="relative w-full">
      <div
        className={`flex items-center gap-3 rounded-xl border border-line bg-surface transition-colors focus-within:border-accent ${
          large ? "px-5 py-4" : "px-3.5 py-2"
        }`}
      >
        <svg aria-hidden viewBox="0 0 20 20" className={`shrink-0 text-muted ${large ? "size-5" : "size-4"}`}>
          <circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path d="m13 13 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <input
          {...inputProps}
          autoFocus={autoFocus}
          placeholder="Package name, e.g. react or @scope/name"
          className={`w-full bg-transparent text-ink outline-none focus-visible:outline-none placeholder:text-muted ${large ? "text-lg" : "text-sm"}`}
        />
      </div>
      {visible && <SearchResults listId={listId} hits={hits} active={active} setActive={setActive} go={go} />}
    </div>
  );
}
