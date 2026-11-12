import React, { useState } from 'react';
import { Stock, MarketIndex } from '../../types/market';
import { MutualFundScheme } from '../../types/mutualFund';
import { PortfolioBook } from '../../types/portfolio';
import { formatCurrency } from '../../utils/currency';
import { X, Search, Layers, Briefcase, TrendingUp } from 'lucide-react';
import { playQuantumBeep } from '../../utils/audio';

export interface CompareTarget {
  id: string;
  type: 'EQUITY' | 'MUTUAL_FUND' | 'INDEX' | 'PORTFOLIO';
  symbol: string;
  name: string;
  subtitle: string;
  color: string;
}

interface AddCompareAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTarget: (target: CompareTarget) => void;
  selectedIds: string[];
  stocks: Stock[];
  indices: MarketIndex[];
  mutualFunds: MutualFundScheme[];
  books: PortfolioBook[];
  palette: string[];
}

export const AddCompareAssetModal: React.FC<AddCompareAssetModalProps> = ({
  isOpen,
  onClose,
  onSelectTarget,
  selectedIds,
  stocks,
  indices,
  mutualFunds,
  books,
  palette,
}) => {
  const [tab, setTab] = useState<'ALL' | 'EQUITY' | 'MUTUAL_FUND' | 'INDEX' | 'PORTFOLIO'>('ALL');
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const nextColor = palette[selectedIds.length % palette.length];

  // Build unified search list
  const allTargets: CompareTarget[] = [
    // 1. Portfolios
    ...books.map(b => ({
      id: `portfolio-${b.id}`,
      type: 'PORTFOLIO' as const,
      symbol: b.name.toUpperCase().replace(/\s+/g, '-').slice(0, 10),
      name: b.name,
      subtitle: `User Portfolio (${b.holdings.length} positions)`,
      color: nextColor,
    })),
    // 2. Indices
    ...indices.map(idx => ({
      id: idx.id,
      type: 'INDEX' as const,
      symbol: idx.symbol,
      name: idx.name,
      subtitle: `Benchmark Index · ${idx.country}`,
      color: nextColor,
    })),
    // 3. Mutual Funds
    ...mutualFunds.map(mf => ({
      id: mf.id,
      type: 'MUTUAL_FUND' as const,
      symbol: mf.symbol,
      name: mf.name,
      subtitle: `AMFI: ${mf.schemeCode} · ${mf.category}`,
      color: nextColor,
    })),
    // 4. Stocks
    ...stocks.map(s => ({
      id: s.id,
      type: 'EQUITY' as const,
      symbol: s.symbol,
      name: s.name,
      subtitle: `${s.exchange} · ${s.sector}`,
      color: nextColor,
    })),
  ];

  const filtered = allTargets.filter(t => {
    if (selectedIds.includes(t.id)) return false;
    if (tab !== 'ALL' && t.type !== tab) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return t.symbol.toLowerCase().includes(q) || t.name.toLowerCase().includes(q) || t.subtitle.toLowerCase().includes(q);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="quantum-card p-6 rounded-2xl max-w-xl w-full border border-white/[0.12] space-y-4 animate-in zoom-in-95 duration-150 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 shrink-0">
          <div className="flex items-center gap-2 text-sky-400">
            <Layers className="w-5 h-5" />
            <h3 className="text-base font-bold font-heading text-white">Add Instrument to Comparison</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Filter */}
        <div className="grid grid-cols-5 gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs shrink-0">
          {(['ALL', 'EQUITY', 'MUTUAL_FUND', 'INDEX', 'PORTFOLIO'] as const).map(item => (
            <button
              key={item}
              onClick={() => setTab(item)}
              className={`py-1.5 rounded-lg font-medium transition text-center truncate ${
                tab === item ? 'bg-sky-500/20 text-sky-300 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              {item === 'ALL'
                ? 'All'
                : item === 'EQUITY'
                ? 'Stocks'
                : item === 'MUTUAL_FUND'
                ? 'Mutual Funds'
                : item === 'INDEX'
                ? 'Indices'
                : 'Portfolios'}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative shrink-0">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by symbol, name, index, AMC..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/40 border border-white/[0.1] text-white text-xs focus:outline-none focus:border-sky-400"
            autoFocus
          />
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No matching unselected securities or portfolios found.
            </div>
          ) : (
            filtered.map(t => (
              <div
                key={t.id}
                onClick={() => {
                  onSelectTarget(t);
                  playQuantumBeep(720, 0.04);
                  onClose();
                }}
                className="flex items-center justify-between p-3 rounded-xl bg-black/40 hover:bg-white/[0.06] border border-white/[0.06] hover:border-sky-500/30 cursor-pointer transition"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs font-mono-code">{t.symbol}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-mono-code font-bold ${
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
                  </div>
                  <div className="text-xs text-slate-300 font-sans mt-0.5">{t.name}</div>
                  <div className="text-[10px] text-slate-500 font-mono-code">{t.subtitle}</div>
                </div>

                <button className="px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-semibold">
                  + Add
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
