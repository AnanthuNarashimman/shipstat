"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition } from "react";

import { packagePath } from "@/lib/site";

export type Hit = { name: string; version: string; description: string | null; weekly: number | null };

// Autocomplete state and keyboard handling shared by every package search input.
export function usePackageSearch(hash = "") {
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

  // `pending` stays true from the moment a search is sent until the next page starts rendering,
  // so inputs can show a loader while the request is in flight.
  const [pending, startTransition] = useTransition();

  function go(name: string) {
    const clean = name.trim().replace(/^https?:\/\/(www\.)?npmjs\.com\/package\//, "");
    if (!clean || pending) return;
    setOpen(false);
    startTransition(() => router.push(packagePath(clean) + hash));
  }

  const submit = () => go(visible && active >= 0 ? hits[active].name : query);

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" && visible) {
      e.preventDefault();
      setActive((i) => (i + 1) % hits.length);
    } else if (e.key === "ArrowUp" && visible) {
      e.preventDefault();
      setActive((i) => (i <= 0 ? hits.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      if (e.nativeEvent.isComposing) return; // still composing with a mobile/IME keyboard
      e.preventDefault();
      submit();
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const inputProps = {
    role: "combobox" as const,
    "aria-label": "Search npm packages",
    "aria-expanded": visible,
    "aria-controls": listId,
    "aria-activedescendant": visible && active >= 0 ? `${listId}-${active}` : undefined,
    autoComplete: "off",
    spellCheck: false,
    // Phone keyboards: no auto-capitals or autocorrect on package names, and a "Go" key.
    autoCapitalize: "none",
    autoCorrect: "off",
    enterKeyHint: "go" as const,
    value: query,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(e.target.value);
      setOpen(true);
    },
    onFocus: () => setOpen(true),
    onKeyDown,
  };

  // Wrap inputs in a <form {...formProps}>: some mobile keyboards never send an Enter keydown, but their
  // Go/Search key always submits the form.
  const formProps = {
    role: "search" as const,
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      submit();
    },
  };

  return { boxRef, listId, query, hits, active, setActive, visible, go, submit, pending, inputProps, formProps };
}
