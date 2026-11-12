import React, { useState, useMemo, useRef } from 'react';
import { Stock, MarketIndex, Currency, Timeframe } from '../../types/market';
import { MutualFundScheme } from '../../types/mutualFund';
import { PortfolioBook } from '../../types/portfolio';
import { marketService } from '../../services/marketDataService';
import { convertCurrency, formatCurrency } from '../../utils/currency';
import {
  calculateGrowthOf100,
  calculateDrawdown,
  calculateCAGR,
  calculateAnnualizedVolatility,
} from '../../utils/analytics';
import { AddCompareAssetModal, CompareTarget } from '../modals/AddCompareAssetModal';
import {
  Layers,
  Plus,
  X,
  Info,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Maximize2,
  Calendar,
} from 'lucide-react';
import { playQuantumBeep } from '../../utils/audio';

interface CompareWorkspaceProps {
  stocks: Stock[];
  indices: MarketIndex[];
  mutualFunds: MutualFundScheme[];
  books: PortfolioBook[];
  currency: Currency;
  exchangeRate: number;
  initialSelectedSymbols?: string[];
}

const PALETTE = [
  '#38bdf8', // sky-400
  '#6366f1', // indigo-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#ec4899', // pink-500
];

type MetricMode = 'GROWTH_100' | 'CUMULATIVE_RETURN' | 'DRAWDOWN';

