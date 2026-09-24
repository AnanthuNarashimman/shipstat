"use client";

import { SearchResults } from "./SearchResults";
import { Spinner } from "./Spinner";
import { usePackageSearch } from "./usePackageSearch";

export function SearchBox({ size = "lg", autoFocus = false }: { size?: "lg" | "sm"; autoFocus?: boolean }) {
  const { boxRef, listId, query, hits, active, setActive, visible, go, pending, inputProps, formProps } =
    usePackageSearch();
  const large = size === "lg";

  return (
    <div ref={boxRef} className="relative w-full min-w-0">
      {/* A form, so a phone keyboard's Go key submits; the arrow button gives touch users something to tap */}
      <form
        {...formProps}
        className={`flex items-center gap-3 rounded-xl border border-line bg-surface transition-colors focus-within:border-accent ${
          large ? "py-2.5 pr-2.5 pl-5" : "py-1 pr-1 pl-3.5"
        }`}
      >
        <svg aria-hidden viewBox="0 0 20 20" className={`shrink-0 text-muted ${large ? "size-5" : "size-4"}`}>
          <circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path d="m13 13 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <input
          {...inputProps}
          aria-busy={pending}
          autoFocus={autoFocus}
          placeholder={large ? "Package name, e.g. react or @scope/name" : "Search packages"}
          className={`w-0 min-w-0 flex-1 bg-transparent text-ink outline-none focus-visible:outline-none placeholder:text-muted ${large ? "text-lg" : "text-sm"}`}
        />
        <button
          type="submit"
          aria-label={pending ? "Loading stats" : "Show stats"}
          aria-busy={pending}
          disabled={pending || !query.trim()}
          className={`btn-cta flex shrink-0 items-center justify-center rounded-lg transition-opacity disabled:opacity-40 aria-busy:opacity-100 ${
            large ? "size-11" : "size-8"
          }`}
        >
          {/* The arrow turns into a spinner while the search is on its way */}
          {pending ? (
            <Spinner className={large ? "size-5" : "size-4"} />
          ) : (
            <svg aria-hidden viewBox="0 0 20 20" className={large ? "size-5" : "size-4"}>
              <path d="M4 10h12m-5-5 5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
      </form>
      {visible && <SearchResults listId={listId} hits={hits} active={active} setActive={setActive} go={go} />}
    </div>
  );
}
