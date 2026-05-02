import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { formatPercentage } from "@/lib/format";

interface Coin {
  id: string;
  symbol: string;
  name: string;
  image?: string;
  price_change_percentage_24h?: number | null;
}

interface MoversBarChartProps {
  gainers: Coin[];
  losers: Coin[];
}

export function MoversBarChart({ gainers, losers }: MoversBarChartProps) {
  const data = [
    ...gainers.slice(0, 5).map(c => ({ name: c.symbol.toUpperCase(), value: c.price_change_percentage_24h || 0, isGainer: true })),
    ...losers.slice(0, 5).map(c => ({ name: c.symbol.toUpperCase(), value: c.price_change_percentage_24h || 0, isGainer: false }))
  ];

  return (
    <div className="h-[400px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <XAxis type="number" hide />
          <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted-foreground)' }} />
          <Tooltip
            cursor={{ fill: 'var(--muted)' }}
            contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px' }}
            formatter={(val: number) => [`${val > 0 ? '+' : ''}${val.toFixed(2)}%`, 'Change']}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.isGainer ? "#10b981" : "#ef4444"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}