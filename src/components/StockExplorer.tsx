import React, { useState, useMemo } from 'react';
import { Stock, Exchange, Country, Sector, Currency } from '../types/market';
import { formatCurrency, formatMarketCap, formatVolume } from '../utils/currency';
import { Search, Star, Layers, ArrowUpRight, ArrowDownRight, LayoutGrid, List, SlidersHorizontal, Compass } from 'lucide-react';
import { playQuantumBeep } from '../utils/audio';

interface StockExplorerProps {
  stocks: Stock[];
  watchlist: string[];
  onToggleWatchlist: (stockId: string) => void;
  comparedStockIds: string[];
  onToggleCompare: (stockId: string) => void;
  onSelectStock: (stock: Stock) => void;
  currency: Currency;
  exchangeRate: number;
}

type SortField = 'marketCap' | 'changePercent' | 'price' | 'volume' | 'quantumScore';
type SortOrder = 'desc' | 'asc';

export const StockExplorer: React.FC<StockExplorerProps> = ({
  stocks,
  watchlist,
  onToggleWatchlist,
  comparedStockIds,
  onToggleCompare,
  onSelectStock,
  currency,
  exchangeRate,
}) => {
  const [search, setSearch] = useState<string>('');
  const [selectedExchange, setSelectedExchange] = useState<string>('ALL');
  const [selectedCountry, setSelectedCountry] = useState<string>('ALL');
  const [selectedSector, setSelectedSector] = useState<string>('ALL');
  const [sortField, setSortField] = useState<SortField>('marketCap');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Filter & Sort Logic
  const filteredStocks = useMemo(() => {
    return stocks
      .filter(stock => {
        const matchSearch =
          stock.symbol.toLowerCase().includes(search.toLowerCase()) ||
          stock.name.toLowerCase().includes(search.toLowerCase());

        const matchExchange =
          selectedExchange === 'ALL' || stock.exchange === selectedExchange;

        const matchCountry =
          selectedCountry === 'ALL' || stock.country === selectedCountry;

        const matchSector =
          selectedSector === 'ALL' || stock.sector === selectedSector;

        return matchSearch && matchExchange && matchCountry && matchSector;
      })
      .sort((a, b) => {
        const getSortVal = (s: Stock): number => {
          if (sortField === 'quantumScore') return s.quantumScore ?? Math.min(96, Math.max(45, Math.round(65 + s.changePercent * 4)));
          if (sortField === 'price' || sortField === 'marketCap') {
            const raw = (s[sortField] as number) || 0;
            return s.baseCurrency === 'USD' ? raw * (exchangeRate || 86.85) : raw;
          }
          return (s[sortField] as number) || 0;
        };

        const valA = getSortVal(a);
        const valB = getSortVal(b);

        if (sortOrder === 'asc') {
          return valA > valB ? 1 : -1;
        } else {
          return valA < valB ? 1 : -1;
        }
      });
  }, [stocks, search, selectedExchange, selectedCountry, selectedSector, sortField, sortOrder, exchangeRate]);

  const exchanges: ('ALL' | Exchange)[] = ['ALL', 'NSE', 'BSE', 'NYSE', 'NASDAQ'];
  const sectors = [
    'ALL',
    'Technology',
    'Banking & Finance',
    'Energy & Power',
    'Automotive',
    'Quantum & DeepTech',
    'Telecommunications',
    'Consumer & Retail',
  ];

  return (
    <div className="w-full space-y-6">
      {/* Header and Filter Toolbar */}
      <div className="p-5 sm:p-6 rounded-2xl quantum-card space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sky-400 text-xs font-mono-code uppercase tracking-wider mb-1">
              <Compass className="w-3.5 h-3.5" /> Multi-Market Scanner
            </div>
            <h2 className="text-2xl font-bold font-heading text-white">
              Securities Universe Scanner
            </h2>
            <p className="text-slate-400 text-sm mt-0.5">
              Screen equities across NSE & BSE (India) and NYSE & Nasdaq (US) with live order depth and lot sizes.
            </p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/[0.08]">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition ${
                  viewMode === 'grid' ? 'bg-white/[0.1] text-white border border-white/[0.1]' : 'text-slate-400 hover:text-white'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg transition ${
                  viewMode === 'table' ? 'bg-white/[0.1] text-white border border-white/[0.1]' : 'text-slate-400 hover:text-white'
                }`}
                title="Dense Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar & Country Switcher */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search symbol, company or sector (e.g. RELIANCE, NVDA, IONQ)..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/50 border border-white/[0.08] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono-code"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-3 text-xs text-slate-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Country Tabs */}
          <div className="md:col-span-3 flex bg-black/40 p-1 rounded-xl border border-white/[0.08] text-xs font-semibold">
            {[
              { id: 'ALL', label: 'All Regions' },
              { id: 'IN', label: 'India' },
              { id: 'US', label: 'USA' },
            ].map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedCountry(c.id)}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  selectedCountry === c.id
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="md:col-span-3 flex items-center gap-2">
            <select
              value={`${sortField}-${sortOrder}`}
              onChange={e => {
                const [f, o] = e.target.value.split('-') as [SortField, SortOrder];
                setSortField(f);
                setSortOrder(o);
              }}
              className="w-full px-3 py-2.5 rounded-xl bg-black/50 border border-white/[0.08] text-xs font-mono-code text-slate-200 focus:outline-none focus:border-sky-500"
            >
              <option value="marketCap-desc">Market Cap (High to Low)</option>
              <option value="changePercent-desc">24h Gainers (Top)</option>
              <option value="changePercent-asc">24h Losers (Top)</option>
              <option value="quantumScore-desc">Quant Momentum (Highest)</option>
              <option value="volume-desc">24h Volume (Most Active)</option>
              <option value="price-desc">Price (High to Low)</option>
              <option value="price-asc">Price (Low to High)</option>
            </select>
          </div>
        </div>

        {/* Exchange Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/[0.06]">
          <span className="text-xs font-mono-code text-slate-500 mr-1 flex items-center gap-1">
            <SlidersHorizontal className="w-3 h-3" /> Exchange:
          </span>
          {exchanges.map(ex => (
            <button
              key={ex}
              onClick={() => setSelectedExchange(ex)}
              className={`px-3 py-1 rounded-lg text-xs font-mono-code font-semibold transition ${
                selectedExchange === ex
                  ? 'bg-white/[0.1] text-white border border-white/[0.12] shadow-sm'
                  : 'bg-black/30 text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              }`}
            >
              {ex === 'ALL' ? 'All Exchanges' : ex}
            </button>
          ))}

          {/* Sector Dropdown */}
          <div className="ml-auto">
            <select
              value={selectedSector}
              onChange={e => setSelectedSector(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-black/40 border border-white/[0.08] text-xs text-slate-300 font-mono-code"
            >
              {sectors.map(sec => (
                <option key={sec} value={sec}>
                  {sec === 'ALL' ? 'All Sectors' : sec}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Count & Badges */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>
          Showing <span className="font-mono-code text-white font-bold">{filteredStocks.length}</span> listed securities
        </span>
        <span className="font-mono-code text-slate-500">
          Click any card to open Candlestick Chart & Order Ladder
        </span>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredStocks.map(stock => {
            const isSaved = watchlist.includes(stock.id);
            const isCompared = comparedStockIds.includes(stock.id);
            const isPositive = stock.changePercent >= 0;

            return (
              <div
                key={stock.id}
                onClick={() => onSelectStock(stock)}
                className="quantum-card quantum-card-hover p-4 sm:p-5 rounded-2xl flex flex-col justify-between cursor-pointer group relative"
              >
                {/* Card Top: Symbol, Exchange & Actions */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center font-mono-code font-bold text-white text-xs group-hover:border-sky-500/50 transition">
                        {stock.symbol.slice(0, 3)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white font-mono-code text-base group-hover:text-sky-300 transition">
                            {stock.symbol}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/[0.05] border border-white/[0.08] text-slate-300 font-mono-code">
                            {stock.exchange}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[140px] mt-0.5">
                          {stock.name}
                        </div>
                      </div>
                    </div>

                    {/* Compare & Star */}
                    <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => {
                          onToggleCompare(stock.id);
                          playQuantumBeep(600, 0.04);
                        }}
                        title={isCompared ? 'Remove from Compare' : 'Add to Compare'}
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
                        title={isSaved ? 'Remove from Watchlist' : 'Add to Watchlist'}
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

                  {/* Price & Change Banner */}
                  <div className="mt-3 flex items-baseline justify-between">
                    <div>
                      <div className="text-xl font-bold font-mono-code text-white">
                        {formatCurrency(stock.price, currency, stock.baseCurrency, exchangeRate)}
                      </div>
                      {currency !== stock.baseCurrency && (
                        <div className="text-[10px] text-slate-500 font-mono-code">
                          Native: {formatCurrency(stock.price, stock.baseCurrency, stock.baseCurrency)}
                        </div>
                      )}
                    </div>

                    <div
                      className={`flex items-center gap-0.5 px-2 py-0.5 rounded-md text-xs font-mono-code font-bold ${
                        isPositive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                      }`}
                    >
                      {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                      {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
                    </div>
                  </div>
                </div>

                {/* Card Bottom Meta (Lot size, Sector, Momentum) */}
                <div className="mt-4 pt-3 border-t border-white/[0.06] space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Lot Size:</span>
                    <span className="font-mono-code text-slate-200 font-semibold">
                      {stock.lotSize || 1} {(stock.lotSize || 1) === 1 ? 'Share' : 'Shares'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-400">
                    <span>Market Cap:</span>
                    <span className="font-mono-code text-slate-200">
                      {formatMarketCap(stock.marketCap, currency, stock.baseCurrency, exchangeRate)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] px-2 py-0.5 rounded bg-black/40 text-slate-400 border border-white/[0.06]">
                      {stock.sector}
                    </span>
                    <span className="font-mono-code text-sky-300 text-xs font-semibold">
                      Momentum {stock.quantumScore ?? Math.min(96, Math.max(45, Math.round(65 + stock.changePercent * 4)))}/100
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="rounded-2xl quantum-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.08] bg-white/[0.02] text-[11px] font-mono-code uppercase text-slate-400">
                  <th className="p-3.5 w-10"></th>
                  <th className="p-3.5">Symbol / Security</th>
                  <th className="p-3.5">Exchange</th>
                  <th className="p-3.5 text-right">Price ({currency})</th>
                  <th className="p-3.5 text-right">24h Change</th>
                  <th className="p-3.5 text-right">Bid / Ask</th>
                  <th className="p-3.5 text-center">Lot Size</th>
                  <th className="p-3.5 text-right">Market Cap</th>
                  <th className="p-3.5 text-center">Momentum</th>
                  <th className="p-3.5 text-center">Compare</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-xs">
                {filteredStocks.map(stock => {
                  const isSaved = watchlist.includes(stock.id);
                  const isCompared = comparedStockIds.includes(stock.id);
                  const isPositive = stock.changePercent >= 0;

                  return (
                    <tr
                      key={stock.id}
                      onClick={() => onSelectStock(stock)}
                      className="hover:bg-white/[0.03] cursor-pointer transition"
                    >
                      <td className="p-3.5 text-center" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            onToggleWatchlist(stock.id);
                            playQuantumBeep(800, 0.04);
                          }}
                          className="text-slate-500 hover:text-amber-400"
                        >
                          <Star className={`w-4 h-4 ${isSaved ? 'fill-amber-400 text-amber-400' : ''}`} />
                        </button>
                      </td>

                      <td className="p-3.5">
                        <div className="font-mono-code font-bold text-white text-sm">{stock.symbol}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[160px]">{stock.name}</div>
                      </td>

                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded bg-white/[0.05] text-sky-300 font-mono-code text-[11px] font-semibold border border-white/[0.08]">
                          {stock.exchange}
                        </span>
                      </td>

                      <td className="p-3.5 text-right font-mono-code font-bold text-white">
                        {formatCurrency(stock.price, currency, stock.baseCurrency, exchangeRate)}
                      </td>

                      <td className="p-3.5 text-right font-mono-code font-bold">
                        <span
                          className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded ${
                            isPositive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                          }`}
                        >
                          {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
                        </span>
                      </td>

                      <td className="p-3.5 text-right font-mono-code text-[11px]">
                        <span className="text-emerald-400">{formatCurrency(stock.bid ?? Number((stock.price * 0.9995).toFixed(2)), currency, stock.baseCurrency, exchangeRate)}</span> /{' '}
                        <span className="text-rose-400">{formatCurrency(stock.ask ?? Number((stock.price * 1.0005).toFixed(2)), currency, stock.baseCurrency, exchangeRate)}</span>
                      </td>

                      <td className="p-3.5 text-center font-mono-code font-semibold text-slate-200">
                        {stock.lotSize || 1}
                      </td>

                      <td className="p-3.5 text-right font-mono-code text-slate-300">
                        {formatMarketCap(stock.marketCap, currency, stock.baseCurrency, exchangeRate)}
                      </td>

                      <td className="p-3.5 text-center font-mono-code text-sky-300 font-bold">
                        {stock.quantumScore ?? Math.min(96, Math.max(45, Math.round(65 + stock.changePercent * 4)))}
                      </td>

                      <td className="p-3.5 text-center" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            onToggleCompare(stock.id);
                            playQuantumBeep(600, 0.04);
                          }}
                          className={`p-1.5 rounded-lg border text-xs transition ${
                            isCompared
                              ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                              : 'border-white/[0.08] text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          <Layers className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
