"use client";

interface DataPoint {
  label: string;
  value: number;
}

export function BarChart({ data, maxValue, color = "#25D366", height = 200 }: {
  data: DataPoint[];
  maxValue?: number;
  color?: string;
  height?: number;
}) {
  const max = maxValue || Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {data.map((point, i) => (
        <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
          <div className="text-[10px] text-gray-500 mb-1">
            {point.value > 0 ? point.value : ""}
          </div>
          <div
            className="w-full rounded-t-md transition-all duration-500"
            style={{
              height: `${Math.max((point.value / max) * 100, 2)}%`,
              backgroundColor: color,
              opacity: 0.7 + (point.value / max) * 0.3,
              minHeight: point.value > 0 ? 4 : 2,
            }}
          />
          <div className="text-[9px] text-gray-400 mt-1 truncate w-full text-center">
            {point.label}
          </div>
        </div>
      ))}
    </div>
  );
}

export function FunnelChart({ stages }: {
  stages: { label: string; value: number; color: string }[];
}) {
  const max = Math.max(...stages.map((s) => s.value), 1);

  return (
    <div className="space-y-3">
      {stages.map((stage, i) => (
        <div key={i}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">{stage.label}</span>
            <span className="text-sm font-bold text-dark">{stage.value}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-6 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 flex items-center justify-end pr-2"
              style={{
                width: `${Math.max((stage.value / max) * 100, 3)}%`,
                backgroundColor: stage.color,
              }}
            >
              {stage.value > 0 && (
                <span className="text-white text-[10px] font-bold">
                  {Math.round((stage.value / max) * 100)}%
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function MiniSparkline({ values, color = "#25D366" }: { values: number[]; color?: string }) {
  if (values.length === 0) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const width = 120;
  const height = 32;

  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={width} height={height} className="inline-block">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
