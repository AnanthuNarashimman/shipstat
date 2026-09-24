import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { after } from "next/server";

import { DownloadsChart } from "@/components/DownloadsChart";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ReleaseList } from "@/components/ReleaseList";
import { SearchBox } from "@/components/SearchBox";
import { PixelSkyline } from "@/components/PixelSkyline";
import { SharePanel } from "@/components/SharePanel";
import { Sparkline } from "@/components/Sparkline";
import { VersionAdoption } from "@/components/VersionAdoption";
import { recordLookup } from "@/lib/counter";
import { formatAgo, formatDay } from "@/lib/dates";
import { formatBytes, formatCompact, formatFull, formatPct } from "@/lib/format";
import { adoptionInsight, patternInsight, releaseInsight, trendInsight } from "@/lib/insights";
import { isValidPackageName, packageExists, type People } from "@/lib/npm";
import { NPM_MARK } from "@/lib/og";
import { githubProfile, makerOf, npmProfile } from "@/lib/people";
import { getReport, type Report } from "@/lib/report";
import { cardPath, packagePath, siteUrl } from "@/lib/site";

// Pages render on first visit and are cached; npm data is refreshed at most every 6 hours.
export const revalidate = 21600;

export function generateStaticParams() {
  return [];
}

function nameFrom(segments: string[]): string {
  return segments.map((s) => decodeURIComponent(s)).join("/");
}

// npm names are case-sensitive and new ones are lowercase, but legacy names like JSONStream exist (and
// "jsonstream" is a different package). So: exact name first, then the lowercase name as a fallback.
async function findReport(name: string): Promise<Report | null> {
  const exact = await getReport(name);
  if (exact || name === name.toLowerCase()) return exact;
  return getReport(name.toLowerCase());
}

async function load(segments: string[]): Promise<Report> {
  const name = nameFrom(segments);
  if (!isValidPackageName(name)) notFound();
  const report = await getReport(name);
  if (report) return report;
  // Typed "Tracetel" but the package is "tracetel": redirect as soon as a quick check confirms the
  // lowercase package exists, rather than after building its whole report.
  const lower = name.toLowerCase();
  if (lower !== name && (await packageExists(lower))) permanentRedirect(packagePath(lower));
  notFound();
}

export async function generateMetadata({ params }: PageProps<"/[...pkg]">): Promise<Metadata> {
  const { pkg } = await params;
  const name = nameFrom(pkg);
  if (!isValidPackageName(name)) return { title: "Package not found" };
  // Metadata must never take the page down; if npm is failing, the page shows its own error state.
  const report = await findReport(name).catch(() => undefined);
  if (report === undefined) return { title: `${name} npm downloads` };
  if (!report) return { title: "Package not found" };

  const { totals, meta } = report;
  const description = `${formatFull(totals.allTime)} downloads all time, ${formatFull(totals.lastWeek)} in the last 7 days. v${meta.version} on npm.`;
  const card = cardPath(meta.name);

  return {
    title: `${meta.name} npm downloads`,
    description,
    alternates: { canonical: packagePath(meta.name) },
    openGraph: {
      siteName: "shipstat",
      type: "website",
      title: `${meta.name} on shipstat`,
      description,
      url: packagePath(meta.name),
      images: [{ url: card, width: 1200, height: 630, alt: `Download stats for ${meta.name}` }],
    },
    twitter: { card: "summary_large_image", title: `${meta.name} on shipstat`, description, images: [card] },
  };
}

