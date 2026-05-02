import { useState, useMemo } from "react";
import { useGetCoins, useGetCoinHistory } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip as ReTooltip,
  CartesianGrid, ResponsiveContainer, ReferenceLine,
} from "recharts";
import {
  TrendingUp, TrendingDown, Calculator, Info,
  DollarSign, Coins, CalendarDays, BarChart2,
  Share2, Copy, Check, Twitter, Instagram,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { formatPrice, formatCompactNumber, formatPercentage } from "@/lib/format";
import type { PricePoint, Coin } from "@workspace/api-client-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Frequency = "weekly" | "biweekly" | "monthly";
type Period = 180 | 365 | 730 | 1095;

interface Purchase {
  timestamp: number;
  price: number;
  coinsBought: number;
  totalCoins: number;
  totalInvested: number;
}

interface ChartPoint {
  timestamp: number;
  label: string;
  portfolioValue: number;
  totalInvested: number;
}

interface DCAResult {
  purchases: Purchase[];
  chartData: ChartPoint[];
  totalInvested: number;
  currentValue: number;
  profitLoss: number;
  roi: number;
  totalCoins: number;
  avgBuyPrice: number;
  currentPrice: number;
  bestBuy: Purchase;
  worstBuy: Purchase;
}

// ─── Share helpers ────────────────────────────────────────────────────────────

const SITE_URL = "AIFirstCrypto.com";

function roiEmoji(roi: number) {
  if (roi >= 100) return "🚀";
  if (roi >= 20)  return "📈";
  if (roi >= 0)   return "✅";
  if (roi >= -20) return "📉";
  return "🔻";
}

function freqLabel(f: Frequency) {
  return f === "weekly" ? "weekly" : f === "biweekly" ? "bi-weekly" : "monthly";
}

function buildDCAInstagram(
  coinName: string,
  coinSymbol: string,
  amountNum: number,
  frequency: Frequency,
  periodLabel: string,
  result: DCAResult,
): string {
  const emoji = roiEmoji(result.roi);
  const direction = result.roi >= 0 ? "up" : "down";
  return [
    `${emoji} My DCA Experiment: ${coinName} (${coinSymbol.toUpperCase()})`,
    ``,
    `📅 Strategy: ${freqLabel(frequency)} $${amountNum.toLocaleString()} for ${periodLabel}`,
    `💰 Total invested: ${formatPrice(result.totalInvested)} across ${result.purchases.length} buys`,
    `📊 Portfolio today: ${formatPrice(result.currentValue)}`,
    `${result.roi >= 0 ? "📈" : "📉"} Return: ${result.roi >= 0 ? "+" : ""}${formatPrice(result.profitLoss)} (${formatPercentage(result.roi)})`,
    `🎯 Avg buy price: ${formatPrice(result.avgBuyPrice)}`,
    ``,
    `DCA takes the emotion out of crypto — you keep buying through the volatility, ${direction} or ${direction === "up" ? "down" : "up"}.`,
    ``,
    `Run your own simulation at ${SITE_URL}/dca`,
    ``,
    `#crypto #${coinName.replace(/\s+/g, "").toLowerCase()} #${coinSymbol.toLowerCase()} #dca #dollarcostaveraginge #cryptoinvesting #hodl #bitcoin`,
  ].join("\n");
}

function buildDCATwitter(
  coinName: string,
  coinSymbol: string,
  amountNum: number,
  frequency: Frequency,
  periodLabel: string,
  result: DCAResult,
): string {
  const emoji = roiEmoji(result.roi);
  return [
    `${emoji} I ran a DCA simulation: $${amountNum.toLocaleString()} into ${coinName} (${coinSymbol.toUpperCase()}) ${freqLabel(frequency)} for ${periodLabel}`,
    ``,
    `💰 Invested: ${formatPrice(result.totalInvested)}`,
    `📊 Value today: ${formatPrice(result.currentValue)}`,
    `${result.roi >= 0 ? "📈" : "📉"} ${formatPercentage(result.roi)} ROI | Avg buy: ${formatPrice(result.avgBuyPrice)}`,
    ``,
    `Run yours → ${SITE_URL}/dca`,
    ``,
    `#${coinSymbol.toLowerCase()} #dca #crypto`,
  ].join("\n");
}

// ─── Share DCA Button ─────────────────────────────────────────────────────────

function ShareDCAButton({
  coinName,
  coinSymbol,
  amountNum,
  frequency,
  periodLabel,
  result,
}: {
  coinName: string;
  coinSymbol: string;
  amountNum: number;
  frequency: Frequency;
  periodLabel: string;
  result: DCAResult;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const canNativeShare = typeof navigator !== "undefined" && "share" in navigator;

  function copyInstagram() {
    const text = buildDCAInstagram(coinName, coinSymbol, amountNum, frequency, periodLabel, result);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  function shareTwitter() {
    const text = buildDCATwitter(coinName, coinSymbol, amountNum, frequency, periodLabel, result);
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer",
    );
    setOpen(false);
  }

  function nativeShare() {
    const text = buildDCATwitter(coinName, coinSymbol, amountNum, frequency, periodLabel, result);
    navigator.share({
      title: `My ${coinName} DCA result — ${formatPercentage(result.roi)}`,
      text,
      url: `https://${SITE_URL}/dca`,
    }).catch(() => {});
    setOpen(false);
  }

  const isProfit = result.roi >= 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 rounded-full">
          <Share2 className="h-4 w-4" />
          Share result
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-3" align="end" sideOffset={8}>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
          Share your DCA result
        </p>

        {/* Result preview pill */}
        <div className="mb-3 rounded-lg border border-border/50 bg-muted/30 px-3 py-2.5 space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{coinName} · {periodLabel}</span>
            <span className={`text-xs font-bold ${isProfit ? "text-emerald-400" : "text-red-400"}`}>
              {roiEmoji(result.roi)} {formatPercentage(result.roi)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Invested {formatPrice(result.totalInvested)}</span>
            <span className={isProfit ? "text-emerald-400" : "text-red-400"}>
              → {formatPrice(result.currentValue)}
            </span>
          </div>
        </div>

        <div className="space-y-1.5">
          {/* Instagram copy */}
          <button
            onClick={copyInstagram}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
              copied
                ? "bg-green-500/10 text-green-400 border border-green-500/30"
                : "hover:bg-muted/60 border border-transparent"
            }`}
          >
            {copied ? (
              <Check className="h-4 w-4 flex-shrink-0 text-green-400" />
            ) : (
              <div className="h-4 w-4 flex-shrink-0 rounded-sm bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center">
                <Instagram className="h-2.5 w-2.5 text-white" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm leading-tight">
                {copied ? "Copied!" : "Copy for Instagram"}
              </div>
              <div className="text-xs text-muted-foreground leading-tight mt-0.5">
                {copied ? "Paste into your story or caption" : "Full caption + hashtags ready"}
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
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm leading-tight">Share on X (Twitter)</div>
              <div className="text-xs text-muted-foreground leading-tight mt-0.5">Opens a pre-filled post</div>
            </div>
            <Share2 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          </button>

          {/* Native share (mobile) */}
          {canNativeShare && (
            <button
              onClick={nativeShare}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-muted/60 transition-colors text-left border border-transparent"
            >
              <Share2 className="h-4 w-4 flex-shrink-0 text-primary" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm leading-tight">More options…</div>
                <div className="text-xs text-muted-foreground leading-tight mt-0.5">WhatsApp, Messages, etc.</div>
              </div>
            </button>
          )}
        </div>

        <p className="text-[10px] text-muted-foreground mt-3 px-1 leading-snug">
          Simulated results only — not financial advice.
        </p>
      </PopoverContent>
    </Popover>
  );
}

// ─── DCA Calculation ──────────────────────────────────────────────────────────

function calculateDCA(
  history: PricePoint[],
  amount: number,
  frequency: Frequency,
): DCAResult | null {
  if (!history || history.length < 2) return null;

  const intervalMs =
    frequency === "weekly" ? 7 * 86_400_000 :
    frequency === "biweekly" ? 14 * 86_400_000 :
    30 * 86_400_000;

  let totalCoins = 0;
  let totalInvested = 0;
  let lastPurchaseTime = history[0].timestamp - intervalMs;

  const purchases: Purchase[] = [];
  const chartData: ChartPoint[] = [];

  for (const point of history) {
    if (point.timestamp - lastPurchaseTime >= intervalMs) {
      const coinsBought = amount / point.price;
      totalCoins += coinsBought;
      totalInvested += amount;
      lastPurchaseTime = point.timestamp;
      purchases.push({
        timestamp: point.timestamp,
        price: point.price,
        coinsBought,
        totalCoins,
        totalInvested,
      });
    }
    chartData.push({
      timestamp: point.timestamp,
      label: new Date(point.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" }),
      portfolioValue: totalCoins * point.price,
      totalInvested,
    });
  }

  if (purchases.length === 0) return null;

  const currentPrice = history[history.length - 1].price;
  const currentValue = totalCoins * currentPrice;
  const profitLoss = currentValue - totalInvested;
  const roi = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0;
  const avgBuyPrice = totalInvested / totalCoins;

  const sorted = [...purchases].sort((a, b) => a.price - b.price);
  const bestBuy = sorted[0];
  const worstBuy = sorted[sorted.length - 1];

  return {
    purchases,
    chartData,
    totalInvested,
    currentValue,
    profitLoss,
    roi,
    totalCoins,
    avgBuyPrice,
    currentPrice,
    bestBuy,
    worstBuy,
  };
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { payload: ChartPoint }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const gain = d.portfolioValue - d.totalInvested;
  const isUp = gain >= 0;
  return (
    <div className="bg-card border border-border/60 rounded-xl px-4 py-3 shadow-xl text-sm min-w-[200px]">
      <p className="text-muted-foreground text-xs mb-2">{d.label}</p>
      <div className="space-y-1.5">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Portfolio</span>
          <span className="font-bold text-foreground">{formatPrice(d.portfolioValue)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Invested</span>
          <span className="font-medium">{formatPrice(d.totalInvested)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">P&L</span>
          <span className={`font-bold ${isUp ? "text-emerald-400" : "text-red-400"}`}>
            {isUp ? "+" : ""}{formatPrice(gain)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, icon: Icon, positive,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  positive?: boolean;
}) {
  return (
    <Card className="hover:border-primary/40 transition-colors">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground mb-1">{label}</p>
            <p className={`text-2xl font-bold tracking-tight ${
              positive === true ? "text-emerald-400" :
              positive === false ? "text-red-400" : ""
            }`}>{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            positive === true ? "bg-emerald-500/10" :
            positive === false ? "bg-red-500/10" : "bg-primary/10"
          }`}>
            <Icon className={`h-5 w-5 ${
              positive === true ? "text-emerald-400" :
              positive === false ? "text-red-400" : "text-primary"
            }`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: 180, label: "6 Months" },
  { value: 365, label: "1 Year" },
  { value: 730, label: "2 Years" },
  { value: 1095, label: "3 Years" },
];

const FREQ_OPTIONS: { value: Frequency; label: string; sub: string }[] = [
  { value: "weekly", label: "Weekly", sub: "Buy every 7 days" },
  { value: "biweekly", label: "Bi-weekly", sub: "Buy every 14 days" },
  { value: "monthly", label: "Monthly", sub: "Buy every 30 days" },
];

export default function DCA() {
  const [coinId, setCoinId] = useState("bitcoin");
  const [coinSearch, setCoinSearch] = useState("");
  const [amount, setAmount] = useState("100");
  const [frequency, setFrequency] = useState<Frequency>("weekly");
  const [period, setPeriod] = useState<Period>(365);
  const [showCoinList, setShowCoinList] = useState(false);

  const { data: coins } = useGetCoins({ per_page: 100 });
  const { data: history, isLoading, isError, refetch } = useGetCoinHistory(coinId, { days: period });

  const selectedCoin = coins?.find((c: Coin) => c.id === coinId);

  const filteredCoins = useMemo(() => {
    if (!coins) return [];
    const q = coinSearch.toLowerCase().trim();
    if (!q) return coins.slice(0, 30);
    return coins.filter(
      (c: Coin) =>
        c.name.toLowerCase().includes(q) ||
        c.symbol.toLowerCase().includes(q)
    ).slice(0, 20);
  }, [coins, coinSearch]);

  const amountNum = parseFloat(amount) || 0;

  const result = useMemo<DCAResult | null>(() => {
    if (!history || amountNum <= 0) return null;
    return calculateDCA(history, amountNum, frequency);
  }, [history, amountNum, frequency]);

  const isProfit = result ? result.profitLoss >= 0 : true;

  function selectCoin(coin: Coin) {
    setCoinId(coin.id);
    setCoinSearch(coin.name);
    setShowCoinList(false);
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12 max-w-5xl mx-auto">

      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
            <Calculator className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">DCA Calculator</h1>
            <p className="text-muted-foreground text-sm">
              Dollar-Cost Averaging — see what consistent buying would have returned
            </p>
          </div>
        </div>
        <Alert className="border-primary/20 bg-primary/5 mt-4">
          <Info className="h-4 w-4 text-primary" />
          <AlertDescription className="text-sm text-muted-foreground">
            This calculator uses real historical price data. Results are hypothetical — past performance
            does not guarantee future results. Not financial advice.
          </AlertDescription>
        </Alert>
      </div>

      {/* Config form */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-lg">Configure your DCA strategy</CardTitle>
          <CardDescription>Choose a coin, your recurring investment, and how far back to simulate</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* Row 1: Coin + Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Coin selector */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Cryptocurrency</label>
              <div className="relative">
                <div className="flex items-center gap-2 w-full h-10 px-3 rounded-md border border-border/60 bg-background focus-within:ring-2 focus-within:ring-primary/40 cursor-text"
                  onClick={() => setShowCoinList(true)}>
                  {selectedCoin?.image && !showCoinList && (
                    <img src={selectedCoin.image} alt="" className="w-5 h-5 rounded-full flex-shrink-0" />
                  )}
                  <input
                    type="text"
                    placeholder="Search coin…"
                    value={showCoinList ? coinSearch : (selectedCoin ? `${selectedCoin.name} (${selectedCoin.symbol.toUpperCase()})` : coinSearch)}
                    onChange={e => { setCoinSearch(e.target.value); setShowCoinList(true); }}
                    onFocus={() => { setCoinSearch(""); setShowCoinList(true); }}
                    className="bg-transparent text-sm flex-1 outline-none min-w-0"
                  />
                </div>
                {showCoinList && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border/60 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                    {filteredCoins.length === 0 ? (
                      <div className="p-3 text-sm text-muted-foreground">No coins found</div>
                    ) : filteredCoins.map((coin: Coin) => (
                      <button
                        key={coin.id}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors text-left"
                        onClick={() => selectCoin(coin)}
                      >
                        <img src={coin.image} alt="" className="w-6 h-6 rounded-full flex-shrink-0" />
                        <span className="text-sm font-medium">{coin.name}</span>
                        <span className="text-xs text-muted-foreground ml-auto">{coin.symbol.toUpperCase()}</span>
                        <span className="text-xs text-muted-foreground w-12 text-right">#{coin.market_cap_rank}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/* Backdrop to close dropdown */}
              {showCoinList && (
                <div className="fixed inset-0 z-40" onClick={() => setShowCoinList(false)} />
              )}
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Amount per purchase (USD)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  type="number"
                  min={1}
                  max={100000}
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-md border border-border/60 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="100"
                />
              </div>
            </div>
          </div>

          {/* Row 2: Frequency */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Purchase frequency</label>
            <div className="grid grid-cols-3 gap-3">
              {FREQ_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setFrequency(opt.value)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    frequency === opt.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/60 bg-muted/30 hover:border-primary/40 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div className="font-semibold text-sm">{opt.label}</div>
                  <div className={`text-xs mt-0.5 ${frequency === opt.value ? "text-primary/70" : "text-muted-foreground"}`}>{opt.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Row 3: Period */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">How far back to simulate</label>
            <div className="grid grid-cols-4 gap-2">
              {PERIOD_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setPeriod(opt.value)}
                  className={`py-2.5 px-3 rounded-xl border text-sm font-semibold transition-all ${
                    period === opt.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border/60 bg-muted/30 hover:border-primary/40 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Loading / Error */}
      {isLoading && (
        <div className="text-center py-16 space-y-3">
          <div className="inline-block w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Fetching price history…</p>
        </div>
      )}

      {isError && !isLoading && (
        <Alert className="border-red-500/20 bg-red-500/5">
          <AlertDescription className="flex items-center justify-between">
            <span className="text-red-400 text-sm">Could not load price history. CoinGecko may be rate-limiting — try again in a moment.</span>
            <button onClick={() => refetch()} className="ml-4 text-xs px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0">
              Retry
            </button>
          </AlertDescription>
        </Alert>
      )}

      {/* Results */}
      {result && !isLoading && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Invested"
              value={formatPrice(result.totalInvested)}
              sub={`${result.purchases.length} purchases`}
              icon={DollarSign}
            />
            <StatCard
              label="Portfolio Value"
              value={formatPrice(result.currentValue)}
              sub={`${formatCompactNumber(result.totalCoins)} ${selectedCoin?.symbol.toUpperCase() ?? ""}`}
              icon={Coins}
              positive={isProfit}
            />
            <StatCard
              label="Total Return"
              value={`${isProfit ? "+" : ""}${formatPrice(result.profitLoss)}`}
              sub="vs total invested"
              icon={isProfit ? TrendingUp : TrendingDown}
              positive={isProfit}
            />
            <StatCard
              label="ROI"
              value={formatPercentage(result.roi)}
              sub={`Avg buy: ${formatPrice(result.avgBuyPrice)}`}
              icon={BarChart2}
              positive={isProfit}
            />
          </div>

          {/* Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg">Portfolio Value Over Time</CardTitle>
                  <CardDescription>
                    {selectedCoin?.name} DCA — ${amountNum.toLocaleString()} {frequency} for {PERIOD_OPTIONS.find(o => o.value === period)?.label}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-0.5 bg-primary inline-block rounded" />
                      Portfolio value
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-0.5 bg-muted-foreground/40 inline-block rounded border-dashed border-t" />
                      Amount invested
                    </span>
                  </div>
                  {selectedCoin && (
                    <ShareDCAButton
                      coinName={selectedCoin.name}
                      coinSymbol={selectedCoin.symbol}
                      amountNum={amountNum}
                      frequency={frequency}
                      periodLabel={PERIOD_OPTIONS.find(o => o.value === period)?.label ?? ""}
                      result={result}
                    />
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={result.chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="dcaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isProfit ? "#10b981" : "#ef4444"} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={isProfit ? "#10b981" : "#ef4444"} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="investedGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6b7280" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#6b7280" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: "#6b7280", fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      interval="preserveStartEnd"
                      minTickGap={60}
                    />
                    <YAxis
                      tickFormatter={v => `$${formatCompactNumber(v)}`}
                      tick={{ fill: "#6b7280", fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      width={58}
                    />
                    <ReTooltip content={<ChartTooltip />} />
                    <ReferenceLine
                      y={result.totalInvested}
                      stroke="#6b7280"
                      strokeDasharray="4 4"
                      strokeOpacity={0.4}
                    />
                    <Area
                      type="monotone"
                      dataKey="totalInvested"
                      stroke="#6b728060"
                      strokeWidth={1}
                      fill="url(#investedGradient)"
                      isAnimationActive={false}
                      dot={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="portfolioValue"
                      stroke={isProfit ? "#10b981" : "#ef4444"}
                      strokeWidth={2}
                      fill="url(#dcaGradient)"
                      isAnimationActive={false}
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Best / worst + key insights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-emerald-500/20 bg-emerald-500/5">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                  </div>
                  <span className="text-sm font-semibold text-emerald-400">Best Buy</span>
                </div>
                <p className="text-2xl font-bold">{formatPrice(result.bestBuy.price)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(result.bestBuy.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Bought {result.bestBuy.coinsBought.toFixed(6)} {selectedCoin?.symbol.toUpperCase()}
                </p>
              </CardContent>
            </Card>

            <Card className="border-red-500/20 bg-red-500/5">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-red-500/20 flex items-center justify-center">
                    <TrendingDown className="h-4 w-4 text-red-400" />
                  </div>
                  <span className="text-sm font-semibold text-red-400">Worst Buy</span>
                </div>
                <p className="text-2xl font-bold">{formatPrice(result.worstBuy.price)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(result.worstBuy.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Bought {result.worstBuy.coinsBought.toFixed(6)} {selectedCoin?.symbol.toUpperCase()}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <CalendarDays className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-semibold">Strategy Summary</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Purchases made</span>
                    <span className="font-semibold">{result.purchases.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avg buy price</span>
                    <span className="font-semibold">{formatPrice(result.avgBuyPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current price</span>
                    <span className="font-semibold">{formatPrice(result.currentPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price vs avg</span>
                    <span className={`font-bold ${result.currentPrice >= result.avgBuyPrice ? "text-emerald-400" : "text-red-400"}`}>
                      {formatPercentage(((result.currentPrice - result.avgBuyPrice) / result.avgBuyPrice) * 100)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Purchase history table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Purchase History</CardTitle>
              <CardDescription>
                Showing all {result.purchases.length} simulated purchases
                {result.purchases.length > 12 ? ` (last 12 shown)` : ""}
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/40 text-muted-foreground">
                    <th className="text-left pb-3 font-medium">#</th>
                    <th className="text-left pb-3 font-medium">Date</th>
                    <th className="text-right pb-3 font-medium">Price</th>
                    <th className="text-right pb-3 font-medium">Coins bought</th>
                    <th className="text-right pb-3 font-medium">Total invested</th>
                    <th className="text-right pb-3 font-medium hidden sm:table-cell">Portfolio value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {result.purchases.slice(-12).map((p, i, arr) => {
                    const idx = result.purchases.length - arr.length + i + 1;
                    const portfolioValueAtPurchase = p.totalCoins * p.price;
                    return (
                      <tr key={p.timestamp} className="hover:bg-muted/20 transition-colors">
                        <td className="py-3 text-muted-foreground text-xs">{idx}</td>
                        <td className="py-3">
                          {new Date(p.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" })}
                        </td>
                        <td className="py-3 text-right font-medium">{formatPrice(p.price)}</td>
                        <td className="py-3 text-right text-muted-foreground">
                          {p.coinsBought < 0.001
                            ? p.coinsBought.toFixed(8)
                            : p.coinsBought.toFixed(6)}
                        </td>
                        <td className="py-3 text-right">{formatPrice(p.totalInvested)}</td>
                        <td className="py-3 text-right hidden sm:table-cell">
                          <span className={portfolioValueAtPurchase >= p.totalInvested ? "text-emerald-400" : "text-red-400"}>
                            {formatPrice(portfolioValueAtPurchase)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}

      {/* Empty state — no result yet */}
      {!result && !isLoading && !isError && (
        <div className="text-center py-16 text-muted-foreground space-y-2">
          <Calculator className="h-10 w-10 mx-auto opacity-20" />
          <p className="text-sm">Enter an amount above to see your DCA results</p>
        </div>
      )}
    </div>
  );
}
