import { useState, useMemo } from "react";
import { useGetCoins } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { formatPrice, formatCompactNumber, formatPercentage } from "@/lib/format";
import { TrendingDown, TrendingUp, Search, ChevronLeft, ChevronRight, LayoutGrid, List } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Sparkline } from "@/components/sparkline";

// ── Heat map helpers ──────────────────────────────────────────────────────────

function getHeatStyle(pct: number | null | undefined): { background: string; text: string } {
  if (pct == null) return { background: "hsl(240 6% 15%)", text: "hsl(240 5% 65%)" };
  // Green scale
  if (pct >= 15) return { background: "#052e16", text: "#4ade80" };
  if (pct >= 10) return { background: "#064e3b", text: "#34d399" };
  if (pct >= 5)  return { background: "#065f46", text: "#6ee7b7" };
  if (pct >= 2)  return { background: "#047857", text: "#a7f3d0" };
  if (pct >= 0.5) return { background: "#059669", text: "#d1fae5" };
  // Neutral
  if (pct >= -0.5) return { background: "hsl(240 6% 17%)", text: "hsl(240 5% 65%)" };
  // Red scale
  if (pct >= -2)  return { background: "#991b1b", text: "#fca5a5" };
  if (pct >= -5)  return { background: "#7f1d1d", text: "#fca5a5" };
  if (pct >= -10) return { background: "#6b1a1a", text: "#f87171" };
  if (pct >= -15) return { background: "#570909", text: "#f87171" };
  return { background: "#450a0a", text: "#ef4444" };
}

// Bucket market caps into 3 tile sizes for a proportional feel
function getTileSize(rank: number | null | undefined): "lg" | "md" | "sm" {
  if (!rank) return "sm";
  if (rank <= 10) return "lg";
  if (rank <= 30) return "md";
  return "sm";
}

interface HeatTileProps {
  coin: {
    id: string;
    name: string;
    symbol: string;
    image: string;
    current_price: number;
    price_change_percentage_24h: number | null;
    market_cap_rank: number | null;
  };
}

function HeatTile({ coin }: HeatTileProps) {
  const pct = coin.price_change_percentage_24h;
  const { background, text } = getHeatStyle(pct);
  const size = getTileSize(coin.market_cap_rank);

  const sizeClasses = {
    lg: "col-span-2 row-span-2 p-4 min-h-[140px]",
    md: "col-span-2 row-span-1 p-3 min-h-[90px] sm:col-span-1 sm:row-span-2 sm:min-h-[140px]",
    sm: "col-span-1 row-span-1 p-2.5 min-h-[90px]",
  };

  return (
    <Link href={`/coin/${coin.id}`}>
      <div
        className={`rounded-xl cursor-pointer transition-all duration-150 hover:brightness-125 hover:scale-[1.02] hover:z-10 relative flex flex-col justify-between ${sizeClasses[size]}`}
        style={{ background }}
        title={`${coin.name}: ${formatPercentage(pct)}`}
      >
        {/* Top row: image + symbol */}
        <div className="flex items-center gap-1.5 min-w-0">
          <img src={coin.image} alt={coin.name} className={`rounded-full flex-shrink-0 ${size === "lg" ? "h-7 w-7" : "h-5 w-5"}`} />
          <div className="min-w-0">
            <div className={`font-bold uppercase truncate leading-tight ${size === "lg" ? "text-base" : "text-xs"}`} style={{ color: text }}>
              {coin.symbol}
            </div>
            {size === "lg" && (
              <div className="text-xs truncate" style={{ color: text, opacity: 0.7 }}>{coin.name}</div>
            )}
          </div>
        </div>

        {/* Bottom row: price + change */}
        <div className="mt-1">
          {size !== "sm" && (
            <div className={`font-medium truncate ${size === "lg" ? "text-sm" : "text-xs"}`} style={{ color: text, opacity: 0.8 }}>
              {formatPrice(coin.current_price)}
            </div>
          )}
          <div className={`font-bold tabular-nums ${size === "lg" ? "text-2xl" : size === "md" ? "text-base" : "text-sm"}`} style={{ color: text }}>
            {pct != null ? (pct >= 0 ? "+" : "") + pct.toFixed(2) + "%" : "—"}
          </div>
        </div>
      </div>
    </Link>
  );
}

