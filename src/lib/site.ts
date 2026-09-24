// Absolute base URL for metadata and share links.
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

// Scoped names keep their slash in the URL: /@scope/name.
export function packagePath(name: string): string {
  return "/" + name.split("/").map((part) => encodeURIComponent(part).replace(/^%40/, "@")).join("/");
}

// Bump when the share card's design changes: a new URL skips browser and social-network caches of the old image.
const CARD_VERSION = "7";

// Same-origin URL of a package's share card, with optional extra query params.
export function cardPath(name: string, params: Record<string, string> = {}): string {
  const query = new URLSearchParams({ v: CARD_VERSION, ...params });
  return `/api/card${packagePath(name)}?${query}`;
}
