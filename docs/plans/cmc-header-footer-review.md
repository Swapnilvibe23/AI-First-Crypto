# CMC, header, and footer review

Status: chrome fixes applied on `cursor/cmc-chrome-fixes-de5c`. Checked items below are the ones that branch actually implements. Unchecked items were left undone on purpose.

Reviewed: Thursday 15 October 2026, against `main` and the live site `https://aifirstcrypto.com`. The three environment branches (`development-(integration)`, `staging-(pre-production)`, `Production-(Live-branch)`) had the same tree as `origin/main` at review time, so none of them already contained these fixes.

Implementation notes on the fixes branch:

- `CMC_API_KEY` is named in `.env.example` with an empty value. The real key was not read, printed, or committed. Netlify env var values, contexts, and deploys were not changed.
- The quotes check was not run here because this workspace has no `CMC_API_KEY`.
- Trending still returns an empty list. Copy no longer says CoinGecko. No paid trending endpoint was added.
- The newsletter strip is not rendered. `https://aifirstcrypto.beehiiv.com/subscribe` is a 404, and no replacement slug was invented.
- The longer footer disclaimer sentence was kept. Social links and exchange affiliate ids were not added.
- Legal and marketing lines no longer call CoinMarketCap a public browser API or say prices are pulled directly on each visit. Visitors still read the 15-minute ingest snapshot. The DCA history error no longer names a provider.
- `pnpm --filter @workspace/api-spec exec orval --config ./orval.config.ts` was run. A full regenerate also dropped hand-maintained `NewsItem.imageUrl` and integer/coin-id checks in the generated clients, so those files were restored and only the trending description comment was updated to match the spec.

This is the only plan file in the repo. There is no `prd/` directory, no `PLAN.md`, and no ChatPRD document for this product. Related material that this plan does not rewrite:

- Product brief: `attached_assets/Pasted-Build-a-mobile-first-web-app-called-AIFirstCrypto-Core-_1777723675754.txt`
- Workspace notes (stale on the data source): `replit.md`

## What is already true

Production market rates are up. The free basic CoinMarketCap key is stored for the Netlify project `aifirstcrypto` under the env var name `CMC_API_KEY`, scoped to functions, in the production context only. Scheduled ingest `artifacts/aifirstcrypto/netlify/functions/market-ingest.mts` runs every 15 minutes and, on the runs inspected, returned `ok: true` with an empty error list. The public API then served fresh snapshots:

- `GET /api/market/summary` `generated_at`: `2026-10-15T15:15:31.587Z` (matches the 15:15 UTC ingest)
- `GET /api/market/coins`: Bitcoin (BTC) about $82,156 and Ethereum (ETH) about $2,419.64, with logos on `s2.coinmarketcap.com`
- `GET /api/market/global`: total market cap, volume, and BTC dominance returned HTTP 200
- `GET /api/sentiment/fear-greed`: value 53, Neutral, `updated_at` `2026-10-15T15:05:17.846Z` (Alternative.me, separate from CoinMarketCap)

Visitor routes never call CoinMarketCap. They read the Netlify Blobs snapshot written by ingest (`artifacts/api-server/src/api.ts`). Ingest calls listings, global metrics, coin info, and daily history (`artifacts/api-server/src/lib/market-data.ts`). It does not call `/v1/cryptocurrency/quotes/latest`.

A direct unauthenticated call to that quotes endpoint reached CoinMarketCap and was rejected:

- HTTP 401
- `error_code` 1002
- `error_message` "API key missing."
- `status.timestamp` `2026-10-15T15:19:48.874Z`

The production secret is masked in Netlify, so this review did not send it. Do not copy it into the repo, logs, or this plan.

Recent ingest logs show `history_mode: "backfill"` and `errors: []`, including hourly listing refreshes. That means the configured production key is currently allowed to call the endpoints the ingest uses, including daily historical quotes. There was no plan-limit 403 in the runs from 12:45 through 15:15 UTC.

`/api/market/trending` returns `[]` on purpose. `handleApiRequest` comments that trending is not available on the current data plan. The home trending block hides itself when the list is empty.

## Header and footer inventory

