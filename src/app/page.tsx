import Link from "next/link";

import { SearchBox } from "@/components/SearchBox";
import { packagesAnalyzed } from "@/lib/counter";
import { formatFull } from "@/lib/format";
import { packagePath } from "@/lib/site";

export const revalidate = 600;

const EXAMPLES = ["react", "zod", "vite", "@tanstack/react-query", "hono"];

export default async function Home() {
  const analyzed = await packagesAnalyzed();

  return (
    <main className="mx-auto flex max-w-2xl flex-col px-4 pt-[18vh] sm:px-6">
      <p className="text-sm font-medium tracking-wide text-accent">shipstat</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
        How is your npm package doing?
      </h1>
      <p className="mt-3 text-ink-2">Downloads, trends, releases and version adoption, straight from npm.</p>

      <div className="mt-10">
        <SearchBox autoFocus />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted">Try</span>
        {EXAMPLES.map((name) => (
          <Link
            key={name}
            href={packagePath(name)}
            className="rounded-full border border-line px-3 py-1 text-ink-2 transition-colors hover:border-ink-2 hover:text-ink"
          >
            {name}
          </Link>
        ))}
      </div>

      {analyzed !== null && analyzed > 0 && (
        <p className="mt-16 text-sm text-muted">{formatFull(analyzed)} packages analyzed so far</p>
      )}
    </main>
  );
}
