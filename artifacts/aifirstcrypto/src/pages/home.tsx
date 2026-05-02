import { useGetGlobalMarket, useGetMarketSummary, useGetTrending, useGetTopMovers, useGetFearGreed, useGetNews } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatCompactNumber, formatPercentage } from "@/lib/format";
import { ArrowRight, ChevronRight, TrendingUp, TrendingDown, Clock, Activity, AlertCircle, Newspaper, ExternalLink, Zap, Share2, Copy, Check, Twitter } from "lucide-react";
import { InfoTooltip } from "@/components/info-tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FearGreedGauge } from "@/components/fear-greed-gauge";
import { MarketDominanceChart } from "@/components/market-dominance-chart";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useMemo, useState } from "react";

// ── Top Signal helpers ────────────────────────────────────────────────────────

const BULLISH_WORDS = [
  "surge","soar","rally","gain","rise","rises","rose","high","record","bull",
  "bullish","above","break","breaks","launch","adopt","adoption","approve",
  "approves","approved","partnership","positive","growth","all-time","ath",
  "milestone","inflow","buy","pump","rebound","recovery","upgrade","listing","added",
];
const BEARISH_WORDS = [
  "crash","plunge","drop","drops","fall","falls","fell","decline","bear","bearish",
  "below","ban","bans","banned","hack","hacked","exploit","fraud","scam","fear",
  "sec","lawsuit","regulation","crackdown","loss","losses","collapse","sell",
  "dump","low","warning","risk","delisted","delist","fine","penalty",
];

function scoreArticle(title: string) {
  const lower = title.toLowerCase();
  let b = 0, r = 0;
  for (const w of BULLISH_WORDS) if (lower.includes(w)) b++;
  for (const w of BEARISH_WORDS) if (lower.includes(w)) r++;
  return { bullishHits: b, bearishHits: r, total: b + r };
}

// Known coins: [display symbol, ...title keywords to match]
const COIN_MENTIONS: [string, string[]][] = [
  ["BTC",  ["bitcoin", "btc"]],
  ["ETH",  ["ethereum", "eth", "ether"]],
  ["SOL",  ["solana", "sol"]],
  ["XRP",  ["xrp", "ripple"]],
  ["BNB",  ["bnb", "binance"]],
  ["DOGE", ["dogecoin", "doge"]],
  ["ADA",  ["cardano", "ada"]],
  ["AVAX", ["avalanche", "avax"]],
  ["DOT",  ["polkadot", "dot"]],
  ["LINK", ["chainlink", "link"]],
  ["MATIC",["polygon", "matic"]],
  ["UNI",  ["uniswap", "uni"]],
  ["LTC",  ["litecoin", "ltc"]],
  ["SHIB", ["shiba", "shib"]],
  ["STABLECOIN", ["stablecoin", "usdt", "usdc", "tether"]],
];

function detectCoins(title: string): string[] {
  const lower = title.toLowerCase();
  return COIN_MENTIONS
    .filter(([, keywords]) => keywords.some(k => lower.includes(k)))
    .map(([symbol]) => symbol);
}

function DashboardSkeletons() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    </div>
  );
}

const SITE_URL = "AIFirstCrypto.com";

interface SnapshotShareProps {
  marketCap: number;
  marketCapChange: number;
  btcDominance: number;
  fearGreedValue: number | null;
  fearGreedLabel: string | null;
  topGainer: { symbol: string; change: number } | null;
  topLoser: { symbol: string; change: number } | null;
}

function fearGreedEmoji(val: number | null): string {
  if (val == null) return "📊";
  if (val <= 25) return "😱";
  if (val <= 45) return "😟";
  if (val <= 55) return "😐";
  if (val <= 75) return "😀";
  return "🤑";
}

