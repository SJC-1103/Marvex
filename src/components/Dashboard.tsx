import React, { useState } from 'react';
import { Stock, MarketIndex, Currency } from '../types/market';
import { PortfolioSummary } from '../types/portfolio';
import { formatCurrency, formatMarketCap, formatVolume } from '../utils/currency';
import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, Activity, Star, Layers, Sparkles, Clock, Globe, ShieldCheck, Compass, Bell, Cpu, ArrowRight } from 'lucide-react';
import { PortfolioCard } from './PortfolioCard';
import { playQuantumBeep } from '../utils/audio';

interface DashboardProps {
  stocks: Stock[];
  indices: MarketIndex[];
  watchlist: string[];
  onToggleWatchlist: (stockId: string) => void;
  comparedStockIds: string[];
  onToggleCompare: (stockId: string) => void;
  onSelectStock: (stock: Stock) => void;
  onNavigateTab: (tab: 'explorer' | 'comparison' | 'watchlist') => void;
  currency: Currency;
  exchangeRate: number;
  activeAlertsCount?: number;
  portfolioSummary: PortfolioSummary;
  onOpenManagePortfolio: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  stocks,
  indices,
  watchlist,
  onToggleWatchlist,
  comparedStockIds,
  onToggleCompare,
  onSelectStock,
  onNavigateTab,
  currency,
  exchangeRate,
  activeAlertsCount = 0,
  portfolioSummary,
  onOpenManagePortfolio,
}) => {
  const [activeCategory, setActiveCategory] = useState<'gainers' | 'losers' | 'volume' | 'quantum'>('gainers');
  const [regionFilter, setRegionFilter] = useState<'ALL' | 'IN' | 'US'>('ALL');

  // Filter stocks by region
  const regionalStocks = stocks.filter(s => regionFilter === 'ALL' || s.country === regionFilter);

  // Top gainers
  const topGainers = [...regionalStocks].sort((a, b) => b.changePercent - a.changePercent).slice(0, 5);
  // Top losers
  const topLosers = [...regionalStocks].sort((a, b) => a.changePercent - b.changePercent).slice(0, 5);
  // Most active volume
  const mostActive = [...regionalStocks].sort((a, b) => b.volume - a.volume).slice(0, 5);
  // Quantum tech spotlight
  const quantumTech = [...regionalStocks].sort((a, b) => (b.quantumScore ?? 70) - (a.quantumScore ?? 70)).slice(0, 5);

  const displayedList =
    activeCategory === 'gainers'
      ? topGainers
      : activeCategory === 'losers'
      ? topLosers
      : activeCategory === 'volume'
      ? mostActive
      : quantumTech;

  // Compute market sentiment score
  const totalStocks = stocks.length;
  const advancingStocks = stocks.filter(s => s.changePercent > 0).length;
  const decliningStocks = stocks.filter(s => s.changePercent < 0).length;
  const bullRatio = Math.round((advancingStocks / totalStocks) * 100);

  return (
    <div className="w-full space-y-6">
      {/* Hero Welcome & Market Pulse Banner */}
      <div className="p-6 sm:p-8 rounded-3xl quantum-card relative overflow-hidden">
        {/* Subtle executive lighting */}
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-80 h-80 bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-slate-300 text-xs font-mono-code">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Live Micro-Tick Engine · Dual Indian (₹) & US ($) Valuation
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-white tracking-tight">
              Cross-Border Market Intelligence
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xl">
              Unified institutional terminal connecting National Stock Exchange (NSE), BSE, NYSE, and NASDAQ. Evaluate bid/ask order book depth, calculate cross-currency portfolio valuation, and set precision volatility alerts.
            </p>
          </div>

          {/* Market Breadth & Sentiment Meter */}
          <div className="flex flex-col sm:flex-row items-center gap-5 bg-black/40 p-4 sm:p-5 rounded-2xl border border-white/[0.08] shrink-0">
            <div className="text-center sm:text-left">
              <div className="text-[11px] text-slate-400 font-mono-code uppercase tracking-wider flex items-center gap-1.5 justify-center sm:justify-start">
                <Activity className="w-3.5 h-3.5 text-sky-400" /> Market Breadth
              </div>
              <div className="text-xl font-bold font-heading text-white mt-1">
                {bullRatio > 55 ? 'Bullish Expansion' : bullRatio < 45 ? 'Bearish Contraction' : 'Neutral Consolidation'}
              </div>
              <div className="text-xs text-slate-400 font-mono-code mt-1 flex items-center justify-center sm:justify-start gap-2">
                <span className="text-emerald-400 font-semibold">{advancingStocks} Advances</span>
                <span className="text-slate-600">·</span>
                <span className="text-rose-400 font-semibold">{decliningStocks} Declines</span>
              </div>
            </div>

            {/* Circular Gauge visual */}
            <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="3.2"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke={bullRatio >= 50 ? '#10b981' : '#f43f5e'}
                  strokeDasharray={`${bullRatio}, 100`}
                  strokeWidth="3.2"
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute font-mono-code text-xs font-bold text-white">
                {bullRatio}%
              </span>
            </div>
          </div>
        </div>

        {/* Market Trading Sessions Status */}
        <div className="mt-6 pt-4 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="font-mono-code text-slate-300">NSE/BSE (Mumbai):</span>
              <span className="text-emerald-400 font-mono-code font-semibold">Open · 09:15 - 15:30 IST</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-400"></span>
              <span className="font-mono-code text-slate-300">NYSE/NASDAQ (New York):</span>
              <span className="text-sky-400 font-mono-code font-semibold">Open · 09:30 - 16:00 EST</span>
            </div>
          </div>

          <div className="text-slate-400 font-mono-code text-[11px] flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>FX Parity: 1 USD = ₹{exchangeRate.toFixed(2)} INR</span>
          </div>
        </div>
      </div>

      {/* Real-time Portfolio Valuation Card */}
      <PortfolioCard
        portfolioSummary={portfolioSummary}
        onOpenManageModal={onOpenManagePortfolio}
        currency={currency}
      />

      {/* Major Market Indices Carousel / Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold font-mono-code text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-sky-400" /> Benchmark Market Indices
          </h2>
          <span className="text-xs font-mono-code text-slate-500">Live Micro-Ticks</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          {indices.map(index => {
            const isUp = index.changePercent >= 0;
            const sparkPoints = index.sparkline && index.sparkline.length > 1
              ? index.sparkline
              : index.history && index.history.length > 0
              ? index.history.slice(-15).map(b => b.close)
              : [index.value * 0.99, index.value * 0.995, index.value * 1.002, index.value];
            const minS = Math.min(...sparkPoints);
            const maxS = Math.max(...sparkPoints);
            const range = maxS - minS || 1;

            const sparkPath = sparkPoints
              .map((val, i) => {
                const x = (i / Math.max(1, sparkPoints.length - 1)) * 100;
                const y = 30 - ((val - minS) / range) * 24;
                return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
              })
              .join(' ');

            return (
              <div
                key={index.symbol}
                className="quantum-card p-4 rounded-2xl hover:border-white/[0.15] transition"
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-bold text-white font-mono-code text-xs">{index.symbol}</span>
                  <span className="text-[10px] text-slate-400 font-mono-code px-1.5 py-0.5 rounded bg-white/[0.04]">
                    {index.exchange}
                  </span>
                </div>

                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-base sm:text-lg font-bold font-mono-code text-white">
                    {index.currency === 'INR' ? `₹${index.value.toLocaleString('en-IN')}` : `$${index.value.toLocaleString('en-US')}`}
                  </span>
                  <span
                    className={`text-[11px] font-mono-code font-bold flex items-center ${
                      isUp ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {isUp ? '+' : ''}{index.changePercent.toFixed(2)}%
                  </span>
                </div>

                {/* Mini Sparkline Chart */}
                <div className="w-full h-8 mt-2 overflow-hidden opacity-90">
                  <svg viewBox="0 0 100 32" className="w-full h-full overflow-visible">
                    <path
                      d={sparkPath}
                      fill="none"
                      stroke={isUp ? '#10b981' : '#f43f5e'}
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Section: Categorized Lists & Interactive Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Leaderboards (Gainers, Losers, Volume, Quantum) */}
        <div className="lg:col-span-2 quantum-card p-5 sm:p-6 rounded-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Category Switcher with clean icons */}
            <div className="flex flex-wrap gap-1 bg-black/40 p-1 rounded-xl border border-white/[0.08] text-xs font-medium">
              {[
                { id: 'gainers', label: 'Top Gainers', icon: TrendingUp },
                { id: 'losers', label: 'Decliners', icon: TrendingDown },
                { id: 'volume', label: 'Active Volume', icon: Activity },
                { id: 'quantum', label: 'Quant Momentum', icon: Sparkles },
              ].map(cat => {
                const Icon = cat.icon;
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setActiveCategory(cat.id as typeof activeCategory);
                      playQuantumBeep(620, 0.04);
                    }}
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                      isActive
                        ? 'bg-white/[0.1] text-white font-semibold shadow-sm border border-white/[0.1]'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Region Filter */}
            <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/[0.08] text-xs font-mono-code">
              {[
                { id: 'ALL', label: 'Global' },
                { id: 'IN', label: 'NSE/BSE' },
                { id: 'US', label: 'US Equities' },
              ].map(r => (
                <button
                  key={r.id}
                  onClick={() => setRegionFilter(r.id as typeof regionFilter)}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    regionFilter === r.id
                      ? 'bg-sky-500/20 text-sky-300 font-semibold border border-sky-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* List of stocks */}
          <div className="divide-y divide-white/[0.06]">
            {displayedList.map(stock => {
              const isSaved = watchlist.includes(stock.id);
              const isCompared = comparedStockIds.includes(stock.id);
              const isPositive = stock.changePercent >= 0;

              return (
                <div
                  key={stock.id}
                  onClick={() => onSelectStock(stock)}
                  className="py-3 px-3 rounded-xl hover:bg-white/[0.04] cursor-pointer flex items-center justify-between transition group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center font-mono-code font-bold text-xs text-white group-hover:border-sky-500/50 transition">
                      {stock.symbol.slice(0, 3)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white font-mono-code text-sm group-hover:text-sky-300 transition">
                          {stock.symbol}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/[0.05] border border-white/[0.08] text-slate-300 font-mono-code">
                          {stock.exchange}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono-code">
                          Lot: {stock.lotSize}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 truncate max-w-[200px] sm:max-w-xs mt-0.5">
                        {stock.name} · {stock.sector}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-bold font-mono-code text-white">
                        {formatCurrency(stock.price, currency, stock.baseCurrency, exchangeRate)}
                      </div>
                      <div
                        className={`text-xs font-mono-code font-bold flex items-center justify-end gap-0.5 ${
                          isPositive ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                        {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
                      </div>
                    </div>

                    {/* Compare & Star */}
                    <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => {
                          onToggleCompare(stock.id);
                          playQuantumBeep(600, 0.04);
                        }}
                        title={isCompared ? 'Remove Compare' : 'Add to Compare'}
                        className={`p-1.5 rounded-lg border transition ${
                          isCompared
                            ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                            : 'border-white/[0.08] text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        <Layers className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          onToggleWatchlist(stock.id);
                          playQuantumBeep(800, 0.04);
                        }}
                        title={isSaved ? 'Remove Watchlist' : 'Add Watchlist'}
                        className={`p-1.5 rounded-lg border transition ${
                          isSaved
                            ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                            : 'border-white/[0.08] text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        <Star className={`w-3.5 h-3.5 ${isSaved ? 'fill-amber-400 text-amber-400' : ''}`} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 text-center">
            <button
              onClick={() => onNavigateTab('explorer')}
              className="text-xs font-mono-code text-sky-400 hover:text-sky-300 font-semibold transition inline-flex items-center gap-1.5"
            >
              <span>Explore Universe (20+ Equities across NSE, BSE & US)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Col: Quick Access Tools */}
        <div className="space-y-4">
          {/* Price Alerts Quick Feature Card */}
          <div className="quantum-card p-5 rounded-2xl space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs font-mono-code">
              <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
                <Bell className="w-3.5 h-3.5" /> Threshold Engine
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold">
                {activeAlertsCount} Active
              </span>
            </div>
            <h3 className="text-base font-bold font-heading text-white">
              Price Threshold Alerts
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Set automated price triggers on Indian & US equities. Receive immediate acoustic & visual prompts when simulated live ticks cross your threshold.
            </p>
            <button
              onClick={() => onNavigateTab('watchlist')}
              className="w-full py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.1] text-white font-semibold text-xs transition shadow-sm"
            >
              Configure Price Alerts →
            </button>
          </div>

          {/* Quick Comparison Card */}
          <div className="quantum-card p-5 rounded-2xl space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-heading font-bold text-white flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" /> Comparison Matrix
              </span>
              <span className="font-mono-code text-indigo-300 text-xs">
                {comparedStockIds.length} / 4 Selected
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Directly analyze derivative lot sizes, bid/ask depth spreads, and normalized growth trajectories side-by-side.
            </p>

            <button
              onClick={() => onNavigateTab('comparison')}
              className="w-full py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-sky-300 font-medium text-xs font-mono-code transition"
            >
              Open Comparison Matrix ({comparedStockIds.length}) →
            </button>
          </div>

          {/* Cross-border Guidance Card */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.06] space-y-2 text-xs text-slate-400">
            <div className="font-bold text-white font-mono-code flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-sky-400" /> Cross-Currency Normalization
            </div>
            <p className="leading-relaxed text-[11px] text-slate-400">
              Toggle between <strong className="text-slate-200">₹ INR</strong> and <strong className="text-slate-200">$ USD</strong> at any moment. All cross-border equity valuations, lot values, and portfolio returns recalculate instantaneously.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
