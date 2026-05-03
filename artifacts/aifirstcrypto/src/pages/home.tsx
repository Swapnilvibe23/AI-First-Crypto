import { useGetGlobalMarket, useGetMarketSummary, useGetTrending, useGetTopMovers, useGetFearGreed, useGetNews, useGetCoinHistory, getGetCoinHistoryQueryKey } from "@workspace/api-client-react";
import { useSeoMeta } from "@/hooks/use-seo-meta";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatCompactNumber, formatPercentage } from "@/lib/format";
import { ArrowRight, ChevronRight, TrendingUp, TrendingDown, Clock, Activity, AlertCircle, Newspaper, ExternalLink, Zap, Share2, Copy, Check, Twitter, BarChart2, BrainCircuit, ShieldCheck } from "lucide-react";
import { InfoTooltip } from "@/components/info-tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FearGreedGauge } from "@/components/fear-greed-gauge";
import { MarketDominanceChart } from "@/components/market-dominance-chart";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LineChart, Line, ResponsiveContainer, Tooltip as ReTooltip } from "recharts";
import { useMemo, useState } from "react";
import { TickerStrip } from "@/components/ticker-strip";
import { Reveal } from "@/components/reveal";
import { AIVerdictCard } from "@/components/ai-verdict-card";

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

// ── Market Mood Score ─────────────────────────────────────────────────────────

function computeMoodScore(fearGreedValue: number, btcDominance: number, marketChange24h: number) {
  const base = fearGreedValue;
  // BTC dominance signal: >65% = risk-off (bearish for overall market), <45% = risk-on
  const btcSignal = btcDominance > 65 ? -10 : btcDominance < 45 ? +10 : 0;
  // 24h market cap change: every 1% ≈ 8 mood points, capped at ±15
  const changeSignal = Math.max(-15, Math.min(15, marketChange24h * 8));
  const raw = base * 0.65 + btcSignal + changeSignal * 0.35;
  return Math.round(Math.max(0, Math.min(100, raw)));
}

type MoodMeta = { label: string; color: string; barColor: string; bgColor: string; borderColor: string; summary: string };

function getMoodMeta(score: number): MoodMeta {
  if (score <= 20) return {
    label: "Extreme Fear", color: "text-red-500", barColor: "bg-red-500",
    bgColor: "from-red-500/10 to-card", borderColor: "border-red-500/40",
    summary: "Investors are panicking. Historically this can be a buying opportunity — but it may get worse before it gets better.",
  };
  if (score <= 35) return {
    label: "Fearful", color: "text-orange-500", barColor: "bg-orange-500",
    bgColor: "from-orange-500/10 to-card", borderColor: "border-orange-500/40",
    summary: "The market is nervous. More sellers than buyers, prices are likely under pressure.",
  };
  if (score <= 45) return {
    label: "Cautious", color: "text-yellow-500", barColor: "bg-yellow-500",
    bgColor: "from-yellow-500/10 to-card", borderColor: "border-yellow-500/40",
    summary: "Mixed signals — neither strongly bullish nor bearish. Watch for a clearer direction before making moves.",
  };
  if (score <= 55) return {
    label: "Neutral", color: "text-slate-400", barColor: "bg-slate-400",
    bgColor: "from-slate-400/10 to-card", borderColor: "border-slate-400/30",
    summary: "The market is balanced. No strong sentiment in either direction right now.",
  };
  if (score <= 65) return {
    label: "Optimistic", color: "text-lime-400", barColor: "bg-lime-400",
    bgColor: "from-lime-400/10 to-card", borderColor: "border-lime-400/40",
    summary: "Buyers are gaining confidence. Positive momentum is building — but stay grounded.",
  };
  if (score <= 80) return {
    label: "Greedy", color: "text-emerald-400", barColor: "bg-emerald-400",
    bgColor: "from-emerald-400/10 to-card", borderColor: "border-emerald-400/40",
    summary: "Enthusiasm is running high. Exciting times, but be mindful of overvaluation risk.",
  };
  return {
    label: "Euphoric", color: "text-primary", barColor: "bg-primary",
    bgColor: "from-primary/10 to-card", borderColor: "border-primary/50",
    summary: "Maximum excitement. Historically a warning sign — markets can reverse hard from euphoria.",
  };
}

