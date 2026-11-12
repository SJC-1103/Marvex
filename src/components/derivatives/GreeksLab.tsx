import React, { useState } from 'react';
import { Sliders, RotateCcw, Activity, ShieldCheck, Zap, Sparkles } from 'lucide-react';
import { calculateBlackScholes } from '../../utils/blackScholes';
import { UnderlyingAsset } from '../../types/derivatives';
import { AiFoAnomalyDrawer } from '../modals/AiFoAnomalyDrawer';
import { playQuantumBeep } from '../../utils/audio';

interface GreeksLabProps {
  underlying: UnderlyingAsset;
}

export const GreeksLab: React.FC<GreeksLabProps> = ({ underlying }) => {
  const [spot, setSpot] = useState<number>(underlying.spot);
  const [strike, setStrike] = useState<number>(underlying.spot);
  const [dte, setDte] = useState<number>(30);
  const [iv, setIv] = useState<number>(24);
  const [rate, setRate] = useState<number>(6.5); // %
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);

  const bsm = calculateBlackScholes({
    spot,
    strike,
    dte,
    volatility: iv,
    rate: rate / 100,
  });

  const handleReset = () => {
    setSpot(underlying.spot);
    setStrike(underlying.spot);
    setDte(30);
    setIv(24);
    setRate(6.5);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-[#090d19] border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-heading font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-400" />
            <span>Black-Scholes-Merton Greeks Sensitivity Lab</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time partial derivatives laboratory for European Call & Put contracts ({underlying.symbol})
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setIsAiDrawerOpen(true);
              playQuantumBeep(720, 0.04);
            }}
            className="px-3.5 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 font-mono-code text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
            title="Diagnose theta decay curves and gamma acceleration risk with AI"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>AI Greek Diagnostic</span>
          </button>
          <button
            onClick={handleReset}
            className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 font-mono-code text-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Interactive Input Sliders */}
        <div className="p-5 rounded-2xl bg-black/40 border border-white/[0.08] space-y-5">
          <h3 className="text-xs font-heading font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-4 h-4 text-sky-400" />
            <span>Pricing Parameters</span>
          </h3>

          {/* Spot Price */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono-code">
              <span className="text-slate-400">Underlying Spot (S):</span>
              <span className="font-bold text-white">₹{spot.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min={Math.round(underlying.spot * 0.7)}
              max={Math.round(underlying.spot * 1.3)}
              step={underlying.strikeInterval}
              value={spot}
              onChange={e => setSpot(parseFloat(e.target.value))}
              className="w-full accent-sky-400 cursor-pointer"
            />
          </div>

          {/* Strike Price */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono-code">
              <span className="text-slate-400">Strike Price (K):</span>
              <span className="font-bold text-amber-400">₹{strike.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min={Math.round(underlying.spot * 0.7)}
              max={Math.round(underlying.spot * 1.3)}
              step={underlying.strikeInterval}
              value={strike}
              onChange={e => setStrike(parseFloat(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
          </div>

          {/* Days to Expiration (DTE) */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono-code">
              <span className="text-slate-400">Days to Expiration (T):</span>
              <span className="font-bold text-indigo-400">{dte} Days</span>
            </div>
            <input
              type="range"
              min="1"
              max="90"
              value={dte}
              onChange={e => setDte(parseInt(e.target.value, 10))}
              className="w-full accent-indigo-400 cursor-pointer"
            />
          </div>

          {/* Implied Volatility (IV) */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono-code">
              <span className="text-slate-400">Implied Volatility (σ):</span>
              <span className="font-bold text-purple-400">{iv}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="80"
              value={iv}
              onChange={e => setIv(parseInt(e.target.value, 10))}
              className="w-full accent-purple-400 cursor-pointer"
            />
          </div>

          {/* Risk-free interest rate */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono-code">
              <span className="text-slate-400">Risk-Free Rate (r):</span>
              <span className="font-bold text-slate-300">{rate}%</span>
            </div>
            <input
              type="range"
              min="2"
              max="12"
              step="0.25"
              value={rate}
              onChange={e => setRate(parseFloat(e.target.value))}
              className="w-full accent-slate-400 cursor-pointer"
            />
          </div>
        </div>

        {/* Right 2 Columns: Side-by-Side Call vs Put Greeks Display */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Call Option Container */}
          <div className="p-5 rounded-2xl bg-emerald-500/[0.04] border border-emerald-500/25 space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
              <div>
                <h3 className="font-heading font-bold text-emerald-400 text-sm">
                  EUROPEAN CALL OPTION
                </h3>
                <span className="text-[10px] font-mono-code text-slate-400">Right to buy</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono-code text-slate-400 block">Theor. Price</span>
                <span className="text-xl font-bold font-mono-code text-white">₹{bsm.callPrice.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-2.5 text-xs font-mono-code">
              {/* Call Delta */}
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/[0.06] flex justify-between items-center group relative cursor-help">
                <span className="text-slate-400 border-b border-dotted border-white/20">Delta (Δ = ∂C/∂S):</span>
                <span className="font-bold text-emerald-400 text-sm">+{bsm.callGreeks.delta}</span>
                <div className="absolute left-0 top-full mt-1 hidden group-hover:block z-50 w-72 p-2.5 rounded-xl bg-[#0c1222] border border-emerald-500/30 shadow-2xl text-[10px] text-slate-300 pointer-events-none">
                  <div className="font-bold text-emerald-300">Call Delta: Δ = N(d₁)</div>
                  <div>Hedge ratio: Price changes by ₹{bsm.callGreeks.delta} for each ₹1 increase in underlying.</div>
                  <div className="text-[9px] text-slate-400 mt-1">ATM ≈ +0.50 | Deep ITM → +1.00 | Far OTM → 0.00</div>
                </div>
              </div>

              {/* Call Gamma */}
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/[0.06] flex justify-between items-center group relative cursor-help">
                <span className="text-slate-400 border-b border-dotted border-white/20">Gamma (Γ = ∂²C/∂S²):</span>
                <span className="font-bold text-sky-400 text-sm">{bsm.callGreeks.gamma}</span>
                <div className="absolute left-0 top-full mt-1 hidden group-hover:block z-50 w-72 p-2.5 rounded-xl bg-[#0c1222] border border-sky-500/30 shadow-2xl text-[10px] text-slate-300 pointer-events-none">
                  <div className="font-bold text-sky-300">Gamma: Γ = N'(d₁) / (S · σ · √T)</div>
                  <div>Curvature: Delta shifts by {bsm.callGreeks.gamma} for each ₹1 move in spot. Peaked at ATM.</div>
                </div>
              </div>

              {/* Call Theta */}
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/[0.06] flex justify-between items-center group relative cursor-help">
                <span className="text-slate-400 border-b border-dotted border-rose-400/30">Theta (θ = -∂C/∂t):</span>
                <span className="font-bold text-rose-400 text-sm">-₹{Math.abs(bsm.callGreeks.theta).toFixed(2)} / day</span>
                <div className="absolute left-0 top-full mt-1 hidden group-hover:block z-50 w-72 p-2.5 rounded-xl bg-[#0c1222] border border-rose-500/30 shadow-2xl text-[10px] text-slate-300 pointer-events-none">
                  <div className="font-bold text-rose-300">Call Theta (Daily Decay):</div>
                  <div className="text-[9px] font-mono-code text-rose-400 my-0.5">θ = -[S·N'(d₁)·σ]/(2√T) - r·K·e^(-rT)·N(d₂)</div>
                  <div>Options lose ₹{Math.abs(bsm.callGreeks.theta).toFixed(2)} every 24 hours strictly due to the passage of time.</div>
                </div>
              </div>

              {/* Call Vega */}
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/[0.06] flex justify-between items-center group relative cursor-help">
                <span className="text-slate-400 border-b border-dotted border-purple-400/30">Vega (ν = ∂C/∂σ):</span>
                <span className="font-bold text-purple-400 text-sm">₹{bsm.callGreeks.vega.toFixed(2)}</span>
                <div className="absolute left-0 top-full mt-1 hidden group-hover:block z-50 w-72 p-2.5 rounded-xl bg-[#0c1222] border border-purple-500/30 shadow-2xl text-[10px] text-slate-300 pointer-events-none">
                  <div className="font-bold text-purple-300">Vega: ν = S · √T · N'(d₁) / 100</div>
                  <div>Gain/loss in option price if Implied Volatility rises by 1.00 percentage point.</div>
                </div>
              </div>

              {/* Call Rho */}
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/[0.06] flex justify-between items-center group relative cursor-help">
                <span className="text-slate-400 border-b border-dotted border-white/20">Rho (ρ = ∂C/∂r):</span>
                <span className="font-bold text-slate-300 text-sm">{bsm.callGreeks.rho}</span>
                <div className="absolute left-0 top-full mt-1 hidden group-hover:block z-50 w-72 p-2.5 rounded-xl bg-[#0c1222] border border-white/10 shadow-2xl text-[10px] text-slate-300 pointer-events-none">
                  <div className="font-bold text-slate-200">Call Rho: ρ = K · T · e^(-rT) · N(d₂) / 100</div>
                  <div>Sensitivity to a 100 bps (1%) increase in the benchmark risk-free interest rate.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Put Option Container */}
          <div className="p-5 rounded-2xl bg-rose-500/[0.04] border border-rose-500/25 space-y-4">
            <div className="flex items-center justify-between border-b border-rose-500/20 pb-3">
              <div>
                <h3 className="font-heading font-bold text-rose-400 text-sm">
                  EUROPEAN PUT OPTION
                </h3>
                <span className="text-[10px] font-mono-code text-slate-400">Right to sell</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono-code text-slate-400 block">Theor. Price</span>
                <span className="text-xl font-bold font-mono-code text-white">₹{bsm.putPrice.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-2.5 text-xs font-mono-code">
              {/* Put Delta */}
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/[0.06] flex justify-between items-center group relative cursor-help">
                <span className="text-slate-400 border-b border-dotted border-white/20">Delta (Δ = ∂P/∂S):</span>
                <span className="font-bold text-rose-400 text-sm">{bsm.putGreeks.delta}</span>
                <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-50 w-72 p-2.5 rounded-xl bg-[#0c1222] border border-rose-500/30 shadow-2xl text-[10px] text-slate-300 pointer-events-none">
                  <div className="font-bold text-rose-300">Put Delta: Δ = N(d₁) - 1</div>
                  <div>Price decreases by ₹{Math.abs(bsm.putGreeks.delta)} for each ₹1 increase in underlying.</div>
                  <div className="text-[9px] text-slate-400 mt-1">ATM ≈ -0.50 | Deep ITM → -1.00 | Far OTM → 0.00</div>
                </div>
              </div>

              {/* Put Gamma */}
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/[0.06] flex justify-between items-center group relative cursor-help">
                <span className="text-slate-400 border-b border-dotted border-white/20">Gamma (Γ = ∂²P/∂S²):</span>
                <span className="font-bold text-sky-400 text-sm">{bsm.putGreeks.gamma}</span>
                <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-50 w-72 p-2.5 rounded-xl bg-[#0c1222] border border-sky-500/30 shadow-2xl text-[10px] text-slate-300 pointer-events-none">
                  <div className="font-bold text-sky-300">Put Gamma = Call Gamma</div>
                  <div>Identical curvature for put and call options at identical strike & maturity.</div>
                </div>
              </div>

              {/* Put Theta */}
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/[0.06] flex justify-between items-center group relative cursor-help">
                <span className="text-slate-400 border-b border-dotted border-rose-400/30">Theta (θ = -∂P/∂t):</span>
                <span className="font-bold text-rose-400 text-sm">-₹{Math.abs(bsm.putGreeks.theta).toFixed(2)} / day</span>
                <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-50 w-72 p-2.5 rounded-xl bg-[#0c1222] border border-rose-500/30 shadow-2xl text-[10px] text-slate-300 pointer-events-none">
                  <div className="font-bold text-rose-300">Put Theta (Daily Decay):</div>
                  <div className="text-[9px] font-mono-code text-rose-400 my-0.5">θ = -[S·N'(d₁)·σ]/(2√T) + r·K·e^(-rT)·N(-d₂)</div>
                  <div>Rate of time erosion per trading day.</div>
                </div>
              </div>

              {/* Put Vega */}
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/[0.06] flex justify-between items-center group relative cursor-help">
                <span className="text-slate-400 border-b border-dotted border-purple-400/30">Vega (ν = ∂P/∂σ):</span>
                <span className="font-bold text-purple-400 text-sm">₹{bsm.putGreeks.vega.toFixed(2)}</span>
                <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-50 w-72 p-2.5 rounded-xl bg-[#0c1222] border border-purple-500/30 shadow-2xl text-[10px] text-slate-300 pointer-events-none">
                  <div className="font-bold text-purple-300">Put Vega = Call Vega</div>
                  <div>Symmetric sensitivity to market-wide volatility expansion or contraction.</div>
                </div>
              </div>

              {/* Put Rho */}
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/[0.06] flex justify-between items-center group relative cursor-help">
                <span className="text-slate-400 border-b border-dotted border-white/20">Rho (ρ = ∂P/∂r):</span>
                <span className="font-bold text-slate-300 text-sm">{bsm.putGreeks.rho}</span>
                <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-50 w-72 p-2.5 rounded-xl bg-[#0c1222] border border-white/10 shadow-2xl text-[10px] text-slate-300 pointer-events-none">
                  <div className="font-bold text-slate-200">Put Rho: ρ = -K · T · e^(-rT) · N(-d₂) / 100</div>
                  <div>Put options lose value as interest rates rise due to cost-of-carry discount.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mathematical Black-Scholes Formulae Reference Card */}
      <div className="p-5 rounded-2xl bg-[#080d1a] border border-white/[0.08] space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <h3 className="font-heading font-bold text-white text-xs uppercase tracking-wider">
              Mathematical Foundation & Analytical Closed-Form Solutions
            </h3>
          </div>
          <span className="text-[10px] font-mono-code text-slate-400">
            Black-Scholes-Merton (1973) PDE
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono-code">
          <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06] space-y-1.5">
            <div className="text-[11px] font-bold text-sky-400">Standardized Variables (d₁, d₂)</div>
            <div className="p-2 rounded bg-black/60 text-[10px] text-sky-200">
              d₁ = [ln(S/K) + (r + σ²/2)T] / (σ√T)
              <br />
              d₂ = d₁ - σ√T
            </div>
            <div className="text-[9.5px] text-slate-400">
              N(d) represents the cumulative standard normal distribution function (CDF).
            </div>
          </div>

          <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06] space-y-1.5">
            <div className="text-[11px] font-bold text-emerald-400">Call Valuation Formula</div>
            <div className="p-2 rounded bg-black/60 text-[10px] text-emerald-200">
              C(S, t) = S·N(d₁) - K·e^(-rT)·N(d₂)
            </div>
            <div className="text-[9.5px] text-slate-400">
              S·N(d₁) is the expected asset benefit; K·e^(-rT)·N(d₂) is present value of strike payment.
            </div>
          </div>

          <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06] space-y-1.5">
            <div className="text-[11px] font-bold text-rose-400">Put-Call Parity Identity</div>
            <div className="p-2 rounded bg-black/60 text-[10px] text-rose-200">
              C - P = S - K·e^(-rT)
            </div>
            <div className="text-[9.5px] text-slate-400">
              Arbitrage-free relationship guaranteeing synthetic equivalence across European contracts.
            </div>
          </div>
        </div>
      </div>

      {/* AI Greeks Anomaly Drawer */}
      <AiFoAnomalyDrawer
        isOpen={isAiDrawerOpen}
        onClose={() => setIsAiDrawerOpen(false)}
        underlying={underlying}
      />
    </div>
  );
};
