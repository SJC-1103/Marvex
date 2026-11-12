import React, { useState } from 'react';
import { Stock, Currency, Timeframe } from '../types/market';
import { formatCurrency, formatMarketCap, formatVolume } from '../utils/currency';
import { Plus, X, ArrowUpRight, ArrowDownRight, Check, Award, Layers } from 'lucide-react';
import { playQuantumBeep } from '../utils/audio';

interface StockComparisonProps {
  allStocks: Stock[];
  selectedStockIds: string[];
  onToggleStock: (stockId: string) => void;
  onSelectDetailStock: (stock: Stock) => void;
  currency: Currency;
  exchangeRate: number;
}

export const StockComparison: React.FC<StockComparisonProps> = ({
  allStocks,
  selectedStockIds,
  onToggleStock,
  onSelectDetailStock,
  currency,
  exchangeRate,
}) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('1M');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // Filter selected stocks
  const comparedStocks = allStocks.filter(s => selectedStockIds.includes(s.id));

  // Determine comparison chart normalized points
  const normalizedSeries = comparedStocks.map(stock => {
    const bars = stock.history || [];
    let sliceDays = 252;
    if (timeframe === '1M') sliceDays = 21;
    else if (timeframe === '3M') sliceDays = 63;
    else if (timeframe === '6M') sliceDays = 126;
    else if (timeframe === 'YTD') sliceDays = 180;
    else if (timeframe === '1Y') sliceDays = 252;
    else if (timeframe === '3Y') sliceDays = 756;
    else if (timeframe === '5Y' || timeframe === 'MAX') sliceDays = bars.length;

    const sliced = bars.slice(Math.max(0, bars.length - sliceDays));
    if (sliced.length === 0) return { stock, points: [] as { timeStr: string; pctChange: number }[] };
    const firstClose = sliced[0].close || 1;
    const points = sliced.map(b => ({
      timeStr: b.date,
      pctChange: Number((((b.close - firstClose) / firstClose) * 100).toFixed(2)),
    }));
    return { stock, points };
  });

  const lowestPE = comparedStocks.some(s => s.peRatio > 0)
    ? Math.min(...comparedStocks.filter(s => s.peRatio > 0).map(s => s.peRatio))
    : 0;
  const highestDividend = comparedStocks.length > 0
    ? Math.max(...comparedStocks.map(s => s.dividendYield || 0))
    : 0;
  const highestQuantum = comparedStocks.length > 0
    ? Math.max(...comparedStocks.map(s => s.quantumScore || 75))
    : 75;

  const stockColors = ['#38bdf8', '#6366f1', '#10b981', '#f59e0b'];

  return (
    <div className="w-full space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl quantum-card">
        <div>
          <div className="flex items-center gap-2 text-sky-400 text-xs font-mono-code uppercase tracking-wider mb-1">
            <Layers className="w-3.5 h-3.5" /> Multi-Asset Relative Matrix
          </div>
          <h2 className="text-2xl font-bold font-heading text-white flex items-center gap-2">
            Stock Comparison Matrix
          </h2>
          <p className="text-slate-400 text-sm mt-1 max-w-xl">
            Evaluate up to 4 securities side-by-side across NSE, BSE, NYSE, and Nasdaq. Analyze normalized performance, lot units, and relative value metrics.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.1] text-white font-semibold text-xs flex items-center gap-2 transition active:scale-95 shadow-sm"
          >
            <Plus className="w-4 h-4 text-sky-400" />
            <span>Select Equities ({comparedStocks.length}/4)</span>
          </button>
        </div>
      </div>

      {/* Active Selected Stock Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {comparedStocks.map((stock, idx) => (
          <div
            key={stock.id}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-black/40 border border-white/[0.08] text-xs shadow-sm"
          >
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: stockColors[idx % stockColors.length] }}
            />
            <span className="font-bold text-white font-mono-code">{stock.symbol}</span>
            <span className="text-slate-400 text-[11px] font-mono-code">{stock.exchange}</span>
            <button
              onClick={() => {
                onToggleStock(stock.id);
                playQuantumBeep(420, 0.05);
              }}
              className="text-slate-500 hover:text-rose-400 p-0.5 rounded transition"
              title="Remove from comparison"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {comparedStocks.length === 0 ? (
        <div className="p-12 text-center rounded-2xl quantum-card border border-dashed border-white/[0.08]">
          <Layers className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white mb-1">No Securities Selected</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto mb-4">
            Select 2 or more stocks to compare their prices, lot sizes, bid/ask spreads, and performance curves.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs transition"
          >
            Select Stocks
          </button>
        </div>
      ) : (
        <>
          {/* Comparative Normalized Performance Chart */}
          <div className="p-5 sm:p-6 rounded-2xl quantum-card space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <h3 className="text-base font-bold font-heading text-white">
                  Normalized Performance Trajectory (% Growth)
                </h3>
                <p className="text-slate-400">Baseline normalized to 0.0% at start of selected window</p>
              </div>

              {/* Timeframe switcher */}
              <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/[0.08] font-mono-code">
                {(['1D', '1W', '1M', '3M', '1Y', 'ALL'] as Timeframe[]).map(tf => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-2.5 py-1 rounded-lg text-xs transition ${
                      timeframe === tf
                        ? 'bg-white/[0.1] text-white font-bold border border-white/[0.12]'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            {/* Normalized Chart Area */}
            <div className="w-full h-64 bg-black/50 rounded-xl p-3 border border-white/[0.06] relative">
              <svg viewBox="0 0 700 200" className="w-full h-full overflow-visible">
                {/* 0% Baseline */}
                <line x1="0" y1="100" x2="700" y2="100" stroke="rgba(255, 255, 255, 0.15)" strokeDasharray="3 3" />
                <text x="5" y="96" fill="#94a3b8" fontSize="10" fontFamily="monospace">0.0%</text>

                {normalizedSeries.map((series, sIdx) => {
                  const pts = series.points;
                  if (pts.length < 2) return null;
                  const stepX = 700 / (pts.length - 1);
                  const color = stockColors[sIdx % stockColors.length];

                  const mapY = (pct: number) => {
                    const clamped = Math.max(-35, Math.min(35, pct));
                    return 100 - (clamped / 35) * 80;
                  };

                  const pathStr = pts
                    .map((p: { timeStr: string; pctChange: number }, pIdx: number) => `${pIdx === 0 ? 'M' : 'L'} ${pIdx * stepX} ${mapY(p.pctChange)}`)
                    .join(' ');

                  const lastPt = pts[pts.length - 1];

                  return (
                    <g key={series.stock.id}>
                      <path
                        d={pathStr}
                        fill="none"
                        stroke={color}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <circle
                        cx={(pts.length - 1) * stepX}
                        cy={mapY(lastPt.pctChange)}
                        r="3.5"
                        fill={color}
                      />
                    </g>
                  );
                })}
              </svg>

              {/* Chart Legend */}
              <div className="flex flex-wrap items-center gap-4 mt-2 justify-end text-xs">
                {normalizedSeries.map((s, idx) => {
                  const lastPt = s.points[s.points.length - 1];
                  const color = stockColors[idx % stockColors.length];
                  return (
                    <div key={s.stock.id} className="flex items-center gap-1.5 font-mono-code">
                      <span className="w-3 h-1 rounded" style={{ backgroundColor: color }} />
                      <span className="text-slate-300 font-semibold">{s.stock.symbol}:</span>
                      <span className={lastPt && lastPt.pctChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {lastPt ? `${lastPt.pctChange >= 0 ? '+' : ''}${lastPt.pctChange}%` : '0%'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Side-by-Side Comparison Matrix Table */}
          <div className="rounded-2xl quantum-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-white/[0.02]">
                    <th className="p-4 text-xs font-mono-code uppercase text-slate-400 w-52">
                      Comparison Metric
                    </th>
                    {comparedStocks.map((stock, idx) => (
                      <th key={stock.id} className="p-4 text-sm font-heading font-bold text-white min-w-[200px]">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: stockColors[idx % stockColors.length] }}
                            />
                            <span>{stock.symbol}</span>
                          </div>
                          <button
                            onClick={() => onSelectDetailStock(stock)}
                            className="text-[10px] px-2 py-0.5 rounded bg-white/[0.06] hover:bg-white/[0.1] text-sky-300 font-mono-code border border-white/[0.08]"
                          >
                            Details →
                          </button>
                        </div>
                        <div className="text-xs font-normal text-slate-400 truncate max-w-[170px] mt-0.5">
                          {stock.name}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] text-xs">
                  {/* Exchange & Country */}
                  <tr className="hover:bg-white/[0.02]">
                    <td className="p-4 font-mono-code text-slate-400">Exchange & Country</td>
                    {comparedStocks.map(stock => (
                      <td key={stock.id} className="p-4 font-medium text-slate-200">
                        <span className="px-2 py-0.5 rounded bg-white/[0.05] text-sky-300 font-mono-code font-bold mr-1.5 border border-white/[0.08]">
                          {stock.exchange}
                        </span>
                        {stock.country === 'IN' ? 'India' : 'USA'}
                      </td>
                    ))}
                  </tr>

                  {/* Current Price */}
                  <tr className="hover:bg-white/[0.02]">
                    <td className="p-4 font-mono-code text-slate-400">Current Price</td>
                    {comparedStocks.map(stock => (
                      <td key={stock.id} className="p-4 font-mono-code font-bold text-sm text-white">
                        {formatCurrency(stock.price, currency, stock.baseCurrency, exchangeRate)}
                        {currency !== stock.baseCurrency && (
                          <span className="block text-[10px] text-slate-500 font-normal">
                            Native: {formatCurrency(stock.price, stock.baseCurrency, stock.baseCurrency)}
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* 24h Change % */}
                  <tr className="hover:bg-white/[0.02]">
                    <td className="p-4 font-mono-code text-slate-400">24h Change</td>
                    {comparedStocks.map(stock => {
                      const isUp = stock.changePercent >= 0;
                      return (
                        <td key={stock.id} className="p-4 font-mono-code font-bold">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md ${
                              isUp ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                            }`}
                          >
                            {isUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                            {isUp ? '+' : ''}{stock.changePercent.toFixed(2)}%
                          </span>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Bid Price */}
                  <tr className="hover:bg-white/[0.02]">
                    <td className="p-4 font-mono-code text-slate-400">Bid Price</td>
                    {comparedStocks.map(stock => {
                      const bid = stock.bid ?? Number((stock.price * 0.9995).toFixed(2));
                      return (
                        <td key={stock.id} className="p-4 font-mono-code text-emerald-400 font-semibold">
                          {formatCurrency(bid, currency, stock.baseCurrency, exchangeRate)}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Ask Price */}
                  <tr className="hover:bg-white/[0.02]">
                    <td className="p-4 font-mono-code text-slate-400">Ask Price</td>
                    {comparedStocks.map(stock => {
                      const ask = stock.ask ?? Number((stock.price * 1.0005).toFixed(2));
                      return (
                        <td key={stock.id} className="p-4 font-mono-code text-rose-400 font-semibold">
                          {formatCurrency(ask, currency, stock.baseCurrency, exchangeRate)}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Lot Size */}
                  <tr className="hover:bg-white/[0.02] bg-white/[0.01]">
                    <td className="p-4 font-mono-code text-slate-300 font-semibold flex items-center gap-1.5">
                      <span>Lot Size (Contract Unit)</span>
                    </td>
                    {comparedStocks.map(stock => {
                      const lot = stock.lotSize || 1;
                      return (
                        <td key={stock.id} className="p-4 font-mono-code">
                          <span className="px-2.5 py-1 rounded-lg bg-white/[0.06] border border-white/[0.08] text-slate-200 font-semibold">
                            {lot} {lot === 1 ? 'Share' : 'Shares'}
                          </span>
                          {stock.country === 'IN' && lot > 1 && (
                            <span className="block text-[10px] text-slate-400 mt-1">
                              NSE F&O Derivative Lot
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* 24h Volume */}
                  <tr className="hover:bg-white/[0.02]">
                    <td className="p-4 font-mono-code text-slate-400">24h Volume</td>
                    {comparedStocks.map(stock => (
                      <td key={stock.id} className="p-4 font-mono-code text-slate-200">
                        {formatVolume(stock.volume, stock.baseCurrency)}
                      </td>
                    ))}
                  </tr>

                  {/* Market Capitalization */}
                  <tr className="hover:bg-white/[0.02]">
                    <td className="p-4 font-mono-code text-slate-400">Market Cap</td>
                    {comparedStocks.map(stock => (
                      <td key={stock.id} className="p-4 font-mono-code text-slate-200">
                        {formatMarketCap(stock.marketCap, currency, stock.baseCurrency, exchangeRate)}
                      </td>
                    ))}
                  </tr>

                  {/* 52-Week Range */}
                  <tr className="hover:bg-white/[0.02]">
                    <td className="p-4 font-mono-code text-slate-400">52-Week Range (L - H)</td>
                    {comparedStocks.map(stock => {
                      const low52 = stock.low52w ?? stock.week52Low ?? stock.price * 0.85;
                      const high52 = stock.high52w ?? stock.week52High ?? stock.price * 1.15;
                      return (
                        <td key={stock.id} className="p-4 font-mono-code text-slate-300">
                          {formatCurrency(low52, currency, stock.baseCurrency, exchangeRate)} -{' '}
                          {formatCurrency(high52, currency, stock.baseCurrency, exchangeRate)}
                        </td>
                      );
                    })}
                  </tr>

                  {/* P/E Ratio */}
                  <tr className="hover:bg-white/[0.02]">
                    <td className="p-4 font-mono-code text-slate-400">P/E Ratio (TTM)</td>
                    {comparedStocks.map(stock => (
                      <td key={stock.id} className="p-4 font-mono-code text-slate-200">
                        {stock.peRatio > 0 ? stock.peRatio.toFixed(1) : 'N/A'}
                        {stock.peRatio === lowestPE && (
                          <span className="ml-2 inline-flex items-center gap-0.5 text-[10px] text-emerald-400 font-sans">
                            <Award className="w-3 h-3" /> Best Value
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Beta & Volatility */}
                  <tr className="hover:bg-white/[0.02]">
                    <td className="p-4 font-mono-code text-slate-400">Beta (Market Sensitivity)</td>
                    {comparedStocks.map(stock => (
                      <td key={stock.id} className="p-4 font-mono-code text-slate-200">
                        {stock.beta.toFixed(2)}
                      </td>
                    ))}
                  </tr>

                  {/* Dividend Yield */}
                  <tr className="hover:bg-white/[0.02]">
                    <td className="p-4 font-mono-code text-slate-400">Dividend Yield</td>
                    {comparedStocks.map(stock => (
                      <td key={stock.id} className="p-4 font-mono-code text-slate-200">
                        {stock.dividendYield > 0 ? `${stock.dividendYield.toFixed(2)}%` : '0.00%'}
                        {stock.dividendYield === highestDividend && stock.dividendYield > 0 && (
                          <span className="ml-2 inline-flex items-center gap-0.5 text-[10px] text-sky-400 font-sans">
                            <Award className="w-3 h-3" /> Highest Yield
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Quant Alpha Score */}
                  <tr className="hover:bg-white/[0.02] bg-white/[0.01]">
                    <td className="p-4 font-mono-code text-slate-300 font-semibold flex items-center gap-1.5">
                      <span>Quant Momentum Index</span>
                    </td>
                    {comparedStocks.map(stock => {
                      const qScore = stock.quantumScore ?? Math.min(96, Math.max(45, Math.round(65 + stock.changePercent * 4)));
                      return (
                        <td key={stock.id} className="p-4 font-mono-code">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-sky-300">{qScore}/100</span>
                            {qScore === highestQuantum && (
                              <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 text-[10px] font-sans">
                                Top Momentum
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Stock Selection Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl quantum-card border border-white/[0.1] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold font-heading text-white">
                Select Equities to Compare (Max 4)
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <input
              type="text"
              placeholder="Search symbol or name (e.g. RELIANCE, NVDA, TCS)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/[0.08] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono-code"
            />

            {/* List */}
            <div className="max-h-72 overflow-y-auto divide-y divide-white/[0.04] pr-1 space-y-1">
              {allStocks
                .filter(
                  s =>
                    s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    s.name.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map(stock => {
                  const isSelected = selectedStockIds.includes(stock.id);
                  return (
                    <div
                      key={stock.id}
                      onClick={() => {
                        if (!isSelected && selectedStockIds.length >= 4) {
                          return;
                        }
                        onToggleStock(stock.id);
                        playQuantumBeep(520, 0.04);
                      }}
                      className={`p-3 rounded-xl flex items-center justify-between cursor-pointer transition ${
                        isSelected
                          ? 'bg-white/[0.08] border border-white/[0.12]'
                          : selectedStockIds.length >= 4
                          ? 'opacity-40 cursor-not-allowed'
                          : 'hover:bg-white/[0.03] border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center font-mono-code text-xs font-bold text-white">
                          {stock.symbol.slice(0, 3)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white font-mono-code">{stock.symbol}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.05] text-slate-300 font-mono-code">
                              {stock.exchange}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 truncate max-w-[220px]">{stock.name}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-right">
                        <div>
                          <div className="font-mono-code font-bold text-xs text-white">
                            {formatCurrency(stock.price, currency, stock.baseCurrency, exchangeRate)}
                          </div>
                          <div className={`text-[11px] font-mono-code ${stock.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                          </div>
                        </div>

                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                            isSelected
                              ? 'bg-sky-500 border-sky-400 text-black'
                              : 'border-white/[0.1]'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 font-bold" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="flex items-center justify-between pt-2 text-xs text-slate-400 border-t border-white/[0.06]">
              <span>{selectedStockIds.length} of 4 selected</span>
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.1] text-white font-semibold transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
