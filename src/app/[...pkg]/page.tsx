import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { after } from "next/server";

import { DownloadsChart } from "@/components/DownloadsChart";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ReleaseList } from "@/components/ReleaseList";
import { SearchBox } from "@/components/SearchBox";
import { SharePanel } from "@/components/SharePanel";
import { Sparkline } from "@/components/Sparkline";
import { VersionAdoption } from "@/components/VersionAdoption";
import { recordLookup } from "@/lib/counter";
import { formatAgo, formatDay } from "@/lib/dates";
import { formatBytes, formatCompact, formatFull, formatPct } from "@/lib/format";
import { adoptionInsight, patternInsight, releaseInsight, trendInsight } from "@/lib/insights";
import { isValidPackageName } from "@/lib/npm";
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

async function load(segments: string[]): Promise<Report> {
  const name = nameFrom(segments);
  if (!isValidPackageName(name)) notFound();
  const report = await getReport(name);
  if (!report) notFound();
  return report;
}

export async function generateMetadata({ params }: PageProps<"/[...pkg]">): Promise<Metadata> {
  const { pkg } = await params;
  const name = nameFrom(pkg);
  if (!isValidPackageName(name)) return { title: "Package not found" };
  // Metadata must never take the page down; if npm is failing, the page shows its own error state.
  const report = await getReport(name).catch(() => undefined);
  if (report === undefined) return { title: `${name} npm downloads` };
  if (!report) return { title: "Package not found" };

  const { totals, meta } = report;
  const trend = totals.trendPct === null ? "" : ` (${formatPct(totals.trendPct)} vs last week)`;
  const description = `${formatFull(totals.allTime)} downloads all time. ${formatFull(totals.lastWeek)} in the last week${trend}. v${meta.version}.`;
  const card = cardPath(meta.name);

  return {
    title: `${meta.name} npm downloads`,
    description,
    alternates: { canonical: packagePath(meta.name) },
    openGraph: {
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
    <div className="px-6 py-6">
      <StatLabel color={color}>{label}</StatLabel>
      <div className="mt-2 flex h-12 items-end">
        <span className="text-3xl font-bold tracking-[-0.01em] text-ink">{value}</span>
      </div>
      {sub && <div className="mt-2 text-sm text-muted">{sub}</div>}
    </div>
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
          <div className="ml-auto flex w-full max-w-sm items-center gap-2">
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
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm">
          <span className="text-muted">Last release {formatAgo(report.releases.daysSinceLast)}</span>
          <a href={npmUrl} className="text-ink-2 underline decoration-line underline-offset-4 hover:text-ink">
            npm
          </a>
          {meta.repository && (
            <a href={meta.repository} className="text-ink-2 underline decoration-line underline-offset-4 hover:text-ink">
              Repository
            </a>
          )}
          {meta.homepage && meta.homepage !== meta.repository && !meta.homepage.startsWith(`${meta.repository}#`) && (
            <a href={meta.homepage} className="text-ink-2 underline decoration-line underline-offset-4 hover:text-ink">
              Homepage
            </a>
          )}
        </div>
      </div>

      <div className="space-y-5">
        {/* Headline numbers */}
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          <div className="grid sm:grid-cols-2 sm:divide-line max-sm:divide-y max-sm:divide-line lg:grid-cols-[1.35fr_1.25fr_1fr_1fr] lg:divide-x">
            {/* Primary: everything the package has done */}
            <div className="px-6 py-6">
              <StatLabel color="--accent">All-time downloads</StatLabel>
              <div className="mt-2 flex h-12 items-end">
                <span className="text-5xl leading-none font-bold tracking-[-0.02em] text-ink">{formatFull(totals.allTime)}</span>
              </div>
              <div className="mt-2 text-sm text-muted">since {formatDay(report.daily.start)}</div>
            </div>
            {/* Weekly, with where it's heading */}
            <div className="px-6 py-6">
              <StatLabel color="--avg">Weekly downloads</StatLabel>
              <div className="mt-2 flex h-12 items-end justify-between gap-3">
                <span className="text-3xl font-bold tracking-[-0.01em] text-ink">{formatFull(totals.lastWeek)}</span>
                <div className="shrink-0 pb-1.5">
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
              sub={totals.peakWeek ? `week of ${formatDay(totals.peakWeek.start)}` : undefined}
            />
          </div>
          {(insights.length > 0 || totals.gapsLastWeek > 0) && (
            <div className="space-y-1 border-t border-line bg-bg/40 px-5 py-3.5 text-sm text-ink-2 sm:px-7">
              {insights.map((line) => (
                <p key={line}>{line}</p>
              ))}
              {totals.gapsLastWeek > 0 && (
                <p className="text-muted">
                  npm has no data for {totals.gapsLastWeek} of the last 7 days, so the weekly total runs low. The trend
                  only compares days that have data.
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
              <Fact label="Maintainers">{meta.maintainers}</Fact>
              <Fact label="First published">{formatDay(meta.created)}</Fact>
            </div>
          </dl>
        </Section>

        <Section id="share" title="Share">
          <SharePanel
            pageUrl={pageUrl}
            cardUrl={cardUrl}
            previewSrc={cardPath(meta.name)}
            downloadWide={cardPath(meta.name, { download: "1" })}
            downloadSquare={cardPath(meta.name, { format: "square", download: "1" })}
            name={meta.name}
          />
        </Section>

        <p className="px-1 text-xs text-muted">
          Counts come from npm and include CI runs, mirrors and bots, so they measure installs, not people. Data runs
          through {formatDay(report.lastDay)} (UTC) and refreshes every few hours.
        </p>
      </div>
    </main>
    </>
  );
}