function buildSnapshotInstagram(p: SnapshotShareProps): string {
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const mcDir = p.marketCapChange >= 0 ? "📈" : "📉";
  const fgLine = p.fearGreedValue != null
    ? `${fearGreedEmoji(p.fearGreedValue)} Fear & Greed: ${p.fearGreedValue} — ${p.fearGreedLabel ?? ""}`
    : null;
  const gainerLine = p.topGainer ? `🚀 Top Gainer: ${p.topGainer.symbol.toUpperCase()} +${p.topGainer.change.toFixed(2)}%` : null;
  const loserLine = p.topLoser ? `🔻 Biggest Drop: ${p.topLoser.symbol.toUpperCase()} ${p.topLoser.change.toFixed(2)}%` : null;

  const lines = [
    `📊 Daily Crypto Snapshot — ${today}`,
    ``,
    `💰 Market Cap: $${formatCompactNumber(p.marketCap)} (${mcDir} ${p.marketCapChange >= 0 ? "+" : ""}${p.marketCapChange.toFixed(2)}%)`,
    `🔵 BTC Dominance: ${p.btcDominance.toFixed(1)}%`,
    ...(fgLine ? [fgLine] : []),
    ...(gainerLine ? [gainerLine] : []),
    ...(loserLine ? [loserLine] : []),
    ``,
    `Get your daily snapshot at 👇`,
    SITE_URL,
    ``,
    `#crypto #bitcoin #cryptotracker #dailycrypto #marketupdate #fearandgreed`,
  ];
  return lines.join("\n");
}

function buildSnapshotTweet(p: SnapshotShareProps): string {
  const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const fg = p.fearGreedValue != null ? `${fearGreedEmoji(p.fearGreedValue)} ${p.fearGreedLabel}` : "";
  const gainer = p.topGainer ? `🚀 ${p.topGainer.symbol.toUpperCase()} +${p.topGainer.change.toFixed(1)}%` : "";
  const loser = p.topLoser ? `🔻 ${p.topLoser.symbol.toUpperCase()} ${p.topLoser.change.toFixed(1)}%` : "";
  const parts = [fg, gainer, loser].filter(Boolean).join("  ·  ");
  return `📊 Crypto Market ${today}\n\n💰 $${formatCompactNumber(p.marketCap)}  🔵 BTC ${p.btcDominance.toFixed(1)}%\n${parts}\n\nFull snapshot → ${SITE_URL}\n\n#crypto #dailycrypto`;
}

