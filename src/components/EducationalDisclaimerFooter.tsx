import React from 'react';
import { AlertTriangle, ShieldCheck, Database, Info, ExternalLink } from 'lucide-react';

interface EducationalDisclaimerFooterProps {
  onOpenDataCharter?: () => void;
}

export const EducationalDisclaimerFooter: React.FC<EducationalDisclaimerFooterProps> = ({
  onOpenDataCharter,
}) => {
  return (
    <footer className="w-full mt-10 border-t border-white/[0.08] bg-[#05070d]/95 relative z-10 backdrop-blur-xl">
      {/* 1. Primary Educational & Risk Disclaimer Card */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6">
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/[0.06] border border-amber-500/25 relative overflow-hidden">
          {/* Subtle accent glow */}
          <div className="absolute -left-12 -top-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start gap-3.5">
            <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <div className="space-y-1.5 flex-1 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-heading font-extrabold uppercase tracking-wider text-amber-300 text-xs">
                  Important Regulatory Notice: For Educational & Analytical Purposes Only
                </span>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-mono-code text-[10px] font-bold">
                  NON-COMMERCIAL RESEARCH TERMINAL
                </span>
              </div>

              <p className="text-slate-300 leading-relaxed">
                This platform is strictly designed and provided for <strong className="text-amber-200">educational, analytical, and quantitative research purposes only</strong>. All investment decisions in securities, equities, mutual fund schemes, derivatives, or debt markets carry inherent capital risks. <strong className="text-white">All financial and market risks must be thoroughly analyzed, calculated, and evaluated independently before investing in the market.</strong>
              </p>

              <p className="text-slate-400 leading-relaxed text-[11px]">
                Past performance, historical NAV trajectories, normalized comparison curves, and volatility ratios are not guarantees of future performance. Nothing contained within this application constitutes financial advice, tax guidance, investment solicitation, or a recommendation to buy, hold, or sell any security. Marvex is not a SEBI-registered investment advisor (RIA) or broker-dealer.
              </p>
            </div>
          </div>
        </div>

        {/* 2. Official Data Sources & Feed Attribution */}
        <div className="mt-5 p-4 sm:p-5 rounded-2xl bg-black/40 border border-white/[0.08] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-2.5">
            <div className="flex items-center gap-2 text-xs font-heading font-bold text-white uppercase tracking-wider">
              <Database className="w-4 h-4 text-sky-400" />
              <span>Verified Market Data Feeds & Provenance</span>
            </div>
            {onOpenDataCharter && (
              <button
                onClick={onOpenDataCharter}
                className="text-[11px] font-mono-code text-sky-400 hover:text-sky-300 flex items-center gap-1 transition self-start sm:self-auto"
              >
                <span>View Data Integrity Charter</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>

          <p className="text-slate-400 text-xs leading-relaxed">
            Market analytics, end-of-day settlement bars, and instrument prices are ingested and verified against official institutional repositories:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
            {/* Source 1: AMFI */}
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1">
              <div className="flex items-center gap-1.5 text-indigo-400 font-mono-code font-bold text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>AMFI NAV Feed</span>
              </div>
              <div className="font-semibold text-white text-[11px]">Indian Mutual Funds</div>
              <p className="text-slate-400 text-[10px] leading-tight">
                Daily Net Asset Value (NAV) open data feed from Association of Mutual Funds in India (AMFI).
              </p>
            </div>

            {/* Source 2: NSE / BSE */}
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1">
              <div className="flex items-center gap-1.5 text-orange-400 font-mono-code font-bold text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>NSE & BSE Bhavcopy</span>
              </div>
              <div className="font-semibold text-white text-[11px]">Cash Equities & Indices</div>
              <p className="text-slate-400 text-[10px] leading-tight">
                Audited End-of-Day (EOD) market settlement records and bhavcopy feeds from NSE & BSE India.
              </p>
            </div>

            {/* Source 3: NSE Clearing / F&O Bhavcopy */}
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1">
              <div className="flex items-center gap-1.5 text-purple-400 font-mono-code font-bold text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>NSE Clearing F&O</span>
              </div>
              <div className="font-semibold text-white text-[11px]">Derivatives & Options Matrix</div>
              <p className="text-slate-400 text-[10px] leading-tight">
                Open interest (OI), volume, settlement prices, and Black-Scholes Greeks calculated via NSE Clearing and OCC standards.
              </p>
            </div>

            {/* Source 4: NYSE / NASDAQ */}
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1">
              <div className="flex items-center gap-1.5 text-sky-400 font-mono-code font-bold text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Consolidated Tape (CTA/UTP)</span>
              </div>
              <div className="font-semibold text-white text-[11px]">US Equities & Benchmarks</div>
              <p className="text-slate-400 text-[10px] leading-tight">
                Official closing prints and multi-year bars for NYSE, NASDAQ, S&P 500, and NASDAQ-100.
              </p>
            </div>

            {/* Source 5: RBI / FBIL FX Parity */}
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-400 font-mono-code font-bold text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>RBI / FBIL Spot Parity</span>
              </div>
              <div className="font-semibold text-white text-[11px]">Cross-Currency FX Rate</div>
              <p className="text-slate-400 text-[10px] leading-tight">
                Anchored at Reference Spot Conversion $1.00 USD = ₹86.85 INR with transparent cross-market parity math.
              </p>
            </div>
          </div>
        </div>

        {/* 3. Terminal Wordmark & Session Meta */}
        <div className="mt-6 pt-4 border-t border-white/[0.06] flex flex-col md:flex-row items-center justify-between gap-3 text-[11px] font-mono-code text-slate-500">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded overflow-hidden border border-white/[0.1] bg-[#060913] p-0.5 shrink-0">
              <img
                src="/assets/aistudio/image_6717ddc8.png"
                alt="Marvex Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-heading font-extrabold text-white tracking-wider">
              MARVEX<span className="text-sky-400 font-light">.QUANT</span>
            </span>
            <span>·</span>
            <span className="text-slate-400">Institutional Cross-Border Market Intelligence</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-slate-400">Local-First Storage</span>
            <span>·</span>
            <span>Encrypted In-Browser State</span>
            <span>·</span>
            <span className="text-emerald-400">Audited EOD Feeds</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
