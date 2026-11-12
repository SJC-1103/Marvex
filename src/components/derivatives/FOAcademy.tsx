import React from 'react';
import { BookOpen, ShieldAlert, Award, TrendingUp, AlertTriangle, Scale, CheckCircle2 } from 'lucide-react';

export const FOAcademy: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Academy Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-[#090d19] border border-white/[0.08] space-y-2">
        <div className="flex items-center gap-2 text-indigo-400 font-mono-code text-xs font-bold uppercase tracking-wider">
          <BookOpen className="w-4 h-4" />
          <span>Institutional Knowledge Base</span>
        </div>
        <h2 className="text-xl font-heading font-bold text-white">
          F&O Derivatives & Risk Academy
        </h2>
        <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
          Comprehensive curriculum on Indian & US derivatives markets: Black-Scholes mechanics, SEBI risk audits, leverage multiplier math, and defined-risk hedging strategies.
        </p>
      </div>

      {/* SEBI 9/10 Loss Audit Notice Card */}
      <div className="p-5 rounded-2xl bg-amber-500/[0.07] border border-amber-500/30 space-y-2 relative overflow-hidden">
        <div className="flex items-center gap-2 text-amber-400 font-heading font-bold text-sm">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>SEBI Regulatory Study: 9 out of 10 Individual F&O Traders Incur Net Losses</span>
        </div>
        <p className="text-xs text-slate-200 leading-relaxed">
          According to comprehensive empirical research published by the Securities and Exchange Board of India (SEBI), approximately <strong>89% to 93% of individual retail traders in equity derivatives incur consistent net financial losses</strong>, primarily due to excessive leverage, rapid time-decay (Theta bleed) on naked out-of-the-money call/put options, and unhedged gap-risk exposure.
        </p>
        <div className="text-[11px] font-mono-code text-amber-300 pt-1">
          Rule #1 of Institutional F&O: Avoid naked shorting; always deploy Defined-Risk spreads with pre-calculated max loss thresholds.
        </div>
      </div>

      {/* 4 Core Pillars of F&O */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Module 1: The Greeks Demystified */}
        <div className="p-5 rounded-2xl bg-black/40 border border-white/[0.08] space-y-3">
          <h3 className="text-sm font-heading font-bold text-sky-400 flex items-center gap-2">
            <Scale className="w-4 h-4" />
            <span>1. The Option Greeks Demystified</span>
          </h3>
          <ul className="space-y-2 text-xs text-slate-300">
            <li className="flex items-start gap-2">
              <strong className="text-white font-mono-code shrink-0">Delta (Δ):</strong>
              <span>Rate of change of option price per ₹1 move in spot. ATM options have ~0.50 delta.</span>
            </li>
            <li className="flex items-start gap-2">
              <strong className="text-white font-mono-code shrink-0">Gamma (Γ):</strong>
              <span>Acceleration of Delta per ₹1 move. Highest at ATM near expiration, causing "gamma pin risk".</span>
            </li>
            <li className="flex items-start gap-2">
              <strong className="text-white font-mono-code shrink-0">Theta (θ):</strong>
              <span>Time decay in rupees per day. Accelerates exponentially in the final 14 days before expiration.</span>
            </li>
            <li className="flex items-start gap-2">
              <strong className="text-white font-mono-code shrink-0">Vega (ν):</strong>
              <span>Sensitivity to a 1% shift in Implied Volatility (IV). Crucial ahead of earnings results.</span>
            </li>
          </ul>
        </div>

        {/* Module 2: Buyers vs Sellers */}
        <div className="p-5 rounded-2xl bg-black/40 border border-white/[0.08] space-y-3">
          <h3 className="text-sm font-heading font-bold text-emerald-400 flex items-center gap-2">
            <Award className="w-4 h-4" />
            <span>2. Option Buyers vs. Option Sellers</span>
          </h3>
          <ul className="space-y-2 text-xs text-slate-300">
            <li className="flex items-start gap-2">
              <strong className="text-white font-mono-code shrink-0">Option Buyer:</strong>
              <span>Pays premium (debit). Limited loss (premium paid), theoretically unlimited profit, but combats negative theta daily. Low probability of profit (POP ~30-35%).</span>
            </li>
            <li className="flex items-start gap-2">
              <strong className="text-white font-mono-code shrink-0">Option Seller:</strong>
              <span>Collects premium (credit). Requires large exchange margin. High probability of profit (POP ~65-70%), but faces unlimited tail risk unless hedged with a protective wing.</span>
            </li>
          </ul>
        </div>

        {/* Module 3: Lot Sizing & Leverage Multipliers */}
        <div className="p-5 rounded-2xl bg-black/40 border border-white/[0.08] space-y-3">
          <h3 className="text-sm font-heading font-bold text-purple-400 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            <span>3. Lot Sizing & Contract Notional Value</span>
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            In Indian derivatives (NSE), contracts trade in standardized lot sizes:
          </p>
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] font-mono-code text-xs space-y-1">
            <div>RELIANCE: 250 shares / lot (Notional: ~₹7.45 Lakhs)</div>
            <div>TCS: 175 shares / lot (Notional: ~₹7.21 Lakhs)</div>
            <div>HDFCBANK: 550 shares / lot (Notional: ~₹9.24 Lakhs)</div>
          </div>
          <p className="text-[11px] text-slate-400">
            A small ₹20 adverse move in spot creates a ₹5,000 to ₹11,000 cash fluctuation per lot. Always size positions relative to total portfolio NAV.
          </p>
        </div>

        {/* Module 4: Defined-Risk Hedging Playbook */}
        <div className="p-5 rounded-2xl bg-black/40 border border-white/[0.08] space-y-3">
          <h3 className="text-sm font-heading font-bold text-indigo-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>4. Defined-Risk Hedging Playbook</span>
          </h3>
          <ul className="space-y-1.5 text-xs text-slate-300">
            <li>• <strong>Vertical Spreads:</strong> Buy 1 strike and sell 1 higher/lower strike to cap both max profit and max loss.</li>
            <li>• <strong>Iron Condors:</strong> Combine an OTM Bull Put Spread and an OTM Bear Call Spread to harvest range-bound theta.</li>
            <li>• <strong>Protective Collar:</strong> Hold underlying stock + buy OTM Put + sell OTM Call to establish full downside immunity.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
