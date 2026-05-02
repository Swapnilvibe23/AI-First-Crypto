interface FearGreedGaugeProps {
  value: number;
}

export function FearGreedGauge({ value }: FearGreedGaugeProps) {
  const segments = [
    { start: 0, end: 20, color: "#991b1b" },
    { start: 20, end: 40, color: "#ea580c" },
    { start: 40, end: 60, color: "#eab308" },
    { start: 60, end: 80, color: "#84cc16" },
    { start: 80, end: 100, color: "#10b981" },
  ];

  const getCoordinatesForAngle = (angle: number, radius: number) => {
    const angleInRadians = (angle * Math.PI) / 180;
    return {
      x: 100 + radius * Math.cos(angleInRadians),
      y: 100 - radius * Math.sin(angleInRadians),
    };
  };

  const createArc = (startVal: number, endVal: number, innerR: number, outerR: number) => {
    const startAngle = 180 - (startVal / 100) * 180;
    const endAngle = 180 - (endVal / 100) * 180;

    const startOuter = getCoordinatesForAngle(startAngle, outerR);
    const endOuter = getCoordinatesForAngle(endAngle, outerR);
    const startInner = getCoordinatesForAngle(startAngle, innerR);
    const endInner = getCoordinatesForAngle(endAngle, innerR);

    const largeArcFlag = startAngle - endAngle <= 180 ? "0" : "1";

    return [
      "M", startOuter.x, startOuter.y,
      "A", outerR, outerR, 0, largeArcFlag, 1, endOuter.x, endOuter.y,
      "L", endInner.x, endInner.y,
      "A", innerR, innerR, 0, largeArcFlag, 0, startInner.x, startInner.y,
      "Z"
    ].join(" ");
  };

  const needleAngle = 180 - (Math.max(0, Math.min(100, value)) / 100) * 180;
  const needlePos = getCoordinatesForAngle(needleAngle, 75);

  return (
    <svg viewBox="0 0 200 120" className="w-full max-w-[300px] mx-auto">
      {segments.map((seg, i) => (
        <path key={i} d={createArc(seg.start, seg.end, 55, 80)} fill={seg.color} />
      ))}
      <line
        x1="100" y1="100" x2={needlePos.x} y2={needlePos.y}
        stroke="currentColor" strokeWidth="3" strokeLinecap="round"
      />
      <circle cx="100" cy="100" r="5" fill="currentColor" />
    </svg>
  );
}