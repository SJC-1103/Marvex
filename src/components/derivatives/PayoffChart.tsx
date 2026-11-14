import React, { useState } from 'react';
import { StrategyPayoffSummary, StrategyLeg, UnderlyingAsset } from '../../types/derivatives';
import { Currency } from '../../types/market';
import { formatCurrency } from '../../utils/currency';

interface PayoffChartProps {
  summary: StrategyPayoffSummary;
  spotPrice: number;
  underlying: UnderlyingAsset;
  legs: StrategyLeg[];
  currency: Currency;
  exchangeRate: number;
}

export const PayoffChart: React.FC<PayoffChartProps> = ({
  summary,
  spotPrice,
  underlying,
  legs,
  currency,
  exchangeRate,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<{
    spot: number;
    expiryPnl: number;
    targetPnl: number;
    x: number;
    y: number;
  } | null>(null);

  const fmt = (val: number, decimals = 2) =>
    formatCurrency(val, currency, underlying.currency, exchangeRate, decimals);

  const curve = summary.curve;
  if (!curve || curve.length === 0) {
    return (
      <div className="h-72 rounded-2xl bg-black/40 border border-white/[0.08] flex items-center justify-center text-slate-500 font-mono-code text-xs">
        Add or enable legs to calculate payoff curve
      </div>
    );
  }

  const width = 800;
  const height = 300;
  const padding = { top: 25, right: 30, bottom: 40, left: 78 };

  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const minSpot = curve[0].spotPrice;
  const maxSpot = curve[curve.length - 1].spotPrice;

  // Determine PnL min & max for scale
  let minPnl = 0;
  let maxPnl = 0;
  curve.forEach(pt => {
    if (pt.pnlAtExpiry < minPnl) minPnl = pt.pnlAtExpiry;
    if (pt.pnlAtExpiry > maxPnl) maxPnl = pt.pnlAtExpiry;
    if (pt.pnlAtTargetDate < minPnl) minPnl = pt.pnlAtTargetDate;
    if (pt.pnlAtTargetDate > maxPnl) maxPnl = pt.pnlAtTargetDate;
  });

  // Add 15% buffer
  const pnlSpan = Math.max(Math.abs(maxPnl), Math.abs(minPnl), 1000);
  const yUpper = Math.max(maxPnl * 1.15, pnlSpan * 0.2);
  const yLower = Math.min(minPnl * 1.15, -pnlSpan * 0.2);

  const scaleX = (spot: number) => {
    return padding.left + ((spot - minSpot) / (maxSpot - minSpot)) * innerWidth;
  };

  const scaleY = (pnl: number) => {
    return padding.top + ((yUpper - pnl) / (yUpper - yLower)) * innerHeight;
  };

  const zeroY = scaleY(0);
  const spotX = scaleX(spotPrice);

  // SVG Path for Expiry PnL
  const expiryPoints = curve.map(pt => `${scaleX(pt.spotPrice)},${scaleY(pt.pnlAtExpiry)}`).join(' ');
  const targetPoints = curve.map(pt => `${scaleX(pt.spotPrice)},${scaleY(pt.pnlAtTargetDate)}`).join(' ');

  // Shaded area under expiry curve (green above zero, red below zero)
  const positiveAreaPoints = curve
    .map(pt => `${scaleX(pt.spotPrice)},${scaleY(Math.max(0, pt.pnlAtExpiry))}`)
    .join(' ');
  const positivePath = `M ${scaleX(minSpot)},${zeroY} ${positiveAreaPoints} L ${scaleX(maxSpot)},${zeroY} Z`;

  const negativeAreaPoints = curve
    .map(pt => `${scaleX(pt.spotPrice)},${scaleY(Math.min(0, pt.pnlAtExpiry))}`)
    .join(' ');
  const negativePath = `M ${scaleX(minSpot)},${zeroY} ${negativeAreaPoints} L ${scaleX(maxSpot)},${zeroY} Z`;

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, (clientX - (padding.left / width) * rect.width) / ((innerWidth / width) * rect.width)));
    const targetSpot = minSpot + ratio * (maxSpot - minSpot);

    // Find closest curve point
    let closest = curve[0];
    let minDiff = Math.abs(closest.spotPrice - targetSpot);
    for (let i = 1; i < curve.length; i++) {
      const diff = Math.abs(curve[i].spotPrice - targetSpot);
      if (diff < minDiff) {
        minDiff = diff;
        closest = curve[i];
      }
    }

    setHoveredPoint({
      spot: closest.spotPrice,
      expiryPnl: closest.pnlAtExpiry,
      targetPnl: closest.pnlAtTargetDate,
      x: scaleX(closest.spotPrice),
      y: scaleY(closest.pnlAtExpiry),
    });
  };

  return (
    <div className="relative rounded-2xl bg-black/40 border border-white/[0.08] p-4 overflow-hidden">
      {/* Top Legend Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2 px-2 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-emerald-400 rounded-full" />
            <span className="text-slate-300 font-mono-code text-[11px]">P&L at Expiry</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-sky-400 border-b border-dashed border-sky-400" />
            <span className="text-slate-300 font-mono-code text-[11px]">P&L at Target Date (T+n)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-slate-300 font-mono-code text-[11px]">
              Spot {fmt(spotPrice)}
            </span>
          </div>
        </div>

        {/* Breakeven Badges */}
        <div className="flex items-center gap-2">
          {summary.breakevens.map((be, idx) => (
            <span key={idx} className="px-2 py-0.5 rounded-md bg-white/[0.06] border border-white/[0.1] text-amber-300 font-mono-code text-[10px]">
              BE: {fmt(be)}
            </span>
          ))}
        </div>
      </div>

      {/* SVG Container */}
      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredPoint(null)}
        >
          {/* Subtle Grid Lines */}
          <line
            x1={padding.left}
            y1={zeroY}
            x2={width - padding.right}
            y2={zeroY}
            stroke="rgba(255, 255, 255, 0.25)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />

          {/* Shaded Profit & Loss Areas */}
          <path d={positivePath} fill="rgba(16, 185, 129, 0.12)" />
          <path d={negativePath} fill="rgba(244, 63, 94, 0.12)" />

          {/* Target Date Curve (Sky dashed) */}
          <polyline
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2"
            strokeDasharray="3 3"
            points={targetPoints}
            className="transition-all duration-300"
          />

          {/* Expiry Curve (Solid Emerald with line drawing animation on mount/update) */}
          <polyline
            key={expiryPoints.slice(0, 30)}
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={expiryPoints}
            className="animate-draw-line"
          />

          {/* Vertical Current Spot Line */}
          <line
            x1={spotX}
            y1={padding.top}
            x2={spotX}
            y2={height - padding.bottom}
            stroke="#f59e0b"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />

          {/* Strike Markers */}
          {legs.filter(l => l.enabled).map((leg, idx) => {
            const lx = scaleX(leg.strike);
            const strikeLabel = formatCurrency(
              leg.strike,
              currency,
              underlying.currency,
              exchangeRate,
              currency === underlying.currency && leg.strike % 1 === 0 ? 0 : 2
            );
            return (
              <g key={idx}>
                <line
                  x1={lx}
                  y1={height - padding.bottom}
                  x2={lx}
                  y2={height - padding.bottom + 6}
                  stroke="rgba(255,255,255,0.4)"
                  strokeWidth="1"
                />
                <text
                  x={lx}
                  y={height - padding.bottom + 18}
                  fill="#94a3b8"
                  fontSize="9"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {strikeLabel}
                </text>
              </g>
            );
          })}

          {/* Breakeven Marker Dots */}
          {summary.breakevens.map((be, idx) => {
            const bx = scaleX(be);
            return (
              <g key={idx}>
                <circle cx={bx} cy={zeroY} r="4" fill="#f59e0b" stroke="#000" strokeWidth="1.5" />
              </g>
            );
          })}

          {/* Hover Crosshair & Details */}
          {hoveredPoint && (
            <g>
              <line
                x1={hoveredPoint.x}
                y1={padding.top}
                x2={hoveredPoint.x}
                y2={height - padding.bottom}
                stroke="rgba(255, 255, 255, 0.5)"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <circle cx={hoveredPoint.x} cy={hoveredPoint.y} r="5" fill="#10b981" stroke="#fff" strokeWidth="2" />
              <circle
                cx={hoveredPoint.x}
                cy={scaleY(hoveredPoint.targetPnl)}
                r="4"
                fill="#38bdf8"
                stroke="#fff"
                strokeWidth="1.5"
              />
            </g>
          )}

          {/* Y Axis Labels */}
          <text
            x={padding.left - 8}
            y={scaleY(yUpper * 0.8)}
            fill="#10b981"
            fontSize="10"
            fontFamily="monospace"
            textAnchor="end"
          >
            +{fmt(yUpper * 0.8, 0)}
          </text>
          <text
            x={padding.left - 8}
            y={zeroY + 3}
            fill="#94a3b8"
            fontSize="10"
            fontFamily="monospace"
            textAnchor="end"
          >
            {fmt(0, 0)}
          </text>
          <text
            x={padding.left - 8}
            y={scaleY(yLower * 0.8)}
            fill="#f43f5e"
            fontSize="10"
            fontFamily="monospace"
            textAnchor="end"
          >
            -{fmt(Math.abs(yLower * 0.8), 0)}
          </text>
        </svg>

        {/* Hover Floating Details Card */}
        {hoveredPoint && (
          <div
            className="absolute pointer-events-none top-8 left-20 p-2.5 rounded-xl bg-[#090d19]/95 border border-white/[0.15] shadow-xl text-xs space-y-1 font-mono-code"
          >
            <div className="text-slate-400">
              Spot at: <strong className="text-white">{fmt(hoveredPoint.spot)}</strong>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Expiry P&L:</span>
              <span className={`font-bold ${hoveredPoint.expiryPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {hoveredPoint.expiryPnl >= 0 ? '+' : '-'}{fmt(Math.abs(hoveredPoint.expiryPnl))}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Target Date P&L:</span>
              <span className={`font-bold ${hoveredPoint.targetPnl >= 0 ? 'text-sky-400' : 'text-rose-400'}`}>
                {hoveredPoint.targetPnl >= 0 ? '+' : '-'}{fmt(Math.abs(hoveredPoint.targetPnl))}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
