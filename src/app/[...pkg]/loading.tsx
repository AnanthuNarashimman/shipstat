export default function Loading() {
  const block = "animate-pulse rounded-2xl border border-line bg-surface";
  return (
    <main className="mx-auto max-w-5xl px-4 sm:px-6" aria-busy="true" aria-label="Loading package stats">
      <div className="h-[68px]" />
      <div className="pt-8 pb-10">
        <div className="h-10 w-64 animate-pulse rounded-lg bg-sunken" />
        <div className="mt-4 h-5 w-96 max-w-full animate-pulse rounded bg-sunken" />
      </div>
      <div className="space-y-5">
        <div className={`${block} h-36`} />
        <div className={`${block} h-[420px]`} />
      </div>
    </main>
  );
}
