import { useState, useMemo } from "react";
import { useGetCoins, useGetCoinHistory, getGetCoinHistoryQueryKey } from "@workspace/api-client-react";
import { useSeoMeta } from "@/hooks/use-seo-meta";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice, formatPercentage, formatCompactNumber } from "@/lib/format";
import { TrendingUp, TrendingDown, X, Plus, GitCompareArrows, AlertCircle, RefreshCw } from "lucide-react";
import { InfoTooltip } from "@/components/info-tooltip";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

const COIN_COLORS = ["#3b82f6", "#f59e0b", "#10b981"] as const;
const DAYS_OPTIONS = [
  { label: "7D", value: 7 },
  { label: "30D", value: 30 },
  { label: "90D", value: 90 },
] as const;

// Normalize price series to % change from first data point
// API returns [{timestamp, price}] format
function normalizeToPercent(prices: { timestamp: number; price: number }[]): { ts: number; pct: number }[] {
  if (!prices.length) return [];
  const base = prices[0].price;
  if (!base) return [];
  return prices.map(({ timestamp, price }) => ({ ts: timestamp, pct: ((price - base) / base) * 100 }));
}

interface CoinRow {
  id: string;
  name: string;
  symbol: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number | null;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
}

function CoinHistoryLine({
  coinId,
  days,
  color,
}: {
  coinId: string;
  days: number;
  color: string;
}) {
  // Only used for loading state — actual data is merged in parent
  return null;
}

function useCoinHistories(coinIds: string[], days: number) {
  const q0 = useGetCoinHistory(coinIds[0] ?? "", { days }, { query: { enabled: !!coinIds[0], queryKey: getGetCoinHistoryQueryKey(coinIds[0] ?? "", { days }) } });
  const q1 = useGetCoinHistory(coinIds[1] ?? "", { days }, { query: { enabled: !!coinIds[1], queryKey: getGetCoinHistoryQueryKey(coinIds[1] ?? "", { days }) } });
  const q2 = useGetCoinHistory(coinIds[2] ?? "", { days }, { query: { enabled: !!coinIds[2], queryKey: getGetCoinHistoryQueryKey(coinIds[2] ?? "", { days }) } });
  return [q0, q1, q2];
}

interface CoinSearchDropdownProps {
  coins: CoinRow[];
  selected: string[];
  onSelect: (id: string) => void;
}

function CoinSearchDropdown({ coins, selected, onSelect }: CoinSearchDropdownProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return coins
      .filter((c) => !selected.includes(c.id) && (c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q)))
      .slice(0, 8);
  }, [coins, selected, query]);

  return (
    <div className="relative">
      <input
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        placeholder="Search coin to add…"
        value={query}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-background shadow-xl overflow-hidden">
          {filtered.map((coin) => (
            <button
              key={coin.id}
              className="flex w-full items-center gap-3 px-3 py-2 text-sm hover:bg-muted transition-colors"
              onMouseDown={() => {
                onSelect(coin.id);
                setQuery("");
                setOpen(false);
              }}
            >
              <img src={coin.image} alt={coin.name} className="h-6 w-6 rounded-full" />
              <span className="font-medium">{coin.name}</span>
              <span className="text-muted-foreground uppercase text-xs ml-1">{coin.symbol}</span>
              <span className="ml-auto text-muted-foreground">{formatPrice(coin.current_price)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: number;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-background/95 backdrop-blur px-3 py-2 shadow-xl text-xs space-y-1">
      {label && <p className="text-muted-foreground mb-1">{new Date(label).toLocaleDateString()}</p>}
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
          <span className="font-medium">{p.name}</span>
          <span className={`ml-auto font-bold ${p.value >= 0 ? "text-positive" : "text-negative"}`}>
            {p.value >= 0 ? "+" : ""}
            {p.value.toFixed(2)}%
          </span>
        </div>
      ))}
    </div>
  );
};

