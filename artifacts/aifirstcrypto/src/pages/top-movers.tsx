import { useState } from "react";
import { useGetTopMovers } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { formatPrice, formatPercentage, formatCompactNumber } from "@/lib/format";
import { TrendingUp, TrendingDown, Star, Share2, Copy, Check, Twitter } from "lucide-react";
import { InfoTooltip } from "@/components/info-tooltip";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { useWatchlist } from "@/hooks/use-watchlist";
import { Button } from "@/components/ui/button";
import { MoversBarChart } from "@/components/movers-bar-chart";

const SITE_URL = "AIFirstCrypto.com";

interface MoverCoin {
  id: string;
  name: string;
  symbol: string;
  current_price: number;
  price_change_percentage_24h?: number | null;
  total_volume: number;
  image: string;
}

function buildGainersText(gainers: MoverCoin[]): string {
  const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const lines = gainers.slice(0, 5).map((c, i) =>
    `${i + 1}. ${c.name} (${c.symbol.toUpperCase()}) ${formatPercentage(c.price_change_percentage_24h)} — ${formatPrice(c.current_price)}`
  );
  return [
    `🚀 Today's Top Crypto Gainers (${today})`,
    ``,
    ...lines,
    ``,
    `Track live movers, market sentiment & price alerts 👇`,
    `${SITE_URL}/top-movers`,
    ``,
    `#crypto #cryptotracker #altcoins #gainers #bitcoin #todayinCrypto`,
  ].join("\n");
}

function buildLosersText(losers: MoverCoin[]): string {
  const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const lines = losers.slice(0, 5).map((c, i) =>
    `${i + 1}. ${c.name} (${c.symbol.toUpperCase()}) ${formatPercentage(c.price_change_percentage_24h)} — ${formatPrice(c.current_price)}`
  );
  return [
    `📉 Today's Top Crypto Losers (${today})`,
    ``,
    ...lines,
    ``,
    `Track live movers, market sentiment & price alerts 👇`,
    `${SITE_URL}/top-movers`,
    ``,
    `#crypto #cryptotracker #altcoins #losers #bitcoin #todayinCrypto`,
  ].join("\n");
}

