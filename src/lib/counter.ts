import "server-only";

// Tracks which packages have been analyzed, in Upstash Redis over its REST API.
// Vercel's Upstash integration sets KV_REST_API_*; a manual setup uses UPSTASH_REDIS_REST_*.
// With neither set, counting is skipped and the app works the same.

const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

const PACKAGES_KEY = "shipstat:packages";
const LOOKUPS_KEY = "shipstat:lookups";

export async function recordLookup(name: string): Promise<void> {
  if (!url || !token) return;
  try {
    await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
      body: JSON.stringify([
        ["SADD", PACKAGES_KEY, name],
        ["INCR", LOOKUPS_KEY],
      ]),
      cache: "no-store",
    });
  } catch {
    // Counting is best-effort; never let it break a page.
  }
}

export async function packagesAnalyzed(): Promise<number | null> {
  if (!url || !token) return null;
  try {
    const res = await fetch(`${url}/scard/${PACKAGES_KEY}`, {
      headers: { authorization: `Bearer ${token}` },
      next: { revalidate: 600 },
    });
    if (!res.ok) return null;
    const { result } = (await res.json()) as { result: unknown };
    return typeof result === "number" ? result : null;
  } catch {
    return null;
  }
}
