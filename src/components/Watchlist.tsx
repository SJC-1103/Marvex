import React from 'react';
import { Stock, Currency } from '../types/market';
import { PriceAlert } from '../types/alert';
import { formatCurrency, formatMarketCap, convertCurrency } from '../utils/currency';
import { Star, ArrowUpRight, ArrowDownRight, Layers, Trash2, Plus, Bell, CheckCircle2, RotateCcw } from 'lucide-react';
import { playQuantumBeep } from '../utils/audio';

interface WatchlistProps {
  allStocks: Stock[];
  watchlistIds: string[];
  onToggleWatchlist: (stockId: string) => void;
  comparedStockIds: string[];
  onToggleCompare: (stockId: string) => void;
  onSelectStock: (stock: Stock) => void;
  currency: Currency;
  exchangeRate: number;
  alerts: PriceAlert[];
  onOpenAlertModal: (stock?: Stock) => void;
  onDeleteAlert: (alertId: string) => void;
  onRearmAlert: (alertId: string) => void;
}

export const Watchlist: React.FC<WatchlistProps> = ({
  allStocks,
  watchlistIds,
  onToggleWatchlist,
  comparedStockIds,
  onToggleCompare,
  onSelectStock,
  currency,
  exchangeRate,
  alerts,
  onOpenAlertModal,
  onDeleteAlert,
  onRearmAlert,
}) => {
  const watchlistedStocks = allStocks.filter(s => watchlistIds.includes(s.id));

  const totalCount = watchlistedStocks.length;
  const avgChangePercent =
    totalCount > 0
      ? watchlistedStocks.reduce((sum, s) => sum + s.changePercent, 0) / totalCount
      : 0;

  const activeAlertsCount = alerts.filter(a => !a.triggered).length;
  const triggeredAlertsCount = alerts.filter(a => a.triggered).length;

  return (
    <div className="w-full space-y-8">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl quantum-card space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-mono-code uppercase tracking-wider mb-1">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> Monitored Securities & Volatility Triggers
            </div>
            <h2 className="text-2xl font-bold font-heading text-white">
              Watchlist & Thresholds
            </h2>
            <p className="text-slate-400 text-sm mt-0.5">
              Continuous price surveillance and automated triggers for saved Indian and US equities.
            </p>
          </div>

          {/* Quick Metrics & Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onOpenAlertModal()}
              disabled={watchlistedStocks.length === 0}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                watchlistedStocks.length > 0
                  ? 'bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.1] text-amber-300 shadow-sm active:scale-95'
                  : 'bg-white/[0.02] border border-white/[0.04] text-slate-600 cursor-not-allowed'
              }`}
            >
              <Bell className="w-4 h-4 text-amber-400" />
              <span>Configure Threshold</span>
            </button>

            {totalCount > 0 && (
              <div className="px-4 py-2 rounded-xl bg-black/40 border border-white/[0.06] text-right">
                <div className="text-[11px] text-slate-400 font-mono-code">Watchlist Avg 24h</div>
                <div
                  className={`text-sm font-mono-code font-bold ${
                    avgChangePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {avgChangePercent >= 0 ? '+' : ''}
                  {avgChangePercent.toFixed(2)}%
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 1. Watchlisted Stocks Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold font-heading text-white flex items-center gap-2">
            <span>Watchlisted Assets ({totalCount})</span>
          </h3>
          <span className="text-xs font-mono-code text-slate-500">
            Click bell on any asset to configure price thresholds
          </span>
        </div>

        {watchlistedStocks.length === 0 ? (
          <div className="p-12 text-center rounded-2xl quantum-card border border-dashed border-white/[0.08] space-y-4">
            <Star className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-semibold text-white">Watchlist Empty</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              Star securities in the Terminal or Scanner to monitor live quotes, bid/ask depth, and alerts in one view.
            </p>
            <div className="pt-2">
              <span className="text-xs text-slate-400 block mb-2 font-mono-code">
                Suggested Blue-Chips:
              </span>
              <div className="flex flex-wrap justify-center gap-2">
                {['RELIANCE', 'NVDA', 'TCS', 'IONQ', 'HDFCBANK'].map(sym => {
                  const s = allStocks.find(x => x.symbol === sym);
                  if (!s) return null;
                  return (
                    <button
                      key={sym}
                      onClick={() => {
                        onToggleWatchlist(s.id);
                        playQuantumBeep(680, 0.04);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-black/40 hover:bg-white/[0.06] border border-white/[0.08] text-xs font-mono-code text-slate-300 hover:text-white transition flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5 text-sky-400" /> {sym}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {watchlistedStocks.map(stock => {
              const isCompared = comparedStockIds.includes(stock.id);
              const isPositive = stock.changePercent >= 0;
              const hasAlert = alerts.some(a => (a.stockId === stock.id || a.symbolOrCode === stock.symbol || a.symbol === stock.symbol) && !a.triggered);

              return (
                <div
                  key={stock.id}
                  onClick={() => onSelectStock(stock)}
                  className="quantum-card quantum-card-hover p-4 sm:p-5 rounded-2xl cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center font-mono-code font-bold text-white text-xs group-hover:border-sky-500/50 transition">
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
                          <div className="text-xs text-slate-400 truncate max-w-[150px] mt-0.5">
                            {stock.name}
                          </div>
                        </div>
                      </div>

                      {/* Bell Alert & Compare & Remove */}
                      <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            onOpenAlertModal(stock);
                            playQuantumBeep(620, 0.04);
                          }}
                          title="Set Price Alert"
                          className={`p-1.5 rounded-lg border transition ${
                            hasAlert
                              ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-sm'
                              : 'border-white/[0.08] text-slate-500 hover:text-amber-300'
                          }`}
                        >
                          <Bell className={`w-3.5 h-3.5 ${hasAlert ? 'fill-amber-400 text-amber-400' : ''}`} />
                        </button>
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
                            playQuantumBeep(400, 0.04);
                          }}
                          title="Remove from Watchlist"
                          className="p-1.5 rounded-lg border border-white/[0.08] text-slate-500 hover:text-rose-400 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Price Row */}
                    <div className="flex items-baseline justify-between mt-2">
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

                  {/* Bottom stats */}
                  <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
                    <span>Lot: <strong className="font-mono-code text-slate-200">{stock.lotSize || 1}</strong></span>
                    <span>Cap: <strong className="font-mono-code text-slate-200">{formatMarketCap(stock.marketCap, currency, stock.baseCurrency, exchangeRate)}</strong></span>
                    <span className="text-sky-300 font-mono-code font-semibold">Momentum {stock.quantumScore ?? Math.min(96, Math.max(45, Math.round(65 + stock.changePercent * 4)))}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Automated Price Alerts Manager */}
      <div className="p-5 sm:p-6 rounded-2xl quantum-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-400" />
            <h3 className="text-base font-bold font-heading text-white">
              Price Threshold Surveillance
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-black/40 border border-white/[0.08] text-[11px] font-mono-code text-slate-300">
              {activeAlertsCount} Active · {triggeredAlertsCount} Satisfied
            </span>
          </div>

          <button
            onClick={() => onOpenAlertModal()}
            disabled={watchlistedStocks.length === 0}
            className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" /> Add Trigger
          </button>
        </div>

        {alerts.length === 0 ? (
          <div className="py-8 text-center rounded-xl bg-black/30 border border-white/[0.06] text-xs text-slate-400 space-y-1">
            <p>No active price surveillance triggers.</p>
            <p className="text-slate-500">
              Click the Bell icon on any stock card to trigger notifications on price targets.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {alerts.map(alert => {
              const stock = allStocks.find(s => s.id === alert.stockId || s.symbol === (alert.symbol || alert.symbolOrCode));
              const currentStockPrice = stock
                ? convertCurrency(stock.price, stock.baseCurrency, alert.currency, exchangeRate)
                : 0;

              const isAbove = alert.condition === 'ABOVE';
              const diff = currentStockPrice - alert.targetPrice;
              const isTargetReached = isAbove ? currentStockPrice >= alert.targetPrice : currentStockPrice <= alert.targetPrice;
              const alertSym = alert.symbol || alert.symbolOrCode || 'SEC';

              return (
                <div
                  key={alert.id}
                  className="py-3 px-2 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02] transition"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono-code text-xs font-bold border ${
                        alert.triggered
                          ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                          : 'bg-white/[0.04] border-white/[0.08] text-slate-200'
                      }`}
                    >
                      {alertSym.slice(0, 3)}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white font-mono-code text-sm">{alertSym}</span>
                        <span
                          className={`text-[10px] font-mono-code px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 ${
                            alert.triggered
                              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                              : 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                          }`}
                        >
                          {alert.triggered ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-amber-400" /> SATISFIED
                            </>
                          ) : (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
                              MONITORING
                            </>
                          )}
                        </span>
                      </div>

                      <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>
                          Target: {isAbove ? 'rises above' : 'drops below'}{' '}
                          <strong className="text-white font-mono-code">
                            {formatCurrency(alert.targetPrice, alert.currency)}
                          </strong>
                        </span>
                        {alert.triggeredAt && (
                          <span className="text-[10px] text-slate-500">
                            ({new Date(alert.triggeredAt).toLocaleTimeString()})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Current Status & Action */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 text-xs font-mono-code">
                    <div className="text-left sm:text-right">
                      <div className="text-slate-400 text-[11px]">Current Mark:</div>
                      <div className="font-bold text-white">
                        {formatCurrency(currentStockPrice, alert.currency)}
                      </div>
                      <div className={`text-[10px] ${isTargetReached ? 'text-amber-400 font-bold' : 'text-slate-500'}`}>
                        {isTargetReached
                          ? 'Trigger Condition Hit'
                          : `${formatCurrency(Math.abs(diff), alert.currency)} ${diff < 0 ? 'below target' : 'above target'}`}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {alert.triggered && (
                        <button
                          onClick={() => {
                            onRearmAlert(alert.id);
                            playQuantumBeep(700, 0.05);
                          }}
                          title="Re-arm Alert"
                          className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 hover:text-white transition flex items-center gap-1 text-[11px]"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Re-arm</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          onDeleteAlert(alert.id);
                          playQuantumBeep(450, 0.04);
                        }}
                        title="Delete Alert"
                        className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-rose-950/30 border border-white/[0.08] text-slate-400 hover:text-rose-400 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
