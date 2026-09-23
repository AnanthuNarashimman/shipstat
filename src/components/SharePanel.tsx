"use client";

import { useState } from "react";

// cardUrl is absolute (for pasting elsewhere); cardPath is same-origin (for this page's own image and downloads).
type Props = { pageUrl: string; cardUrl: string; cardPath: string; name: string };

export function SharePanel({ pageUrl, cardUrl, cardPath, name }: Props) {
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(what: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setTimeout(() => setCopied((c) => (c === what ? null : c)), 1600);
    } catch {
      // Clipboard blocked; the URL is still visible in the address bar.
    }
  }

  const markdown = `[![${name} on shipstat](${cardUrl})](${pageUrl})`;
  const button =
    "rounded-lg border border-line bg-surface px-3.5 py-2 text-sm text-ink-2 transition-colors hover:border-ink-2 hover:text-ink";

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] md:items-center">
      {/* eslint-disable-next-line @next/next/no-img-element -- generated PNG, already sized */}
      <img
        src={cardPath}
        alt={`Share card for ${name}`}
        width={1200}
        height={630}
        className="h-auto w-full rounded-xl border border-line"
      />
      <div className="flex flex-col gap-3">
        <p className="text-sm text-ink-2">
          This card appears automatically when you paste the link on X, LinkedIn, Slack or Discord.
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={button} onClick={() => copy("link", pageUrl)}>
            {copied === "link" ? "Copied" : "Copy link"}
          </button>
          <a className={button} href={`${cardPath}?download=1`} download>
            Download card
          </a>
          <a className={button} href={`${cardPath}?format=square&download=1`} download>
            Square
          </a>
          <button type="button" className={button} onClick={() => copy("md", markdown)}>
            {copied === "md" ? "Copied" : "Copy for README"}
          </button>
        </div>
      </div>
    </div>
  );
}
