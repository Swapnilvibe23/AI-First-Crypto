import { useState } from "react";
import { useGetCoins } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Link } from "wouter";
import { formatPrice, formatPercentage, formatCompactNumber } from "@/lib/format";
import { TrendingUp, TrendingDown, Star, Search, Bell, Trash2, ArrowUpRight, ArrowDownRight, Briefcase, Plus, Pencil, Wallet, Share2, Copy, Check, Twitter } from "lucide-react";
import { InfoTooltip } from "@/components/info-tooltip";
import { SevenDayOutlook } from "@/components/seven-day-outlook";
import { Skeleton } from "@/components/ui/skeleton";
import { useWatchlist } from "@/hooks/use-watchlist";
import { useAlerts } from "@/hooks/use-alerts";
import { useHoldings } from "@/hooks/use-holdings";
import { HoldingDialog } from "@/components/holding-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function Watchlist() {
  const { watchlist, toggleCoin } = useWatchlist();
  const { alerts, removeAlert } = useAlerts();
  const { holdings, addHolding, updateHolding, removeHolding } = useHoldings();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogCoinId, setDialogCoinId] = useState<string | null>(null);
  const [editingHoldingId, setEditingHoldingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: coins, isLoading } = useGetCoins({
    page: 1,
    per_page: 100,
    order: "market_cap_desc"
  });

  const watchlistedCoins = coins?.filter(c => watchlist.includes(c.id)) || [];

  // Build coin lookup map for portfolio calculations
  const coinMap = Object.fromEntries((coins ?? []).map(c => [c.id, c]));

  // Portfolio calculations
  const portfolioRows = holdings.map(h => {
    const coin = coinMap[h.coinId];
    const currentPrice = coin?.current_price ?? 0;
    const currentValue = h.amount * currentPrice;
    const costBasis = h.amount * h.buyPrice;
    const pnl = currentValue - costBasis;
    const pnlPct = costBasis > 0 ? (pnl / costBasis) * 100 : 0;
    return { holding: h, coin, currentPrice, currentValue, costBasis, pnl, pnlPct };
  });

  const totalValue = portfolioRows.reduce((s, r) => s + r.currentValue, 0);
  const totalCost = portfolioRows.reduce((s, r) => s + r.costBasis, 0);
  const totalPnl = totalValue - totalCost;
  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

  // Dialog state helpers
  const dialogCoin = dialogCoinId ? (coinMap[dialogCoinId] ?? null) : null;
  const editingHolding = editingHoldingId ? holdings.find(h => h.id === editingHoldingId) ?? null : null;

  function openAdd(coinId: string) {
    setEditingHoldingId(null);
    setDialogCoinId(coinId);
    setDialogOpen(true);
  }

  function openEdit(holdingId: string, coinId: string) {
    setEditingHoldingId(holdingId);
    setDialogCoinId(coinId);
    setDialogOpen(true);
  }

  function handleSave(amount: number, buyPrice: number) {
    if (!dialogCoin) return;
    if (editingHoldingId) {
      updateHolding(editingHoldingId, { amount, buyPrice });
    } else {
      addHolding({
        coinId: dialogCoin.id,
        coinName: dialogCoin.name,
        coinSymbol: dialogCoin.symbol,
        coinImage: dialogCoin.image,
        amount,
        buyPrice,
      });
    }
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Your Watchlist</h1>
        <p className="text-muted-foreground mt-1">Keep track of your favorite cryptocurrencies</p>
      </div>

      {/* ── Portfolio Tracker ───────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-primary" />
            My Portfolio
          </h2>
          {holdings.length > 0 && (
            <Badge variant="secondary">{holdings.length} position{holdings.length !== 1 ? "s" : ""}</Badge>
          )}
        </div>

        {/* Summary bar */}
        {holdings.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                  Total Value
                  <InfoTooltip content="Current market value of all your holdings combined, based on live prices." />
                </p>
                <p className="text-2xl font-bold">${formatCompactNumber(totalValue)}</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                  Cost Basis
                  <InfoTooltip content="The total amount you paid for your holdings (quantity × average buy price). Your 'break-even' reference point." />
                </p>
                <p className="text-2xl font-bold">${formatCompactNumber(totalCost)}</p>
              </CardContent>
            </Card>
            <Card className={`backdrop-blur-sm border-border/50 ${totalPnl >= 0 ? "bg-positive/10 border-positive/20" : "bg-negative/10 border-negative/20"}`}>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                  Total P&amp;L
                  <InfoTooltip content="Profit &amp; Loss = current value minus your total cost. Green means you're up, red means you're down. Does not account for taxes or fees." />
                </p>
                <p className={`text-2xl font-bold ${totalPnl >= 0 ? "text-positive" : "text-negative"}`}>
                  {totalPnl >= 0 ? "+" : ""}{formatPrice(totalPnl)}
                </p>
                <p className={`text-xs font-medium ${totalPnl >= 0 ? "text-positive" : "text-negative"}`}>
                  {totalPnlPct >= 0 ? "+" : ""}{totalPnlPct.toFixed(2)}%
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Per-holding rows */}
        {holdings.length === 0 ? (
          <Card className="border-dashed border-2 bg-transparent">
            <CardContent className="flex flex-col items-center justify-center space-y-3 py-10">
              <div className="bg-muted p-3 rounded-full">
                <Wallet className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="text-center space-y-1">
                <p className="font-semibold">No holdings logged yet</p>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Click the <strong>+ Add</strong> button on any watchlisted coin below to track your purchase price and see live P&amp;L.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {portfolioRows.map(({ holding, coin, currentValue, costBasis, pnl, pnlPct }) => (
              <Card key={holding.id} className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Coin info */}
                    <img
                      src={holding.coinImage}
                      alt={holding.coinName}
                      className="h-10 w-10 rounded-full flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold">{holding.coinName}</span>
                        <span className="text-xs text-muted-foreground uppercase">{holding.coinSymbol}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        {holding.amount} {holding.coinSymbol.toUpperCase()} · avg {formatPrice(holding.buyPrice)}
                        <InfoTooltip content="Your average buy price per coin. P&L is calculated as (current price − avg buy price) × amount held." />
                      </div>
                    </div>

                    {/* Values */}
                    <div className="hidden sm:flex flex-col items-end">
                      <span className="text-sm font-semibold">{formatPrice(currentValue)}</span>
                      <span className="text-xs text-muted-foreground">cost {formatPrice(costBasis)}</span>
                    </div>

                    {/* P&L */}
                    <div className={`flex flex-col items-end ml-2 ${pnl >= 0 ? "text-positive" : "text-negative"}`}>
                      <span className="font-bold text-sm">
                        {pnl >= 0 ? "+" : ""}{formatPrice(pnl)}
                      </span>
                      <span className="text-xs font-medium">
                        {pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(2)}%
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => openEdit(holding.id, holding.coinId)}
                        title="Edit holding"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-negative"
                        onClick={() => removeHolding(holding.id)}
                        title="Remove holding"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Mobile value row */}
                  <div className="sm:hidden flex justify-between mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
                    <span>Value: <span className="text-foreground font-semibold">{formatPrice(currentValue)}</span></span>
                    <span>Cost: <span className="text-foreground font-semibold">{formatPrice(costBasis)}</span></span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ── Watchlist Coins ─────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Star className="h-6 w-6 text-primary" />
            Saved Coins
            {watchlistedCoins.length > 0 && (
              <Badge variant="secondary">{watchlistedCoins.length} coin{watchlistedCoins.length !== 1 ? "s" : ""}</Badge>
            )}
          </h2>

          {watchlistedCoins.length > 0 && (() => {
            const coinList = watchlistedCoins.slice(0, 6).map(c => `$${c.symbol.toUpperCase()}`).join(" · ");
            const caption = `👀 My crypto watchlist on AIFirstCrypto:\n\n${coinList}\n\nTracking live prices, alerts & market mood — all free, no login needed.\n\n🔗 AIFirstCrypto.com\n\n#crypto #bitcoin #cryptonews #investing #altcoins #cryptotrading #web3`;
            const twitterText = `My crypto watchlist: ${watchlistedCoins.slice(0, 5).map(c => `$${c.symbol.toUpperCase()}`).join(" ")} 👀 Track prices free at AIFirstCrypto.com`;

            function handleCopy() {
              navigator.clipboard.writeText(caption).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              });
            }

            function handleNativeShare() {
              if (navigator.share) {
                navigator.share({ title: "My Crypto Watchlist", text: caption, url: "https://AIFirstCrypto.com" });
              }
            }

            return (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 rounded-full">
                    <Share2 className="h-4 w-4" />
                    Share Watchlist
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4 space-y-3" align="end">
                  <p className="text-sm font-semibold">Share your watchlist</p>

                  {/* Instagram copy */}
                  <div className="space-y-1.5">
                    <p className="text-xs text-muted-foreground font-medium">📸 Instagram caption</p>
                    <div className="rounded-md bg-muted/50 border border-border p-2.5 text-xs text-muted-foreground whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto">
                      {caption}
                    </div>
                    <Button size="sm" className="w-full gap-2 rounded-full" onClick={handleCopy}>
                      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {copied ? "Copied!" : "Copy caption"}
                    </Button>
                  </div>

                  {/* Twitter */}
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Button variant="secondary" size="sm" className="w-full gap-2 rounded-full">
                      <Twitter className="h-3.5 w-3.5" />
                      Post on X / Twitter
                    </Button>
                  </a>

                  {/* Native share */}
                  {"share" in navigator && (
                    <Button variant="ghost" size="sm" className="w-full gap-2 rounded-full" onClick={handleNativeShare}>
                      <Share2 className="h-3.5 w-3.5" />
                      More sharing options
                    </Button>
                  )}

                  <p className="text-[10px] text-muted-foreground text-center">
                    Sharing drives traffic that keeps AIFirstCrypto free 🙏
                  </p>
                </PopoverContent>
              </Popover>
            );
          })()}
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
                <h3 className="text-xl font-bold">Your watchlist is empty</h3>
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
            {watchlistedCoins.map((coin) => {
              const coinHoldings = holdings.filter(h => h.coinId === coin.id);
              return (
                <Card key={coin.id} className="hover:border-primary/50 transition-colors relative group bg-card/50 backdrop-blur-sm border-border/50">
                  {/* Remove from watchlist */}
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

                      <div className="flex items-end justify-between mt-4">
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

                  {/* 7-day outlook */}
                  <SevenDayOutlook sparklinePrices={coin.sparkline_in_7d?.price} />

                  {/* Add / show holdings */}
                  <div className="px-6 pb-4 border-t border-border/50 pt-3">
                    {coinHoldings.length === 0 ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs gap-1.5"
                        onClick={() => openAdd(coin.id)}
                      >
                        <Plus className="h-3.5 w-3.5" /> Add to Portfolio
                      </Button>
                    ) : (
                      <div className="space-y-1">
                        {coinHoldings.map(h => {
                          const val = h.amount * coin.current_price;
                          const pnl = val - h.amount * h.buyPrice;
                          return (
                            <div
                              key={h.id}
                              className="flex items-center justify-between text-xs cursor-pointer hover:opacity-80"
                              onClick={() => openEdit(h.id, coin.id)}
                            >
                              <span className="text-muted-foreground">{h.amount} {coin.symbol.toUpperCase()} · {formatPrice(val)}</span>
                              <span className={`font-bold ${pnl >= 0 ? "text-positive" : "text-negative"}`}>
                                {pnl >= 0 ? "+" : ""}{formatPrice(pnl)}
                              </span>
                            </div>
                          );
                        })}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-xs gap-1.5 mt-1 h-7 text-muted-foreground hover:text-foreground"
                          onClick={() => openAdd(coin.id)}
                        >
                          <Plus className="h-3 w-3" /> Add another lot
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Price Alerts ────────────────────────────────────────── */}
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

      {/* Holding dialog */}
      <HoldingDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        coin={dialogCoin}
        existingAmount={editingHolding?.amount}
        existingBuyPrice={editingHolding?.buyPrice}
        mode={editingHoldingId ? "edit" : "add"}
      />
    </div>
  );
}
