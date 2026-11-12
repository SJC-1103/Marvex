import React, { useState } from 'react';
import { Stock, Currency } from '../types/market';
import { PortfolioHolding } from '../types/portfolio';
import { formatCurrency, convertCurrency } from '../utils/currency';
import { X, Plus, Trash2, Briefcase } from 'lucide-react';
import { playCollapseSound, playQuantumBeep } from '../utils/audio';

interface PortfolioModalProps {
  allStocks: Stock[];
  holdings: PortfolioHolding[];
  onSaveHolding: (holding: Omit<PortfolioHolding, 'id' | 'addedAt'>) => void;
  onDeleteHolding: (holdingId: string) => void;
  onClose: () => void;
  currency: Currency;
  exchangeRate: number;
}

export const PortfolioModal: React.FC<PortfolioModalProps> = ({
  allStocks,
  holdings,
  onSaveHolding,
  onDeleteHolding,
  onClose,
  currency,
  exchangeRate,
}) => {
  const [selectedStockId, setSelectedStockId] = useState<string>(allStocks[0]?.id || '');
  const [sharesInput, setSharesInput] = useState<string>('10');
  const selectedStock = allStocks.find(s => s.id === selectedStockId) || allStocks[0];

  const [buyPriceInput, setBuyPriceInput] = useState<string>(
    selectedStock ? selectedStock.price.toFixed(2) : '100'
  );
  const [error, setError] = useState<string | null>(null);

  const handleStockChange = (stockId: string) => {
    setSelectedStockId(stockId);
    const stock = allStocks.find(s => s.id === stockId);
    if (stock) {
      setBuyPriceInput(stock.price.toFixed(2));
      setSharesInput(String(stock.lotSize && stock.lotSize > 1 ? stock.lotSize : 10));
    }
    setError(null);
  };

  const handleAddHolding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStock) return;

    const shares = parseFloat(sharesInput);
    const buyPrice = parseFloat(buyPriceInput);

    if (isNaN(shares) || shares <= 0) {
      setError('Please enter a valid positive quantity of shares.');
      return;
    }
    if (isNaN(buyPrice) || buyPrice <= 0) {
      setError('Please enter a valid average purchase price.');
      return;
    }

    onSaveHolding({
      assetType: 'EQUITY',
      symbolOrCode: selectedStock.symbol,
      name: selectedStock.name,
      exchangeOrAmc: selectedStock.exchange,
      quantityOrUnits: shares,
      averageCost: buyPrice,
      purchaseDate: new Date().toISOString().split('T')[0],
      stockId: selectedStock.id,
      symbol: selectedStock.symbol,
      shares,
      averageBuyPrice: buyPrice,
      currency: selectedStock.baseCurrency,
    });

    playCollapseSound();
    setError(null);
    setSharesInput('10');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-2xl my-auto rounded-3xl quantum-card border border-white/[0.1] p-6 space-y-6 shadow-2xl relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-emerald-400">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-heading text-white">
                Portfolio Holdings Manager
              </h2>
              <p className="text-xs text-slate-400">
                Configure positions and purchase costs to calculate real-time mark-to-market returns.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="overflow-y-auto space-y-6 flex-1 pr-1">
          {/* Add Position Form */}
          <form
            onSubmit={handleAddHolding}
            className="p-4 rounded-2xl bg-black/40 border border-white/[0.06] space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold font-heading uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Add Equity Position
              </h3>
              <span className="text-[11px] text-slate-400 font-mono-code">
                Base View Currency: <strong className="text-white">{currency}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {/* Select Stock */}
              <div className="sm:col-span-1">
                <label className="text-slate-300 font-medium block mb-1">Select Security</label>
                <select
                  value={selectedStock.id}
                  onChange={e => handleStockChange(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-black/60 border border-white/[0.08] text-white font-mono-code text-xs focus:outline-none focus:border-emerald-500"
                >
                  {allStocks.map(stock => (
                    <option key={stock.id} value={stock.id}>
                      {stock.symbol} ({stock.exchange})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity Shares */}
              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  Quantity (Shares)
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  value={sharesInput}
                  onChange={e => {
                    setSharesInput(e.target.value);
                    setError(null);
                  }}
                  className="w-full px-3 py-2.5 rounded-xl bg-black/60 border border-white/[0.08] font-mono-code text-white text-xs focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. 25"
                />
              </div>

              {/* Average Buy Price */}
              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  Cost Basis ({selectedStock.baseCurrency})
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  value={buyPriceInput}
                  onChange={e => {
                    setBuyPriceInput(e.target.value);
                    setError(null);
                  }}
                  className="w-full px-3 py-2.5 rounded-xl bg-black/60 border border-white/[0.08] font-mono-code text-white text-xs focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. 2900"
                />
              </div>
            </div>

            {/* Quick Helper presets for quantity */}
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] pt-1">
              <span className="text-slate-400">Quick Qty:</span>
              {[5, 10, 25, 50, 100].map(qty => (
                <button
                  key={qty}
                  type="button"
                  onClick={() => {
                    setSharesInput(String(qty));
                    playQuantumBeep(600, 0.03);
                  }}
                  className="px-2 py-0.5 rounded bg-white/[0.04] hover:bg-white/[0.08] font-mono-code text-slate-300"
                >
                  +{qty}
                </button>
              ))}
              {selectedStock.lotSize && selectedStock.lotSize > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    setSharesInput(String(selectedStock.lotSize));
                    playQuantumBeep(600, 0.03);
                  }}
                  className="px-2 py-0.5 rounded bg-white/[0.06] border border-white/[0.08] text-slate-300 font-mono-code"
                >
                  Lot ({selectedStock.lotSize})
                </button>
              )}
            </div>

            {error && <div className="text-rose-400 text-xs font-mono-code">{error}</div>}

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs tracking-wide uppercase transition flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" /> Add to Portfolio
              </button>
            </div>
          </form>

          {/* Current Portfolio Positions List */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold font-heading uppercase tracking-wider text-slate-300 flex items-center justify-between">
              <span>Active Portfolio Positions ({holdings.length})</span>
              <span className="text-[11px] font-normal text-slate-400">
                Mark-to-market values recalculate continuously
              </span>
            </h3>

            {holdings.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-black/30 border border-dashed border-white/[0.06] text-slate-400 text-xs space-y-2">
                <Briefcase className="w-8 h-8 text-slate-600 mx-auto" />
                <p>No equity positions stored.</p>
                <p className="text-[11px] text-slate-500">
                  Add stock symbols and quantities above to activate continuous mark-to-market analytics.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04] rounded-2xl bg-black/40 border border-white/[0.06] overflow-hidden">
                {holdings.map(h => {
                  const stock = allStocks.find(s => s.id === (h.stockId || h.symbolOrCode) || s.symbol === (h.symbol || h.symbolOrCode));
                  const shares = h.shares ?? h.quantityOrUnits ?? 0;
                  const avgPrice = h.averageBuyPrice ?? h.averageCost ?? 0;
                  const currentStockPrice = stock ? stock.price : avgPrice;
                  const sym = h.symbol || h.symbolOrCode || 'POS';
                  const currentTotalValue = convertCurrency(
                    shares * currentStockPrice,
                    h.currency,
                    currency,
                    exchangeRate
                  );
                  const investedValue = convertCurrency(
                    shares * avgPrice,
                    h.currency,
                    currency,
                    exchangeRate
                  );
                  const pnl = currentTotalValue - investedValue;
                  const pnlPercent = investedValue > 0 ? (pnl / investedValue) * 100 : 0;
                  const isPositive = pnl >= 0;

                  return (
                    <div
                      key={h.id}
                      className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02] transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center font-mono-code font-bold text-xs text-white">
                          {sym.slice(0, 3)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white font-mono-code text-sm">
                              {sym}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/[0.05] border border-white/[0.08] text-slate-300 font-mono-code">
                              {shares} {shares === 1 ? 'Share' : 'Shares'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono-code">
                            Avg Cost: {formatCurrency(avgPrice, currency, h.currency, exchangeRate)} · Live: {formatCurrency(currentStockPrice, currency, h.currency, exchangeRate)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4">
                        <div className="text-left sm:text-right font-mono-code">
                          <div className="font-bold text-white text-sm">
                            {formatCurrency(currentTotalValue, currency)}
                          </div>
                          <div
                            className={`text-[11px] font-bold ${
                              isPositive ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {isPositive ? '+' : ''}{formatCurrency(pnl, currency)} ({isPositive ? '+' : ''}{pnlPercent.toFixed(1)}%)
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            onDeleteHolding(h.id);
                            playQuantumBeep(450, 0.04);
                          }}
                          className="p-1.5 rounded-lg border border-white/[0.08] hover:border-rose-500/40 text-slate-400 hover:text-rose-400 transition"
                          title="Remove position from portfolio"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/[0.08] pt-3 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-mono-code">
            Total Holdings: <strong className="text-white">{holdings.length}</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.1] text-white font-medium transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
