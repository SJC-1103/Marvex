import React, { useState } from 'react';
import { DataFeedMode } from '../types/market';
import { marketService } from '../services/marketDataService';
import { X, ShieldCheck, Server, Key, CheckCircle } from 'lucide-react';
import { playQuantumBeep } from '../utils/audio';

interface ApiIntegrationModalProps {
  onClose: () => void;
  currentMode: DataFeedMode;
  onModeChange: (mode: DataFeedMode) => void;
}

export const ApiIntegrationModal: React.FC<ApiIntegrationModalProps> = ({
  onClose,
  currentMode,
  onModeChange,
}) => {
  const [activeTab, setActiveTab] = useState<'status' | 'guide' | 'security'>('status');
  const latency = marketService.getApiLatency();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-3xl my-auto rounded-3xl quantum-card border border-white/[0.1] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-white/[0.08] bg-[#080c16]/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-sky-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-heading text-white">
                Market Data Engine & API Gateway
              </h2>
              <p className="text-xs text-slate-400">
                Transparent data provenance, feed switcher, and secure server-side integration architecture.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-Navigation */}
        <div className="flex border-b border-white/[0.06] bg-black/40 px-5 text-xs font-semibold">
          {[
            { id: 'status', label: 'Feed Mode & Gateway' },
            { id: 'guide', label: 'API Integration Blueprint' },
            { id: 'security', label: 'Security & Token Isolation' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as typeof activeTab);
                playQuantumBeep(600, 0.04);
              }}
              className={`py-3 px-4 border-b-2 transition ${
                activeTab === tab.id
                  ? 'border-sky-400 text-sky-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-300">
          {activeTab === 'status' && (
            <div className="space-y-5">
              {/* Data Integrity Pledge */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white text-xs font-heading">
                    Marvex Data Transparency Standard
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Financial markets require total provenance clarity. Marvex strictly separates feeds into explicit tiers: Static Demo Baseline, 15-Minute Exchange Delayed, Real-Time Simulated Micro-ticks, and Authorized Broker Websocket. Simulated ticks are never misrepresented as real executed trades.
                  </p>
                </div>
              </div>

              {/* Feed Mode Selection */}
              <div>
                <label className="text-xs font-semibold font-heading text-white block mb-2 uppercase tracking-wider">
                  Active Feed Pipeline:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      id: 'LIVE_SIMULATED',
                      title: 'Live Simulated (Active)',
                      desc: 'Real-time Brownian motion micro-fluctuations, continuous order book depth, and acoustic tick feedback.',
                      badge: 'Interactive',
                      color: 'border-sky-500/40 bg-sky-500/10 text-sky-300',
                    },
                    {
                      id: 'DEMO',
                      title: 'Static Demo Data',
                      desc: 'Static benchmark prices for auditing UI components and matrix comparisons without tick drift.',
                      badge: 'Zero Drift',
                      color: 'border-indigo-500/40 bg-indigo-500/10 text-indigo-300',
                    },
                    {
                      id: 'DELAYED_15M',
                      title: 'Exchange Delayed (15m)',
                      desc: 'Replicates public exchange free tier requirements with a 15-minute quote delay.',
                      badge: 'Exchange Compliant',
                      color: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
                    },
                    {
                      id: 'API_READY',
                      title: 'Broker Direct REST/WS',
                      desc: 'Ready to connect to authorized broker feeds (Zerodha Kite, Upstox, Polygon, AlphaVantage).',
                      badge: 'Server Proxy',
                      color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
                    },
                  ].map(mode => (
                    <div
                      key={mode.id}
                      onClick={() => {
                        onModeChange(mode.id as DataFeedMode);
                        playQuantumBeep(700, 0.05);
                      }}
                      className={`p-4 rounded-2xl border cursor-pointer transition ${
                        currentMode === mode.id
                          ? `${mode.color} shadow-sm`
                          : 'border-white/[0.06] bg-black/40 hover:bg-white/[0.03]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-white text-sm font-heading">{mode.title}</span>
                        <span className="text-[10px] font-mono-code px-2 py-0.5 rounded bg-white/[0.05] text-slate-300 border border-white/[0.08]">
                          {mode.badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{mode.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gateway Diagnostics */}
              <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.06] space-y-3">
                <div className="flex items-center justify-between text-xs font-mono-code">
                  <span className="text-slate-400">Gateway Roundtrip Latency:</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    {latency} ms (Low Latency)
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono-code">
                  <span className="text-slate-400">FX Cross-Parity Engine:</span>
                  <span className="text-slate-200">1 USD = ₹86.85 INR</span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono-code">
                  <span className="text-slate-400">Monitored Exchanges:</span>
                  <span className="text-sky-300">NSE, BSE, NYSE, NASDAQ</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="space-y-4 text-xs leading-relaxed">
              <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06]">
                <h4 className="font-semibold text-white text-sm mb-2 font-heading">
                  How Market Data Integration Works (Overview)
                </h4>
                <p className="text-slate-400 mb-3">
                  A high-level explanation of how enterprise finance systems consume live feeds:
                </p>

                <ol className="list-decimal list-inside space-y-3 text-slate-300">
                  <li className="pl-1">
                    <strong className="text-white">Exchange Licensing:</strong>
                    <span className="block text-slate-400 mt-0.5 ml-4">
                      Exchanges (NSE, BSE, NYSE) restrict raw unauthenticated feeds. Real ticks must flow through registered brokers or licensed data vendors.
                    </span>
                  </li>

                  <li className="pl-1">
                    <strong className="text-white">For Indian Equities (NSE/BSE):</strong>
                    <span className="block text-slate-400 mt-0.5 ml-4">
                      Brokers like <strong className="text-sky-300">Zerodha (Kite Connect)</strong>, <strong className="text-sky-300">Angel One (SmartAPI)</strong>, and <strong className="text-sky-300">Upstox</strong> provide developer endpoints for live order books and ticks.
                    </span>
                  </li>

                  <li className="pl-1">
                    <strong className="text-white">For US Equities (NYSE/NASDAQ):</strong>
                    <span className="block text-slate-400 mt-0.5 ml-4">
                      Providers like <strong className="text-sky-300">Polygon.io</strong>, <strong className="text-sky-300">Alpha Vantage</strong>, and <strong className="text-sky-300">Finnhub</strong> offer developer keys with generous free query allowances.
                    </span>
                  </li>

                  <li className="pl-1">
                    <strong className="text-white">Secure Server Proxying:</strong>
                    <span className="block text-slate-400 mt-0.5 ml-4">
                      Never place raw API secret keys into frontend JavaScript or client HTML. Always store credentials in <code>.env</code> on the backend, proxying requests through <code>/api/*</code>.
                    </span>
                  </li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-4 text-xs leading-relaxed">
              <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06]">
                <div className="flex items-center gap-2 font-semibold text-white text-sm mb-2 font-heading">
                  <Key className="w-4 h-4 text-indigo-400" /> Server-Side Proxy Isolation
                </div>
                <p className="text-slate-300 mb-3">
                  This architecture prevents security leaks by isolating credentials from public client browsers:
                </p>

                <div className="p-3 rounded-lg bg-black/70 border border-white/[0.08] font-mono-code text-[11px] text-sky-300 mb-3">
                  BROWSER CLIENT ──► /api/market-data ──► BACKEND SERVER (.env) ──► EXCHANGE GATEWAY
                </div>

                <ul className="space-y-2 text-slate-400">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Private API keys and tokens are never transferred over public client responses.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Backend proxy caches quote data to prevent rate-limit penalties.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Conforms with exchange requirements for quote timestamping and attribution.</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/[0.08] bg-[#080c16]/90 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-mono-code">
            Active Mode: <strong className="text-sky-300">{currentMode}</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.1] text-white font-medium transition"
          >
            Close Gateway
          </button>
        </div>
      </div>
    </div>
  );
};
