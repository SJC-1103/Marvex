import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Stock, MarketIndex, Currency, DataFeedMode } from './types/market';
import { MutualFundScheme } from './types/mutualFund';
import { PriceAlert, AlertNotification } from './types/alert';
import { PortfolioBook, PortfolioHolding, BookValuationSummary } from './types/portfolio';
import { marketService } from './services/marketDataService';
import { portfolioService, SaveState } from './services/portfolioService';
import { DEFAULT_USD_INR_RATE, convertCurrency } from './utils/currency';
import { QuantumBackground } from './components/QuantumBackground';
import { Navbar, WorkspaceTab, MarketMode } from './components/Navbar';
import { MarketTickerRibbon } from './components/MarketTickerRibbon';
import { OverviewWorkspace } from './components/workspaces/OverviewWorkspace';
import { PortfolioWorkspace } from './components/workspaces/PortfolioWorkspace';
import { OwnershipWorkspace } from './components/workspaces/OwnershipWorkspace';
import { AnalyzeWorkspace } from './components/workspaces/AnalyzeWorkspace';
import { SettingsWorkspace } from './components/workspaces/SettingsWorkspace';
import { DerivativesWorkspace } from './components/derivatives/DerivativesWorkspace';
import { FinancialStatementsWorkspace } from './components/workspaces/FinancialStatementsWorkspace';
import { AlertToastContainer } from './components/AlertToastContainer';
import { NewBookModal } from './components/modals/NewBookModal';
import { ModeSelectionModal } from './components/modals/ModeSelectionModal';
import { AiStockAnomalyDrawer } from './components/modals/AiStockAnomalyDrawer';
import { EducationalDisclaimerFooter } from './components/EducationalDisclaimerFooter';
import { StockContradiction } from './types/divergence';
import { playQuantumBeep, playCollapseSound } from './utils/audio';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Compass,
  FileText,
  Settings,
  Layers,
} from 'lucide-react';

