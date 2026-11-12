import React, { useState, useMemo } from 'react';
import { Stock, MarketIndex, Currency, DailyBar } from '../../types/market';
import { MutualFundScheme } from '../../types/mutualFund';
import { formatCurrency, formatMarketCap, convertCurrency } from '../../utils/currency';
import { TechnicalChart } from '../TechnicalChart';
import {
  Search,
  Compass,
  Star,
  Layers,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Globe,
  SlidersHorizontal,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { playQuantumBeep } from '../../utils/audio';

import { PortfolioBook } from '../../types/portfolio';
import { CompareWorkspace } from './CompareWorkspace';

interface AnalyzeWorkspaceProps {
  stocks: Stock[];
  indices: MarketIndex[];
  mutualFunds: MutualFundScheme[];
  books?: PortfolioBook[];
  selectedInstrumentId?: string;
  currency: Currency;
  exchangeRate: number;
  watchlist: string[];
  onToggleWatchlist: (id: string) => void;
  onSelectForCompare: (symbol: string) => void;
}

export type UnifiedItem = {
  id: string;
  type: 'EQUITY' | 'MUTUAL_FUND' | 'INDEX';
  symbol: string;
  name: string;
  exchangeOrAmc: string;
  country: 'IN' | 'US';
  priceOrNav: number;
  change: number;
  changePercent: number;
  currency: Currency;
  marketCapOrAum: number;
  expenseRatio?: number;
  peRatio?: number;
  lastAuditedDate?: string;
  dividendYield?: number;
  beta?: number;
  high52w: number;
  low52w: number;
  history: DailyBar[];
  description?: string;
};

export const AnalyzeWorkspace: React.FC<AnalyzeWorkspaceProps> = ({
  stocks,
  indices,
  mutualFunds,
  books = [],
  selectedInstrumentId = 'stock-reliance',
  currency,
  exchangeRate,
  watchlist,
  onToggleWatchlist,
  onSelectForCompare,
}) => {
  const [subMode, setSubMode] = useState<'TECHNICAL' | 'COMPARE'>('TECHNICAL');
  const [compareSymbols, setCompareSymbols] = useState<string[]>(['RELIANCE', 'NVDA', 'NIFTY 50']);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'EQUITY' | 'MUTUAL_FUND' | 'INDEX'>('ALL');
  const [regionFilter, setRegionFilter] = useState<'ALL' | 'IN' | 'US'>('ALL');
  const [activeId, setActiveId] = useState<string>(selectedInstrumentId);

  // Normalize all items into unified format
  const allUnifiedItems: UnifiedItem[] = useMemo(() => {
    const list: UnifiedItem[] = [];

    // 1. Stocks
    stocks.forEach(s => {
      list.push({
        id: s.id,
        type: 'EQUITY',
        symbol: s.symbol,
        name: s.name,
        exchangeOrAmc: s.exchange,
        country: s.country,
        priceOrNav: s.price,
        change: s.change,
        changePercent: s.changePercent,
        currency: s.baseCurrency,
        marketCapOrAum: s.marketCap,
        peRatio: s.peRatio,
        lastAuditedDate: s.lastAuditedDate,
        dividendYield: s.dividendYield,
        beta: s.beta,
        high52w: s.high52w,
        low52w: s.low52w,
        history: s.history,
        description: s.description,
      });
    });

    // 2. Mutual Funds
    mutualFunds.forEach(mf => {
      const closes = mf.history.map(b => b.close);
      const high52w = Math.max(...closes, mf.nav);
      const low52w = Math.min(...closes, mf.nav);

      list.push({
        id: mf.id,
        type: 'MUTUAL_FUND',
        symbol: mf.symbol,
        name: mf.name,
        exchangeOrAmc: mf.amc,
        country: 'IN',
        priceOrNav: mf.nav,
        change: mf.change,
        changePercent: mf.changePercent,
        currency: mf.currency,
        marketCapOrAum: mf.aumCrores * 10000000, // ₹ Crore to raw INR
        expenseRatio: mf.expenseRatio,
        dividendYield: 0,
        beta: 0.88,
        high52w,
        low52w,
        history: mf.history,
        description: `${mf.category} Scheme (${mf.planType} ${mf.option}) managed by ${mf.fundManager}. Benchmark: ${mf.benchmarkIndex}.`,
      });
    });

    // 3. Indices
    indices.forEach(idx => {
      const closes = idx.history.map(b => b.close);
      const high52w = closes.length > 0 ? Math.max(...closes, idx.high) : idx.high;
      const low52w = closes.length > 0 ? Math.min(...closes, idx.low) : idx.low;

      list.push({
        id: idx.id,
        type: 'INDEX',
        symbol: idx.symbol,
        name: idx.name,
        exchangeOrAmc: idx.exchange,
        country: idx.country,
        priceOrNav: idx.value,
        change: idx.change,
        changePercent: idx.changePercent,
        currency: idx.currency,
        marketCapOrAum: 0,
        dividendYield: 1.1,
        beta: 1.0,
        high52w,
        low52w,
        history: idx.history,
        description: `Official domestic index for ${idx.name} tracking premier constituent market capitalizations.`,
      });
    });

    return list;
  }, [stocks, mutualFunds, indices]);

  // Filtered screener list
  const filteredItems = useMemo(() => {
    return allUnifiedItems.filter(item => {
      if (typeFilter !== 'ALL' && item.type !== typeFilter) return false;
      if (regionFilter !== 'ALL' && item.country !== regionFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        item.symbol.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.exchangeOrAmc.toLowerCase().includes(q)
      );
    });
  }, [allUnifiedItems, typeFilter, regionFilter, search]);

  // Active selected instrument
  const activeItem = useMemo(() => {
    const found = allUnifiedItems.find(i => i.id === activeId || i.symbol.toUpperCase() === activeId.toUpperCase());
    return found || allUnifiedItems[0];
  }, [allUnifiedItems, activeId]);

  const isPositive = activeItem.changePercent >= 0;
  const isWatchlisted = watchlist.includes(activeItem.id);

  // 52-week position calculation
  const rangeSpan = activeItem.high52w - activeItem.low52w;
  const currentRangePosition = rangeSpan > 0
    ? Math.max(0, Math.min(100, ((activeItem.priceOrNav - activeItem.low52w) / rangeSpan) * 100))
    : 50;

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-200">
      {/* Top Analytical Sub-Mode Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
        <div>
          <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-white">
            Analytical Intelligence & Comparative Research
          </h1>
          <p className="text-xs text-slate-400">
            Institutional technical charts, mathematical indicators, and normalized multi-asset relative strength.
          </p>
        </div>

        <div className="p-1 rounded-xl bg-black/60 border border-white/10 flex items-center self-start sm:self-auto">
          <button
            onClick={() => setSubMode('TECHNICAL')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono-code font-semibold transition ${
              subMode === 'TECHNICAL'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Technical Terminal
          </button>
          <button
            onClick={() => setSubMode('COMPARE')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono-code font-semibold transition ${
              subMode === 'COMPARE'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Comparative Asset Engine
          </button>
        </div>
      </div>

      {subMode === 'COMPARE' ? (
        <CompareWorkspace
          stocks={stocks}
          indices={indices}
          mutualFunds={mutualFunds}
          books={books}
          currency={currency}
          exchangeRate={exchangeRate}
          initialSelectedSymbols={compareSymbols}
        />
      ) : (
        <>
          {/* 1. DISCOVERY & SCREENER BAR */}
          <div className="p-5 rounded-2xl quantum-card space-y-4 border border-white/[0.08]">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Search Box */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search ticker, company name, AMFI scheme, AMC..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border border-white/[0.1] text-white text-xs focus:outline-none focus:border-sky-400 placeholder:text-slate-500 font-sans"
                />
              </div>

          {/* Filters: Type & Region */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Instrument Type Filters */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs">
              {(['ALL', 'EQUITY', 'MUTUAL_FUND', 'INDEX'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-3 py-1.5 rounded-lg transition font-medium ${
                    typeFilter === t
                      ? 'bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t === 'ALL'
                    ? 'All Types'
                    : t === 'EQUITY'
                    ? 'Equities'
                    : t === 'MUTUAL_FUND'
                    ? 'Mutual Funds'
                    : 'Indices'}
                </button>
              ))}
            </div>

            {/* Regional Filters */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs">
              <button
                onClick={() => setRegionFilter('ALL')}
                className={`px-2.5 py-1.5 rounded-lg transition ${
                  regionFilter === 'ALL' ? 'bg-white/[0.1] text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Global
              </button>
              <button
                onClick={() => setRegionFilter('IN')}
                className={`px-2.5 py-1.5 rounded-lg transition ${
                  regionFilter === 'IN' ? 'bg-orange-500/20 text-orange-300 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                India (NSE/BSE)
              </button>
              <button
                onClick={() => setRegionFilter('US')}
                className={`px-2.5 py-1.5 rounded-lg transition ${
                  regionFilter === 'US' ? 'bg-sky-500/20 text-sky-300 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                US (NYSE/NASDAQ)
              </button>
            </div>
          </div>
        </div>

        {/* Horizontally Scrollable Quick-Select Ticker Ribbon */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-2 border-t border-white/[0.06]">
          {filteredItems.map(item => {
            const isSelected = item.id === activeItem.id;
            const itemPos = item.changePercent >= 0;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveId(item.id);
                  playQuantumBeep(680, 0.03);
                }}
                className={`px-3 py-2 rounded-xl text-xs font-mono-code whitespace-nowrap transition flex items-center gap-2.5 ${
                  isSelected
                    ? 'bg-sky-500/20 border border-sky-500/40 text-white font-bold shadow-sm'
                    : 'bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] text-slate-300'
                }`}
              >
                <div className="text-left font-sans">
                  <div className="font-bold font-mono-code flex items-center gap-1.5">
                    <span>{item.symbol}</span>
                    <span className="text-[9px] text-slate-500 font-normal">{item.country}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate max-w-[110px]">{item.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold">{formatCurrency(item.priceOrNav, item.currency)}</div>
                  <div className={`text-[10px] ${itemPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {itemPos ? '+' : ''}{item.changePercent.toFixed(2)}%
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. ACTIVE INSTRUMENT PROFILE & FUNDAMENTAL GRID */}
      <div className="p-6 rounded-3xl quantum-card space-y-6 border border-white/[0.1]">
        {/* Title Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold font-heading text-white">
                {activeItem.name}
              </span>
              <span className="text-lg font-bold font-mono-code text-sky-400">
                ({activeItem.symbol})
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono-code font-bold ${
                  activeItem.type === 'MUTUAL_FUND'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    : activeItem.type === 'INDEX'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                }`}
              >
                {activeItem.type === 'MUTUAL_FUND' ? 'MUTUAL FUND (AMFI)' : activeItem.type}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono-code">
              <span>{activeItem.exchangeOrAmc}</span>
              <span className="text-slate-600">·</span>
              <span className="flex items-center gap-1 text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" /> Verified EOD Audit
              </span>
              <span className="text-slate-600">·</span>
              <span>Country: {activeItem.country === 'IN' ? 'India' : 'United States'}</span>
            </div>
          </div>

          {/* Right: Current Price / NAV and Action Buttons */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-2xl sm:text-3xl font-extrabold font-mono-code text-white">
                {formatCurrency(activeItem.priceOrNav, activeItem.currency)}
              </div>
              <div
                className={`text-xs font-mono-code font-bold flex items-center justify-end gap-1 ${
                  isPositive ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {isPositive ? '+' : ''}{activeItem.change >= 0 ? `+${activeItem.change.toFixed(2)}` : activeItem.change.toFixed(2)} ({isPositive ? '+' : ''}{activeItem.changePercent.toFixed(2)}%)
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onToggleWatchlist(activeItem.id)}
                className={`p-2.5 rounded-xl border transition ${
                  isWatchlisted
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                    : 'bg-white/[0.04] border-white/[0.08] text-slate-400 hover:text-white'
                }`}
                title={isWatchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}
              >
                <Star className={`w-4 h-4 ${isWatchlisted ? 'fill-amber-400' : ''}`} />
              </button>
              <button
                onClick={() => {
                  setCompareSymbols(prev => Array.from(new Set([activeItem.symbol, ...prev])));
                  setSubMode('COMPARE');
                  onSelectForCompare(activeItem.symbol);
                }}
                className="px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-sky-500/20 hover:border-sky-500/30 border border-white/[0.08] text-sky-300 text-xs font-semibold transition flex items-center gap-1.5"
                title="Send to Compare Workspace"
              >
                <Layers className="w-4 h-4" />
                <span>Compare</span>
              </button>
            </div>
          </div>
        </div>

        {/* Description snippet */}
        {activeItem.description && (
          <p className="text-xs text-slate-300 leading-relaxed border-t border-white/[0.06] pt-3">
            {activeItem.description}
          </p>
        )}

        {/* 6-Column Fundamental Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-3 border-t border-white/[0.06]">
          {/* 1. Market Cap / AUM */}
          <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06]">
            <div className="text-[10px] font-mono-code uppercase text-slate-400">
              {activeItem.type === 'MUTUAL_FUND' ? 'Fund AUM' : 'Market Cap'}
            </div>
            <div className="text-sm font-bold font-mono-code text-white mt-1">
              {activeItem.marketCapOrAum > 0
                ? formatMarketCap(activeItem.marketCapOrAum, activeItem.currency)
                : 'N/A (Index)'}
            </div>
          </div>

          {/* 2. Expense Ratio (for MFs) or P/E Ratio */}
          <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06]">
            <div className="text-[10px] font-mono-code uppercase text-slate-400">
              {activeItem.type === 'MUTUAL_FUND' ? 'Expense Ratio' : 'P/E Ratio'}
            </div>
            <div className="text-sm font-bold font-mono-code text-white mt-1">
              {activeItem.type === 'MUTUAL_FUND'
                ? `${activeItem.expenseRatio?.toFixed(2)}%`
                : activeItem.peRatio && activeItem.peRatio > 0
                ? activeItem.peRatio.toFixed(1)
                : 'N/A'}
            </div>
            <div className="text-[9px] text-slate-500 font-mono-code">
              {activeItem.lastAuditedDate ? `Audited: ${activeItem.lastAuditedDate}` : 'EOD Sourced'}
            </div>
          </div>

          {/* 3. Dividend Yield */}
          <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06]">
            <div className="text-[10px] font-mono-code uppercase text-slate-400">Dividend Yield</div>
            <div className="text-sm font-bold font-mono-code text-white mt-1">
              {activeItem.dividendYield !== undefined ? `${activeItem.dividendYield.toFixed(2)}%` : '0.00%'}
            </div>
            <div className="text-[9px] text-slate-500 font-mono-code">Trailing 12M</div>
          </div>

          {/* 4. Beta vs Benchmark */}
          <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06]">
            <div className="text-[10px] font-mono-code uppercase text-slate-400">Beta (β)</div>
            <div className="text-sm font-bold font-mono-code text-white mt-1">
              {activeItem.beta !== undefined ? activeItem.beta.toFixed(2) : '1.00'}
            </div>
            <div className="text-[9px] text-slate-500 font-mono-code">
              vs {activeItem.country === 'IN' ? 'NIFTY 50' : 'S&P 500'}
            </div>
          </div>

          {/* 5 & 6. 52-Week High/Low Range Slider Bar (Spans 2 columns) */}
          <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06] col-span-2 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-mono-code uppercase text-slate-400">
              <span>52-Week Range</span>
              <span className="text-slate-300 font-bold">{currentRangePosition.toFixed(0)}% of Range</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 relative overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full"
                style={{ width: `${currentRangePosition}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono-code text-slate-400 pt-0.5">
              <span>Low: {formatCurrency(activeItem.low52w, activeItem.currency)}</span>
              <span>High: {formatCurrency(activeItem.high52w, activeItem.currency)}</span>
            </div>
          </div>
        </div>

        {/* 3 & 4. TECHNICAL CHART CONTROLS & GRAPHICAL ANALYSIS VIEWS */}
        <div className="pt-2 border-t border-white/[0.06]">
          <TechnicalChart
            history={activeItem.history}
            symbol={activeItem.symbol}
            baseCurrency={activeItem.currency}
            displayCurrency={currency}
            exchangeRate={exchangeRate}
            height={440}
          />
        </div>
      </div>
    </>
  )}
</div>
);
};