function HeatMapLegend() {
  const steps = [
    { label: "≥+10%", ...getHeatStyle(12) },
    { label: "+5%",   ...getHeatStyle(6) },
    { label: "+2%",   ...getHeatStyle(3) },
    { label: "Flat",  ...getHeatStyle(0) },
    { label: "−2%",   ...getHeatStyle(-3) },
    { label: "−5%",   ...getHeatStyle(-6) },
    { label: "≤−10%", ...getHeatStyle(-12) },
  ];
  return (
    <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
      <span className="font-medium">Scale:</span>
      {steps.map((s) => (
        <span
          key={s.label}
          className="px-2 py-0.5 rounded font-medium"
          style={{ background: s.background, color: s.text }}
        >
          {s.label}
        </span>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type ViewMode = "table" | "heatmap";

export default function Rates() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [order, setOrder] = useState("market_cap_desc");
  const [perPage, setPerPage] = useState("50");
  const [view, setView] = useState<ViewMode>("table");

  const { data: coins, isLoading } = useGetCoins({
    page,
    per_page: parseInt(perPage),
    order,
  });

  const filteredCoins = useMemo(
    () =>
      coins?.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.symbol.toLowerCase().includes(search.toLowerCase())
      ),
    [coins, search]
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Header + controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Live Rates</h1>
          <p className="text-muted-foreground mt-1">Real-time cryptocurrency prices and market data</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search coins..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Sort + page size */}
          <div className="flex items-center gap-2">
            <Select value={order} onValueChange={setOrder}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="market_cap_desc">Highest Market Cap</SelectItem>
                <SelectItem value="market_cap_asc">Lowest Market Cap</SelectItem>
                <SelectItem value="volume_desc">Highest Volume</SelectItem>
                <SelectItem value="volume_asc">Lowest Volume</SelectItem>
              </SelectContent>
            </Select>
            <Select value={perPage} onValueChange={setPerPage}>
              <SelectTrigger className="w-[95px]">
                <SelectValue placeholder="Show" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50">Top 50</SelectItem>
                <SelectItem value="100">Top 100</SelectItem>
                <SelectItem value="250">Top 250</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <Button
              variant={view === "table" ? "default" : "ghost"}
              size="sm"
              className="h-7 px-2.5 gap-1.5"
              onClick={() => setView("table")}
              title="Table view"
            >
              <List className="h-3.5 w-3.5" />
              <span className="text-xs">Table</span>
            </Button>
            <Button
              variant={view === "heatmap" ? "default" : "ghost"}
              size="sm"
              className="h-7 px-2.5 gap-1.5"
              onClick={() => setView("heatmap")}
              title="Heat map view"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="text-xs">Heat Map</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ── Heat Map View ─────────────────────────────────────────── */}
      {view === "heatmap" && (
        <div className="space-y-4">
          <HeatMapLegend />
          {isLoading ? (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
              {Array.from({ length: 40 }).map((_, i) => (
                <Skeleton key={i} className="rounded-xl h-[90px]" />
              ))}
            </div>
          ) : (
            <div
              className="grid gap-2"
              style={{
                gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))",
                gridAutoFlow: "dense",
              }}
            >
              {filteredCoins?.map((coin) => (
                <HeatTile key={coin.id} coin={coin as HeatTileProps["coin"]} />
              ))}
            </div>
          )}
          {filteredCoins?.length === 0 && !isLoading && (
            <div className="text-center py-16 text-muted-foreground">
              No coins found matching "{search}"
            </div>
          )}
        </div>
      )}

      {/* ── Table View ────────────────────────────────────────────── */}
      {view === "table" && (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">#</TableHead>
                  <TableHead>Coin</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">24h Change</TableHead>
                  <TableHead className="text-right hidden md:table-cell">7d</TableHead>
                  <TableHead className="text-right hidden md:table-cell">Market Cap</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">Volume</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-4 mx-auto" /></TableCell>
                      <TableCell><div className="flex items-center gap-2"><Skeleton className="h-8 w-8 rounded-full" /><Skeleton className="h-4 w-24" /></div></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                      <TableCell className="text-right hidden md:table-cell"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                      <TableCell className="text-right hidden md:table-cell"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                      <TableCell className="text-right hidden sm:table-cell"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredCoins?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      No coins found matching "{search}"
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCoins?.map((coin) => (
                    <TableRow
                      key={coin.id}
                      className="hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => window.location.href = `/coin/${coin.id}`}
                    >
                      <TableCell className="text-center font-medium text-muted-foreground">
                        {coin.market_cap_rank}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img src={coin.image} alt={coin.name} className="h-8 w-8 rounded-full" />
                          <div className="flex flex-col">
                            <span className="font-bold">{coin.name}</span>
                            <span className="text-xs text-muted-foreground uppercase">{coin.symbol}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {formatPrice(coin.current_price)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className={`inline-flex items-center gap-1 font-medium ${coin.price_change_percentage_24h && coin.price_change_percentage_24h >= 0 ? "text-positive" : "text-negative"}`}>
                          {coin.price_change_percentage_24h && coin.price_change_percentage_24h >= 0
                            ? <TrendingUp className="h-3 w-3" />
                            : <TrendingDown className="h-3 w-3" />}
                          {formatPercentage(coin.price_change_percentage_24h)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right hidden md:table-cell">
                        <div className="w-24 ml-auto">
                          <Sparkline
                            data={coin.sparkline_in_7d?.price ?? []}
                            positive={(coin.price_change_percentage_7d_in_currency ?? coin.price_change_percentage_24h ?? 0) >= 0}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-right hidden md:table-cell text-muted-foreground font-medium">
                        ${formatCompactNumber(coin.market_cap)}
                      </TableCell>
                      <TableCell className="text-right hidden sm:table-cell text-muted-foreground font-medium">
                        ${formatCompactNumber(coin.total_volume)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Pagination (table view only) */}
      {view === "table" && !search && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1 || isLoading}
          >
            <ChevronLeft className="h-4 w-4 mr-2" /> Previous
          </Button>
          <span className="text-sm font-medium">Page {page}</span>
          <Button
            variant="outline"
            onClick={() => setPage(page + 1)}
            disabled={isLoading || !!(coins && coins.length < parseInt(perPage))}
          >
            Next <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}
