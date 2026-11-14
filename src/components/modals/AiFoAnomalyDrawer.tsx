import React, { useState } from 'react';
import { Sparkles, X, ExternalLink, ShieldCheck, Newspaper, AlertTriangle, TrendingUp, TrendingDown, Layers, HelpCircle } from 'lucide-react';
import { UnderlyingAsset } from '../../types/derivatives';
import { Currency } from '../../types/market';
import { DEFAULT_USD_INR_RATE, formatCurrency } from '../../utils/currency';

interface AiFoAnomalyDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  underlying: UnderlyingAsset;
  currency?: Currency;
  exchangeRate?: number;
  onLoadStrategy?: (strategyName: string) => void;
}

export const AiFoAnomalyDrawer: React.FC<AiFoAnomalyDrawerProps> = ({
  isOpen,
  onClose,
  underlying,
  currency = 'INR',
  exchangeRate = DEFAULT_USD_INR_RATE,
  onLoadStrategy,
}) => {
  const [loading, setLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState<any>(null);

  const fetchFoAnalysis = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/investigate-fo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: underlying.symbol,
          name: underlying.name,
          spot: underlying.spot,
          maxPain: underlying.maxPain,
          pcrOi: underlying.pcrOi,
          ivRank: underlying.ivRank,
          shareholding: underlying.shareholding,
          financials: underlying.financials,
          debtProfile: underlying.debtProfile,
        }),
      });
      const data = await res.json();
      setAnalysisData(data);
    } catch (e) {
      console.error('Failed to fetch F&O analysis:', e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      fetchFoAnalysis();
    }
  }, [isOpen, underlying.symbol]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="relative w-full max-w-xl bg-[#090d19] border-l border-white/[0.12] shadow-2xl flex flex-col h-full z-10 text-white">
        {/* Drawer Header */}
        <div className="p-5 border-b border-white/[0.08] flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-bold text-base text-white">
                  F&O Derivatives AI Advisor
                </span>
                <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-mono-code text-[10px] font-bold">
                  MICROSTRUCTURE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Institutional anomaly investigation for <span className="text-white font-mono-code font-bold">{underlying.symbol}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Top Key Parameters Badge Ribbon */}
          <div className="grid grid-cols-4 gap-2 text-center p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
            <div>
              <div className="text-[10px] font-mono-code text-slate-400 uppercase">Spot</div>
              <div className="text-sm font-bold font-mono-code text-white">
                {formatCurrency(underlying.spot, currency, underlying.currency, exchangeRate)}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-mono-code text-slate-400 uppercase">Max Pain</div>
              <div className="text-sm font-bold font-mono-code text-amber-400">
                {formatCurrency(underlying.maxPain, currency, underlying.currency, exchangeRate)}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-mono-code text-slate-400 uppercase">PCR OI</div>
              <div className="text-sm font-bold font-mono-code text-sky-400">{underlying.pcrOi}</div>
            </div>
            <div>
              <div className="text-[10px] font-mono-code text-slate-400 uppercase">IV Rank</div>
              <div className="text-sm font-bold font-mono-code text-indigo-400">{underlying.ivRank}%</div>
            </div>
          </div>

          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
              <p className="text-xs font-mono-code text-slate-400">
                Synthesizing open interest skew and promoter float data...
              </p>
            </div>
          ) : analysisData ? (
            <>
              {/* Institutional Synthesis */}
              <div className="p-4 rounded-xl bg-purple-500/[0.06] border border-purple-500/25 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono-code font-bold text-purple-300 uppercase tracking-wider">
                    Synthetic Open Interest Skew Diagnosis
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-mono-code text-[10px] font-bold">
                    {analysisData.aiOutlook?.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {analysisData.openInterestAnomalySummary}
                </p>
              </div>

              {/* Promoter & Float Analysis */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-heading font-bold text-white">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Shareholder Float & Encumbrance Risk</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {analysisData.promoterImpactAssessment}
                </p>
                <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono-code text-slate-400">
                  <span>Promoters: <strong className="text-white">{underlying.shareholding.promoters}%</strong></span>
                  <span>Institutional: <strong className="text-white">{underlying.shareholding.institutions}%</strong></span>
                  <span>Pledged: <strong className={underlying.shareholding.pledgedPromoterShares > 0 ? 'text-amber-400' : 'text-emerald-400'}>{underlying.shareholding.pledgedPromoterShares}%</strong></span>
                </div>
              </div>

              {/* Recommended Defined-Risk Structure */}
              <div className="p-4 rounded-xl bg-indigo-500/[0.08] border border-indigo-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-heading font-bold text-indigo-300">
                    Recommended Defined-Risk Blueprint
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-mono-code text-[10px]">
                    ZERO NAKED RISK
                  </span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-semibold">
                  {analysisData.recommendedDefinedRiskStrategy}
                </p>
                {onLoadStrategy && (
                  <button
                    onClick={() => {
                      onLoadStrategy(analysisData.recommendedDefinedRiskStrategy);
                      onClose();
                    }}
                    className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-mono-code text-xs font-bold transition flex items-center justify-center gap-2"
                  >
                    <span>Load Recommended Strategy to Builder</span>
                  </button>
                )}
              </div>

              {/* Recent Catalysts & Company News */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-heading font-bold text-white uppercase tracking-wider">
                  <Newspaper className="w-4 h-4 text-sky-400" />
                  <span>Verified Catalysts Affecting Volatility</span>
                </div>

                <div className="space-y-2.5">
                  {analysisData.recentNewsArticles?.map((art: any, i: number) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-black/40 border border-white/[0.07] hover:border-white/[0.15] transition space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono-code text-sky-400 font-semibold">{art.source}</span>
                        <span className="text-[10px] font-mono-code text-slate-500">{art.timeAgo}</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-100 leading-snug">
                        {art.headline}
                      </h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {art.snippet}
                      </p>
                      <div className="flex items-center gap-1.5 pt-1">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-mono-code font-bold ${
                            art.sentiment === 'POSITIVE'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : art.sentiment === 'NEGATIVE'
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-slate-500/20 text-slate-300'
                          }`}
                        >
                          {art.sentiment} VOLATILITY BIAS
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Drawer Footer with Regulatory Disclaimer */}
        <div className="p-4 border-t border-white/[0.08] bg-black/60 text-[11px] text-slate-400 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>F&O analytics are quantitative estimates for educational study. Always verify live order book liquidity.</span>
        </div>
      </div>
    </div>
  );
};
