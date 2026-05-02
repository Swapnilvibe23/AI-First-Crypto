import { useState } from "react";
import { useParams, Link } from "wouter";
import { useGetCoinDetail, useGetCoinHistory, getGetCoinDetailQueryKey, getGetCoinHistoryQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatPrice, formatPercentage, formatCompactNumber } from "@/lib/format";
import { TrendingUp, TrendingDown, Star, ArrowLeft, Bot, Globe, AlertCircle } from "lucide-react";
import { InfoTooltip } from "@/components/info-tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useWatchlist } from "@/hooks/use-watchlist";
import { PriceAlertDialog } from "@/components/price-alert-dialog";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function CoinDetail() {
  const params = useParams();
  const id = params.id as string;
  const { isInWatchlist, toggleCoin } = useWatchlist();
  const [days, setDays] = useState<7 | 30>(7);

  const { data: coin, isLoading: loadingCoin, error: errorCoin } = useGetCoinDetail(id, {
    query: { enabled: !!id, queryKey: getGetCoinDetailQueryKey(id) }
  });

  const { data: history, isLoading: loadingHistory } = useGetCoinHistory(id, { days }, {
    query: { enabled: !!id, queryKey: getGetCoinHistoryQueryKey(id, { days }) }
  });

  if (errorCoin) {
    return (
      <div className="space-y-6">
        <Link href="/rates">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Rates
          </Button>
        </Link>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Could not load data for this coin. It might not exist or the API is rate limited.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loadingCoin) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-24 mb-4" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[400px] w-full rounded-xl mt-8" />
      </div>
    );
  }

  if (!coin) return null;

  const chartData = history?.map(pt => ({
    date: format(new Date(pt.timestamp), "MMM d HH:mm"),
    price: pt.price
  })) || [];

  const isPositive24h = coin.price_change_percentage_24h && coin.price_change_percentage_24h >= 0;
  const isPositive7d = coin.price_change_percentage_7d && coin.price_change_percentage_7d >= 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div>
        <Link href="/rates">
          <Button variant="ghost" size="sm" className="mb-4 -ml-3 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Rates
          </Button>
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img src={coin.image} alt={coin.name} className="h-16 w-16 rounded-full bg-muted p-1" />
            <div>
              <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
                {coin.name}
                <span className="text-xl md:text-2xl text-muted-foreground font-medium bg-muted px-2 py-1 rounded-md uppercase">
                  {coin.symbol}
                </span>
                <span className="text-sm font-bold text-primary bg-primary/10 px-2 py-1 rounded-md ml-2 inline-flex items-center gap-1">
                  Rank #{coin.market_cap_rank}
                  <InfoTooltip content="Market cap rank — #1 is the largest cryptocurrency by total value. Lower number = bigger, more well-known coin." />
                </span>
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3 self-start md:self-auto flex-wrap">
            <Button 
              size="lg"
              variant={isInWatchlist(coin.id) ? "secondary" : "default"}
              onClick={() => toggleCoin(coin.id)}
              className="rounded-full shadow-lg"
            >
              <Star className={`mr-2 h-5 w-5 ${isInWatchlist(coin.id) ? "fill-current" : ""}`} />
              {isInWatchlist(coin.id) ? "Watchlisted" : "Watchlist"}
            </Button>
            <PriceAlertDialog
              coinId={coin.id}
              coinName={coin.name}
              coinSymbol={coin.symbol}
              coinImage={coin.image}
              currentPrice={coin.current_price}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              Current Price
              <InfoTooltip content="The latest traded price for this coin, updated in real time." />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-black">{formatPrice(coin.current_price)}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              24h Change
              <InfoTooltip content="How much the price has moved (%) in the last 24 hours. Green = up, red = down." />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold flex items-center ${isPositive24h ? "text-positive" : "text-negative"}`}>
              {isPositive24h ? <TrendingUp className="h-5 w-5 mr-2" /> : <TrendingDown className="h-5 w-5 mr-2" />}
              {formatPercentage(coin.price_change_percentage_24h)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              Market Cap
              <InfoTooltip content="Total market value = current price × circulating supply. Used to rank coins by size — larger market cap = more established." />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${formatCompactNumber(coin.market_cap)}</div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              24h Volume
              <InfoTooltip content="Total dollar value of this coin traded across all exchanges in the last 24 hours. High volume on a price move confirms stronger momentum." />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${formatCompactNumber(coin.total_volume)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <span>{days}-Day Price History</span>
                <div className="flex bg-muted rounded-md p-1">
                  <Button 
                    variant={days === 7 ? "secondary" : "ghost"} 
                    size="sm" 
                    onClick={() => setDays(7)}
                    className="h-7 text-xs"
                  >
                    7D
                  </Button>
                  <Button 
                    variant={days === 30 ? "secondary" : "ghost"} 
                    size="sm" 
                    onClick={() => setDays(30)}
                    className="h-7 text-xs"
                  >
                    30D
                  </Button>
                </div>
              </div>
              <span className={`text-sm px-2 py-1 rounded ${isPositive7d ? "bg-positive-muted text-positive" : "bg-negative-muted text-negative"}`}>
                {formatPercentage(coin.price_change_percentage_7d)}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              {loadingHistory ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isPositive7d ? "#10b981" : "#ef4444"} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={isPositive7d ? "#10b981" : "#ef4444"} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      stroke="var(--muted-foreground)" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                      minTickGap={50}
                    />
                    <YAxis 
                      stroke="var(--muted-foreground)" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(val) => `$${formatCompactNumber(val)}`}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px' }}
                      itemStyle={{ color: 'var(--foreground)' }}
                      formatter={(value: number) => [formatPrice(value), 'Price']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="price" 
                      stroke={isPositive7d ? "#10b981" : "#ef4444"} 
                      strokeWidth={3} 
                      fillOpacity={1}
                      fill="url(#priceGradient)"
                      dot={false}
                      activeDot={{ r: 6, fill: isPositive7d ? "#10b981" : "#ef4444" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bot className="h-5 w-5 text-primary" />
                AI Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-foreground/90">
                {coin.ai_summary}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Supply Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    Circulating Supply
                    <InfoTooltip content="Number of coins currently in circulation and available to trade on the open market." />
                  </span>
                  <span className="font-bold">{coin.circulating_supply ? formatCompactNumber(coin.circulating_supply) : 'Unknown'} <span className="text-xs uppercase">{coin.symbol}</span></span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    Max Supply
                    <InfoTooltip content="The maximum number of coins that will ever exist. 'Uncapped' means there is no hard limit — more can be created over time (e.g. Ethereum)." />
                  </span>
                  <span className="font-bold">{coin.max_supply ? formatCompactNumber(coin.max_supply) : 'Uncapped'} <span className="text-xs uppercase">{coin.symbol}</span></span>
                </div>
                <Progress 
                  value={coin.max_supply && coin.circulating_supply ? (coin.circulating_supply / coin.max_supply) * 100 : 100} 
                  className="h-2" 
                  title={coin.max_supply && coin.circulating_supply ? `${((coin.circulating_supply / coin.max_supply) * 100).toFixed(1)}% of max supply in circulation` : "No max supply cap"}
                />
                <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                  {coin.max_supply && coin.circulating_supply
                    ? `${((coin.circulating_supply / coin.max_supply) * 100).toFixed(1)}% of max supply in circulation`
                    : "No hard supply cap"}
                  <InfoTooltip content="The bar shows how much of the total possible supply is already circulating. A coin near 100% has little room for new coins to dilute the price." />
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {coin.description && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" /> About {coin.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground" dangerouslySetInnerHTML={{ __html: coin.description }} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
