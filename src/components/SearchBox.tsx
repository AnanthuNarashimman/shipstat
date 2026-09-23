"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { formatCompact } from "@/lib/format";
import { packagePath } from "@/lib/site";

type Hit = { name: string; version: string; description: string | null; weekly: number | null };

export function SearchBox({ size = "lg", autoFocus = false }: { size?: "lg" | "sm"; autoFocus?: boolean }) {
  const router = useRouter();
  const listId = useId();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [active, setActive] = useState(-1);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: controller.signal });
        const data = (await res.json()) as { results: Hit[] };
        setHits(data.results);
        setActive(-1);
      } catch {
        // Aborted or offline; keep whatever is showing.
      }
    }, 160);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    const close = (e: PointerEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  const visible = open && query.trim().length >= 2 && hits.length > 0;

  function go(name: string) {
    const clean = name.trim().replace(/^https?:\/\/(www\.)?npmjs\.com\/package\//, "");
    if (!clean) return;
    setOpen(false);
    router.push(packagePath(clean));
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" && visible) {
      e.preventDefault();
      setActive((i) => (i + 1) % hits.length);
    } else if (e.key === "ArrowUp" && visible) {
      e.preventDefault();
      setActive((i) => (i <= 0 ? hits.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(visible && active >= 0 ? hits[active].name : query);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

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
          role="combobox"
          aria-label="Search npm packages"
          aria-expanded={visible}
          aria-controls={listId}
          aria-activedescendant={visible && active >= 0 ? `${listId}-${active}` : undefined}
          autoFocus={autoFocus}
          autoComplete="off"
          spellCheck={false}
          value={query}
          placeholder="Package name, e.g. react or @scope/name"
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className={`w-full bg-transparent text-ink outline-none focus-visible:outline-none placeholder:text-muted ${large ? "text-lg" : "text-sm"}`}
        />
      </div>

      {visible && (
        <ul
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-[0_12px_32px_-12px_rgb(0_0_0/0.18)]"
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
      )}
    </div>
  );
}
