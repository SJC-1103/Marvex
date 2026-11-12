import React, { useState } from 'react';
import { Currency, AssetType, Stock } from '../../types/market';
import { MutualFundScheme } from '../../types/mutualFund';
import { PortfolioHolding } from '../../types/portfolio';
import { marketService } from '../../services/marketDataService';
import { formatCurrency } from '../../utils/currency';
import { X, Plus, Search, Check, Briefcase } from 'lucide-react';
import { playQuantumBeep } from '../../utils/audio';

interface AddPositionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddHolding: (holding: Omit<PortfolioHolding, 'id'>) => void;
  bookCurrency: Currency;
  availableStocks: Stock[];
  availableMutualFunds: MutualFundScheme[];
}

export const AddPositionModal: React.FC<AddPositionModalProps> = ({
  isOpen,
  onClose,
  onAddHolding,
  bookCurrency,
  availableStocks,
  availableMutualFunds,
}) => {
  const [assetType, setAssetType] = useState<AssetType>('EQUITY');
  const [search, setSearch] = useState('');
  const [selectedStock, setSelectedStock] = useState<Stock | null>(availableStocks[0] || null);
  const [selectedFund, setSelectedFund] = useState<MutualFundScheme | null>(availableMutualFunds[0] || null);

  const [quantity, setQuantity] = useState<string>('10');
  const [purchasePrice, setPurchasePrice] = useState<string>(
    selectedStock ? selectedStock.price.toString() : '100'
  );
  const [purchaseDate, setPurchaseDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filtered lists for quick selection
  const filteredStocks = availableStocks.filter(
    s =>
      s.symbol.toLowerCase().includes(search.toLowerCase()) ||
      s.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredFunds = availableMutualFunds.filter(
    mf =>
      mf.symbol.toLowerCase().includes(search.toLowerCase()) ||
      mf.name.toLowerCase().includes(search.toLowerCase()) ||
      mf.schemeCode.includes(search)
  );

  const handleSelectStock = (stock: Stock) => {
    setSelectedStock(stock);
    setPurchasePrice(stock.price.toString());
  };

  const handleSelectFund = (fund: MutualFundScheme) => {
    setSelectedFund(fund);
    setPurchasePrice(fund.nav.toString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(quantity);
    const price = parseFloat(purchasePrice);

    if (isNaN(qty) || qty <= 0) {
      setError('Please provide a valid quantity / units greater than 0.');
      return;
    }
    if (isNaN(price) || price <= 0) {
      setError('Please provide a valid positive purchase price / NAV.');
      return;
    }
    if (!purchaseDate) {
      setError('Please choose a valid purchase date.');
      return;
    }

    if (assetType === 'EQUITY') {
      if (!selectedStock) {
        setError('Please select an equity instrument.');
        return;
      }
      onAddHolding({
        assetType: 'EQUITY',
        symbolOrCode: selectedStock.symbol,
        name: selectedStock.name,
        exchangeOrAmc: selectedStock.exchange,
        quantityOrUnits: qty,
        averageCost: price,
        purchaseDate,
        currency: selectedStock.baseCurrency,
        stockId: selectedStock.id,
        symbol: selectedStock.symbol,
        shares: qty,
        averageBuyPrice: price,
        addedAt: new Date().toISOString(),
      });
    } else {
      if (!selectedFund) {
        setError('Please select a mutual fund scheme.');
        return;
      }
      onAddHolding({
        assetType: 'MUTUAL_FUND',
        symbolOrCode: selectedFund.schemeCode,
        name: selectedFund.name,
        exchangeOrAmc: selectedFund.amc,
        quantityOrUnits: qty,
        averageCost: price,
        purchaseDate,
        currency: selectedFund.currency,
        stockId: selectedFund.id,
        symbol: selectedFund.symbol,
        shares: qty,
        averageBuyPrice: price,
        addedAt: new Date().toISOString(),
      });
    }

    playQuantumBeep(750, 0.05);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="quantum-card p-6 rounded-2xl max-w-lg w-full border border-white/[0.12] space-y-5 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2 text-sky-400">
            <Briefcase className="w-5 h-5" />
            <h3 className="text-base font-bold font-heading text-white">Add Position to Ledger</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toggle between Equity and Mutual Fund */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs">
          <button
            type="button"
            onClick={() => {
              setAssetType('EQUITY');
              if (selectedStock) setPurchasePrice(selectedStock.price.toString());
              setError(null);
            }}
            className={`py-2 rounded-lg font-medium transition ${
              assetType === 'EQUITY'
                ? 'bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Direct Equities (Stocks)
          </button>
          <button
            type="button"
            onClick={() => {
              setAssetType('MUTUAL_FUND');
              if (selectedFund) setPurchasePrice(selectedFund.nav.toString());
              setError(null);
            }}
            className={`py-2 rounded-lg font-medium transition ${
              assetType === 'MUTUAL_FUND'
                ? 'bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Mutual Fund Schemes (AMFI)
          </button>
        </div>

        {error && (
          <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Search & Selector list */}
        <div className="space-y-2 text-xs">
          <label className="font-medium text-slate-300">
            Choose {assetType === 'EQUITY' ? 'Stock' : 'Mutual Fund Scheme'}
          </label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={assetType === 'EQUITY' ? 'Search by ticker or company name...' : 'Search AMFI code, scheme name...'}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/40 border border-white/[0.1] text-white text-xs focus:outline-none focus:border-sky-400"
            />
          </div>

          <div className="max-h-36 overflow-y-auto space-y-1 rounded-xl bg-black/30 p-1.5 border border-white/[0.06]">
            {assetType === 'EQUITY' ? (
              filteredStocks.length === 0 ? (
                <div className="p-3 text-center text-slate-500">No matching equities found</div>
              ) : (
                filteredStocks.map(s => {
                  const isSelected = selectedStock?.id === s.id;
                  return (
                    <div
                      key={s.id}
                      onClick={() => handleSelectStock(s)}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${
                        isSelected
                          ? 'bg-sky-500/20 border border-sky-500/30 text-white'
                          : 'hover:bg-white/[0.04] text-slate-300'
                      }`}
                    >
                      <div>
                        <div className="font-semibold">{s.symbol}</div>
                        <div className="text-[10px] text-slate-400">{s.name} · {s.exchange}</div>
                      </div>
                      <div className="text-right font-mono-code">
                        <div className="font-bold">{formatCurrency(s.price, s.baseCurrency)}</div>
                        <div className="text-[10px] text-slate-400">{s.baseCurrency}</div>
                      </div>
                    </div>
                  );
                })
              )
            ) : (
              filteredFunds.length === 0 ? (
                <div className="p-3 text-center text-slate-500">No matching mutual funds found</div>
              ) : (
                filteredFunds.map(mf => {
                  const isSelected = selectedFund?.id === mf.id;
                  return (
                    <div
                      key={mf.id}
                      onClick={() => handleSelectFund(mf)}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${
                        isSelected
                          ? 'bg-indigo-500/20 border border-indigo-500/30 text-white'
                          : 'hover:bg-white/[0.04] text-slate-300'
                      }`}
                    >
                      <div>
                        <div className="font-semibold">{mf.name}</div>
                        <div className="text-[10px] text-slate-400">AMFI: {mf.schemeCode} · {mf.category}</div>
                      </div>
                      <div className="text-right font-mono-code">
                        <div className="font-bold">NAV: ₹{mf.nav.toFixed(2)}</div>
                        <div className="text-[10px] text-slate-400">{mf.planType} {mf.option}</div>
                      </div>
                    </div>
                  );
                })
              )
            )}
          </div>
        </div>

        {/* Inputs form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs pt-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-medium text-slate-300">
                {assetType === 'EQUITY' ? 'Quantity (Shares)' : 'Units Allocated'}
              </label>
              <input
                type="number"
                step="any"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                placeholder="10"
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/[0.1] text-white font-mono-code focus:outline-none focus:border-sky-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-slate-300">
                {assetType === 'EQUITY' ? 'Avg Purchase Price' : 'Allotment NAV'} ({assetType === 'EQUITY' ? selectedStock?.baseCurrency || 'INR' : 'INR'})
              </label>
              <input
                type="number"
                step="any"
                value={purchasePrice}
                onChange={e => setPurchasePrice(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/[0.1] text-white font-mono-code focus:outline-none focus:border-sky-400"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-medium text-slate-300">Acquisition / Allotment Date</label>
            <input
              type="date"
              value={purchaseDate}
              onChange={e => setPurchaseDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/[0.1] text-white font-mono-code focus:outline-none focus:border-sky-400"
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
              className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs transition flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Record Position</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
