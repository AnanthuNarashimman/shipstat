"use client";

import { useRef, useState } from "react";

// cardUrl is absolute (for pasting elsewhere); the rest are same-origin paths for this page's image and downloads.
type Props = {
  pageUrl: string;
  cardUrl: string;
  previewSrc: string;
  downloadWide: string;
  downloadSquare: string;
  name: string;
};

export function SharePanel({ pageUrl, cardUrl, previewSrc, downloadWide, downloadSquare, name }: Props) {
  const [copied, setCopied] = useState<string | null>(null);
  const tiltRef = useRef<HTMLDivElement>(null);

  async function copy(what: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setTimeout(() => setCopied((c) => (c === what ? null : c)), 1600);
    } catch {
      // Clipboard blocked; the URL is still visible in the address bar.
    }
  }

  // The card leans toward the pointer, like it's being picked up.
  function onMove(e: React.PointerEvent) {
    const el = tiltRef.current;
    if (!el || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--rx", `${(-y * 7).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${(x * 9).toFixed(2)}deg`);
  }
  function onLeave() {
    tiltRef.current?.style.removeProperty("--rx");
    tiltRef.current?.style.removeProperty("--ry");
  }

  const markdown = `[![${name} on shipstat](${cardUrl})](${pageUrl})`;
  const secondary =
    "inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:border-accent hover:text-accent";

  // minmax(0, …) columns: a long README line must scroll inside its box, never widen the layout on phones.
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:items-center">
      <div className="min-w-0 [perspective:1100px]" onPointerMove={onMove} onPointerLeave={onLeave}>
        <div
          ref={tiltRef}
          className="transition-transform duration-300 ease-out motion-reduce:transition-none"
          style={{ transform: "rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- generated PNG, already sized */}
          <img
            src={previewSrc}
            alt={`Share card for ${name}`}
            width={1200}
            height={630}
            className="h-auto w-full rounded-xl border border-line"
          />
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-5">
        <div className="flex flex-wrap gap-2">
          <a className="btn-cta inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold" href={downloadWide} download>
            <svg viewBox="0 0 20 20" aria-hidden className="size-4">
              <path d="M10 3v10m0 0-4-4m4 4 4-4M4 16h12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Download card
          </a>
          <a className={secondary} href={downloadSquare} download>
            Square version
          </a>
          <button type="button" className={secondary} onClick={() => copy("link", pageUrl)}>
            {copied === "link" ? "Link copied" : "Copy link"}
          </button>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-muted">Add it to your README</span>
            <button
              type="button"
              onClick={() => copy("md", markdown)}
              className="text-xs font-medium text-accent transition-opacity hover:opacity-80"
            >
              {copied === "md" ? "Copied" : "Copy"}
            </button>
          </div>
          <pre className="mt-2 max-w-full overflow-x-auto rounded-xl border border-line bg-sunken px-3.5 py-3 font-mono text-xs leading-relaxed text-ink-2">
            {markdown}
          </pre>
        </div>

        <p className="text-sm leading-relaxed text-ink-2">
          Paste your link on X, LinkedIn, Slack or Discord and this card shows up by itself. It refreshes every few
          hours and carries the date it was generated.
        </p>
      </div>
    </div>
  );
}
