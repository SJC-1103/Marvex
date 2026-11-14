import React, { useState } from 'react';
import {
  Users,
  ShieldCheck,
  BarChart3,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { UnderlyingAsset } from '../../types/derivatives';
import { Currency } from '../../types/market';
import { CONTRACT_PERIODS } from '../../data/derivativesData';
import { calculateBlackScholes } from '../../utils/blackScholes';
import { AiFoAnomalyDrawer } from '../modals/AiFoAnomalyDrawer';
import { formatCompactFinancial, formatCurrency } from '../../utils/currency';

interface UnderlyingAnalyticalReportProps {
  underlying: UnderlyingAsset;
  underlyings: UnderlyingAsset[];
  onSelectUnderlying: (underlying: UnderlyingAsset) => void;
  currency: Currency;
  exchangeRate: number;
  onOpenBuilderWithUnderlying?: () => void;
}

export const UnderlyingAnalyticalReport: React.FC<UnderlyingAnalyticalReportProps> = ({
  underlying,
  underlyings,
  onSelectUnderlying,
  currency,
  exchangeRate,
  onOpenBuilderWithUnderlying,
}) => {
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);

  const { shareholding, financials, debtProfile } = underlying;

  const fmt = (val: number, decimals = 2) =>
    formatCurrency(val, currency, underlying.currency, exchangeRate, decimals);

  // Financials & debt figures are stored in Crores (1e7) for INR and Millions (1e6) for USD
  const compactScale = underlying.currency === 'USD' ? 1e6 : 1e7;
  const fmtMacro = (val: number) =>
    formatCompactFinancial(val * compactScale, currency, underlying.currency, exchangeRate);

  const contractRate = underlying.country === 'US' ? 0.045 : 0.065;

  // Sensitivity across 5 contract periods
  const contractSensitivities = CONTRACT_PERIODS.map(period => {
    const bsmAtm = calculateBlackScholes({
      spot: underlying.spot,
      strike: underlying.spot,
      dte: period.dte,
      volatility: period.typicalIv,
      rate: contractRate,
    });
    return {
      period,
      callPrice: bsmAtm.callPrice,
      putPrice: bsmAtm.putPrice,
      callTheta: bsmAtm.callGreeks.theta,
      callVega: bsmAtm.callGreeks.vega,
      bullSpreadCost: Math.round(bsmAtm.callPrice * 0.45),
    };
  });

  return (
    <div className="space-y-6">
      {/* Top Header Card: Asset Summary + Quick Switcher */}
      <div className="p-5 rounded-2xl bg-[#090d19] border border-white/[0.08] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-heading font-bold text-white">
              {underlying.name} ({underlying.symbol})
            </h2>
            <span className="px-2.5 py-0.5 rounded-md bg-white/[0.06] border border-white/[0.1] text-sky-400 font-mono-code text-xs font-bold">
              {underlying.exchange} • Display: {currency}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs text-slate-400">
              Institutional fundamental audit and F&O contract risk profile (Lot: {underlying.lotSize} shares)
            </p>
            <select
              value={underlying.symbol}
              onChange={e => {
                const match = underlyings.find(u => u.symbol === e.target.value);
                if (match) onSelectUnderlying(match);
              }}
              className="bg-black/60 border border-white/[0.12] rounded-xl px-3 py-1 text-xs font-mono-code font-bold text-white"
            >
              {underlyings.map(u => (
                <option key={u.symbol} value={u.symbol}>
                  {u.symbol} ({u.exchange}) — {formatCurrency(u.spot, currency, u.currency, exchangeRate)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Spot & Basis Details */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono-code">
          <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06]">
            <span className="text-slate-400 text-[10px] block">Cash Spot</span>
            <span className="text-base font-bold text-white">{fmt(underlying.spot)}</span>
            <span className={`ml-2 text-xs font-bold ${underlying.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {underlying.changePercent >= 0 ? '+' : ''}{underlying.changePercent}%
            </span>
          </div>

          <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06]">
            <span className="text-slate-400 text-[10px] block">Futures LTP</span>
            <span className="text-base font-bold text-white">{fmt(underlying.futuresLtp)}</span>
            <span className="ml-2 text-xs font-bold text-sky-400">
              Basis: +{fmt(underlying.futuresBasis)}
            </span>
          </div>

          {/* AI Advisor Button */}
          <button
            onClick={() => setIsAiDrawerOpen(true)}
            className="p-3 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 font-mono-code text-xs font-bold transition flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Risk Audit</span>
          </button>
        </div>
      </div>

      {/* Grid: 3 Analytical Pillars (Shareholding, Financials, Debt) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pillar 1: Shareholding Pattern & Float Risk */}
        <div className="p-5 rounded-2xl bg-black/40 border border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-heading font-bold text-white uppercase tracking-wider">
              <Users className="w-4 h-4 text-sky-400" />
              <span>Shareholding Demographics</span>
            </div>
            <span className="text-[10px] font-mono-code text-slate-400">REGULATORY AUDIT</span>
          </div>

          {/* Demographic Breakdown Bars */}
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-mono-code mb-1">
                <span className="text-slate-300">Promoters & Insiders</span>
                <span className="font-bold text-sky-400">{shareholding.promoters}%</span>
              </div>
              <div className="h-2 w-full bg-white/[0.04] rounded-full overflow-hidden">
                <div className="h-full bg-sky-500 rounded-full" style={{ width: `${shareholding.promoters}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono-code mb-1">
                <span className="text-slate-300">Institutional (FII + DII)</span>
                <span className="font-bold text-indigo-400">{shareholding.institutions}%</span>
              </div>
              <div className="h-2 w-full bg-white/[0.04] rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${shareholding.institutions}%` }} />
              </div>
              <div className="flex justify-between text-[10px] font-mono-code text-slate-500 mt-0.5">
                <span>FII: {shareholding.fii}%</span>
                <span>DII: {shareholding.dii}%</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono-code mb-1">
                <span className="text-slate-300">General Public & Retail</span>
                <span className="font-bold text-amber-400">{shareholding.public}%</span>
              </div>
              <div className="h-2 w-full bg-white/[0.04] rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${shareholding.public}%` }} />
              </div>
            </div>
          </div>

          {/* Encumbrance & Pledge */}
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs font-mono-code flex items-center justify-between">
            <span className="text-slate-400">Pledged Promoter Shares</span>
            <span className={`font-bold ${shareholding.pledgedPromoterShares > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {shareholding.pledgedPromoterShares}% {shareholding.pledgedPromoterShares === 0 ? '(Clean)' : '(Encumbered)'}
            </span>
          </div>

          {/* Derivatives Implication */}
          <div className="p-3 rounded-xl bg-sky-500/[0.06] border border-sky-500/20 text-xs text-slate-300 leading-relaxed">
            <span className="font-bold text-sky-300 font-mono-code text-[11px] block mb-1">F&O Liquidity Impact:</span>
            {shareholding.foImplication}
          </div>
        </div>

        {/* Pillar 2: Financial Strength & Volatility Crush Analysis */}
        <div className="p-5 rounded-2xl bg-black/40 border border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-heading font-bold text-white uppercase tracking-wider">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <span>Earnings & Valuation Profile</span>
            </div>
            <span className="text-[10px] font-mono-code text-slate-400">QUARTERLY REPORT</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono-code">
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <span className="text-[10px] text-slate-400 block">Quarterly PAT</span>
              <span className="font-bold text-white">{fmtMacro(financials.patQuarterlyCr)}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <span className="text-[10px] text-slate-400 block">Free Cash Flow</span>
              <span className="font-bold text-emerald-400">{fmtMacro(financials.freeCashFlowCr)}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <span className="text-[10px] text-slate-400 block">Trailing P/E</span>
              <span className="font-bold text-slate-200">{financials.peRatio}x</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <span className="text-[10px] text-slate-400 block">EBITDA Margin</span>
              <span className="font-bold text-sky-400">{financials.ebitdaMarginPercent}%</span>
            </div>
          </div>

          {/* IV Crush Risk Box */}
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between text-xs font-mono-code">
            <span className="text-slate-400">Earnings Date: {financials.nextEarningsDate}</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              financials.ivCrushRisk === 'HIGH' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
            }`}>
              IV CRUSH: {financials.ivCrushRisk}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/20 text-xs text-slate-300 leading-relaxed">
            <span className="font-bold text-emerald-300 font-mono-code text-[11px] block mb-1">Options Pricing Factor:</span>
            {financials.foImpactNotes}
          </div>
        </div>

        {/* Pillar 3: Debt & Solvency Liabilities Profile */}
        <div className="p-5 rounded-2xl bg-black/40 border border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-heading font-bold text-white uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>Debt & Solvency Skew</span>
            </div>
            <span className="text-[10px] font-mono-code text-slate-400">CREDIT AUDIT</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono-code">
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <span className="text-[10px] text-slate-400 block">Total Debt</span>
              <span className="font-bold text-white">{fmtMacro(debtProfile.totalDebtCr)}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <span className="text-[10px] text-slate-400 block">Cash Reserve</span>
              <span className="font-bold text-emerald-400">{fmtMacro(debtProfile.cashAndEquivalentsCr)}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <span className="text-[10px] text-slate-400 block">Debt / Equity</span>
              <span className="font-bold text-slate-200">{debtProfile.debtToEquity}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <span className="text-[10px] text-slate-400 block">Interest Coverage</span>
              <span className="font-bold text-purple-400">{debtProfile.interestCoverageRatio}x</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between text-xs font-mono-code">
            <span className="text-slate-400">Rating: {debtProfile.creditRating}</span>
            <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold text-[10px]">
              PUT SKEW: {debtProfile.solvencyPutSkew}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-purple-500/[0.06] border border-purple-500/20 text-xs text-slate-300 leading-relaxed">
            <span className="font-bold text-purple-300 font-mono-code text-[11px] block mb-1">Solvency Put Mechanics:</span>
            {debtProfile.foImplication}
          </div>
        </div>
      </div>

      {/* Contract Horizon Sensitivity Matrix Table */}
      <div className="rounded-2xl bg-black/40 border border-white/[0.08] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-heading font-bold text-white">
              Contract Period Sensitivity Matrix (7-Day vs 14-Day vs 1-Month vs 2-Month)
            </h3>
            <p className="text-xs text-slate-400">
              Comparative ATM Call premium, theta bleed rate, and defined-risk spread cost across maturities ({currency})
            </p>
          </div>
          {onOpenBuilderWithUnderlying && (
            <button
              onClick={onOpenBuilderWithUnderlying}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono-code text-xs font-bold transition flex items-center gap-1.5"
            >
              <span>Build Strategy for {underlying.symbol}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono-code">
            <thead className="bg-white/[0.02] text-slate-400 border-b border-white/[0.06]">
              <tr>
                <th className="py-2.5 px-3">Contract Horizon</th>
                <th className="py-2.5 px-3">DTE</th>
                <th className="py-2.5 px-3">Benchmark IV</th>
                <th className="py-2.5 px-3">ATM Call Premium</th>
                <th className="py-2.5 px-3">ATM Put Premium</th>
                <th className="py-2.5 px-3">Daily Theta Bleed (θ)</th>
                <th className="py-2.5 px-3">Defined Spread Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {contractSensitivities.map((s, idx) => (
                <tr key={idx} className="hover:bg-white/[0.02]">
                  <td className="py-3 px-3 font-bold text-white">
                    {s.period.label}
                  </td>
                  <td className="py-3 px-3 text-slate-400">
                    {s.period.dte} Days
                  </td>
                  <td className="py-3 px-3 text-purple-300">
                    {s.period.typicalIv}%
                  </td>
                  <td className="py-3 px-3 text-emerald-400 font-bold">
                    {fmt(s.callPrice)}
                  </td>
                  <td className="py-3 px-3 text-sky-400 font-bold">
                    {fmt(s.putPrice)}
                  </td>
                  <td className="py-3 px-3 text-rose-400">
                    -{fmt(Math.abs(s.callTheta))} / day
                  </td>
                  <td className="py-3 px-3 text-indigo-300 font-bold">
                    {fmt(s.bullSpreadCost)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Drawer Modal */}
      <AiFoAnomalyDrawer
        isOpen={isAiDrawerOpen}
        onClose={() => setIsAiDrawerOpen(false)}
        underlying={underlying}
        currency={currency}
        exchangeRate={exchangeRate}
      />
    </div>
  );
};
