import type { CoinRecord } from "./market-data";

export function dedupeByRank(coins: CoinRecord[]): CoinRecord[] {
  const seen = new Set<string>();
  return coins
    .filter((coin) => (seen.has(coin.id) ? false : (seen.add(coin.id), true)))
    .sort((a, b) => a.market_cap_rank - b.market_cap_rank);
}

/**
 * Listings fetched successfully in this run.
 * `dedupeByRank` keeps the first copy, so a stale stored coin must not be
 * placed ahead of a fresh one with the same id.
 */
export function freshListingCoins(
  top: CoinRecord[],
  topFresh: boolean,
  rest: CoinRecord[],
  restFresh: boolean,
): CoinRecord[] {
  return dedupeByRank([...(topFresh ? top : []), ...(restFresh ? rest : [])]);
}
