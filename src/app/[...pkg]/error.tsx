"use client";

import Link from "next/link";

export default function PackageError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex max-w-2xl flex-col px-4 pt-[18vh] sm:px-6">
      <Link href="/" className="text-sm font-medium tracking-wide text-accent">
        shipstat
      </Link>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink">npm didn&apos;t answer in time</h1>
      <p className="mt-3 text-ink-2">
        The npm API is slow or rate-limiting requests right now. This usually clears up within a minute.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-8 w-fit rounded-lg border border-line bg-surface px-4 py-2 text-sm text-ink transition-colors hover:border-ink-2"
      >
        Try again
      </button>
    </main>
  );
}
