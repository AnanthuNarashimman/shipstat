import "server-only";

import { addDays, diffDays, toDay } from "./dates";

const REGISTRY = "https://registry.npmjs.org";
const DOWNLOADS = "https://api.npmjs.org";

const HOUR = 3600;
const RECENT_REVALIDATE = 6 * HOUR;
const HISTORY_REVALIDATE = 7 * 24 * HOUR;

// npm's downloads data starts here.
export const DOWNLOADS_EPOCH = "2015-01-10";
// The range endpoint silently truncates requests longer than ~18 months, so history is fetched
// in fixed windows. Fixed boundaries keep past windows' URLs stable, so they cache for a week.
const WINDOW_DAYS = 500;

const NAME_RE = /^(?:@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/i;

export function isValidPackageName(name: string): boolean {
  return name.length > 0 && name.length <= 214 && NAME_RE.test(name);
}

export class NpmError extends Error {}

const RETRIES = 2;

// npm rate-limits by IP (429) and has the odd 5xx; retry briefly before giving up.
async function getJson<T>(url: string, init: RequestInit & { next?: { revalidate?: number } }): Promise<T | null> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { ...init, headers: { accept: "application/json" } });
    if (res.status === 404) return null;
    if (res.ok) return (await res.json()) as T;
    const retryable = res.status === 429 || res.status >= 500;
    if (!retryable || attempt >= RETRIES) throw new NpmError(`npm responded ${res.status} for ${url}`);
    const retryAfter = Number(res.headers.get("retry-after"));
    const wait = Number.isFinite(retryAfter) && retryAfter > 0 ? Math.min(retryAfter, 3) * 1000 : 800 * (attempt + 1);
    await new Promise((r) => setTimeout(r, wait));
  }
}

// ---------- registry ----------

type Manifest = {
  author?: string | { name?: string; url?: string };
  version: string;
  description?: string;
  license?: string | { type?: string };
  types?: string;
  typings?: string;
  exports?: unknown;
  dependencies?: Record<string, string>;
  engines?: { node?: string };
  deprecated?: string;
  dist?: { unpackedSize?: number; fileCount?: number; attestations?: unknown };
};

type Packument = {
  name: string;
  description?: string;
  "dist-tags"?: { latest?: string };
  versions?: Record<string, Manifest>;
  time?: Record<string, string> & { unpublished?: unknown };
  license?: string | { type?: string };
  homepage?: string;
  repository?: string | { url?: string };
  keywords?: string[];
  maintainers?: { name: string }[];
  author?: string | { name?: string; url?: string };
};

export type Release = { version: string; date: string; prerelease: boolean };

// Who made the package. Emails are never kept, only public names, usernames and links.
export type People = {
  author: { name: string; url: string | null } | null; // from package.json
  github: string | null; // owner of the GitHub repository (a user or an organisation)
  maintainers: string[]; // npm usernames
};

export type PackageMeta = {
  name: string;
  description: string | null;
  version: string;
  license: string | null;
  homepage: string | null;
  repository: string | null;
  keywords: string[];
  maintainers: number;
  people: People;
  created: string;
  deprecated: string | null;
  dependencies: number;
  unpackedSize: number | null;
  fileCount: number | null;
  types: boolean;
  provenance: boolean;
  node: string | null;
  releases: Release[]; // oldest first
};

function licenseOf(l: Packument["license"]): string | null {
  if (!l) return null;
  return typeof l === "string" ? l : (l.type ?? null);
}

// git+https://github.com/a/b.git, git://github.com/a/b, github:a/b → https://github.com/a/b
function repositoryUrl(repo: Packument["repository"]): string | null {
  const raw = typeof repo === "string" ? repo : repo?.url;
  if (!raw) return null;
  const short = raw.match(/^(?:github:)?([\w.-]+\/[\w.-]+)$/);
  if (short) return `https://github.com/${short[1]}`;
  const url = raw
    .replace(/^git\+/, "")
    .replace(/^git:\/\//, "https://")
    .replace(/^ssh:\/\/git@/, "https://")
    .replace(/^git@([^:]+):/, "https://$1/")
    .replace(/\.git$/, "");
  return /^https?:\/\//.test(url) ? url : null;
}

// "Jane Doe <jane@example.com> (https://jane.dev)" or { name, email, url } → name and url, never the email.
function authorOf(a: Packument["author"]): People["author"] {
  if (!a) return null;
  if (typeof a === "string") {
    const name = a.replace(/<[^>]*>/, "").replace(/\([^)]*\)/, "").trim();
    const url = a.match(/\((https?:\/\/[^)\s]+)\)/)?.[1] ?? null;
    return name ? { name: name.slice(0, 60), url } : null;
  }
  const name = a.name?.trim();
  return name ? { name: name.slice(0, 60), url: a.url && /^https?:\/\//.test(a.url) ? a.url : null } : null;
}

