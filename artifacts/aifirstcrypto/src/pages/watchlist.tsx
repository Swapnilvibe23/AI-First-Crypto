import { useGetCoins } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Link } from "wouter";
import { formatPrice, formatPercentage, formatCompactNumber } from "@/lib/format";
import { TrendingUp, TrendingDown, Star, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useWatchlist } from "@/hooks/use-watchlist";
import { Button } from "@/components/ui/button";

export default function Watchlist() {
  const { watchlist, toggleCoin, isInWatchlist } = useWatchlist();
  
  // Fetch coins with enough per_page to cover reasonable watchlists
  const { data: coins, isLoading } = useGetCoins({
    page: 1,
    per_page: 100,
    order: "market_cap_desc"
  });

  const watchlistedCoins = coins?.filter(c => watchlist.includes(c.id)) || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Your Watchlist</h1>
        <p className="text-muted-foreground mt-1">Keep track of your favorite cryptocurrencies</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : watchlist.length === 0 ? (
        <Card className="border-dashed border-2 bg-transparent text-center p-12 mt-8">
          <CardContent className="flex flex-col items-center justify-center space-y-4 pt-6">
            <div className="bg-muted p-4 rounded-full">
              <Star className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold">Your watchlist is empty</h2>
              <p className="text-muted-foreground max-w-sm mx-auto">
                Add coins to your watchlist to track their prices and 24h performance all in one place.
              </p>
            </div>
            <Link href="/rates">
              <Button className="mt-4">
                <Search className="mr-2 h-4 w-4" /> Explore Coins
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {watchlistedCoins.map((coin) => (
            <Card key={coin.id} className="hover:border-primary/50 transition-colors relative group bg-card/50 backdrop-blur-sm border-border/50">
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.preventDefault();
                  toggleCoin(coin.id);
                }}
              >
                <Star className="h-4 w-4 fill-primary text-primary" />
              </Button>
              <Link href={`/coin/${coin.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <img src={coin.image} alt={coin.name} className="h-10 w-10 rounded-full" />
                    <div>
                      <div className="font-bold text-lg leading-tight">{coin.name}</div>
                      <div className="text-sm text-muted-foreground uppercase font-medium">{coin.symbol}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-end justify-between mt-6">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Price</div>
                      <div className="text-2xl font-bold">{formatPrice(coin.current_price)}</div>
                    </div>
                    <div className={`flex flex-col items-end ${coin.price_change_percentage_24h && coin.price_change_percentage_24h >= 0 ? "text-positive" : "text-negative"}`}>
                      <div className="text-sm text-muted-foreground mb-1 font-medium text-foreground">24h</div>
                      <div className="font-bold flex items-center bg-background px-2 py-0.5 rounded border border-border">
                        {coin.price_change_percentage_24h && coin.price_change_percentage_24h >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                        {formatPercentage(coin.price_change_percentage_24h)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
