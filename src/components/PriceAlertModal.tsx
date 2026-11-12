import React, { useState } from 'react';
import { Stock, Currency } from '../types/market';
import { PriceAlert } from '../types/alert';
import { formatCurrency, convertCurrency } from '../utils/currency';
import { Bell, X, ArrowUpRight, ArrowDownRight, AlertCircle } from 'lucide-react';
import { playQuantumBeep } from '../utils/audio';

interface PriceAlertModalProps {
  watchlistStocks: Stock[];
  preselectedStock?: Stock | null;
  onClose: () => void;
  onSaveAlert: (alert: Omit<PriceAlert, 'id' | 'createdAt' | 'triggered'>) => void;
  currency: Currency;
  exchangeRate: number;
}

export const PriceAlertModal: React.FC<PriceAlertModalProps> = ({
  watchlistStocks,
  preselectedStock,
  onClose,
  onSaveAlert,
  currency,
  exchangeRate,
}) => {
  const initialStock = preselectedStock || watchlistStocks[0];
  const [selectedStockId, setSelectedStockId] = useState<string>(initialStock ? initialStock.id : '');
  const activeStock = watchlistStocks.find(s => s.id === selectedStockId) || initialStock;

  const currentConvertedPrice = activeStock
    ? convertCurrency(activeStock.price, activeStock.baseCurrency, currency, exchangeRate)
    : 0;

  const [condition, setCondition] = useState<'ABOVE' | 'BELOW'>('ABOVE');
  const [targetPrice, setTargetPrice] = useState<string>(
    currentConvertedPrice ? (currentConvertedPrice * 1.01).toFixed(2) : ''
  );
  const [error, setError] = useState<string | null>(null);

  const handleStockChange = (newStockId: string) => {
    setSelectedStockId(newStockId);
    const stock = watchlistStocks.find(s => s.id === newStockId);
    if (stock) {
      const price = convertCurrency(stock.price, stock.baseCurrency, currency, exchangeRate);
      const defaultTarget = condition === 'ABOVE' ? price * 1.01 : price * 0.99;
      setTargetPrice(defaultTarget.toFixed(2));
    }
  };

  const handleApplyPreset = (pct: number) => {
    if (!currentConvertedPrice) return;
    const newTarget = currentConvertedPrice * (1 + pct / 100);
    setCondition(pct >= 0 ? 'ABOVE' : 'BELOW');
    setTargetPrice(newTarget.toFixed(2));
    playQuantumBeep(680, 0.04);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStock) {
      setError('Please select a stock from your watchlist.');
      return;
    }
    const numTarget = parseFloat(targetPrice);
    if (isNaN(numTarget) || numTarget <= 0) {
      setError('Please enter a valid positive target price.');
      return;
    }

    onSaveAlert({
      assetType: 'EQUITY',
      symbolOrCode: activeStock.symbol,
      name: activeStock.name,
      stockId: activeStock.id,
      symbol: activeStock.symbol,
      targetPrice: numTarget,
      condition,
      currency,
      initialPrice: currentConvertedPrice,
    });
    playQuantumBeep(880, 0.08);
    onClose();
  };

  if (!activeStock) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <div className="quantum-card p-6 rounded-2xl max-w-md w-full border border-white/[0.1] text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
          <h3 className="text-base font-semibold text-white">No Securities in Watchlist</h3>
          <p className="text-xs text-slate-400">
            Please add at least one equity to your watchlist before configuring threshold alerts.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.1] text-white font-medium text-xs"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-lg rounded-3xl quantum-card border border-white/[0.1] p-6 space-y-5 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-amber-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-heading text-white">Set Price Threshold Alert</h3>
              <p className="text-xs text-slate-400">Acoustic & visual alert when live prices satisfy condition.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Stock Selector */}
          <div>
            <label className="text-slate-300 font-medium block mb-1">Select Monitored Security</label>
            <select
              value={activeStock.id}
              onChange={e => handleStockChange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/[0.08] text-white font-mono-code text-sm focus:outline-none focus:border-sky-500"
            >
              {watchlistStocks.map(stock => (
                <option key={stock.id} value={stock.id}>
                  {stock.symbol} — {stock.name} ({stock.exchange})
                </option>
              ))}
            </select>
          </div>

          {/* Current Price Banner */}
          <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06] flex items-center justify-between">
            <span className="text-slate-400">Current Reference Price:</span>
            <span className="font-mono-code font-bold text-white text-base">
              {formatCurrency(currentConvertedPrice, currency)}
            </span>
          </div>

          {/* Condition (Above / Below) */}
          <div>
            <label className="text-slate-300 font-medium block mb-1.5">Trigger Condition</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setCondition('ABOVE');
                  if (parseFloat(targetPrice) <= currentConvertedPrice) {
                    setTargetPrice((currentConvertedPrice * 1.01).toFixed(2));
                  }
                  playQuantumBeep(640, 0.03);
                }}
                className={`py-2 px-3 rounded-xl font-medium flex items-center justify-center gap-1.5 border transition ${
                  condition === 'ABOVE'
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-semibold'
                    : 'bg-black/40 border-white/[0.08] text-slate-400 hover:text-slate-200'
                }`}
              >
                <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                Rises Above (≥ Target)
              </button>

              <button
                type="button"
                onClick={() => {
                  setCondition('BELOW');
                  if (parseFloat(targetPrice) >= currentConvertedPrice) {
                    setTargetPrice((currentConvertedPrice * 0.99).toFixed(2));
                  }
                  playQuantumBeep(540, 0.03);
                }}
                className={`py-2 px-3 rounded-xl font-medium flex items-center justify-center gap-1.5 border transition ${
                  condition === 'BELOW'
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 font-semibold'
                    : 'bg-black/40 border-white/[0.08] text-slate-400 hover:text-slate-200'
                }`}
              >
                <ArrowDownRight className="w-4 h-4 text-rose-400" />
                Drops Below (≤ Target)
              </button>
            </div>
          </div>

          {/* Target Price Input */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-slate-300 font-medium">Target Price ({currency})</label>
              <span className="text-[11px] text-slate-400 font-mono-code">
                Currency: <strong className="text-white">{currency}</strong>
              </span>
            </div>
            <div className="relative">
              <input
                type="number"
                step="any"
                value={targetPrice}
                onChange={e => {
                  setTargetPrice(e.target.value);
                  setError(null);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/[0.08] font-mono-code text-white text-base focus:outline-none focus:border-amber-400"
                placeholder="Enter threshold price..."
              />
              <span className="absolute right-3.5 top-3 text-slate-400 font-mono-code text-xs">
                {currency}
              </span>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div>
            <span className="text-[11px] text-slate-400 block mb-1">Quick Threshold Delta:</span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: '+0.5%', val: 0.5 },
                { label: '+1.0%', val: 1.0 },
                { label: '+2.0%', val: 2.0 },
                { label: '-0.5%', val: -0.5 },
                { label: '-1.0%', val: -1.0 },
                { label: '-2.0%', val: -2.0 },
              ].map(preset => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handleApplyPreset(preset.val)}
                  className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-slate-300 font-mono-code text-[11px] transition"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {error && <div className="text-rose-400 text-xs font-mono-code">{error}</div>}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-slate-300 hover:text-white font-medium text-xs transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-white/[0.1] hover:bg-white/[0.15] border border-white/[0.15] text-amber-300 font-semibold text-xs tracking-wider uppercase transition flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              Arm Trigger
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
