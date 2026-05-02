import { Sparkles, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { InfoTooltip } from "@/components/info-tooltip";

type VerdictKey = "euphoria" | "bullish" | "neutral" | "cautious" | "fearful" | "extreme_fear";

interface VerdictMeta {
  emoji: string;
  label: string;
  headline: string;
  color: string;
  borderColor: string;
  bgGradient: string;
  glowColor: string;
  explanation: string;
  tip: string;
}

const VERDICTS: Record<VerdictKey, VerdictMeta> = {
  euphoria: {
    emoji: "🚀",
    label: "Market is Euphoric",
    headline: "Strong momentum — but watch for reversals",
    color: "text-primary",
    borderColor: "border-primary/50",
    bgGradient: "from-primary/10 via-card to-card",
    glowColor: "bg-primary/20",
    explanation:
      "Sentiment is extremely high and the market is surging. Exciting momentum, but history shows euphoria often precedes a sharp pullback.",
    tip: "Enjoy the ride — but don't let FOMO push you into panic-buying at the top. If you're already up, consider what you'd do if it reversed.",
  },
  bullish: {
    emoji: "📈",
    label: "Leaning Bullish",
    headline: "Yes — markets deserve attention today",
    color: "text-emerald-400",
    borderColor: "border-emerald-500/40",
    bgGradient: "from-emerald-500/8 via-card to-card",
    glowColor: "bg-emerald-500/15",
    explanation:
      "Sentiment is positive and the market is trending upward. Buyers are in control and conditions look constructive.",
    tip: "A good day to review your watchlist or DCA plan if you have one. Positive trends can last — no need to rush.",
  },
  neutral: {
    emoji: "⚖️",
    label: "Mixed Signals",
    headline: "Watch, don't rush",
    color: "text-slate-300",
    borderColor: "border-slate-500/30",
    bgGradient: "from-slate-500/5 via-card to-card",
    glowColor: "bg-slate-400/10",
    explanation:
      "No clear trend today. The market is balanced — neither strongly bullish nor bearish. Price action is likely to be choppy.",
    tip: "A quiet day is a good time to research, not react. Review your positions calmly and wait for a clearer signal.",
  },
  cautious: {
    emoji: "⚠️",
    label: "Proceed with Caution",
    headline: "Be patient — sentiment is fragile",
    color: "text-yellow-400",
    borderColor: "border-yellow-500/40",
    bgGradient: "from-yellow-500/6 via-card to-card",
    glowColor: "bg-yellow-400/12",
    explanation:
      "Fear is elevated and investors are nervous. Even if prices tick up slightly, sentiment remains fragile and moves can reverse quickly.",
    tip: "Not a great time for impulsive moves. If you were planning to buy, wait for sentiment to stabilise before acting.",
  },
  fearful: {
    emoji: "😟",
    label: "Market is Fearful",
    headline: "High caution — volatility likely",
    color: "text-orange-400",
    borderColor: "border-orange-500/40",
    bgGradient: "from-orange-500/8 via-card to-card",
    glowColor: "bg-orange-400/12",
    explanation:
      "Investors are nervous and selling pressure is strong. Short-term outlook is uncertain with potential for further drops.",
    tip: "Historically, fear can signal a buying opportunity for long-term holders — but only if you've done your research and can stomach more downside.",
  },
  extreme_fear: {
    emoji: "😱",
    label: "Extreme Fear",
    headline: "High alert — market in distress",
    color: "text-red-400",
    borderColor: "border-red-500/50",
    bgGradient: "from-red-500/10 via-card to-card",
    glowColor: "bg-red-500/15",
    explanation:
      "The market is in panic mode. Sharp drops and heavy volatility are common in conditions like these.",
    tip: "Stay calm and avoid panic-selling — but don't add more unless you're fully comfortable with significant further downside.",
  },
};

function computeVerdict(fearGreed: number, marketChange24h: number): VerdictKey {
  // Extreme conditions first
  if (fearGreed >= 75 && marketChange24h >= 3) return "euphoria";
  if (fearGreed <= 20 || marketChange24h <= -5) return "extreme_fear";
  // Strong fear + declining market
  if (fearGreed <= 35 && marketChange24h <= -1) return "fearful";
  // Fear zone + declining market
  if (fearGreed < 45 && marketChange24h < -0.5) return "cautious";
  // Fear zone but market flat/recovering → mixed signals → neutral
  if (fearGreed < 45 && marketChange24h >= -0.5) return "neutral";
  // Confident sentiment + positive market
  if (fearGreed >= 55 && marketChange24h >= 0.5) return "bullish";
  // Moderate optimism + flat/up
  if (fearGreed >= 45 && marketChange24h >= 0) return "bullish";
  // Moderate optimism + slight decline
  if (fearGreed >= 45 && Math.abs(marketChange24h) < 1.5) return "neutral";
  return "cautious";
}

interface AIVerdictCardProps {
  fearGreedValue: number;
  fearGreedLabel: string;
  marketChange24h: number;
  btcDominance: number;
}

export function AIVerdictCard({ fearGreedValue, fearGreedLabel, marketChange24h, btcDominance }: AIVerdictCardProps) {
  const verdictKey = computeVerdict(fearGreedValue, marketChange24h);
  const v = VERDICTS[verdictKey];

  const marketDir = marketChange24h >= 0;
  const MarketIcon = marketChange24h > 0.3 ? TrendingUp : marketChange24h < -0.3 ? TrendingDown : Minus;
  const marketColor = marketChange24h >= 0 ? "text-emerald-400" : "text-red-400";

  return (
    <div className={`relative overflow-hidden rounded-2xl border-2 ${v.borderColor} bg-gradient-to-br ${v.bgGradient} p-5 md:p-6`}>
      {/* Ambient glow */}
      <div className={`pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full blur-3xl opacity-40 ${v.glowColor}`} />

      {/* Top row: AI badge + verdict label */}
      <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          {/* AI brand badge */}
          <div className="flex items-center gap-1.5 bg-primary/15 border border-primary/30 rounded-full px-3 py-1">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-primary">AIFirst Signal</span>
          </div>
          <InfoTooltip content="AIFirst Signal is a rule-based verdict that blends three public signals — Fear & Greed index, 24h market cap change, and BTC dominance — into a single plain-English assessment. Not financial advice." />
        </div>

        {/* Verdict badge */}
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm font-bold ${v.borderColor} ${v.color} bg-card/60 self-start sm:self-auto`}>
          <span>{v.emoji}</span>
          <span>{v.label}</span>
        </div>
      </div>

      {/* Headline */}
      <div className="relative mb-4">
        <h2 className={`text-xl md:text-2xl font-black tracking-tight leading-tight ${v.color}`}>
          {v.headline}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-2xl">
          {v.explanation}
        </p>
      </div>

      {/* Beginner Tip */}
      <div className={`relative rounded-xl border ${v.borderColor} bg-card/50 px-4 py-3 mb-5`}>
        <div className="flex items-start gap-2">
          <span className="text-base leading-snug mt-0.5">💡</span>
          <div>
            <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground block mb-0.5">Beginner Tip</span>
            <p className="text-sm text-foreground/90 leading-relaxed">{v.tip}</p>
          </div>
        </div>
      </div>

      {/* Input signal pills */}
      <div className="relative flex flex-wrap gap-2 items-center">
        <span className="text-[11px] text-muted-foreground font-medium mr-1">Signals used:</span>

        {/* Fear & Greed */}
        <div className="flex items-center gap-1.5 bg-muted/50 border border-border/50 rounded-full px-2.5 py-1 text-xs font-medium">
          <span className="text-muted-foreground">Fear & Greed</span>
          <span className={`font-bold ${fearGreedValue <= 30 ? "text-red-400" : fearGreedValue >= 65 ? "text-emerald-400" : "text-yellow-400"}`}>
            {fearGreedValue} · {fearGreedLabel}
          </span>
        </div>

        {/* 24h market change */}
        <div className="flex items-center gap-1.5 bg-muted/50 border border-border/50 rounded-full px-2.5 py-1 text-xs font-medium">
          <MarketIcon className={`h-3 w-3 ${marketColor}`} />
          <span className="text-muted-foreground">Market 24h</span>
          <span className={`font-bold ${marketColor}`}>
            {marketChange24h >= 0 ? "+" : ""}{marketChange24h.toFixed(2)}%
          </span>
        </div>

        {/* BTC Dominance */}
        <div className="flex items-center gap-1.5 bg-muted/50 border border-border/50 rounded-full px-2.5 py-1 text-xs font-medium">
          <span className="text-muted-foreground">BTC Dominance</span>
          <span className={`font-bold ${btcDominance > 60 ? "text-orange-400" : "text-slate-300"}`}>
            {btcDominance.toFixed(1)}%
          </span>
        </div>

        <span className="text-[10px] text-muted-foreground/60 ml-auto hidden sm:block">
          Refreshed live · Not financial advice
        </span>
      </div>
    </div>
  );
}
