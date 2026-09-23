import { NpmError, searchPackages } from "@/lib/npm";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2 || q.length > 214) return Response.json({ results: [] });

  try {
    const results = await searchPackages(q);
    return Response.json(
      { results },
      { headers: { "cache-control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
    );
  } catch (e) {
    if (e instanceof NpmError) return Response.json({ results: [], error: "npm search is unavailable" }, { status: 502 });
    throw e;
  }
}
