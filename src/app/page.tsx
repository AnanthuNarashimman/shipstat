import Link from "next/link";

import { CardShowcase } from "@/components/landing/CardShowcase";
import { FocusSearchButton, HeroSearch } from "@/components/landing/HeroSearch";
import { ProductPreview } from "@/components/landing/ProductPreview";
import { PixelWaves } from "@/components/landing/PixelWaves";
import { Logo } from "@/components/Logo";
import { ScrollReveal } from "@/components/ScrollReveal";
import { ThemeToggle } from "@/components/ThemeToggle";
import { packagesAnalyzed } from "@/lib/counter";
import { formatCompact, formatFull } from "@/lib/format";
import { getReport } from "@/lib/report";
import { cardPath } from "@/lib/site";

export const revalidate = 600;

const REPO = "https://github.com/AnanthuNarashimman/shipstat";
const PREVIEW_PACKAGE = "zod";

// Four-point spark, sitting where the frame rails cross the nav line.
function Spark({ className }: { className: string }) {
  return (
    <span className={`absolute z-10 flex size-10 items-center justify-center rounded-full border border-line bg-bg ${className}`}>
      <svg viewBox="0 0 20 20" aria-hidden className="size-4 text-accent">
        <path d="M10 1c.6 5 3.4 8.4 9 9-5.6.6-8.4 4-9 9-.6-5-3.4-8.4-9-9 5.6-.6 8.4-4 9-9Z" fill="currentColor" />
      </svg>
    </span>
  );
}

// 3×3 corner cluster for the feature hover: wave colours with a couple of gaps.
const PIXEL_CORNER = [
  "--wave-yellow-strong", "", "--wave-orange-strong",
  "", "--wave-orange-strong", "--wave-red-strong",
  "--wave-yellow-strong", "--wave-red-strong", "",
];

// Icon tile colours per feature, so the section isn't all one orange.
const TONES = {
  red: "bg-red-wash text-red",
  orange: "bg-orange-wash text-accent",
  amber: "bg-yellow-wash text-amber",
};

const FEATURES = [
  {
    title: "Real numbers only",
    body: "Every figure comes from npm's registry and downloads API. No estimated maps, no invented countries.",
    icon: "M4 10.5 8 14.5 16 5.5",
    tone: "red" as const,
  },
  {
    title: "See what each release did",
    body: "Releases are marked on the download chart, so the jump after your v2.0 is right there.",
    icon: "M10 3v14M10 4.5l5.5 2.75L10 10",
    tone: "orange" as const,
  },
  {
    title: "Know who upgraded",
    body: "Version adoption shows how much of last week's traffic already runs your latest release.",
    icon: "M3.5 6h13M3.5 10h9M3.5 14h5",
    tone: "amber" as const,
  },
  {
    title: "Cards worth sharing",
    body: "Every package gets a card that unfurls on X, LinkedIn, Slack and Discord. Download it or drop it in your README.",
    icon: "M3.5 4.5h13v9h-13zM7 16.5h6",
    tone: "orange" as const,
  },
  {
    title: "Honest about gaps",
    body: "npm sometimes loses a day of data. We mark those days instead of drawing them as a crash.",
    icon: "M4 14c2-6 3-8 4-8s1.5 4 2.5 4S13 5 16 5",
    tone: "red" as const,
  },
  {
    title: "Instant, no account",
    body: "Type a package name. No sign-up, no cookies, no dashboard to configure.",
    icon: "M11 2.5 4.5 11H10l-1 6.5L15.5 9H10z",
    tone: "amber" as const,
  },
];

