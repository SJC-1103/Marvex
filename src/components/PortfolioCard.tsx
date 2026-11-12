import React from 'react';
import { Currency } from '../types/market';
import { PortfolioSummary } from '../types/portfolio';
import { formatCurrency } from '../utils/currency';
import { Briefcase, Plus, ArrowUpRight, ArrowDownRight, PieChart } from 'lucide-react';
import { playQuantumBeep } from '../utils/audio';

interface PortfolioCardProps {
  portfolioSummary: PortfolioSummary;
  onOpenManageModal: () => void;
  currency: Currency;
}

export const PortfolioCard: React.FC<PortfolioCardProps> = ({
  portfolioSummary,
  onOpenManageModal,
  currency,
}) => {
  const {
    totalValue,
    totalInvested,
    totalPnL,
    totalPnLPercent,
    totalDayPnL,
    holdingsCount,
    calculatedHoldings,
  } = portfolioSummary;

  const isPositiveAllTime = totalPnL >= 0;
  const isPositiveDay = totalDayPnL >= 0;

  // Curated executive allocation palette
  const allocationColors = ['#38bdf8', '#6366f1', '#10b981', '#f59e0b', '#818cf8', '#0ea5e9'];

  return (
    <div className="quantum-card p-6 sm:p-7 rounded-3xl relative overflow-hidden space-y-6">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-64 h-64 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-emerald-400 shadow-sm">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold font-heading text-white">
                Live Portfolio Valuation
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono-code text-[11px] font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                LIVE MARK-TO-MARKET
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Consolidated real-time asset valuation across your Indian (₹) & US ($) positions.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              onOpenManageModal();
              playQuantumBeep(640, 0.04);
            }}
            className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.1] text-white font-medium text-xs transition shadow-sm active:scale-95 flex items-center gap-2"
          >
            <Plus className="w-4 h-4 text-sky-400" />
            <span>Manage Holdings ({holdingsCount})</span>
          </button>
        </div>
      </div>

      {holdingsCount === 0 ? (
        <div className="py-8 text-center rounded-2xl bg-black/30 border border-dashed border-white/[0.08] space-y-3">
          <Briefcase className="w-8 h-8 text-slate-600 mx-auto" />
          <h3 className="text-sm font-semibold text-white">No Holdings Configured</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Add share quantities to calculate live equity valuations and asset allocation weights dynamically.
          </p>
          <button
            onClick={onOpenManageModal}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition"
          >
            Add Initial Position
          </button>
        </div>
      ) : (
        <>
          {/* Main Numbers Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Total Current Value */}
            <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.06]">
              <span className="text-slate-400 text-[11px] font-mono-code uppercase block mb-1">
                Total Real-Time Value
              </span>
              <div className="text-2xl font-bold font-mono-code text-white">
                {formatCurrency(totalValue, currency)}
              </div>
              <div className="text-[11px] text-slate-500 font-mono-code mt-1">
                Cost Basis: {formatCurrency(totalInvested, currency)}
              </div>
            </div>

            {/* 2. Total Unrealized P&L */}
            <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.06]">
              <span className="text-slate-400 text-[11px] font-mono-code uppercase block mb-1">
                Total Return (Unrealized)
              </span>
              <div
                className={`text-2xl font-bold font-mono-code flex items-center gap-1 ${
                  isPositiveAllTime ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {isPositiveAllTime ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                {isPositiveAllTime ? '+' : ''}{formatCurrency(totalPnL, currency)}
              </div>
              <div
                className={`text-[11px] font-mono-code font-bold mt-1 ${
                  isPositiveAllTime ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {isPositiveAllTime ? '+' : ''}{totalPnLPercent.toFixed(2)}% ROI
              </div>
            </div>

            {/* 3. Today's Day Change */}
            <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.06]">
              <span className="text-slate-400 text-[11px] font-mono-code uppercase block mb-1">
                Today's Session Change
              </span>
              <div
                className={`text-2xl font-bold font-mono-code flex items-center gap-1 ${
                  isPositiveDay ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {isPositiveDay ? '+' : ''}{formatCurrency(totalDayPnL, currency)}
              </div>
              <div className="text-[11px] text-slate-400 font-mono-code mt-1">
                {isPositiveDay ? 'Advancing Session' : 'Pullback Session'}
              </div>
            </div>

            {/* 4. Portfolio Composition Summary */}
            <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.06]">
              <span className="text-slate-400 text-[11px] font-mono-code uppercase block mb-1">
                Portfolio Breadth
              </span>
              <div className="text-2xl font-bold font-heading text-white">
                {holdingsCount} Positions
              </div>
              <div className="text-[11px] text-sky-400 font-mono-code mt-1">
                Top: {calculatedHoldings[0]?.holding.symbol || calculatedHoldings[0]?.holding.symbolOrCode || 'N/A'} ({(calculatedHoldings[0]?.allocationPercent ?? calculatedHoldings[0]?.weightPercent ?? 0).toFixed(1)}%)
              </div>
            </div>
          </div>

          {/* Asset Allocation Breakdown Bar */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-heading font-semibold text-slate-300 flex items-center gap-1.5">
                <PieChart className="w-3.5 h-3.5 text-sky-400" /> Capital Allocation Weights
              </span>
              <span className="font-mono-code text-[11px] text-slate-500">
                100% Deployed Capital
              </span>
            </div>

            {/* Segmented Progress Bar */}
            <div className="w-full h-2.5 rounded-full bg-black/60 overflow-hidden flex p-0.5 border border-white/[0.06]">
              {calculatedHoldings.map((ch, idx) => {
                const alloc = ch.allocationPercent ?? ch.weightPercent ?? 0;
                const sym = ch.holding.symbol || ch.holding.symbolOrCode || 'POS';
                return (
                  <div
                    key={ch.holding.id}
                    className="h-full first:rounded-l-full last:rounded-r-full transition-all duration-300"
                    style={{
                      width: `${alloc}%`,
                      backgroundColor: allocationColors[idx % allocationColors.length],
                    }}
                    title={`${sym}: ${alloc.toFixed(1)}%`}
                  />
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono-code pt-1">
              {calculatedHoldings.map((ch, idx) => {
                const alloc = ch.allocationPercent ?? ch.weightPercent ?? 0;
                const sym = ch.holding.symbol || ch.holding.symbolOrCode || 'POS';
                return (
                  <div key={ch.holding.id} className="flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: allocationColors[idx % allocationColors.length] }}
                    />
                    <span className="text-slate-200 font-semibold">{sym}</span>
                    <span className="text-slate-400 text-[11px]">
                      {alloc.toFixed(1)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Real-Time Holdings Table */}
          <div className="rounded-2xl bg-black/40 border border-white/[0.06] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02] text-[11px] font-mono-code uppercase text-slate-400">
                    <th className="p-3.5">Security</th>
                    <th className="p-3.5 text-right">Shares / Units</th>
                    <th className="p-3.5 text-right">Avg Cost</th>
                    <th className="p-3.5 text-right">Live Mark</th>
                    <th className="p-3.5 text-right">Market Value</th>
                    <th className="p-3.5 text-right">Unrealized P&L</th>
                    <th className="p-3.5 text-right">Session P&L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] font-mono-code">
                  {calculatedHoldings.map((ch, idx) => {
                    const totalPnL = ch.totalPnL ?? ch.unrealizedGain ?? 0;
                    const totalPnLPct = ch.totalPnLPercent ?? ch.unrealizedGainPercent ?? 0;
                    const dayPnL = ch.dayPnL ?? ch.dailyChange ?? 0;
                    const isProfit = totalPnL >= 0;
                    const isDayProfit = dayPnL >= 0;
                    const sym = ch.holding.symbol || ch.holding.symbolOrCode || 'POS';
                    const shares = ch.holding.shares ?? ch.holding.quantityOrUnits ?? 0;
                    const avgCost = ch.holding.averageBuyPrice ?? ch.holding.averageCost ?? 0;

                    return (
                      <tr key={ch.holding.id} className="hover:bg-white/[0.03] transition">
                        <td className="p-3.5">
                          <div className="flex items-center gap-2.5">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: allocationColors[idx % allocationColors.length] }}
                            />
                            <span className="font-bold text-white text-sm">
                              {sym}
                            </span>
                          </div>
                        </td>

                        <td className="p-3.5 text-right text-slate-200">
                          {shares}
                        </td>

                        <td className="p-3.5 text-right text-slate-400">
                          {formatCurrency(avgCost, currency, ch.holding.currency)}
                        </td>

                        <td className="p-3.5 text-right font-semibold text-white">
                          {formatCurrency(ch.currentPrice, currency)}
                        </td>

                        <td className="p-3.5 text-right font-bold text-white">
                          {formatCurrency(ch.currentValue, currency)}
                        </td>

                        <td className={`p-3.5 text-right font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isProfit ? '+' : ''}{formatCurrency(totalPnL, currency)} ({isProfit ? '+' : ''}{totalPnLPct.toFixed(2)}%)
                        </td>

                        <td className={`p-3.5 text-right ${isDayProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isDayProfit ? '+' : ''}{formatCurrency(dayPnL, currency)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
