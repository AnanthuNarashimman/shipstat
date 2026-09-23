import Link from "next/link";

import { SearchBox } from "@/components/SearchBox";

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col px-4 pt-[18vh] sm:px-6">
      <Link href="/" className="text-sm font-medium tracking-wide text-accent">
        shipstat
      </Link>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink">No package by that name</h1>
      <p className="mt-3 text-ink-2">
        npm doesn&apos;t have a package with that name, or it was unpublished. Names are exact, so check the spelling
        and the scope.
      </p>
      <div className="mt-8">
        <SearchBox autoFocus />
      </div>
    </main>
  );
}