export default async function Home() {
  const [analyzed, preview] = await Promise.all([
    packagesAnalyzed(),
    getReport(PREVIEW_PACKAGE).catch(() => null),
  ]);
  const showcase = preview ? { name: preview.meta.name, total: preview.totals.allTime } : null;

  return (
    <div className="relative overflow-x-clip">
      {/* Frame: vertical rails that run the length of the page */}
      <div aria-hidden className="pointer-events-none absolute inset-y-0 left-1/2 w-full max-w-6xl -translate-x-1/2 border-x border-line/70" />

      {/* Nav */}
      <header className="relative mx-auto flex h-[72px] max-w-6xl items-center gap-6 px-5 sm:px-8">
        <Logo />
        <nav className="ml-4 hidden items-center gap-7 text-sm text-ink-2 md:flex">
          <a href="#features" className="transition-colors hover:text-ink">
            Features
          </a>
          <Link href={`/${PREVIEW_PACKAGE}`} className="transition-colors hover:text-ink">
            Example
          </Link>
          <a href="#data" className="transition-colors hover:text-ink">
            Data
          </a>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <a
            href={REPO}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-2 transition-colors hover:text-ink"
          >
            <svg viewBox="0 0 16 16" aria-hidden className="size-4" fill="currentColor">
              <path d="M8 .2a8 8 0 0 0-2.5 15.6c.4 0 .5-.2.5-.4v-1.5c-2.2.5-2.7-1-2.7-1-.4-.9-.9-1.2-.9-1.2-.7-.5.1-.5.1-.5.8.1 1.2.8 1.2.8.7 1.3 1.9.9 2.3.7.1-.5.3-.9.5-1.1-1.8-.2-3.6-.9-3.6-4 0-.9.3-1.6.8-2.1-.1-.2-.4-1 .1-2.1 0 0 .7-.2 2.2.8a7.5 7.5 0 0 1 4 0c1.5-1 2.2-.8 2.2-.8.4 1.1.2 1.9.1 2.1.5.6.8 1.3.8 2.1 0 3.1-1.9 3.8-3.6 4 .3.3.6.8.6 1.5v2.2c0 .2.1.5.6.4A8 8 0 0 0 8 .2Z" />
            </svg>
            <span className="hidden sm:inline">GitHub</span>
          </a>
          <ThemeToggle />
          <FocusSearchButton className="hidden rounded-lg bg-sunken px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:bg-line sm:block">
            Look up a package
          </FocusSearchButton>
        </div>
      </header>

      {/* Hero: fills the viewport under the nav; pixel waves rise from its bottom edge */}
      <section className="relative flex min-h-[calc(100svh-72px)] flex-col border-t border-line/70">
        <div aria-hidden className="hero-dots pointer-events-none absolute inset-0" />
        <PixelWaves className="absolute inset-0 h-full w-full" />

        <div className="relative mx-auto w-full max-w-6xl">
          <Spark className="-top-5 left-0 hidden -translate-x-1/2 md:flex" />
          <Spark className="-top-5 right-0 hidden translate-x-1/2 md:flex" />
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-5 pt-[clamp(24px,5vh,64px)] pb-[clamp(80px,15vh,170px)] text-center">
          <a
            href="#data"
            className="group flex items-center gap-2 rounded-full border border-line bg-surface py-1 pr-1 pl-3.5 text-sm text-ink-2 transition-colors hover:text-ink"
          >
            {analyzed ? `${formatFull(analyzed)} packages analyzed` : "Real npm data, refreshed every 6 hours"}
            <span className="flex size-5 items-center justify-center rounded-full bg-ink text-bg transition-transform group-hover:translate-x-0.5">
              <svg viewBox="0 0 12 12" aria-hidden className="size-2.5">
                <path d="M4.5 2.5 8 6l-3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </a>

          {/* Sized by width and height, so it stays on two lines and the hero fits short laptop screens */}
          <h1 className="mt-[clamp(16px,3vh,28px)] font-display text-[clamp(2.4rem,min(6.2vw,8.6vh),4.75rem)] leading-[1.04] font-extrabold tracking-[-0.03em] text-ink">
            See how your package
            <br />
            <span className="text-gradient">is really shipping</span>
          </h1>

          <p className="mt-[clamp(14px,2.6vh,24px)] max-w-xl text-lg leading-relaxed text-ink-2">
            Weekly downloads, release impact and version adoption for any npm package.{" "}
            <span className="rounded-md bg-yellow-wash px-1.5 py-0.5 font-medium text-ink">Nothing estimated.</span>
          </p>

          <div className="mt-[clamp(18px,3.2vh,32px)] flex flex-wrap items-center justify-center gap-3">
            <FocusSearchButton className="btn-cta rounded-xl px-5 py-2.5 text-base font-bold">
              Look up a package
            </FocusSearchButton>
            <Link
              href={`/${PREVIEW_PACKAGE}`}
              className="flex items-center gap-2 rounded-xl border border-line bg-surface px-5 py-2.5 text-[15px] font-medium text-ink transition-colors hover:border-ink-2"
            >
              <svg viewBox="0 0 20 20" aria-hidden className="size-4 text-accent">
                <path d="M3 16.5h14M5.5 13V9m4 4V5.5m4 7.5v-3" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
              See an example
            </Link>
          </div>

          <div className="relative mt-[clamp(22px,4vh,40px)] w-full max-w-2xl">
            <HeroSearch />
          </div>
        </div>
      </section>

      {/* Live preview */}
      <section className="relative mx-auto max-w-6xl px-4 pt-20 pb-24 sm:px-10">
        <div data-reveal className="mx-auto mb-10 max-w-xl text-center">
          <p className="font-mono text-xs tracking-widest text-accent">LIVE PREVIEW</p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-balance text-ink sm:text-4xl">This is what you get</h2>
          <p className="mt-3 text-ink-2">Not a screenshot. Real numbers for {PREVIEW_PACKAGE}, pulled from npm.</p>
        </div>
        <div data-reveal style={{ "--reveal-delay": "120ms" } as React.CSSProperties}>
          <ProductPreview name={PREVIEW_PACKAGE} />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative scroll-mt-8 border-t border-line/70">
        <div className="mx-auto max-w-6xl">
          <div data-reveal className="px-5 pt-20 pb-12 sm:px-10">
            <p className="font-mono text-xs tracking-widest text-accent">WHAT&apos;S INSIDE</p>
            <h2 className="mt-3 max-w-lg font-display text-3xl font-bold tracking-tight text-balance text-ink sm:text-4xl">
              The numbers that matter, and what they mean
            </h2>
          </div>
          <div className="grid gap-px border-y border-line/70 bg-line/70 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                data-reveal
                style={{ "--reveal-delay": `${(i % 3) * 90}ms` } as React.CSSProperties}
                className="group relative overflow-hidden bg-bg px-5 py-9 transition-colors duration-300 hover:bg-surface sm:px-10"
              >
                {/* pixel cluster that assembles in the corner on hover */}
                <span aria-hidden className="absolute top-5 right-5 grid grid-cols-3 gap-[3px]">
                  {PIXEL_CORNER.map((c, j) => (
                    <span
                      key={j}
                      className="size-[7px] scale-0 opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100"
                      style={{ background: c ? `var(${c})` : "transparent", transitionDelay: `${j * 35}ms` }}
                    />
                  ))}
                </span>
                <span className={`flex size-10 items-center justify-center rounded-xl ${TONES[f.tone]}`}>
                  <svg viewBox="0 0 20 20" aria-hidden className="size-[18px]">
                    <path d={f.icon} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <h3 className="mt-5 font-semibold text-ink transition-transform duration-300 group-hover:translate-x-1">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-2">{f.body}</p>
                {/* underline that sweeps in from the left */}
                <span
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 h-[3px] origin-left scale-x-0 bg-linear-to-r from-red via-accent to-yellow transition-transform duration-500 ease-out group-hover:scale-x-100"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Share cards */}
      {showcase && (
        <section id="cards" className="relative scroll-mt-8 overflow-x-clip">
          <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 py-24 sm:px-10 lg:grid-cols-[1fr_1.1fr]">
            <div data-reveal>
              <p className="font-mono text-xs tracking-widest text-accent">SHARE CARDS</p>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-balance text-ink sm:text-4xl">
                Your numbers, ready to <span className="text-gradient">show off</span>
              </h2>
              <p className="mt-4 max-w-md leading-relaxed text-ink-2">
                Every package gets its own card. Paste your shipstat link on X, LinkedIn, Slack or Discord and it
                unfurls by itself, with live numbers, the trend and a sparkline.
              </p>
              <ul className="mt-7 space-y-3 text-sm text-ink">
                {[
                  "Refreshes itself every few hours, so an old link never shows old numbers",
                  "Download it as a PNG, wide for posts or square for everything else",
                  "One line of Markdown puts it in your README",
                ].map((line, i) => (
                  <li key={line} className="flex gap-3">
                    <span
                      aria-hidden
                      className="mt-1.5 size-2 shrink-0"
                      style={{ background: `var(${["--red", "--accent", "--yellow"][i]})` }}
                    />
                    {line}
                  </li>
                ))}
              </ul>
              <FocusSearchButton className="mt-9 btn-cta rounded-xl px-5 py-2.5 text-base font-bold">
                Make your card
              </FocusSearchButton>
            </div>
            <div data-reveal style={{ "--reveal-delay": "150ms" } as React.CSSProperties}>
              <CardShowcase
                name={showcase.name}
                card={cardPath(showcase.name)}
                total={formatCompact(showcase.total)}
              />
            </div>
          </div>
        </section>
      )}

      {/* Data + closing CTA */}
      <section id="data" className="relative scroll-mt-8">
        <div className="mx-auto grid max-w-6xl gap-10 border-t border-line/70 px-5 py-20 sm:px-10 md:grid-cols-[1.2fr_1fr] md:items-center">
          <div data-reveal>
            <p className="font-mono text-xs tracking-widest text-accent">WHERE THE DATA COMES FROM</p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-balance text-ink sm:text-4xl">Straight from npm</h2>
            <p className="mt-4 max-w-lg leading-relaxed text-ink-2">
              Downloads come from npm&apos;s public downloads API, releases and package details from the registry. npm
              doesn&apos;t publish where downloads come from, so neither do we. Counts include CI and mirrors, so they
              measure installs, not people.
            </p>
            <FocusSearchButton className="mt-8 btn-cta rounded-xl px-5 py-2.5 text-base font-bold">
              Look up your package
            </FocusSearchButton>
          </div>
          <dl
            data-reveal
            style={{ "--reveal-delay": "120ms" } as React.CSSProperties}
            className="grid grid-cols-2 overflow-hidden rounded-2xl border border-line bg-surface"
          >
            {[
              ["Downloads", "api.npmjs.org"],
              ["Releases", "registry.npmjs.org"],
              ["History", "since Jan 2015"],
              ["Refreshed", "every 6 hours"],
            ].map(([k, v], i) => (
              <div key={k} className={`px-5 py-6 ${i % 2 === 0 ? "border-r" : ""} ${i < 2 ? "border-b" : ""} border-line`}>
                <dt className="text-xs text-muted">{k}</dt>
                <dd className="mt-1.5 font-mono text-sm text-ink">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
      <ScrollReveal />
    </div>
  );
}
