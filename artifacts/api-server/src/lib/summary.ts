/**
 * Plain-English market summary generator.
 * Uses deterministic template logic — no paid LLM required.
 * Derives commentary from current market data conditions.
 */

interface SummaryInput {
  btcDominance: number;
  marketCapChange24h: number;
  totalVolume: number;
  fearGreedValue: number;
  topGainerChange: number;
  topLoserChange: number;
}

export function generateMarketSummary(input: SummaryInput): string {
  const parts: string[] = [];
  const { btcDominance, marketCapChange24h, fearGreedValue, topGainerChange, topLoserChange } = input;

  // Overall market direction
  if (marketCapChange24h > 3) {
    parts.push("The overall crypto market is showing strong upward momentum today, with total market cap rising significantly.");
  } else if (marketCapChange24h > 0.5) {
    parts.push("Crypto markets are trading slightly higher today, with broad-based gains across most assets.");
  } else if (marketCapChange24h < -3) {
    parts.push("Markets are under notable pressure today, with the total crypto market cap declining sharply.");
  } else if (marketCapChange24h < -0.5) {
    parts.push("The market is seeing mild selling pressure today, with modest losses across most coins.");
  } else {
    parts.push("Crypto markets are relatively flat today, trading in a tight range without a clear direction.");
  }

  // BTC dominance
  if (btcDominance > 55) {
    parts.push("Bitcoin dominance is elevated, suggesting capital is rotating toward BTC and away from altcoins.");
  } else if (btcDominance < 40) {
    parts.push("Bitcoin dominance is low, indicating altcoins are capturing a larger share of market activity — a potential altseason signal.");
  } else {
    parts.push(`Bitcoin holds about ${btcDominance.toFixed(1)}% market dominance, reflecting a balanced mix of BTC and altcoin interest.`);
  }

  // Sentiment
  if (fearGreedValue <= 20) {
    parts.push("Sentiment is at Extreme Fear — historically a zone where long-term buyers look for opportunities, though short-term volatility often remains high.");
  } else if (fearGreedValue <= 40) {
    parts.push("The Fear & Greed index shows Fear in the market. Caution is the prevailing mood among participants.");
  } else if (fearGreedValue <= 60) {
    parts.push("Sentiment is neutral — neither widespread panic nor excessive optimism is driving the market right now.");
  } else if (fearGreedValue <= 80) {
    parts.push("Greed is building in the market. Participants are generally optimistic, which can sustain momentum but also increase risk.");
  } else {
    parts.push("Extreme Greed is present — markets are in highly optimistic territory, which has historically preceded corrections.");
  }

  // Top movers
  if (topGainerChange > 20) {
    parts.push(`Some coins are posting outsized gains of ${topGainerChange.toFixed(1)}%+, suggesting elevated speculative activity in select assets.`);
  }
  if (Math.abs(topLoserChange) > 15) {
    parts.push(`The biggest losers are down as much as ${Math.abs(topLoserChange).toFixed(1)}%, indicating sharp risk-off moves in certain coins.`);
  }

  parts.push("This summary is for informational purposes only and is not financial advice.");

  return parts.join(" ");
}
