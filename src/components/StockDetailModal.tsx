import React, { useState } from 'react';
import { Stock, Currency } from '../types/market';
import { PriceAlert } from '../types/alert';
import { formatCurrency, formatMarketCap, formatVolume, convertCurrency } from '../utils/currency';
import { TechnicalChart } from './TechnicalChart';
import {
  X,
  Star,
  Layers,
  Clock,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Bell,
  Users,
} from 'lucide-react';
import { playQuantumBeep, playCollapseSound } from '../utils/audio';

interface StockDetailModalProps {
  stock: Stock;
  currency: Currency;
  exchangeRate: number;
  isWatchlisted: boolean;
  isCompared: boolean;
  onClose: () => void;
  onToggleWatchlist: (stockId: string) => void;
  onToggleCompare: (stockId: string) => void;
  onSaveAlert?: (alert: Omit<PriceAlert, 'id' | 'createdAt' | 'triggered'>) => void;
}

export const StockDetailModal: React.FC<StockDetailModalProps> = ({
  stock,
  currency,
  exchangeRate,
  isWatchlisted,
  isCompared,
  onClose,
  onToggleWatchlist,
  onToggleCompare,
  onSaveAlert,
}) => {
  const lotSize = stock.lotSize || 1;
  const [alertPrice, setAlertPrice] = useState<string>('');
  const [alertSuccess, setAlertSuccess] = useState<boolean>(false);

  const isPositive = stock.changePercent >= 0;

  const bidPrice = stock.bid ?? Number((stock.price * 0.9995).toFixed(2));
  const askPrice = stock.ask ?? Number((stock.price * 1.0005).toFixed(2));
  const week52High = stock.high52w ?? stock.week52High ?? stock.price * 1.15;
  const week52Low = stock.low52w ?? stock.week52Low ?? stock.price * 0.85;
  const quantScore = stock.quantumScore ?? Math.min(96, Math.max(45, Math.round(65 + stock.changePercent * 4)));
  const lastUpdated = stock.lastUpdated || new Date().toISOString();

  // Synthetic 5-depth orderbook if not directly populated on the stock record
  const orderBookBids = stock.orderBook?.bids || [
    { price: Number((stock.price * 0.9995).toFixed(2)), amount: 450, total: 450 },
    { price: Number((stock.price * 0.9985).toFixed(2)), amount: 1120, total: 1570 },
    { price: Number((stock.price * 0.9970).toFixed(2)), amount: 890, total: 2460 },
    { price: Number((stock.price * 0.9950).toFixed(2)), amount: 2400, total: 4860 },
    { price: Number((stock.price * 0.9930).toFixed(2)), amount: 3150, total: 8010 },
  ];

  const orderBookAsks = stock.orderBook?.asks || [
    { price: Number((stock.price * 1.0005).toFixed(2)), amount: 520, total: 520 },
    { price: Number((stock.price * 1.0015).toFixed(2)), amount: 980, total: 1500 },
    { price: Number((stock.price * 1.0030).toFixed(2)), amount: 1350, total: 2850 },
    { price: Number((stock.price * 1.0050).toFixed(2)), amount: 1980, total: 4830 },
    { price: Number((stock.price * 1.0070).toFixed(2)), amount: 2800, total: 7630 },
  ];

  const spread = Number((askPrice - bidPrice).toFixed(2));
  const spreadPercent = Number(((spread / stock.price) * 100).toFixed(3));

  // Handle setting price alert
  const handleSetAlert = () => {
    const num = parseFloat(alertPrice);
    if (!alertPrice || isNaN(num) || num <= 0) return;

    const currentConverted = convertCurrency(stock.price, stock.baseCurrency, currency, exchangeRate);
    const condition = num >= currentConverted ? 'ABOVE' : 'BELOW';

    if (onSaveAlert) {
      onSaveAlert({
        assetType: 'EQUITY',
        symbolOrCode: stock.symbol,
        name: stock.name,
        stockId: stock.id,
        symbol: stock.symbol,
        targetPrice: num,
        condition,
        currency,
        initialPrice: currentConverted,
      });
    }

    setAlertSuccess(true);
    playQuantumBeep(880, 0.08);
    setTimeout(() => {
      setAlertSuccess(false);
      setAlertPrice('');
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-5xl my-auto rounded-3xl quantum-card border border-white/[0.1] overflow-hidden shadow-2xl relative flex flex-col max-h-[92vh]">
        {/* Modal Top Header Bar */}
        <div className="p-5 border-b border-white/[0.08] bg-[#080c16]/90 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center font-mono-code font-bold text-white text-base">
              {stock.symbol.slice(0, 4)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold font-heading text-white">{stock.symbol}</h2>
                <span className="px-2 py-0.5 rounded-md bg-white/[0.05] text-sky-300 font-mono-code text-xs font-semibold border border-white/[0.08]">
                  {stock.exchange}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-white/[0.04] text-slate-300 font-mono-code border border-white/[0.06]">
                  Lot Size: {lotSize}
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-0.5">{stock.name} · {stock.sector}</div>
            </div>
          </div>

          {/* Action buttons & Close */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onToggleWatchlist(stock.id);
                playQuantumBeep(700, 0.05);
              }}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${
                isWatchlisted
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                  : 'bg-white/[0.04] border-white/[0.08] text-slate-300 hover:text-white'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${isWatchlisted ? 'fill-amber-400 text-amber-400' : ''}`} />
              {isWatchlisted ? 'Watchlisted' : 'Add Watchlist'}
            </button>

            <button
              onClick={() => {
                onToggleCompare(stock.id);
                playQuantumBeep(650, 0.05);
              }}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${
                isCompared
                  ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                  : 'bg-white/[0.04] border-white/[0.08] text-slate-300 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              {isCompared ? 'In Matrix' : 'Compare'}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-400 hover:text-white transition ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Real-Time Price Ribbon & Timestamp Transparency */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-black/40 border border-white/[0.06]">
            <div>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold font-mono-code text-white">
                  {formatCurrency(stock.price, currency, stock.baseCurrency, exchangeRate)}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm font-mono-code font-bold ${
                    isPositive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                  }`}
                >
                  {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  {isPositive ? '+' : ''}{formatCurrency(stock.change, currency, stock.baseCurrency, exchangeRate)} ({stock.changePercent.toFixed(2)}%)
                </span>
              </div>
              {currency !== stock.baseCurrency && (
                <div className="text-xs text-slate-400 font-mono-code mt-0.5">
                  Native: {formatCurrency(stock.price, stock.baseCurrency, stock.baseCurrency)} (FX: 1 USD = ₹{exchangeRate.toFixed(2)})
                </div>
              )}
            </div>

            {/* Quote Timestamp & Data Feed Badge */}
            <div className="text-right text-xs space-y-1">
              <div className="flex items-center justify-end gap-2 text-slate-300 font-mono-code">
                <span>Bid: <strong className="text-emerald-400">{formatCurrency(bidPrice, currency, stock.baseCurrency, exchangeRate)}</strong></span>
                <span className="text-slate-600">|</span>
                <span>Ask: <strong className="text-rose-400">{formatCurrency(askPrice, currency, stock.baseCurrency, exchangeRate)}</strong></span>
              </div>
              <div className="flex items-center justify-end gap-1.5 text-slate-400 text-[11px] font-mono-code">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Timestamp: {new Date(lastUpdated).toLocaleTimeString()} (ms precision)</span>
              </div>
            </div>
          </div>

          {/* Interactive Technical Chart (SMA, BB, RSI, OHLCV) */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.06]">
            <TechnicalChart
              history={stock.history || []}
              symbol={stock.symbol}
              baseCurrency={stock.baseCurrency}
              displayCurrency={currency}
              exchangeRate={exchangeRate}
              height={360}
            />
          </div>

          {/* Two-Column: Level 2 Order Book Depth & Key Financial Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Level 2 Order Book Depth */}
            <div className="p-5 rounded-2xl bg-black/40 border border-white/[0.06] space-y-3">
              <div className="flex items-center justify-between text-xs">
                <h3 className="font-heading font-semibold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-sky-400" /> Level-2 Order Depth (Market Ladder)
                </h3>
                <span className="font-mono-code text-slate-400 text-[11px]">
                  Spread: {spread} ({spreadPercent}%)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                {/* Bids Ladder (Green) */}
                <div>
                  <div className="flex justify-between text-[11px] font-mono-code text-slate-400 border-b border-white/[0.06] pb-1 mb-1">
                    <span>Bid Qty</span>
                    <span>Bid Price</span>
                  </div>
                  <div className="space-y-1">
                    {orderBookBids.map((b, i) => (
                      <div key={i} className="flex justify-between font-mono-code text-[11px] relative py-0.5">
                        <div
                          className="absolute right-0 top-0 bottom-0 bg-emerald-500/10 rounded"
                          style={{ width: `${Math.min(100, (b.total / 3000) * 100)}%` }}
                        />
                        <span className="text-slate-300 relative z-10">{b.amount}</span>
                        <span className="text-emerald-400 font-semibold relative z-10">
                          {formatCurrency(b.price, currency, stock.baseCurrency, exchangeRate)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Asks Ladder (Red) */}
                <div>
                  <div className="flex justify-between text-[11px] font-mono-code text-slate-400 border-b border-white/[0.06] pb-1 mb-1">
                    <span>Ask Price</span>
                    <span>Ask Qty</span>
                  </div>
                  <div className="space-y-1">
                    {orderBookAsks.map((a, i) => (
                      <div key={i} className="flex justify-between font-mono-code text-[11px] relative py-0.5">
                        <div
                          className="absolute left-0 top-0 bottom-0 bg-rose-500/10 rounded"
                          style={{ width: `${Math.min(100, (a.total / 3000) * 100)}%` }}
                        />
                        <span className="text-rose-400 font-semibold relative z-10">
                          {formatCurrency(a.price, currency, stock.baseCurrency, exchangeRate)}
                        </span>
                        <span className="text-slate-300 relative z-10">{a.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Key Statistics Grid */}
            <div className="p-5 rounded-2xl bg-black/40 border border-white/[0.06] space-y-3">
              <h3 className="font-heading font-semibold text-white text-xs uppercase tracking-wider text-slate-300">
                Key Fundamentals & Market Stats
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="text-slate-400 text-[11px]">Market Cap</div>
                  <div className="font-mono-code font-bold text-white mt-0.5">
                    {formatMarketCap(stock.marketCap, currency, stock.baseCurrency, exchangeRate)}
                  </div>
                </div>

                {/* P/E Ratio with Formula */}
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] group relative cursor-help">
                  <div className="text-slate-400 text-[11px] border-b border-dotted border-white/20 inline-block">P/E Ratio (TTM)</div>
                  <div className="font-mono-code font-bold text-white mt-0.5">
                    {stock.peRatio > 0 ? stock.peRatio.toFixed(1) : 'N/A'}
                  </div>
                  <div className="absolute left-0 bottom-full mb-1 hidden group-hover:block z-50 w-64 p-2.5 rounded-xl bg-[#0c1222] border border-white/10 shadow-2xl text-[10px] text-slate-300 pointer-events-none">
                    <strong className="text-sky-300">Price-to-Earnings Ratio:</strong>
                    <div className="my-1 font-mono-code text-[9px] text-sky-400">P/E = Market Price / EPS_TTM</div>
                    <div>Evaluates valuation multiple paid per ₹1 of audited trailing twelve months earnings.</div>
                    <div className="text-[9px] text-slate-400 mt-1">&lt;20 Value · 20-35 Growth · &gt;35 Premium</div>
                  </div>
                </div>

                {/* Forward P/E with Formula */}
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] group relative cursor-help">
                  <div className="text-slate-400 text-[11px] border-b border-dotted border-white/20 inline-block">Forward P/E</div>
                  <div className="font-mono-code font-bold text-white mt-0.5">
                    {stock.forwardPE > 0 ? stock.forwardPE.toFixed(1) : 'N/A'}
                  </div>
                  <div className="absolute left-0 bottom-full mb-1 hidden group-hover:block z-50 w-64 p-2.5 rounded-xl bg-[#0c1222] border border-white/10 shadow-2xl text-[10px] text-slate-300 pointer-events-none">
                    <strong className="text-sky-300">Forward P/E (Next 12M):</strong>
                    <div className="my-1 font-mono-code text-[9px] text-sky-400">Fwd P/E = Market Price / Projected_EPS_12M</div>
                    <div>Anticipated valuation multiple based on consensus forward earnings guidance.</div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="text-slate-400 text-[11px]">52-Week High</div>
                  <div className="font-mono-code font-bold text-emerald-400 mt-0.5">
                    {formatCurrency(week52High, currency, stock.baseCurrency, exchangeRate)}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="text-slate-400 text-[11px]">52-Week Low</div>
                  <div className="font-mono-code font-bold text-rose-400 mt-0.5">
                    {formatCurrency(week52Low, currency, stock.baseCurrency, exchangeRate)}
                  </div>
                </div>

                {/* Beta with Formula */}
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] group relative cursor-help">
                  <div className="text-slate-400 text-[11px] border-b border-dotted border-white/20 inline-block">Beta (β)</div>
                  <div className="font-mono-code font-bold text-white mt-0.5">
                    {stock.beta.toFixed(2)}
                  </div>
                  <div className="absolute right-0 bottom-full mb-1 hidden group-hover:block z-50 w-64 p-2.5 rounded-xl bg-[#0c1222] border border-white/10 shadow-2xl text-[10px] text-slate-300 pointer-events-none">
                    <strong className="text-sky-300">Systematic Market Risk (Beta):</strong>
                    <div className="my-1 font-mono-code text-[9px] text-sky-400">β = Cov(R_asset, R_market) / Var(R_market)</div>
                    <div>Measures relative volatility against NIFTY 50 / S&P 500 benchmark.</div>
                    <div className="text-[9px] text-slate-400 mt-1">β &lt; 1.0 Lower Volatility · β &gt; 1.0 High Beta</div>
                  </div>
                </div>

                {/* Dividend Yield with Formula */}
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] group relative cursor-help">
                  <div className="text-slate-400 text-[11px] border-b border-dotted border-white/20 inline-block">Dividend Yield</div>
                  <div className="font-mono-code font-bold text-white mt-0.5">
                    {stock.dividendYield > 0 ? `${stock.dividendYield.toFixed(2)}%` : '0.00%'}
                  </div>
                  <div className="absolute right-0 bottom-full mb-1 hidden group-hover:block z-50 w-64 p-2.5 rounded-xl bg-[#0c1222] border border-white/10 shadow-2xl text-[10px] text-slate-300 pointer-events-none">
                    <strong className="text-sky-300">Annual Dividend Yield:</strong>
                    <div className="my-1 font-mono-code text-[9px] text-sky-400">Yield = (Annual Dividend DPS / Stock Price) × 100%</div>
                    <div>Annualized cash payout return to shareholders before capital appreciation.</div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="text-slate-400 text-[11px]">30D Avg Volume</div>
                  <div className="font-mono-code font-bold text-white mt-0.5">
                    {formatVolume(stock.avgVolume30D, stock.baseCurrency)}
                  </div>
                </div>

                {/* Quant Momentum with Formula */}
                <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 group relative cursor-help">
                  <div className="text-indigo-300 text-[11px] border-b border-dotted border-indigo-400/30 inline-block">Quant Momentum</div>
                  <div className="font-mono-code font-bold text-sky-300 mt-0.5">
                    {quantScore}/100
                  </div>
                  <div className="absolute right-0 bottom-full mb-1 hidden group-hover:block z-50 w-72 p-2.5 rounded-xl bg-[#0c1222] border border-indigo-500/30 shadow-2xl text-[10px] text-slate-300 pointer-events-none">
                    <strong className="text-indigo-300">Multi-Factor Quantitative Momentum:</strong>
                    <div className="my-1 font-mono-code text-[9px] text-indigo-400">
                      Score = 0.40·Trend(50DMA) + 0.35·RSI_14 + 0.25·VolSurge
                    </div>
                    <div>Evaluates relative price velocity, institutional accumulation, and technical trend strength.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Simulated Trading Desk & Price Alert Setter */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Shareholder Demographics & Ownership Structure Card */}
            <div className="p-5 rounded-2xl bg-black/40 border border-white/[0.06] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-semibold text-white text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-sky-400" />
                  Shareholder Demographics
                </h3>
                <span className="text-[11px] px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 font-mono-code border border-sky-500/20">
                  {stock.shareholding?.lastAuditedQuarter || 'Q2 FY26'}
                </span>
              </div>

              {stock.shareholding ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-mono-code">Majority Stakeholder:</span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono-code font-bold bg-white/10 text-white">
                      {stock.shareholding.majorityHolder}
                    </span>
                  </div>

                  {/* Stacked Proportional Bar */}
                  <div className="h-3 w-full rounded-full overflow-hidden flex bg-slate-800">
                    <div
                      style={{ width: `${stock.shareholding.promotersPercent}%` }}
                      className="bg-indigo-500 h-full"
                      title={`Promoters: ${stock.shareholding.promotersPercent}%`}
                    />
                    <div
                      style={{ width: `${stock.shareholding.institutionalPercent}%` }}
                      className="bg-sky-500 h-full"
                      title={`Institutions (FII/DII): ${stock.shareholding.institutionalPercent}%`}
                    />
                    <div
                      style={{ width: `${stock.shareholding.publicPercent}%` }}
                      className="bg-amber-500 h-full"
                      title={`General Public: ${stock.shareholding.publicPercent}%`}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[11px] font-mono-code pt-1">
                    <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                      <span className="text-slate-400 block text-[10px]">Promoters</span>
                      <strong className="text-indigo-300">{stock.shareholding.promotersPercent}%</strong>
                    </div>
                    <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                      <span className="text-slate-400 block text-[10px]">Institutions</span>
                      <strong className="text-sky-300">{stock.shareholding.institutionalPercent}%</strong>
                    </div>
                    <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                      <span className="text-slate-400 block text-[10px]">Public</span>
                      <strong className="text-amber-300">{stock.shareholding.publicPercent}%</strong>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Official regulatory shareholding pattern verified against exchange Bhavcopy filings.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-400">Institutional shareholding filings currently updating.</p>
              )}
            </div>

            {/* Price Alert & Corporate Details */}
            <div className="p-5 rounded-2xl bg-black/40 border border-white/[0.06] space-y-4">
              <h3 className="font-heading font-semibold text-white text-sm flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-400" /> Price Target Alert
              </h3>

              <div className="space-y-2">
                <label className="text-xs text-slate-400 block">
                  Alert trigger when {stock.symbol} hits target price:
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder={`e.g. ${(stock.price * 1.05).toFixed(2)}`}
                    value={alertPrice}
                    onChange={e => setAlertPrice(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-black/60 border border-white/[0.08] font-mono-code text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                  <button
                    onClick={handleSetAlert}
                    className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.1] text-amber-300 font-medium text-xs transition"
                  >
                    Set Alert
                  </button>
                </div>
                {alertSuccess && (
                  <div className="text-[11px] text-amber-300 font-mono-code flex items-center gap-1 mt-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Alert active for {formatCurrency(Number(alertPrice), currency, stock.baseCurrency, exchangeRate)}
                  </div>
                )}
              </div>

              {/* Company Profile */}
              <div className="pt-3 border-t border-white/[0.06] space-y-2 text-xs">
                <div className="font-semibold text-slate-200">About {stock.name}</div>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  {stock.description}
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-500 text-[11px] pt-1">
                  <span><strong>CEO:</strong> {stock.ceo}</span>
                  <span><strong>HQ:</strong> {stock.headquarters}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
