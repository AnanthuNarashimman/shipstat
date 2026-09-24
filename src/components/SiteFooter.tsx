import Link from "next/link";

import { LogoMark } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

const REPO = "https://github.com/AnanthuNarashimman/shipstat";

const COLUMNS: { title: string; links: { label: string; href: string; external?: boolean }[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Look up a package", href: "/" },
      { label: "Live example", href: "/zod" },
      { label: "Features", href: "/#features" },
      { label: "Share cards", href: "/#cards" },
    ],
  },
  {
    title: "Data",
    links: [
      { label: "Where it comes from", href: "/#data" },
      { label: "npm downloads API", href: "https://github.com/npm/registry/blob/main/docs/download-counts.md", external: true },
      { label: "npm registry", href: "https://registry.npmjs.org", external: true },
    ],
  },
  {
    title: "Project",
    links: [
      { label: "GitHub", href: REPO, external: true },
      { label: "Report an issue", href: `${REPO}/issues`, external: true },
    ],
  },
];

// A skyline of square pixels in the wave colours, generated once on the server.
function PixelSkyline() {
  const cols = 120;
  const size = 10;
  const gap = 2;
  const pitch = size + gap;
  const maxRows = 5;
  const rects: { x: number; y: number; fill: string }[] = [];
  for (let i = 0; i < cols; i++) {
    const h = Math.max(
      1,
      Math.round(2.6 + 1.5 * Math.sin(i * 0.19) + 0.9 * Math.sin(i * 0.53 + 1.7) + 0.5 * Math.sin(i * 1.3)),
    );
    for (let j = 0; j < Math.min(h, maxRows); j++) {
      const top = j === h - 1;
      const band = j === 0 ? "red" : top ? "yellow" : "orange";
      const strong = (i * 7 + j * 13) % 11 === 0;
      rects.push({ x: i * pitch, y: (maxRows - 1 - j) * pitch, fill: `var(--wave-${band}${strong ? "-strong" : ""})` });
    }
  }
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${cols * pitch - gap} ${maxRows * pitch - gap}`}
      preserveAspectRatio="xMidYMax slice"
      className="block h-[60px] w-full"
    >
      {rects.map((r) => (
        <rect key={`${r.x}-${r.y}`} x={r.x} y={r.y} width={size} height={size} style={{ fill: r.fill }} />
      ))}
    </svg>
  );
}

export function SiteFooter() {
  return (
    <footer className="relative mt-10 overflow-hidden border-t border-line bg-surface">
      <PixelSkyline />

      <div className="mx-auto grid max-w-6xl gap-12 px-5 pt-14 pb-10 sm:px-8 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Link href="/" className="flex items-center gap-2 text-ink">
            <LogoMark className="size-7" />
            <span className="text-xl font-extrabold tracking-tight">shipstat</span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-2">
            Honest download stats for npm packages. Real numbers, clear charts, and a card worth sharing.
          </p>
          <Link href="/" className="btn-cta mt-6 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold">
            Look up a package
            <svg viewBox="0 0 20 20" aria-hidden className="size-4">
              <path d="M4 10h12m-5-5 5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>

        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2 className="font-mono text-xs tracking-widest text-muted uppercase">{col.title}</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {col.links.map((l) => (
                <li key={l.label}>
                  {l.external ? (
                    <a href={l.href} className="group inline-flex items-center gap-1 text-ink-2 transition-colors hover:text-accent">
                      {l.label}
                      <svg viewBox="0 0 12 12" aria-hidden className="size-2.5 opacity-50 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                        <path d="M3.5 8.5 8.5 3.5M4.5 3.5h4v4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </a>
                  ) : (
                    <Link href={l.href} className="text-ink-2 transition-colors hover:text-accent">
                      {l.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="mx-auto flex max-w-6xl flex-col gap-4 border-t border-line px-5 py-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p>
          © {new Date().getFullYear()} shipstat · Data from npm. Not affiliated with npm, Inc.
        </p>
        <div className="flex items-center gap-3">
          <span>Theme</span>
          <ThemeToggle />
        </div>
      </div>

      {/* Oversized wordmark, mostly buried below the footer edge. Hovering it slowly raises it and deepens its colour. */}
      <div aria-hidden className="group relative h-[17.5vw] min-h-20 overflow-hidden select-none">
        <span className="text-gradient absolute inset-x-0 top-0 block translate-y-[35%] text-center text-[21vw] leading-none font-black tracking-[-0.06em] opacity-30 transition-[translate,opacity] duration-[1600ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform group-hover:translate-y-0 group-hover:opacity-55 dark:opacity-50 dark:group-hover:opacity-85 motion-reduce:transition-none">
          shipstat
        </span>
      </div>
    </footer>
  );
}
