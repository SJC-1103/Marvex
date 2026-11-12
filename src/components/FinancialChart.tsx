import React, { useState, useMemo, useRef } from 'react';
import { CandlePoint, Timeframe, Currency } from '../types/market';
import { formatCurrency } from '../utils/currency';

interface FinancialChartProps {
  candles: CandlePoint[];
  symbol: string;
  baseCurrency: Currency;
  displayCurrency: Currency;
  exchangeRate?: number;
  timeframe: Timeframe;
  onTimeframeChange: (tf: Timeframe) => void;
  height?: number;
}

export const FinancialChart: React.FC<FinancialChartProps> = ({
  candles,
  symbol,
  baseCurrency,
  displayCurrency,
  exchangeRate,
  timeframe,
  onTimeframeChange,
  height = 360,
}) => {
  const [chartType, setChartType] = useState<'candlestick' | 'line'>('candlestick');
  const [showSMA, setShowSMA] = useState<boolean>(true);
  const [showQuantumBands, setShowQuantumBands] = useState<boolean>(true);
  const [showRSI, setShowRSI] = useState<boolean>(false);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Convert prices to display currency if needed
  const convertedCandles = useMemo(() => {
    return candles.map(c => {
      const convert = (val: number) => {
        if (baseCurrency === displayCurrency) return val;
        if (baseCurrency === 'USD' && displayCurrency === 'INR') {
          return val * (exchangeRate || 86.85);
        }
        if (baseCurrency === 'INR' && displayCurrency === 'USD') {
          return val / (exchangeRate || 86.85);
        }
        return val;
      };

      return {
        ...c,
        open: Number(convert(c.open).toFixed(2)),
        high: Number(convert(c.high).toFixed(2)),
        low: Number(convert(c.low).toFixed(2)),
        close: Number(convert(c.close).toFixed(2)),
      };
    });
  }, [candles, baseCurrency, displayCurrency, exchangeRate]);

  // Calculations for scale
  const { minPrice, maxPrice, maxVolume, smaValues, bands, rsiValues } = useMemo(() => {
    if (!convertedCandles.length) {
      return {
        minPrice: 0,
        maxPrice: 100,
        maxVolume: 100,
        smaValues: [] as (number | null)[],
        bands: { upper: [] as (number | null)[], lower: [] as (number | null)[] },
        rsiValues: [] as (number | null)[],
      };
    }

    let min = Infinity;
    let max = -Infinity;
    let maxVol = 0;

    convertedCandles.forEach(c => {
      if (c.low < min) min = c.low;
      if (c.high > max) max = c.high;
      if (c.volume > maxVol) maxVol = c.volume;
    });

    const padding = (max - min) * 0.06 || max * 0.05;
    min -= padding;
    max += padding;

    // Calculate SMA 10
    const period = 10;
    const sma: (number | null)[] = [];
    const upperBand: (number | null)[] = [];
    const lowerBand: (number | null)[] = [];

    for (let i = 0; i < convertedCandles.length; i++) {
      if (i < period - 1) {
        sma.push(null);
        upperBand.push(null);
        lowerBand.push(null);
      } else {
        const slice = convertedCandles.slice(i - period + 1, i + 1);
        const sum = slice.reduce((acc, curr) => acc + curr.close, 0);
        const avg = sum / period;
        sma.push(avg);

        const variance = slice.reduce((acc, curr) => acc + Math.pow(curr.close - avg, 2), 0) / period;
        const stdDev = Math.sqrt(variance);
        upperBand.push(avg + stdDev * 1.8);
        lowerBand.push(avg - stdDev * 1.8);
      }
    }

    // Calculate RSI (14 period)
    const rsi: (number | null)[] = [];
    let gains = 0;
    let losses = 0;

    for (let i = 0; i < convertedCandles.length; i++) {
      if (i === 0) {
        rsi.push(50);
        continue;
      }
      const change = convertedCandles[i].close - convertedCandles[i - 1].close;
      if (i <= 14) {
        if (change > 0) gains += change;
        else losses -= change;
        if (i === 14) {
          const avgGain = gains / 14;
          const avgLoss = losses / 14 || 0.0001;
          const rs = avgGain / avgLoss;
          rsi.push(100 - 100 / (1 + rs));
        } else {
          rsi.push(50);
        }
      } else {
        const gain = change > 0 ? change : 0;
        const loss = change < 0 ? -change : 0;
        gains = (gains * 13 + gain) / 14;
        losses = (losses * 13 + loss) / 14 || 0.0001;
        const rs = gains / losses;
        rsi.push(100 - 100 / (1 + rs));
      }
    }

    return {
      minPrice: Math.max(0, min),
      maxPrice: max,
      maxVolume: maxVol,
      smaValues: sma,
      bands: { upper: upperBand, lower: lowerBand },
      rsiValues: rsi,
    };
  }, [convertedCandles]);

  // Chart layout dimensions
  const viewWidth = 800;
  const priceHeight = showRSI ? height * 0.65 : height * 0.82;
  const volumeHeight = height * 0.16;
  const rsiHeight = showRSI ? height * 0.18 : 0;

  const count = convertedCandles.length;
  const stepX = count > 1 ? viewWidth / (count - 1) : viewWidth;

  const getPriceY = (price: number) => {
    if (maxPrice === minPrice) return priceHeight / 2;
    return priceHeight - ((price - minPrice) / (maxPrice - minPrice)) * (priceHeight - 20) - 10;
  };

  const getVolY = (volume: number) => {
    return priceHeight + volumeHeight - (volume / (maxVolume || 1)) * (volumeHeight - 8);
  };

  // Generate paths for Line Chart
  const linePath = useMemo(() => {
    if (!convertedCandles.length) return '';
    return convertedCandles
      .map((c, i) => `${i === 0 ? 'M' : 'L'} ${i * stepX} ${getPriceY(c.close)}`)
      .join(' ');
  }, [convertedCandles, stepX, maxPrice, minPrice, priceHeight]);

  const areaPath = useMemo(() => {
    if (!convertedCandles.length) return '';
    const firstX = 0;
    const lastX = (convertedCandles.length - 1) * stepX;
    return `${linePath} L ${lastX} ${priceHeight} L ${firstX} ${priceHeight} Z`;
  }, [linePath, convertedCandles.length, stepX, priceHeight]);

  // SMA path
  const smaPath = useMemo(() => {
    let path = '';
    smaValues.forEach((val, i) => {
      if (val !== null) {
        path += `${path === '' ? 'M' : 'L'} ${i * stepX} ${getPriceY(val)} `;
      }
    });
    return path;
  }, [smaValues, stepX, maxPrice, minPrice, priceHeight]);

  // Quantum Volatility Upper and Lower bands
  const upperBandPath = useMemo(() => {
    let path = '';
    bands.upper.forEach((val, i) => {
      if (val !== null) {
        path += `${path === '' ? 'M' : 'L'} ${i * stepX} ${getPriceY(val)} `;
      }
    });
    return path;
  }, [bands.upper, stepX, maxPrice, minPrice, priceHeight]);

  const lowerBandPath = useMemo(() => {
    let path = '';
    bands.lower.forEach((val, i) => {
      if (val !== null) {
        path += `${path === '' ? 'M' : 'L'} ${i * stepX} ${getPriceY(val)} `;
      }
    });
    return path;
  }, [bands.lower, stepX, maxPrice, minPrice, priceHeight]);

  // Interactive mouse move
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    const index = Math.round(ratio * (convertedCandles.length - 1));
    setHoverIndex(index);
  };

  const activeCandle = hoverIndex !== null && convertedCandles[hoverIndex]
    ? convertedCandles[hoverIndex]
    : convertedCandles[convertedCandles.length - 1];

  const isNetPositive = convertedCandles.length > 1
    ? convertedCandles[convertedCandles.length - 1].close >= convertedCandles[0].close
    : true;

  const timeframes: Timeframe[] = ['1D', '1W', '1M', '3M', '1Y', 'ALL'];

  return (
    <div className="w-full select-none" ref={containerRef}>
      {/* Chart Top Bar Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 text-xs">
        {/* Timeframes */}
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/[0.08]">
          {timeframes.map(tf => (
            <button
              key={tf}
              onClick={() => onTimeframeChange(tf)}
              className={`px-2.5 py-1 rounded-lg font-mono-code text-xs font-semibold transition-all ${
                timeframe === tf
                  ? 'bg-white/[0.1] text-white shadow-sm border border-white/[0.12]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Style & Indicator Toggles */}
        <div className="flex items-center gap-2">
          {/* Chart type toggle */}
          <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/[0.08]">
            <button
              onClick={() => setChartType('candlestick')}
              title="Candlestick View"
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
              title="Area Line View"
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                chartType === 'line'
                  ? 'bg-white/[0.1] text-indigo-300 border border-white/[0.12]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Line
            </button>
          </div>

          {/* Indicators */}
          <button
            onClick={() => setShowSMA(!showSMA)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono-code border transition ${
              showSMA
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 font-semibold'
                : 'bg-black/40 border-white/[0.08] text-slate-500 hover:text-slate-300'
            }`}
          >
            SMA(10)
          </button>
          <button
            onClick={() => setShowQuantumBands(!showQuantumBands)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono-code border transition ${
              showQuantumBands
                ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300 font-semibold'
                : 'bg-black/40 border-white/[0.08] text-slate-500 hover:text-slate-300'
            }`}
          >
            Volatility Bands
          </button>
          <button
            onClick={() => setShowRSI(!showRSI)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono-code border transition ${
              showRSI
                ? 'bg-sky-500/15 border-sky-500/40 text-sky-300 font-semibold'
                : 'bg-black/40 border-white/[0.08] text-slate-500 hover:text-slate-300'
            }`}
          >
            RSI(14)
          </button>
        </div>
      </div>

      {/* Crosshair / Active Bar Info Banner */}
      {activeCandle && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono-code bg-black/50 border border-white/[0.06] px-3.5 py-2 rounded-xl mb-2.5 text-slate-300">
          <span className="text-sky-300 font-semibold">{activeCandle.timeStr || activeCandle.time}</span>
          <span>O: <span className="text-white font-medium">{formatCurrency(activeCandle.open, displayCurrency)}</span></span>
          <span>H: <span className="text-emerald-400 font-medium">{formatCurrency(activeCandle.high, displayCurrency)}</span></span>
          <span>L: <span className="text-rose-400 font-medium">{formatCurrency(activeCandle.low, displayCurrency)}</span></span>
          <span>C: <span className={`font-bold ${activeCandle.close >= activeCandle.open ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatCurrency(activeCandle.close, displayCurrency)}
          </span></span>
          <span className="text-slate-400">Vol: <span className="text-slate-200">{activeCandle.volume.toLocaleString()}</span></span>
          {showRSI && hoverIndex !== null && rsiValues[hoverIndex] !== null && (
            <span className="text-sky-300">RSI: {rsiValues[hoverIndex]?.toFixed(1)}</span>
          )}
        </div>
      )}

      {/* Main SVG Chart Canvas */}
      <div className="relative w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-[#070a13]/90 p-2.5">
        {/* Background Grid Lines & Price Ticks */}
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
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={isNetPositive ? '#10b981' : '#f43f5e'} stopOpacity="0.25" />
              <stop offset="100%" stopColor={isNetPositive ? '#10b981' : '#f43f5e'} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid lines */}
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

          {/* Volume separator line */}
          <line
            x1="0"
            y1={priceHeight}
            x2={viewWidth}
            y2={priceHeight}
            stroke="rgba(255, 255, 255, 0.08)"
          />

          {/* Volatility Bands Envelope */}
          {showQuantumBands && (
            <>
              <path
                d={upperBandPath}
                fill="none"
                stroke="rgba(99, 102, 241, 0.45)"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <path
                d={lowerBandPath}
                fill="none"
                stroke="rgba(56, 189, 248, 0.45)"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
            </>
          )}

          {/* SMA Line */}
          {showSMA && (
            <path
              d={smaPath}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="1.5"
              strokeOpacity="0.85"
            />
          )}

          {/* Area Line Chart Mode with progressive line drawing animation */}
          {chartType === 'line' && (
            <>
              <path d={areaPath} fill="url(#areaGradient)" className="transition-opacity duration-500" />
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

          {/* Candlestick Chart Mode */}
          {chartType === 'candlestick' && (
            <g>
              {convertedCandles.map((c, i) => {
                const x = i * stepX;
                const candleWidth = Math.max(2, Math.min(10, stepX * 0.7));
                const openY = getPriceY(c.open);
                const closeY = getPriceY(c.close);
                const highY = getPriceY(c.high);
                const lowY = getPriceY(c.low);
                const isGreen = c.close >= c.open;
                const bodyTop = Math.min(openY, closeY);
                const bodyHeight = Math.max(1.5, Math.abs(closeY - openY));

                return (
                  <g key={i}>
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
                      rx={1}
                    />
                  </g>
                );
              })}
            </g>
          )}

          {/* Volume Bars */}
          <g>
            {convertedCandles.map((c, i) => {
              const x = i * stepX;
              const barWidth = Math.max(2, Math.min(8, stepX * 0.6));
              const volY = getVolY(c.volume);
              const isGreen = c.close >= c.open;
              const baseBottom = priceHeight + volumeHeight;

              return (
                <rect
                  key={`vol-${i}`}
                  x={x - barWidth / 2}
                  y={volY}
                  width={barWidth}
                  height={Math.max(1, baseBottom - volY)}
                  fill={isGreen ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}
                />
              );
            })}
          </g>

          {/* RSI Sub-Panel */}
          {showRSI && (
            <g transform={`translate(0, ${priceHeight + volumeHeight + 10})`}>
              <line x1="0" y1="0" x2={viewWidth} y2="0" stroke="rgba(255, 255, 255, 0.08)" />
              <line
                x1="0"
                y1={rsiHeight * 0.3}
                x2={viewWidth}
                y2={rsiHeight * 0.3}
                stroke="rgba(244, 63, 94, 0.25)"
                strokeDasharray="2 2"
              />
              <line
                x1="0"
                y1={rsiHeight * 0.7}
                x2={viewWidth}
                y2={rsiHeight * 0.7}
                stroke="rgba(16, 185, 129, 0.25)"
                strokeDasharray="2 2"
              />
              {(() => {
                let path = '';
                rsiValues.forEach((val, i) => {
                  if (val !== null) {
                    const rY = rsiHeight - (val / 100) * rsiHeight;
                    path += `${path === '' ? 'M' : 'L'} ${i * stepX} ${rY} `;
                  }
                });
                return <path d={path} fill="none" stroke="#38bdf8" strokeWidth="1.2" />;
              })()}
              <text x="5" y="12" fill="#38bdf8" fontSize="9" fontFamily="monospace">
                RSI (14)
              </text>
            </g>
          )}

          {/* Crosshair indicator on hover */}
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
                y1={getPriceY(activeCandle.close)}
                x2={viewWidth}
                y2={getPriceY(activeCandle.close)}
                stroke="#6366f1"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <circle
                cx={hoverIndex * stepX}
                cy={getPriceY(activeCandle.close)}
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