export default function App() {
  // Mode State: Equity (Stocks) vs Derivatives (F&O)
  const [marketMode, setMarketMode] = useState<MarketMode>(() => {
    try {
      const savedMode = localStorage.getItem('mavix_market_mode');
      if (savedMode === 'DERIVATIVES' || savedMode === 'EQUITY') return savedMode;
      const hash = window.location.hash.toLowerCase();
      if (hash.includes('derivatives') || hash.includes('fno') || hash.includes('fo') || hash.includes('options')) {
        return 'DERIVATIVES';
      }
    } catch {
      // ignore
    }
    return 'EQUITY';
  });

  // Mode Selection Opening Screen State
  const [isModeModalOpen, setIsModeModalOpen] = useState<boolean>(() => {
    try {
      const chosen = sessionStorage.getItem('marvex_mode_chosen');
      return !chosen; // Show modal on fresh tab/session open
    } catch {
      return false;
    }
  });

  const handleChooseInitialMode = (mode: MarketMode) => {
    setMarketMode(mode);
    setIsModeModalOpen(false);
    try {
      sessionStorage.setItem('marvex_mode_chosen', 'true');
      localStorage.setItem('mavix_market_mode', mode);
      if (mode === 'DERIVATIVES') {
        setActiveTab('derivatives');
        window.location.hash = '#/derivatives';
      } else {
        setActiveTab('overview');
        window.location.hash = '#/overview';
      }
    } catch {
      // ignore
    }
  };

  const handleToggleMarketMode = (mode: MarketMode) => {
    setMarketMode(mode);
    try {
      localStorage.setItem('mavix_market_mode', mode);
    } catch {
      // ignore
    }
  };

  // 1. Navigation Workspace State with URL hash/path sync
  const [activeTab, setActiveTab] = useState<WorkspaceTab>(() => {
    try {
      const hash = window.location.hash.replace('#/', '').replace('#', '').toLowerCase();
      if (['overview', 'portfolio', 'ownership', 'analyze', 'financials', 'derivatives', 'settings'].includes(hash)) {
        return hash as WorkspaceTab;
      }
      if (hash === 'compare') return 'analyze';
      if (hash === 'watchlist' || hash === 'risk') return 'ownership';
      if (hash === 'statements' || hash === 'statement' || hash === 'filings') return 'financials';
      if (hash === 'fo' || hash === 'options' || hash === 'futures') return 'derivatives';
      const path = window.location.pathname.replace('/', '').toLowerCase();
      if (['overview', 'portfolio', 'ownership', 'analyze', 'financials', 'derivatives', 'settings'].includes(path)) {
        return path as WorkspaceTab;
      }
    } catch {
      // ignore
    }
    return 'overview';
  });

  const handleSelectTab = (tab: WorkspaceTab) => {
    setActiveTab(tab);
    try {
      window.location.hash = `#/${tab}`;
    } catch {
      // ignore
    }
  };

  // Sync hash changes if user hits back/forward
  useEffect(() => {
    const handleHashChange = () => {
      try {
        const hash = window.location.hash.replace('#/', '').replace('#', '').toLowerCase();
        if (['overview', 'portfolio', 'ownership', 'analyze', 'financials', 'derivatives', 'settings'].includes(hash)) {
          setActiveTab(hash as WorkspaceTab);
          if (hash === 'derivatives') setMarketMode('DERIVATIVES');
        } else if (hash === 'compare') {
          setActiveTab('analyze');
        } else if (hash === 'watchlist' || hash === 'risk') {
          setActiveTab('ownership');
        } else if (hash === 'statements' || hash === 'statement' || hash === 'filings') {
          setActiveTab('financials');
        } else if (hash === 'fo' || hash === 'options' || hash === 'futures') {
          setActiveTab('derivatives');
          setMarketMode('DERIVATIVES');
        }
      } catch {
        // ignore
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // 2. Global Currency & Rates
  const [currency, setCurrency] = useState<Currency>('INR');
  const [exchangeRate, setExchangeRate] = useState<number>(DEFAULT_USD_INR_RATE);
  const [feedMode, setFeedMode] = useState<DataFeedMode>(marketService.getFeedMode());

  // 3. Market Data State
  const [stocks, setStocks] = useState<Stock[]>(marketService.getStocks());
  const [indices, setIndices] = useState<MarketIndex[]>(marketService.getIndices());
  const [mutualFunds, setMutualFunds] = useState<MutualFundScheme[]>(marketService.getMutualFunds());

  // 4. Portfolio Books State
  const [books, setBooks] = useState<PortfolioBook[]>(() => portfolioService.getBooks());
  const [activeBookId, setActiveBookId] = useState<string>(() => portfolioService.getActiveBook().id);
  const [saveState, setSaveState] = useState<SaveState>(() => portfolioService.getSaveState());
  const [autosaveEnabled, setAutosaveEnabled] = useState<boolean>(() => portfolioService.isAutosaveEnabled());
  const [isNewBookModalOpen, setIsNewBookModalOpen] = useState(false);

  // Active Selected Book
  const activeBook = useMemo(() => {
    return books.find(b => b.id === activeBookId) || books[0] || portfolioService.getActiveBook();
  }, [books, activeBookId]);

  // Dynamic Valuation Summary
  const bookSummary: BookValuationSummary = useMemo(() => {
    return portfolioService.calculateBookSummary(activeBook, currency, exchangeRate);
  }, [activeBook, currency, exchangeRate, stocks, mutualFunds]);

  // 5. Watchlist persisted in localStorage
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('mavix_watchlist_v2') || localStorage.getItem('fmm_quantum_watchlist');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return ['stock-reliance', 'stock-nvda', 'mf-ppfas-flexi', 'idx-nifty50'];
  });

  useEffect(() => {
    try {
      localStorage.setItem('mavix_watchlist_v2', JSON.stringify(watchlist));
    } catch {
      // ignore
    }
  }, [watchlist]);

  const handleToggleWatchlist = (id: string) => {
    setWatchlist(prev => {
      const next = prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id];
      playQuantumBeep(650, 0.04);
      return next;
    });
  };

  // 6. Volatility & Price Alerts
  const [alerts, setAlerts] = useState<PriceAlert[]>(() => {
    try {
      const saved = localStorage.getItem('mavix_alerts_v2') || localStorage.getItem('fmm_quantum_alerts');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [
      {
        id: 'alert-reliance-upper',
        stockId: 'stock-reliance',
        symbol: 'RELIANCE',
        name: 'Reliance Industries Limited',
        targetPrice: 3050.0,
        condition: 'ABOVE',
        currency: 'INR',
        initialPrice: 2984.5,
        createdAt: new Date().toISOString(),
        triggered: false,
      },
      {
        id: 'alert-nvda-lower',
        stockId: 'stock-nvda',
        symbol: 'NVDA',
        name: 'NVIDIA Corporation',
        targetPrice: 120.0,
        condition: 'BELOW',
        currency: 'USD',
        initialPrice: 124.8,
        createdAt: new Date().toISOString(),
        triggered: false,
      },
    ];
  });

  const alertsRef = useRef<PriceAlert[]>(alerts);
  useEffect(() => {
    alertsRef.current = alerts;
    try {
      localStorage.setItem('mavix_alerts_v2', JSON.stringify(alerts));
    } catch {
      // ignore
    }
  }, [alerts]);

  const [alertNotifications, setAlertNotifications] = useState<AlertNotification[]>([]);

  // 7. Context Selection for Navigation (Direct routing between workspaces)
  const [selectedInstrumentForAnalysis, setSelectedInstrumentForAnalysis] = useState<string>('stock-reliance');
  const [compareSymbols, setCompareSymbols] = useState<string[]>(['RELIANCE', 'NVDA', '122639', 'NIFTY 50']);

  // Ref to exchangeRate
  const exchangeRateRef = useRef<number>(exchangeRate);
  useEffect(() => {
    exchangeRateRef.current = exchangeRate;
  }, [exchangeRate]);

  // Live Micro-Tick Engine Subscription
  useEffect(() => {
    const unsubscribe = marketService.subscribe((updatedStocks, updatedIndices) => {
      setStocks([...updatedStocks]);
      setIndices([...updatedIndices]);

      // Evaluate active alerts
      const currentAlerts = alertsRef.current;
      const rate = exchangeRateRef.current;
      const triggeredAlertIds: string[] = [];
      const newNotifications: AlertNotification[] = [];

      currentAlerts.forEach(alert => {
        if (alert.triggered) return;
        const stock = updatedStocks.find(s => s.id === alert.stockId || s.symbol === alert.symbol);
        if (!stock) return;

        const currentPriceConverted = convertCurrency(stock.price, stock.baseCurrency, alert.currency, rate);
        let isHit = false;
        if (alert.condition === 'ABOVE' && currentPriceConverted >= alert.targetPrice) {
          isHit = true;
        } else if (alert.condition === 'BELOW' && currentPriceConverted <= alert.targetPrice) {
          isHit = true;
        }

        if (isHit) {
          triggeredAlertIds.push(alert.id);
          newNotifications.push({
            id: `notif-${Date.now()}-${alert.id}`,
            alertId: alert.id,
            symbol: alert.symbol,
            targetPrice: alert.targetPrice,
            condition: alert.condition,
            currency: alert.currency,
            currentPrice: currentPriceConverted,
            timestamp: new Date().toISOString(),
          });
        }
      });

      if (triggeredAlertIds.length > 0) {
        setAlerts(prev =>
          prev.map(a =>
            triggeredAlertIds.includes(a.id)
              ? {
                  ...a,
                  triggered: true,
                  triggeredAt: new Date().toISOString(),
                  triggeredPrice: newNotifications.find(n => n.alertId === a.id)?.currentPrice,
                }
              : a
          )
        );
        setAlertNotifications(prev => [...newNotifications, ...prev].slice(0, 4));
        playCollapseSound();
      }
    });

    return () => unsubscribe();
  }, []);

  // 7. AI Anomaly Investigation Drawer State
  const [selectedContradiction, setSelectedContradiction] = useState<StockContradiction | null>(null);
  const [anomalyBenchmarkSymbol, setAnomalyBenchmarkSymbol] = useState<string>('NIFTY 50');
  const [anomalyBenchmarkChange, setAnomalyBenchmarkChange] = useState<number>(0.62);
  const [isAnomalyDrawerOpen, setIsAnomalyDrawerOpen] = useState<boolean>(false);

  const handleOpenAnomalyInvestigation = (
    contradiction: StockContradiction,
    benchmarkSymbol: string,
    benchmarkChange: number
  ) => {
    setSelectedContradiction(contradiction);
    setAnomalyBenchmarkSymbol(benchmarkSymbol);
    setAnomalyBenchmarkChange(benchmarkChange);
    setIsAnomalyDrawerOpen(true);
    playQuantumBeep(720, 0.05);
  };

  // Handlers for Portfolio Book Operations
  const handleSelectBook = (bookId: string) => {
    portfolioService.setActiveBookId(bookId);
    setActiveBookId(bookId);
    setSaveState(portfolioService.getSaveState());
  };

  const handleCreateBook = (name: string, description?: string, baseCurr: Currency = 'INR') => {
    const newBook = portfolioService.createBook(name, description, baseCurr);
    setBooks([...portfolioService.getBooks()]);
    setActiveBookId(newBook.id);
    setSaveState(portfolioService.getSaveState());
  };

  const handleUpdateCashBalance = (bookId: string, amount: number) => {
    portfolioService.updateCashBalance(bookId, amount);
    setBooks([...portfolioService.getBooks()]);
    setSaveState(portfolioService.getSaveState());
  };

  const handleAddHolding = (bookId: string, holding: Omit<PortfolioHolding, 'id'>) => {
    portfolioService.addHolding(bookId, holding);
    setBooks([...portfolioService.getBooks()]);
    setSaveState(portfolioService.getSaveState());
  };

  const handleAddMultipleHoldings = (bookId: string, holdingsToAdd: Omit<PortfolioHolding, 'id'>[]) => {
    portfolioService.addMultipleHoldings(bookId, holdingsToAdd);
    setBooks([...portfolioService.getBooks()]);
    setSaveState(portfolioService.getSaveState());
  };

  const handleDeleteHolding = (bookId: string, holdingId: string) => {
    portfolioService.deleteHolding(bookId, holdingId);
    setBooks([...portfolioService.getBooks()]);
    setSaveState(portfolioService.getSaveState());
  };

  // Handlers for Price Alerts
  const handleSaveAlert = (newAlertData: Omit<PriceAlert, 'id' | 'createdAt' | 'triggered'>) => {
    const newAlert: PriceAlert = {
      ...newAlertData,
      id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      triggered: false,
    };
    setAlerts(prev => [newAlert, ...prev]);
  };

  const handleDeleteAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId));
  };

  const handleRearmAlert = (alertId: string) => {
    setAlerts(prev =>
      prev.map(a => {
        if (a.id === alertId) {
          const sym = a.symbol || a.symbolOrCode || '';
          const match = sym ? marketService.findInstrument(sym) : { instrument: undefined, type: 'UNKNOWN' as const };
          const currentPrice = match.instrument && 'price' in match.instrument
            ? convertCurrency(match.instrument.price, (match.instrument as Stock).baseCurrency, a.currency, exchangeRate)
            : a.initialPrice;
          return {
            ...a,
            triggered: false,
            triggeredAt: undefined,
            triggeredPrice: undefined,
            initialPrice: currentPrice,
          };
        }
        return a;
      })
    );
  };

  // Cross-workspace routing shortcuts
  const handleSelectIndexForAnalysis = (indexId: string) => {
    setSelectedInstrumentForAnalysis(indexId);
    handleSelectTab('analyze');
  };

  const handleSelectPositionForCompare = (symbol: string) => {
    if (!compareSymbols.includes(symbol)) {
      setCompareSymbols(prev => [symbol, ...prev].slice(0, 5));
    }
    handleSelectTab('analyze');
  };

  const handleDismissNotification = (notifId: string) => {
    setAlertNotifications(prev => prev.filter(n => n.id !== notifId));
  };

  const handleToggleCurrency = () => {
    setCurrency(prev => (prev === 'INR' ? 'USD' : 'INR'));
    playQuantumBeep(650, 0.05);
  };

  const handleToggleAutosave = (enabled: boolean) => {
    portfolioService.setAutosaveEnabled(enabled);
    setAutosaveEnabled(enabled);
    setSaveState(portfolioService.getSaveState());
  };

  const handleManualSave = () => {
    portfolioService.manualSave();
    setSaveState(portfolioService.getSaveState());
  };

  const handleReloadData = () => {
    setBooks([...portfolioService.getBooks()]);
    setActiveBookId(portfolioService.getActiveBook().id);
    setSaveState(portfolioService.getSaveState());
  };

  return (
    <div className="min-h-screen bg-[#06080f] text-slate-100 flex flex-col relative cyber-grid selection:bg-indigo-600 selection:text-white">
      {/* Background Quantum Lattice */}
      <QuantumBackground />

      {/* Floating Price Alert Notification Toasts */}
      <AlertToastContainer
        notifications={alertNotifications}
        onDismiss={handleDismissNotification}
      />

      {/* Persistent Application Shell Top Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        marketMode={marketMode}
        onToggleMarketMode={handleToggleMarketMode}
        currency={currency}
        onToggleCurrency={handleToggleCurrency}
        exchangeRate={exchangeRate}
        books={books}
        activeBookId={activeBookId}
        onSelectBook={handleSelectBook}
        onOpenNewBookModal={() => setIsNewBookModalOpen(true)}
        saveState={saveState}
        onManualSave={handleManualSave}
        watchlistCount={watchlist.length}
        activeAlertsCount={alerts.filter(a => !a.triggered).length}
      />

      {/* Real-time Ticker Tape Ribbon */}
      <MarketTickerRibbon
        indices={indices}
        stocks={stocks}
        currency={currency}
        exchangeRate={exchangeRate}
        onSelectStock={stock => {
          setSelectedInstrumentForAnalysis(stock.id);
          handleSelectTab('analyze');
        }}
      />

      {/* Main Workspace Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 relative z-10">
        {/* Secondary Navigation Ribbon for Stocks Mode (Mirrors F&O Ribbon layout) */}
        {marketMode === 'EQUITY' && (
          <div className="mb-6 p-1.5 rounded-2xl bg-black/40 border border-white/[0.08] flex items-center gap-1.5 overflow-x-auto select-none">
            {[
              { id: 'overview' as WorkspaceTab, label: 'Market Overview', icon: LayoutDashboard },
              { id: 'portfolio' as WorkspaceTab, label: 'Portfolio Ledger', icon: Briefcase, badge: activeBook?.holdings?.length },
              { id: 'financials' as WorkspaceTab, label: 'Financial Statements & Highlights', icon: FileText },
              { id: 'ownership' as WorkspaceTab, label: 'Ownership & Anomalies', icon: Users },
              { id: 'analyze' as WorkspaceTab, label: 'Technical Analysis & Compare', icon: Compass },
              { id: 'settings' as WorkspaceTab, label: 'Settings & Data', icon: Settings },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    handleSelectTab(tab.id);
                    playQuantumBeep(640, 0.03);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-mono-code font-bold transition flex items-center gap-2 whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span
                      className={`text-[10px] font-mono-code px-1.5 py-0.2 rounded-md font-bold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-white/[0.08] text-slate-400'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {activeTab === 'overview' && (
          <OverviewWorkspace
            summary={bookSummary}
            indices={indices}
            currency={currency}
            exchangeRate={exchangeRate}
            onNavigateTab={handleSelectTab}
            onSelectIndexForAnalysis={handleSelectIndexForAnalysis}
            onSelectPositionForCompare={handleSelectPositionForCompare}
            onOpenProvenance={() => handleSelectTab('settings')}
          />
        )}

        {activeTab === 'portfolio' && (
          <PortfolioWorkspace
            books={books}
            activeBookId={activeBookId}
            onSelectBook={handleSelectBook}
            onCreateBook={handleCreateBook}
            onUpdateCashBalance={handleUpdateCashBalance}
            onAddHolding={handleAddHolding}
            onAddMultipleHoldings={handleAddMultipleHoldings}
            onDeleteHolding={handleDeleteHolding}
            summary={bookSummary}
            currency={currency}
            exchangeRate={exchangeRate}
            availableStocks={stocks}
            availableMutualFunds={mutualFunds}
            onSelectPositionForCompare={handleSelectPositionForCompare}
          />
        )}

        {activeTab === 'financials' && (
          <FinancialStatementsWorkspace
            availableStocks={stocks}
            selectedStockId={selectedInstrumentForAnalysis}
          />
        )}

        {activeTab === 'ownership' && (
          <OwnershipWorkspace
            currentBook={activeBook}
            availableStocks={stocks}
            indices={indices}
            currency={currency}
            exchangeRate={exchangeRate}
            onInvestigateAnomaly={handleOpenAnomalyInvestigation}
            onNavigateToStock={stockId => {
              setSelectedInstrumentForAnalysis(stockId);
              handleSelectTab('analyze');
            }}
          />
        )}

        {activeTab === 'analyze' && (
          <AnalyzeWorkspace
            stocks={stocks}
            indices={indices}
            mutualFunds={mutualFunds}
            books={books}
            selectedInstrumentId={selectedInstrumentForAnalysis}
            currency={currency}
            exchangeRate={exchangeRate}
            watchlist={watchlist}
            onToggleWatchlist={handleToggleWatchlist}
            onSelectForCompare={handleSelectPositionForCompare}
          />
        )}

        {activeTab === 'derivatives' && (
          <DerivativesWorkspace
            currency={currency}
            exchangeRate={exchangeRate}
            availableStocks={stocks}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsWorkspace
            currency={currency}
            onSetCurrency={setCurrency}
            exchangeRate={exchangeRate}
            autosaveEnabled={autosaveEnabled}
            onToggleAutosave={handleToggleAutosave}
            saveState={saveState}
            onManualSave={handleManualSave}
            watchlist={watchlist}
            alerts={alerts}
            onReloadData={handleReloadData}
          />
        )}
      </main>

      {/* New Portfolio Book Modal */}
      {isNewBookModalOpen && (
        <NewBookModal
          isOpen={isNewBookModalOpen}
          onClose={() => setIsNewBookModalOpen(false)}
          onCreateBook={handleCreateBook}
        />
      )}

      {/* AI Stock Anomaly News & Decoupling Drawer */}
      <AiStockAnomalyDrawer
        isOpen={isAnomalyDrawerOpen}
        onClose={() => setIsAnomalyDrawerOpen(false)}
        contradiction={selectedContradiction}
        marketBenchmark={anomalyBenchmarkSymbol}
        marketChangePercent={anomalyBenchmarkChange}
      />

      {/* Mode Preference Opening Screen Modal */}
      <ModeSelectionModal
        isOpen={isModeModalOpen}
        onSelectMode={handleChooseInitialMode}
        exchangeRate={exchangeRate}
      />

      {/* Educational & Risk Disclaimer with Data Provenance Sources */}
      <EducationalDisclaimerFooter onOpenDataCharter={() => handleSelectTab('settings')} />
    </div>
  );
}
