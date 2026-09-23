# shipstat

Download stats for any npm package: weekly trend, daily chart with release markers, version adoption,
release cadence, and a shareable card. Everything shown comes from npm; nothing is estimated.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

## How it works

- `/<package>` and `/@scope/<package>` render on first visit and are cached for 6 hours (ISR).
- `src/lib/report.ts` builds one cached report per package from the npm registry and downloads API.
  History is fetched in fixed 500-day windows (the API truncates longer ranges); past windows cache for a week.
- Days where npm reports 0 across an otherwise busy stretch are treated as npm data gaps, not real zeros.
  Trends compare only days with data; gaps are labeled on the chart.
- `/api/card/<package>` renders the share card PNG (`?format=square`, `?download=1`). It is also the page's
  Open Graph image.
- `/api/search?q=` proxies npm search for the autocomplete.

## Deploy

Push to GitHub and import the repo in Vercel; no configuration is needed. See `.env.example` for the
optional site URL and the optional Upstash counter.
