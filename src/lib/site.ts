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