export default function Compare() {
  useSeoMeta({
    title: "Compare Cryptocurrencies Side by Side — AIFirstCrypto",
    description: "Compare price history, performance, and key stats for any two cryptocurrencies side by side. Free tool, no login required.",
  });
  const [selectedIds, setSelectedIds] = useState<string[]>(["bitcoin", "ethereum"]);
  const [days, setDays] = useState<7 | 30 | 90>(7);

  const { data: coins, isLoading: loadingCoins } = useGetCoins({ page: 1, per_page: 100, order: "market_cap_desc" });
  const histories = useCoinHistories(selectedIds, days);

  const coinMap = useMemo(
    () => Object.fromEntries((coins ?? []).map((c) => [c.id, c as unknown as CoinRow])),
    [coins]
  );

  // Build merged chart data: normalise each coin's series to % change, then align by bucket
  const chartData = useMemo(() => {
    const normalised = selectedIds.map((_id, i) => {
      const raw = histories[i]?.data as { timestamp: number; price: number }[] | undefined;
      return normalizeToPercent(raw ?? []);
    });

    const maxLen = Math.max(...normalised.map((s) => s.length), 0);
    if (!maxLen) return [];

    // Downsample to ~100 points for readability
    const step = Math.max(1, Math.floor(maxLen / 100));

    const base = normalised.find((s) => s.length > 0) ?? [];
    return base
      .filter((_, i) => i % step === 0)
      .map((point, i) => {
        const row: Record<string, number> = { ts: point.ts };
        normalised.forEach((series, si) => {
          const idx = Math.min(Math.round((i * series.length) / (base.length || 1)), series.length - 1);
          if (series[idx] !== undefined) row[selectedIds[si]] = +series[idx].pct.toFixed(4);
        });
        return row;
      });
  }, [selectedIds, histories, days]);

  const isLoadingAny = histories.some((h, i) => i < selectedIds.length && h.isLoading);
  const hasHistoryError = histories.some((h, i) => i < selectedIds.length && h.isError);
  const refetchHistories = () => histories.forEach((h) => h.refetch?.());

  function addCoin(id: string) {
    if (selectedIds.length >= 3 || selectedIds.includes(id)) return;
    setSelectedIds((prev) => [...prev, id]);
  }

  function removeCoin(id: string) {
    setSelectedIds((prev) => prev.filter((c) => c !== id));
  }

  const selectedCoins = selectedIds.map((id) => coinMap[id]).filter(Boolean);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <GitCompareArrows className="h-8 w-8 text-primary" />
          Compare Coins
        </h1>
        <p className="text-muted-foreground mt-1">Overlay price performance for up to 3 cryptocurrencies</p>
      </div>

      {/* Coin selector */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardContent className="p-5 space-y-4">
          {/* Selected chips */}
          <div className="flex flex-wrap gap-2 min-h-[40px]">
            {selectedIds.map((id, i) => {
              const coin = coinMap[id];
              return (
                <Badge
                  key={id}
                  variant="secondary"
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium"
                  style={{ borderColor: COIN_COLORS[i], color: COIN_COLORS[i] }}
                >
                  {coin ? (
                    <>
                      <img src={coin.image} alt={coin.name} className="h-4 w-4 rounded-full" />
                      {coin.name}
                    </>
                  ) : (
                    id
                  )}
                  <button
                    className="ml-1 hover:opacity-70"
                    onClick={() => removeCoin(id)}
                    title={`Remove ${id}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </Badge>
              );
            })}
            {selectedIds.length === 0 && (
              <span className="text-sm text-muted-foreground self-center">No coins selected. Search below to add one.</span>
            )}
          </div>

          {/* Search box */}
          {selectedIds.length < 3 ? (
            loadingCoins ? (
              <Skeleton className="h-10 w-full rounded-lg" />
            ) : (
              <CoinSearchDropdown
                coins={(coins ?? []) as unknown as CoinRow[]}
                selected={selectedIds}
                onSelect={addCoin}
              />
            )
          ) : (
            <p className="text-xs text-muted-foreground">Maximum 3 coins. Remove one to add another.</p>
          )}
        </CardContent>
      </Card>

      {/* Chart */}
      {selectedIds.length > 0 && (
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <CardTitle className="text-xl">Price Performance</CardTitle>
                <CardDescription className="flex items-center gap-1.5">
                  Normalised to % change from start of period
                  <InfoTooltip content="All coins start at 0% regardless of their price. This lets you fairly compare whether Bitcoin, Ethereum, or Solana performed better over the same window." />
                </CardDescription>
              </div>
              {/* Period switcher */}
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                {DAYS_OPTIONS.map((opt) => (
                  <Button
                    key={opt.value}
                    variant={days === opt.value ? "default" : "ghost"}
                    size="sm"
                    className="px-3 h-7 text-xs"
                    onClick={() => setDays(opt.value as 7 | 30 | 90)}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingAny ? (
              <Skeleton className="h-72 w-full rounded-xl" />
            ) : hasHistoryError ? (
              <div className="h-72 flex flex-col items-center justify-center gap-3 text-center px-4">
                <AlertCircle className="h-8 w-8 text-muted-foreground/60" />
                <div>
                  <p className="text-sm font-semibold">Chart data temporarily unavailable</p>
                  <p className="text-xs text-muted-foreground mt-1">The data provider may be rate-limiting requests. It refreshes automatically.</p>
                </div>
                <Button variant="outline" size="sm" onClick={refetchHistories} className="gap-2 mt-1">
                  <RefreshCw className="h-3.5 w-3.5" /> Try again
                </Button>
              </div>
            ) : chartData.length === 0 ? (
              <div className="h-72 flex items-center justify-center text-muted-foreground text-sm">
                No data available for selected period
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={chartData} margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                  <XAxis
                    dataKey="ts"
                    tickFormatter={(v) => {
                      const d = new Date(v);
                      return days <= 7
                        ? d.toLocaleDateString(undefined, { weekday: "short" })
                        : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
                    }}
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                    minTickGap={40}
                  />
                  <YAxis
                    tickFormatter={(v) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`}
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                    width={60}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    formatter={(value) => {
                      const coin = coinMap[value];
                      return coin ? coin.name : value;
                    }}
                    wrapperStyle={{ fontSize: 12 }}
                  />
                  {selectedIds.map((id, i) => (
                    <Line
                      key={id}
                      type="monotone"
                      dataKey={id}
                      name={id}
                      stroke={COIN_COLORS[i]}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 0 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* Metrics comparison table */}
      {selectedCoins.length > 0 && (
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-xl">Side-by-Side Metrics</CardTitle>
            <CardDescription>Key figures at a glance</CardDescription>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-muted-foreground font-medium px-5 py-3 w-36">Metric</th>
                  {selectedCoins.map((coin, i) => (
                    <th key={coin.id} className="text-right px-5 py-3 font-semibold" style={{ color: COIN_COLORS[i] }}>
                      <div className="flex items-center justify-end gap-2">
                        <img src={coin.image} alt={coin.name} className="h-5 w-5 rounded-full" />
                        {coin.symbol.toUpperCase()}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    label: "Price",
                    tooltip: null as string | null,
                    format: (c: CoinRow) => formatPrice(c.current_price),
                    highlight: false,
                  },
                  {
                    label: "24h Change",
                    tooltip: "Price change percentage over the last 24 hours.",
                    format: (c: CoinRow) => formatPercentage(c.price_change_percentage_24h),
                    highlight: true,
                    positive: (c: CoinRow) => (c.price_change_percentage_24h ?? 0) >= 0,
                  },
                  {
                    label: "Market Cap",
                    tooltip: "Total market value = price × circulating supply. Higher = larger, more established coin.",
                    format: (c: CoinRow) => `$${formatCompactNumber(c.market_cap)}`,
                    highlight: false,
                  },
                  {
                    label: "24h Volume",
                    tooltip: "Total dollar value traded in the last 24 hours. High volume = more active interest.",
                    format: (c: CoinRow) => `$${formatCompactNumber(c.total_volume)}`,
                    highlight: false,
                  },
                ].map((row, ri) => (
                  <tr key={row.label} className={ri % 2 === 0 ? "bg-muted/20" : ""}>
                    <td className="px-5 py-3 text-muted-foreground font-medium">
                      <span className="inline-flex items-center gap-1">
                        {row.label}
                        {row.tooltip && <InfoTooltip content={row.tooltip} />}
                      </span>
                    </td>
                    {selectedCoins.map((coin) => {
                      const val = row.format(coin);
                      const isPos = row.highlight ? row.positive!(coin) : null;
                      return (
                        <td
                          key={coin.id}
                          className={`text-right px-5 py-3 font-semibold tabular-nums ${
                            isPos === true
                              ? "text-positive"
                              : isPos === false
                              ? "text-negative"
                              : "text-foreground"
                          }`}
                        >
                          {val}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {selectedIds.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
          <div className="bg-muted p-4 rounded-full">
            <GitCompareArrows className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="font-semibold text-lg">Select at least one coin to get started</p>
          <p className="text-muted-foreground text-sm max-w-sm">
            Search for any coin above and compare up to 3 at once.
          </p>
        </div>
      )}
    </div>
  );
}