Shared chrome is `artifacts/aifirstcrypto/src/components/layout.tsx`, rendered around every route in `artifacts/aifirstcrypto/src/App.tsx`. Checked in Chrome on the live site at 1280px and 390px by clicking the links, not only by reading the markup.

| Section | Control | Target | Status |
| --- | --- | --- | --- |
| Header | AIFirstCrypto mark + wordmark | `/` | Working. Icon plus wordmark, not a separate image logo. |
| Header | Home, Live Rates, Top Movers, Fear & Greed, Compare, DCA Calc, Exchanges, Resources | matching routes | Working on desktop and, after the hamburger opens, on a 390px viewport. Each click landed on a real page heading. |
| Header | Watchlist | none | Missing. The product brief requires it in the top nav. |
| Header | Price alerts bell | no route | Dead as navigation. Click stays on the current page. Alerts are managed on the watchlist page, which is not routed. |
| Header | Mobile menu | same links as desktop | Working. Desktop nav is `display: none` at 390px; opening the menu shows the links; choosing DCA Calc closed the menu and opened the calculator. |
| Under header | Newsletter strip | `https://aifirstcrypto.beehiiv.com/subscribe` | Dead. That URL and the publication root both return HTTP 404. |
| Under header | Cookie banner | Accept / Decline in localStorage | Banner renders and Accept dismisses it. "Privacy Policy" is plain text, not a link. Decline was not clicked separately. |
| Footer | Brand blurb and logo | `/` | Working. |
| Footer | Tools: Live Rates, Top Movers, Fear & Greed, Compare, DCA Calculator | matching routes | Working. |
| Footer | More: Exchanges, Resources | matching routes | Working. Column has no other links. |
| Footer | Legal: Privacy Policy, Terms of Service, Disclaimer | `/privacy`, `/terms`, `/disclaimer` | Working. |
| Footer | Full disclaimer | `/disclaimer` | Working. |
| Footer | Watchlist | none | Missing, including while `public/sitemap.xml` lists `/watchlist`. |
| Footer | Social links | none | Absent. The brief does not require them in the footer. |
| Footer | Attribution | `https://www.coingecko.com` | Wrong source. Live text is "Market data sourced from CoinGecko. © 2026 AIFirstCrypto. All rights reserved." |
| Footer | Back to top | scroll to top | Wired in `scroll-to-top.tsx`. Not scrolled far enough in the browser to see the button appear. |

`/watchlist` and the Resources card "View Watchlist" both render "Page not found". `artifacts/aifirstcrypto/src/pages/watchlist.tsx` exists and includes the price-alert list, but `App.tsx` never registers the route.

## Product brief mismatches

The brief in `attached_assets/Pasted-Build-a-mobile-first-web-app-called-AIFirstCrypto-Core-_1777723675754.txt` still describes the original MVP:

- Line 43: "CoinGecko free/demo API for live prices, markets, trending, historical data, global market data."
- Lines 88–89: footer disclaimer "This platform is for educational and informational purposes only. Not financial advice."
- Lines 83–86: home CTAs include View Live Rates, View Top Movers, Save Your Watchlist, and Explore Resources. The home hero currently has only "View Live Rates".
- Lines 150–159 and 248: a `/watchlist` page stored in localStorage.
- Lines 199–206: top nav includes Home, Live Rates, Top Movers, Fear & Greed, Watchlist, and Resources.

The backend has since moved to CoinMarketCap (`artifacts/api-server/src/lib/market-data.ts`) while user-facing copy still says CoinGecko. For attribution, follow the current provider and this review: CoinMarketCap. That supersedes the brief's CoinGecko line. Fear & Greed from Alternative.me still matches the brief.

The live disclaimer is present and links to `/disclaimer`, but the wording is "For educational purposes only · Not financial advice · Crypto is volatile, DYOR · Some links are affiliate." It is not the brief's single sentence.

`replit.md` still says market data comes from CoinGecko with no API key, and it still describes `coingecko.ts`. That file is gone.

## Recommended fixes (pending approval)

Do not mark these done until they are implemented and checked.

### a. CoinMarketCap key and live rates

Production rates do not need an application-code change. The key is present for production functions and ingest is succeeding.

