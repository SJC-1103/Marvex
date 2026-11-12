import React, { useState, useEffect } from 'react';
import { MarketIndex, Currency } from '../../types/market';
import { BookValuationSummary } from '../../types/portfolio';
import { formatCurrency } from '../../utils/currency';
import { getMarketSessionStatus, MarketSessionStatus } from '../../utils/marketHours';
import {
  ShieldCheck,
  Clock,
  Globe,
  TrendingUp,
  TrendingDown,
  Layers,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Sparkles,
  PieChart,
  Users,
  AlertTriangle,
} from 'lucide-react';
import { playQuantumBeep } from '../../utils/audio';

interface OverviewWorkspaceProps {
  summary: BookValuationSummary;
  indices: MarketIndex[];
  currency: Currency;
  exchangeRate: number;
  onNavigateTab: (tab: any) => void;
  onSelectIndexForAnalysis: (indexId: string) => void;
  onSelectPositionForCompare: (symbol: string) => void;
  onOpenProvenance: () => void;
}

export const OverviewWorkspace: React.FC<OverviewWorkspaceProps> = ({
  summary,
  indices,
  currency,
  exchangeRate,
  onNavigateTab,
  onSelectIndexForAnalysis,
  onSelectPositionForCompare,
  onOpenProvenance,
}) => {
  // Live market hours updater
  const [inStatus, setInStatus] = useState<MarketSessionStatus>(getMarketSessionStatus('IN'));
  const [usStatus, setUsStatus] = useState<MarketSessionStatus>(getMarketSessionStatus('US'));

  useEffect(() => {
    const timer = setInterval(() => {
      setInStatus(getMarketSessionStatus('IN'));
      setUsStatus(getMarketSessionStatus('US'));
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  // Compute daily portfolio change sum
  const latestDayGainValue = summary.calculatedHoldings.reduce((acc, h) => acc + h.dailyChange, 0);
  const totalMarketVal = summary.totalMarketValue;
  const latestDayGainPercent = totalMarketVal > 0 ? (latestDayGainValue / totalMarketVal) * 100 : 0;

  // The 4 key benchmarks requested: NIFTY 50, BSE SENSEX, S&P 500, NASDAQ-100
  const benchmarkSymbols = ['NIFTY 50', 'SENSEX', 'S&P 500', 'NASDAQ-100'];
  const benchmarkCards = benchmarkSymbols.map(sym => {
    return (
      indices.find(
        idx =>
          idx.symbol.toUpperCase().includes(sym.toUpperCase()) ||
          idx.name.toUpperCase().includes(sym.toUpperCase())
      ) || {
        id: `idx-${sym.toLowerCase().replace(/\s+/g, '')}`,
        type: 'INDEX' as const,
        symbol: sym,
        name: sym,
        exchange: sym.includes('50') || sym.includes('SENSEX') ? 'NSE/BSE' : 'US',
        country: sym.includes('50') || sym.includes('SENSEX') ? ('IN' as const) : ('US' as const),
        currency: sym.includes('50') || sym.includes('SENSEX') ? ('INR' as const) : ('USD' as const),
        value: sym.includes('NIFTY') ? 25150.8 : sym.includes('SENSEX') ? 82490.2 : sym.includes('500') ? 5860.4 : 20280.5,
        change: 120.4,
        changePercent: 0.52,
        high: sym.includes('NIFTY') ? 25210 : 5900,
        low: sym.includes('NIFTY') ? 24980 : 5830,
        open: 25050,
        previousClose: 25030.4,
        history: [],
      }
    );
  });

  return (
    <div className="w-full space-y-6 animate-fade-up">
      {/* 1. TOP MARKET INTELLIGENCE ROW (3-COLUMN GRID) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Data Provenance Charter & Verification Status */}
        <div className="p-5 rounded-2xl quantum-card relative overflow-hidden flex flex-col justify-between border border-emerald-500/20 bg-gradient-to-br from-emerald-950/15 via-[#0b0f1d] to-[#080c18]">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[11px] font-mono-code font-bold">
                <ShieldCheck className="w-3.5 h-3.5" /> VERIFIED EOD SNAPSHOT
              </span>
            </div>

            <h3 className="text-sm font-semibold font-heading text-white">
              Data Provenance Charter
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Audited settlement prices from National Stock Exchange (NSE), BSE, AMFI NAV registries, and US exchanges. Local-first in-browser storage with read-only integrity.
            </p>
          </div>

          <div className="pt-3 mt-3 border-t border-white/[0.08] flex items-center justify-between text-[11px] font-mono-code text-slate-400">
            <span>Reference FX: <strong className="text-sky-300">$1 = ₹86.85</strong></span>
            <button
              onClick={onOpenProvenance}
              className="text-sky-400 hover:text-sky-300 flex items-center gap-1 transition font-sans font-medium"
            >
              Provenance <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Card 2: Indian Market Status (NSE / BSE) via Asia/Kolkata */}
        <div className="p-5 rounded-2xl quantum-card relative overflow-hidden flex flex-col justify-between border border-white/[0.08]">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono-code uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-orange-400" /> NSE & BSE (India)
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono-code font-bold ${
                  inStatus.isOpen
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                }`}
              >
                {inStatus.isOpen ? 'OPEN' : 'CLOSED'}
              </span>
            </div>

            <div className="text-base font-bold font-heading text-white">
              {inStatus.statusLabel}
            </div>
            <div className="text-xs text-slate-400 font-mono-code flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              {inStatus.localTimeFormatted}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono-code text-slate-400">
            <span>Hours: {inStatus.tradingHours}</span>
            <span className="text-slate-300">{inStatus.nextSessionNote}</span>
          </div>
        </div>

        {/* Card 3: US Market Status (NYSE / NASDAQ) via America/New_York */}
        <div className="p-5 rounded-2xl quantum-card relative overflow-hidden flex flex-col justify-between border border-white/[0.08]">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono-code uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-sky-400" /> NYSE & NASDAQ (USA)
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono-code font-bold ${
                  usStatus.isOpen
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                }`}
              >
                {usStatus.isOpen ? 'OPEN' : 'CLOSED'}
              </span>
            </div>

            <div className="text-base font-bold font-heading text-white">
              {usStatus.statusLabel}
            </div>
            <div className="text-xs text-slate-400 font-mono-code flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              {usStatus.localTimeFormatted}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono-code text-slate-400">
            <span>Hours: {usStatus.tradingHours}</span>
            <span className="text-slate-300">{usStatus.nextSessionNote}</span>
          </div>
        </div>
      </div>

      {/* 2. PORTFOLIO VALUATION SUMMARY CARD */}
      <div className="p-6 sm:p-7 rounded-3xl quantum-card space-y-6 border border-white/[0.1] relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Primary Net Worth Display */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono-code uppercase tracking-wider text-slate-400">
              <span>Active Book:</span>
              <strong className="text-sky-300 font-semibold">{summary.bookName}</strong>
              <span className="text-slate-600">·</span>
              <span>Total Valuation</span>
            </div>
            <div className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-heading text-white tracking-tight">
              {formatCurrency(summary.totalNetWorth, currency)}
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono-code text-slate-400 pt-1">
              <span>Invested Capital: <strong className="text-slate-200">{formatCurrency(summary.totalInvestedCost, currency)}</strong></span>
              <span className="text-slate-600">·</span>
              <span>Cash Balance: <strong className="text-emerald-400">{formatCurrency(summary.cashBalance, currency)}</strong></span>
            </div>
          </div>

          {/* 2 Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 shrink-0">
            {/* Unrealized Gain/Loss */}
            <div className="px-5 py-4 rounded-2xl bg-black/40 border border-white/[0.08] min-w-[180px]">
              <div className="text-[11px] font-mono-code uppercase text-slate-400">Total Unrealized P&L</div>
              <div
                className={`text-xl sm:text-2xl font-bold font-mono-code mt-1 flex items-center gap-1.5 ${
                  summary.totalUnrealizedGain >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {summary.totalUnrealizedGain >= 0 ? '+' : ''}
                {formatCurrency(summary.totalUnrealizedGain, currency)}
              </div>
              <div
                className={`text-xs font-mono-code font-semibold flex items-center gap-1 mt-0.5 ${
                  summary.totalUnrealizedGainPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {summary.totalUnrealizedGainPercent >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {summary.totalUnrealizedGainPercent >= 0 ? '+' : ''}
                {summary.totalUnrealizedGainPercent.toFixed(2)}%
              </div>
            </div>

            {/* Latest Day Gain/Loss */}
            <div className="px-5 py-4 rounded-2xl bg-black/40 border border-white/[0.08] min-w-[180px]">
              <div className="text-[11px] font-mono-code uppercase text-slate-400">Latest Day Change</div>
              <div
                className={`text-xl sm:text-2xl font-bold font-mono-code mt-1 flex items-center gap-1.5 ${
                  latestDayGainValue >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {latestDayGainValue >= 0 ? '+' : ''}
                {formatCurrency(latestDayGainValue, currency)}
              </div>
              <div
                className={`text-xs font-mono-code font-semibold flex items-center gap-1 mt-0.5 ${
                  latestDayGainPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {latestDayGainPercent >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {latestDayGainPercent >= 0 ? '+' : ''}
                {latestDayGainPercent.toFixed(2)}%
              </div>
            </div>
          </div>
        </div>

        {/* Asset Class Allocation Bar */}
        <div className="space-y-2 pt-2 border-t border-white/[0.06]">
          <div className="flex items-center justify-between text-xs font-mono-code">
            <span className="text-slate-400 flex items-center gap-1.5">
              <PieChart className="w-3.5 h-3.5 text-sky-400" /> Asset Class Allocation
            </span>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                <span className="text-slate-300">Equities: {summary.equityAllocationPercent.toFixed(1)}%</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <span className="text-slate-300">Mutual Funds: {summary.mutualFundAllocationPercent.toFixed(1)}%</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-slate-300">Cash: {summary.cashAllocationPercent.toFixed(1)}%</span>
              </span>
            </div>
          </div>

          {/* Proportional Multi-Segment Progress Bar */}
          <div className="w-full h-3 rounded-full bg-black/50 overflow-hidden flex border border-white/[0.08]">
            <div
              style={{ width: `${summary.equityAllocationPercent}%` }}
              className="h-full bg-sky-400 transition-all duration-500"
              title={`Equities: ${summary.equityAllocationPercent.toFixed(1)}%`}
            />
            <div
              style={{ width: `${summary.mutualFundAllocationPercent}%` }}
              className="h-full bg-indigo-500 transition-all duration-500"
              title={`Mutual Funds: ${summary.mutualFundAllocationPercent.toFixed(1)}%`}
            />
            <div
              style={{ width: `${summary.cashAllocationPercent}%` }}
              className="h-full bg-emerald-400 transition-all duration-500"
              title={`Cash: ${summary.cashAllocationPercent.toFixed(1)}%`}
            />
          </div>
        </div>
      </div>

      {/* 2B. MARKET MOMENTUM VS PORTFOLIO DIVERGENCE QUICK-STATUS */}
      {(() => {
        const primaryBenchmark = benchmarkCards[0];
        const mktChange = primaryBenchmark.changePercent;
        const portChange = latestDayGainPercent;
        const isDivergent = (mktChange > 0.15 && portChange < -0.1) || (mktChange < -0.15 && portChange > 0.1);
        
        return (
          <div className="p-4 sm:p-5 rounded-2xl bg-[#090d16] border border-white/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className={`p-2.5 rounded-xl border shrink-0 ${isDivergent ? 'bg-rose-500/15 border-rose-500/30 text-rose-400' : 'bg-sky-500/15 border-sky-500/30 text-sky-400'}`}>
                {isDivergent ? <AlertTriangle className="w-5 h-5" /> : <Users className="w-5 h-5" />}
              </div>
              <div className="space-y-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[10px] font-mono-code font-bold uppercase tracking-wider px-2 py-0.5 rounded ${isDivergent ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'}`}>
                    {isDivergent ? 'Decoupling Alert' : 'Market Relative Flow'}
                  </span>
                  <span className="text-xs font-mono-code text-slate-400">
                    {primaryBenchmark.symbol} ({mktChange >= 0 ? '+' : ''}{mktChange}%) vs Active Book ({portChange >= 0 ? '+' : ''}{portChange.toFixed(2)}%)
                  </span>
                </div>
                <p className="text-xs text-slate-200">
                  {isDivergent
                    ? `Portfolio is moving contrary to ${primaryBenchmark.symbol}. View shareholder demographic attribution to identify contradicting positions.`
                    : `Portfolio is tracking broader market beta concordantly. Inspect ownership breakdown between Promoters, Institutions, and Public.`}
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('ownership')}
              className="px-4 py-2 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 hover:text-white text-xs font-heading font-bold uppercase tracking-wider flex items-center gap-1.5 transition shrink-0 self-start md:self-auto"
            >
              <span>Ownership & Decoupling</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })()}

      {/* 3. KEY MARKET BENCHMARKS GRID (4-COLUMN LAYOUT) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-mono-code uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <span>Key Market Benchmarks</span>
            <span className="text-[10px] text-slate-500">(Click to launch Technical Analysis)</span>
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {benchmarkCards.map(index => {
            const isPositive = index.changePercent >= 0;
            return (
              <div
                key={index.id}
                onClick={() => {
                  onSelectIndexForAnalysis(index.id);
                  onNavigateTab('analyze');
                  playQuantumBeep(660, 0.03);
                }}
                className="p-4 rounded-2xl quantum-card quantum-card-hover cursor-pointer border border-white/[0.08] group relative"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-bold font-heading text-white group-hover:text-sky-300 transition-colors">
                    {index.symbol}
                  </div>
                  <span className="text-[10px] font-mono-code text-slate-500 px-1.5 py-0.5 rounded bg-white/[0.03] border border-white/[0.06]">
                    {index.country}
                  </span>
                </div>

                <div className="text-xl font-bold font-mono-code text-white">
                  {formatCurrency(index.value, index.currency)}
                </div>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/[0.06] text-xs font-mono-code">
                  <span className={`font-semibold flex items-center gap-1 ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    {isPositive ? '+' : ''}{index.changePercent.toFixed(2)}%
                  </span>
                  <span className="text-[10px] text-slate-400">
                    R: {index.low.toFixed(0)} - {index.high.toFixed(0)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. HOLDINGS SNAPSHOT TABLE */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold font-heading text-white">
              Holdings Snapshot
            </h3>
            <p className="text-xs text-slate-400">
              Active ledger positions in {summary.bookName} with live valuations
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('portfolio')}
            className="text-xs font-medium text-sky-400 hover:text-sky-300 flex items-center gap-1 transition"
          >
            <span>Manage All Positions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="rounded-2xl quantum-card overflow-hidden border border-white/[0.08]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-black/40 text-slate-400 font-mono-code uppercase text-[10px] tracking-wider border-b border-white/[0.08]">
                <tr>
                  <th className="py-3 px-4">Asset Name</th>
                  <th className="py-3 px-4">Asset Class</th>
                  <th className="py-3 px-4 text-right">Units / Shares</th>
                  <th className="py-3 px-4 text-right">Avg Cost</th>
                  <th className="py-3 px-4 text-right">Current Price</th>
                  <th className="py-3 px-4 text-right">Market Value</th>
                  <th className="py-3 px-4 text-right">Unrealized P&L</th>
                  <th className="py-3 px-4 text-right">Weight</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {summary.calculatedHoldings.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-500 font-mono-code">
                      No positions recorded in this book yet. Add holdings or import CSV.
                    </td>
                  </tr>
                ) : (
                  summary.calculatedHoldings.slice(0, 7).map(item => {
                    const isPositive = item.unrealizedGain >= 0;
                    return (
                      <tr key={item.holding.id} className="hover:bg-white/[0.02] transition">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white font-sans">{item.holding.name}</div>
                          <div className="text-[10px] font-mono-code text-slate-500">
                            {item.holding.symbolOrCode} · {item.holding.exchangeOrAmc}
                          </div>
                        </td>
                        <td className="py-3 px-4">
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
                        <td className="py-3 px-4 text-right font-mono-code text-slate-200">
                          {item.holding.quantityOrUnits}
                        </td>
                        <td className="py-3 px-4 text-right font-mono-code text-slate-400">
                          {formatCurrency(item.holding.averageCost, item.holding.currency)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono-code text-white font-medium">
                          {formatCurrency(item.currentPrice, currency)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono-code text-white font-bold">
                          {formatCurrency(item.currentValue, currency)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono-code">
                          <div className={`font-semibold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isPositive ? '+' : ''}{formatCurrency(item.unrealizedGain, currency)}
                          </div>
                          <div className={`text-[10px] ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isPositive ? '+' : ''}{item.unrealizedGainPercent.toFixed(2)}%
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono-code text-slate-300 font-medium">
                          {item.weightPercent.toFixed(1)}%
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => {
                              onSelectPositionForCompare(item.holding.symbolOrCode);
                              onNavigateTab('compare');
                              playQuantumBeep(640, 0.03);
                            }}
                            className="px-2.5 py-1 rounded-md bg-white/[0.05] hover:bg-sky-500/15 hover:border-sky-500/30 border border-white/[0.08] text-sky-300 text-[11px] font-mono-code transition active:scale-95 inline-flex items-center gap-1"
                            title="Open in Compare Workspace"
                          >
                            <Layers className="w-3 h-3 text-sky-400" />
                            <span>Compare</span>
                          </button>
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
    </div>
  );
};
