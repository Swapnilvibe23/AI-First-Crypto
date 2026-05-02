import { useGetFearGreed, useGetFearGreedHistory } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from "recharts";
import { FearGreedGauge } from "@/components/fear-greed-gauge";

export default function FearGreed() {
  const { data: fearGreed, isLoading: loadingCurrent } = useGetFearGreed();
  const { data: history, isLoading: loadingHistory } = useGetFearGreedHistory({ limit: 30 });

  const getGaugeColor = (value: number) => {
    if (value <= 25) return "text-negative";
    if (value <= 45) return "text-orange-500";
    if (value <= 55) return "text-yellow-500";
    if (value <= 75) return "text-green-500";
    return "text-positive";
  };

  const getGaugeBg = (value: number) => {
    if (value <= 25) return "bg-negative-muted text-negative";
    if (value <= 45) return "bg-orange-500/10 text-orange-500";
    if (value <= 55) return "bg-yellow-500/10 text-yellow-500";
    if (value <= 75) return "bg-green-500/10 text-green-500";
    return "bg-positive-muted text-positive";
  };

  const chartData = history ? [...history].reverse().map(pt => ({
    date: format(new Date(pt.timestamp), "MMM d"),
    value: pt.value
  })) : [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Fear & Greed Index</h1>
        <p className="text-muted-foreground mt-1">Understand current crypto market sentiment</p>
      </div>

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
              <h3 className="font-bold text-negative">Extreme Fear (0-25)</h3>
              <p className="text-sm text-muted-foreground">Investors are overly worried. Prices are typically dropping. This can sometimes represent a buying opportunity for long-term investors.</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-yellow-500">Neutral (46-54)</h3>
              <p className="text-sm text-muted-foreground">The market is indecisive. Neither buyers nor sellers are in full control.</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-positive">Extreme Greed (76-100)</h3>
              <p className="text-sm text-muted-foreground">Investors are getting too greedy. The market might be due for a correction (price drop).</p>
            </div>
            <div className="mt-4 p-4 bg-muted/50 rounded-lg text-sm italic border border-border/50">
              "Be fearful when others are greedy, and greedy when others are fearful." — Warren Buffett
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>30-Day History</CardTitle>
          <CardDescription>How market sentiment has changed over the last month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            {loadingHistory ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 20, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fearGreedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="var(--muted-foreground)" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    minTickGap={30}
                  />
                  <YAxis 
                    stroke="var(--muted-foreground)" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    domain={[0, 100]} 
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px' }}
                    itemStyle={{ color: 'var(--foreground)' }}
                  />
                  <ReferenceLine y={25} stroke="#ef4444" strokeDasharray="4 4" label={{ value: "Fear", fill: "#ef4444", fontSize: 11 }} />
                  <ReferenceLine y={75} stroke="#10b981" strokeDasharray="4 4" label={{ value: "Greed", fill: "#10b981", fontSize: 11 }} />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="var(--primary)" 
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#fearGreedGradient)"
                    dot={false}
                    activeDot={{ r: 6, fill: 'var(--primary)' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
