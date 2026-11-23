import React, { useMemo, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { SneakerPair } from '../types/app';
import { computeProfitTimeline } from '../utils/sneakerMath';

interface SneakerProfitChartProps {
  sneakers: SneakerPair[];
}

export const SneakerProfitChart: React.FC<SneakerProfitChartProps> = ({ sneakers }) => {
  const timeline = useMemo(() => computeProfitTimeline(sneakers), [sneakers]);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (timeline.length === 0) {
    return (
      <section
        aria-label="Net Profit vs Losses Chart"
        className="rounded-2xl bg-slate-900/60 backdrop-blur-md border border-emerald-500/25 p-5"
      >
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="w-4 h-4 text-emerald-400" aria-hidden="true" />
          <h2 className="font-display font-bold text-sm text-white">
            Net Profit vs. Losses Over Time
          </h2>
        </div>
        <p className="text-xs text-slate-400">
          Mark your first pair Sold or Loss to unlock chronological profit vs. loss tracking and cumulative ROI curve.
        </p>
      </section>
    );
  }

  const width = 760;
  const height = 210;
  const padX = 48;
  const padY = 26;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;

  const allValues = timeline.flatMap((pt) => [pt.netDelta, pt.cumulativeNet, 0]);
  const minVal = Math.min(...allValues, -20);
  const maxVal = Math.max(...allValues, 20);
  const span = Math.max(10, maxVal - minVal);

  const yFor = (val: number) => padY + ((maxVal - val) / span) * innerH;
  const zeroY = yFor(0);

  const slotW = innerW / timeline.length;
  const barW = Math.max(18, Math.min(44, slotW * 0.56));

  const linePoints = timeline
    .map((pt, idx) => {
      const cx = padX + idx * slotW + slotW / 2;
      const cy = yFor(pt.cumulativeNet);
      return `${cx},${cy}`;
    })
    .join(' ');

  const hoveredPoint = hoveredIdx !== null ? timeline[hoveredIdx] : timeline[timeline.length - 1];

  return (
    <section
      aria-label="Net Profit vs Losses Chart"
      data-testid="sneaker-profit-chart"
      className="hud-corners hud-emerald rounded-2xl bg-slate-900/60 backdrop-blur-md border border-emerald-500/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] p-4 sm:p-5 space-y-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-emerald-400" aria-hidden="true" />
          <div>
            <h2 className="font-display font-bold text-sm sm:text-base text-white">
              Net Profit vs. Losses Over Time
            </h2>
            <p className="text-xs text-slate-400">
              Sold gains (emerald), logged losses (rose), and cumulative net trend (cyan line)
            </p>
          </div>
        </div>

        {hoveredPoint && (
          <div className="rounded-xl bg-slate-950/75 border border-white/10 px-3 py-1.5 text-xs flex flex-wrap items-center gap-2.5">
            <span className="font-semibold text-white truncate max-w-[200px]">
              {hoveredPoint.modelName}
            </span>
            <span className="text-slate-500" aria-hidden="true">·</span>
            <span className="font-mono-nums text-slate-300">{hoveredPoint.date}</span>
            <span className="text-slate-500" aria-hidden="true">·</span>
            <span
              className={`font-mono-nums font-bold ${
                hoveredPoint.netDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {hoveredPoint.netDelta >= 0 ? '+' : '-'}${Math.abs(hoveredPoint.netDelta).toFixed(2)}
            </span>
            <span className="font-mono-nums text-cyan-300">
              Cum: {hoveredPoint.cumulativeNet >= 0 ? '+' : '-'}$
              {Math.abs(hoveredPoint.cumulativeNet).toFixed(2)}
            </span>
          </div>
        )}
      </div>

      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full min-w-[480px] h-48 select-none"
          role="img"
          aria-label="Bar and line chart of sneaker net profits, losses, and cumulative net profit"
        >
          {/* Baseline zero line */}
          <line
            x1={padX}
            y1={zeroY}
            x2={width - padX}
            y2={zeroY}
            stroke="rgba(148,163,184,0.35)"
            strokeDasharray="4 4"
          />
          <text
            x={padX - 8}
            y={zeroY + 4}
            textAnchor="end"
            fill="rgba(148,163,184,0.85)"
            fontSize="10"
            className="font-mono-nums"
          >
            $0
          </text>
          <text
            x={padX - 8}
            y={padY + 4}
            textAnchor="end"
            fill="rgba(52,211,153,0.85)"
            fontSize="10"
            className="font-mono-nums"
          >
            +${Math.round(maxVal)}
          </text>
          <text
            x={padX - 8}
            y={height - padY + 4}
            textAnchor="end"
            fill="rgba(251,113,133,0.85)"
            fontSize="10"
            className="font-mono-nums"
          >
            -${Math.abs(Math.round(minVal))}
          </text>

          {/* Profit / Loss Bars */}
          {timeline.map((pt, idx) => {
            const cx = padX + idx * slotW + slotW / 2;
            const barY = pt.netDelta >= 0 ? yFor(pt.netDelta) : zeroY;
            const barH = Math.max(4, Math.abs(yFor(pt.netDelta) - zeroY));
            const isGain = pt.netDelta >= 0;
            const active = hoveredIdx === idx;

            return (
              <g
                key={pt.id}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer"
              >
                <rect
                  x={cx - barW / 2}
                  y={barY}
                  width={barW}
                  height={barH}
                  rx={5}
                  fill={isGain ? 'rgba(16, 185, 129, 0.72)' : 'rgba(244, 63, 94, 0.72)'}
                  stroke={
                    active
                      ? '#ffffff'
                      : isGain
                        ? 'rgba(52, 211, 153, 0.9)'
                        : 'rgba(251, 113, 133, 0.9)'
                  }
                  strokeWidth={active ? 2 : 1}
                />
                <text
                  x={cx}
                  y={height - 6}
                  textAnchor="middle"
                  fill="rgba(148,163,184,0.85)"
                  fontSize="10"
                  className="font-mono-nums"
                >
                  {pt.label}
                </text>
              </g>
            );
          })}

          {/* Cumulative Net Profit Trend Line */}
          {timeline.length >= 2 && (
            <polyline
              fill="none"
              stroke="#22d3ee"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={linePoints}
            />
          )}

          {/* Line Nodes */}
          {timeline.map((pt, idx) => {
            const cx = padX + idx * slotW + slotW / 2;
            const cy = yFor(pt.cumulativeNet);
            return (
              <circle
                key={`${pt.id}-dot`}
                cx={cx}
                cy={cy}
                r={hoveredIdx === idx ? 5.5 : 4}
                fill="#0f172a"
                stroke="#22d3ee"
                strokeWidth="2"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            );
          })}
        </svg>
      </div>
    </section>
  );
};
