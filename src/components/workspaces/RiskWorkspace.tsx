import React, { useState, useMemo } from 'react';
import { Currency, MarketIndex } from '../../types/market';
import { PortfolioBook, BookValuationSummary } from '../../types/portfolio';
import { QuantitativeRiskMetrics } from '../../types/risk';
import { portfolioService } from '../../services/portfolioService';
import { marketService } from '../../services/marketDataService';
import { formatCurrency } from '../../utils/currency';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Globe,
  PieChart,
  Activity,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { playQuantumBeep } from '../../utils/audio';

interface RiskWorkspaceProps {
  activeBook: PortfolioBook;
  summary: BookValuationSummary;
  indices: MarketIndex[];
  currency: Currency;
  exchangeRate: number;
}

export const RiskWorkspace: React.FC<RiskWorkspaceProps> = ({
  activeBook,
  summary,
  indices,
  currency,
  exchangeRate,
}) => {
  const [selectedBenchmark, setSelectedBenchmark] = useState<string>('NIFTY 50');

  // Compute quantitative risk metrics via portfolioService
  const riskMetrics: QuantitativeRiskMetrics = useMemo(() => {
    return portfolioService.calculatePortfolioRisk(
      activeBook,
      currency,
      exchangeRate,
      selectedBenchmark
    );
  }, [activeBook, currency, exchangeRate, selectedBenchmark]);

  // Compute Geographic Allocation (Domestic India % vs Global US %)
  const { domesticIndiaPercent, globalUsPercent } = useMemo(() => {
    let indiaVal = 0;
    let usVal = 0;

    summary.calculatedHoldings.forEach(ch => {
      if (ch.holding.currency === 'INR' || ch.holding.exchangeOrAmc === 'NSE' || ch.holding.exchangeOrAmc === 'BSE' || ch.holding.assetType === 'MUTUAL_FUND') {
        indiaVal += ch.currentValue;
      } else {
        usVal += ch.currentValue;
      }
    });

    const totalVal = indiaVal + usVal;
    if (totalVal === 0) return { domesticIndiaPercent: 100, globalUsPercent: 0 };

    return {
      domesticIndiaPercent: Number(((indiaVal / totalVal) * 100).toFixed(1)),
      globalUsPercent: Number(((usVal / totalVal) * 100).toFixed(1)),
    };
  }, [summary]);

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-200">
      {/* 1. HEADER & ACTIVE BENCHMARK DISPLAY */}
      <div className="p-5 sm:p-6 rounded-2xl quantum-card border border-white/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sky-400 text-xs font-mono-code uppercase tracking-wider mb-1">
            <ShieldAlert className="w-3.5 h-3.5" /> Quantitative Portfolio Risk Diagnostics
          </div>
          <h2 className="text-2xl font-bold font-heading text-white">
            Risk & Attribution Architecture
          </h2>
          <p className="text-slate-400 text-xs mt-0.5">
            Evaluating historical covariance, tail risk drawdown, concentration limits, and asset-level alpha contribution for <strong className="text-white">{activeBook.name}</strong>.
          </p>
        </div>

        {/* Benchmark Selector */}
        <div className="flex items-center gap-2 bg-black/40 p-2 rounded-xl border border-white/[0.08] shrink-0 text-xs">
          <span className="text-slate-400 font-mono-code">Benchmark:</span>
          <select
            value={selectedBenchmark}
            onChange={e => {
              setSelectedBenchmark(e.target.value);
              playQuantumBeep(640, 0.03);
            }}
            className="bg-[#0b0f1d] border border-white/[0.1] text-sky-300 font-bold font-mono-code rounded-lg px-2.5 py-1 focus:outline-none focus:border-sky-400 cursor-pointer"
          >
            <option value="NIFTY 50">NIFTY 50 (India)</option>
            <option value="S&P 500">S&P 500 (USA)</option>
            <option value="NASDAQ-100">NASDAQ-100 (USA)</option>
            <option value="SENSEX">BSE SENSEX (India)</option>
          </select>
        </div>
      </div>

      {/* 2. QUANTITATIVE RISK METRICS (4-COLUMN GRID) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Annualized Volatility */}
        <div className="p-5 rounded-2xl quantum-card border border-white/[0.08] space-y-1">
          <div className="text-[11px] font-mono-code uppercase text-slate-400">Annualized Volatility (σ)</div>
          <div className="text-2xl font-bold font-mono-code text-white">
            {riskMetrics.annualizedVolatility.toFixed(2)}%
          </div>
          <div className="text-[10px] text-slate-500 font-mono-code pt-1 border-t border-white/[0.04]">
            Formula: σ_daily × √252 trading sessions
          </div>
        </div>

        {/* Card 2: Portfolio Beta */}
        <div className="p-5 rounded-2xl quantum-card border border-white/[0.08] space-y-1">
          <div className="text-[11px] font-mono-code uppercase text-slate-400">Portfolio Beta (β)</div>
          <div className="text-2xl font-bold font-mono-code text-sky-400">
            {riskMetrics.beta.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-500 font-mono-code pt-1 border-t border-white/[0.04]">
            Relative to {riskMetrics.benchmarkSymbol} (1.00 parity)
          </div>
        </div>

        {/* Card 3: Maximum Historical Drawdown */}
        <div className="p-5 rounded-2xl quantum-card border border-white/[0.08] space-y-1">
          <div className="text-[11px] font-mono-code uppercase text-slate-400">Max Historical Drawdown</div>
          <div className="text-2xl font-bold font-mono-code text-rose-400">
            -{riskMetrics.maxDrawdownPercent.toFixed(2)}%
          </div>
          <div className="text-[10px] text-slate-500 font-mono-code pt-1 border-t border-white/[0.04]">
            Peak-to-trough historical drop
          </div>
        </div>

        {/* Card 4: Sharpe Ratio */}
        <div className="p-5 rounded-2xl quantum-card border border-white/[0.08] space-y-1">
          <div className="text-[11px] font-mono-code uppercase text-slate-400">Sharpe Ratio</div>
          <div className="text-2xl font-bold font-mono-code text-emerald-400">
            {riskMetrics.sharpeRatio.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-500 font-mono-code pt-1 border-t border-white/[0.04]">
            Hurdle Rf: {riskMetrics.riskFreeRatePercent.toFixed(2)}% (RBI Repo Rate Baseline)
          </div>
        </div>
      </div>

      {/* 3. CONCENTRATION & EXPOSURE DIAGNOSTICS (3-COLUMN LAYOUT) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Single-Asset Concentration Meter */}
        <div className="p-5 rounded-2xl quantum-card border border-white/[0.08] space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono-code uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Concentration Risk Meter
              </span>
              <span
                className={`text-[10px] font-mono-code font-bold px-2 py-0.5 rounded ${
                  riskMetrics.concentration.hasWarning
                    ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                    : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                }`}
              >
                {riskMetrics.concentration.hasWarning ? 'ELEVATED RISK' : 'HEALTHY SPREAD'}
              </span>
            </div>

            <div className="mt-2 space-y-1">
              <div className="text-xs text-slate-300">
                Largest Position: <strong className="text-white font-mono-code">{riskMetrics.concentration.maxPositionSymbol}</strong>
              </div>
              <div className="text-2xl font-bold font-mono-code text-white">
                {riskMetrics.concentration.maxPositionWeight}%
              </div>
            </div>

            {/* Threshold progress bar */}
            <div className="w-full h-2 rounded-full bg-black/60 relative mt-2 overflow-hidden border border-white/[0.06]">
              <div
                className={`h-full rounded-full transition-all ${
                  riskMetrics.concentration.hasWarning ? 'bg-rose-500' : 'bg-emerald-400'
                }`}
                style={{ width: `${Math.min(100, riskMetrics.concentration.maxPositionWeight * 2.5)}%` }}
              />
            </div>

            {riskMetrics.concentration.warningMessage && (
              <p className="text-[11px] text-rose-300 mt-2 leading-relaxed bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                {riskMetrics.concentration.warningMessage}
              </p>
            )}
          </div>

          <div className="pt-2 border-t border-white/[0.06] text-[11px] font-mono-code text-slate-400 flex items-center justify-between">
            <span>Top-3 Combined Weight:</span>
            <strong className="text-white">{riskMetrics.concentration.top3WeightPercent}%</strong>
          </div>
        </div>

        {/* Card 2: Geographic Allocation Bars */}
        <div className="p-5 rounded-2xl quantum-card border border-white/[0.08] space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono-code uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-sky-400" /> Geographic Exposure
              </span>
            </div>

            <div className="mt-3 space-y-3">
              {/* Domestic India */}
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between font-mono-code">
                  <span className="text-slate-300">Domestic India (NSE / BSE / AMFI)</span>
                  <span className="font-bold text-orange-400">{domesticIndiaPercent}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-black/60 overflow-hidden border border-white/[0.06]">
                  <div
                    className="h-full bg-orange-400 rounded-full transition-all"
                    style={{ width: `${domesticIndiaPercent}%` }}
                  />
                </div>
              </div>

              {/* Global / US */}
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between font-mono-code">
                  <span className="text-slate-300">Global / United States (NYSE / NASDAQ)</span>
                  <span className="font-bold text-sky-400">{globalUsPercent}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-black/60 overflow-hidden border border-white/[0.06]">
                  <div
                    className="h-full bg-sky-400 rounded-full transition-all"
                    style={{ width: `${globalUsPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-white/[0.06] text-[10px] font-mono-code text-slate-500">
            Multi-currency parity anchored to {currency}
          </div>
        </div>

        {/* Card 3: Sector Allocation Matrix */}
        <div className="p-5 rounded-2xl quantum-card border border-white/[0.08] space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono-code uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <PieChart className="w-3.5 h-3.5 text-indigo-400" /> Industry Sector Breakdown
              </span>
            </div>

            <div className="mt-3 space-y-2 max-h-40 overflow-y-auto pr-1">
              {riskMetrics.sectorBreakdown.slice(0, 5).map(sec => (
                <div key={sec.sector} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between font-mono-code text-[11px]">
                    <span className="text-slate-300 truncate max-w-[150px]">{sec.sector}</span>
                    <span className="font-bold text-white">{sec.weightPercent}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-black/60 overflow-hidden border border-white/[0.06]">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, sec.weightPercent)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-white/[0.06] text-[10px] font-mono-code text-slate-500">
            Aggregated across direct equities and scheme holdings
          </div>
        </div>
      </div>

      {/* 4. HOLDING-LEVEL RETURN ATTRIBUTION TABLE */}
      <div className="space-y-3">
        <div>
          <h3 className="text-base font-bold font-heading text-white">
            Holding-Level Return Attribution
          </h3>
          <p className="text-xs text-slate-400">
            Calculated contribution to portfolio return: Return Contribution (% points) = Weight × Position Return
          </p>
        </div>

        <div className="rounded-2xl quantum-card overflow-hidden border border-white/[0.08]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-black/50 text-slate-400 font-mono-code uppercase text-[10px] tracking-wider border-b border-white/[0.08]">
                <tr>
                  <th className="py-3 px-4">Position</th>
                  <th className="py-3 px-3">Asset Class</th>
                  <th className="py-3 px-3 text-right">Portfolio Weight %</th>
                  <th className="py-3 px-3 text-right">Position Total Return %</th>
                  <th className="py-3 px-3 text-right">Return Contribution (% pts)</th>
                  <th className="py-3 px-4 text-right">Total Unrealized Gain</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {riskMetrics.attributions.map(attr => {
                  const isPosReturn = attr.returnPercent >= 0;
                  const isPosContrib = attr.contributionPercent >= 0;
                  const matchingHolding = summary.calculatedHoldings.find(
                    ch => ch.holding.symbolOrCode === attr.symbol
                  );

                  return (
                    <tr key={attr.symbol} className="hover:bg-white/[0.02] transition">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white font-sans">{attr.name}</div>
                        <div className="text-[10px] font-mono-code text-slate-500">{attr.symbol}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono-code font-bold ${
                            matchingHolding?.holding.assetType === 'EQUITY'
                              ? 'bg-sky-500/10 text-sky-400'
                              : 'bg-indigo-500/10 text-indigo-400'
                          }`}
                        >
                          {matchingHolding?.holding.assetType === 'EQUITY' ? 'EQUITY' : 'MUTUAL FUND'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono-code text-slate-200">
                        {attr.weightPercent.toFixed(1)}%
                      </td>
                      <td className="py-3 px-3 text-right font-mono-code">
                        <span className={`font-semibold ${isPosReturn ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isPosReturn ? '+' : ''}{attr.returnPercent.toFixed(2)}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono-code font-bold">
                        <span className={isPosContrib ? 'text-emerald-400' : 'text-rose-400'}>
                          {isPosContrib ? '+' : ''}{attr.contributionPercent.toFixed(2)}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono-code font-medium">
                        {matchingHolding ? (
                          <span className={matchingHolding.unrealizedGain >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                            {matchingHolding.unrealizedGain >= 0 ? '+' : ''}
                            {formatCurrency(matchingHolding.unrealizedGain, currency)}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
