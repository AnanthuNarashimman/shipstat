import type { Metadata } from "next";
import { Google_Sans, JetBrains_Mono } from "next/font/google";

import { SiteFooter } from "@/components/SiteFooter";
import { THEME_KEY } from "@/lib/theme";
import { siteUrl } from "@/lib/site";
import "./globals.css";

// Google Sans for everything readable (headlines, UI, numbers); JetBrains Mono for versions and labels.
const googleSans = Google_Sans({ variable: "--font-google-sans", subsets: ["latin"] });
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "shipstat · npm package stats",
    template: "%s · shipstat",
  },
  description: "Clear download stats for any npm package. Real numbers from npm, nothing estimated.",
  // Link previews (WhatsApp, Telegram, Slack…) show the site name as the heading; the image comes from opengraph-image.tsx.
  openGraph: {
    siteName: "shipstat",
    type: "website",
    url: "/",
    title: "shipstat · npm package stats",
    description: "Clear download stats for any npm package. Real numbers from npm, nothing estimated.",
  },
  twitter: { card: "summary_large_image" },
};

// Runs before first paint so a saved dark theme never flashes light. Light is the default.
const themeScript = `try{if(localStorage.getItem("${THEME_KEY}")==="dark")document.documentElement.dataset.theme="dark"}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="light"
      suppressHydrationWarning
      className={`${googleSans.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <div className="flex-1">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