function peopleOf(doc: Packument, latest: Manifest): People {
  const repo = repositoryUrl(doc.repository);
  return {
    author: authorOf(latest.author ?? doc.author),
    github: repo?.match(/^https:\/\/github\.com\/([\w.-]+)\//)?.[1] ?? null,
    maintainers: (doc.maintainers ?? []).map((m) => m.name).filter(Boolean).slice(0, 12),
  };
}

function hasTypes(m: Manifest): boolean {
  if (m.types || m.typings) return true;
  return JSON.stringify(m.exports ?? "").includes('"types"');
}

export async function fetchPackageMeta(name: string): Promise<PackageMeta | null> {
  // Full packuments for popular packages run to several MB, over the fetch cache's per-item limit,
  // so this request is not cached itself; the compact result is cached by the caller.
  const doc = await getJson<Packument>(`${REGISTRY}/${encodeURIComponent(name).replace(/^%40/, "@")}`, {
    cache: "no-store",
  });
  const latestVersion = doc?.["dist-tags"]?.latest;
  const latest = latestVersion ? doc.versions?.[latestVersion] : undefined;
  // Old packages can lack `time` (publish dates) entirely; that doesn't mean they don't exist.
  if (!doc || !latest || doc.time?.unpublished) return null;

  const releases: Release[] = Object.keys(doc.versions ?? {})
    .filter((v) => typeof doc.time?.[v] === "string")
    .map((v) => ({ version: v, date: doc.time![v].slice(0, 10), prerelease: v.includes("-") }))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  return {
    name: doc.name,
    description: doc.description || latest.description || null,
    version: latest.version,
    license: licenseOf(latest.license ?? doc.license),
    homepage: doc.homepage ?? null,
    repository: repositoryUrl(doc.repository),
    keywords: (doc.keywords ?? []).slice(0, 8),
    maintainers: doc.maintainers?.length ?? 0,
    people: peopleOf(doc, latest),
    // Unknown creation date: start download history at the beginning of npm's records.
    created: (doc.time?.created ?? releases[0]?.date ?? DOWNLOADS_EPOCH).slice(0, 10),
    deprecated: latest.deprecated ?? null,
    dependencies: Object.keys(latest.dependencies ?? {}).length,
    unpackedSize: latest.dist?.unpackedSize ?? null,
    fileCount: latest.dist?.fileCount ?? null,
    types: hasTypes(latest),
    provenance: Boolean(latest.dist?.attestations),
    node: latest.engines?.node ?? null,
    releases,
  };
}

// Cheap existence check: the latest manifest is a few KB, even for huge packages. Cached for a day.
export async function packageExists(name: string): Promise<boolean> {
  try {
    const res = await fetch(`${REGISTRY}/${encodeURIComponent(name).replace(/^%40/, "@")}/latest`, {
      next: { revalidate: 86400 },
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ---------- downloads ----------

// The last day npm has published counts for. It's the same for every package, so one shared request.
// If npm won't say, assume its usual lag of about two days rather than failing the page.
export async function fetchLastDay(): Promise<string> {
  try {
    const data = await getJson<{ end: string }>(`${DOWNLOADS}/downloads/point/last-day/npm`, {
      next: { revalidate: HOUR },
    });
    if (data?.end) return data.end;
  } catch {
    // fall through
  }
  return addDays(toDay(new Date()), -2);
}

type RangeResponse = { downloads: { day: string; downloads: number }[] };

// Daily downloads from `from` through `to`, inclusive. Missing days come back as 0.
export async function fetchDailyDownloads(name: string, from: string, to: string): Promise<number[]> {
  const length = diffDays(from, to) + 1;
  if (length <= 0) return [];

  const firstWindow = Math.max(0, Math.floor(diffDays(DOWNLOADS_EPOCH, from) / WINDOW_DAYS));
  const lastWindow = Math.floor(diffDays(DOWNLOADS_EPOCH, to) / WINDOW_DAYS);

  const requests: Promise<RangeResponse | null>[] = [];
  for (let w = firstWindow; w <= lastWindow; w++) {
    const winStart = addDays(DOWNLOADS_EPOCH, w * WINDOW_DAYS);
    const winEnd = addDays(winStart, WINDOW_DAYS - 1);
    const isPast = winEnd < to;
    const end = isPast ? winEnd : to;
    requests.push(
      getJson<RangeResponse>(`${DOWNLOADS}/downloads/range/${winStart}:${end}/${name}`, {
        next: { revalidate: isPast ? HISTORY_REVALIDATE : RECENT_REVALIDATE },
      }),
    );
  }

  const counts = new Array<number>(length).fill(0);
  for (const res of await Promise.all(requests)) {
    for (const { day, downloads } of res?.downloads ?? []) {
      const i = diffDays(from, day);
      if (i >= 0 && i < length) counts[i] = downloads;
    }
  }
  return counts;
}

export async function fetchVersionDownloads(name: string): Promise<Record<string, number>> {
  const data = await getJson<{ downloads: Record<string, number> }>(
    `${DOWNLOADS}/versions/${encodeURIComponent(name)}/last-week`,
    { next: { revalidate: RECENT_REVALIDATE } },
  );
  return data?.downloads ?? {};
}

// ---------- search ----------

export type SearchHit = {
  name: string;
  version: string;
  description: string | null;
  weekly: number | null;
};

type SearchResponse = {
  objects: {
    package: { name: string; version: string; description?: string };
    downloads?: { weekly?: number };
  }[];
};

export async function searchPackages(query: string): Promise<SearchHit[]> {
  const params = new URLSearchParams({ text: query, size: "8" });
  const data = await getJson<SearchResponse>(`${REGISTRY}/-/v1/search?${params}`, {
    next: { revalidate: HOUR },
  });
  return (data?.objects ?? []).map((o) => ({
    name: o.package.name,
    version: o.package.version,
    description: o.package.description ?? null,
    weekly: o.downloads?.weekly ?? null,
  }));
}
