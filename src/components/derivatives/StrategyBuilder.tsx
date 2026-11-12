import React, { useState, useMemo } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Sliders,
  RotateCcw,
  ShieldCheck,
  Compass,
  AlertTriangle,
  Info,
  ChevronDown,
} from 'lucide-react';
import { UnderlyingAsset, StrategyLeg, OptionType, PositionType, ContractPeriodType } from '../../types/derivatives';
import { MOCK_UNDERLYINGS, STRATEGY_BLUEPRINTS, CONTRACT_PERIODS } from '../../data/derivativesData';
import { calculateStrategyPayoff } from '../../utils/payoffSimulator';
import { calculateBlackScholes } from '../../utils/blackScholes';
import { PayoffChart } from './PayoffChart';
import { AiFoAnomalyDrawer } from '../modals/AiFoAnomalyDrawer';
import { formatCurrency } from '../../utils/currency';

interface StrategyBuilderProps {
  selectedUnderlying: UnderlyingAsset;
  onSelectUnderlying: (underlying: UnderlyingAsset) => void;
}

export const StrategyBuilder: React.FC<StrategyBuilderProps> = ({
  selectedUnderlying,
  onSelectUnderlying,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<ContractPeriodType>('1M');
  const [targetDteOffset, setTargetDteOffset] = useState<number>(0);
  const [ivShift, setIvShift] = useState<number>(0);
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState<boolean>(false);
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);

  const activePeriodInfo = CONTRACT_PERIODS.find(p => p.id === selectedPeriod) || CONTRACT_PERIODS[2];

  // Initialize legs with a default Bull Call Spread
  const [legs, setLegs] = useState<StrategyLeg[]>(() => {
    const blueprint = STRATEGY_BLUEPRINTS[0];
    const initialLegs = blueprint.buildLegs(
      selectedUnderlying.spot,
      selectedUnderlying.strikeInterval,
      selectedUnderlying.lotSize,
      selectedUnderlying.activeExpiries[0],
      activePeriodInfo.dte,
      activePeriodInfo.typicalIv
    );
    return initialLegs.map((l, idx) => ({ ...l, id: `leg-${Date.now()}-${idx}` }));
  });

  // Calculate Payoff Summary
  const payoffSummary = useMemo(() => {
    return calculateStrategyPayoff({
      spotPrice: selectedUnderlying.spot,
      legs,
      targetDte: targetDteOffset,
      ivShift,
      riskFreeRate: selectedUnderlying.country === 'US' ? 0.045 : 0.065,
    });
  }, [selectedUnderlying.spot, selectedUnderlying.country, legs, targetDteOffset, ivShift]);

  // Handle Blueprint Quick Selection
  const handleApplyBlueprint = (blueprintId: string) => {
    const bp = STRATEGY_BLUEPRINTS.find(b => b.id === blueprintId);
    if (!bp) return;

    const newLegs = bp.buildLegs(
      selectedUnderlying.spot,
      selectedUnderlying.strikeInterval,
      selectedUnderlying.lotSize,
      selectedUnderlying.activeExpiries[0],
      activePeriodInfo.dte,
      activePeriodInfo.typicalIv
    );

    setLegs(newLegs.map((l, idx) => ({ ...l, id: `leg-${Date.now()}-${idx}` })));
    setBannerNotice(`Loaded "${bp.name}" strategy for ${selectedUnderlying.symbol}`);
    setTimeout(() => setBannerNotice(null), 4000);
  };

  // Leg Actions
  const handleToggleLeg = (id: string) => {
    setLegs(prev => prev.map(l => (l.id === id ? { ...l, enabled: !l.enabled } : l)));
  };

  const handleDeleteLeg = (id: string) => {
    setLegs(prev => prev.filter(l => l.id !== id));
  };

  const handleUpdateLeg = (id: string, updates: Partial<StrategyLeg>) => {
    setLegs(prev =>
      prev.map(l => {
        if (l.id !== id) return l;
        const updated = { ...l, ...updates };

        // Recalculate price and Greeks if strike or position changed
        if (updated.instrument === 'OPTION') {
          const bsm = calculateBlackScholes({
            spot: selectedUnderlying.spot,
            strike: updated.strike,
            dte: updated.dte,
            volatility: updated.iv,
          });
          const price = updated.type === 'CALL' ? bsm.callPrice : bsm.putPrice;
          return { ...updated, entryPrice: price, currentPrice: price };
        }
        return updated;
      })
    );
  };

  const handleAddCustomLeg = () => {
    if (legs.length >= 4) return;
    const atmStrike = Math.round(selectedUnderlying.spot / selectedUnderlying.strikeInterval) * selectedUnderlying.strikeInterval;
    const bsm = calculateBlackScholes({
      spot: selectedUnderlying.spot,
      strike: atmStrike,
      dte: activePeriodInfo.dte,
      volatility: activePeriodInfo.typicalIv,
    });

    const newLeg: StrategyLeg = {
      id: `leg-${Date.now()}`,
      instrument: 'OPTION',
      type: 'CALL',
      position: 'BUY',
      strike: atmStrike,
      expiry: selectedUnderlying.activeExpiries[0],
      dte: activePeriodInfo.dte,
      lots: 1,
      lotSize: selectedUnderlying.lotSize,
      entryPrice: bsm.callPrice,
      currentPrice: bsm.callPrice,
      iv: activePeriodInfo.typicalIv,
      enabled: true,
    };
    setLegs(prev => [...prev, newLeg]);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      {bannerNotice && (
        <div className="p-3 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-300 text-xs font-mono-code flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>{bannerNotice}</span>
          </div>
          <button onClick={() => setBannerNotice(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Control Bar: Underlying Selector + Contract Period Selector + AI Button */}
      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Underlying Asset Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-mono-code text-slate-400 uppercase tracking-wider">Underlying:</span>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {MOCK_UNDERLYINGS.map(und => {
              const isSelected = und.symbol === selectedUnderlying.symbol;
              return (
                <button
                  key={und.symbol}
                  onClick={() => {
                    onSelectUnderlying(und);
                    // auto re-anchor legs
                    const bp = STRATEGY_BLUEPRINTS[0];
                    const nextLegs = bp.buildLegs(und.spot, und.strikeInterval, und.lotSize, und.activeExpiries[0], activePeriodInfo.dte, activePeriodInfo.typicalIv);
                    setLegs(nextLegs.map((l, idx) => ({ ...l, id: `leg-${Date.now()}-${idx}` })));
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono-code font-bold transition flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                      : 'bg-white/[0.03] text-slate-400 hover:text-white border border-white/[0.06]'
                  }`}
                >
                  <span>{und.symbol}</span>
                  <span className={und.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {und.changePercent >= 0 ? '+' : ''}{und.changePercent}%
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Contract Expiry Horizon Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono-code text-slate-400 uppercase tracking-wider">Horizon:</span>
          <div className="flex items-center gap-1 p-1 rounded-xl bg-black/40 border border-white/[0.08]">
            {CONTRACT_PERIODS.map(period => (
              <button
                key={period.id}
                onClick={() => {
                  setSelectedPeriod(period.id);
                  setLegs(prev => prev.map(l => ({ ...l, dte: period.dte, iv: period.typicalIv })));
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono-code font-bold transition ${
                  selectedPeriod === period.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title={period.description}
              >
                {period.id}
              </button>
            ))}
          </div>

          {/* AI Advisor Button */}
          <button
            onClick={() => setIsAiDrawerOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 font-mono-code text-xs font-bold transition flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI F&O Advisor</span>
          </button>
        </div>
      </div>

      {/* Payoff Simulation Graph & Real-Time Payoff Summary Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left 3 Cols: SVG Interactive Payoff Chart */}
        <div className="lg:col-span-3 space-y-4">
          <PayoffChart
            summary={payoffSummary}
            spotPrice={selectedUnderlying.spot}
            underlying={selectedUnderlying}
            legs={legs}
          />

          {/* Interactive Simulation Sliders (Target DTE & IV Shift) with Calculation Details */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Target DTE slider with Formula Tooltip */}
            <div className="space-y-1.5 relative group">
              <div className="flex items-center justify-between text-xs font-mono-code">
                <span className="text-slate-400 flex items-center gap-1 cursor-help border-b border-dotted border-white/20">
                  <Sliders className="w-3 h-3 text-sky-400" />
                  <span>Simulation Date: T+{targetDteOffset} Days</span>
                </span>
                <span className="text-sky-400 font-bold">Remaining: {Math.max(0, activePeriodInfo.dte - targetDteOffset)} DTE</span>
              </div>
              <input
                type="range"
                min="0"
                max={activePeriodInfo.dte}
                value={targetDteOffset}
                onChange={e => setTargetDteOffset(parseInt(e.target.value, 10))}
                className="w-full accent-sky-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono-code text-slate-500">
                <span>Today (T+0)</span>
                <span>Expiry Day (T={activePeriodInfo.dte})</span>
              </div>
              {/* Formula & Criteria Hover Card */}
              <div className="absolute left-0 top-full mt-2 hidden group-hover:block z-50 w-80 p-3 rounded-xl bg-[#0c1222] border border-sky-500/30 shadow-2xl text-left pointer-events-none">
                <div className="text-[11px] font-bold text-sky-300 font-heading">Time Horizon & Theta Decay Engine</div>
                <div className="text-[10px] text-slate-300 mt-1">Calculates option premium decay between trade entry and target holding period:</div>
                <div className="my-2 p-1.5 rounded bg-black/60 border border-white/[0.08] text-[9.5px] font-mono-code text-sky-400">
                  T_sim = (DTE_initial - t_offset) / 365.25
                </div>
                <div className="text-[9px] text-slate-400 space-y-0.5">
                  <div>• <strong>Decay Dynamic:</strong> Option time value erodes non-linearly proportionally to 1/√T, accelerating exponentially in the final 21 days before expiry.</div>
                  <div>• <strong>Payoff Curve:</strong> Blue dotted line shows T+{targetDteOffset} valuation; solid cyan line shows terminal expiration payoff.</div>
                </div>
              </div>
            </div>

            {/* Implied Volatility Shift with Formula Tooltip */}
            <div className="space-y-1.5 relative group">
              <div className="flex items-center justify-between text-xs font-mono-code">
                <span className="text-slate-400 flex items-center gap-1 cursor-help border-b border-dotted border-purple-400/30">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  <span>IV Scenario Shift: {ivShift > 0 ? `+${ivShift}%` : `${ivShift}%`}</span>
                </span>
                <button
                  onClick={() => setIvShift(0)}
                  className="text-slate-500 hover:text-white flex items-center gap-1 text-[10px]"
                >
                  <RotateCcw className="w-2.5 h-2.5" /> Reset
                </button>
              </div>
              <input
                type="range"
                min="-15"
                max="15"
                step="1"
                value={ivShift}
                onChange={e => setIvShift(parseInt(e.target.value, 10))}
                className="w-full accent-purple-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono-code text-slate-500">
                <span>-15% IV Crush</span>
                <span>0% Base</span>
                <span>+15% IV Spike</span>
              </div>
              {/* Formula & Criteria Hover Card */}
              <div className="absolute right-0 top-full mt-2 hidden group-hover:block z-50 w-80 p-3 rounded-xl bg-[#0c1222] border border-purple-500/30 shadow-2xl text-left pointer-events-none">
                <div className="text-[11px] font-bold text-purple-300 font-heading">Implied Volatility Stress Test Model</div>
                <div className="text-[10px] text-slate-300 mt-1">Reprices each leg using Black-Scholes with adjusted volatility input:</div>
                <div className="my-2 p-1.5 rounded bg-black/60 border border-white/[0.08] text-[9.5px] font-mono-code text-purple-300">
                  σ_scenario = max(5.0, σ_base + ΔIV)
                </div>
                <div className="text-[9px] text-slate-400 space-y-0.5">
                  <div>• <strong>First-Order Sensitivity:</strong> ΔValue ≈ Vega_net × ΔIV.</div>
                  <div>• <strong>Trading Insight:</strong> Debit strategies benefit from IV spikes (+vega), whereas credit/theta collection strategies suffer from rising IV and benefit from IV crush.</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Strategy Summary Cards & Net Greeks */}
        <div className="space-y-4">
          {/* Key Metrics Card */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.08] space-y-3.5">
            <h3 className="text-xs font-heading font-bold text-white uppercase tracking-wider flex items-center justify-between">
              <span>Risk & Reward Matrix</span>
              <span className="text-[10px] font-mono-code text-slate-400">
                {selectedUnderlying.currency}
              </span>
            </h3>

            {/* Net Cost / Credit with hover formula */}
            <div className="group relative cursor-help flex items-center justify-between text-xs font-mono-code border-b border-white/[0.06] pb-2">
              <span className="text-slate-400 border-b border-dotted border-white/20">Net Outlay / Cashflow</span>
              <span className={`font-bold ${payoffSummary.netCostOrCredit >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {payoffSummary.netCostOrCredit >= 0 ? 'Credit +' : 'Debit -'}₹{Math.abs(payoffSummary.netCostOrCredit).toLocaleString()}
              </span>
              <div className="absolute left-0 top-full mt-1 hidden group-hover:block z-50 w-72 p-2.5 rounded-xl bg-[#0c1222] border border-white/10 shadow-2xl text-[10px] text-slate-300 pointer-events-none">
                <strong>Formula:</strong> ∑ (Lots_i · LotSize · Premium_i · Direction_i)
                <div className="text-[9px] text-slate-400 mt-1">Positive = Net cash received immediately. Negative = Net premium paid upfront.</div>
              </div>
            </div>

            {/* Max Profit with hover formula */}
            <div className="group relative cursor-help flex items-center justify-between text-xs font-mono-code border-b border-white/[0.06] pb-2">
              <span className="text-slate-400 border-b border-dotted border-emerald-400/30">Max Profit</span>
              <span className="font-bold text-emerald-400">
                {payoffSummary.maxProfit === 'UNLIMITED' ? 'UNLIMITED' : `+₹${payoffSummary.maxProfit.toLocaleString()}`}
              </span>
              <div className="absolute left-0 top-full mt-1 hidden group-hover:block z-50 w-72 p-2.5 rounded-xl bg-[#0c1222] border border-emerald-500/20 shadow-2xl text-[10px] text-slate-300 pointer-events-none">
                <strong>Terminal Ceiling:</strong> Max bound of piecewise payoff function across S_T ∈ [0, ∞). Defined risk spreads cap upside at strike difference minus net debit.
              </div>
            </div>

            {/* Max Loss with hover formula */}
            <div className="group relative cursor-help flex items-center justify-between text-xs font-mono-code border-b border-white/[0.06] pb-2">
              <span className="text-slate-400 border-b border-dotted border-rose-400/30">Max Loss</span>
              <span className="font-bold text-rose-400">
                {payoffSummary.maxLoss === 'UNLIMITED' ? 'UNLIMITED' : `-₹${Math.abs(payoffSummary.maxLoss).toLocaleString()}`}
              </span>
              <div className="absolute left-0 top-full mt-1 hidden group-hover:block z-50 w-72 p-2.5 rounded-xl bg-[#0c1222] border border-rose-500/20 shadow-2xl text-[10px] text-slate-300 pointer-events-none">
                <strong>Worst-Case Risk:</strong> Maximum drawdown at expiration. Defined risk structures ensure loss cannot exceed net premium or spread width.
              </div>
            </div>

            {/* POP & Risk:Reward with hover formulas */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center group relative cursor-help">
                <div className="text-[10px] font-mono-code text-slate-400 border-b border-dotted border-indigo-400/30 inline-block">Prob. Profit</div>
                <div className="text-sm font-bold font-mono-code text-indigo-400">{payoffSummary.pop}%</div>
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 hidden group-hover:block z-50 w-64 p-2.5 rounded-xl bg-[#0c1222] border border-indigo-500/20 shadow-2xl text-[10px] text-slate-300 text-left pointer-events-none">
                  <strong>POP Calculation:</strong> N(d₂) probability that underlying price finishes beyond breakeven under the lognormal risk-neutral measure.
                </div>
              </div>
              <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center group relative cursor-help">
                <div className="text-[10px] font-mono-code text-slate-400 border-b border-dotted border-white/20 inline-block">Risk : Reward</div>
                <div className="text-sm font-bold font-mono-code text-slate-200">{payoffSummary.riskRewardRatio}</div>
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 hidden group-hover:block z-50 w-64 p-2.5 rounded-xl bg-[#0c1222] border border-white/10 shadow-2xl text-[10px] text-slate-300 text-left pointer-events-none">
                  <strong>Formula:</strong> |Max Loss| : Max Profit. Institutional strategies target &lt; 1:1.5 for positive statistical expectancy.
                </div>
              </div>
            </div>
          </div>

          {/* Net Portfolio Greeks Card with Hover Derivations */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.08] space-y-2.5">
            <h3 className="text-xs font-heading font-bold text-white uppercase tracking-wider flex items-center justify-between">
              <span>Net Strategy Greeks</span>
              <span className="text-[9px] font-mono-code text-sky-400">∑(w_i · Greek_i)</span>
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono-code">
              <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.06] group relative cursor-help">
                <div className="text-[10px] text-slate-400 border-b border-dotted border-white/20 inline-block">Delta (Δ)</div>
                <div className={`font-bold ${payoffSummary.netGreeks.delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {payoffSummary.netGreeks.delta}
                </div>
                <div className="absolute left-0 top-full mt-1 hidden group-hover:block z-50 w-60 p-2 rounded-xl bg-[#0c1222] border border-white/10 text-[9px] text-slate-300 pointer-events-none">
                  Total directional share exposure: ∑ (Lots · Multiplier · Δ_leg).
                </div>
              </div>
              <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.06] group relative cursor-help">
                <div className="text-[10px] text-slate-400 border-b border-dotted border-white/20 inline-block">Gamma (Γ)</div>
                <div className="font-bold text-sky-400">{payoffSummary.netGreeks.gamma}</div>
                <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-50 w-60 p-2 rounded-xl bg-[#0c1222] border border-white/10 text-[9px] text-slate-300 pointer-events-none">
                  Curvature risk: Rate of delta change per ₹1 move in spot.
                </div>
              </div>
              <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.06] group relative cursor-help">
                <div className="text-[10px] text-slate-400 border-b border-dotted border-white/20 inline-block">Theta (θ / day)</div>
                <div className={`font-bold ${payoffSummary.netGreeks.theta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {payoffSummary.netGreeks.theta >= 0 ? '+' : ''}₹{payoffSummary.netGreeks.theta}
                </div>
                <div className="absolute left-0 top-full mt-1 hidden group-hover:block z-50 w-60 p-2 rounded-xl bg-[#0c1222] border border-white/10 text-[9px] text-slate-300 pointer-events-none">
                  Portfolio daily cashflow accrual or loss from passage of 1 trading day.
                </div>
              </div>
              <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.06] group relative cursor-help">
                <div className="text-[10px] text-slate-400 border-b border-dotted border-white/20 inline-block">Vega (ν / 1% IV)</div>
                <div className="font-bold text-purple-400">₹{payoffSummary.netGreeks.vega}</div>
                <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-50 w-60 p-2 rounded-xl bg-[#0c1222] border border-white/10 text-[9px] text-slate-300 pointer-events-none">
                  Portfolio P&L sensitivity for every 1.0% shift in implied volatility.
                </div>
              </div>
            </div>
          </div>

          {/* Institutional Playbook Blueprints */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-2.5">
            <div className="text-xs font-heading font-bold text-white uppercase tracking-wider flex items-center justify-between">
              <span>Quick Blueprints</span>
              <span className="text-[10px] font-mono-code text-slate-400">Defined Risk</span>
            </div>
            <div className="space-y-1.5">
              {STRATEGY_BLUEPRINTS.map(bp => (
                <button
                  key={bp.id}
                  onClick={() => handleApplyBlueprint(bp.id)}
                  className="w-full p-2 rounded-xl bg-black/40 hover:bg-white/[0.06] border border-white/[0.06] hover:border-sky-500/30 text-left transition flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-semibold text-slate-200">{bp.name}</div>
                    <div className="text-[10px] font-mono-code text-slate-400">{bp.outlook}</div>
                  </div>
                  <span className="text-[10px] font-mono-code text-sky-400 font-bold">Apply →</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Leg Strategy Table */}
      <div className="rounded-2xl bg-black/40 border border-white/[0.08] overflow-hidden">
        <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-400" />
            <h3 className="text-xs font-heading font-bold text-white uppercase tracking-wider">
              Strategy Position Legs ({legs.length}/4)
            </h3>
          </div>
          <button
            onClick={handleAddCustomLeg}
            disabled={legs.length >= 4}
            className="px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 font-mono-code text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-40"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Custom Leg</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono-code">
            <thead className="bg-white/[0.02] text-slate-400 border-b border-white/[0.06]">
              <tr>
                <th className="py-2.5 px-3">Active</th>
                <th className="py-2.5 px-3">Position</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Strike</th>
                <th className="py-2.5 px-3">Expiry / DTE</th>
                <th className="py-2.5 px-3">Lots</th>
                <th className="py-2.5 px-3">Entry Premium</th>
                <th className="py-2.5 px-3">IV</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {legs.map(leg => (
                <tr key={leg.id} className={leg.enabled ? 'hover:bg-white/[0.02]' : 'opacity-40 hover:bg-white/[0.01]'}>
                  {/* Enable / Disable toggle */}
                  <td className="py-2.5 px-3">
                    <input
                      type="checkbox"
                      checked={leg.enabled}
                      onChange={() => handleToggleLeg(leg.id)}
                      className="accent-sky-500 rounded cursor-pointer"
                    />
                  </td>

                  {/* BUY / SELL toggle */}
                  <td className="py-2.5 px-3">
                    <button
                      onClick={() => handleUpdateLeg(leg.id, { position: leg.position === 'BUY' ? 'SELL' : 'BUY' })}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        leg.position === 'BUY'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {leg.position}
                    </button>
                  </td>

                  {/* CALL / PUT / FUTURE */}
                  <td className="py-2.5 px-3">
                    <select
                      value={leg.instrument === 'FUTURE' ? 'FUTURE' : leg.type}
                      onChange={e => {
                        const val = e.target.value;
                        if (val === 'FUTURE') {
                          handleUpdateLeg(leg.id, { instrument: 'FUTURE' });
                        } else {
                          handleUpdateLeg(leg.id, { instrument: 'OPTION', type: val as OptionType });
                        }
                      }}
                      className="bg-[#0b101e] border border-white/[0.1] rounded px-2 py-1 text-slate-200 text-xs"
                    >
                      <option value="CALL">Call Option</option>
                      <option value="PUT">Put Option</option>
                      <option value="FUTURE">Index / Stock Future</option>
                    </select>
                  </td>

                  {/* Strike Selector */}
                  <td className="py-2.5 px-3">
                    {leg.instrument === 'FUTURE' ? (
                      <span className="text-slate-400">Spot ({selectedUnderlying.spot})</span>
                    ) : (
                      <input
                        type="number"
                        step={selectedUnderlying.strikeInterval}
                        value={leg.strike}
                        onChange={e => handleUpdateLeg(leg.id, { strike: parseFloat(e.target.value) || selectedUnderlying.spot })}
                        className="w-24 bg-[#0b101e] border border-white/[0.1] rounded px-2 py-1 text-white font-bold"
                      />
                    )}
                  </td>

                  {/* Expiry */}
                  <td className="py-2.5 px-3 text-slate-300">
                    <div>{leg.expiry}</div>
                    <div className="text-[10px] text-slate-500">{leg.dte} Days</div>
                  </td>

                  {/* Lots */}
                  <td className="py-2.5 px-3">
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={leg.lots}
                      onChange={e => handleUpdateLeg(leg.id, { lots: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                      className="w-16 bg-[#0b101e] border border-white/[0.1] rounded px-2 py-1 text-white"
                    />
                  </td>

                  {/* Entry Premium */}
                  <td className="py-2.5 px-3 font-bold text-white">
                    ₹{leg.entryPrice.toLocaleString()}
                  </td>

                  {/* IV */}
                  <td className="py-2.5 px-3 text-purple-300">
                    {leg.instrument === 'OPTION' ? `${leg.iv}%` : '-'}
                  </td>

                  {/* Delete */}
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => handleDeleteLeg(leg.id)}
                      className="p-1 rounded text-slate-500 hover:text-rose-400 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Anomaly & Strategy Drawer */}
      <AiFoAnomalyDrawer
        isOpen={isAiDrawerOpen}
        onClose={() => setIsAiDrawerOpen(false)}
        underlying={selectedUnderlying}
        onLoadStrategy={stratName => {
          if (stratName.toLowerCase().includes('put')) {
            handleApplyBlueprint('bear-put-spread');
          } else if (stratName.toLowerCase().includes('condor')) {
            handleApplyBlueprint('iron-condor');
          } else if (stratName.toLowerCase().includes('collar')) {
            handleApplyBlueprint('protective-collar');
          } else {
            handleApplyBlueprint('bull-call-spread');
          }
        }}
      />
    </div>
  );
};
