import React, { useState } from 'react';
import { Stock, Currency } from '../../types/market';
import { MutualFundScheme } from '../../types/mutualFund';
import { PriceAlert } from '../../types/alert';
import { PortfolioHolding } from '../../types/portfolio';
import { formatCurrency, convertCurrency } from '../../utils/currency';
import { NewPriceAlertModal } from '../modals/NewPriceAlertModal';
import {
  Star,
  Bell,
  Trash2,
  Plus,
  Info,
  TrendingUp,
  TrendingDown,
  Compass,
  Layers,
  Power,
  RotateCcw,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { playQuantumBeep, playCollapseSound } from '../../utils/audio';

interface WatchlistWorkspaceProps {
  watchlistIds: string[];
  onToggleWatchlist: (id: string) => void;
  stocks: Stock[];
  mutualFunds: MutualFundScheme[];
  alerts: PriceAlert[];
  onSaveAlert: (alert: Omit<PriceAlert, 'id' | 'createdAt' | 'triggered'>) => void;
  onDeleteAlert: (alertId: string) => void;
  onRearmAlert: (alertId: string) => void;
  onToggleAlertActive?: (alertId: string) => void;
  holdings: PortfolioHolding[];
  currency: Currency;
  exchangeRate: number;
  onNavigateToAnalyze: (id: string) => void;
  onSelectForCompare: (symbol: string) => void;
}

export const WatchlistWorkspace: React.FC<WatchlistWorkspaceProps> = ({
  watchlistIds,
  onToggleWatchlist,
  stocks,
  mutualFunds,
  alerts,
  onSaveAlert,
  onDeleteAlert,
  onRearmAlert,
  onToggleAlertActive,
  holdings,
  currency,
  exchangeRate,
  onNavigateToAnalyze,
  onSelectForCompare,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'WATCHLIST' | 'ALERTS'>('WATCHLIST');
  const [isNewAlertOpen, setIsNewAlertOpen] = useState(false);

  // Watchlisted instruments (stocks & mutual funds)
  const watchlistedStocks = stocks.filter(s => watchlistIds.includes(s.id));
  const watchlistedFunds = mutualFunds.filter(mf => watchlistIds.includes(mf.id));

  // Combined watchlist items
  const allWatchlistItems = [
    ...watchlistedStocks.map(s => ({
      id: s.id,
      symbol: s.symbol,
      name: s.name,
      assetClass: 'EQUITY' as const,
      exchangeOrAmc: s.exchange,
      price: convertCurrency(s.price, s.baseCurrency, currency, exchangeRate),
      change: s.change,
      changePercent: s.changePercent,
    })),
    ...watchlistedFunds.map(mf => ({
      id: mf.id,
      symbol: mf.symbol,
      name: mf.name,
      assetClass: 'MUTUAL_FUND' as const,
      exchangeOrAmc: mf.amc,
      price: convertCurrency(mf.nav, mf.currency, currency, exchangeRate),
      change: mf.change,
      changePercent: mf.changePercent,
    })),
  ];

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-200">
      {/* 1. SUB-TAB SWITCHER & ACTIONS */}
      <div className="p-5 sm:p-6 rounded-2xl quantum-card border border-white/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-mono-code uppercase tracking-wider mb-1">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> Surveillance Observation Deck
          </div>
          <h2 className="text-2xl font-bold font-heading text-white">
            Watchlist & Volatility Triggers
          </h2>
          <p className="text-slate-400 text-xs mt-0.5">
            Monitor selected Indian and US assets and configure browser-evaluated limit thresholds.
          </p>
        </div>

        {/* Sub-Tab Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs">
            <button
              onClick={() => {
                setActiveSubTab('WATCHLIST');
                playQuantumBeep(640, 0.03);
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                activeSubTab === 'WATCHLIST'
                  ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Star className="w-3.5 h-3.5" />
              <span>Watchlist ({allWatchlistItems.length})</span>
            </button>
            <button
              onClick={() => {
                setActiveSubTab('ALERTS');
                playQuantumBeep(640, 0.03);
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                activeSubTab === 'ALERTS'
                  ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Price Alerts ({alerts.length})</span>
            </button>
          </div>

          {activeSubTab === 'ALERTS' && (
            <button
              onClick={() => setIsNewAlertOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 active:scale-95 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Alert</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. IN-SESSION MONITORING SCOPE DISCLOSURE */}
      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5 text-xs text-amber-200/90 leading-relaxed">
        <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-amber-300 font-semibold">In-Session Monitoring Scope Disclosure:</strong> All price triggers and threshold conditions are evaluated client-side in your active browser window during the active session without background daemons or external server relays. Trigger notifications surface as audio-visual toasts upon micro-tick arrivals.
        </div>
      </div>

      {/* 3. WATCHLIST TABLE (SUB-TAB: WATCHLIST) */}
      {activeSubTab === 'WATCHLIST' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold font-heading text-white">
              Monitored Securities ({allWatchlistItems.length})
            </h3>
          </div>

          <div className="rounded-2xl quantum-card overflow-hidden border border-white/[0.08]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-black/50 text-slate-400 font-mono-code uppercase text-[10px] tracking-wider border-b border-white/[0.08]">
                  <tr>
                    <th className="py-3 px-4">Symbol / Scheme Name</th>
                    <th className="py-3 px-3">Asset Class</th>
                    <th className="py-3 px-3">Exchange / AMC</th>
                    <th className="py-3 px-3 text-right">Latest Close / NAV</th>
                    <th className="py-3 px-3 text-right">Daily % Change</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {allWatchlistItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-500 font-mono-code">
                        No instruments currently bookmarked. Visit the Analyze workspace to star securities.
                      </td>
                    </tr>
                  ) : (
                    allWatchlistItems.map(item => {
                      const isPos = item.changePercent >= 0;
                      return (
                        <tr key={item.id} className="hover:bg-white/[0.02] transition">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-white font-sans">{item.name}</div>
                            <div className="text-[10px] font-mono-code text-slate-500">{item.symbol}</div>
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono-code font-bold ${
                                item.assetClass === 'EQUITY'
                                  ? 'bg-sky-500/10 text-sky-400'
                                  : 'bg-indigo-500/10 text-indigo-400'
                              }`}
                            >
                              {item.assetClass}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-300 font-mono-code">
                            {item.exchangeOrAmc}
                          </td>
                          <td className="py-3 px-3 text-right font-mono-code font-bold text-white">
                            {formatCurrency(item.price, currency)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono-code">
                            <span className={`font-semibold flex items-center justify-end gap-1 ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {isPos ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                              {isPos ? '+' : ''}{item.changePercent.toFixed(2)}%
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => onNavigateToAnalyze(item.id)}
                                className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-sky-500/20 text-slate-400 hover:text-sky-300 border border-white/[0.06] transition"
                                title="Open Technical Chart"
                              >
                                <Compass className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onSelectForCompare(item.symbol)}
                                className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-sky-500/20 text-slate-400 hover:text-sky-300 border border-white/[0.06] transition"
                                title="Add to Comparison"
                              >
                                <Layers className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  onToggleWatchlist(item.id);
                                  playCollapseSound();
                                }}
                                className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-white/[0.06] transition"
                                title="Remove from Watchlist"
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
      )}

      {/* 4. PRICE ALERTS TABLE (SUB-TAB: ALERTS) */}
      {activeSubTab === 'ALERTS' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold font-heading text-white">
              Configured Volatility & Price Thresholds ({alerts.length})
            </h3>
            <button
              onClick={() => setIsNewAlertOpen(true)}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Configure New Alert</span>
            </button>
          </div>

          <div className="rounded-2xl quantum-card overflow-hidden border border-white/[0.08]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-black/50 text-slate-400 font-mono-code uppercase text-[10px] tracking-wider border-b border-white/[0.08]">
                  <tr>
                    <th className="py-3 px-4">Security</th>
                    <th className="py-3 px-3">Condition</th>
                    <th className="py-3 px-3 text-right">Target Price / NAV</th>
                    <th className="py-3 px-3 text-right">Initial Price</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {alerts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-500 font-mono-code">
                        No price threshold alerts configured. Click "New Alert" to configure real-time limit triggers.
                      </td>
                    </tr>
                  ) : (
                    alerts.map(alert => (
                      <tr key={alert.id} className="hover:bg-white/[0.02] transition">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white font-mono-code">{alert.symbol}</div>
                          <div className="text-[10px] text-slate-500 font-sans">{alert.name || alert.symbol}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono-code font-bold ${
                              alert.condition === 'ABOVE'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {alert.condition === 'ABOVE' ? 'Crosses Above (≥)' : 'Drops Below (≤)'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono-code font-bold text-white">
                          {formatCurrency(alert.targetPrice, alert.currency)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono-code text-slate-400">
                          {formatCurrency(alert.initialPrice, alert.currency)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {alert.triggered ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              <CheckCircle2 className="w-3 h-3 text-amber-400" />
                              Triggered
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Active Armed
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {alert.triggered && (
                              <button
                                onClick={() => {
                                  onRearmAlert(alert.id);
                                  playQuantumBeep(700, 0.04);
                                }}
                                className="px-2 py-1 rounded bg-white/[0.05] hover:bg-white/[0.1] text-sky-400 text-[10px] font-mono-code flex items-center gap-1"
                                title="Re-arm Alert at current price"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Re-arm</span>
                              </button>
                            )}
                            <button
                              onClick={() => {
                                onDeleteAlert(alert.id);
                                playCollapseSound();
                              }}
                              className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-white/[0.06] transition"
                              title="Delete Alert"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* New Alert Modal */}
      {isNewAlertOpen && (
        <NewPriceAlertModal
          isOpen={isNewAlertOpen}
          onClose={() => setIsNewAlertOpen(false)}
          onSaveAlert={onSaveAlert}
          watchlistStocks={watchlistedStocks}
          holdings={holdings}
          currency={currency}
          exchangeRate={exchangeRate}
        />
      )}
    </div>
  );
};