export const CompareWorkspace: React.FC<CompareWorkspaceProps> = ({
  stocks,
  indices,
  mutualFunds,
  books,
  currency,
  exchangeRate,
  initialSelectedSymbols = ['RELIANCE', 'NVDA', '122639', 'NIFTY 50'],
}) => {
  const [metricMode, setMetricMode] = useState<MetricMode>('GROWTH_100');
  const [timeframe, setTimeframe] = useState<Timeframe>('1Y');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const chartSvgRef = useRef<SVGSVGElement | null>(null);

  // Active targets list (up to 5 items)
  const [selectedTargets, setSelectedTargets] = useState<CompareTarget[]>(() => {
    const list: CompareTarget[] = [];
    initialSelectedSymbols.slice(0, 5).forEach((sym, idx) => {
      const color = PALETTE[idx % PALETTE.length];
      const match = marketService.findInstrument(sym);
      if (match.type === 'EQUITY' && match.instrument) {
        const s = match.instrument as Stock;
        list.push({
          id: s.id,
          type: 'EQUITY',
          symbol: s.symbol,
          name: s.name,
          subtitle: `${s.exchange} · Equity`,
          color,
        });
      } else if (match.type === 'MUTUAL_FUND' && match.instrument) {
        const mf = match.instrument as MutualFundScheme;
        list.push({
          id: mf.id,
          type: 'MUTUAL_FUND',
          symbol: mf.symbol,
          name: mf.name,
          subtitle: `AMFI: ${mf.schemeCode}`,
          color,
        });
      } else if (match.type === 'INDEX' && match.instrument) {
        const i = match.instrument as MarketIndex;
        list.push({
          id: i.id,
          type: 'INDEX',
          symbol: i.symbol,
          name: i.name,
          subtitle: `Benchmark Index`,
          color,
        });
      }
    });

    if (list.length === 0) {
      list.push({
        id: 'stock-reliance',
        type: 'EQUITY',
        symbol: 'RELIANCE',
        name: 'Reliance Industries Limited',
        subtitle: 'NSE · Equity',
        color: PALETTE[0],
      });
      list.push({
        id: 'stock-nvda',
        type: 'EQUITY',
        symbol: 'NVDA',
        name: 'NVIDIA Corporation',
        subtitle: 'NASDAQ · Equity',
        color: PALETTE[1],
      });
    }

    return list;
  });

  const handleRemoveTarget = (id: string) => {
    if (selectedTargets.length <= 1) return; // Keep at least one
    setSelectedTargets(prev => prev.filter(t => t.id !== id));
  };

  const handleAddTarget = (newTarget: CompareTarget) => {
    if (selectedTargets.length >= 5) return;
    const color = PALETTE[selectedTargets.length % PALETTE.length];
    setSelectedTargets(prev => [...prev, { ...newTarget, color }]);
  };

  // Determine slice days by timeframe
  const sliceDays = useMemo(() => {
    switch (timeframe) {
      case '1M': return 21;
      case '3M': return 63;
      case '6M': return 126;
      case 'YTD': return 180;
      case '1Y': return 252;
      case '3Y': return 756;
      case '5Y':
      case 'MAX': return 1260;
      default: return 252;
    }
  }, [timeframe]);

  // Extract aligned dates and series values
  const { dates, seriesData, analytics } = useMemo(() => {
    // Collect raw daily bars for each selected target
    const targetBars = selectedTargets.map(target => {
      let bars: { date: string; close: number }[] = [];

      if (target.type === 'PORTFOLIO') {
        const bookId = target.id.replace('portfolio-', '');
        const book = books.find(b => b.id === bookId);
        if (book) {
          const dateMap: Map<string, number> = new Map();
          book.holdings.forEach(h => {
            const match = marketService.findInstrument(h.symbolOrCode);
            if (match.instrument && 'history' in match.instrument) {
              match.instrument.history.forEach(b => {
                const converted = convertCurrency(b.close, h.currency, currency, exchangeRate);
                dateMap.set(b.date, (dateMap.get(b.date) || 0) + converted * h.quantityOrUnits);
              });
            }
          });
          const sorted = Array.from(dateMap.keys()).sort();
          bars = sorted.map(d => ({ date: d, close: dateMap.get(d) || 1 }));
        }
      } else {
        const match = marketService.findInstrument(target.symbol);
        if (match.instrument && 'history' in match.instrument) {
          bars = match.instrument.history.map(b => ({
            date: b.date,
            close: b.close,
          }));
        }
      }

      // Slice to target days
      const sliced = bars.slice(Math.max(0, bars.length - sliceDays));
      return { target, bars: sliced };
    });

    // Find common dates
    let commonDates: string[] = [];
    if (targetBars.length > 0 && targetBars[0].bars.length > 0) {
      commonDates = targetBars[0].bars.map(b => b.date);
      for (let i = 1; i < targetBars.length; i++) {
        const curDates = new Set(targetBars[i].bars.map(b => b.date));
        commonDates = commonDates.filter(d => curDates.has(d));
      }
    }

    if (commonDates.length === 0 && targetBars.length > 0 && targetBars[0].bars.length > 0) {
      commonDates = targetBars[0].bars.map(b => b.date);
    }

    // Map each target to its metric values across commonDates
    const mappedSeries = targetBars.map(({ target, bars }) => {
      const barMap = new Map(bars.map(b => [b.date, b.close]));
      const rawCloses = commonDates.map(d => barMap.get(d) || bars[bars.length - 1]?.close || 1);

      let values: number[] = [];
      if (metricMode === 'GROWTH_100') {
        values = calculateGrowthOf100(rawCloses);
      } else if (metricMode === 'CUMULATIVE_RETURN') {
        const base = rawCloses[0] || 1;
        values = rawCloses.map(c => Number((((c - base) / base) * 100).toFixed(2)));
      } else if (metricMode === 'DRAWDOWN') {
        const dd = calculateDrawdown(rawCloses);
        values = dd.drawdownSeries;
      }

      // Compute analytics table metrics
      const startVal = rawCloses[0] || 1;
      const endVal = rawCloses[rawCloses.length - 1] || 1;
      const absReturn = ((endVal - startVal) / startVal) * 100;
      const cagr = calculateCAGR(startVal, endVal, commonDates.length);
      const ddResult = calculateDrawdown(rawCloses);
      const volatility = calculateAnnualizedVolatility(rawCloses);

      return {
        target,
        rawCloses,
        values,
        analytics: {
          startVal,
          endVal,
          absReturn,
          cagr,
          maxDrawdown: ddResult.maxDrawdownPercent,
          volatility,
        },
      };
    });

    return {
      dates: commonDates,
      seriesData: mappedSeries,
      analytics: mappedSeries.map(s => ({ target: s.target, ...s.analytics })),
    };
  }, [selectedTargets, timeframe, metricMode, sliceDays, books, currency, exchangeRate]);

  // Compute SVG Coordinate scales
  const { minVal, maxVal } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;

    seriesData.forEach(s => {
      s.values.forEach(v => {
        if (v < min) min = v;
        if (v > max) max = v;
      });
    });

    if (min === Infinity || max === -Infinity) {
      return { minVal: 0, maxVal: 100 };
    }

    const padding = (max - min) * 0.08 || 5;
    return {
      minVal: min - padding,
      maxVal: max + padding,
    };
  }, [seriesData]);

  // Chart Dimensions
  const chartWidth = 900;
  const chartHeight = 360;
  const padLeft = 55;
  const padRight = 30;
  const padTop = 25;
  const padBottom = 35;
  const plotWidth = chartWidth - padLeft - padRight;
  const plotHeight = chartHeight - padTop - padBottom;

  const getX = (idx: number) => {
    if (dates.length <= 1) return padLeft;
    return padLeft + (idx / (dates.length - 1)) * plotWidth;
  };

  const getY = (val: number) => {
    if (maxVal === minVal) return padTop + plotHeight / 2;
    return padTop + plotHeight - ((val - minVal) / (maxVal - minVal)) * plotHeight;
  };

  // Build SVG Paths
  const paths = seriesData.map(s => {
    if (s.values.length === 0) return '';
    let d = `M ${getX(0)} ${getY(s.values[0])}`;
    for (let i = 1; i < s.values.length; i++) {
      d += ` L ${getX(i)} ${getY(s.values[i])}`;
    }
    return d;
  });

  // Mouse move handler for crosshair
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!chartSvgRef.current || dates.length <= 1) return;
    const rect = chartSvgRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * chartWidth;
    const relativeX = Math.max(0, Math.min(plotWidth, mouseX - padLeft));
    const ratio = relativeX / plotWidth;
    const idx = Math.round(ratio * (dates.length - 1));
    setHoverIndex(idx);
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  // Format axis tick values
  const yTicks = useMemo(() => {
    const ticks: number[] = [];
    const count = 5;
    for (let i = 0; i <= count; i++) {
      ticks.push(minVal + (i / count) * (maxVal - minVal));
    }
    return ticks;
  }, [minVal, maxVal]);

  const xTicks = useMemo(() => {
    if (dates.length <= 1) return [];
    const count = Math.min(6, dates.length);
    const step = Math.floor(dates.length / (count - 1));
    const indices: number[] = [];
    for (let i = 0; i < count - 1; i++) {
      indices.push(i * step);
    }
    indices.push(dates.length - 1);
    return Array.from(new Set(indices)).map(idx => ({ idx, date: dates[idx] }));
  }, [dates]);

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-200">
      {/* 1. COMPARISON HEADER & ASSET SELECTOR */}
      <div className="p-5 sm:p-6 rounded-2xl quantum-card space-y-4 border border-white/[0.08]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sky-400 text-xs font-mono-code uppercase tracking-wider mb-1">
              <Layers className="w-3.5 h-3.5" /> Relative Performance Engine
            </div>
            <h2 className="text-2xl font-bold font-heading text-white">
              Cross-Asset Visual Comparison
            </h2>
            <p className="text-slate-400 text-xs mt-0.5 max-w-2xl">
              Simultaneously benchmark equities, Indian mutual funds, market indices, and custom portfolios on date-aligned normalized coordinates.
            </p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            disabled={selectedTargets.length >= 5}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition active:scale-95 shadow-sm ${
              selectedTargets.length < 5
                ? 'bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold'
                : 'bg-white/[0.04] text-slate-600 border border-white/[0.04] cursor-not-allowed'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Add Instrument ({selectedTargets.length}/5)</span>
          </button>
        </div>

        {/* Instrument Selection Chips with Color Dots & Remove Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/[0.06]">
          {selectedTargets.map(t => (
            <div
              key={t.id}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/50 border border-white/[0.1] text-xs shadow-sm"
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />
              <span className="font-bold text-white font-mono-code">{t.symbol}</span>
              <span
                className={`text-[9px] px-1 py-0.2 rounded font-mono-code ${
                  t.type === 'PORTFOLIO'
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : t.type === 'INDEX'
                    ? 'bg-amber-500/15 text-amber-300'
                    : t.type === 'MUTUAL_FUND'
                    ? 'bg-indigo-500/15 text-indigo-300'
                    : 'bg-sky-500/15 text-sky-300'
                }`}
              >
                {t.type}
              </span>
              {selectedTargets.length > 1 && (
                <button
                  onClick={() => handleRemoveTarget(t.id)}
                  className="p-0.5 rounded text-slate-500 hover:text-white hover:bg-white/[0.1] transition ml-1"
                  title="Remove from comparison"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Cross-Currency Methodology Notice */}
        <div className="flex items-start gap-2 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs text-slate-400">
          <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-slate-200">Cross-Currency Methodology:</strong> Single instruments (Stocks, Mutual Funds, Indices) maintain their authentic native currency trajectory for relative growth comparisons. Multi-currency User Portfolios are uniformly calculated in the active display currency (<span className="text-sky-300">{currency}</span> at stated FX $1 = ₹{exchangeRate}).
          </div>
        </div>
      </div>

      {/* 2. CONTROL BAR */}
      <div className="p-4 rounded-2xl quantum-card border border-white/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Metric Mode Switcher */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs">
          <button
            onClick={() => {
              setMetricMode('GROWTH_100');
              playQuantumBeep(640, 0.03);
            }}
            className={`px-3 py-1.5 rounded-lg transition font-medium ${
              metricMode === 'GROWTH_100'
                ? 'bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Mode A: Growth of 100
          </button>
          <button
            onClick={() => {
              setMetricMode('CUMULATIVE_RETURN');
              playQuantumBeep(640, 0.03);
            }}
            className={`px-3 py-1.5 rounded-lg transition font-medium ${
              metricMode === 'CUMULATIVE_RETURN'
                ? 'bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Mode B: Cumulative % Return
          </button>
          <button
            onClick={() => {
              setMetricMode('DRAWDOWN');
              playQuantumBeep(640, 0.03);
            }}
            className={`px-3 py-1.5 rounded-lg transition font-medium ${
              metricMode === 'DRAWDOWN'
                ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Mode C: Drawdown (%)
          </button>
        </div>

        {/* Timeframe Selector */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs font-mono-code">
          {(['1M', '3M', '6M', 'YTD', '1Y', '3Y', '5Y', 'MAX'] as Timeframe[]).map(tf => (
            <button
              key={tf}
              onClick={() => {
                setTimeframe(tf);
                playQuantumBeep(660, 0.03);
              }}
              className={`px-2.5 py-1 rounded-lg transition ${
                timeframe === tf
                  ? 'bg-white/[0.1] text-sky-300 font-bold border border-white/[0.1]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* 3. MULTI-LINE COMPARISON CANVAS (INTERACTIVE SVG CHART) */}
      <div className="p-6 rounded-2xl quantum-card border border-white/[0.08] space-y-3 relative">
        <div className="flex items-center justify-between text-xs font-mono-code text-slate-400">
          <span>
            {metricMode === 'GROWTH_100'
              ? 'Rebased Value (Initial = 100.00)'
              : metricMode === 'CUMULATIVE_RETURN'
              ? 'Cumulative Relative Return (%)'
              : 'Peak-to-Trough Drawdown (%)'}
          </span>
          <span>{dates.length} Observation Bars ({dates[0]} to {dates[dates.length - 1]})</span>
        </div>

        <div className="relative w-full overflow-hidden">
          <svg
            ref={chartSvgRef}
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-auto select-none overflow-visible"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <defs>
              {seriesData.map(s => (
                <linearGradient key={`grad-${s.target.id}`} id={`grad-${s.target.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.target.color} stopOpacity="0.25" />
                  <stop offset="100%" stopColor={s.target.color} stopOpacity="0.0" />
                </linearGradient>
              ))}
            </defs>

            {/* Horizontal Grid Lines */}
            {yTicks.map((val, idx) => {
              const y = getY(val);
              return (
                <g key={`y-grid-${idx}`}>
                  <line
                    x1={padLeft}
                    y1={y}
                    x2={chartWidth - padRight}
                    y2={y}
                    stroke="rgba(255, 255, 255, 0.06)"
                    strokeDasharray={idx === 0 || idx === yTicks.length - 1 ? 'none' : '3 3'}
                  />
                  <text
                    x={padLeft - 8}
                    y={y + 4}
                    textAnchor="end"
                    fill="#64748b"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    {metricMode === 'GROWTH_100'
                      ? val.toFixed(1)
                      : `${val >= 0 ? '+' : ''}${val.toFixed(1)}%`}
                  </text>
                </g>
              );
            })}

            {/* Vertical Date Grid Lines & Labels */}
            {xTicks.map((item, idx) => {
              const x = getX(item.idx);
              return (
                <g key={`x-grid-${idx}`}>
                  <line
                    x1={x}
                    y1={padTop}
                    x2={x}
                    y2={padTop + plotHeight}
                    stroke="rgba(255, 255, 255, 0.04)"
                  />
                  <text
                    x={x}
                    y={chartHeight - 10}
                    textAnchor="middle"
                    fill="#64748b"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    {item.date}
                  </text>
                </g>
              );
            })}

            {/* Zero line for Cumulative Return / Drawdown */}
            {(metricMode === 'CUMULATIVE_RETURN' || metricMode === 'DRAWDOWN') && (
              <line
                x1={padLeft}
                y1={getY(0)}
                x2={chartWidth - padRight}
                y2={getY(0)}
                stroke="rgba(255, 255, 255, 0.2)"
                strokeDasharray="4 4"
              />
            )}

            {/* Multi-series Stroke Paths */}
            {seriesData.map((s, idx) => (
              <path
                key={s.target.id}
                d={paths[idx]}
                fill="none"
                stroke={s.target.color}
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}

            {/* Interactive Crosshair Cursor */}
            {hoverIndex !== null && hoverIndex >= 0 && hoverIndex < dates.length && (
              <g>
                <line
                  x1={getX(hoverIndex)}
                  y1={padTop}
                  x2={getX(hoverIndex)}
                  y2={padTop + plotHeight}
                  stroke="#94a3b8"
                  strokeWidth="1.2"
                  strokeDasharray="3 3"
                />
                {seriesData.map(s => {
                  const val = s.values[hoverIndex];
                  if (val === undefined) return null;
                  return (
                    <circle
                      key={`pt-${s.target.id}`}
                      cx={getX(hoverIndex)}
                      cy={getY(val)}
                      r="4.5"
                      fill={s.target.color}
                      stroke="#06080f"
                      strokeWidth="2"
                    />
                  );
                })}
              </g>
            )}
          </svg>

          {/* Floating Hover Inspection Legend */}
          {hoverIndex !== null && hoverIndex >= 0 && hoverIndex < dates.length && (
            <div
              className="absolute z-20 top-4 right-4 p-3.5 rounded-xl bg-[#0b0f1d]/95 backdrop-blur-md border border-white/[0.12] shadow-2xl text-xs space-y-2 pointer-events-none min-w-[200px]"
            >
              <div className="text-[11px] font-mono-code text-slate-400 border-b border-white/[0.08] pb-1 flex items-center justify-between">
                <span>Observation Date:</span>
                <strong className="text-white">{dates[hoverIndex]}</strong>
              </div>
              <div className="space-y-1">
                {seriesData.map(s => {
                  const val = s.values[hoverIndex];
                  return (
                    <div key={`legend-${s.target.id}`} className="flex items-center justify-between text-[11px] font-mono-code">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.target.color }} />
                        <span className="text-slate-300 font-semibold">{s.target.symbol}:</span>
                      </div>
                      <span className="font-bold text-white">
                        {metricMode === 'GROWTH_100'
                          ? val.toFixed(2)
                          : `${val >= 0 ? '+' : ''}${val.toFixed(2)}%`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. STANDARDIZED PERFORMANCE ANALYTICS TABLE */}
      <div className="space-y-3">
        <h3 className="text-base font-bold font-heading text-white">
          Standardized Performance Analytics ({timeframe})
        </h3>

        <div className="rounded-2xl quantum-card overflow-hidden border border-white/[0.08]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-black/50 text-slate-400 font-mono-code uppercase text-[10px] tracking-wider border-b border-white/[0.08]">
                <tr>
                  <th className="py-3 px-4">Instrument</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3 text-right">Start Value</th>
                  <th className="py-3 px-3 text-right">End Value</th>
                  <th className="py-3 px-3 text-right">Absolute % Return</th>
                  <th className="py-3 px-3 text-right">CAGR (Annualized)</th>
                  <th className="py-3 px-3 text-right">Max Drawdown</th>
                  <th className="py-3 px-4 text-right">Annualized Volatility (σ)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {analytics.map(row => {
                  const isPositive = row.absReturn >= 0;
                  return (
                    <tr key={row.target.id} className="hover:bg-white/[0.02] transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: row.target.color }} />
                          <div>
                            <div className="font-semibold text-white font-sans">{row.target.name}</div>
                            <div className="text-[10px] font-mono-code text-slate-500">{row.target.symbol}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono-code font-bold ${
                            row.target.type === 'PORTFOLIO'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : row.target.type === 'INDEX'
                              ? 'bg-amber-500/10 text-amber-300'
                              : row.target.type === 'MUTUAL_FUND'
                              ? 'bg-indigo-500/10 text-indigo-300'
                              : 'bg-sky-500/10 text-sky-400'
                          }`}
                        >
                          {row.target.type}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono-code text-slate-400">
                        {row.startVal.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono-code text-white font-medium">
                        {row.endVal.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono-code">
                        <span className={`font-semibold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isPositive ? '+' : ''}{row.absReturn.toFixed(2)}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono-code text-slate-200">
                        {row.cagr.toFixed(2)}%
                      </td>
                      <td className="py-3 px-3 text-right font-mono-code text-rose-400">
                        -{row.maxDrawdown.toFixed(2)}%
                      </td>
                      <td className="py-3 px-4 text-right font-mono-code text-slate-300">
                        {row.volatility.toFixed(2)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Compare Asset Modal */}
      {isAddModalOpen && (
        <AddCompareAssetModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSelectTarget={handleAddTarget}
          selectedIds={selectedTargets.map(t => t.id)}
          stocks={stocks}
          indices={indices}
          mutualFunds={mutualFunds}
          books={books}
          palette={PALETTE}
        />
      )}
    </div>
  );
};
