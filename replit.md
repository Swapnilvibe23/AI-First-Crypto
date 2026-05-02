# AIFirstCrypto Workspace

## Overview

pnpm workspace monorepo using TypeScript. Mobile-first crypto dashboard — AIFirstCrypto.

## Product

**AIFirstCrypto** — A daily crypto dashboard for beginner/retail users. Helps users check live crypto rates, market sentiment, top movers, and plain-English context in under 60 seconds. No login required. No wallet connect. No trading.

### Pages
- `/` — Home dashboard (global market snapshot, Fear & Greed, top movers, market summary + Share Snapshot button)
- `/rates` — Live sortable/searchable coin table (top 100) with sparklines + heatmap view
- `/top-movers` — Top gainers & losers in 24h with Share Gainers / Share Losers buttons
- `/fear-greed` — Dedicated Fear & Greed sentiment page with 30-day history chart
- `/coin/:id` — Coin detail with 7-day/30-day chart, AI-style summary, Watchlist + Alert + Share + "Compare Exchanges" nudge
- `/watchlist` — Personal watchlist (localStorage), portfolio P&L tracker, price alert management + Share Watchlist button
- `/resources` — Glossary (71 terms, 6 categories, Term of the Day), resource cards
- `/compare` — Overlay up to 3 coins on a normalised % chart with side-by-side metrics
- `/exchanges` — Affiliate exchange comparison: Coinbase, Binance, Kraken, Gemini, Bybit, OKX (cards + comparison table + CTA)
- `/privacy` — Privacy Policy (localStorage-only data, affiliate disclosure, Beehiiv newsletter)
- `/terms` — Terms of Service (no financial advice, affiliate relationships, IP, limitation of liability)
- `/disclaimer` — Full Disclaimer (risk warning, data accuracy, affiliate disclosure, tax notice)

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui + wouter routing
- **Charts**: Recharts
- **API framework**: Express 5
- **Validation**: Zod (`zod/v4`)
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Data Sources (Free Public APIs — No Keys Required)

- **CoinGecko** (`api.coingecko.com/api/v3`) — live prices, market data, trending, coin details, price history
- **Alternative.me** (`api.alternative.me/fng/`) — Fear & Greed index

## Caching Strategy (coingecko.ts)

- In-memory cache with configurable TTL per endpoint
- **Stale-while-revalidate**: expired entries served immediately while background refresh runs
- **In-flight deduplication**: concurrent requests for same URL share one fetch (prevents burst rate-limiting)
- **429 retry**: jittered ~2s retry on rate limit before giving up
- **Stale fallback**: 429/5xx always returns stale cache rather than throwing when data exists
- TTLs: global=2min, coins=1min, trending=2min, coin detail=90s, **coin history=5min**

## Key Features Built

### Social Sharing (Go-to-market)
- **Coin Detail** — `ShareCoinButton`: Instagram caption + Twitter/X intent + native share sheet. Dynamic emoji based on 24h direction.
- **Top Movers** — `ShareMoversButton`: Share Gainers / Share Losers with top-5 list formatted for Instagram + truncated tweet for X.
- **Home** — `ShareSnapshotButton`: Daily market snapshot (market cap, BTC dominance, Fear & Greed, top gainer/loser) for Instagram + tweet.
- **Watchlist** — Share Watchlist button: lists saved coins ($BTC · $ETH …), Instagram caption + Twitter intent + native share.

### Monetisation (Affiliate)
- `/exchanges` page — exchange comparison with affiliate CTAs for Coinbase, Binance, Kraken, Gemini, Bybit, OKX
- Replace `href` values in `exchanges.tsx` EXCHANGES array with real affiliate tracking URLs before launch
- Contextual affiliate nudge on every `/coin/:id` page ("Ready to buy X? Compare exchanges →")
- All affiliate links use `rel="noopener noreferrer sponsored"` and include clear disclosure text

### Legal Pages
- `/privacy` — covers localStorage-only data model, Beehiiv newsletter, CoinGecko, affiliate links
- `/terms` — no-financial-advice, acceptable use, IP, limitation of liability
- `/disclaimer` — risk warning, data accuracy, affiliate disclosure, tax notice
- Footer: 4-column grid (brand · Tools · More · Legal) with links to all three legal pages + CoinGecko attribution

### Price Alerts
- `use-alerts.ts` hook — localStorage-based, checks every 60s via `AlertChecker`
- `PriceAlertDialog` on coin detail — set high/low threshold
- Bell badge in nav when alerts are active
- Browser Notifications API — zero-cost, no backend

### Watchlist & Portfolio
- `use-watchlist.ts` — localStorage (`aifirstcrypto_watchlist`)
- `use-holdings.ts` — purchase price + quantity → live P&L
- Watchlist page shows all saved coins with live prices + P&L

### Content
- Beginner's Glossary: 71 terms, 6 categories (Basics, Market, Technology, Trading, Security, Slang)
- Term of the Day: deterministic rotation via `Math.floor(Date.now() / 86_400_000) % GLOSSARY.length`
- Beehiiv newsletter strip (dismissible, persists via localStorage key `aifirstcrypto_newsletter_dismissed`)

## localStorage Keys

| Key | Purpose |
|-----|---------|
| `aifirstcrypto_watchlist` | Watchlisted coin IDs |
| `aifirstcrypto_alerts` | Price alert thresholds |
| `aifirstcrypto_holdings` | Portfolio purchase data |
| `aifirstcrypto_newsletter_dismissed` | Newsletter strip dismissed state |

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Architecture

```
artifacts/
  aifirstcrypto/       # React + Vite frontend (served at /)
    src/
      pages/           # home, rates, top-movers, fear-greed, coin-detail, watchlist, resources, compare, dca, exchanges, privacy, terms, disclaimer
      components/      # layout, sparkline, share buttons, alert-checker, price-alert-dialog, newsletter-strip
      hooks/           # use-watchlist, use-alerts, use-holdings
      lib/             # format.ts utils
  api-server/          # Express 5 backend (served at /api)
    src/
      routes/          # market.ts, coins.ts, sentiment.ts, health.ts, news.ts
      lib/             # coingecko.ts (with rate-limit resilience), feargreed.ts, summary.ts

lib/
  api-spec/openapi.yaml  # Single source of truth for API contract
  api-client-react/      # Generated React Query hooks
  api-zod/               # Generated Zod schemas for validation
```

## Important Notes

- No database needed — all data fetched from free public APIs
- Market summary uses deterministic template logic (no paid LLM)
- `lib/api-zod/src/index.ts` manually avoids re-exporting types that conflict with Zod schemas
- Sparkline component uses explicit pixel dimensions (not ResponsiveContainer) to avoid Recharts 0x0 warning inside table cells
- BEEHIIV URL in `newsletter-strip.tsx` is a placeholder — replace when ready to launch
