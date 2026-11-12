import React, { useState } from 'react';
import { Currency, Stock } from '../../types/market';
import { PriceAlert } from '../../types/alert';
import { PortfolioHolding } from '../../types/portfolio';
import { formatCurrency, convertCurrency } from '../../utils/currency';
import { marketService } from '../../services/marketDataService';
import { X, Bell, AlertCircle, Plus, Check } from 'lucide-react';
import { playQuantumBeep } from '../../utils/audio';

interface NewPriceAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAlert: (alert: Omit<PriceAlert, 'id' | 'createdAt' | 'triggered'>) => void;
  watchlistStocks: Stock[];
  holdings: PortfolioHolding[];
  currency: Currency;
  exchangeRate: number;
}

export const NewPriceAlertModal: React.FC<NewPriceAlertModalProps> = ({
  isOpen,
  onClose,
  onSaveAlert,
  watchlistStocks,
  holdings,
  currency,
  exchangeRate,
}) => {
  // Combine unique choices from watchlist & holdings
  const choices = React.useMemo(() => {
    const map = new Map<string, { symbol: string; name: string; price: number; currency: Currency; type: string }>();

    watchlistStocks.forEach(s => {
      map.set(s.symbol, {
        symbol: s.symbol,
        name: s.name,
        price: s.price,
        currency: s.baseCurrency,
        type: 'Watchlist',
      });
    });

    holdings.forEach(h => {
      if (!map.has(h.symbolOrCode)) {
        const match = marketService.findInstrument(h.symbolOrCode);
        const price = match.instrument && 'price' in match.instrument ? match.instrument.price : h.averageCost;
        map.set(h.symbolOrCode, {
          symbol: h.symbolOrCode,
          name: h.name,
          price,
          currency: h.currency,
          type: 'Holding',
        });
      }
    });

    return Array.from(map.values());
  }, [watchlistStocks, holdings]);

  const [selectedSymbol, setSelectedSymbol] = useState<string>(choices[0]?.symbol || 'RELIANCE');
  const [condition, setCondition] = useState<'ABOVE' | 'BELOW'>('ABOVE');

  const selectedItem = choices.find(c => c.symbol === selectedSymbol) || choices[0];
  const convertedCurrentPrice = selectedItem
    ? convertCurrency(selectedItem.price, selectedItem.currency, currency, exchangeRate)
    : 0;

  const [targetPrice, setTargetPrice] = useState<string>(
    convertedCurrentPrice ? (convertedCurrentPrice * 1.02).toFixed(2) : ''
  );
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSymbolChange = (sym: string) => {
    setSelectedSymbol(sym);
    const item = choices.find(c => c.symbol === sym);
    if (item) {
      const price = convertCurrency(item.price, item.currency, currency, exchangeRate);
      const defaultTarget = condition === 'ABOVE' ? price * 1.02 : price * 0.98;
      setTargetPrice(defaultTarget.toFixed(2));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) {
      setError('Please choose a security from your holdings or watchlist.');
      return;
    }

    const numTarget = parseFloat(targetPrice);
    if (isNaN(numTarget) || numTarget <= 0) {
      setError('Please provide a valid target price greater than 0.');
      return;
    }

    onSaveAlert({
      assetType: 'EQUITY',
      symbolOrCode: selectedItem.symbol,
      name: selectedItem.name,
      stockId: `stock-${selectedItem.symbol.toLowerCase()}`,
      symbol: selectedItem.symbol,
      targetPrice: numTarget,
      condition,
      currency,
      initialPrice: convertedCurrentPrice,
    });

    playQuantumBeep(880, 0.08);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="quantum-card p-6 rounded-2xl max-w-md w-full border border-white/[0.12] space-y-5 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2 text-amber-400">
            <Bell className="w-5 h-5" />
            <h3 className="text-base font-bold font-heading text-white">Create Price Alert Threshold</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {choices.length === 0 ? (
          <div className="text-center py-6 space-y-3">
            <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
            <p className="text-xs text-slate-300">
              No securities currently found in your active portfolio holdings or watchlist. Please add positions or save stocks first.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/[0.08] text-white text-xs font-semibold"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {error && (
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300">
                {error}
              </div>
            )}

            {/* Select Security */}
            <div className="space-y-1.5">
              <label className="font-medium text-slate-300">
                Select Instrument (From Holdings / Watchlist)
              </label>
              <select
                value={selectedSymbol}
                onChange={e => handleSymbolChange(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/[0.1] text-white focus:outline-none focus:border-amber-400 cursor-pointer font-sans"
              >
                {choices.map(c => (
                  <option key={c.symbol} value={c.symbol}>
                    {c.symbol} — {c.name} ({c.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Current Reference Price */}
            <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06] flex items-center justify-between font-mono-code text-xs">
              <span className="text-slate-400">Current Reference Price:</span>
              <span className="font-bold text-white">
                {formatCurrency(convertedCurrentPrice, currency)}
              </span>
            </div>

            {/* Condition: Crosses Above vs Drops Below */}
            <div className="space-y-1.5">
              <label className="font-medium text-slate-300">Trigger Condition</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCondition('ABOVE')}
                  className={`py-2 px-3 rounded-xl border text-center font-mono-code transition ${
                    condition === 'ABOVE'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                      : 'bg-white/[0.02] border-white/[0.08] text-slate-400'
                  }`}
                >
                  Crosses Above (≥)
                </button>
                <button
                  type="button"
                  onClick={() => setCondition('BELOW')}
                  className={`py-2 px-3 rounded-xl border text-center font-mono-code transition ${
                    condition === 'BELOW'
                      ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-bold'
                      : 'bg-white/[0.02] border-white/[0.08] text-slate-400'
                  }`}
                >
                  Drops Below (≤)
                </button>
              </div>
            </div>

            {/* Target Price */}
            <div className="space-y-1.5">
              <label className="font-medium text-slate-300">Target Price / NAV ({currency})</label>
              <input
                type="number"
                step="any"
                value={targetPrice}
                onChange={e => {
                  setTargetPrice(e.target.value);
                  setError(null);
                }}
                placeholder="0.00"
                className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/[0.1] text-white font-mono-code focus:outline-none focus:border-amber-400 text-sm"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-white/[0.06]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-white/[0.08] text-slate-400 hover:text-white text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Create Alert</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
