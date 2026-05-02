import { useGetTopMovers } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { formatPrice, formatPercentage, formatCompactNumber } from "@/lib/format";
import { TrendingUp, TrendingDown, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useWatchlist } from "@/hooks/use-watchlist";
import { Button } from "@/components/ui/button";

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
          <h2 className="text-2xl font-bold flex items-center gap-2 text-positive">
            <TrendingUp className="h-6 w-6" /> Top Gainers
          </h2>
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
                      <div className="text-sm text-muted-foreground">Vol: ${formatCompactNumber(coin.total_volume)}</div>
                    </div>
                  </Link>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-bold">{formatPrice(coin.current_price)}</div>
                      <div className="text-sm font-bold text-positive bg-positive-muted px-2 py-0.5 rounded text-right inline-block mt-1">
                        +{formatPercentage(coin.price_change_percentage_24h)}
                      </div>
                    </div>
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
          <h2 className="text-2xl font-bold flex items-center gap-2 text-negative">
            <TrendingDown className="h-6 w-6" /> Top Losers
          </h2>
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
                      <div className="text-sm text-muted-foreground">Vol: ${formatCompactNumber(coin.total_volume)}</div>
                    </div>
                  </Link>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-bold">{formatPrice(coin.current_price)}</div>
                      <div className="text-sm font-bold text-negative bg-negative-muted px-2 py-0.5 rounded text-right inline-block mt-1">
                        {formatPercentage(coin.price_change_percentage_24h)}
                      </div>
                    </div>
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
    </div>
  );
}
