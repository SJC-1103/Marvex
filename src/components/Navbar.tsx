import React, { useState } from 'react';
import { Currency } from '../types/market';
import { PortfolioBook } from '../types/portfolio';
import { SaveState } from '../services/portfolioService';
import { playQuantumBeep } from '../utils/audio';
import {
  LayoutDashboard,
  Briefcase,
  Layers,
  Compass,
  ShieldAlert,
  Star,
  Settings,
  ShieldCheck,
  ChevronDown,
  Plus,
  Check,
  Menu,
  X,
  Database,
  CloudCheck,
  Users,
  FileText,
} from 'lucide-react';

export type WorkspaceTab =
  | 'overview'
  | 'portfolio'
  | 'ownership'
  | 'analyze'
  | 'financials'
  | 'derivatives'
  | 'settings';

export type MarketMode = 'EQUITY' | 'DERIVATIVES';

interface NavbarProps {
  activeTab: WorkspaceTab;
  onSelectTab: (tab: WorkspaceTab) => void;
  marketMode: MarketMode;
  onToggleMarketMode: (mode: MarketMode) => void;
  currency: Currency;
  onToggleCurrency: () => void;
  exchangeRate?: number;
  books: PortfolioBook[];
  activeBookId: string;
  onSelectBook: (bookId: string) => void;
  onOpenNewBookModal: () => void;
  saveState: SaveState;
  onManualSave?: () => void;
  watchlistCount?: number;
  activeAlertsCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  marketMode,
  onToggleMarketMode,
  currency,
  onToggleCurrency,
  exchangeRate = 86.85,
  books,
  activeBookId,
  onSelectBook,
  onOpenNewBookModal,
  saveState,
  onManualSave,
  watchlistCount = 0,
  activeAlertsCount = 0,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [bookDropdownOpen, setBookDropdownOpen] = useState(false);

  const activeBook = books.find(b => b.id === activeBookId) || books[0];

  interface NavItem {
    id: WorkspaceTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }

  const navItems: NavItem[] = marketMode === 'DERIVATIVES'
    ? [
        { id: 'derivatives', label: 'Derivatives & F&O Lab', icon: Layers },
        { id: 'ownership', label: 'Ownership & Anomaly Intelligence', icon: Users },
        { id: 'overview', label: 'Cash Spot Markets', icon: LayoutDashboard },
        { id: 'portfolio', label: 'Portfolio Ledger', icon: Briefcase, badge: activeBook?.holdings?.length },
        { id: 'settings', label: 'Settings & Data Feeds', icon: Settings },
      ]
    : [
        { id: 'overview', label: 'Market Overview', icon: LayoutDashboard },
        { id: 'portfolio', label: 'Portfolio Ledger', icon: Briefcase, badge: activeBook?.holdings?.length },
        { id: 'financials', label: 'Financial Statements & Highlights', icon: FileText },
        { id: 'ownership', label: 'Ownership & Anomalies', icon: Users },
        { id: 'analyze', label: 'Technical Analysis & Compare', icon: Compass },
        { id: 'settings', label: 'Settings & Data Feeds', icon: Settings },
      ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#070a13]/95 backdrop-blur-xl border-b border-white/[0.08]">
      <div className="w-full px-2.5 sm:px-4 lg:px-5">
        <div className="flex items-center justify-between h-15 gap-2 sm:gap-4">
          {/* Left Zone: Brand Logo & Wordmark + Portfolio Book Selector */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Brand Logo & Subtitle */}
            <div
              onClick={() => {
                onSelectTab('overview');
                playQuantumBeep(600, 0.04);
              }}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-lg overflow-hidden border border-sky-500/40 bg-[#060913] p-0.5 shadow-sm group-hover:border-sky-400 transition-colors shrink-0">
                <img
                  src="/assets/aistudio/image_6717ddc8.png"
                  alt="Marvex Logo"
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                />
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-extrabold font-heading text-white tracking-wider">
                    MARVEX<span className="text-sky-400 font-light ml-0.5">.QUANT</span>
                  </span>
                  <span className="hidden xl:inline-block text-[9px] font-mono-code px-1.5 py-0.2 rounded border border-white/[0.08] bg-white/[0.03] text-slate-400">
                    NSE · BSE · US
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-sans hidden md:block leading-tight">
                  Quantitative Market Terminal
                </span>
              </div>
            </div>

            {/* Sub-Navigation / Header Dropdown: Portfolio Book Selector */}
            <div className="relative">
              <button
                onClick={() => setBookDropdownOpen(!bookDropdownOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-slate-200 transition active:scale-98"
                title="Switch active investment book"
              >
                <Briefcase className="w-3.5 h-3.5 text-sky-400" />
                <span className="max-w-[110px] sm:max-w-[140px] truncate text-left font-sans">
                  {activeBook?.name || 'Primary Wealth Book'}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${bookDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {bookDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setBookDropdownOpen(false)}
                  />
                  <div className="absolute left-0 mt-2 w-64 rounded-xl bg-[#0b0f1d] border border-white/[0.12] shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-2.5 py-1.5 text-[10px] font-mono-code uppercase tracking-wider text-slate-400 border-b border-white/[0.06] mb-1">
                      Select Investment Book
                    </div>
                    <div className="max-h-60 overflow-y-auto space-y-1">
                      {books.map(book => {
                        const isCurrent = book.id === activeBookId;
                        return (
                          <button
                            key={book.id}
                            onClick={() => {
                              onSelectBook(book.id);
                              setBookDropdownOpen(false);
                              playQuantumBeep(640, 0.03);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs text-left transition ${
                              isCurrent
                                ? 'bg-sky-500/15 text-sky-300 font-semibold border border-sky-500/30'
                                : 'text-slate-300 hover:bg-white/[0.05]'
                            }`}
                          >
                            <div className="truncate pr-2">
                              <div className="truncate font-sans">{book.name}</div>
                              <div className="text-[10px] text-slate-500 font-mono-code">
                                {book.holdings.length} positions · {book.baseCurrency}
                              </div>
                            </div>
                            {isCurrent && <Check className="w-3.5 h-3.5 text-sky-400 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                    <div className="pt-1.5 mt-1 border-t border-white/[0.06]">
                      <button
                        onClick={() => {
                          setBookDropdownOpen(false);
                          onOpenNewBookModal();
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-sky-400 hover:bg-sky-500/10 transition font-medium"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Create New Book...</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right Zone: Clean Mode Switcher + Live FX Parity & Currency Toggle */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Market Mode Switcher Pill */}
            <div className="flex items-center p-0.5 rounded-xl bg-white/[0.04] border border-white/[0.08] shadow-inner">
              <button
                onClick={() => {
                  onToggleMarketMode('EQUITY');
                  if (activeTab === 'derivatives') onSelectTab('overview');
                  playQuantumBeep(580, 0.03);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-mono-code font-bold transition flex items-center gap-1.5 ${
                  marketMode === 'EQUITY'
                    ? 'bg-sky-500/25 text-sky-300 border border-sky-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Regular Stock Market (Cash Equities, Mutual Funds, Indices)"
              >
                <span>Stocks</span>
              </button>
              <button
                onClick={() => {
                  onToggleMarketMode('DERIVATIVES');
                  onSelectTab('derivatives');
                  playQuantumBeep(680, 0.03);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-mono-code font-bold transition flex items-center gap-1.5 ${
                  marketMode === 'DERIVATIVES'
                    ? 'bg-purple-600/35 text-purple-300 border border-purple-500/50 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Futures & Options Market (Payoff Matrix, Greeks, Chains)"
              >
                <span>F&O</span>
              </button>
            </div>

            {/* Rupee to Dollar Conversion Toggle (Rate shown on hover) */}
            <div className="relative group">
              <button
                onClick={onToggleCurrency}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] hover:border-sky-500/30 text-xs font-mono-code font-bold transition active:scale-95"
                title={`$1.00 USD = ₹${exchangeRate.toFixed(2)} INR (Click to switch view currency)`}
              >
                <span className={currency === 'INR' ? 'text-sky-300 font-extrabold' : 'text-slate-400'}>
                  ₹ INR
                </span>
                <span className="text-slate-600 font-normal">/</span>
                <span className={currency === 'USD' ? 'text-sky-300 font-extrabold' : 'text-slate-400'}>
                  $ USD
                </span>
              </button>

              {/* Rich Hover Floating Tooltip showing the exact exchange rate */}
              <div className="absolute right-0 top-full mt-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50 whitespace-nowrap">
                <div className="px-3 py-1.5 rounded-lg bg-[#0b101e] border border-white/[0.15] shadow-2xl text-[11px] font-mono-code text-slate-200 flex items-center gap-2">
                  <span className="text-slate-400">Exchange Rate:</span>
                  <span className="text-emerald-400 font-bold">$1.00 USD = ₹{exchangeRate.toFixed(2)} INR</span>
                </div>
              </div>
            </div>

            {/* Subtle Save-State indicator if unsaved */}
            {saveState !== 'saved' && (
              <button
                onClick={() => {
                  if (onManualSave) onManualSave();
                  playQuantumBeep(720, 0.03);
                }}
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 text-[11px] font-mono-code hover:bg-amber-500/20 transition"
                title="Unsaved changes. Click to persist now."
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span>Save</span>
              </button>
            )}

            {/* Mobile Drawer Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-slate-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile / Tablet Collapsible Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-3 border-t border-white/[0.06] space-y-1 animate-in slide-in-from-top duration-200">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    setMobileMenuOpen(false);
                    playQuantumBeep(640, 0.03);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition ${
                    isActive
                      ? 'bg-sky-500/15 text-sky-300 font-semibold border border-sky-500/30'
                      : 'text-slate-300 hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-sky-400' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="text-[10px] font-mono-code px-2 py-0.5 rounded-md bg-white/[0.08] text-slate-400">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
};