- [x] Leave `CMC_API_KEY` out of git. Do not print the value or the `X-CMC_PRO_API_KEY` header.
- [ ] In the Netlify UI for project `aifirstcrypto`, the production context has the secret and these contexts are empty: `dev`, `branch-deploy`, `deploy-preview`, `dev-server`. After approval, copy the production value into any context that should run ingest. Keep the scope on functions so the browser bundle never receives the key. Not done: env values were not changed.
- [x] This workspace has no `CMC_API_KEY` in the environment and the repo has no `.env.example`. After approval, add an example that names `CMC_API_KEY` with an empty value, and set the real value only in the local secret store.
- [x] There is no `wrangler.toml` and no Cloudflare Worker for this app. The public site responds with `server: Netlify`. No Cloudflare change is required for rates.
- [ ] Confirm the free basic quotes endpoint with the configured key, without logging the key. Run this only where `CMC_API_KEY` is already set:

```bash
python3 - << 'PY'
import os, json, urllib.request
key = os.environ.get("CMC_API_KEY")
if not key:
    raise SystemExit("CMC_API_KEY missing")
req = urllib.request.Request(
    "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=BTC,ETH&convert=USD",
    headers={"Accept": "application/json", "X-CMC_PRO_API_KEY": key},
)
with urllib.request.urlopen(req) as resp:
    body = json.load(resp)
status = body.get("status") or {}
print("http", resp.status)
print("error_code", status.get("error_code"))
print("error_message", status.get("error_message"))
print("timestamp", status.get("timestamp"))
for symbol, row in (body.get("data") or {}).items():
    usd = (row.get("quote") or {}).get("USD") or {}
    print(symbol, usd.get("last_updated"), usd.get("price"))
PY
```

Success is HTTP 200, `error_code` 0, symbols BTC and ETH, and a recent `last_updated`. If the body says the plan cannot access that endpoint, stop and keep the current listings ingest, which is already allowed. Do not point visitor traffic at CoinMarketCap; keep the 15-minute ingest.

- [x] Trending stays empty on this plan. Either leave the hidden empty state, or remove CoinGecko trending copy so it cannot reappear if a non-empty payload is added later. Do not call a paid trending endpoint unless a higher plan is approved.

### b. Header gaps

- [x] Register the watchlist route in `artifacts/aifirstcrypto/src/App.tsx`: import `@/pages/watchlist` and add `<Route path="/watchlist" component={Watchlist} />` before the not-found route.
- [x] Add Watchlist to the `links` array in `layout.tsx` (desktop and mobile share that array). Use a lucide icon already consistent with the nav, such as `Bookmark`.
- [x] Make the price-alerts bell navigate to `/watchlist`, where active alerts are listed, and keep `closeMenu` so the mobile menu shuts. Keep the badge and tooltip.
- [x] Replace or hide the newsletter URL in `artifacts/aifirstcrypto/src/components/newsletter-strip.tsx`. `https://aifirstcrypto.beehiiv.com/subscribe` returns 404. Do not invent a slug. Use the real Beehiiv publication URL after it is confirmed, or do not render the strip until that URL returns a successful page.
- [x] In the cookie banner, link the words "Privacy Policy" to `/privacy` with the existing wouter `Link`.

### c. Footer gaps and CoinMarketCap attribution

File: `artifacts/aifirstcrypto/src/components/layout.tsx`, the paragraph at lines 276–279.

Current live sentence: "Market data sourced from CoinGecko. © 2026 AIFirstCrypto. All rights reserved."

The year is `new Date().getFullYear()`, which renders 2026 today. Keep that expression.

Link the provider name only, using the same treatment as the current CoinGecko anchor: visible text `CoinMarketCap`, `href="https://coinmarketcap.com/"`, `target="_blank"`, `rel="noopener noreferrer"`, `className="underline hover:text-foreground"`.

Resulting paragraph:

```tsx
<p className="text-[11px] text-muted-foreground">
  Market data sourced from{" "}
  <a
    href="https://coinmarketcap.com/"
    target="_blank"
    rel="noopener noreferrer"
    className="underline hover:text-foreground"
  >
    CoinMarketCap
  </a>
  .
  {" "}&copy; {new Date().getFullYear()} AIFirstCrypto. All rights reserved.
</p>
```