function ShareSnapshotButton(p: SnapshotShareProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const instagramText = useMemo(() => buildSnapshotInstagram(p), [p.marketCap, p.btcDominance, p.fearGreedValue, p.topGainer?.symbol, p.topLoser?.symbol]);
  const tweetText = useMemo(() => buildSnapshotTweet(p), [p.marketCap, p.btcDominance, p.fearGreedValue, p.topGainer?.symbol, p.topLoser?.symbol]);

  function copyInstagram() {
    navigator.clipboard.writeText(instagramText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  function shareTwitter() {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`, "_blank", "noopener,noreferrer");
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-full gap-1.5 text-xs h-8 border-border/60 text-primary">
          <Share2 className="h-3.5 w-3.5" />
          Share Snapshot
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="end" sideOffset={8}>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
          Share Today's Market Snapshot
        </p>
        {/* Live mini-preview */}
        <div className="mb-3 rounded-lg border border-border/50 bg-muted/30 px-3 py-2 space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Market Cap</span>
            <span className="font-bold">${formatCompactNumber(p.marketCap)}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">BTC Dominance</span>
            <span className="font-bold">{p.btcDominance.toFixed(1)}%</span>
          </div>
          {p.fearGreedValue != null && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Fear & Greed</span>
              <span className="font-bold">{fearGreedEmoji(p.fearGreedValue)} {p.fearGreedLabel}</span>
            </div>
          )}
          {p.topGainer && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Top Gainer</span>
              <span className="font-bold text-green-400">🚀 {p.topGainer.symbol.toUpperCase()} +{p.topGainer.change.toFixed(2)}%</span>
            </div>
          )}
        </div>
        <div className="space-y-1.5">
          <button
            onClick={copyInstagram}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left border ${
              copied ? "bg-green-500/10 text-green-400 border-green-500/30" : "hover:bg-muted/60 border-transparent"
            }`}
          >
            {copied ? (
              <Check className="h-4 w-4 flex-shrink-0 text-green-400" />
            ) : (
              <div className="h-4 w-4 flex-shrink-0 rounded-sm bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center">
                <Copy className="h-2.5 w-2.5 text-white" />
              </div>
            )}
            <div className="min-w-0">
              <div className="font-semibold text-sm leading-tight">{copied ? "Copied!" : "Copy for Instagram"}</div>
              <div className="text-xs text-muted-foreground leading-tight mt-0.5">
                {copied ? "Paste into your caption or story" : "Full snapshot + hashtags"}
              </div>
            </div>
          </button>
          <button
            onClick={shareTwitter}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-muted/60 transition-colors text-left border border-transparent"
          >
            <div className="h-4 w-4 flex-shrink-0 rounded-sm bg-black flex items-center justify-center border border-border">
              <Twitter className="h-2.5 w-2.5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-sm leading-tight">Share on X (Twitter)</div>
              <div className="text-xs text-muted-foreground leading-tight mt-0.5">Pre-filled daily market tweet</div>
            </div>
            <Share2 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 ml-auto" />
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-3 px-1 leading-snug">Not financial advice.</p>
      </PopoverContent>
    </Popover>
  );
}

export default function Home() {
  const { data: globalMarket, isLoading: loadingMarket, error: errorMarket } = useGetGlobalMarket();
  const { data: marketSummary, isLoading: loadingSummary } = useGetMarketSummary();
  const { data: trendingCoins, isLoading: loadingTrending } = useGetTrending();
  const { data: topMovers, isLoading: loadingMovers } = useGetTopMovers();
  const { data: fearGreed, isLoading: loadingFearGreed } = useGetFearGreed();
  const { data: news, isLoading: loadingNews } = useGetNews({ limit: 20 });

  const [coinFilter, setCoinFilter] = useState<string>("All");

  // Compute the highest-impact story from today's news feed
  const topSignal = useMemo(() => {
    if (!news || news.length === 0) return null;
    let best: (typeof news[0] & { score: number; coins: string[] }) | null = null;
    for (const item of news) {
      const { total, bullishHits, bearishHits } = scoreArticle(item.title);
      // Only surface non-neutral stories; require at least 1 keyword hit
      if (total === 0) continue;
      if (!best || total > best.score) {
        best = {
          ...item,
          score: total,
          coins: detectCoins(item.title),
        };
      }
    }
    return best;
  }, [news]);

  if (errorMarket) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Connection Error</AlertTitle>
          <AlertDescription>
            Could not connect to the crypto market data. Please check your connection and try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Hero Section */}
      <section className="py-6 md:py-10 flex flex-col gap-4">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">
          Your daily crypto <span className="text-primary">snapshot</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
          Live prices, market sentiment, and the latest news — all in one place. Clear signals, no noise.
        </p>
        
        <div className="flex flex-wrap gap-3 mt-4">
          <Link href="/rates">
            <Button size="lg" className="rounded-full font-bold">
              View Live Rates <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/watchlist">
            <Button size="lg" variant="secondary" className="rounded-full">
              My Watchlist
            </Button>
          </Link>
        </div>
      </section>

      {/* Global Market Overview */}
      {loadingMarket ? (
        <DashboardSkeletons />
      ) : (
        <>
          {globalMarket && (
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    Market Cap
                    <InfoTooltip content="The total value of all cryptocurrencies combined, in US dollars. Tracks the overall size of the crypto market." />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${formatCompactNumber(globalMarket.total_market_cap_usd)}</div>
                  <p className={`text-xs mt-1 flex items-center ${globalMarket.market_cap_change_percentage_24h >= 0 ? "text-positive" : "text-negative"}`}>
                    {globalMarket.market_cap_change_percentage_24h >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                    {formatPercentage(globalMarket.market_cap_change_percentage_24h)} (24h)
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    24h Volume
                    <InfoTooltip content="The total dollar value of all crypto traded across every exchange in the last 24 hours. High volume = high activity." />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${formatCompactNumber(globalMarket.total_volume_usd)}</div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    BTC Dominance
                    <InfoTooltip content="Bitcoin's share of the total crypto market cap. A rising number means more money is flowing into BTC vs. other coins (altcoins)." />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{globalMarket.btc_dominance.toFixed(1)}%</div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    Active Coins
                    <InfoTooltip content="Total number of cryptocurrencies currently tracked across all exchanges globally." />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{globalMarket.active_cryptocurrencies.toLocaleString()}</div>
                </CardContent>
              </Card>
            </section>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Market Summary */}
            {marketSummary && (
              <Card className="col-span-1 lg:col-span-2 border-primary/20 bg-gradient-to-br from-card to-primary/5">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <Activity className="h-5 w-5 text-primary" />
                        Today's Market Summary
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        Generated at {new Date(marketSummary.generated_at).toLocaleTimeString()}
                      </CardDescription>
                    </div>
                    {globalMarket && (
                      <ShareSnapshotButton
                        marketCap={globalMarket.total_market_cap_usd}
                        marketCapChange={globalMarket.market_cap_change_percentage_24h}
                        btcDominance={globalMarket.btc_dominance}
                        fearGreedValue={fearGreed?.value ?? null}
                        fearGreedLabel={fearGreed?.value_classification ?? null}
                        topGainer={topMovers?.gainers[0]
                          ? { symbol: topMovers.gainers[0].symbol, change: topMovers.gainers[0].price_change_percentage_24h ?? 0 }
                          : null}
                        topLoser={topMovers?.losers[0]
                          ? { symbol: topMovers.losers[0].symbol, change: topMovers.losers[0].price_change_percentage_24h ?? 0 }
                          : null}
                      />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-base leading-relaxed text-foreground/90">
                    {marketSummary.summary}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Market Dominance */}
            {globalMarket && (
              <Card className="col-span-1 flex flex-col hover:border-primary/50 transition-colors">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Market Dominance</CardTitle>
                  <CardDescription>Share of total market cap</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center flex-1">
                  <MarketDominanceChart btcDominance={globalMarket.btc_dominance} />
                </CardContent>
              </Card>
            )}

            {/* Fear & Greed Preview */}
            {fearGreed && (
              <Card className="col-span-1 flex flex-col justify-between hover:border-primary/50 transition-colors">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Fear & Greed</CardTitle>
                  <CardDescription>Market sentiment today</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center flex-1 py-4">
                  <FearGreedGauge value={fearGreed.value} />
                  <div className="mt-4 text-sm font-bold px-3 py-1 rounded-full bg-secondary/50 text-secondary-foreground uppercase tracking-widest text-center">
                    {fearGreed.value_classification}
                  </div>
                </CardContent>
                <div className="p-4 pt-0">
                  <Link href="/fear-greed" className="w-full">
                    <Button variant="outline" className="w-full">
                      View Analysis <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </Card>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Gainers Preview */}
            {topMovers && topMovers.gainers.length > 0 && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-positive" />
                    Top Gainers
                    <InfoTooltip content="Coins with the biggest price increase (%) in the last 24 hours. Click any coin for the full chart." />
                  </CardTitle>
                  <Link href="/top-movers" className="text-sm font-medium text-primary hover:underline">
                    See all
                  </Link>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border/50">
                    {topMovers.gainers.slice(0, 3).map((coin) => (
                      <Link key={coin.id} href={`/coin/${coin.id}`} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <img src={coin.image} alt={coin.name} className="w-8 h-8 rounded-full" />
                          <div>
                            <div className="font-bold text-sm">{coin.symbol.toUpperCase()}</div>
                            <div className="text-xs text-muted-foreground">{coin.name}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-sm">${coin.current_price.toLocaleString(undefined, { maximumFractionDigits: 6 })}</div>
                          <div className="text-xs font-medium text-positive">
                            +{coin.price_change_percentage_24h?.toFixed(2)}%
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Trending Coins Preview */}
            {trendingCoins && trendingCoins.length > 0 && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    🔥 Trending
                    <InfoTooltip content="Coins being searched and viewed the most on CoinGecko right now. Popularity can signal incoming price movement." />
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border/50">
                    {trendingCoins.slice(0, 3).map((coin) => (
                      <Link key={coin.id} href={`/coin/${coin.id}`} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <img src={coin.thumb} alt={coin.name} className="w-8 h-8 rounded-full" />
                          <div>
                            <div className="font-bold text-sm">{coin.symbol.toUpperCase()}</div>
                            <div className="text-xs text-muted-foreground">{coin.name}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          {coin.price_btc && (
                            <div className="font-bold text-sm">{coin.price_btc.toFixed(8)} BTC</div>
                          )}
                          <div className="text-xs text-muted-foreground">
                            Rank #{coin.market_cap_rank || 'N/A'}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* News & Sentiment Section */}
          <div className="space-y-4">
            {/* Header row */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Newspaper className="h-6 w-6 text-primary" />
                Latest Crypto News
              </h2>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-positive" />Bullish</span>
                <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-negative" />Bearish</span>
                <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-muted-foreground" />Neutral</span>
                <InfoTooltip content="Sentiment is auto-detected by scanning article headlines for bullish keywords (rally, surge, gain…) and bearish keywords (crash, ban, hack…). Not financial advice." />
              </div>
            </div>

            {/* ── Coin filter tabs ───────────────────────────────── */}
            {!loadingNews && news && news.length > 0 && (() => {
              // Build the list of coins that appear in today's news
              const mentionedCoins = new Set<string>();
              for (const item of news) {
                for (const sym of detectCoins(item.title)) mentionedCoins.add(sym);
              }
              // Fixed priority order — only show tabs for coins that actually have articles
              const PRIORITY = ["BTC", "ETH", "SOL", "XRP", "BNB", "DOGE", "ADA", "AVAX"];
              const tabs = ["All", ...PRIORITY.filter(s => mentionedCoins.has(s))];
              if (tabs.length <= 1) return null; // no coin-specific articles — skip tabs
              return (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {tabs.map(tab => (
                    <button
                      key={tab}
                      onClick={() => setCoinFilter(tab)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                        coinFilter === tab
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted/50 text-muted-foreground border-border/50 hover:border-primary/40 hover:text-foreground"
                      }`}
                    >
                      {tab === "All" ? "All News" : tab}
                    </button>
                  ))}
                  {coinFilter !== "All" && (
                    <span className="text-xs text-muted-foreground ml-1">
                      — showing articles mentioning {coinFilter}
                    </span>
                  )}
                </div>
              );
            })()}

            {/* ── Today's Top Signal ─────────────────────────────── */}
            {loadingNews ? (
              <Skeleton className="h-28 w-full rounded-xl" />
            ) : topSignal ? (() => {
              const isBullish = topSignal.sentiment === "bullish";
              const isBearish = topSignal.sentiment === "bearish";
              const borderColor = isBullish ? "border-positive/60" : isBearish ? "border-negative/60" : "border-primary/40";
              const bgColor = isBullish ? "from-positive/10 to-card" : isBearish ? "from-negative/10 to-card" : "from-primary/5 to-card";
              const badgeColor = isBullish ? "bg-positive/20 text-positive border-positive/30" : isBearish ? "bg-negative/20 text-negative border-negative/30" : "bg-primary/10 text-primary border-primary/20";
              const SignalIcon = isBullish ? TrendingUp : isBearish ? TrendingDown : Zap;
              const timeAgo = topSignal.pubDate
                ? (() => {
                    const diff = Date.now() - new Date(topSignal.pubDate).getTime();
                    const h = Math.floor(diff / 3_600_000);
                    const m = Math.floor(diff / 60_000);
                    if (h >= 24) return `${Math.floor(h / 24)}d ago`;
                    if (h >= 1) return `${h}h ago`;
                    return `${m}m ago`;
                  })()
                : "";
              return (
                <a
                  href={topSignal.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group block rounded-xl border-2 ${borderColor} bg-gradient-to-r ${bgColor} p-5 hover:shadow-lg transition-all duration-200`}
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${badgeColor} uppercase tracking-wide`}>
                        <Zap className="h-3 w-3" />
                        Today's Top Signal
                      </div>
                      <div className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${badgeColor}`}>
                        <SignalIcon className="h-3 w-3" />
                        {topSignal.sentiment}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {topSignal.coins.slice(0, 4).map(sym => (
                        <Badge key={sym} variant="outline" className="text-xs font-bold px-2 py-0.5 border-border/60">
                          {sym}
                        </Badge>
                      ))}
                      {topSignal.coins.length === 0 && (
                        <Badge variant="outline" className="text-xs text-muted-foreground border-border/40">Crypto Market</Badge>
                      )}
                    </div>
                  </div>

                  <p className="mt-3 text-base font-semibold leading-snug group-hover:text-primary transition-colors">
                    {topSignal.title}
                  </p>

                  <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="font-medium">{topSignal.source}</span>
                    {timeAgo && <><span className="text-muted-foreground/40">·</span><span>{timeAgo}</span></>}
                    <span className="text-muted-foreground/40">·</span>
                    <span>{topSignal.score} signal keyword{topSignal.score !== 1 ? "s" : ""} detected</span>
                    <ExternalLink className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </a>
              );
            })() : null}

            {loadingNews ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-28 w-full rounded-xl" />
                ))}
              </div>
            ) : news && news.length > 0 ? (() => {
              const filteredNews = coinFilter === "All"
                ? news
                : news.filter(item => detectCoins(item.title).includes(coinFilter));
              if (filteredNews.length === 0) {
                return (
                  <div className="text-center py-12 rounded-xl border border-dashed border-border/50 text-muted-foreground">
                    <p className="font-medium">No {coinFilter} articles in today's headlines.</p>
                    <button
                      className="mt-2 text-sm text-primary hover:underline"
                      onClick={() => setCoinFilter("All")}
                    >
                      Show all news
                    </button>
                  </div>
                );
              }
              return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredNews.map((item, i) => {
                  const sentimentColor =
                    item.sentiment === "bullish"
                      ? "border-l-positive bg-positive-muted/20"
                      : item.sentiment === "bearish"
                      ? "border-l-negative bg-negative-muted/20"
                      : "border-l-muted-foreground bg-muted/10";
                  const sentimentBadge =
                    item.sentiment === "bullish"
                      ? "text-positive bg-positive-muted"
                      : item.sentiment === "bearish"
                      ? "text-negative bg-negative-muted"
                      : "text-muted-foreground bg-muted/50";
                  const sentimentIcon =
                    item.sentiment === "bullish" ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : item.sentiment === "bearish" ? (
                      <TrendingDown className="h-3 w-3" />
                    ) : null;

                  const timeAgo = item.pubDate
                    ? (() => {
                        const diff = Date.now() - new Date(item.pubDate).getTime();
                        const h = Math.floor(diff / 3_600_000);
                        const m = Math.floor(diff / 60_000);
                        if (h >= 24) return `${Math.floor(h / 24)}d ago`;
                        if (h >= 1) return `${h}h ago`;
                        return `${m}m ago`;
                      })()
                    : "";

                  return (
                    <a
                      key={i}
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`group flex flex-col rounded-xl border border-l-4 border-border/50 hover:border-primary/40 transition-all duration-200 hover:shadow-md overflow-hidden ${sentimentColor}`}
                    >
                      {/* Article image */}
                      {item.imageUrl && (
                        <div className="w-full h-32 overflow-hidden flex-shrink-0 bg-muted">
                          <img
                            src={item.imageUrl}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = "none"; }}
                          />
                        </div>
                      )}
                      <div className="flex flex-col gap-2 p-4 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold leading-snug line-clamp-3 group-hover:text-primary transition-colors flex-1">
                            {item.title}
                          </p>
                          <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="flex items-center justify-between mt-auto">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground font-medium">{item.source}</span>
                            {timeAgo && (
                              <>
                                <span className="text-muted-foreground/40">·</span>
                                <span className="text-xs text-muted-foreground">{timeAgo}</span>
                              </>
                            )}
                          </div>
                          <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${sentimentBadge}`}>
                            {sentimentIcon}
                            {item.sentiment}
                          </span>
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>
              );
            })() : null}
          </div>
        </>
      )}
    </div>
  );
}
