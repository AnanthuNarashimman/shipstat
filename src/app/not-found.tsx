import { DidYouMean } from "@/components/DidYouMean";
import { Logo } from "@/components/Logo";
import { SearchBox } from "@/components/SearchBox";

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col px-4 pt-[14vh] pb-16 sm:px-6">
      <Logo size="sm" />
      <h1 className="mt-8 text-3xl font-bold tracking-tight text-ink">No package by that name</h1>
      <p className="mt-3 text-ink-2">
        npm doesn&apos;t have a package with that name, or it was unpublished. Check the spelling and the scope, or
        pick one of the close matches below.
      </p>
      <div className="mt-8">
        {/* No autofocus: on phones the keyboard would cover the suggestions */}
        <SearchBox />
      </div>
      <DidYouMean />
    </main>
  );
}
