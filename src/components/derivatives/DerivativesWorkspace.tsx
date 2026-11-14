import React, { useState, useMemo } from 'react';
import { Layers, BarChart3, Activity, BookOpen, Compass, Coins } from 'lucide-react';
import { UnderlyingAsset } from '../../types/derivatives';
import { Currency, Stock } from '../../types/market';
import { MOCK_UNDERLYINGS } from '../../data/derivativesData';
import { StrategyBuilder } from './StrategyBuilder';
import { UnderlyingAnalyticalReport } from './UnderlyingAnalyticalReport';
import { OptionChainView } from './OptionChainView';
import { GreeksLab } from './GreeksLab';
import { FOAcademy } from './FOAcademy';

export type FoSubWorkspace = 'builder' | 'report' | 'chain' | 'greeks' | 'academy';

interface DerivativesWorkspaceProps {
  currency: Currency;
  exchangeRate: number;
  availableStocks?: Stock[];
}

export const DerivativesWorkspace: React.FC<DerivativesWorkspaceProps> = ({
  currency,
  exchangeRate,
  availableStocks = [],
}) => {
  const [activeSubTab, setActiveSubTab] = useState<FoSubWorkspace>('builder');
  const [selectedSymbol, setSelectedSymbol] = useState<string>(MOCK_UNDERLYINGS[0].symbol);

  // Merge MOCK_UNDERLYINGS with live equity quotes when available so Spot & Futures stay synchronized
  const underlyings: UnderlyingAsset[] = useMemo(() => {
    if (!availableStocks || availableStocks.length === 0) return MOCK_UNDERLYINGS;
    return MOCK_UNDERLYINGS.map(und => {
      const liveStock = availableStocks.find(
        s => s.symbol.toUpperCase() === und.symbol.toUpperCase()
      );
      if (!liveStock || !liveStock.price) return und;

      const ratio = und.spot > 0 ? liveStock.price / und.spot : 1;
      const snappedMaxPain =
        Math.round((und.maxPain * ratio) / und.strikeInterval) * und.strikeInterval || und.maxPain;
      const futuresBasis = Number((und.futuresBasis * ratio).toFixed(2));
      const futuresLtp = Number((liveStock.price + futuresBasis).toFixed(2));

      return {
        ...und,
        spot: liveStock.price,
        change: liveStock.change,
        changePercent: liveStock.changePercent,
        maxPain: snappedMaxPain,
        futuresBasis,
        futuresLtp,
      };
    });
  }, [availableStocks]);

  const selectedUnderlying = useMemo(() => {
    return underlyings.find(u => u.symbol === selectedSymbol) || underlyings[0];
  }, [underlyings, selectedSymbol]);

  const handleSelectUnderlying = (und: UnderlyingAsset) => {
    setSelectedSymbol(und.symbol);
  };

  const navSubTabs: { id: FoSubWorkspace; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'builder', label: 'Strategy Builder & Payoff', icon: Layers },
    { id: 'report', label: 'Underlying Stock & F&O Audit', icon: BarChart3 },
    { id: 'chain', label: 'Option Chain Matrix', icon: Compass },
    { id: 'greeks', label: 'Greeks Sensitivity Lab', icon: Activity },
    { id: 'academy', label: 'F&O Risk Academy', icon: BookOpen },
  ];

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Mode Sub-Navigation Tabs + Active Valuation Currency Indicator */}
      <div className="p-1.5 rounded-2xl bg-black/40 border border-white/[0.08] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {navSubTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-mono-code font-bold transition flex items-center gap-2 whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-[11px] font-mono-code text-slate-300 shrink-0">
          <Coins className="w-3.5 h-3.5 text-amber-400" />
          <span>Display: <strong className="text-white">{currency === 'INR' ? 'INR (₹)' : 'USD ($)'}</strong></span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400">$1 = ₹{exchangeRate.toFixed(2)}</span>
        </div>
      </div>

      {/* Sub Workspace View */}
      {activeSubTab === 'builder' && (
        <StrategyBuilder
          selectedUnderlying={selectedUnderlying}
          underlyings={underlyings}
          onSelectUnderlying={handleSelectUnderlying}
          currency={currency}
          exchangeRate={exchangeRate}
        />
      )}

      {activeSubTab === 'report' && (
        <UnderlyingAnalyticalReport
          underlying={selectedUnderlying}
          underlyings={underlyings}
          onSelectUnderlying={handleSelectUnderlying}
          currency={currency}
          exchangeRate={exchangeRate}
          onOpenBuilderWithUnderlying={() => setActiveSubTab('builder')}
        />
      )}

      {activeSubTab === 'chain' && (
        <OptionChainView
          underlying={selectedUnderlying}
          underlyings={underlyings}
          onSelectUnderlying={handleSelectUnderlying}
          currency={currency}
          exchangeRate={exchangeRate}
        />
      )}

      {activeSubTab === 'greeks' && (
        <GreeksLab
          underlying={selectedUnderlying}
          underlyings={underlyings}
          onSelectUnderlying={handleSelectUnderlying}
          currency={currency}
          exchangeRate={exchangeRate}
        />
      )}

      {activeSubTab === 'academy' && (
        <FOAcademy
          currency={currency}
          exchangeRate={exchangeRate}
        />
      )}
    </div>
  );
};
