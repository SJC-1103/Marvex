import React, { useState } from 'react';
import { Currency, Stock } from '../../types/market';
import { MutualFundScheme } from '../../types/mutualFund';
import { PortfolioBook, PortfolioHolding, BookValuationSummary } from '../../types/portfolio';
import { formatCurrency } from '../../utils/currency';
import { NewBookModal } from '../modals/NewBookModal';
import { CashBalanceModal } from '../modals/CashBalanceModal';
import { AddPositionModal } from '../modals/AddPositionModal';
import { CsvImportModal } from '../modals/CsvImportModal';
import {
  Briefcase,
  Plus,
  DollarSign,
  FileSpreadsheet,
  Trash2,
  TrendingUp,
  TrendingDown,
  Layers,
  Sparkles,
  PieChart,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { playQuantumBeep, playCollapseSound } from '../../utils/audio';

interface PortfolioWorkspaceProps {
  books: PortfolioBook[];
  activeBookId: string;
  onSelectBook: (bookId: string) => void;
  onCreateBook: (name: string, description?: string, baseCurrency?: Currency) => void;
  onUpdateCashBalance: (bookId: string, amount: number) => void;
  onAddHolding: (bookId: string, holding: Omit<PortfolioHolding, 'id'>) => void;
  onAddMultipleHoldings: (bookId: string, holdings: Omit<PortfolioHolding, 'id'>[]) => void;
  onDeleteHolding: (bookId: string, holdingId: string) => void;
  summary: BookValuationSummary;
  currency: Currency;
  exchangeRate: number;
  availableStocks: Stock[];
  availableMutualFunds: MutualFundScheme[];
  onSelectPositionForCompare: (symbol: string) => void;
}

export const PortfolioWorkspace: React.FC<PortfolioWorkspaceProps> = ({
  books,
  activeBookId,
  onSelectBook,
  onCreateBook,
  onUpdateCashBalance,
  onAddHolding,
  onAddMultipleHoldings,
  onDeleteHolding,
  summary,
  currency,
  exchangeRate,
  availableStocks,
  availableMutualFunds,
  onSelectPositionForCompare,
}) => {
  const [isNewBookOpen, setIsNewBookOpen] = useState(false);
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [isAddPosOpen, setIsAddPosOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [assetFilter, setAssetFilter] = useState<'ALL' | 'EQUITY' | 'MUTUAL_FUND'>('ALL');

  const activeBook = books.find(b => b.id === activeBookId) || books[0];

  // Filter holdings
  const filteredCalculatedHoldings = summary.calculatedHoldings.filter(ch => {
    if (assetFilter === 'ALL') return true;
    return ch.holding.assetType === assetFilter;
  });

  return (
    <div className="w-full space-y-6 animate-fade-up">
      {/* 1. BOOK SELECTOR & ACTION BAR */}
      <div className="p-5 sm:p-6 rounded-2xl quantum-card space-y-4 border border-white/[0.08]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sky-400 text-xs font-mono-code uppercase tracking-wider mb-1">
              <Briefcase className="w-3.5 h-3.5" /> Multi-Book Ledger Management
            </div>
            <h2 className="text-2xl font-bold font-heading text-white">
              Portfolio Position Ledger
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">
              Maintain separate investment books with granular trade records, cash reserves, and cross-market conversions.
            </p>
          </div>

          {/* Action Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsNewBookOpen(true)}
              className="px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-white text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 text-sky-400" />
              <span>New Book</span>
            </button>

            <button
              onClick={() => setIsCashModalOpen(true)}
              className="px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
            >
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cash Balance ({formatCurrency(activeBook?.cashBalance || 0, activeBook?.baseCurrency || 'INR')})</span>
            </button>

            <button
              onClick={() => setIsCsvModalOpen(true)}
              className="px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400" />
              <span>Import CSV</span>
            </button>

            <button
              onClick={() => setIsAddPosOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Position</span>
            </button>
          </div>
        </div>

        {/* Horizontal Tab Selector Listing All User-Created Portfolio Books */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-2 border-t border-white/[0.06]">
          {books.map(b => {
            const isSelected = b.id === activeBookId;
            return (
              <button
                key={b.id}
                onClick={() => {
                  onSelectBook(b.id);
                  playQuantumBeep(640, 0.03);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-sans whitespace-nowrap transition flex items-center gap-2 ${
                  isSelected
                    ? 'bg-sky-500/20 border border-sky-500/40 text-sky-300 font-bold shadow-sm'
                    : 'bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-slate-400'
                }`}
              >
                <Briefcase className={`w-3.5 h-3.5 ${isSelected ? 'text-sky-400' : 'text-slate-500'}`} />
                <span>{b.name}</span>
                <span className="text-[10px] font-mono-code px-1.5 py-0.2 rounded bg-black/40 text-slate-400">
                  {b.holdings.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. FINANCIAL SUMMARY BANNER (4-COLUMN METRIC GRID) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Cost Basis */}
        <div className="p-4 rounded-2xl quantum-card border border-white/[0.08]">
          <div className="text-[11px] font-mono-code uppercase text-slate-400">Total Cost Basis</div>
          <div className="text-xl sm:text-2xl font-bold font-mono-code text-white mt-1">
            {formatCurrency(summary.totalInvestedCost, currency)}
          </div>
          <div className="text-[11px] text-slate-500 font-mono-code mt-0.5">
            Initial capital deployed
          </div>
        </div>

        {/* Current Market Value */}
        <div className="p-4 rounded-2xl quantum-card border border-white/[0.08]">
          <div className="text-[11px] font-mono-code uppercase text-slate-400">Current Market Value</div>
          <div className="text-xl sm:text-2xl font-bold font-mono-code text-white mt-1">
            {formatCurrency(summary.totalMarketValue, currency)}
          </div>
          <div className="text-[11px] text-slate-500 font-mono-code mt-0.5">
            Holdings value (excl. cash)
          </div>
        </div>

        {/* Total Unrealized P&L */}
        <div className="p-4 rounded-2xl quantum-card border border-white/[0.08]">
          <div className="text-[11px] font-mono-code uppercase text-slate-400">Total Unrealized P&L</div>
          <div
            className={`text-xl sm:text-2xl font-bold font-mono-code mt-1 ${
              summary.totalUnrealizedGain >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {summary.totalUnrealizedGain >= 0 ? '+' : ''}
            {formatCurrency(summary.totalUnrealizedGain, currency)}
          </div>
          <div className="text-[11px] text-slate-500 font-mono-code mt-0.5">
            Market value minus cost
          </div>
        </div>

        {/* Total Return % */}
        <div className="p-4 rounded-2xl quantum-card border border-white/[0.08]">
          <div className="text-[11px] font-mono-code uppercase text-slate-400">Total Return %</div>
          <div
            className={`text-xl sm:text-2xl font-bold font-mono-code mt-1 flex items-center gap-1.5 ${
              summary.totalUnrealizedGainPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {summary.totalUnrealizedGainPercent >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {summary.totalUnrealizedGainPercent >= 0 ? '+' : ''}
            {summary.totalUnrealizedGainPercent.toFixed(2)}%
          </div>
          <div className="text-[11px] text-slate-500 font-mono-code mt-0.5">
            Unrealized gain / cost
          </div>
        </div>
      </div>

      {/* 3. POSITIONS LEDGER TABLE */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold font-heading text-white">
              Ledger Positions ({filteredCalculatedHoldings.length})
            </h3>
            <p className="text-xs text-slate-400">
              Direct equities and mutual funds tracked in active currency ({currency})
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs">
            <button
              onClick={() => setAssetFilter('ALL')}
              className={`px-3 py-1 rounded-lg transition ${
                assetFilter === 'ALL' ? 'bg-sky-500/20 text-sky-300 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Assets
            </button>
            <button
              onClick={() => setAssetFilter('EQUITY')}
              className={`px-3 py-1 rounded-lg transition ${
                assetFilter === 'EQUITY' ? 'bg-sky-500/20 text-sky-300 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Equities Only
            </button>
            <button
              onClick={() => setAssetFilter('MUTUAL_FUND')}
              className={`px-3 py-1 rounded-lg transition ${
                assetFilter === 'MUTUAL_FUND' ? 'bg-indigo-500/20 text-indigo-300 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Mutual Funds
            </button>
          </div>
        </div>

        <div className="rounded-2xl quantum-card overflow-hidden border border-white/[0.08]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-black/50 text-slate-400 font-mono-code uppercase text-[10px] tracking-wider border-b border-white/[0.08]">
                <tr>
                  <th className="py-3 px-4">Symbol / Scheme</th>
                  <th className="py-3 px-3">Asset Class</th>
                  <th className="py-3 px-3 text-right">Units / Shares</th>
                  <th className="py-3 px-3 text-right">Avg Purchase Price</th>
                  <th className="py-3 px-3 text-right">Current Price</th>
                  <th className="py-3 px-3 text-right">Invested Cost Basis</th>
                  <th className="py-3 px-3 text-right">Current Valuation</th>
                  <th className="py-3 px-3 text-right">Unrealized Gain / Loss</th>
                  <th className="py-3 px-3 text-right">Weight %</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredCalculatedHoldings.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-10 text-center text-slate-500 font-mono-code">
                      No positions recorded. Click "Add Position" or "Import CSV" above to populate your ledger.
                    </td>
                  </tr>
                ) : (
                  filteredCalculatedHoldings.map(item => {
                    const isPositive = item.unrealizedGain >= 0;
                    return (
                      <tr key={item.holding.id} className="hover:bg-white/[0.02] transition">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white font-sans">{item.holding.name}</div>
                          <div className="text-[10px] font-mono-code text-slate-400">
                            {item.holding.symbolOrCode} · {item.holding.exchangeOrAmc} · Bought: {item.holding.purchaseDate}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono-code font-bold ${
                              item.holding.assetType === 'EQUITY'
                                ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                                : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                            }`}
                          >
                            {item.holding.assetType === 'EQUITY' ? 'EQUITY' : 'MUTUAL FUND'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono-code text-slate-200">
                          {item.holding.quantityOrUnits}
                        </td>
                        <td className="py-3 px-3 text-right font-mono-code text-slate-400">
                          {formatCurrency(item.holding.averageCost, item.holding.currency)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono-code text-white font-medium">
                          {formatCurrency(item.currentPrice, currency)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono-code text-slate-300">
                          {formatCurrency(item.costBasis, currency)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono-code text-white font-bold">
                          {formatCurrency(item.currentValue, currency)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono-code">
                          <div className={`font-semibold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isPositive ? '+' : ''}{formatCurrency(item.unrealizedGain, currency)}
                          </div>
                          <div className={`text-[10px] ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isPositive ? '+' : ''}{item.unrealizedGainPercent.toFixed(2)}%
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono-code text-slate-300 font-medium">
                          {item.weightPercent.toFixed(1)}%
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                onSelectPositionForCompare(item.holding.symbolOrCode);
                                playQuantumBeep(640, 0.03);
                              }}
                              className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-sky-500/20 hover:text-sky-300 text-slate-400 border border-white/[0.06] transition"
                              title="Compare Asset"
                            >
                              <Layers className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                onDeleteHolding(activeBookId, item.holding.id);
                                playCollapseSound();
                              }}
                              className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 border border-white/[0.06] transition"
                              title="Remove Position from Ledger"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 4. MODALS & DATA WORKFLOWS */}
      {isNewBookOpen && (
        <NewBookModal
          isOpen={isNewBookOpen}
          onClose={() => setIsNewBookOpen(false)}
          onCreateBook={onCreateBook}
        />
      )}

      {isCashModalOpen && (
        <CashBalanceModal
          isOpen={isCashModalOpen}
          onClose={() => setIsCashModalOpen(false)}
          currentCash={activeBook?.cashBalance || 0}
          bookCurrency={activeBook?.baseCurrency || 'INR'}
          onUpdateCash={amount => onUpdateCashBalance(activeBookId, amount)}
        />
      )}

      {isAddPosOpen && (
        <AddPositionModal
          isOpen={isAddPosOpen}
          onClose={() => setIsAddPosOpen(false)}
          onAddHolding={h => onAddHolding(activeBookId, h)}
          bookCurrency={activeBook?.baseCurrency || 'INR'}
          availableStocks={availableStocks}
          availableMutualFunds={availableMutualFunds}
        />
      )}

      {isCsvModalOpen && (
        <CsvImportModal
          isOpen={isCsvModalOpen}
          onClose={() => setIsCsvModalOpen(false)}
          onImportHoldings={holdings => onAddMultipleHoldings(activeBookId, holdings)}
          existingHoldings={activeBook?.holdings || []}
        />
      )}
    </div>
  );
};
