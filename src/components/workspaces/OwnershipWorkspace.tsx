import React, { useState, useMemo } from 'react';
import {
  Users,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Building,
  Sparkles,
  BarChart3,
  Layers,
  ArrowRight,
  ShieldCheck,
  Compass,
  Briefcase,
  HelpCircle,
} from 'lucide-react';
import { Stock, MarketIndex, Currency } from '../../types/market';
import { PortfolioBook, PortfolioHolding } from '../../types/portfolio';
import { ShareholdingPattern, StockContradiction } from '../../types/divergence';
import {
  calculatePortfolioShareholding,
  calculateIndianUniverseShareholding,
  calculateMarketDivergence,
} from '../../utils/analytics';
import { formatCompactFinancial, formatCurrency } from '../../utils/currency';

interface OwnershipWorkspaceProps {
  currentBook: PortfolioBook;
  availableStocks: Stock[];
  indices: MarketIndex[];
  currency: Currency;
  exchangeRate: number;
  onInvestigateAnomaly: (contradiction: StockContradiction, benchmarkSymbol: string, benchmarkChange: number) => void;
  onNavigateToStock?: (stockId: string) => void;
}

export const OwnershipWorkspace: React.FC<OwnershipWorkspaceProps> = ({
  currentBook,
  availableStocks,
  indices,
  currency,
  exchangeRate,
  onInvestigateAnomaly,
  onNavigateToStock,
}) => {
  // Mode toggle: 'PORTFOLIO' vs 'INDIA_AGGREGATE' vs 'STOCK'
  const [viewMode, setViewMode] = useState<'PORTFOLIO' | 'INDIA_AGGREGATE' | 'STOCK'>('PORTFOLIO');
  
  // Benchmark selection for market divergence comparison
  const [selectedBenchmarkId, setSelectedBenchmarkId] = useState<string>(() => {
    return indices.find(idx => idx.symbol === 'NIFTY 50')?.id || indices[0]?.id || 'idx-nifty50';
  });

  // Selected stock for individual stock drill-down
  const [selectedStockId, setSelectedStockId] = useState<string>(() => {
    // Default to first stock holding in portfolio, or first available stock
    const firstHoldingSymbol = currentBook.holdings.find(h => h.assetType === 'EQUITY')?.symbolOrCode;
    if (firstHoldingSymbol) {
      const match = availableStocks.find(s => s.symbol.toUpperCase() === firstHoldingSymbol.toUpperCase());
      if (match) return match.id;
    }
    return availableStocks[0]?.id || 'stock-reliance';
  });

  const activeBenchmark = useMemo(() => {
    return indices.find(i => i.id === selectedBenchmarkId) || indices[0] || {
      symbol: 'NIFTY 50',
      changePercent: 0.62,
      value: 24850.30,
    };
  }, [indices, selectedBenchmarkId]);

  // Aggregate portfolio shareholding calculation
  const portfolioOwnershipData = useMemo(() => {
    return calculatePortfolioShareholding(currentBook.holdings, availableStocks);
  }, [currentBook.holdings, availableStocks]);

  // Aggregate Indian NSE universe shareholding calculation
  const indianOwnershipData = useMemo(() => {
    return calculateIndianUniverseShareholding(availableStocks);
  }, [availableStocks]);

  // Specific stock shareholding calculation
  const selectedStock = useMemo(() => {
    return availableStocks.find(s => s.id === selectedStockId) || availableStocks[0];
  }, [availableStocks, selectedStockId]);

  // Active displayed shareholding pattern based on toggle
  const displayedShareholding: ShareholdingPattern = useMemo(() => {
    if (viewMode === 'PORTFOLIO') {
      return portfolioOwnershipData.shareholding;
    }
    if (viewMode === 'INDIA_AGGREGATE') {
      return indianOwnershipData.shareholding;
    }
    return (
      selectedStock?.shareholding || {
        promotersPercent: 50.0,
        institutionalPercent: 35.0,
        publicPercent: 15.0,
        lastAuditedQuarter: 'Q2 FY26',
        majorityHolder: 'PROMOTERS',
      }
    );
  }, [viewMode, portfolioOwnershipData, indianOwnershipData, selectedStock]);

  // Market Divergence Diagnostic
  const divergenceDiagnostic = useMemo(() => {
    return calculateMarketDivergence(currentBook.holdings, availableStocks, {
      symbol: activeBenchmark.symbol,
      changePercent: activeBenchmark.changePercent,
    });
  }, [currentBook.holdings, availableStocks, activeBenchmark]);

  // Check which majority holder label to display
  const getMajorityHolderLabel = (pattern: ShareholdingPattern) => {
    if (pattern.majorityHolder === 'PROMOTERS') {
      return {
        label: 'Company Promoters & Founders',
        percent: pattern.promotersPercent,
        color: 'text-indigo-400',
        bg: 'bg-indigo-500/15 border-indigo-500/30',
        badge: 'bg-indigo-500 text-white',
        desc: 'Substantial promoter concentration provides high strategic stability and long-term capital commitment.',
      };
    }
    if (pattern.majorityHolder === 'INSTITUTIONAL') {
      return {
        label: 'Institutional Investors (FII / DII)',
        percent: pattern.institutionalPercent,
        color: 'text-sky-400',
        bg: 'bg-sky-500/15 border-sky-500/30',
        badge: 'bg-sky-500 text-white',
        desc: 'Heavy institutional governance and market liquidity, with high sensitivity to global fund allocations.',
      };
    }
    return {
      label: 'General Public & Non-Institutional Retail',
      percent: pattern.publicPercent,
      color: 'text-amber-400',
      bg: 'bg-amber-500/15 border-amber-500/30',
      badge: 'bg-amber-500 text-slate-900',
      desc: 'Wide retail float dispersion, offering deep liquidity but elevated sentiment-driven intraday volatility.',
    };
  };

  const majorityMeta = getMajorityHolderLabel(displayedShareholding);

  return (
    <div className="space-y-8 animate-fade-up">
      {/* Workspace Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono-code font-bold uppercase tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/20">
              Microstructure & Governance
            </span>
            <span className="text-xs text-slate-400 font-mono-code">
              Book: {currentBook.name}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-white tracking-tight">
            Shareholder Demographics & Market Decoupling
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-3xl">
            Evaluate who holds majority control across your investments, track real-time market divergence against broad indices, and isolate contradicting stocks.
          </p>
        </div>

        {/* Global Benchmark Selector */}
        <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-xl border border-white/[0.08] self-start md:self-center">
          <span className="text-[11px] font-mono-code text-slate-400 px-2 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-sky-400" /> Benchmark:
          </span>
          <select
            value={selectedBenchmarkId}
            onChange={(e) => setSelectedBenchmarkId(e.target.value)}
            className="bg-[#0b101b] text-xs font-mono-code text-white border border-white/10 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-sky-500"
          >
            {indices.map(idx => (
              <option key={idx.id} value={idx.id}>
                {idx.symbol} ({idx.changePercent >= 0 ? '+' : ''}{idx.changePercent}%)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 1. Market vs. Portfolio Movement Divergence Monitor */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-heading font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-400" />
            Market vs. Portfolio Relative Momentum
          </h2>
          <span className="text-xs font-mono-code text-slate-400">
            Evaluating {currentBook.holdings.length} holding(s) against {activeBenchmark.symbol}
          </span>
        </div>

        {/* Diagnostic Banner */}
        <div
          className={`p-5 rounded-2xl border transition relative overflow-hidden ${
            divergenceDiagnostic.hasDivergence
              ? 'bg-rose-500/[0.07] border-rose-500/30 shadow-[0_0_30px_rgba(244,63,94,0.1)]'
              : 'bg-[#090d16] border-white/[0.08]'
          }`}
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Left: Headline & Description */}
            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                {divergenceDiagnostic.hasDivergence ? (
                  <span className="px-2.5 py-1 rounded-md text-xs font-mono-code font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Market Decoupling Warning: {divergenceDiagnostic.divergenceSeverity} Divergence
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-md text-xs font-mono-code font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Portfolio Concordant with Benchmark
                  </span>
                )}
                <span className="text-xs text-slate-400 font-mono-code">
                  Benchmark: {activeBenchmark.symbol} ({activeBenchmark.changePercent >= 0 ? '+' : ''}{activeBenchmark.changePercent}%)
                </span>
              </div>

              <h3 className="text-base sm:text-lg font-heading font-bold text-white">
                {divergenceDiagnostic.summaryHeadline}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                {divergenceDiagnostic.hasDivergence
                  ? divergenceDiagnostic.divergenceType === 'MARKET_UP_PORTFOLIO_DOWN'
                    ? `The broader market benchmark is rallying (+${activeBenchmark.changePercent}%), yet your active portfolio book is declining (${divergenceDiagnostic.portfolioChangePercent}%). This decouples your returns from the index due to specific counter-trend positions.`
                    : `The broader market benchmark is declining (${activeBenchmark.changePercent}%), yet your portfolio is resilient (+${divergenceDiagnostic.portfolioChangePercent}%). Specific holdings are displaying defensive strength.`
                  : `Your portfolio direction aligns with broad market momentum (${divergenceDiagnostic.portfolioChangePercent}% vs benchmark ${activeBenchmark.changePercent}%). No systemic decoupling detected.`}
              </p>
            </div>

            {/* Right: Comparative Stat Badges */}
            <div className="flex items-center gap-4 shrink-0">
              {/* Benchmark Stat */}
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.08] text-center min-w-[130px]">
                <span className="text-[10px] font-mono-code uppercase text-slate-400 block mb-1">
                  {activeBenchmark.symbol} Move
                </span>
                <div
                  className={`text-lg font-bold font-mono-code flex items-center justify-center gap-1 ${
                    activeBenchmark.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {activeBenchmark.changePercent >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {activeBenchmark.changePercent >= 0 ? '+' : ''}{activeBenchmark.changePercent}%
                </div>
                <span className="text-[10px] text-slate-500 font-mono-code uppercase">
                  {divergenceDiagnostic.marketState}
                </span>
              </div>

              {/* Portfolio Stat */}
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.08] text-center min-w-[130px]">
                <span className="text-[10px] font-mono-code uppercase text-slate-400 block mb-1">
                  Portfolio Day Move
                </span>
                <div
                  className={`text-lg font-bold font-mono-code flex items-center justify-center gap-1 ${
                    divergenceDiagnostic.portfolioChangePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {divergenceDiagnostic.portfolioChangePercent >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {divergenceDiagnostic.portfolioChangePercent >= 0 ? '+' : ''}{divergenceDiagnostic.portfolioChangePercent}%
                </div>
                <span className="text-[10px] text-slate-500 font-mono-code uppercase">
                  {divergenceDiagnostic.portfolioState}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Shareholder Demographics Interactive Bar Graph Section */}
      <div className="p-6 rounded-2xl bg-[#090d16] border border-white/[0.08] space-y-6">
        {/* Toggle & Selector Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
          <div className="space-y-1">
            <h2 className="text-base font-heading font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-400" />
              Equity Shareholder Demographic Distribution
            </h2>
            <p className="text-xs text-slate-400">
              Visualize equity ownership between Company Promoters, Institutional Investors (FII/DII), and General Public.
            </p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="p-1 rounded-xl bg-black/60 border border-white/10 flex flex-wrap items-center gap-1">
              <button
                onClick={() => setViewMode('PORTFOLIO')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono-code font-semibold transition ${
                  viewMode === 'PORTFOLIO'
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Entire Portfolio Aggregate
              </button>
              <button
                onClick={() => setViewMode('INDIA_AGGREGATE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono-code font-semibold transition ${
                  viewMode === 'INDIA_AGGREGATE'
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Indian NSE Aggregate ({indianOwnershipData.indianStocks.length})
              </button>
              <button
                onClick={() => setViewMode('STOCK')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono-code font-semibold transition ${
                  viewMode === 'STOCK'
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Specific Stock
              </button>
            </div>

            {/* If specific stock mode is active, show stock dropdown */}
            {viewMode === 'STOCK' && (
              <select
                value={selectedStockId}
                onChange={(e) => setSelectedStockId(e.target.value)}
                className="bg-[#0b101b] text-xs font-mono-code text-white border border-white/10 rounded-lg px-3 py-1.5 focus:outline-none focus:border-sky-500"
              >
                {availableStocks.map(stock => (
                  <option key={stock.id} value={stock.id}>
                    {stock.symbol} ({stock.exchange}) — {stock.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Majority Holder Callout Banner */}
        <div className={`p-4 sm:p-5 rounded-2xl border ${majorityMeta.bg} flex flex-col md:flex-row md:items-center justify-between gap-4`}>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono-code uppercase font-bold tracking-wider text-slate-400">
                Primary Majority Shareholder:
              </span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-mono-code font-bold uppercase ${majorityMeta.badge}`}>
                {displayedShareholding.majorityHolder}
              </span>
            </div>
            <div className={`text-xl font-heading font-extrabold ${majorityMeta.color}`}>
              {majorityMeta.label} Holds {majorityMeta.percent}% of Outstanding Shares
            </div>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              {majorityMeta.desc}
            </p>
          </div>

          <div className="text-right shrink-0">
            <div className="text-[10px] font-mono-code uppercase text-slate-400">
              Audit Period / Provenance
            </div>
            <div className="text-xs font-mono-code font-bold text-white mt-0.5">
              {displayedShareholding.lastAuditedQuarter}
            </div>
            <div className="text-[10px] text-slate-500 font-mono-code mt-0.5">
              {viewMode === 'PORTFOLIO'
                ? `Weighted across ${portfolioOwnershipData.evaluatedPositionsCount} portfolio equities`
                : viewMode === 'INDIA_AGGREGATE'
                ? `Market-cap weighted (${formatCompactFinancial(indianOwnershipData.totalMarketCapInr, currency, 'INR', exchangeRate)} combined)`
                : `${selectedStock.exchange} Bhavcopy / Regulatory Filing`}
            </div>
          </div>
        </div>

        {/* Proportional Stacked Bar Graph (Interactive) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-mono-code text-slate-400">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>

          {/* Bar track */}
          <div className="h-7 w-full rounded-xl overflow-hidden flex bg-slate-900/80 p-1 border border-white/10 gap-1 shadow-inner">
            {/* 1. Promoters Bar */}
            <div
              style={{ width: `${displayedShareholding.promotersPercent}%` }}
              className="h-full bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-lg flex items-center justify-center transition-all duration-500 relative group cursor-pointer"
              title={`Company Promoters: ${displayedShareholding.promotersPercent}%`}
            >
              {displayedShareholding.promotersPercent >= 12 && (
                <span className="text-[11px] font-mono-code font-extrabold text-white drop-shadow">
                  {displayedShareholding.promotersPercent}%
                </span>
              )}
            </div>

            {/* 2. Institutional Bar */}
            <div
              style={{ width: `${displayedShareholding.institutionalPercent}%` }}
              className="h-full bg-gradient-to-r from-sky-600 to-sky-400 rounded-lg flex items-center justify-center transition-all duration-500 relative group cursor-pointer"
              title={`Institutional Investors: ${displayedShareholding.institutionalPercent}%`}
            >
              {displayedShareholding.institutionalPercent >= 12 && (
                <span className="text-[11px] font-mono-code font-extrabold text-white drop-shadow">
                  {displayedShareholding.institutionalPercent}%
                </span>
              )}
            </div>

            {/* 3. General Public Bar */}
            <div
              style={{ width: `${displayedShareholding.publicPercent}%` }}
              className="h-full bg-gradient-to-r from-amber-600 to-amber-500 rounded-lg flex items-center justify-center transition-all duration-500 relative group cursor-pointer"
              title={`General Public / Retail: ${displayedShareholding.publicPercent}%`}
            >
              {displayedShareholding.publicPercent >= 12 && (
                <span className="text-[11px] font-mono-code font-extrabold text-slate-950 drop-shadow">
                  {displayedShareholding.publicPercent}%
                </span>
              )}
            </div>
          </div>

          {/* Detailed Demographic Legend Cards (3-Column Grid) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* Card 1: Promoters */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-indigo-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-heading font-bold text-indigo-300 uppercase tracking-wider">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  Company Promoters
                </span>
                <span className="text-sm font-mono-code font-extrabold text-white">
                  {displayedShareholding.promotersPercent}%
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Founders, executive promoters, and parent operating group entities holding core equity stakes.
              </p>
              <div className="pt-1 border-t border-white/[0.04] flex items-center justify-between text-[10px] font-mono-code text-slate-500">
                <span>Pledged Shares:</span>
                <span className="text-slate-300 font-bold">
                  {displayedShareholding.pledgedPromoterSharesPercent ?? 0.0}%
                </span>
              </div>
            </div>

            {/* Card 2: Institutional */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-sky-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-heading font-bold text-sky-300 uppercase tracking-wider">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                  Institutions (FII/DII)
                </span>
                <span className="text-sm font-mono-code font-extrabold text-white">
                  {displayedShareholding.institutionalPercent}%
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Foreign Institutional Investors (FIIs), domestic mutual funds (DIIs), banks, and sovereign wealth trusts.
              </p>
              <div className="pt-1 border-t border-white/[0.04] flex items-center justify-between text-[10px] font-mono-code text-slate-500">
                <span>FII: {displayedShareholding.fiiPercent ?? 0}%</span>
                <span>•</span>
                <span>DII: {displayedShareholding.diiPercent ?? 0}%</span>
              </div>
            </div>

            {/* Card 3: General Public */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-amber-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-heading font-bold text-amber-300 uppercase tracking-wider">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  General Public / Retail
                </span>
                <span className="text-sm font-mono-code font-extrabold text-white">
                  {displayedShareholding.publicPercent}%
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Individual retail investors, non-institutional corporate bodies, and high-net-worth retail accounts.
              </p>
              <div className="pt-1 border-t border-white/[0.04] flex items-center justify-between text-[10px] font-mono-code text-slate-500">
                <span>Free Float Liquidity:</span>
                <span className="text-slate-300 font-bold">Unrestricted</span>
              </div>
            </div>
          </div>
        </div>

        {/* Indian NSE Companies Shareholding Matrix (Visible in Indian NSE Aggregate mode) */}
        {viewMode === 'INDIA_AGGREGATE' && (
          <div className="pt-4 border-t border-white/[0.06] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-heading font-bold text-white uppercase tracking-wider">
                Tracked Indian NSE Companies Ownership Matrix ({indianOwnershipData.indianStocks.length} F&O Equities)
              </h3>
              <span className="text-[11px] font-mono-code text-slate-400">
                Click any company to inspect or analyze
              </span>
            </div>
            <div className="overflow-x-auto rounded-xl border border-white/[0.06] bg-black/40">
              <table className="w-full text-left text-xs font-mono-code">
                <thead className="bg-white/[0.02] text-slate-400 border-b border-white/[0.06]">
                  <tr>
                    <th className="py-2.5 px-3">Symbol</th>
                    <th className="py-2.5 px-3">Price</th>
                    <th className="py-2.5 px-3">Market Cap</th>
                    <th className="py-2.5 px-3">Promoters</th>
                    <th className="py-2.5 px-3">Institutions (FII / DII)</th>
                    <th className="py-2.5 px-3">Public</th>
                    <th className="py-2.5 px-3">Pledged</th>
                    <th className="py-2.5 px-3">Majority Holder</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {indianOwnershipData.indianStocks.map(stock => {
                    const sh = stock.shareholding!;
                    return (
                      <tr key={stock.id} className="hover:bg-white/[0.03] transition">
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-white">{stock.symbol}</div>
                          <div className="text-[10px] text-slate-500">{stock.sector}</div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-200">
                          {formatCurrency(stock.price, currency, stock.baseCurrency, exchangeRate)}
                        </td>
                        <td className="py-2.5 px-3 text-slate-300">
                          {formatCompactFinancial(stock.marketCap, currency, stock.baseCurrency, exchangeRate)}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-indigo-400">{sh.promotersPercent}%</td>
                        <td className="py-2.5 px-3 text-sky-400">
                          <span className="font-bold">{sh.institutionalPercent}%</span>
                          <span className="text-[10px] text-slate-500 ml-1">
                            ({sh.fiiPercent ?? 0}/{sh.diiPercent ?? 0})
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-bold text-amber-400">{sh.publicPercent}%</td>
                        <td className={`py-2.5 px-3 ${(sh.pledgedPromoterSharesPercent ?? 0) > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {(sh.pledgedPromoterSharesPercent ?? 0).toFixed(1)}%
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white/[0.06] text-slate-200">
                            {sh.majorityHolder}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedStockId(stock.id);
                                setViewMode('STOCK');
                              }}
                              className="text-[11px] text-sky-400 hover:text-sky-300 font-bold"
                            >
                              Inspect
                            </button>
                            {onNavigateToStock && (
                              <button
                                onClick={() => onNavigateToStock(stock.id)}
                                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold"
                              >
                                Analyze →
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 3. Contradicting Stocks & Driver Attribution Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-heading font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              Contradicting Stocks Within Active Portfolio ({divergenceDiagnostic.contradictingStocks.length})
            </h2>
            <p className="text-xs text-slate-400">
              Holdings decoupling from the {activeBenchmark.symbol} trend with demographic accountability attribution.
            </p>
          </div>

          <span className="text-xs font-mono-code text-slate-400 self-start sm:self-auto">
            {divergenceDiagnostic.concordantStocksCount} holding(s) concordant with market
          </span>
        </div>

        {divergenceDiagnostic.contradictingStocks.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center space-y-2">
            <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto" />
            <h3 className="text-sm font-heading font-bold text-white">
              No Contradicting Stocks Detected
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              All equity holdings in this portfolio book are moving generally in harmony with {activeBenchmark.symbol} ({activeBenchmark.changePercent >= 0 ? '+' : ''}{activeBenchmark.changePercent}%).
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {divergenceDiagnostic.contradictingStocks.map((contradiction) => {
              const isStockDown = contradiction.stockChangePercent < 0;

              return (
                <div
                  key={contradiction.stockId}
                  className="p-5 rounded-2xl bg-[#090d16] border border-white/[0.08] hover:border-white/20 transition space-y-4"
                >
                  {/* Top Row: Symbol, Price, and Spread */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-heading font-bold text-sm text-white">
                        {contradiction.symbol.slice(0, 3)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-heading font-extrabold text-white">
                            {contradiction.symbol}
                          </h3>
                          <span className="text-xs text-slate-400 font-normal">
                            ({contradiction.name})
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono-code bg-white/5 text-slate-300">
                            {contradiction.exchangeOrAmc}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 font-mono-code">
                          Current Price: {formatCurrency(contradiction.currentPrice, currency, contradiction.exchangeOrAmc === 'NASDAQ' || contradiction.exchangeOrAmc === 'NYSE' ? 'USD' : 'INR', exchangeRate)}
                        </div>
                      </div>
                    </div>

                    {/* Performance Divergence Badges */}
                    <div className="flex items-center gap-3 self-start sm:self-auto">
                      <div className="text-right">
                        <span className="text-[10px] font-mono-code uppercase text-slate-500 block">
                          Stock Move
                        </span>
                        <div
                          className={`text-sm font-bold font-mono-code flex items-center gap-1 ${
                            isStockDown ? 'text-rose-400' : 'text-emerald-400'
                          }`}
                        >
                          {isStockDown ? <TrendingDown className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
                          {contradiction.stockChangePercent >= 0 ? '+' : ''}{contradiction.stockChangePercent}%
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-mono-code uppercase text-slate-500 block">
                          Divergence Spread
                        </span>
                        <div className="text-sm font-bold font-mono-code text-amber-300">
                          {contradiction.divergenceSpreadPercent}%
                        </div>
                      </div>

                      {/* Action Button: AI Investigation */}
                      <button
                        onClick={() =>
                          onInvestigateAnomaly(
                            contradiction,
                            activeBenchmark.symbol,
                            activeBenchmark.changePercent
                          )
                        }
                        className="px-3.5 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 hover:text-white text-xs font-heading font-bold uppercase tracking-wider flex items-center gap-2 transition ml-2 shadow-sm"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                        <span>Investigate with AI</span>
                      </button>
                    </div>
                  </div>

                  {/* Middle Row: Shareholder Demographics Bar for this specific stock */}
                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.04] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-mono-code flex items-center gap-1.5">
                        <Users className="w-3 h-3 text-sky-400" />
                        Shareholder Demographics:
                      </span>
                      <span className="text-[11px] font-mono-code text-slate-400">
                        Majority Holder: <strong className="text-white">{contradiction.shareholding.majorityHolder}</strong>
                      </span>
                    </div>

                    {/* Mini Stacked Bar */}
                    <div className="h-2 w-full rounded-full overflow-hidden flex bg-slate-800">
                      <div
                        style={{ width: `${contradiction.shareholding.promotersPercent}%` }}
                        className="bg-indigo-500 h-full"
                      />
                      <div
                        style={{ width: `${contradiction.shareholding.institutionalPercent}%` }}
                        className="bg-sky-500 h-full"
                      />
                      <div
                        style={{ width: `${contradiction.shareholding.publicPercent}%` }}
                        className="bg-amber-500 h-full"
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono-code text-slate-400">
                      <span>Promoters: <strong className="text-slate-200">{contradiction.shareholding.promotersPercent}%</strong></span>
                      <span>Institutions: <strong className="text-slate-200">{contradiction.shareholding.institutionalPercent}%</strong></span>
                      <span>Public / Retail: <strong className="text-slate-200">{contradiction.shareholding.publicPercent}%</strong></span>
                    </div>
                  </div>

                  {/* Bottom Row: Responsible Stockholder Determination */}
                  <div className="p-3 rounded-xl bg-amber-500/[0.04] border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="space-y-0.5">
                      <div className="text-[11px] font-mono-code text-amber-300 font-bold uppercase flex items-center gap-1.5">
                        <span>Responsible Demographic Driver:</span>
                        <span className="text-white bg-amber-500/20 px-2 py-0.5 rounded">
                          {contradiction.responsibleDemographic}
                        </span>
                      </div>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        {contradiction.driverExplanation}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedStockId(contradiction.stockId);
                        setViewMode('STOCK');
                      }}
                      className="text-[11px] font-mono-code text-sky-400 hover:text-sky-300 flex items-center gap-1 self-start sm:self-auto shrink-0 transition"
                    >
                      <span>Drill Down</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
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
