import { TrendingUp, TrendingDown, Minus, Zap, RotateCcw } from "lucide-react";
import { InfoTooltip } from "@/components/info-tooltip";

interface OutlookResult {
  label: string;
  description: string;
  icon: "up" | "down" | "flat" | "volatile" | "recovering";
  change7d: number;
  badgeClass: string;
  textClass: string;
  lineColor: string;
}

function analyzeSparkline(prices: number[]): OutlookResult | null {
  if (!prices || prices.length < 10) return null;

  const first = prices[0];
  const last = prices[prices.length - 1];
  if (!first || first === 0) return null;

  const change7d = ((last - first) / first) * 100;

  // Recent momentum: compare the last 24 prices vs the 24 before that
  const recentSlice = prices.slice(-24);
  const priorSlice = prices.slice(-48, -24);
  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const recentMomentum =
    priorSlice.length > 0
      ? ((avg(recentSlice) - avg(priorSlice)) / avg(priorSlice)) * 100
      : 0;

  // Volatility: coefficient of variation (std-dev / mean)
  const mean = avg(prices);
  const variance = prices.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / prices.length;
  const cv = mean > 0 ? (Math.sqrt(variance) / mean) * 100 : 0;

  if (change7d > 15) {
    return {
      label: "Strong Rally",
      description: `Up ${change7d.toFixed(1)}% over the last 7 days`,
      icon: "up",
      change7d,
      badgeClass: "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400",
      textClass: "text-emerald-400",
      lineColor: "#10b981",
    };
  }
  if (change7d > 4) {
    return {
      label: "Trending Up",
      description: `Up ${change7d.toFixed(1)}% over the last 7 days`,
      icon: "up",
      change7d,
      badgeClass: "bg-green-500/15 border border-green-500/30 text-green-400",
      textClass: "text-green-400",
      lineColor: "#22c55e",
    };
  }
  if (change7d < -15) {
    return {
      label: "Sharp Drop",
      description: `Down ${Math.abs(change7d).toFixed(1)}% over the last 7 days`,
      icon: "down",
      change7d,
      badgeClass: "bg-red-500/20 border border-red-500/40 text-red-400",
      textClass: "text-red-400",
      lineColor: "#ef4444",
    };
  }
  if (change7d < -4) {
    return {
      label: "Declining",
      description: `Down ${Math.abs(change7d).toFixed(1)}% over the last 7 days`,
      icon: "down",
      change7d,
      badgeClass: "bg-orange-500/15 border border-orange-500/30 text-orange-400",
      textClass: "text-orange-400",
      lineColor: "#f97316",
    };
  }
  if (change7d < -1 && recentMomentum > 1.5) {
    return {
      label: "Recovering",
      description: `Down ${Math.abs(change7d).toFixed(1)}% overall but gaining in the last 24h`,
      icon: "recovering",
      change7d,
      badgeClass: "bg-sky-500/15 border border-sky-500/30 text-sky-400",
      textClass: "text-sky-400",
      lineColor: "#38bdf8",
    };
  }
  if (cv > 7) {
    return {
      label: "Volatile",
      description: `High price swings — ${change7d >= 0 ? "+" : ""}${change7d.toFixed(1)}% on the week`,
      icon: "volatile",
      change7d,
      badgeClass: "bg-yellow-500/15 border border-yellow-500/30 text-yellow-400",
      textClass: "text-yellow-400",
      lineColor: "#eab308",
    };
  }
  return {
    label: "Consolidating",
    description: `Price has been relatively flat — ${change7d >= 0 ? "+" : ""}${change7d.toFixed(1)}% this week`,
    icon: "flat",
    change7d,
    badgeClass: "bg-muted border border-border text-muted-foreground",
    textClass: "text-muted-foreground",
    lineColor: "#6b7280",
  };
}

function MiniSparkline({
  prices,
  color,
}: {
  prices: number[];
  color: string;
}) {
  if (prices.length < 2) return null;

  const W = 64;
  const H = 24;
  const pad = 1;

  // Downsample to ~40 points for clean rendering
  const step = Math.max(1, Math.floor(prices.length / 40));
  const sampled = prices.filter((_, i) => i % step === 0);

  const min = Math.min(...sampled);
  const max = Math.max(...sampled);
  const range = max - min || 1;

  const points = sampled.map((p, i) => {
    const x = pad + (i / (sampled.length - 1)) * (W - pad * 2);
    const y = pad + (1 - (p - min) / range) * (H - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  // Fill area under line
  const areaPoints = [
    `${pad},${H}`,
    ...points,
    `${(W - pad).toFixed(1)},${H}`,
  ].join(" ");

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      className="flex-shrink-0"
      aria-hidden="true"
    >
      <polygon points={areaPoints} fill={color} fillOpacity="0.15" />
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function OutlookIcon({ icon, className }: { icon: OutlookResult["icon"]; className?: string }) {
  const cls = `h-3.5 w-3.5 ${className ?? ""}`;
  switch (icon) {
    case "up":       return <TrendingUp className={cls} />;
    case "down":     return <TrendingDown className={cls} />;
    case "volatile": return <Zap className={cls} />;
    case "recovering": return <RotateCcw className={cls} />;
    default:         return <Minus className={cls} />;
  }
}

interface SevenDayOutlookProps {
  sparklinePrices?: number[];
}

export function SevenDayOutlook({ sparklinePrices }: SevenDayOutlookProps) {
  if (!sparklinePrices || sparklinePrices.length < 10) return null;

  const outlook = analyzeSparkline(sparklinePrices);
  if (!outlook) return null;

  return (
    <div className="flex items-center justify-between gap-3 px-6 py-3 border-t border-border/50">
      {/* Label + description */}
      <div className="flex items-center gap-2 min-w-0">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap flex-shrink-0 ${outlook.badgeClass}`}
        >
          <OutlookIcon icon={outlook.icon} />
          {outlook.label}
        </span>
        <span className="text-[11px] text-muted-foreground truncate">
          {outlook.description}
        </span>
        <InfoTooltip content="Based on the 7-day price history (sparkline). Labels like 'Trending Up', 'Sharp Drop', or 'Consolidating' give you a quick feel for recent momentum — not a prediction." />
      </div>

      {/* Mini sparkline */}
      <MiniSparkline prices={sparklinePrices} color={outlook.lineColor} />
    </div>
  );
}
