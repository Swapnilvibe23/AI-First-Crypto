import { useGetCoins } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Link } from "wouter";
import { formatPrice, formatPercentage, formatCompactNumber } from "@/lib/format";
import { TrendingUp, TrendingDown, Star, Search, Bell, Trash2, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useWatchlist } from "@/hooks/use-watchlist";
import { useAlerts } from "@/hooks/use-alerts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Watchlist() {
  const { watchlist, toggleCoin } = useWatchlist();
  const { alerts, removeAlert } = useAlerts();

  const { data: coins, isLoading } = useGetCoins({
    page: 1,
    per_page: 100,
    order: "market_cap_desc"
  });

  const watchlistedCoins = coins?.filter(c => watchlist.includes(c.id)) || [];

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-12">
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

      {/* Price Alerts Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            Price Alerts
          </h2>
          {alerts.length > 0 && (
            <Badge variant="secondary">{alerts.length} active</Badge>
          )}
        </div>

        {alerts.length === 0 ? (
          <Card className="border-dashed border-2 bg-transparent">
            <CardContent className="flex flex-col items-center justify-center space-y-3 py-10">
              <div className="bg-muted p-3 rounded-full">
                <Bell className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="text-center space-y-1">
                <p className="font-semibold">No active alerts</p>
                <p className="text-sm text-muted-foreground">
                  Open any coin detail page and tap "Set Alert" to get notified when a price target is hit.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <Card key={alert.id} className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardContent className="p-4 flex items-center gap-4">
                  <img src={alert.coinImage} alt={alert.coinName} className="h-10 w-10 rounded-full flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold">{alert.coinName}</span>
                      <span className="text-xs text-muted-foreground uppercase">{alert.coinSymbol}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      {alert.direction === "above" ? (
                        <ArrowUpRight className="h-4 w-4 text-positive flex-shrink-0" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-negative flex-shrink-0" />
                      )}
                      <span className="text-sm text-muted-foreground">
                        Notify when price{" "}
                        <span className={`font-semibold ${alert.direction === "above" ? "text-positive" : "text-negative"}`}>
                          {alert.direction === "above" ? "rises above" : "falls below"}
                        </span>{" "}
                        <span className="font-bold text-foreground">{formatPrice(alert.targetPrice)}</span>
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-negative flex-shrink-0"
                    onClick={() => removeAlert(alert.id)}
                    title="Remove alert"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
