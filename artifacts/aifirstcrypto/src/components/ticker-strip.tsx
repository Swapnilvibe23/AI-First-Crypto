interface TickerItem {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h?: number | null;
}

interface TickerStripProps {
  items: TickerItem[];
}

export function TickerStrip({ items }: TickerStripProps) {
  if (!items.length) return null;

  const doubled = [...items, ...items];

  return (
    <div
      className="w-full overflow-hidden border-y border-border/30 bg-card/30 backdrop-blur-sm py-2"
      aria-hidden="true"
    >
      <div className="ticker-track items-center">
        {doubled.map((coin, i) => {
          const change = coin.price_change_percentage_24h ?? 0;
          const isUp = change >= 0;
          const price =
            coin.current_price < 0.01
              ? coin.current_price.toPrecision(3)
              : coin.current_price < 1
              ? coin.current_price.toPrecision(4)
              : coin.current_price.toLocaleString(undefined, { maximumFractionDigits: 2 });

          return (
            <span
              key={`${coin.id}-${i}`}
              className="inline-flex items-center gap-2 px-5 py-0.5 border-r border-border/25 last:border-r-0 flex-shrink-0"
            >
              <img
                src={coin.image}
                alt={coin.symbol}
                className="h-3.5 w-3.5 rounded-full flex-shrink-0"
              />
              <span className="text-muted-foreground font-semibold text-[11px] tracking-wide uppercase">
                {coin.symbol}
              </span>
              <span className="font-bold tabular-nums text-[11px] text-foreground">
                ${price}
              </span>
              <span
                className={`text-[11px] font-bold ${
                  isUp ? "text-positive" : "text-negative"
                }`}
              >
                {isUp ? "▲" : "▼"}
                {Math.abs(change).toFixed(2)}%
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
