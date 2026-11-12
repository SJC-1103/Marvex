import React, { useState, useMemo, useRef } from 'react';
import { DailyBar, Currency } from '../types/market';
import { formatCurrency } from '../utils/currency';
import {
  calculateSMA,
  calculateBollingerBands,
  calculateRSI,
} from '../utils/analytics';

interface TechnicalChartProps {
  history: DailyBar[];
  symbol: string;
  baseCurrency: Currency;
  displayCurrency: Currency;
  exchangeRate?: number;
  height?: number;
}

export const TechnicalChart: React.FC<TechnicalChartProps> = ({
  history,
  symbol,
  baseCurrency,
  displayCurrency,
  exchangeRate = 86.85,
  height = 420,
}) => {
  const [chartType, setChartType] = useState<'candlestick' | 'line'>('candlestick');
  const [selectedRange, setSelectedRange] = useState<'1M' | '3M' | '6M' | 'YTD' | '1Y' | '3Y' | '5Y' | 'MAX'>('1Y');
  const [showSMA20, setShowSMA20] = useState<boolean>(true);
  const [showSMA50, setShowSMA50] = useState<boolean>(true);
  const [showBollinger, setShowBollinger] = useState<boolean>(true);
  const [showRSI, setShowRSI] = useState<boolean>(true);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Slice history based on selected timeframe
  const filteredBars = useMemo(() => {
    let days = 252; // 1Y default
    if (selectedRange === '1M') days = 21;
    else if (selectedRange === '3M') days = 63;
    else if (selectedRange === '6M') days = 126;
    else if (selectedRange === 'YTD') days = 180;
    else if (selectedRange === '1Y') days = 252;
    else if (selectedRange === '3Y') days = 756;
    else if (selectedRange === '5Y' || selectedRange === 'MAX') days = history.length;

    const sliced = history.slice(Math.max(0, history.length - days));

    // Convert prices to display currency
    return sliced.map(b => {
      const convert = (val: number) => {
        if (baseCurrency === displayCurrency) return val;
        if (baseCurrency === 'USD' && displayCurrency === 'INR') return val * exchangeRate;
        if (baseCurrency === 'INR' && displayCurrency === 'USD') return val / exchangeRate;
        return val;
      };

      return {
        ...b,
        open: Number(convert(b.open).toFixed(2)),
        high: Number(convert(b.high).toFixed(2)),
        low: Number(convert(b.low).toFixed(2)),
        close: Number(convert(b.close).toFixed(2)),
      };
    });
  }, [history, selectedRange, baseCurrency, displayCurrency, exchangeRate]);

  // Extract closes for indicators
  const closes = useMemo(() => filteredBars.map(b => b.close), [filteredBars]);

  // Compute mathematically verified indicators
  const sma20 = useMemo(() => calculateSMA(closes, 20), [closes]);
  const sma50 = useMemo(() => calculateSMA(closes, 50), [closes]);
  const bb = useMemo(() => calculateBollingerBands(closes, 20, 2), [closes]);
  const rsi = useMemo(() => calculateRSI(closes, 14), [closes]);

  // Calculations for scale
  const { minPrice, maxPrice, maxVolume } = useMemo(() => {
    if (filteredBars.length === 0) return { minPrice: 0, maxPrice: 100, maxVolume: 100 };

    let min = Infinity;
    let max = -Infinity;
    let maxVol = 0;

    filteredBars.forEach(b => {
      if (b.low < min) min = b.low;
      if (b.high > max) max = b.high;
      if (b.volume > maxVol) maxVol = b.volume;
    });

    // Check BB bounds if visible
    if (showBollinger) {
      bb.upper.forEach(u => {
        if (u !== null && u > max) max = u;
      });
      bb.lower.forEach(l => {
        if (l !== null && l < min) min = l;
      });
    }

    const padding = (max - min) * 0.05 || max * 0.05;
    min = Math.max(0, min - padding);
    max += padding;

    return { minPrice: min, maxPrice: max, maxVolume: maxVol };
  }, [filteredBars, showBollinger, bb]);

  // Chart layout dimensions
  const viewWidth = 840;
  const priceHeight = showRSI ? height * 0.60 : height * 0.78;
  const volumeHeight = height * 0.16;
  const rsiHeight = showRSI ? height * 0.18 : 0;

  const count = filteredBars.length;
  const stepX = count > 1 ? viewWidth / (count - 1) : viewWidth;

  const getPriceY = (price: number) => {
    if (maxPrice === minPrice) return priceHeight / 2;
    return priceHeight - ((price - minPrice) / (maxPrice - minPrice)) * (priceHeight - 20) - 10;
  };

  const getVolY = (volume: number) => {
    return priceHeight + volumeHeight - (volume / (maxVolume || 1)) * (volumeHeight - 6);
  };

  // Paths
  const linePath = useMemo(() => {
    if (!filteredBars.length) return '';
    return filteredBars
      .map((b, i) => `${i === 0 ? 'M' : 'L'} ${i * stepX} ${getPriceY(b.close)}`)
      .join(' ');
  }, [filteredBars, stepX, maxPrice, minPrice, priceHeight]);

  const areaPath = useMemo(() => {
    if (!filteredBars.length) return '';
    const lastX = (filteredBars.length - 1) * stepX;
    return `${linePath} L ${lastX} ${priceHeight} L 0 ${priceHeight} Z`;
  }, [linePath, filteredBars.length, stepX, priceHeight]);

  // Generator for indicator paths
  const generatePath = (values: (number | null)[]) => {
    let p = '';
    values.forEach((v, i) => {
      if (v !== null) {
        p += `${p === '' ? 'M' : 'L'} ${i * stepX} ${getPriceY(v)} `;
      }
    });
    return p;
  };

  const sma20Path = useMemo(() => (showSMA20 ? generatePath(sma20) : ''), [showSMA20, sma20, stepX, maxPrice, minPrice]);
  const sma50Path = useMemo(() => (showSMA50 ? generatePath(sma50) : ''), [showSMA50, sma50, stepX, maxPrice, minPrice]);
  const bbUpperPath = useMemo(() => (showBollinger ? generatePath(bb.upper) : ''), [showBollinger, bb.upper, stepX, maxPrice, minPrice]);
  const bbLowerPath = useMemo(() => (showBollinger ? generatePath(bb.lower) : ''), [showBollinger, bb.lower, stepX, maxPrice, minPrice]);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    const index = Math.round(ratio * (filteredBars.length - 1));
    setHoverIndex(index);
  };

  const activeBar = hoverIndex !== null && filteredBars[hoverIndex]
    ? filteredBars[hoverIndex]
    : filteredBars[filteredBars.length - 1];

  const activeRSI = hoverIndex !== null && rsi[hoverIndex] !== null
    ? rsi[hoverIndex]
    : rsi[rsi.length - 1];

  const isNetPositive = filteredBars.length > 1
    ? filteredBars[filteredBars.length - 1].close >= filteredBars[0].close
    : true;

  return (
    <div className="w-full select-none" ref={containerRef}>
      {/* Top Controls: Timeframes & Indicators */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 text-xs">
        {/* Range Selector */}
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/[0.08] overflow-x-auto no-scrollbar">
          {(['1M', '3M', '6M', 'YTD', '1Y', '3Y', '5Y', 'MAX'] as const).map(rng => (
            <button
              key={rng}
              onClick={() => setSelectedRange(rng)}
              className={`px-2.5 py-1 rounded-lg font-mono-code text-xs font-semibold transition whitespace-nowrap ${
                selectedRange === rng
                  ? 'bg-white/[0.1] text-white border border-white/[0.12] shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {rng}
            </button>
          ))}
        </div>

        {/* Indicators and Chart Style */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Style Toggle */}
          <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/[0.08]">
            <button
              onClick={() => setChartType('candlestick')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                chartType === 'candlestick'
                  ? 'bg-white/[0.1] text-sky-300 border border-white/[0.12]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Candles
            </button>
            <button
              onClick={() => setChartType('line')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                chartType === 'line'
                  ? 'bg-white/[0.1] text-indigo-300 border border-white/[0.12]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Line
            </button>
          </div>

          {/* Indicator Toggles with Formula Tooltips */}
          <div className="relative group">
            <button
              onClick={() => setShowSMA20(!showSMA20)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono-code border transition cursor-pointer ${
                showSMA20
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 font-semibold'
                  : 'bg-black/40 border-white/[0.08] text-slate-500 hover:text-slate-300'
              }`}
            >
              SMA(20)
            </button>
            <div className="absolute left-0 top-full mt-1.5 hidden group-hover:block z-50 w-60 p-2.5 rounded-xl bg-[#0c1222] border border-amber-500/30 shadow-2xl text-[10px] text-slate-300 pointer-events-none">
              <strong className="text-amber-300">20-Day Simple Moving Average:</strong>
              <div className="my-1 font-mono-code text-[9px] text-amber-400">SMA_20 = (1/20) · ∑ Close_(t-i)</div>
              <div>Primary short-term trend filter. Price crossing above signals short-term bullish momentum.</div>
            </div>
          </div>

          <div className="relative group">
            <button
              onClick={() => setShowSMA50(!showSMA50)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono-code border transition cursor-pointer ${
                showSMA50
                  ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300 font-semibold'
                  : 'bg-black/40 border-white/[0.08] text-slate-500 hover:text-slate-300'
              }`}
            >
              SMA(50)
            </button>
            <div className="absolute left-0 top-full mt-1.5 hidden group-hover:block z-50 w-64 p-2.5 rounded-xl bg-[#0c1222] border border-indigo-500/30 shadow-2xl text-[10px] text-slate-300 pointer-events-none">
              <strong className="text-indigo-300">50-Day Institutional Trend Line:</strong>
              <div className="my-1 font-mono-code text-[9px] text-indigo-400">SMA_50 = (1/50) · ∑ Close_(t-i)</div>
              <div>Quarterly benchmark. Crossing above SMA(200) triggers institutional "Golden Cross".</div>
            </div>
          </div>

          <div className="relative group">
            <button
              onClick={() => setShowBollinger(!showBollinger)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono-code border transition cursor-pointer ${
                showBollinger
                  ? 'bg-sky-500/15 border-sky-500/40 text-sky-300 font-semibold'
                  : 'bg-black/40 border-white/[0.08] text-slate-500 hover:text-slate-300'
              }`}
            >
              BB(20, 2)
            </button>
            <div className="absolute right-0 top-full mt-1.5 hidden group-hover:block z-50 w-72 p-2.5 rounded-xl bg-[#0c1222] border border-sky-500/30 shadow-2xl text-[10px] text-slate-300 pointer-events-none">
              <strong className="text-sky-300">Bollinger Bands (20, 2σ):</strong>
              <div className="my-1 font-mono-code text-[9px] text-sky-400">
                Upper/Lower = SMA_20 ± 2 · σ_20
              </div>
              <div>Statistical envelope containing ~95.4% of price action under normal distribution. Squeezes precede high-volatility breakouts.</div>
            </div>
          </div>

          <div className="relative group">
            <button
              onClick={() => setShowRSI(!showRSI)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono-code border transition cursor-pointer ${
                showRSI
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-semibold'
                  : 'bg-black/40 border-white/[0.08] text-slate-500 hover:text-slate-300'
              }`}
            >
              RSI(14)
            </button>
            <div className="absolute right-0 top-full mt-1.5 hidden group-hover:block z-50 w-72 p-2.5 rounded-xl bg-[#0c1222] border border-emerald-500/30 shadow-2xl text-[10px] text-slate-300 pointer-events-none">
              <strong className="text-emerald-300">Relative Strength Index (14):</strong>
              <div className="my-1 font-mono-code text-[9px] text-emerald-400">
                RSI = 100 - [100 / (1 + RS)], RS = AvgGain_14 / AvgLoss_14
              </div>
              <div className="text-[9px] text-slate-400 mt-1">
                &gt;70: Overbought exhaustion · &lt;30: Oversold capitulation.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Date-Matched Crosshair Inspection Banner */}
      {activeBar && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono-code bg-black/50 border border-white/[0.06] px-3.5 py-2 rounded-xl mb-2 text-slate-300">
          <span className="text-sky-300 font-semibold">{activeBar.date}</span>
          <span>O: <span className="text-white">{formatCurrency(activeBar.open, displayCurrency)}</span></span>
          <span>H: <span className="text-emerald-400">{formatCurrency(activeBar.high, displayCurrency)}</span></span>
          <span>L: <span className="text-rose-400">{formatCurrency(activeBar.low, displayCurrency)}</span></span>
          <span>C: <span className={`font-bold ${activeBar.close >= activeBar.open ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatCurrency(activeBar.close, displayCurrency)}
          </span></span>
          <span className="text-slate-400">Vol: <span className="text-slate-200">{activeBar.volume.toLocaleString()}</span></span>
          {showRSI && activeRSI !== null && (
            <span className="text-emerald-300">RSI(14): {activeRSI.toFixed(1)}</span>
          )}
        </div>
      )}

      {/* Primary SVG Canvas */}
      <div className="relative w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-[#070a13]/90 p-2.5">
        {/* Right Price Ticks */}
        <div className="absolute inset-y-2 right-2.5 flex flex-col justify-between text-[10px] font-mono-code text-slate-500 pointer-events-none select-none z-10">
          <span>{formatCurrency(maxPrice, displayCurrency)}</span>
          <span>{formatCurrency((maxPrice + minPrice) * 0.75, displayCurrency)}</span>
          <span>{formatCurrency((maxPrice + minPrice) * 0.5, displayCurrency)}</span>
          <span>{formatCurrency((maxPrice + minPrice) * 0.25, displayCurrency)}</span>
          <span>{formatCurrency(minPrice, displayCurrency)}</span>
        </div>

        <svg
          viewBox={`0 0 ${viewWidth} ${height}`}
          className="w-full h-auto cursor-crosshair overflow-visible"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIndex(null)}
          style={{ minHeight: `${height}px` }}
        >
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={isNetPositive ? '#10b981' : '#f43f5e'} stopOpacity="0.22" />
              <stop offset="100%" stopColor={isNetPositive ? '#10b981' : '#f43f5e'} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => (
            <line
              key={idx}
              x1="0"
              y1={priceHeight * pct}
              x2={viewWidth}
              y2={priceHeight * pct}
              stroke="rgba(255, 255, 255, 0.04)"
              strokeDasharray="4 4"
            />
          ))}

          {/* Volume separator */}
          <line
            x1="0"
            y1={priceHeight}
            x2={viewWidth}
            y2={priceHeight}
            stroke="rgba(255, 255, 255, 0.08)"
          />

          {/* Bollinger Bands Envelopes */}
          {showBollinger && (
            <>
              <path d={bbUpperPath} fill="none" stroke="rgba(56, 189, 248, 0.45)" strokeWidth="1" strokeDasharray="3 3" />
              <path d={bbLowerPath} fill="none" stroke="rgba(56, 189, 248, 0.45)" strokeWidth="1" strokeDasharray="3 3" />
            </>
          )}

          {/* SMA Lines */}
          {showSMA20 && <path d={sma20Path} fill="none" stroke="#f59e0b" strokeWidth="1.5" />}
          {showSMA50 && <path d={sma50Path} fill="none" stroke="#6366f1" strokeWidth="1.5" />}

          {/* Area Line Chart with progressive drawing */}
          {chartType === 'line' && (
            <>
              <path d={areaPath} fill="url(#areaGrad)" className="transition-opacity duration-500" />
              <path
                key={linePath.slice(0, 30)}
                d={linePath}
                fill="none"
                stroke={isNetPositive ? '#10b981' : '#f43f5e'}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="animate-draw-line"
              />
            </>
          )}

          {/* Candlestick Bars */}
          {chartType === 'candlestick' && (
            <g>
              {filteredBars.map((b, i) => {
                const x = i * stepX;
                const candleWidth = Math.max(1.5, Math.min(8, stepX * 0.7));
                const openY = getPriceY(b.open);
                const closeY = getPriceY(b.close);
                const highY = getPriceY(b.high);
                const lowY = getPriceY(b.low);
                const isGreen = b.close >= b.open;
                const bodyTop = Math.min(openY, closeY);
                const bodyHeight = Math.max(1, Math.abs(closeY - openY));

                return (
                  <g key={b.date + i}>
                    {/* Wick */}
                    <line
                      x1={x}
                      y1={highY}
                      x2={x}
                      y2={lowY}
                      stroke={isGreen ? '#10b981' : '#f43f5e'}
                      strokeWidth="1"
                    />
                    {/* Candle Body */}
                    <rect
                      x={x - candleWidth / 2}
                      y={bodyTop}
                      width={candleWidth}
                      height={bodyHeight}
                      fill={isGreen ? '#10b981' : '#f43f5e'}
                      rx={0.5}
                    />
                  </g>
                );
              })}
            </g>
          )}

          {/* Volume Histogram aligned beneath price action */}
          <g>
            {filteredBars.map((b, i) => {
              const x = i * stepX;
              const barWidth = Math.max(1, Math.min(6, stepX * 0.6));
              const volY = getVolY(b.volume);
              const isGreen = b.close >= b.open;
              const baseBottom = priceHeight + volumeHeight;

              return (
                <rect
                  key={`vol-${b.date}-${i}`}
                  x={x - barWidth / 2}
                  y={volY}
                  width={barWidth}
                  height={Math.max(1, baseBottom - volY)}
                  fill={isGreen ? 'rgba(16, 185, 129, 0.35)' : 'rgba(244, 63, 94, 0.35)'}
                />
              );
            })}
          </g>

          {/* RSI 14 Oscillator Sub-panel */}
          {showRSI && (
            <g transform={`translate(0, ${priceHeight + volumeHeight + 10})`}>
              <line x1="0" y1="0" x2={viewWidth} y2="0" stroke="rgba(255, 255, 255, 0.08)" />

              {/* 70 Overbought & 30 Oversold Threshold Lines */}
              <line
                x1="0"
                y1={rsiHeight * 0.3}
                x2={viewWidth}
                y2={rsiHeight * 0.3}
                stroke="rgba(244, 63, 94, 0.3)"
                strokeDasharray="2 2"
              />
              <text x={viewWidth - 45} y={rsiHeight * 0.3 - 3} fill="#f43f5e" fontSize="9" fontFamily="monospace">
                70 OB
              </text>

              <line
                x1="0"
                y1={rsiHeight * 0.7}
                x2={viewWidth}
                y2={rsiHeight * 0.7}
                stroke="rgba(16, 185, 129, 0.3)"
                strokeDasharray="2 2"
              />
              <text x={viewWidth - 45} y={rsiHeight * 0.7 + 9} fill="#10b981" fontSize="9" fontFamily="monospace">
                30 OS
              </text>

              {/* RSI Curve */}
              {(() => {
                let p = '';
                rsi.forEach((val, i) => {
                  if (val !== null) {
                    const rY = rsiHeight - (val / 100) * rsiHeight;
                    p += `${p === '' ? 'M' : 'L'} ${i * stepX} ${rY} `;
                  }
                });
                return <path d={p} fill="none" stroke="#34d399" strokeWidth="1.2" />;
              })()}
              <text x="5" y="12" fill="#34d399" fontSize="9" fontFamily="monospace">
                RSI (14 Wilder)
              </text>
            </g>
          )}

          {/* Interactive Crosshair Indicator */}
          {hoverIndex !== null && (
            <g pointerEvents="none">
              <line
                x1={hoverIndex * stepX}
                y1="0"
                x2={hoverIndex * stepX}
                y2={height}
                stroke="#6366f1"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <line
                x1="0"
                y1={getPriceY(activeBar.close)}
                x2={viewWidth}
                y2={getPriceY(activeBar.close)}
                stroke="#6366f1"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <circle
                cx={hoverIndex * stepX}
                cy={getPriceY(activeBar.close)}
                r="3.5"
                fill="#6366f1"
                stroke="#ffffff"
                strokeWidth="1.5"
              />
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};
