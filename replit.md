# AIFirstCrypto Workspace

## Overview

pnpm workspace monorepo using TypeScript. Mobile-first crypto dashboard — AIFirstCrypto.

## Product

**AIFirstCrypto** — A daily crypto dashboard for beginner/retail users. Helps users check live crypto rates, market sentiment, top movers, and plain-English context in under 60 seconds. No login required. No wallet connect. No trading.

### Pages
- `/` — Home dashboard (global market snapshot, Fear & Greed, top movers, market summary)
- `/rates` — Live sortable/searchable coin table (top 100)
- `/top-movers` — Top gainers & losers in 24h
- `/fear-greed` — Dedicated Fear & Greed sentiment page with 30-day history chart
- `/coin/:id` — Coin detail with 7-day chart, AI-style summary
- `/watchlist` — Personal watchlist (localStorage-based, no login)
- `/resources` — Resources and digital products section

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

Both APIs are proxied through the Express backend with 1-minute in-memory caching to avoid rate limits.

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
      pages/           # All 7 pages
      components/      # layout, ui components
      lib/             # format utils, watchlist hook
  api-server/          # Express 5 backend (served at /api)
    src/
      routes/          # market.ts, coins.ts, sentiment.ts, health.ts
      lib/             # coingecko.ts, feargreed.ts, summary.ts

lib/
  api-spec/openapi.yaml  # Single source of truth for API contract
  api-client-react/      # Generated React Query hooks
  api-zod/               # Generated Zod schemas for validation
```

## Important Notes

- No database needed — all data fetched from free public APIs
- Watchlist stored in browser localStorage (key: `aifirstcrypto_watchlist`)
- Market summary uses deterministic template logic (no paid LLM)
- API server has in-memory cache (1-5 min TTL) to respect free tier rate limits
- `lib/api-zod/src/index.ts` manually avoids re-exporting types that conflict with Zod schemas (getCoinHistoryParams, getCoinsParams, getFearGreedHistoryParams omitted from types re-export)

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
