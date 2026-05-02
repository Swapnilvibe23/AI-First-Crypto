import { useMemo, useState } from "react";
import { useGetFearGreed, useGetFearGreedHistory, useGetCoinHistory } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ImageIcon } from "lucide-react";
import { format } from "date-fns";
import { FearGreedStoryCard } from "@/components/fear-greed-story-card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ComposedChart,
  Line,
  Legend,
} from "recharts";
import { FearGreedGauge } from "@/components/fear-greed-gauge";
import { formatPrice, formatCompactNumber } from "@/lib/format";
import { InfoTooltip } from "@/components/info-tooltip";

const PERIOD_OPTIONS = [
  { label: "30D", days: 30, limit: 30 },
  { label: "90D", days: 90, limit: 90 },
] as const;

type Period = typeof PERIOD_OPTIONS[number];

function getSentimentColor(value: number) {
  if (value <= 25) return "#ef4444";
  if (value <= 45) return "#f97316";
  if (value <= 55) return "#eab308";
  if (value <= 75) return "#22c55e";
  return "#10b981";
}

function getSentimentLabel(value: number) {
  if (value <= 25) return "Extreme Fear";
  if (value <= 45) return "Fear";
  if (value <= 55) return "Neutral";
  if (value <= 75) return "Greed";
  return "Extreme Greed";
}

function getGaugeBg(value: number) {
  if (value <= 25) return "bg-red-500/10 text-red-500";
  if (value <= 45) return "bg-orange-500/10 text-orange-500";
  if (value <= 55) return "bg-yellow-500/10 text-yellow-500";
  if (value <= 75) return "bg-green-500/10 text-green-500";
  return "bg-emerald-500/10 text-emerald-500";
}

// Resample hourly BTC history to daily (last price of each day)
function resampleToDaily(prices: { timestamp: number; price: number }[]) {
  const byDay: Record<string, number> = {};
  for (const { timestamp, price } of prices) {
    const key = format(new Date(timestamp), "yyyy-MM-dd");
    byDay[key] = price; // overwrite → last price of day wins
  }
  return byDay;
}

const CorrelationTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-background/95 backdrop-blur px-3 py-2 shadow-xl text-xs space-y-1.5">
      <p className="text-muted-foreground font-medium">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full inline-block flex-shrink-0" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}</span>
          <span className="ml-auto font-bold text-foreground">
            {p.name === "Fear & Greed" ? `${p.value} – ${getSentimentLabel(p.value)}` : `$${formatCompactNumber(p.value)}`}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function FearGreed() {
  const [period, setPeriod] = useState<Period>(PERIOD_OPTIONS[0]);
  const [fgStoryOpen, setFgStoryOpen] = useState(false);

  const { data: fearGreed, isLoading: loadingCurrent } = useGetFearGreed();
  const { data: history, isLoading: loadingHistory } = useGetFearGreedHistory({ limit: period.limit });
  const { data: btcHistory, isLoading: loadingBtc } = useGetCoinHistory("bitcoin", { days: period.days });

  // Fear & Greed area chart (reversed to chronological order)
  const fgChartData = history
    ? [...history].reverse().map((pt) => ({
        date: format(new Date(pt.timestamp), "MMM d"),
        value: pt.value,
        color: getSentimentColor(pt.value),
      }))
    : [];

  // Correlation chart: merge F&G history with daily BTC price
  const correlationData = useMemo(() => {
    if (!history || !btcHistory) return [];
    const btcByDay = resampleToDaily(btcHistory as { timestamp: number; price: number }[]);
    return [...history]
      .reverse()
      .map((pt) => {
        const dateKey = format(new Date(pt.timestamp), "yyyy-MM-dd");
        const label = format(new Date(pt.timestamp), "MMM d");
        const btcPrice = btcByDay[dateKey] ?? null;
        return {
          date: label,
          fg: pt.value,
          btc: btcPrice,
        };
      })
      .filter((d) => d.btc !== null);
  }, [history, btcHistory]);

  const loadingCorrelation = loadingHistory || loadingBtc;

  // Stats for the correlation section
  const avgFg = correlationData.length
    ? Math.round(correlationData.reduce((s, d) => s + d.fg, 0) / correlationData.length)
    : null;

  const btcPriceStart = correlationData[0]?.btc ?? null;
  const btcPriceEnd = correlationData[correlationData.length - 1]?.btc ?? null;
  const btcChange = btcPriceStart && btcPriceEnd ? ((btcPriceEnd - btcPriceStart) / btcPriceStart) * 100 : null;

  return (
    <>
    <div className="space-y-8 animate-in fade-in duration-500 pb-12 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Fear & Greed Index</h1>
        <p className="text-muted-foreground mt-1">Understand current crypto market sentiment</p>
      </div>

      {/* Current reading + explainer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 border-primary/20 bg-gradient-to-b from-card to-card/50">
          <CardContent className="flex flex-col items-center justify-center p-8 text-center h-full">
            {loadingCurrent ? (
              <div className="space-y-4 flex flex-col items-center">
                <Skeleton className="h-24 w-24 rounded-full" />
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
            ) : fearGreed ? (
              <>
                <FearGreedGauge value={fearGreed.value} />
                <div className={`mt-4 text-xl font-bold px-6 py-2 rounded-full uppercase tracking-widest ${getGaugeBg(fearGreed.value)}`}>
                  {fearGreed.value_classification}
                </div>
                <p className="text-xs text-muted-foreground mt-4 uppercase tracking-wider">
                  Updated {format(new Date(fearGreed.timestamp), "MMM d, yyyy")}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-5 gap-2 rounded-full border-primary/30 text-primary hover:bg-primary/10"
                  onClick={() => setFgStoryOpen(true)}
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                  Generate Story Card
                </Button>
              </>
            ) : null}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>What does this mean?</CardTitle>
            <CardDescription>A simple guide for beginners</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-bold text-red-500">Extreme Fear (0–25)</h3>
              <p className="text-sm text-muted-foreground">Investors are overly worried. Prices are typically dropping. This can sometimes represent a buying opportunity for long-term investors, but the trend may continue down.</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-orange-500">Fear (26–45)</h3>
              <p className="text-sm text-muted-foreground">More sellers than buyers. The market is nervous and cautious. Prices tend to be under pressure, and many investors are hesitant to make new moves.</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-yellow-500">Neutral (46–54)</h3>
              <p className="text-sm text-muted-foreground">The market is indecisive. Neither buyers nor sellers are in full control. A period of consolidation — watch for a clear breakout in either direction.</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-green-500">Greed (55–75)</h3>
              <p className="text-sm text-muted-foreground">Buyers are gaining confidence and momentum is building. Prices often rise during this phase, but it's worth staying grounded and not chasing pumps.</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-emerald-500">Extreme Greed (76–100)</h3>
              <p className="text-sm text-muted-foreground">Investors are getting too greedy. Euphoria is in the air, but history shows the market is often due for a correction (price drop) at these levels.</p>
            </div>
            <div className="mt-4 p-4 bg-muted/50 rounded-lg text-sm italic border border-border/50">
              "Be fearful when others are greedy, and greedy when others are fearful." — Warren Buffett
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Period switcher */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground font-medium flex items-center gap-1.5">
          Period:
          <InfoTooltip content="Choose how far back to show the Fear & Greed history and the BTC price correlation chart." />
        </span>
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          {PERIOD_OPTIONS.map((opt) => (
            <Button
              key={opt.label}
              variant={period.label === opt.label ? "default" : "ghost"}
              size="sm"
              className="px-4 h-7 text-xs"
              onClick={() => setPeriod(opt)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Sentiment history area chart */}
      <Card>
        <CardHeader>
          <CardTitle>{period.label} Sentiment History</CardTitle>
          <CardDescription>How market sentiment has changed over the period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] w-full">
            {loadingHistory ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={fgChartData} margin={{ top: 20, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fearGreedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={30}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px", fontSize: 12 }}
                    itemStyle={{ color: "hsl(var(--foreground))" }}
                    formatter={(val: number) => [`${val} – ${getSentimentLabel(val)}`, "Sentiment"]}
                  />
                  <ReferenceLine y={25} stroke="#ef4444" strokeDasharray="4 4" label={{ value: "Fear", fill: "#ef4444", fontSize: 11 }} />
                  <ReferenceLine y={75} stroke="#10b981" strokeDasharray="4 4" label={{ value: "Greed", fill: "#10b981", fontSize: 11 }} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#fearGreedGradient)"
                    dot={false}
                    activeDot={{ r: 6, fill: "hsl(var(--primary))" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sentiment vs BTC price correlation chart */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <CardTitle className="flex items-center gap-2">
                Sentiment vs. Bitcoin Price
                <InfoTooltip content="The blue line shows the Fear & Greed score (left axis, 0–100). The orange area shows Bitcoin's price (right axis). Watch if big fear dips coincide with price bottoms — or greed spikes with tops." />
              </CardTitle>
              <CardDescription>Does fear or greed predict where price goes next?</CardDescription>
            </div>
            {/* Period summary stats */}
            {!loadingCorrelation && avgFg !== null && btcChange !== null && (
              <div className="flex items-center gap-4 text-sm flex-wrap">
                <div className="text-right">
                  <p className="text-muted-foreground text-xs uppercase tracking-wide flex items-center justify-end gap-1">
                    Avg Sentiment
                    <InfoTooltip content="The average Fear & Greed score over the selected period. Below 50 = market leaning fearful; above 50 = market leaning greedy." />
                  </p>
                  <p className={`font-bold ${getSentimentColor(avgFg) === "#ef4444" || getSentimentColor(avgFg) === "#f97316" ? "text-red-500" : "text-emerald-500"}`}
                    style={{ color: getSentimentColor(avgFg) }}>
                    {avgFg} – {getSentimentLabel(avgFg)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground text-xs uppercase tracking-wide flex items-center justify-end gap-1">
                    BTC {period.label} Change
                    <InfoTooltip content="Bitcoin's price change from the start to the end of the selected period, as a percentage." />
                  </p>
                  <p className={`font-bold ${btcChange >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                    {btcChange >= 0 ? "+" : ""}{btcChange.toFixed(1)}%
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loadingCorrelation ? (
            <Skeleton className="h-72 w-full" />
          ) : correlationData.length === 0 ? (
            <div className="h-72 flex items-center justify-center text-muted-foreground text-sm">
              No correlation data available
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={correlationData} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="btcGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                    minTickGap={30}
                  />
                  {/* Left axis: Fear & Greed 0–100 */}
                  <YAxis
                    yAxisId="fg"
                    orientation="left"
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: "hsl(var(--primary))" }}
                    axisLine={false}
                    tickLine={false}
                    width={36}
                    tickFormatter={(v) => v}
                  />
                  {/* Right axis: BTC price */}
                  <YAxis
                    yAxisId="btc"
                    orientation="right"
                    tick={{ fontSize: 11, fill: "#f59e0b" }}
                    axisLine={false}
                    tickLine={false}
                    width={64}
                    tickFormatter={(v) => `$${formatCompactNumber(v)}`}
                  />
                  <Tooltip content={<CorrelationTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                    formatter={(value) => value}
                  />
                  <ReferenceLine yAxisId="fg" y={25} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.5} />
                  <ReferenceLine yAxisId="fg" y={75} stroke="#10b981" strokeDasharray="3 3" strokeOpacity={0.5} />
                  {/* BTC price area (behind) */}
                  <Area
                    yAxisId="btc"
                    type="monotone"
                    dataKey="btc"
                    name="BTC Price"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    fill="url(#btcGrad)"
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0, fill: "#f59e0b" }}
                  />
                  {/* F&G line (on top) */}
                  <Line
                    yAxisId="fg"
                    type="monotone"
                    dataKey="fg"
                    name="Fear & Greed"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5, strokeWidth: 0, fill: "hsl(var(--primary))" }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
              <p className="text-xs text-muted-foreground mt-3 text-center">
                Blue line = Fear &amp; Greed score (left axis) · Orange area = Bitcoin price (right axis)
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>

    {fearGreed && (
      <FearGreedStoryCard
        open={fgStoryOpen}
        onClose={() => setFgStoryOpen(false)}
        value={fearGreed.value}
        classification={fearGreed.value_classification}
        updatedDate={format(new Date(fearGreed.timestamp), "MMM d, yyyy")}
        history={fgChartData.map(p => ({ date: p.date, value: p.value }))}
        avgScore={avgFg}
      />
    )}
    </>
  );
}
