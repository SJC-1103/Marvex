import React, { useState, useRef } from 'react';
import { Currency } from '../../types/market';
import { PriceAlert } from '../../types/alert';
import { portfolioService, SaveState } from '../../services/portfolioService';
import {
  Settings,
  Database,
  Download,
  Upload,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileJson,
  DollarSign,
  Save,
  BookOpen,
} from 'lucide-react';
import { playQuantumBeep, playCollapseSound } from '../../utils/audio';

interface SettingsWorkspaceProps {
  currency: Currency;
  onSetCurrency: (curr: Currency) => void;
  exchangeRate: number;
  autosaveEnabled: boolean;
  onToggleAutosave: (enabled: boolean) => void;
  saveState: SaveState;
  onManualSave: () => void;
  watchlist: string[];
  alerts: PriceAlert[];
  onReloadData: () => void;
}

export const SettingsWorkspace: React.FC<SettingsWorkspaceProps> = ({
  currency,
  onSetCurrency,
  exchangeRate,
  autosaveEnabled,
  onToggleAutosave,
  saveState,
  onManualSave,
  watchlist,
  alerts,
  onReloadData,
}) => {
  const [resetConfirmInput, setResetConfirmInput] = useState('');
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  const [restoreMessage, setRestoreMessage] = useState<{ text: string; success: boolean } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Handle Export Backup JSON
  const handleExportBackup = () => {
    const jsonStr = portfolioService.generateBackupJson(watchlist, alerts, currency);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mavix_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    playQuantumBeep(750, 0.05);
  };

  // Handle Restore Backup JSON
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      if (content) {
        const result = portfolioService.restoreBackupJson(content);
        setRestoreMessage({ text: result.message, success: result.success });
        if (result.success) {
          playQuantumBeep(880, 0.08);
          onReloadData();
        } else {
          playCollapseSound();
        }
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Handle Factory Reset
  const handleFactoryReset = (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetSuccess(null);

    const result = portfolioService.factoryReset(resetConfirmInput);
    if (result.success) {
      setResetSuccess(result.message);
      setResetConfirmInput('');
      playQuantumBeep(600, 0.1);
      setTimeout(() => {
        onReloadData();
      }, 500);
    } else {
      setResetError(result.message);
      playCollapseSound();
    }
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="p-5 sm:p-6 rounded-2xl quantum-card border border-white/[0.08]">
        <div className="flex items-center gap-2 text-sky-400 text-xs font-mono-code uppercase tracking-wider mb-1">
          <Settings className="w-3.5 h-3.5" /> Workspace Configuration & Storage Engine
        </div>
        <h2 className="text-2xl font-bold font-heading text-white">
          Settings, Storage & Data Integrity
        </h2>
        <p className="text-slate-400 text-xs mt-0.5">
          Manage currency reporting conventions, LocalStorage automated replication, portable JSON snapshots, and inspect verified data sources.
        </p>
      </div>

      {/* 1. 2-COLUMN SETTINGS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Column 1: Display & Currency Preferences */}
        <div className="p-6 rounded-2xl quantum-card border border-white/[0.08] space-y-5">
          <div className="flex items-center gap-2 text-white font-bold font-heading text-base border-b border-white/[0.08] pb-3">
            <DollarSign className="w-5 h-5 text-sky-400" />
            <span>Display & Currency Preferences</span>
          </div>

          {/* Base Currency Selector */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-300">Base Currency Convention</label>
            <div className="grid grid-cols-2 gap-3 text-xs font-mono-code">
              <button
                type="button"
                onClick={() => {
                  onSetCurrency('INR');
                  playQuantumBeep(640, 0.03);
                }}
                className={`p-3 rounded-xl border text-left transition ${
                  currency === 'INR'
                    ? 'bg-sky-500/20 border-sky-500 text-white font-bold shadow-sm'
                    : 'bg-black/30 border-white/[0.08] text-slate-400 hover:text-white'
                }`}
              >
                <div className="text-sm font-bold text-sky-300">₹ INR</div>
                <div className="text-[10px] text-slate-400 font-sans mt-0.5">Indian Lakhs / Crores notation</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSetCurrency('USD');
                  playQuantumBeep(640, 0.03);
                }}
                className={`p-3 rounded-xl border text-left transition ${
                  currency === 'USD'
                    ? 'bg-sky-500/20 border-sky-500 text-white font-bold shadow-sm'
                    : 'bg-black/30 border-white/[0.08] text-slate-400 hover:text-white'
                }`}
              >
                <div className="text-sm font-bold text-sky-300">$ USD</div>
                <div className="text-[10px] text-slate-400 font-sans mt-0.5">Millions / Billions notation</div>
              </button>
            </div>
            <p className="text-[11px] font-mono-code text-slate-400 pt-1">
              Stated Reference FX Rate: <strong className="text-white">$1 USD = ₹{exchangeRate.toFixed(2)} INR</strong>
            </p>
          </div>

          {/* LocalStorage Autosave Toggle */}
          <div className="space-y-3 pt-3 border-t border-white/[0.06]">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-white">LocalStorage Continuous Autosave</div>
                <div className="text-[11px] text-slate-400">
                  Automatically syncs all portfolio changes, books, and alerts to browser storage.
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onToggleAutosave(!autosaveEnabled);
                  playQuantumBeep(660, 0.03);
                }}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  autosaveEnabled ? 'bg-sky-500' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    autosaveEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Manual Save Now button when disabled or unsaved */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/[0.06] text-xs">
              <span className="font-mono-code text-slate-400">
                Storage Status:{' '}
                <strong className={saveState === 'saved' ? 'text-emerald-400' : 'text-amber-400'}>
                  {saveState === 'saved' ? 'All changes persisted' : 'Changes pending save'}
                </strong>
              </span>
              <button
                onClick={() => {
                  onManualSave();
                  playQuantumBeep(720, 0.04);
                }}
                className="px-3 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.1] text-sky-300 font-semibold text-xs flex items-center gap-1.5 transition active:scale-95"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes Now</span>
              </button>
            </div>
          </div>
        </div>

        {/* Column 2: Backup & Storage Management */}
        <div className="p-6 rounded-2xl quantum-card border border-white/[0.08] space-y-5">
          <div className="flex items-center gap-2 text-white font-bold font-heading text-base border-b border-white/[0.08] pb-3">
            <Database className="w-5 h-5 text-indigo-400" />
            <span>Backup & Storage Management</span>
          </div>

          {/* Export & Restore Controls */}
          <div className="space-y-3">
            <div className="text-xs text-slate-300 font-medium">Export / Restore Portable JSON State</div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleExportBackup}
                className="p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white text-xs font-semibold flex items-center justify-center gap-2 transition active:scale-95"
              >
                <Download className="w-4 h-4 text-sky-400" />
                <span>Export Backup (.json)</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white text-xs font-semibold flex items-center justify-center gap-2 transition active:scale-95"
              >
                <Upload className="w-4 h-4 text-indigo-400" />
                <span>Restore Backup File</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {restoreMessage && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  restoreMessage.success
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                    : 'bg-rose-500/10 border border-rose-500/20 text-rose-300'
                }`}
              >
                {restoreMessage.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                <span>{restoreMessage.text}</span>
              </div>
            )}
          </div>

          {/* Factory Reset Section */}
          <div className="space-y-3 pt-3 border-t border-white/[0.06]">
            <div className="space-y-1">
              <div className="text-xs font-semibold text-rose-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Factory Reset Clean Slate</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Replaces all custom investment books and saved thresholds with default verified models. To confirm, type <strong className="text-rose-400 font-mono-code">RESET</strong> in the box below.
              </p>
            </div>

            <form onSubmit={handleFactoryReset} className="space-y-2">
              {resetError && (
                <div className="p-2 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
                  {resetError}
                </div>
              )}
              {resetSuccess && (
                <div className="p-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs">
                  {resetSuccess}
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={resetConfirmInput}
                  onChange={e => setResetConfirmInput(e.target.value)}
                  placeholder="Type RESET to confirm"
                  className="flex-1 px-3 py-2 rounded-xl bg-black/50 border border-rose-500/30 text-white font-mono-code text-xs focus:outline-none focus:border-rose-500"
                />
                <button
                  type="submit"
                  disabled={resetConfirmInput.trim() !== 'RESET'}
                  className={`px-4 py-2 rounded-xl font-bold text-xs transition ${
                    resetConfirmInput.trim() === 'RESET'
                      ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-sm active:scale-95'
                      : 'bg-white/[0.04] text-slate-600 border border-white/[0.04] cursor-not-allowed'
                  }`}
                >
                  Factory Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* 2. INSTITUTIONAL DATA INTEGRITY CHARTER (3-COLUMN INFORMATION GRID) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="text-base font-bold font-heading text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>Institutional Data Integrity Charter & Feeds</span>
          </h3>
          <span className="text-[11px] font-mono-code text-slate-400">
            Official EOD Settlement & AMFI Feeds
          </span>
        </div>

        {/* Prominent Educational Purpose & Risk Notice Box */}
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <div className="font-heading font-bold text-amber-300 uppercase tracking-wide">
              Mandatory Regulatory Advisory: Educational Purposes Only
            </div>
            <p className="text-slate-300 leading-relaxed">
              This terminal, including all simulated models, volatility meters, and comparisons, is strictly provided for <strong className="text-white">educational, informational, and academic research purposes only</strong>. Investments in the securities market are subject to market risks. <strong className="text-amber-200">All risks must be thoroughly analysed and evaluated before investing in the market.</strong> No data presented constitutes investment advice or a recommendation by Marvex.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Panel 1: No Invented Live Execution */}
          <div className="p-5 rounded-2xl quantum-card border border-white/[0.08] space-y-2.5">
            <div className="text-xs font-mono-code uppercase font-bold text-sky-400 flex items-center gap-1.5">
              <span>Principle 1 · Equity Feeds</span>
            </div>
            <h4 className="text-sm font-bold font-heading text-white">
              NSE, BSE & US Exchange Feeds
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ingested from official National Stock Exchange of India (NSE Bhavcopy), BSE India EOD reports, and US Consolidated Tape (NYSE / NASDAQ). Strictly verified settlement prints with transparent volume depth.
            </p>
          </div>

          {/* Panel 2: First-Class Mutual Funds */}
          <div className="p-5 rounded-2xl quantum-card border border-white/[0.08] space-y-2.5">
            <div className="text-xs font-mono-code uppercase font-bold text-indigo-400 flex items-center gap-1.5">
              <span>Principle 2 · Mutual Funds</span>
            </div>
            <h4 className="text-sm font-bold font-heading text-white">
              Official AMFI NAV Open Data Feed
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Sourced from Association of Mutual Funds in India (AMFI India portal / amfi-feed). Features authenticated daily NAV records, scheme code categorizations, expense ratios, and audited benchmark indices.
            </p>
          </div>

          {/* Panel 3: Transparent Cross-Market Math */}
          <div className="p-5 rounded-2xl quantum-card border border-white/[0.08] space-y-2.5">
            <div className="text-xs font-mono-code uppercase font-bold text-emerald-400 flex items-center gap-1.5">
              <span>Principle 3 · FX Parity</span>
            </div>
            <h4 className="text-sm font-bold font-heading text-white">
              RBI Reference Spot FX Parity
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Foreign exchange calculations adhere to Reserve Bank of India (RBI) / FBIL reference spot parity ($1 = ₹86.85) without undisclosed synthetic spreads or hidden currency slippage.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