That renders "Market data sourced from CoinMarketCap. © 2026 AIFirstCrypto. All rights reserved." Keep the existing rights clause. The requested source sentence is the part that replaces "Market data sourced from CoinGecko. © 2026".

- [x] Add `{ href: "/watchlist", label: "Watchlist" }` to the footer Tools list in the same file, after the route exists.
- [x] Update the other user-facing CoinGecko attribution so the footer is not the only corrected line. Same approval, same provider name, and link CoinMarketCap to `https://coinmarketcap.com/` where a source is named as a link. Do not leave legal pages naming a provider the app no longer calls.

| File | Lines | What it says now |
| --- | --- | --- |
| `artifacts/aifirstcrypto/src/components/layout.tsx` | 277–278 | Footer link to CoinGecko. This is the line to replace as specified above. |
| `artifacts/aifirstcrypto/src/pages/home.tsx` | 440, 441, 520, 610, 1020, 1023, 1115 | Trending and FAQ copy attributing prices to CoinGecko. FAQ should say CoinMarketCap for prices and Alternative.me for Fear & Greed. |
| `artifacts/aifirstcrypto/src/pages/fear-greed.tsx` | 500, 503, 576 | "Most searched coins on CoinGecko" and "Source: CoinGecko". |
| `artifacts/aifirstcrypto/src/pages/privacy.tsx` | 56 | "We use CoinGecko's public API for all market data." |
| `artifacts/aifirstcrypto/src/pages/terms.tsx` | 37, 69 | Market data "including CoinGecko" and "sourced from CoinGecko". |
| `artifacts/aifirstcrypto/src/pages/disclaimer.tsx` | 62 | "sourced from CoinGecko's public API". |
| `artifacts/aifirstcrypto/src/pages/dca.tsx` | 648 | Error text "CoinGecko may be rate-limiting". |
| `artifacts/aifirstcrypto/src/components/top-movers-story-card.tsx` | 341 | "Data: CoinGecko". |
| `artifacts/aifirstcrypto/src/components/dca-story-card.tsx` | 407 | "Data: CoinGecko". |
| `lib/api-spec/openapi.yaml` | 91 | Trending described as CoinGecko. Regenerate clients after the spec comment changes. |
| `replit.md` | 38–50, 67–70, 117 | Still documents CoinGecko and a missing `coingecko.ts`. |

Generated comments in `lib/api-client-react/src/generated/api.ts` and `lib/api-zod/src/generated/api.ts` repeat the OpenAPI trending line. Change the spec, then regenerate, rather than hand-editing generated files.

`artifacts/aifirstcrypto/src/data/coin-descriptions.ts` only mentions CoinGecko in a code comment about ids. No user-facing change is required there.

### d. Brief mismatches to decide with the copy change

- [x] Home hero: add the missing brief CTAs "View Top Movers" (`/top-movers`), "Save Your Watchlist" (`/watchlist`), and "Explore Resources" (`/resources`) next to the existing "View Live Rates" button, once `/watchlist` is routed.
- [x] Footer disclaimer: keep the current longer sentence unless the brief's exact sentence should replace it. The current sentence already covers education, not-advice, volatility, and affiliate links, and it links to the full disclaimer.
- [x] Social links: add them only if real profile URLs are supplied. Do not add `href="#"`. None were supplied, so none were added.
- [x] Exchange cards linked from the footer use generic signup URLs, and `exchanges.tsx` still says to replace them with affiliate tracking URLs. That is separate from the footer wiring. Do not invent affiliate ids.

## How to verify after approval

1. Repeat the quotes script above and confirm `error_code` 0 without printing the key.
2. Load `/`, `/rates`, and `/watchlist` on desktop and at 390px. Header includes Watchlist. The bell opens `/watchlist`. The hamburger reaches the same pages.
3. Footer reads "Market data sourced from CoinMarketCap." The name links to `https://coinmarketcap.com/` and opens in a new tab. Copyright still shows the current year and "AIFirstCrypto. All rights reserved."
4. Click every footer link, including Watchlist, Privacy, Terms, and Disclaimer.
5. Newsletter either opens a live Beehiiv page or is hidden.
6. Cookie banner "Privacy Policy" opens `/privacy`.
7. Search the UI for "CoinGecko" and expect no remaining user-facing hits.
