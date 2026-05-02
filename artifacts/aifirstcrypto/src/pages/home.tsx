import { useGetGlobalMarket, useGetMarketSummary, useGetTrending, useGetTopMovers, useGetFearGreed, useGetNews } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCompactNumber, formatPercentage } from "@/lib/format";
import { ArrowRight, ChevronRight, TrendingUp, TrendingDown, Clock, Activity, AlertCircle, Newspaper, ExternalLink } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FearGreedGauge } from "@/components/fear-greed-gauge";
import { MarketDominanceChart } from "@/components/market-dominance-chart";

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

export default function Home() {
  const { data: globalMarket, isLoading: loadingMarket, error: errorMarket } = useGetGlobalMarket();
  const { data: marketSummary, isLoading: loadingSummary } = useGetMarketSummary();
  const { data: trendingCoins, isLoading: loadingTrending } = useGetTrending();
  const { data: topMovers, isLoading: loadingMovers } = useGetTopMovers();
  const { data: fearGreed, isLoading: loadingFearGreed } = useGetFearGreed();
  const { data: news, isLoading: loadingNews } = useGetNews({ limit: 12 });

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
          Check crypto in <span className="text-primary">60 seconds</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
          The fastest way to get a pulse on the market. Clear signals, no noise.
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
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    24h Volume
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${formatCompactNumber(globalMarket.total_volume_usd)}</div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    BTC Dominance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{globalMarket.btc_dominance.toFixed(1)}%</div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Active Coins
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
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Activity className="h-5 w-5 text-primary" />
                    Today's Market Summary
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Generated at {new Date(marketSummary.generated_at).toLocaleTimeString()}
                  </CardDescription>
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
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Newspaper className="h-6 w-6 text-primary" />
                Latest Crypto News
              </h2>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-positive" />Bullish</span>
                <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-negative" />Bearish</span>
                <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-muted-foreground" />Neutral</span>
              </div>
            </div>

            {loadingNews ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-28 w-full rounded-xl" />
                ))}
              </div>
            ) : news && news.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {news.map((item, i) => {
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
                      className={`group flex flex-col gap-2 p-4 rounded-xl border border-l-4 border-border/50 hover:border-primary/40 transition-all duration-200 hover:shadow-md ${sentimentColor}`}
                    >
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
                    </a>
                  );
                })}
              </div>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
