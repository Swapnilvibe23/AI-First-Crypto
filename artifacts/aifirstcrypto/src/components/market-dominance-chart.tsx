import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface MarketDominanceChartProps {
  btcDominance: number;
}

export function MarketDominanceChart({ btcDominance }: MarketDominanceChartProps) {
  const ethDominance = btcDominance * 0.38;
  const othersDominance = 100 - btcDominance - ethDominance;

  const data = [
    { name: "BTC", value: btcDominance, color: "#f7931a" },
    { name: "ETH", value: ethDominance, color: "#627eea" },
    { name: "Others", value: Math.max(0, othersDominance), color: "#64748b" },
  ];

  return (
    <div className="w-full flex flex-col items-center">
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap justify-center gap-4 mt-2">
        {data.map((entry, index) => (
          <div key={index} className="flex items-center gap-1.5 text-sm">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="font-medium">{entry.name}</span>
            <span className="text-muted-foreground">{entry.value.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}