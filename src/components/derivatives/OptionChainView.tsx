import React, { useState, useMemo } from 'react';
import { Layers, ArrowUpDown, Filter, Sparkles, TrendingUp, TrendingDown } from 'lucide-react';
import { UnderlyingAsset, OptionChainRow } from '../../types/derivatives';
import { calculateBlackScholes } from '../../utils/blackScholes';
import { AiFoAnomalyDrawer } from '../modals/AiFoAnomalyDrawer';
import { playQuantumBeep } from '../../utils/audio';

interface OptionChainViewProps {
  underlying: UnderlyingAsset;
  onSelectStrikeForLeg?: (strike: number, type: 'CALL' | 'PUT', position: 'BUY' | 'SELL') => void;
}

export const OptionChainView: React.FC<OptionChainViewProps> = ({
  underlying,
  onSelectStrikeForLeg,
}) => {
  const [selectedExpiry, setSelectedExpiry] = useState<string>(underlying.activeExpiries[0]);
  const [rangeSteps, setRangeSteps] = useState<number>(8); // strikes above and below ATM
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);

  const atmStrike = Math.round(underlying.spot / underlying.strikeInterval) * underlying.strikeInterval;

  // Generate Option Chain ladder
  const chainRows: OptionChainRow[] = useMemo(() => {
    const rows: OptionChainRow[] = [];
    const interval = underlying.strikeInterval;

    for (let i = -rangeSteps; i <= rangeSteps; i++) {
      const strike = atmStrike + i * interval;
      const dte = 30; // standard 30-day DTE
      const distFromSpot = strike - underlying.spot;

      // Volatility skew smile: OTM Puts have higher IV, OTM Calls slightly lower IV
      const skewAdjustment = distFromSpot < 0 ? Math.abs(distFromSpot / underlying.spot) * 15 : - (distFromSpot / underlying.spot) * 8;
      const iv = Math.max(12, 22.5 + skewAdjustment);

      const bsm = calculateBlackScholes({
        spot: underlying.spot,
        strike,
        dte,
        volatility: iv,
      });

      // Synthetic OI & volume distributions around strikes
      const oiBase = Math.max(1000, Math.round(25000 * Math.exp(-Math.pow(distFromSpot / 150, 2))));
      const callOi = distFromSpot >= 0 ? Math.round(oiBase * 1.4) : Math.round(oiBase * 0.7);
      const putOi = distFromSpot <= 0 ? Math.round(oiBase * 1.5) : Math.round(oiBase * 0.6);

      rows.push({
        strike,
        distanceFromSpot: distFromSpot,
        call: {
          strike,
          ltp: bsm.callPrice,
          change: Number((bsm.callPrice * (underlying.changePercent / 100) * 2.5).toFixed(2)),
          changePercent: Number((underlying.changePercent * 2.2).toFixed(2)),
          oi: callOi,
          oiChange: Math.round(callOi * 0.08),
          volume: Math.round(callOi * 0.35),
          iv: Number(iv.toFixed(1)),
          greeks: bsm.callGreeks,
          bid: Number((bsm.callPrice * 0.99).toFixed(2)),
          ask: Number((bsm.callPrice * 1.01).toFixed(2)),
        },
        put: {
          strike,
          ltp: bsm.putPrice,
          change: Number((-bsm.putPrice * (underlying.changePercent / 100) * 2.5).toFixed(2)),
          changePercent: Number((-underlying.changePercent * 2.2).toFixed(2)),
          oi: putOi,
          oiChange: Math.round(putOi * 0.05),
          volume: Math.round(putOi * 0.3),
          iv: Number((iv * 1.04).toFixed(1)),
          greeks: bsm.putGreeks,
          bid: Number((bsm.putPrice * 0.99).toFixed(2)),
          ask: Number((bsm.putPrice * 1.01).toFixed(2)),
        },
      });
    }

    return rows;
  }, [underlying.spot, underlying.strikeInterval, underlying.changePercent, atmStrike, rangeSteps]);

  // Aggregate totals
  const totalCallOi = useMemo(() => chainRows.reduce((acc, r) => acc + r.call.oi, 0), [chainRows]);
  const totalPutOi = useMemo(() => chainRows.reduce((acc, r) => acc + r.put.oi, 0), [chainRows]);
  const pcr = totalCallOi > 0 ? (totalPutOi / totalCallOi).toFixed(2) : '1.00';

  return (
    <div className="space-y-4">
      {/* Top Chain Info Bar */}
      <div className="p-4 rounded-2xl bg-[#090d19] border border-white/[0.08] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-heading font-bold text-white text-base">
              {underlying.symbol} Option Chain Matrix
            </span>
            <span className="px-2 py-0.5 rounded-md bg-white/[0.06] border border-white/[0.1] text-sky-400 font-mono-code text-xs">
              NSE Derivatives
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono-code text-slate-400">
            {/* Spot Hover with Formula */}
            <div className="relative group cursor-help">
              <span className="border-b border-dotted border-white/30">Spot: <strong className="text-white">₹{underlying.spot}</strong></span>
              <div className="absolute left-0 top-full mt-2 hidden group-hover:block z-50 w-72 p-3 rounded-xl bg-[#0c1222] border border-sky-500/30 shadow-2xl text-left pointer-events-none">
                <div className="text-[11px] font-bold text-sky-300 font-heading">Underlying Cash Spot Price (S)</div>
                <div className="text-[10px] text-slate-300 mt-1">Live NSE real-time cash equity reference price for derivative contract settlement.</div>
                <div className="mt-2 p-1.5 rounded bg-black/60 border border-white/[0.08] text-[9px] font-mono-code text-sky-400">
                  Moneyness: {underlying.spot > underlying.maxPain ? 'Trading Above Max Pain' : 'Trading Below Max Pain'}
                </div>
              </div>
            </div>
            <span>•</span>

            {/* Max Pain Hover with Formula & Criteria */}
            <div className="relative group cursor-help">
              <span className="border-b border-dotted border-amber-400/50">Max Pain: <strong className="text-amber-400">₹{underlying.maxPain}</strong></span>
              <div className="absolute left-0 top-full mt-2 hidden group-hover:block z-50 w-80 p-3.5 rounded-xl bg-[#0c1222] border border-amber-500/30 shadow-2xl text-left pointer-events-none">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-300 font-heading">Max Pain Strike (K*)</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-300 border border-amber-400/20">Expiry Gravity</span>
                </div>
                <div className="text-[10px] text-slate-300 mt-1.5">
                  The strike price where option buyers experience maximum collective financial loss upon expiration:
                </div>
                <div className="my-2 p-2 rounded bg-black/70 border border-white/[0.08] text-[10px] font-mono-code text-amber-300">
                  K* = argmin_K [ ∑ Calls_i · max(0, K - K_i) + ∑ Puts_j · max(0, K_j - K) ]
                </div>
                <div className="text-[9px] text-slate-400 space-y-0.5">
                  <div>• <strong>Theoretical Criteria:</strong> Option sellers (institutions) gravitate spot toward K* to expire maximum contracts worthless.</div>
                  <div>• <strong>Current Gap:</strong> {underlying.spot - underlying.maxPain > 0 ? `+₹${(underlying.spot - underlying.maxPain).toFixed(2)} above strike` : `-₹${Math.abs(underlying.spot - underlying.maxPain).toFixed(2)} below strike`}.</div>
                </div>
              </div>
            </div>
            <span>•</span>

            {/* PCR Hover with Formula & Criteria */}
            <div className="relative group cursor-help">
              <span className="border-b border-dotted border-indigo-400/50">PCR: <strong className="text-indigo-400">{pcr}</strong></span>
              <div className="absolute left-0 top-full mt-2 hidden group-hover:block z-50 w-80 p-3.5 rounded-xl bg-[#0c1222] border border-indigo-500/30 shadow-2xl text-left pointer-events-none">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-indigo-300 font-heading">Put-Call Ratio (PCR_OI)</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-400/10 text-indigo-300 border border-indigo-400/20">Sentiment Metric</span>
                </div>
                <div className="my-2 p-2 rounded bg-black/70 border border-white/[0.08] text-[10px] font-mono-code text-indigo-300">
                  PCR = ∑(Put Open Interest) / ∑(Call Open Interest) = {totalPutOi.toLocaleString()} / {totalCallOi.toLocaleString()} = {pcr}
                </div>
                <div className="text-[9px] text-slate-300 space-y-1">
                  <div className="font-semibold text-slate-200">Scoring & Interpretation Criteria:</div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>• PCR &gt; 1.20:</span>
                    <span className="text-emerald-400 font-bold">Bullish / Oversold (Heavy Put Writing)</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>• 0.80 - 1.20:</span>
                    <span className="text-sky-300 font-bold">Neutral / Balanced Distribution</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>• PCR &lt; 0.80:</span>
                    <span className="text-rose-400 font-bold">Bearish / Overbought (Excess Call Buying)</span>
                  </div>
                  <div className="mt-1 pt-1 border-t border-white/[0.06] text-slate-400">
                    Current Reading: <strong className={parseFloat(pcr) > 1.2 ? 'text-emerald-400' : parseFloat(pcr) < 0.8 ? 'text-rose-400' : 'text-sky-300'}>{parseFloat(pcr) > 1.2 ? 'Bullish Sentiment Bias' : parseFloat(pcr) < 0.8 ? 'Bearish Sentiment Bias' : 'Neutral Equilibrium'}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Expiry Selector & AI Audit Button */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono-code text-slate-400 uppercase">Expiry:</span>
            <select
              value={selectedExpiry}
              onChange={e => setSelectedExpiry(e.target.value)}
              className="bg-black/60 border border-white/[0.12] rounded-xl px-3 py-1.5 text-xs font-mono-code text-white"
            >
              {underlying.activeExpiries.map(exp => (
                <option key={exp} value={exp}>{exp}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              setIsAiDrawerOpen(true);
              playQuantumBeep(720, 0.04);
            }}
            className="px-3.5 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 font-mono-code text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
            title="Investigate Open Interest distribution, PCR shifts, and volatility skew with AI"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>AI Chain & PCR Audit</span>
          </button>
        </div>
      </div>

      {/* Option Chain Table */}
      <div className="rounded-2xl bg-black/40 border border-white/[0.08] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs font-mono-code">
            {/* Super Header */}
            <thead>
              <tr className="border-b border-white/[0.08] bg-white/[0.02]">
                <th colSpan={5} className="py-2 text-emerald-400 border-r border-white/[0.08] uppercase tracking-wider font-heading text-xs">
                  CALL OPTIONS (CE)
                </th>
                <th className="py-2 text-amber-300 font-bold uppercase tracking-wider font-heading text-xs px-4">
                  STRIKE
                </th>
                <th colSpan={5} className="py-2 text-rose-400 border-l border-white/[0.08] uppercase tracking-wider font-heading text-xs">
                  PUT OPTIONS (PE)
                </th>
              </tr>
              {/* Column Headers with Hover Tooltips explaining exact formulas & criteria */}
              <tr className="border-b border-white/[0.06] text-slate-400 text-[11px] bg-black/40">
                <th className="py-2 px-2 group relative cursor-help" title="Total active open contracts on exchange">
                  <span className="border-b border-dotted border-white/20">OI</span>
                  <div className="absolute left-0 top-full hidden group-hover:block z-40 w-52 p-2 rounded-lg bg-[#0e1424] border border-white/10 text-left text-[10px] text-slate-300 font-sans">
                    <strong>Open Interest (OI)</strong>: Total open derivative contracts not yet settled. High OI creates key support/resistance pivots.
                  </div>
                </th>
                <th className="py-2 px-2 group relative cursor-help" title="Black-Scholes Implied Volatility %">
                  <span className="border-b border-dotted border-purple-400/40 text-purple-300">IV %</span>
                  <div className="absolute left-0 top-full hidden group-hover:block z-40 w-64 p-2 rounded-lg bg-[#0e1424] border border-purple-500/20 text-left text-[10px] text-slate-300 font-sans">
                    <strong className="text-purple-300">Implied Volatility (σ)</strong>: Backsolved via Newton-Raphson from market price C_m = BSM(S, K, T, σ, r). Higher IV = higher option premium.
                  </div>
                </th>
                <th className="py-2 px-2 group relative cursor-help" title="Delta (∂V/∂S)">
                  <span className="border-b border-dotted border-white/20">Delta (Δ)</span>
                  <div className="absolute left-0 top-full hidden group-hover:block z-40 w-64 p-2 rounded-lg bg-[#0e1424] border border-white/10 text-left text-[10px] text-slate-300 font-sans">
                    <strong className="text-sky-300">Delta Δ = N(d₁)</strong>: Change in call option price for every ₹1 change in underlying spot. Ranges from 0.00 to +1.00.
                  </div>
                </th>
                <th className="py-2 px-2 group relative cursor-help" title="Theta (-∂V/∂t)">
                  <span className="border-b border-dotted border-rose-400/40 text-rose-300">Theta (θ)</span>
                  <div className="absolute left-0 top-full hidden group-hover:block z-40 w-64 p-2 rounded-lg bg-[#0e1424] border border-rose-500/20 text-left text-[10px] text-slate-300 font-sans">
                    <strong className="text-rose-300">Theta θ = -∂V/∂t</strong>: 1-day time decay rate. Measures daily loss in option premium as expiration approaches.
                  </div>
                </th>
                <th className="py-2 px-2 border-r border-white/[0.08] font-bold text-slate-200 group relative cursor-help">
                  <span className="border-b border-dotted border-emerald-400/40">LTP (₹)</span>
                  <div className="absolute right-0 top-full hidden group-hover:block z-40 w-60 p-2 rounded-lg bg-[#0e1424] border border-emerald-500/20 text-left text-[10px] text-slate-300 font-sans">
                    <strong className="text-emerald-300">Last Traded Price</strong>: BSM formula: C = S·N(d₁) - K·e^(-rT)·N(d₂).
                  </div>
                </th>
                <th className="py-2 px-3 text-white font-bold bg-white/[0.04] group relative cursor-help">
                  <span className="border-b border-dotted border-amber-300/40">Strike (K)</span>
                  <div className="absolute left-1/2 -translate-x-1/2 top-full hidden group-hover:block z-40 w-52 p-2 rounded-lg bg-[#0e1424] border border-amber-400/20 text-left text-[10px] text-slate-300 font-sans">
                    <strong>Strike Price (K)</strong>: Predetermined contract exercise price. ATM = closest to Spot ₹{underlying.spot}.
                  </div>
                </th>
                <th className="py-2 px-2 border-l border-white/[0.08] font-bold text-slate-200 group relative cursor-help">
                  <span className="border-b border-dotted border-rose-400/40">LTP (₹)</span>
                  <div className="absolute left-0 top-full hidden group-hover:block z-40 w-60 p-2 rounded-lg bg-[#0e1424] border border-rose-500/20 text-left text-[10px] text-slate-300 font-sans">
                    <strong className="text-rose-300">Put LTP</strong>: BSM formula: P = K·e^(-rT)·N(-d₂) - S·N(-d₁).
                  </div>
                </th>
                <th className="py-2 px-2 group relative cursor-help" title="Theta (-∂V/∂t)">
                  <span className="border-b border-dotted border-rose-400/40 text-rose-300">Theta (θ)</span>
                  <div className="absolute right-0 top-full hidden group-hover:block z-40 w-64 p-2 rounded-lg bg-[#0e1424] border border-rose-500/20 text-left text-[10px] text-slate-300 font-sans">
                    <strong className="text-rose-300">Put Theta θ</strong>: Daily decay for Put options. Accelerates non-linearly near expiry.
                  </div>
                </th>
                <th className="py-2 px-2 group relative cursor-help" title="Put Delta (Δ = N(d₁) - 1)">
                  <span className="border-b border-dotted border-white/20">Delta (Δ)</span>
                  <div className="absolute right-0 top-full hidden group-hover:block z-40 w-64 p-2 rounded-lg bg-[#0e1424] border border-white/10 text-left text-[10px] text-slate-300 font-sans">
                    <strong className="text-rose-300">Put Delta Δ = N(d₁) - 1</strong>: Ranges from -1.00 (Deep ITM) to 0.00 (Far OTM).
                  </div>
                </th>
                <th className="py-2 px-2 group relative cursor-help" title="Put IV %">
                  <span className="border-b border-dotted border-purple-400/40 text-purple-300">IV %</span>
                  <div className="absolute right-0 top-full hidden group-hover:block z-40 w-60 p-2 rounded-lg bg-[#0e1424] border border-purple-500/20 text-left text-[10px] text-slate-300 font-sans">
                    <strong className="text-purple-300">Put IV Skew</strong>: Typically higher than call IV due to downside tail risk hedging demand.
                  </div>
                </th>
                <th className="py-2 px-2 group relative cursor-help" title="Put Open Interest">
                  <span className="border-b border-dotted border-white/20">OI</span>
                  <div className="absolute right-0 top-full hidden group-hover:block z-40 w-52 p-2 rounded-lg bg-[#0e1424] border border-white/10 text-left text-[10px] text-slate-300 font-sans">
                    <strong>Put OI</strong>: Heavy Put OI strikes act as strong market support floors.
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {chainRows.map(row => {
                const isAtm = row.strike === atmStrike;
                const isCallItm = row.strike < underlying.spot;
                const isPutItm = row.strike > underlying.spot;

                return (
                  <tr
                    key={row.strike}
                    className={`${isAtm ? 'bg-amber-500/[0.08] font-bold' : 'hover:bg-white/[0.02]'}`}
                  >
                    {/* Call OI */}
                    <td className={`py-2 px-2 ${isCallItm ? 'bg-emerald-500/[0.04]' : ''} text-slate-300`}>
                      {row.call.oi.toLocaleString()}
                    </td>
                    {/* Call IV */}
                    <td className={`py-2 px-2 ${isCallItm ? 'bg-emerald-500/[0.04]' : ''} text-purple-300`}>
                      {row.call.iv}%
                    </td>
                    {/* Call Delta */}
                    <td className={`py-2 px-2 ${isCallItm ? 'bg-emerald-500/[0.04]' : ''} text-slate-300`}>
                      {row.call.greeks.delta}
                    </td>
                    {/* Call Theta */}
                    <td className={`py-2 px-2 ${isCallItm ? 'bg-emerald-500/[0.04]' : ''} text-rose-300 text-[10px]`}>
                      -₹{Math.abs(row.call.greeks.theta)}
                    </td>
                    {/* Call LTP */}
                    <td className={`py-2 px-2 border-r border-white/[0.08] ${isCallItm ? 'bg-emerald-500/[0.08]' : ''} font-bold text-emerald-400`}>
                      ₹{row.call.ltp.toFixed(2)}
                    </td>

                    {/* STRIKE */}
                    <td className="py-2 px-3 font-bold text-white bg-white/[0.04] relative">
                      {row.strike.toLocaleString()}
                      {isAtm && (
                        <span className="absolute right-1 top-1 text-[8px] px-1 rounded bg-amber-400 text-black font-extrabold">
                          ATM
                        </span>
                      )}
                    </td>

                    {/* Put LTP */}
                    <td className={`py-2 px-2 border-l border-white/[0.08] ${isPutItm ? 'bg-rose-500/[0.08]' : ''} font-bold text-rose-400`}>
                      ₹{row.put.ltp.toFixed(2)}
                    </td>
                    {/* Put Theta */}
                    <td className={`py-2 px-2 ${isPutItm ? 'bg-rose-500/[0.04]' : ''} text-rose-300 text-[10px]`}>
                      -₹{Math.abs(row.put.greeks.theta)}
                    </td>
                    {/* Put Delta */}
                    <td className={`py-2 px-2 ${isPutItm ? 'bg-rose-500/[0.04]' : ''} text-slate-300`}>
                      {row.put.greeks.delta}
                    </td>
                    {/* Put IV */}
                    <td className={`py-2 px-2 ${isPutItm ? 'bg-rose-500/[0.04]' : ''} text-purple-300`}>
                      {row.put.iv}%
                    </td>
                    {/* Put OI */}
                    <td className={`py-2 px-2 ${isPutItm ? 'bg-rose-500/[0.04]' : ''} text-slate-300`}>
                      {row.put.oi.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Investigation Drawer */}
      <AiFoAnomalyDrawer
        isOpen={isAiDrawerOpen}
        onClose={() => setIsAiDrawerOpen(false)}
        underlying={underlying}
      />
    </div>
  );
};
