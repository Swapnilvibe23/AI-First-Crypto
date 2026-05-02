import { useState } from "react";
import { useGetCoins } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { formatPrice, formatCompactNumber, formatPercentage } from "@/lib/format";
import { TrendingDown, TrendingUp, Search, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
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

export default function Rates() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [order, setOrder] = useState("market_cap_desc");
  const [perPage, setPerPage] = useState("50");

  const { data: coins, isLoading } = useGetCoins({
    page,
    per_page: parseInt(perPage),
    order,
  });

  const filteredCoins = coins?.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.symbol.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Live Rates</h1>
          <p className="text-muted-foreground mt-1">Real-time cryptocurrency prices and market data</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search coins..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
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
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Show" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50">Top 50</SelectItem>
                <SelectItem value="100">Top 100</SelectItem>
                <SelectItem value="250">Top 250</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

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
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    No coins found matching "{search}"
                  </TableCell>
                </TableRow>
              ) : (
                filteredCoins?.map((coin) => (
                  <TableRow key={coin.id} className="hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => window.location.href = `/coin/${coin.id}`}>
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
                        {coin.price_change_percentage_24h && coin.price_change_percentage_24h >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
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
      
      {!search && (
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
            disabled={isLoading || (coins && coins.length < parseInt(perPage))}
          >
            Next <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}
