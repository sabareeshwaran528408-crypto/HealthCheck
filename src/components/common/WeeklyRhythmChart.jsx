import React, { useState } from 'react';

const DEFAULT_DATA = [
  { day: 'Mon', value: 75 },
  { day: 'Tue', value: 50 },
  { day: 'Wed', value: 62 },
  { day: 'Thu', value: 68 },
  { day: 'Fri', value: 58 },
  { day: 'Sat', value: 70 },
  { day: 'Sun', value: 80 },
];

export default function WeeklyRhythmChart({ rhythmData }) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const data = rhythmData && rhythmData.length > 0
    ? rhythmData.map((d) => ({
        day: d.day,
        value: typeof d.percentage === 'number' ? d.percentage : (d.value ?? 0),
      }))
    : DEFAULT_DATA;

  // SVG dimensions
  const width = 360;
  const height = 90;
  const paddingX = 24;
  const paddingTop = 12;
  const paddingBottom = 16;

  // Calculate coordinates
  const points = data.map((d, index) => {
    const x = paddingX + (index * (width - 2 * paddingX)) / (data.length - 1);
    const y = paddingTop + ((100 - d.value) / 100) * (height - paddingTop - paddingBottom);
    return { ...d, x, y };
  });

  // Construct curved SVG path (Cubic Bezier spline)
  const pathData = points.reduce((acc, point, index, array) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    const prev = array[index - 1];
    const cpX1 = prev.x + (point.x - prev.x) / 2;
    const cpY1 = prev.y;
    const cpX2 = prev.x + (point.x - prev.x) / 2;
    const cpY2 = point.y;
    return `${acc} C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${point.x} ${point.y}`;
  }, '');

  const areaData = `${pathData} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  return (
    <div className="w-full">
      <div className="relative w-full h-[95px]">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="rhythmGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--hc-primary-hover)" stopOpacity="0.28" />
              <stop offset="80%" stopColor="var(--hc-accent)" stopOpacity="0.04" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Area Fill */}
          <path d={areaData} fill="url(#rhythmGradient)" />

          {/* Line Stroke */}
          <path
            d={pathData}
            fill="none"
            stroke="var(--hc-primary)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points */}
          {points.map((pt, idx) => (
            <g key={idx} className="cursor-pointer" onMouseEnter={() => setHoveredPoint(pt)} onMouseLeave={() => setHoveredPoint(null)}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r="4"
                fill="#FFFFFF"
                stroke="var(--hc-primary)"
                strokeWidth="2.5"
                className="transition-transform duration-200 hover:scale-150"
              />
            </g>
          ))}
        </svg>

        {hoveredPoint && (
          <div
            className="absolute -top-7 -translate-x-1/2 bg-[var(--hc-ink)] text-white text-[11px] font-semibold py-0.5 px-2 rounded-md shadow-md pointer-events-none transition-all"
            style={{ left: `${(hoveredPoint.x / width) * 100}%` }}
          >
            {hoveredPoint.day}: {hoveredPoint.value}%
          </div>
        )}
      </div>

      {/* Day Labels and Values */}
      <div className="flex items-center justify-between px-1 mt-2 text-center">
        {data.map((item, idx) => (
          <div key={idx} className="flex flex-col items-center">
            <span className="text-[11px] font-medium text-[var(--hc-muted)]">{item.day}</span>
            <span className="text-[11px] font-semibold text-[var(--hc-ink)]">{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
