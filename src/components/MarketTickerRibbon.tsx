import React, { useState, useEffect } from 'react';
import { Currency, Stock, MarketIndex, DataFeedMode } from '../types/market';
import { marketService } from '../services/marketDataService';
import { formatCurrency } from '../utils/currency';
import { ArrowUpRight, ArrowDownRight, Activity, RefreshCw, Radio, Check, ChevronDown } from 'lucide-react';
import { playQuantumBeep } from '../utils/audio';

export interface MarketTickerRibbonProps {
  indices?: MarketIndex[];
  stocks?: Stock[];
  currency: Currency;
  exchangeRate: number;
  onSelectInstrument?: (symbolOrId: string) => void;
  onSelectStock?: (stock: Stock) => void;
}

export const MarketTickerRibbon: React.FC<MarketTickerRibbonProps> = ({
  indices: propIndices,
  stocks: propStocks,
  currency,
  exchangeRate,
  onSelectInstrument,
  onSelectStock,
}) => {
  const [feedMode, setFeedModeState] = useState<DataFeedMode>(marketService.getFeedMode());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFeedMenu, setShowFeedMenu] = useState(false);
  const [latency, setLatency] = useState(marketService.getApiLatency());

  useEffect(() => {
    const interval = setInterval(() => {
      setLatency(marketService.getApiLatency());
      setFeedModeState(marketService.getFeedMode());
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleManualSync = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRefreshing(true);
    playQuantumBeep(640, 0.03);
    await marketService.syncLiveExchangeQuotes();
    setLatency(marketService.getApiLatency());
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const handleSelectFeedMode = (mode: DataFeedMode) => {
    marketService.setFeedMode(mode);
    setFeedModeState(mode);
    setShowFeedMenu(false);
    playQuantumBeep(700, 0.04);
  };

  const stocks = propStocks || marketService.getStocks();
  const mutualFunds = marketService.getMutualFunds();
  const indices = propIndices || marketService.getIndices();

  // Combine key benchmarks, equities, and mutual funds
  const rawItems = [
    ...indices.map(idx => ({
      id: idx.id,
      symbol: idx.symbol,
      typeLabel: 'INDEX',
      priceStr: idx.currency === 'INR' ? `₹${idx.value.toLocaleString('en-IN')}` : `$${idx.value.toLocaleString('en-US')}`,
      changePercent: idx.changePercent,
      stockObj: undefined,
    })),
    ...stocks.slice(0, 8).map(s => ({
      id: s.id,
      symbol: s.symbol,
      typeLabel: s.exchange,
      priceStr: formatCurrency(s.price, currency, s.baseCurrency, exchangeRate),
      changePercent: s.changePercent,
      stockObj: s,
    })),
    ...mutualFunds.slice(0, 4).map(mf => ({
      id: mf.id,
      symbol: mf.symbol,
      typeLabel: 'MF NAV',
      priceStr: formatCurrency(mf.nav, currency, mf.currency, exchangeRate),
      changePercent: mf.changePercent,
      stockObj: undefined,
    })),
  ];

  // Duplicate for seamless continuous looping marquee roll
  const loopItems = [...rawItems, ...rawItems];

  const handleClick = (item: (typeof rawItems)[0]) => {
    if (item.stockObj && onSelectStock) {
      onSelectStock(item.stockObj);
    } else if (onSelectInstrument) {
      onSelectInstrument(item.id);
    }
  };

  return (
    <div className="w-full bg-[#060810]/95 border-b border-white/[0.06] overflow-hidden py-1.5 px-3 sm:px-5 lg:px-6 backdrop-blur-md relative select-none">
      <div className="flex items-center">
        {/* Dynamic Feed Status & Mode Switcher */}
        <div className="relative bg-[#060810]/95 pr-3 pl-0 z-20 flex items-center gap-1.5 shrink-0 border-r border-white/[0.08]">
          <button
            onClick={() => setShowFeedMenu(!showFeedMenu)}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-[10px] font-mono-code transition cursor-pointer"
            title="Click to change live data feed provider"
          >
            {feedMode === 'LIVE_EXCHANGE' ? (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            ) : (
              <Activity className="w-3 h-3 text-sky-400" />
            )}
            <span className="font-bold text-slate-200">
              {feedMode === 'LIVE_EXCHANGE' ? 'LIVE NSE · US' : feedMode === 'SIMULATED' ? 'SIMULATED TICK' : 'EOD FEED'}
            </span>
            <span className="text-[9px] text-slate-500 hidden sm:inline">
              ({latency}ms)
            </span>
            <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
          </button>

          {/* Quick Refresh Icon */}
          <button
            onClick={handleManualSync}
            className={`p-1 rounded text-slate-400 hover:text-white transition ${isRefreshing ? 'animate-spin text-sky-400' : ''}`}
            title="Force sync real live exchange quotes now"
          >
            <RefreshCw className="w-2.5 h-2.5" />
          </button>

          {/* Feed Mode Dropdown Popover */}
          {showFeedMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowFeedMenu(false)}
              />
              <div className="absolute left-0 top-full mt-2 w-72 rounded-xl bg-[#0a0f1d] border border-white/[0.12] shadow-2xl p-2.5 z-50 text-left font-sans">
                <div className="px-2 py-1 text-[10px] font-mono-code uppercase tracking-wider text-slate-400 border-b border-white/[0.06] mb-1.5">
                  Select Market Data Feed Mode
                </div>
                <div className="space-y-1">
                  <button
                    onClick={() => handleSelectFeedMode('LIVE_EXCHANGE')}
                    className={`w-full flex items-start gap-2.5 p-2 rounded-lg text-left transition ${
                      feedMode === 'LIVE_EXCHANGE'
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold'
                        : 'text-slate-300 hover:bg-white/[0.04]'
                    }`}
                  >
                    <span className="relative flex h-2 w-2 mt-1 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <div className="flex-1">
                      <div className="text-xs font-heading font-bold flex items-center justify-between">
                        <span>Live Exchange Feed</span>
                        {feedMode === 'LIVE_EXCHANGE' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono-code mt-0.5">
                        Real NSE (National Stock Exchange) + US (NASDAQ/NYSE) market quotes via Yahoo Finance REST pipeline with 5s auto-poll.
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleSelectFeedMode('SIMULATED')}
                    className={`w-full flex items-start gap-2.5 p-2 rounded-lg text-left transition ${
                      feedMode === 'SIMULATED'
                        ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30 font-semibold'
                        : 'text-slate-300 hover:bg-white/[0.04]'
                    }`}
                  >
                    <Radio className="w-3 h-3 text-sky-400 mt-1 shrink-0" />
                    <div className="flex-1">
                      <div className="text-xs font-heading font-bold flex items-center justify-between">
                        <span>Simulated Micro-Ticks</span>
                        {feedMode === 'SIMULATED' && <Check className="w-3.5 h-3.5 text-sky-400" />}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono-code mt-0.5">
                        High-frequency synthetic price action generator (2.8s intervals with geometric Brownian motion).
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleSelectFeedMode('EOD_HISTORICAL')}
                    className={`w-full flex items-start gap-2.5 p-2 rounded-lg text-left transition ${
                      feedMode === 'EOD_HISTORICAL'
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold'
                        : 'text-slate-300 hover:bg-white/[0.04]'
                    }`}
                  >
                    <Activity className="w-3 h-3 text-amber-400 mt-1 shrink-0" />
                    <div className="flex-1">
                      <div className="text-xs font-heading font-bold flex items-center justify-between">
                        <span>EOD Historical Static</span>
                        {feedMode === 'EOD_HISTORICAL' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono-code mt-0.5">
                        Verified closing prices from Bhavcopy regulatory exchange filings.
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Rolling Marquee Container */}
        <div className="overflow-hidden flex-1 ml-3">
          <div className="animate-ticker-roll flex items-center gap-6 whitespace-nowrap text-xs font-mono-code">
            {loopItems.map((item, idx) => {
              const isUp = item.changePercent >= 0;
              return (
                <div
                  key={`${item.id}-${idx}`}
                  onClick={() => handleClick(item)}
                  className="flex items-center gap-2 px-2.5 py-0.5 rounded-md hover:bg-white/[0.05] transition cursor-pointer group"
                  title={`Inspect ${item.symbol}`}
                >
                  <span className="text-[10px] px-1 py-0.2 rounded bg-white/[0.05] text-slate-400 border border-white/[0.08]">
                    {item.typeLabel}
                  </span>
                  <span className="text-slate-200 font-semibold group-hover:text-sky-300 transition">
                    {item.symbol}
                  </span>
                  <span className="text-white font-medium">{item.priceStr}</span>
                  <span
                    className={`flex items-center text-[11px] font-bold ${
                      isUp ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {isUp ? '+' : ''}{item.changePercent.toFixed(2)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
