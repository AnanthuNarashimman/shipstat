"use client";

import { useEffect, useRef, useState } from "react";

import { SearchResults } from "../SearchResults";
import { Spinner } from "../Spinner";
import { usePackageSearch } from "../usePackageSearch";

// Where the search lands on the package page.
const TABS = [
  { key: "downloads", label: "Downloads", icon: "M3 13h2v4H3zM8 9h2v8H8zM13 5h2v12h-2z" },
  { key: "versions", label: "Versions", icon: "M3 5h14M3 10h9M3 15h5" },
  { key: "releases", label: "Releases", icon: "M10 3v14M10 5l5 2.5-5 2.5" },
  { key: "share", label: "Share card", icon: "M4 4h12v10H4zM7 17h6" },
] as const;

const EXAMPLES = ["tracetel", "react", "zod", "@tanstack/react-query", "hono", "vite"];

// Types out example package names while the field is empty.
function useTypedPlaceholder(active: boolean) {
  const [text, setText] = useState(EXAMPLES[0]);
  useEffect(() => {
    if (!active || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let word = 0;
    let len = 0;
    let deleting = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const target = EXAMPLES[word];
      if (!deleting) {
        len++;
        setText(target.slice(0, len));
        if (len === target.length) {
          deleting = true;
          timer = setTimeout(tick, 1600);
          return;
        }
      } else {
        len--;
        setText(target.slice(0, len));
        if (len === 0) {
          deleting = false;
          word = (word + 1) % EXAMPLES.length;
        }
      }
      timer = setTimeout(tick, deleting ? 35 : 75);
    };
    timer = setTimeout(tick, 400);
    return () => clearTimeout(timer);
  }, [active]);
  return text;
}

export function HeroSearch() {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("downloads");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { boxRef, listId, query, hits, active, setActive, visible, go, pending, inputProps, formProps } = usePackageSearch(
    tab === "downloads" ? "" : `#${tab}`,
  );
  const placeholder = useTypedPlaceholder(!focused && query === "");

  // "Look up a package" in the hero focuses this field.
  useEffect(() => {
    const focus = () => inputRef.current?.focus();
    window.addEventListener("shipstat:focus-search", focus);
    return () => window.removeEventListener("shipstat:focus-search", focus);
  }, []);

  return (
    <div ref={boxRef} className="relative w-full text-left">
      {/* A form, so a phone keyboard's Go key submits even when it never sends an Enter keydown */}
      <form {...formProps} className="rounded-2xl border border-line bg-surface transition-colors focus-within:border-accent/50">
        <label className="flex items-center gap-3 px-5 pt-5 pb-4 sm:px-6">
          <svg aria-hidden viewBox="0 0 20 20" className="size-5 shrink-0 text-muted">
            <path
              d="M10 2.5 16.5 6v8L10 17.5 3.5 14V6zM3.5 6 10 9.5 16.5 6M10 9.5v8"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
          </svg>
          <input
            ref={inputRef}
            {...inputProps}
            onFocus={() => {
              setFocused(true);
              inputProps.onFocus();
            }}
            onBlur={() => setFocused(false)}
            placeholder={focused ? "Package name or npmjs.com link" : placeholder}
            className="w-full bg-transparent text-lg text-ink outline-none placeholder:text-muted focus-visible:outline-none"
          />
        </label>

        <div className="flex items-center justify-between gap-3 border-t border-line px-3 py-3 sm:px-4">
          <div
            role="radiogroup"
            aria-label="Open the package at"
            className="flex min-w-0 gap-0.5 overflow-x-auto rounded-xl bg-sunken p-1 [scrollbar-width:none]"
          >
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                role="radio"
                aria-checked={tab === t.key}
                onClick={() => setTab(t.key)}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm transition-all sm:px-3 ${
                  tab === t.key
                    ? "bg-surface text-ink"
                    : "text-muted hover:text-ink-2"
                }`}
              >
                <svg aria-hidden viewBox="0 0 20 20" className={`hidden size-3.5 sm:block ${tab === t.key ? "text-accent" : ""}`}>
                  <path d={t.icon} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                {t.label}
              </button>
            ))}
          </div>
          <button
            type="submit"
            aria-label={pending ? "Loading stats" : "Show stats"}
            aria-busy={pending}
            disabled={pending}
            onClick={(e) => {
              // Nothing typed yet: put the cursor in the box instead of submitting.
              if (!query.trim()) {
                e.preventDefault();
                inputRef.current?.focus();
              }
            }}
            className="flex h-10 w-12 shrink-0 items-center justify-center btn-cta rounded-xl disabled:cursor-progress"
          >
            {/* The arrow turns into a spinner while the search is on its way */}
            {pending ? (
              <Spinner className="size-5" />
            ) : (
              <svg aria-hidden viewBox="0 0 20 20" className="size-5">
                <path d="M4 10h12m-5-5 5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        </div>
      </form>
      {visible && <SearchResults listId={listId} hits={hits} active={active} setActive={setActive} go={go} />}
    </div>
  );
}

export function FocusSearchButton({ children, className }: { children: React.ReactNode; className: string }) {
  return (
    <button type="button" className={className} onClick={() => window.dispatchEvent(new Event("shipstat:focus-search"))}>
      {children}
    </button>
  );
}