function ShareMoversButton({ type, coins }: { type: "gainers" | "losers"; coins: MoverCoin[] }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const isGainers = type === "gainers";
  const text = isGainers ? buildGainersText(coins) : buildLosersText(coins);
  const label = isGainers ? "Share Gainers" : "Share Losers";
  const color = isGainers ? "text-green-400" : "text-red-400";

  function copyText() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  function shareTwitter() {
    // Twitter limit: 280 chars — use a shorter version for the tweet
    const top3 = coins.slice(0, 3);
    const snippet = top3
      .map((c) => `${c.symbol.toUpperCase()} ${formatPercentage(c.price_change_percentage_24h)}`)
      .join(" · ");
    const emoji = isGainers ? "🚀" : "📉";
    const word = isGainers ? "Gainers" : "Losers";
    const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const tweet = `${emoji} Today's Top Crypto ${word} (${today})\n\n${snippet}\n\nFull list + live prices at ${SITE_URL}/top-movers\n\n#crypto #${word.toLowerCase()}`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}`,
      "_blank",
      "noopener,noreferrer"
    );
    setOpen(false);
  }

  if (coins.length === 0) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className={`rounded-full h-8 gap-1.5 text-xs border-border/60 ${color} hover:text-foreground`}>
          <Share2 className="h-3.5 w-3.5" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-68 p-3" align="start" sideOffset={8}>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
          Share Today's {isGainers ? "Gainers" : "Losers"}
        </p>

        {/* Preview snippet */}
        <div className="mb-3 rounded-lg border border-border/50 bg-muted/30 px-3 py-2 space-y-0.5">
          {coins.slice(0, 3).map((c) => (
            <div key={c.id} className="flex items-center justify-between text-xs">
              <span className="font-medium">{c.symbol.toUpperCase()}</span>
              <span className={`font-bold ${isGainers ? "text-green-400" : "text-red-400"}`}>
                {formatPercentage(c.price_change_percentage_24h)}
              </span>
            </div>
          ))}
          {coins.length > 3 && (
            <p className="text-[10px] text-muted-foreground pt-0.5">+{coins.length - 3} more in full post</p>
          )}
        </div>

        <div className="space-y-1.5">
          {/* Copy for Instagram */}
          <button
            onClick={copyText}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left border ${
              copied
                ? "bg-green-500/10 text-green-400 border-green-500/30"
                : "hover:bg-muted/60 border-transparent"
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
              <div className="font-semibold text-sm leading-tight">
                {copied ? "Copied!" : "Copy for Instagram"}
              </div>
              <div className="text-xs text-muted-foreground leading-tight mt-0.5">
                {copied ? "Paste into your story or caption" : "Full list + hashtags, ready to paste"}
              </div>
            </div>
          </button>

          {/* Twitter / X */}
          <button
            onClick={shareTwitter}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-muted/60 transition-colors text-left border border-transparent"
          >
            <div className="h-4 w-4 flex-shrink-0 rounded-sm bg-black flex items-center justify-center border border-border">
              <Twitter className="h-2.5 w-2.5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-sm leading-tight">Share on X (Twitter)</div>
              <div className="text-xs text-muted-foreground leading-tight mt-0.5">Top 3 in a pre-filled tweet</div>
            </div>
            <Share2 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 ml-auto" />
          </button>
        </div>

        <p className="text-[10px] text-muted-foreground mt-3 px-1 leading-snug">
          Data from AIFirstCrypto. Not financial advice.
        </p>
      </PopoverContent>
    </Popover>
  );
}

export default function TopMovers() {
  const { data: movers, isLoading } = useGetTopMovers();
  const { isInWatchlist, toggleCoin } = useWatchlist();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Top Movers</h1>
          <p className="text-muted-foreground mt-1">Biggest 24h gainers and losers in the market</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2"><TrendingUp className="text-positive" /> Top Gainers</h2>
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2"><TrendingDown className="text-negative" /> Top Losers</h2>
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Top Movers</h1>
        <p className="text-muted-foreground mt-1">Biggest 24h gainers and losers in the market</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-bold flex items-center gap-2 text-positive">
              <TrendingUp className="h-6 w-6" /> Top Gainers
            </h2>
            <ShareMoversButton type="gainers" coins={movers?.gainers ?? []} />
          </div>
          <div className="space-y-3">
            {movers?.gainers.map((coin) => (
              <Card key={coin.id} className="hover:border-positive/50 transition-colors bg-card/50 backdrop-blur-sm border-border/50">
                <CardContent className="p-4 flex items-center justify-between">
                  <Link href={`/coin/${coin.id}`} className="flex items-center gap-4 flex-1">
                    <img src={coin.image} alt={coin.name} className="h-10 w-10 rounded-full" />
                    <div>
                      <div className="font-bold flex items-center gap-2">
                        {coin.name} <span className="text-xs text-muted-foreground uppercase font-medium">{coin.symbol}</span>
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        Vol: ${formatCompactNumber(coin.total_volume)}
                        <InfoTooltip content="24-hour trading volume in USD. High volume on a gaining coin suggests real buying pressure." />
                      </div>
                    </div>
                  </Link>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-bold">{formatPrice(coin.current_price)}</div>
                      <div className="text-sm font-bold text-positive bg-positive-muted px-2 py-0.5 rounded text-right inline-block mt-1">
                        {formatPercentage(coin.price_change_percentage_24h)}
                      </div>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={(e) => {
                            e.preventDefault();
                            toggleCoin(coin.id);
                          }}
                          className={isInWatchlist(coin.id) ? "text-primary" : "text-muted-foreground"}
                        >
                          <Star className={`h-5 w-5 ${isInWatchlist(coin.id) ? "fill-current" : ""}`} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        {isInWatchlist(coin.id) ? "Remove from watchlist" : "Add to watchlist"}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </CardContent>
              </Card>
            ))}
            {movers?.gainers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground bg-card/20 rounded-xl border border-border/50 border-dashed">
                No significant gainers today.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-bold flex items-center gap-2 text-negative">
              <TrendingDown className="h-6 w-6" /> Top Losers
            </h2>
            <ShareMoversButton type="losers" coins={movers?.losers ?? []} />
          </div>
          <div className="space-y-3">
            {movers?.losers.map((coin) => (
              <Card key={coin.id} className="hover:border-negative/50 transition-colors bg-card/50 backdrop-blur-sm border-border/50">
                <CardContent className="p-4 flex items-center justify-between">
                  <Link href={`/coin/${coin.id}`} className="flex items-center gap-4 flex-1">
                    <img src={coin.image} alt={coin.name} className="h-10 w-10 rounded-full" />
                    <div>
                      <div className="font-bold flex items-center gap-2">
                        {coin.name} <span className="text-xs text-muted-foreground uppercase font-medium">{coin.symbol}</span>
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        Vol: ${formatCompactNumber(coin.total_volume)}
                        <InfoTooltip content="24-hour trading volume in USD. High volume on a falling coin can indicate heavy sell pressure." />
                      </div>
                    </div>
                  </Link>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-bold">{formatPrice(coin.current_price)}</div>
                      <div className="text-sm font-bold text-negative bg-negative-muted px-2 py-0.5 rounded text-right inline-block mt-1">
                        {formatPercentage(coin.price_change_percentage_24h)}
                      </div>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={(e) => {
                            e.preventDefault();
                            toggleCoin(coin.id);
                          }}
                          className={isInWatchlist(coin.id) ? "text-primary" : "text-muted-foreground"}
                        >
                          <Star className={`h-5 w-5 ${isInWatchlist(coin.id) ? "fill-current" : ""}`} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        {isInWatchlist(coin.id) ? "Remove from watchlist" : "Add to watchlist"}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </CardContent>
              </Card>
            ))}
            {movers?.losers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground bg-card/20 rounded-xl border border-border/50 border-dashed">
                No significant losers today.
              </div>
            )}
          </div>
        </div>
      </div>

      {movers && (movers.gainers.length > 0 || movers.losers.length > 0) && (
        <Card className="w-full">
          <CardHeader>
            <CardTitle>24h Performance Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <MoversBarChart gainers={movers.gainers} losers={movers.losers} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
