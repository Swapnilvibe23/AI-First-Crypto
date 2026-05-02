import { AreaChart, Area } from "recharts";

interface SparklineProps {
  data: number[];
  positive: boolean;
  width?: number;
  height?: number;
}

export function Sparkline({ data, positive, width = 100, height = 40 }: SparklineProps) {
  const chartData = data.map((value, index) => ({ index, value }));
  const color = positive ? "#10b981" : "#ef4444";
  const gradientId = `sg-${positive ? "pos" : "neg"}`;

  return (
    <AreaChart width={width} height={height} data={chartData}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={color} stopOpacity={0.3} />
          <stop offset="95%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <Area
        type="monotone"
        dataKey="value"
        stroke={color}
        fill={`url(#${gradientId})`}
        strokeWidth={1.5}
        isAnimationActive={false}
        dot={false}
      />
    </AreaChart>
  );
}