function Section({
  id,
  title,
  note,
  children,
}: {
  id?: string;
  title: string;
  note?: string | null;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-6 rounded-2xl border border-line bg-surface p-5 sm:p-7">
      <h2 className="text-sm font-medium text-ink-2">{title}</h2>
      {note && <p className="mt-1 text-sm text-muted">{note}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

// "Sep 15", "Sep 15 and Sep 17", "Sep 15, Sep 16 and Sep 17"
function listDays(days: string[]): string {
  const names = days.map((d) => formatDay(d, false));
  return names.length <= 1 ? (names[0] ?? "") : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
}

// Font size for a number inside a stat tile (an @container): its normal size, or smaller if that is what
// it takes to fit the tile. Space beside it (e.g. for a sparkline) comes from the --reserve variable.
function fitToTile(text: string, max: string): string {
  const em = (0.62 * text.length).toFixed(2); // rough width of the text in ems at this font
  return `min(${max}, calc((100cqi - var(--reserve, 0px)) / ${em}))`;
}

function StatLabel({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-muted">
      <span aria-hidden className="size-2 rounded-[2px]" style={{ background: `var(${color})` }} />
      {children}
    </span>
  );
}

function Stat({ label, color, value, sub }: { label: string; color: string; value: string; sub?: React.ReactNode }) {
  return (
    <div className="@container bg-surface px-6 py-6">
      <StatLabel color={color}>{label}</StatLabel>
      <div className="mt-2 flex h-12 items-end">
        <span
          className="font-bold tracking-[-0.01em] whitespace-nowrap text-ink"
          style={{ fontSize: fitToTile(value, "1.875rem") }}
        >
          {value}
        </span>
      </div>
      {sub && <div className="mt-2 text-sm text-muted">{sub}</div>}
    </div>
  );
}

const ICONS = {
  // a package box
  npm: "M10 2.5 16.5 6v8L10 17.5 3.5 14V6zM3.5 6 10 9.5 16.5 6M10 9.5v8",
  code: "M7 6 3 10l4 4M13 6l4 4-4 4",
  globe: "M10 17.5a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15ZM2.5 10h15M10 2.5c2 2.2 2.9 4.7 2.9 7.5s-.9 5.3-2.9 7.5c-2-2.2-2.9-4.7-2.9-7.5S8 4.7 10 2.5Z",
  github:
    "M10 1.5a8.5 8.5 0 0 0-2.7 16.6c.4 0 .6-.2.6-.4v-1.6c-2.4.5-2.9-1.1-2.9-1.1-.4-1-1-1.3-1-1.3-.8-.5.1-.5.1-.5.9.1 1.3.9 1.3.9.8 1.3 2 1 2.5.7.1-.6.3-1 .6-1.2-1.9-.2-3.9-1-3.9-4.2 0-.9.3-1.7.9-2.3-.1-.2-.4-1.1.1-2.2 0 0 .7-.2 2.3.9a8 8 0 0 1 4.2 0c1.6-1.1 2.3-.9 2.3-.9.5 1.1.2 2 .1 2.2.5.6.9 1.4.9 2.3 0 3.3-2 4-3.9 4.2.3.3.6.8.6 1.6v2.3c0 .2.2.5.6.4A8.5 8.5 0 0 0 10 1.5Z",
};

// A link off-site that reads as clickable at a glance: icon, border, and an arrow that nudges on hover.
function ExternalLink({
  href,
  icon,
  filled = false,
  children,
}: {
  href: string;
  icon: string;
  filled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-1.5 font-medium text-ink transition-colors hover:border-accent hover:text-accent"
    >
      <svg viewBox="0 0 20 20" aria-hidden className="size-4 text-ink-2 transition-colors group-hover:text-accent">
        {filled ? (
          <path d={icon} fill="currentColor" />
        ) : (
          <path d={icon} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </svg>
      {children}
      <svg
        viewBox="0 0 12 12"
        aria-hidden
        className="size-3 text-muted transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent"
      >
        <path d="M3.5 8.5 8.5 3.5M4.5 3.5h4v4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}

// "Made by" line: who built this, with their face and where to find them.
function MadeBy({ people }: { people: People }) {
  const maker = makerOf(people);
  if (!maker) return null;
  const link = "font-medium text-ink-2 underline decoration-line underline-offset-4 transition-colors hover:text-accent hover:decoration-accent";
  return (
    <div className="mt-5 flex items-center gap-3">
      {maker.avatar ? (
        // eslint-disable-next-line @next/next/no-img-element -- small remote avatar, no optimisation needed
        <img
          src={maker.avatar}
          alt=""
          width={40}
          height={40}
          className="size-10 shrink-0 rounded-full border border-line bg-sunken"
        />
      ) : (
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-yellow-wash font-bold text-ink">
          {maker.name.charAt(0).toUpperCase()}
        </span>
      )}
      <div className="min-w-0 text-sm leading-snug">
        <div className="text-muted">
          Made by{" "}
          {maker.url ? (
            <a href={maker.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-ink hover:text-accent">
              {maker.name}
            </a>
          ) : (
            <span className="font-semibold text-ink">{maker.name}</span>
          )}
        </div>
        <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-muted">
          {maker.github && (
            <a href={githubProfile(maker.github)} target="_blank" rel="noopener noreferrer" className={link}>
              @{maker.github} on GitHub
            </a>
          )}
          {people.maintainers[0] && (
            <a href={npmProfile(people.maintainers[0])} target="_blank" rel="noopener noreferrer" className={link}>
              ~{people.maintainers[0]} on npm
            </a>
          )}
          {people.maintainers.length > 1 && <span>+{people.maintainers.length - 1} more on npm</span>}
        </div>
      </div>
    </div>
  );
}

// Maintainers as links to their npm profiles; long lists fold into "+N more".
function Maintainers({ names }: { names: string[] }) {
  if (names.length === 0) return <>–</>;
  const shown = names.slice(0, 3);
  return (
    <span className="inline-flex flex-wrap justify-end gap-x-2">
      {shown.map((n) => (
        <a key={n} href={npmProfile(n)} target="_blank" rel="noopener noreferrer" className="hover:text-accent">
          ~{n}
        </a>
      ))}
      {names.length > shown.length && <span className="text-muted">+{names.length - shown.length} more</span>}
    </span>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line py-2.5 text-sm last:border-0">
      <dt className="text-muted">{label}</dt>
      <dd className="truncate text-right text-ink">{children}</dd>
    </div>
  );
}

export default async function PackagePage({ params }: PageProps<"/[...pkg]">) {
  const { pkg } = await params;
  const report = await load(pkg);
  const { meta, totals } = report;

  after(() => recordLookup(meta.name));

  const pageUrl = `${siteUrl}${packagePath(meta.name)}`;
  const cardUrl = `${siteUrl}${cardPath(meta.name)}`;
  const trend = totals.trendPct;
  const insights = [trendInsight(report), patternInsight(report)].filter(Boolean);
  const npmUrl = `https://www.npmjs.com/package/${meta.name}`;

  return (
    <>
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-4 sm:px-6">
          <Logo size="sm" />
          <div className="ml-auto flex w-full max-w-sm min-w-0 items-center gap-2">
            <SearchBox size="sm" />
            <ThemeToggle />
          </div>
      </div>
    </header>
    <main className="mx-auto max-w-5xl px-4 pb-8 sm:px-6">

      {/* Package header */}
      <div className="relative pt-8 pb-10">
        <a
          href="#share"
          className="btn-cta mb-5 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold sm:absolute sm:top-8 sm:right-0 sm:mb-0"
        >
          <svg viewBox="0 0 20 20" aria-hidden className="size-4">
            <path
              d="M10 12.5V3m0 0L6.5 6.5M10 3l3.5 3.5M4 10.5v5A1.5 1.5 0 0 0 5.5 17h9a1.5 1.5 0 0 0 1.5-1.5v-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Share
        </a>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2 sm:pr-32">
          <h1 className="break-all font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">{meta.name}</h1>
          <span className="rounded-md bg-sunken px-2 py-0.5 font-mono text-sm text-ink-2">v{meta.version}</span>
          {meta.license && <span className="text-sm text-muted">{meta.license}</span>}
        </div>
        {meta.description && <p className="mt-3 max-w-2xl text-ink-2">{meta.description}</p>}
        {meta.deprecated && (
          <p className="mt-4 max-w-2xl rounded-lg border border-down/30 bg-down/5 px-3 py-2 text-sm text-ink">
            <span className="font-medium text-down">Deprecated.</span> {meta.deprecated}
          </p>
        )}
        <MadeBy people={meta.people} />
        <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
          <ExternalLink href={npmUrl} icon={ICONS.npm}>
            npm
          </ExternalLink>
          {meta.repository && (
            <ExternalLink
              href={meta.repository}
              icon={/github\.com/.test(meta.repository) ? ICONS.github : ICONS.code}
              filled={/github\.com/.test(meta.repository)}
            >
              Repository
            </ExternalLink>
          )}
          {meta.homepage && meta.homepage !== meta.repository && !meta.homepage.startsWith(`${meta.repository}#`) && (
            <ExternalLink href={meta.homepage} icon={ICONS.globe}>
              Homepage
            </ExternalLink>
          )}
          {report.releases.daysSinceLast !== null && (
            <span className="ml-1 text-muted">Last release {formatAgo(report.releases.daysSinceLast)}</span>
          )}
        </div>
      </div>

      <div className="space-y-5">
        {/* Headline numbers */}
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          <div className="grid grid-cols-[minmax(0,1fr)] gap-px bg-line sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)]">
            {/* Primary: everything the package has done, on a row of its own so it never has to shrink */}
            <div className="@container relative bg-surface px-6 py-7 sm:col-span-3 sm:[--reserve:112px]">
              {/* npm mark on the right, filling the row on wider screens; the number leaves room for it */}
              <svg
                viewBox="0 0 24 24"
                aria-hidden
                className="absolute top-1/2 right-8 hidden size-16 -translate-y-1/2 sm:block"
              >
                <path d={NPM_MARK} fill="#cb3837" />
              </svg>
              <StatLabel color="--accent">All-time downloads</StatLabel>
              <div className="mt-2 flex h-16 items-end">
                {/* Sized to the tile, not the screen: full size when it fits, smaller for long numbers in narrow tiles */}
                <span
                  className="leading-none font-bold tracking-[-0.02em] whitespace-nowrap text-ink"
                  style={{ fontSize: fitToTile(formatFull(totals.allTime), "3.75rem") }}
                >
                  {formatFull(totals.allTime)}
                </span>
              </div>
              <div className="mt-2 text-sm text-muted">since {formatDay(report.daily.start)}</div>
            </div>
            {/* Weekly, with where it's heading */}
            <div className="@container bg-surface px-6 py-6">
              <StatLabel color="--avg">
                Weekly downloads
                <span className="text-muted/80">
                  · {formatDay(totals.lastWeekStart, false)} – {formatDay(report.lastDay, false)}
                </span>
              </StatLabel>
              <div className="mt-2 flex h-12 items-end justify-between gap-3 [--reserve:0px] @[19rem]:[--reserve:100px]">
                <span
                  className="font-bold tracking-[-0.01em] whitespace-nowrap text-ink"
                  style={{ fontSize: fitToTile(formatFull(totals.lastWeek), "1.875rem") }}
                >
                  {formatFull(totals.lastWeek)}
                </span>
                <div className="hidden shrink-0 pb-1.5 @[19rem]:block">
                  <Sparkline values={report.sparkline} width={88} height={28} color="var(--avg)" />
                </div>
              </div>
              <div className="mt-2 text-sm">
                {trend === null ? (
                  <span className="text-muted">Not enough data for a trend yet</span>
                ) : (
                  <>
                    <span className={trend > 0 ? "text-up" : trend < 0 ? "text-down" : "text-ink-2"}>
                      {trend > 0 ? "▲" : trend < 0 ? "▼" : ""} {formatPct(trend)}
                    </span>
                    <span className="text-muted"> vs previous week</span>
                  </>
                )}
              </div>
            </div>
            <Stat
              label="Last 30 days"
              color="--weekend"
              value={formatCompact(totals.lastMonth)}
              sub={totals.lastMonth >= 1000 ? formatFull(totals.lastMonth) : undefined}
            />
            <Stat
              label="Best week"
              color="--series-4"
              value={totals.peakWeek ? formatCompact(totals.peakWeek.downloads) : "–"}
              sub={totals.peakWeek ? formatDay(totals.peakWeek.start) : undefined}
            />
          </div>
          {(insights.length > 0 || totals.gapsLastWeek > 0) && (
            <div className="space-y-1 border-t border-line bg-bg/40 px-5 py-3.5 text-sm text-ink-2 sm:px-7">
              {insights.map((line) => (
                <p key={line}>{line}</p>
              ))}
              {totals.gapDatesLastWeek.length > 0 && (
                <p className="flex items-start gap-2 pt-1 text-muted">
                  <svg viewBox="0 0 20 20" aria-hidden className="mt-0.5 size-4 shrink-0">
                    <circle cx="10" cy="10" r="7.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M10 9v4.5M10 6.5v.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                  <span>
                    npm is missing data for {listDays(totals.gapDatesLastWeek)}, for every package, not just this one, so
                    this week&apos;s total runs a little low. The trend skips those days.
                  </span>
                </p>
              )}
            </div>
          )}
        </div>

        <section id="downloads" className="scroll-mt-6 rounded-2xl border border-line bg-surface p-5 sm:p-7">
          {report.daily.counts.length > 0 ? (
            <DownloadsChart
              start={report.daily.start}
              counts={report.daily.counts}
              releases={meta.releases.filter((r) => !r.prerelease)}
            />
          ) : (
            <p className="text-sm text-muted">
              npm hasn&apos;t published download numbers for this package yet. They usually appear a day or two after
              the first release.
            </p>
          )}
        </section>

        <div className="grid gap-5 md:grid-cols-[1.5fr_1fr]">
          <Section id="versions" title="Version adoption, last 7 days" note={adoptionInsight(report)}>
            <VersionAdoption versions={report.versions} latest={meta.version} />
          </Section>
          <Section id="releases" title="Releases" note={releaseInsight(report)}>
            <ReleaseList releases={meta.releases} />
          </Section>
        </div>

        <Section title="Package">
          <dl className="grid gap-x-10 sm:grid-cols-2">
            <div>
              <Fact label="TypeScript types">{meta.types ? "Bundled" : "Not bundled"}</Fact>
              <Fact label="Dependencies">{meta.dependencies}</Fact>
              <Fact label="Unpacked size">{meta.unpackedSize ? formatBytes(meta.unpackedSize) : "–"}</Fact>
              <Fact label="Files">{meta.fileCount ?? "–"}</Fact>
            </div>
            <div>
              <Fact label="Provenance">{meta.provenance ? "Signed build" : "None"}</Fact>
              <Fact label="Node">{meta.node ?? "Any"}</Fact>
              <Fact label="Maintainers">
                <Maintainers names={meta.people.maintainers} />
              </Fact>
              <Fact label="First published">{formatDay(meta.created)}</Fact>
            </div>
          </dl>
        </Section>

        {/* The main call to action: gradient frame, heading, and the pixel waves along the bottom */}
        <section
          id="share"
          className="scroll-mt-6 rounded-[18px] bg-linear-to-r from-red via-accent to-yellow p-[1.5px]"
        >
          <div className="relative overflow-hidden rounded-2xl bg-surface">
            <div className="relative z-10 p-5 pb-24 sm:p-8 sm:pb-28">
              <p className="font-mono text-xs tracking-widest text-accent">SHARE CARD</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                Show off <span className="text-gradient break-all">{meta.name}</span>
              </h2>
              <p className="mt-2 max-w-xl text-sm text-ink-2">
                A card with your live numbers, ready for socials, docs and your README.
              </p>
              <div className="mt-7">
                <SharePanel
            pageUrl={pageUrl}
            cardUrl={cardUrl}
            previewSrc={cardPath(meta.name)}
            downloadWide={cardPath(meta.name, { download: "1" })}
            downloadSquare={cardPath(meta.name, { format: "square", download: "1" })}
            name={meta.name}
          />
              </div>
            </div>
            <PixelSkyline rows={5} phase={37} className="pointer-events-none absolute inset-x-0 bottom-0 block h-[56px] w-full" />
          </div>
        </section>

        <p className="px-1 text-xs text-muted">
          Counts come from npm and include CI runs, mirrors and bots, so they measure installs, not people. Data runs
          through {formatDay(report.lastDay)} (UTC) and refreshes every few hours.
        </p>
      </div>
    </main>
    </>
  );
}
