import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/site";

// Everyone may crawl everything, including the link-preview bots (WhatsApp, Telegram, Slack, X…).
// Without this file, /robots.txt fell through to the package-page route and returned HTML.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    host: siteUrl,
  };
}
