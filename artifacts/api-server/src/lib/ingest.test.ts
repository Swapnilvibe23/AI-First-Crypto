import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { CoinRecord } from "./market-data.ts";
import { freshListingCoins } from "./listing-coins.ts";

function coin(id: string, price: number, rank: number): CoinRecord {
  return {
    cmc_id: rank,
    id,
    symbol: id,
    name: id,
    image: "",
    current_price: price,
    market_cap: 0,
    market_cap_rank: rank,
    total_volume: 0,
    price_change_percentage_24h: null,
    price_change_percentage_7d: null,
    circulating_supply: null,
    max_supply: null,
  };
}

describe("freshListingCoins", () => {
  const staleTop = [coin("bitcoin", 100, 1), coin("moved", 10, 50)];
  const freshTop = [coin("bitcoin", 125, 1)];
  const staleRest = [coin("cardano", 1, 150)];
  const freshRest = [coin("cardano", 2, 150), coin("moved", 12, 120)];

  it("returns no coins when both listings fetches fail", () => {
    assert.deepEqual(freshListingCoins(staleTop, false, staleRest, false), []);
  });

  it("keeps only the list that was fetched in this run", () => {
    assert.deepEqual(
      freshListingCoins(staleTop, false, freshRest, true).map((item) => [
        item.id,
        item.current_price,
      ]),
      [
        ["moved", 12],
        ["cardano", 2],
      ],
    );
    assert.deepEqual(
      freshListingCoins(freshTop, true, staleRest, false).map(
        (item) => item.id,
      ),
      ["bitcoin"],
    );
  });

  it("uses the fresh record when a stale snapshot shares an id", () => {
    const selected = freshListingCoins(staleTop, false, freshRest, true);
    const moved = selected.find((item) => item.id === "moved");
    assert.equal(moved?.current_price, 12);
    assert.equal(moved?.market_cap_rank, 120);
  });

  it("prefers the top listing when both fetches succeeded", () => {
    const selected = freshListingCoins(
      [coin("bitcoin", 125, 1)],
      true,
      [coin("bitcoin", 90, 1), coin("cardano", 2, 150)],
      true,
    );
    assert.deepEqual(
      selected.map((item) => [item.id, item.current_price]),
      [
        ["bitcoin", 125],
        ["cardano", 2],
      ],
    );
  });
});
