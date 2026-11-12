import React from 'react';
import { MarketMode } from '../Navbar';
import { LayoutDashboard, Layers, ArrowRight, ShieldCheck, Activity, Sparkles, TrendingUp, Compass } from 'lucide-react';
import { playQuantumBeep } from '../../utils/audio';

interface ModeSelectionModalProps {
  isOpen: boolean;
  onSelectMode: (mode: MarketMode) => void;
  exchangeRate: number;
}

export const ModeSelectionModal: React.FC<ModeSelectionModalProps> = ({
  isOpen,
  onSelectMode,
  exchangeRate,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
      {/* Dark Ambient Backdrop */}
      <div className="fixed inset-0 bg-[#04060d]/90 backdrop-blur-md transition-opacity" />

      {/* Modal Card */}
      <div className="relative w-full max-w-2xl bg-[#090d1a] border border-white/[0.14] rounded-3xl p-6 sm:p-8 shadow-2xl z-10 text-white animate-fade-up">
        {/* Subtle decorative glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-32 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="text-center space-y-3 mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#060913] border border-sky-500/30 p-1.5 shadow-xl animate-float-slow mx-auto">
            <img
              src="/assets/aistudio/image_6717ddc8.png"
              alt="Marvex Logo"
              className="w-full h-full object-contain"
            />
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-white tracking-wider">
              Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-300 to-purple-400">MARVEX</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">
              Select your preferred operating workspace to initialize the analytical terminal
            </p>
          </div>
        </div>

        {/* Mode Choices Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card 1: Regular Stock Market Mode */}
          <div
            onClick={() => {
              playQuantumBeep(580, 0.04);
              onSelectMode('EQUITY');
            }}
            className="group relative p-5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.08] hover:border-sky-500/40 cursor-pointer transition-all duration-200 flex flex-col justify-between hover:shadow-lg hover:shadow-sky-500/5 active:scale-[0.99]"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/25 text-sky-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <LayoutDashboard className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono-code px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 font-bold">
                  SPOT & WEALTH
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold font-heading text-white group-hover:text-sky-300 transition-colors">
                  Stock Market Terminal
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Cash equities, multi-book portfolio tracking, mutual fund NAVs, shareholder demographics, and market decoupling diagnostics.
                </p>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-white/[0.06] text-[11px] font-mono-code text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="text-sky-400">•</span>
                  <span>NSE & BSE Bhavcopy settlement</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sky-400">•</span>
                  <span>Promoter vs. Public demographic bars</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sky-400">•</span>
                  <span>AI stock contradiction assistant</span>
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between pt-3 border-t border-white/[0.06] text-xs font-mono-code font-bold text-sky-400 group-hover:text-sky-300">
              <span>Enter Stocks Mode</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2: F&O Derivatives Mode */}
          <div
            onClick={() => {
              playQuantumBeep(680, 0.04);
              onSelectMode('DERIVATIVES');
            }}
            className="group relative p-5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.08] hover:border-purple-500/40 cursor-pointer transition-all duration-200 flex flex-col justify-between hover:shadow-lg hover:shadow-purple-500/5 active:scale-[0.99]"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/25 text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Layers className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono-code px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-bold">
                  QUANT & HEDGING
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold font-heading text-white group-hover:text-purple-300 transition-colors">
                  Futures & Options Mode
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Interactive multi-leg strategy architect, real-time SVG payoff curves, Black-Scholes Greeks lab, and NSE option chains.
                </p>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-white/[0.06] text-[11px] font-mono-code text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="text-purple-400">•</span>
                  <span>Interactive payoff curve & breakevens</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-purple-400">•</span>
                  <span>Full BSM Greeks ($\Delta, \Gamma, \theta, \nu$)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-purple-400">•</span>
                  <span>AI microstructure & OI skew advisor</span>
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between pt-3 border-t border-white/[0.06] text-xs font-mono-code font-bold text-purple-400 group-hover:text-purple-300">
              <span>Enter F&O Mode</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        {/* Footer Notice */}
        <div className="mt-6 pt-4 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] font-mono-code text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>You can switch between both modes anytime from the top bar</span>
          </div>
          <span>FBIL FX: $1.00 = ₹{exchangeRate.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};