function MarketMoodScore({ fearGreedValue, btcDominance, marketChange24h }: {
  fearGreedValue: number;
  btcDominance: number;
  marketChange24h: number;
}) {
  const score = computeMoodScore(fearGreedValue, btcDominance, marketChange24h);
  const meta = getMoodMeta(score);
  const btcSignalLabel = btcDominance > 65 ? "Risk-off (bearish)" : btcDominance < 45 ? "Risk-on (bullish)" : "Neutral";
  const btcSignalColor = btcDominance > 65 ? "text-red-400" : btcDominance < 45 ? "text-emerald-400" : "text-muted-foreground";
  const changeColor = marketChange24h >= 0 ? "text-emerald-400" : "text-red-400";

  return (
    <div className={`rounded-2xl border-2 ${meta.borderColor} bg-gradient-to-br ${meta.bgColor} p-6`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold">Market Mood Score</h2>
            <InfoTooltip content="A composite 0–100 score blending three signals: the Fear & Greed index (60% weight), Bitcoin's dominance as a risk-on/off signal, and the 24-hour total market cap change. Higher = more bullish sentiment." />
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">How the market feels right now, in one number</p>
        </div>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold border ${meta.borderColor} ${meta.color} bg-card`}>
          {meta.label}
        </span>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Score + bar */}
        <div className="flex-shrink-0 flex flex-col items-center gap-3 w-full md:w-auto">
          <div className={`text-6xl font-black leading-none tabular-nums ${meta.color}`}>{score}</div>
          <div className="text-xs text-muted-foreground font-medium">out of 100</div>
          {/* Progress bar */}
          <div className="relative w-full md:w-64 h-3 rounded-full bg-muted/60 overflow-hidden">
            {/* Gradient track */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-600 via-yellow-400 via-lime-400 to-emerald-500 opacity-30" />
            {/* Fill */}
            <div
              className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ${meta.barColor}`}
              style={{ width: `${score}%` }}
            />
          </div>
          <div className="flex justify-between w-full md:w-64 text-[10px] text-muted-foreground font-medium px-0.5">
            <span>Fear</span>
            <span>Neutral</span>
            <span>Greed</span>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden md:block w-px self-stretch bg-border/50" />

        {/* Signals + summary */}
        <div className="flex-1 space-y-4">
          {/* 3 input signals */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-lg bg-muted/30 p-3 border border-border/40">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-1">
                Fear & Greed
                <InfoTooltip content="The Crypto Fear & Greed Index (0–100) measures overall market emotion. Under 25 = extreme fear, over 75 = extreme greed. It's the biggest driver of the Mood Score." />
              </div>
              <div className={`text-lg font-black ${fearGreedValue <= 25 ? "text-red-400" : fearGreedValue >= 75 ? "text-emerald-400" : "text-yellow-400"}`}>
                {fearGreedValue}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">60% of score</div>
            </div>

            <div className="rounded-lg bg-muted/30 p-3 border border-border/40">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-1">
                BTC Dominance
                <InfoTooltip content="When Bitcoin's market share rises above ~65%, investors are pulling money into BTC as a 'safe haven', which usually signals bearish sentiment for other coins. Below ~45% signals risk-on appetite." />
              </div>
              <div className="text-lg font-black">{btcDominance.toFixed(1)}%</div>
              <div className={`text-[11px] mt-0.5 font-medium ${btcSignalColor}`}>{btcSignalLabel}</div>
            </div>

            <div className="rounded-lg bg-muted/30 p-3 border border-border/40">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-1">
                24h Market Change
                <InfoTooltip content="The total crypto market cap change in the last 24 hours. A rising market adds positive points to the score; a falling market subtracts them — capped at ±15 points." />
              </div>
              <div className={`text-lg font-black ${changeColor}`}>
                {marketChange24h >= 0 ? "+" : ""}{marketChange24h.toFixed(2)}%
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Up to ±15 pts</div>
            </div>
          </div>

          {/* Plain-English summary */}
          <div className={`rounded-lg border ${meta.borderColor} bg-card/60 px-4 py-3`}>
            <p className="text-sm leading-relaxed text-foreground/90">
              <span className={`font-bold ${meta.color}`}>{meta.label}. </span>
              {meta.summary}
            </p>
          </div>

          <p className="text-[11px] text-muted-foreground leading-snug">
            Not financial advice · Recalculated on every page refresh · Score blends three public signals
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Coin of the Day ───────────────────────────────────────────────────────────

function CoinOfTheDay({ coinId, coinName, coinSymbol, coinThumb, marketCapRank }: {
  coinId: string;
  coinName: string;
  coinSymbol: string;
  coinThumb: string;
  marketCapRank: number | null;
}) {
  const { data: history, isLoading } = useGetCoinHistory(coinId, { days: 7 }, {
    query: { enabled: !!coinId, queryKey: getGetCoinHistoryQueryKey(coinId, { days: 7 }) },
  });

  const { chartData, change7d, isUp } = useMemo(() => {
    if (!history || history.length < 2) return { chartData: [], change7d: 0, isUp: true };
    const first = history[0].price;
    const last = history[history.length - 1].price;
    const change = ((last - first) / first) * 100;
    // Downsample to ~40 points for a clean sparkline
    const step = Math.max(1, Math.floor(history.length / 40));
    const sampled = history.filter((_pt, i) => i % step === 0 || i === history.length - 1);
    return {
      chartData: sampled.map((pt) => ({ v: pt.price })),
      change7d: change,
      isUp: change >= 0,
    };
  }, [history]);

  const lineColor = isUp ? "#10b981" : "#ef4444";

  return (
    <div className={`relative overflow-hidden rounded-2xl border-2 p-6 bg-gradient-to-br ${
      isUp
        ? "border-amber-500/40 from-amber-500/10 via-card to-card"
        : "border-rose-500/30 from-rose-500/8 via-card to-card"
    } shadow-lg`}>
      {/* Decorative glow */}
      <div className={`absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none ${isUp ? "bg-amber-400" : "bg-rose-400"}`} />

      {/* Badge */}
      <div className="flex items-center gap-2 mb-5">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
          🔥 Coin of the Day
        </span>
        <span className="text-xs text-muted-foreground">— Trending #1 on CoinGecko right now</span>
        <InfoTooltip content="The coin being searched most on CoinGecko today. High search interest often precedes price movement — it doesn't mean you should buy it, just that the crowd is watching it." />
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
        {/* Logo + identity */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="relative">
            <img src={coinThumb} alt={coinName} className="w-16 h-16 rounded-full ring-4 ring-amber-500/30 shadow-lg" />
            <span className="absolute -bottom-1 -right-1 text-lg leading-none">🥇</span>
          </div>
          <div>
            <div className="text-2xl font-black tracking-tight">{coinSymbol.toUpperCase()}</div>
            <div className="text-base text-muted-foreground font-medium">{coinName}</div>
            {marketCapRank && (
              <div className="mt-1">
                <span className="text-xs font-semibold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">
                  Market Cap Rank #{marketCapRank}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Sparkline */}
        <div className="flex-1 w-full sm:w-auto min-w-0">
          {isLoading ? (
            <Skeleton className="h-20 w-full rounded-lg" />
          ) : chartData.length > 2 ? (
            <div className="h-20">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <ReTooltip
                    content={() => null}
                    cursor={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="v"
                    stroke={lineColor}
                    strokeWidth={2.5}
                    dot={false}
                    isAnimationActive={true}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : null}
          <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mt-1 font-medium">
            7-day price trend
            <InfoTooltip content="Shows how the coin's price has moved over the last 7 days. A rising line means it gained value; a falling line means it lost value." />
          </div>
        </div>

        {/* Stats + CTA */}
        <div className="flex flex-col gap-3 items-start sm:items-end flex-shrink-0">
          {isLoading ? (
            <Skeleton className="h-10 w-28 rounded-lg" />
          ) : (
            <div className="text-right">
              <div className={`text-2xl font-black ${isUp ? "text-emerald-400" : "text-red-400"}`}>
                {isUp ? "+" : ""}{change7d.toFixed(2)}%
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
                7-day return
                <InfoTooltip content="The percentage gain or loss if you had bought this coin exactly 7 days ago and held until now." />
              </div>
            </div>
          )}
          <Link href={`/coin/${coinId}`}>
            <Button className="rounded-full gap-2" variant={isUp ? "default" : "secondary"}>
              See full analysis
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer note */}
      <p className="text-[11px] text-muted-foreground/60 mt-5 leading-snug">
        Updated every 2 minutes · Source: CoinGecko · Not financial advice
      </p>
    </div>
  );
}

export default function Home() {
  useSeoMeta({
    title: "AIFirstCrypto — Your Daily Crypto Snapshot",
    description: "Live crypto prices, Fear & Greed index, top movers, and the latest news — all in one beginner-friendly dashboard. No login, no noise.",
  });
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
      <section className="relative py-10 md:py-16 flex flex-col items-center gap-4 overflow-hidden text-center">
        {/* Background: mesh grid + glowing orbs */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-primary/8 blur-[110px]" />
          <div className="absolute -bottom-28 -left-28 w-96 h-96 rounded-full bg-indigo-500/7 blur-[90px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-blue-400/4 blur-[80px]" />
          <div className="absolute inset-0 hero-grid" />
        </div>

        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">
          Your daily crypto <span className="text-primary">snapshot</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
          Live prices, market sentiment, and the latest news — all in one place. Clear signals, no noise.
        </p>

        <div className="flex flex-wrap justify-center gap-3 mt-4">
          <Link href="/rates">
            <Button size="lg" className="rounded-full font-bold shadow-lg shadow-primary/20">
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

      {/* How it works */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            icon: BarChart2,
            step: "01",
            title: "Live data, every refresh",
            body: "Prices, market cap, volume, and top movers pull directly from CoinGecko — no stale numbers, no ads.",
            color: "text-blue-400",
            border: "border-blue-500/20",
            bg: "from-blue-500/8 to-card",
          },
          {
            icon: BrainCircuit,
            step: "02",
            title: "One clear AI signal",
            body: "The AIFirst Signal blends Fear & Greed, BTC dominance, and 24h momentum into a single plain-English verdict.",
            color: "text-primary",
            border: "border-primary/20",
            bg: "from-primary/8 to-card",
          },
          {
            icon: ShieldCheck,
            step: "03",
            title: "Act with confidence",
            body: "No login, no wallet, no trading. Just the clearest picture of the market — so you always know what's going on.",
            color: "text-emerald-400",
            border: "border-emerald-500/20",
            bg: "from-emerald-500/8 to-card",
          },
        ].map(({ icon: Icon, step, title, body, color, border, bg }) => (
          <div
            key={step}
            className={`relative rounded-2xl border ${border} bg-gradient-to-br ${bg} p-6 flex flex-col gap-3`}
          >
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-card border ${border} ${color} flex-shrink-0`}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold text-muted-foreground/50 tabular-nums tracking-widest">{step}</span>
            </div>
            <h3 className="text-base font-bold leading-snug">{title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
          </div>
        ))}
      </section>

      {/* Live price ticker */}
      {topMovers && (topMovers.gainers.length > 0 || topMovers.losers.length > 0) && (
        <TickerStrip
          items={[...topMovers.gainers, ...topMovers.losers].filter(
            (c, i, arr) => arr.findIndex((x) => x.id === c.id) === i
          )}
        />
      )}

      {/* AIFirst Signal — daily verdict card */}
      {globalMarket && fearGreed && (
        <Reveal>
          <AIVerdictCard
            fearGreedValue={fearGreed.value}
            fearGreedLabel={fearGreed.value_classification}
            marketChange24h={globalMarket.market_cap_change_percentage_24h}
            btcDominance={globalMarket.btc_dominance}
          />
        </Reveal>
      )}

      {/* Coin of the Day */}
      <Reveal>
        {trendingCoins && trendingCoins.length > 0 ? (
          <CoinOfTheDay
            coinId={trendingCoins[0].id}
            coinName={trendingCoins[0].name}
            coinSymbol={trendingCoins[0].symbol}
            coinThumb={trendingCoins[0].thumb}
            marketCapRank={trendingCoins[0].market_cap_rank ?? null}
          />
        ) : loadingTrending ? (
          <Skeleton className="h-48 w-full rounded-2xl" />
        ) : null}
      </Reveal>

      {/* Global Market Overview */}
      {loadingMarket ? (
        <DashboardSkeletons />
      ) : (
        <>
          {globalMarket && (
            <Reveal>
              <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-card/50 backdrop-blur-sm border-border/50 card-glow">
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

                <Card className="bg-card/50 backdrop-blur-sm border-border/50 card-glow">
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

                <Card className="bg-card/50 backdrop-blur-sm border-border/50 card-glow">
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

                <Card className="bg-card/50 backdrop-blur-sm border-border/50 card-glow">
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
            </Reveal>
          )}

          {/* Market Mood Score */}
          {globalMarket && fearGreed && (
            <MarketMoodScore
              fearGreedValue={fearGreed.value}
              btcDominance={globalMarket.btc_dominance}
              marketChange24h={globalMarket.market_cap_change_percentage_24h}
            />
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
                        <InfoTooltip content="An AI-generated plain-English summary of today's market conditions, based on live price data, Fear & Greed, and top movers. Refreshed every few minutes. Not financial advice." />
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
                  <CardTitle className="text-lg flex items-center gap-2">
                    Market Dominance
                    <InfoTooltip content="How the total crypto market value is split between Bitcoin (BTC), Ethereum (ETH), and all other coins. When BTC's slice grows, money is flowing into Bitcoin specifically." />
                  </CardTitle>
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
                  <CardTitle className="text-lg flex items-center gap-2">
                    Fear & Greed
                    <InfoTooltip content="The Crypto Fear & Greed Index (0–100) summarises overall market emotion from social media, volatility, trading volume, and surveys. Extreme fear can mean buying opportunity; extreme greed often precedes a correction." />
                  </CardTitle>
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

          {/* Top Gainers + Top Losers */}
          <Reveal>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {topMovers && topMovers.gainers.length > 0 && (
              <Card className="card-glow">
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

            {topMovers && topMovers.losers.length > 0 && (
              <Card className="card-glow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingDown className="h-5 w-5 text-negative" />
                    Top Losers
                    <InfoTooltip content="Coins with the biggest price drop (%) in the last 24 hours. Can signal fear or selling pressure." />
                  </CardTitle>
                  <Link href="/top-movers" className="text-sm font-medium text-primary hover:underline">
                    See all
                  </Link>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border/50">
                    {topMovers.losers.slice(0, 3).map((coin) => (
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
                          <div className="text-xs font-medium text-negative">
                            {coin.price_change_percentage_24h?.toFixed(2)}%
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          </Reveal>

          {/* What's Trending Now */}
          {(loadingTrending || (trendingCoins && trendingCoins.length > 0)) && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    🔥 What's Trending Right Now
                    <InfoTooltip content="The 7 most searched and viewed coins on CoinGecko in the last 24 hours. High search interest often precedes price movement — worth keeping an eye on." />
                  </h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Most searched coins on CoinGecko in the last 24 hours
                  </p>
                </div>
              </div>

              {loadingTrending ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <Skeleton key={i} className="h-36 w-full rounded-xl" />
                  ))}
                </div>
              ) : trendingCoins && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
                  {trendingCoins.slice(0, 7).map((coin, idx) => {
                    const rankColors = [
                      "from-amber-500/20 to-amber-500/5 border-amber-500/30",
                      "from-slate-400/20 to-slate-400/5 border-slate-400/30",
                      "from-orange-600/20 to-orange-600/5 border-orange-600/30",
                    ];
                    const rankStyle = rankColors[idx] ?? "from-card to-card/80 border-border/50";
                    const rankEmoji = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`;
                    return (
                      <Link
                        key={coin.id}
                        href={`/coin/${coin.id}`}
                        className={`group relative flex flex-col items-center gap-2 rounded-xl border bg-gradient-to-b ${rankStyle} p-4 text-center hover:scale-105 hover:shadow-xl hover:border-primary/40 transition-all duration-200 cursor-pointer animate-in fade-in-0 slide-in-from-bottom-4 fill-mode-both`}
                        style={{ animationDelay: `${idx * 65}ms`, animationDuration: "480ms" }}
                      >
                        {/* Rank badge */}
                        <div className="absolute top-2.5 right-2.5 text-xs font-bold text-muted-foreground leading-none">
                          {rankEmoji}
                        </div>

                        {/* Logo */}
                        <img
                          src={coin.thumb}
                          alt={coin.name}
                          className="w-10 h-10 rounded-full ring-2 ring-border/50 group-hover:ring-primary/50 transition-all"
                        />

                        {/* Name + symbol */}
                        <div className="w-full min-w-0">
                          <div className="font-bold text-sm truncate leading-tight">
                            {coin.symbol.toUpperCase()}
                          </div>
                          <div className="text-xs text-muted-foreground truncate leading-tight mt-0.5">
                            {coin.name}
                          </div>
                        </div>

                        {/* Market cap rank */}
                        <div className="mt-auto flex flex-col items-center gap-1 w-full">
                          {coin.market_cap_rank && (
                            <span className="text-[10px] font-semibold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">
                              MCap #{coin.market_cap_rank}
                            </span>
                          )}
                          {coin.price_btc != null && coin.price_btc > 0 && (
                            <span className="text-[10px] text-muted-foreground/70 font-mono leading-tight">
                              {(coin.price_btc as number) < 0.000001
                                ? (coin.price_btc as number).toExponential(2)
                                : (coin.price_btc as number).toFixed(8)} ₿
                            </span>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* News & Sentiment Section */}
          <Reveal>
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
          </Reveal>
        </>
      )}
    </div>
  );
}
