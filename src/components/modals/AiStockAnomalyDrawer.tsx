import React, { useEffect, useState } from 'react';
import { X, Sparkles, AlertTriangle, Newspaper, TrendingDown, TrendingUp, RefreshCw, Users, ShieldAlert, CheckCircle2, Building2 } from 'lucide-react';
import { StockContradiction, AiStockAnalysisResult } from '../../types/divergence';

interface AiStockAnomalyDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  contradiction: StockContradiction | null;
  marketBenchmark: string;
  marketChangePercent: number;
}

export const AiStockAnomalyDrawer: React.FC<AiStockAnomalyDrawerProps> = ({
  isOpen,
  onClose,
  contradiction,
  marketBenchmark,
  marketChangePercent,
}) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AiStockAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchInvestigation = async () => {
    if (!contradiction) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/investigate-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: contradiction.symbol,
          name: contradiction.name,
          stockChangePercent: contradiction.stockChangePercent,
          marketBenchmark,
          marketChangePercent,
          shareholding: contradiction.shareholding,
          attributedDriver: contradiction.attributedDriver,
          responsibleDemographic: contradiction.responsibleDemographic,
        }),
      });

      if (!response.ok) {
        throw new Error(`Investigation API responded with status ${response.status}`);
      }

      const data: AiStockAnalysisResult = await response.json();
      setAnalysis(data);
    } catch (err: any) {
      console.error('Failed to investigate stock anomaly:', err);
      setError(err?.message || 'Failed to reach AI research assistant');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && contradiction) {
      fetchInvestigation();
    } else {
      setAnalysis(null);
      setError(null);
    }
  }, [isOpen, contradiction?.stockId]);

  if (!isOpen || !contradiction) return null;

  const isStockDown = contradiction.stockChangePercent < 0;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-2xl bg-[#090d16] border-l border-white/10 shadow-2xl flex flex-col h-full z-10 overflow-hidden text-slate-100">
        {/* Drawer Header */}
        <div className="p-6 border-b border-white/[0.08] bg-black/40 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono-code font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Divergence Anomaly Detected
              </span>
              <span className="text-xs text-slate-400 font-mono-code">
                Spread: {contradiction.divergenceSpreadPercent}%
              </span>
            </div>
            <h2 className="text-xl font-heading font-extrabold text-white flex items-center gap-2">
              {contradiction.symbol}
              <span className="text-xs font-normal text-slate-400">({contradiction.name})</span>
            </h2>
            <p className="text-xs text-slate-400">
              Contradicts {marketBenchmark} ({marketChangePercent >= 0 ? '+' : ''}{marketChangePercent}%) with {isStockDown ? 'decline' : 'advance'} of {contradiction.stockChangePercent >= 0 ? '+' : ''}{contradiction.stockChangePercent}%.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchInvestigation}
              disabled={loading}
              title="Re-run AI Analysis"
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Key Metrics Comparison Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <span className="text-[10px] uppercase font-mono-code text-slate-400 block mb-1">Stock Move</span>
              <div className={`text-base font-bold font-mono-code flex items-center gap-1 ${isStockDown ? 'text-rose-400' : 'text-emerald-400'}`}>
                {isStockDown ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                {contradiction.stockChangePercent >= 0 ? '+' : ''}{contradiction.stockChangePercent}%
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <span className="text-[10px] uppercase font-mono-code text-slate-400 block mb-1">{marketBenchmark}</span>
              <div className="text-base font-bold font-mono-code text-slate-200">
                {marketChangePercent >= 0 ? '+' : ''}{marketChangePercent}%
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <span className="text-[10px] uppercase font-mono-code text-slate-400 block mb-1">Suspected Driver</span>
              <div className="text-xs font-semibold text-amber-300 truncate" title={contradiction.responsibleDemographic}>
                {contradiction.responsibleDemographic}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <span className="text-[10px] uppercase font-mono-code text-slate-400 block mb-1">Majority Stake</span>
              <div className="text-xs font-semibold text-sky-300">
                {contradiction.shareholding.majorityHolder}
              </div>
            </div>
          </div>

          {/* Shareholder Breakdown Strip */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-heading font-semibold text-slate-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-sky-400" />
                Shareholder Demographic Distribution
              </span>
              <span className="text-[10px] font-mono-code text-slate-400">
                {contradiction.shareholding.lastAuditedQuarter}
              </span>
            </div>

            {/* Stacked Proportional Bar */}
            <div className="h-3 w-full rounded-full overflow-hidden flex bg-slate-800">
              <div
                style={{ width: `${contradiction.shareholding.promotersPercent}%` }}
                className="bg-indigo-500 h-full"
                title={`Promoters: ${contradiction.shareholding.promotersPercent}%`}
              />
              <div
                style={{ width: `${contradiction.shareholding.institutionalPercent}%` }}
                className="bg-sky-500 h-full"
                title={`Institutions (FII/DII): ${contradiction.shareholding.institutionalPercent}%`}
              />
              <div
                style={{ width: `${contradiction.shareholding.publicPercent}%` }}
                className="bg-amber-500 h-full"
                title={`General Public: ${contradiction.shareholding.publicPercent}%`}
              />
            </div>

            {/* Labels */}
            <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] font-mono-code">
              <div>
                <span className="inline-block w-2 h-2 rounded-full bg-indigo-500 mr-1.5" />
                <span className="text-slate-400">Promoters:</span>{' '}
                <strong className="text-slate-200">{contradiction.shareholding.promotersPercent}%</strong>
              </div>
              <div>
                <span className="inline-block w-2 h-2 rounded-full bg-sky-500 mr-1.5" />
                <span className="text-slate-400">Inst (FII/DII):</span>{' '}
                <strong className="text-slate-200">{contradiction.shareholding.institutionalPercent}%</strong>
              </div>
              <div>
                <span className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-1.5" />
                <span className="text-slate-400">Public:</span>{' '}
                <strong className="text-slate-200">{contradiction.shareholding.publicPercent}%</strong>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 pt-1 leading-relaxed border-t border-white/[0.04]">
              <strong className="text-amber-300">Driver Attribution:</strong> {contradiction.driverExplanation}
            </p>
          </div>

          {/* AI Investigation Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-heading font-bold text-white uppercase tracking-wider">
                    AI Microstructure & News Investigation
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono-code">
                    Powered by Gemini 3.8 Flash Financial Intelligence
                  </span>
                </div>
              </div>

              {analysis?.isSimulatedFallback === false ? (
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono-code flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Live Gemini
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[10px] font-mono-code">
                  Curated Synthesis
                </span>
              )}
            </div>

            {loading && (
              <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center space-y-3">
                <RefreshCw className="w-6 h-6 text-sky-400 animate-spin mx-auto" />
                <p className="text-xs text-slate-300 font-mono-code">
                  Analyzing market orders, shareholder filings, and recent news catalysts...
                </p>
              </div>
            )}

            {error && !loading && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4" /> Investigation Engine Notice
                </div>
                <p>{error}</p>
              </div>
            )}

            {analysis && !loading && (
              <div className="space-y-4">
                {/* Executive Summary Card */}
                <div className="p-4 rounded-xl bg-sky-500/[0.05] border border-sky-500/20 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-mono-code text-sky-300 font-bold uppercase">
                    <span>Primary Catalyst: {analysis.primaryCatalyst}</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    {analysis.summary}
                  </p>
                </div>

                {/* News Catalysts */}
                <div className="space-y-2">
                  <h4 className="text-xs font-heading font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Newspaper className="w-3.5 h-3.5 text-sky-400" />
                    Recent Company News & Filings
                  </h4>

                  <div className="space-y-2.5">
                    {analysis.recentNewsArticles.map((art, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/15 transition space-y-1.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h5 className="text-xs font-semibold text-white leading-snug">
                            {art.headline}
                          </h5>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-mono-code font-bold uppercase shrink-0 ${
                              art.sentiment === 'NEGATIVE'
                                ? 'bg-rose-500/20 text-rose-300'
                                : art.sentiment === 'POSITIVE'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-slate-700 text-slate-300'
                            }`}
                          >
                            {art.sentiment}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          {art.snippet}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] font-mono-code text-slate-500">
                          <span>{art.source}</span>
                          <span>•</span>
                          <span>{art.timeAgo}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Divergence Rationale */}
                <div className="p-4 rounded-xl bg-black/40 border border-white/[0.08] space-y-2">
                  <h4 className="text-xs font-heading font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                    Shareholder Flow & Divergence Rationale
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {analysis.divergenceRationale}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-white/[0.08] bg-black/60 flex items-center justify-between text-[11px] font-mono-code text-slate-400">
          <span>Non-commercial educational intelligence</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-medium transition"
          >
            Close Investigation
          </button>
        </div>
      </div>
    </div>
  );
};
