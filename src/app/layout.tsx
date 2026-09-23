import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";

import { siteUrl } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "shipstat · npm package stats",
    template: "%s · shipstat",
  },
  description: "Clear download stats for any npm package. Real numbers from npm, nothing estimated.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <div className="flex-1">{children}</div>
        <footer className="mx-auto w-full max-w-5xl px-4 py-10 text-sm text-muted sm:px-6">
          <div className="flex flex-col gap-2 border-t border-line pt-6 sm:flex-row sm:justify-between">
            <p>
              Data from the npm registry and downloads API. Nothing estimated, nothing guessed.
            </p>
            <Link href="/" className="text-ink-2 hover:text-ink">
              shipstat
            </Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
