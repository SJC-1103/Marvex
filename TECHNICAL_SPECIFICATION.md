# Marvex Quant Terminal: Technical Specification & Backend Architecture

## 1. System Overview & Dual-Engine Architecture
**Marvex Quant Terminal (`MARVEX.QUANT`)** is a professional-grade quantitative financial intelligence platform designed for institutional-level equity analysis and derivatives modeling. The application is built upon a high-performance full-stack TypeScript architecture featuring a dual-mode operational interface:
1. **Equity & Spot Markets Mode (`EQUITY`)**: Cash equities, multi-exchange benchmarks, mutual funds, portfolio book tracking, 3-statement financial analysis, multi-factor scoring methodology, shareholder demographic distributions, market divergence detection, and AI anomaly synthesis.
2. **Derivatives & F&O Mode (`DERIVATIVES`)**: Black-Scholes-Merton (BSM) analytical pricing engines, real-time partial derivative Greeks sensitivity lab, live NSE option chain matrix with Max Pain and PCR sentiment analysis, interactive multi-leg strategy payoff simulator, and AI F&O microstructure audits.

---

## 2. Complete Backend Architecture & Data Feeds

### 2.1 Server Runtime & Process Model
* **Server Framework**: Node.js Express application running via `server.ts`.
* **Port Binding**: Binds exclusively to `0.0.0.0:3000` for containerized environments.
* **Dual Execution Mode**:
  * *Development*: Integrates Vite middleware (`vite.middlewares`) with Hot Module Replacement (HMR) bypass.
  * *Production*: Pre-compiles the React application into `/dist` and serves static assets with index fallbacks.
* **Internal Control Plane & Health Endpoints**:
  * `/__aistudio_internal_control_plane/dev/status`: Applet status and lifecycle reporting.
  * `/health`, `/healthz`: HTTP 200 health checks with uptime, memory footprint, and process metadata.

### 2.2 Live Exchange Feed Pipeline (`/api/market/live-quotes`)
* **Real-World Exchanges Covered**:
  * **National Stock Exchange of India (NSE)**: `RELIANCE.NS`, `TCS.NS`, `HDFCBANK.NS`, `INFY.NS`, `TATAMOTORS.NS`, `ICICIBANK.NS`.
  * **Indian Market Benchmarks**: `^NSEI` (NIFTY 50), `^BSESN` (BSE SENSEX), `^NSEBANK` (Nifty Bank), `^CNXIT` (Nifty IT).
  * **US Exchanges (NASDAQ / NYSE)**: `NVDA`, `TSLA`, `MSFT`, `AAPL`, `^NDX` (Nasdaq 100), `^GSPC` (S&P 500).
* **Exchange Resolution Protocol**:
  * Indian ticker symbols automatically resolve with the `.NS` exchange suffix.
  * REST calls query Yahoo Finance Chart v8 endpoints with customized user-agent headers.
  * High-water mark parsing extracts real-world `regularMarketPrice`, `previousClose`, `regularMarketDayHigh`, `regularMarketDayLow`, `regularMarketVolume`, net change, and percentage change.
* **In-Memory Low-Latency Cache**:
  * Implements an in-memory 6,000ms TTL cache (`quoteCache`).
  * Enforces rate-limit resilience: Multiple parallel client requests within a 6-second window receive cached memory buffers with `< 5ms` server turnaround.
  * Background cache eviction updates live prices every 5,000ms.
* **Graceful Degradation & Fallback Circuit**:
  * If the upstream exchange gateway is unreachable or offline during market holidays, the backend falls back to verified Bhavcopy closing prices while maintaining data integrity without crashing the UI.

### 2.3 Live Exchange Status Endpoint (`/api/market/status`)
* Reports active server data feed mode (`LIVE_EXCHANGE_FEED`), upstream exchange latency in milliseconds, count of live tracked symbols, and ISO timestamps.

### 2.4 Generative AI Backend Pipeline (`/api/market/fo-ai-audit`)
* **SDK**: Google GenAI SDK (`@google/genai`) using modern client instantiation.
* **Model Configuration**: `gemini-3.8-flash` executing structured JSON schema decoding.
* **Latency Guarantee**: Enforces an asynchronous 5,000ms timeout race (`Promise.race`) against a deterministic quantitative heuristics fallback engine.
* **Structured Output Schema**:
  * `verdict`: Institutional sentiment (`BULLISH`, `BEARISH`, `NEUTRAL`, `ANOMALOUS_SKEW`).
  * `confidenceScore`: Confidence probability (0–100%).
  * `headline`: Executive institutional summary.
  * `keyObservations`: 3 prioritized quantitative findings.
  * `microstructureAnalysis`: Analysis of Open Interest concentration, Max Pain divergence, PCR skew, and promoter encumbrance.
  * `recommendedStrategy`: Defined-risk option structure with target breakeven.
  * `riskWarning`: Mandatory SEBI/regulatory risk disclosure.

---

## 3. Client Architecture & Service Layer

### 3.1 Market Data Service (`marketDataService.ts`)
* Singleton event-driven service managing real-time price state across all UI workspaces.
* **Operational Modes**:
  1. `LIVE_EXCHANGE`: Real-time quotes polled every 5s from `/api/market/live-quotes`.
  2. `SIMULATED`: Micro-tick engine generating geometric Brownian motion price fluctuations every 2.8s.
  3. `EOD_HISTORICAL`: Static closing prices verified from exchange filings.
* **Observer Pattern**: Components subscribe to `subscribe(callback)` for non-blocking UI updates with zero unnecessary re-renders.

### 3.2 Portfolio Persistence Service (`portfolioService.ts`)
* Manages multi-book investment ledgers with local persistence (`localStorage`) and cloud sync states (`SAVED`, `SAVING`, `ERROR`).
* Real-time calculation of Total Asset Value, Unrealized P&L, Realized P&L, Daily Net Return, and currency conversions between INR and USD.

---

## 4. Comprehensive Features List

### 4.1 Global Navigation & Ribbon Architecture
1. **Marvex Brand Bar**:
   * Brand mark placed cleanly against edge without visual clutter.
   * Unboxed, clean typography hierarchy (`MARVEX.QUANT`).
2. **Rupee-to-Dollar Live Currency Parity**:
   * Top ribbon button displays active base currency (`₹ INR / $ USD`).
   * Clean hover card displaying exact exchange rate ($1.00 USD = ₹86.85 INR) and real-time conversion examples.
3. **Live Exchange Status & Mode Switcher**:
   * Pulsing indicator badge (`● LIVE NSE · US`) displaying API round-trip latency in milliseconds.
   * Quick-refresh button for on-demand exchange polling.
   * Interactive popover menu to switch between Live Exchange Feed, Simulated Micro-Ticks, and EOD Historical Static modes.
4. **Independent Navigation Ribbons**:
   * Separate secondary navigation ribbons for Stocks Mode (`EQUITY`) and F&O Mode (`DERIVATIVES`).

### 4.2 Stocks Mode Features
1. **Financial Statements & Investor Essential Highlights Workspace**:
   * **Dual Split-Screen View**:
     * *Left Pane*: Audited Financial Statements with interactive sub-tabs for Income Statement, Balance Sheet, and Cash Flow Statement (spanning FY24–FY26).
     * *Right Pane*: Investor Essential Highlights featuring executive verdict, scoring badge, and crucial ratios.
   * **Transparent Scoring Methodology**:
     * Multi-factor scoring model:
       $$\text{Verdict Score} = (0.40 \times \text{Profitability}) + (0.35 \times \text{Solvency}) + (0.25 \times \text{Growth})$$
     * Interactive hover cards on **Profitability**, **Solvency**, and **Trajectory (Growth)** showing exact sub-scores out of 100, weighting percentages, formulas, and benchmark metrics.
     * Full methodology modal explaining metric thresholds and point allocations.
     * Crucial financial ratios displaying mathematical formulas on hover.
2. **Stock Explorer & Comparison Matrix**:
   * Multi-column screener with sector filters, market cap sorting, 52-week high/low range bars, and tabular numerals.
   * Multi-stock comparative matrix plotting relative P/E, beta, dividend yields, and price performance.
3. **Technical Charting Canvas (`TechnicalChart.tsx`)**:
   * Interactive SVG candlestick and line chart with crosshair price tracking and date interpolation.
   * Mathematical indicator overlays with formula hover cards:
     * **SMA(20)**: Short-term trend moving average.
     * **SMA(50)**: Medium-term trend line and Golden Cross threshold.
     * **Bollinger Bands (20, 2σ)**: Statistical volatility envelope.
     * **RSI(14)**: Momentum oscillator with overbought (>70) and oversold (<30) criteria.
4. **Stock Detail Modal (`StockDetailModal.tsx`)**:
   * Real-time 5-depth Level II order book (bids/asks and cumulative volumes).
   * Key institutional valuation metrics with formula tooltips: P/E (TTM), Forward P/E (12M), Beta ($\beta$), Dividend Yield, and Quant Momentum score.
   * Regulatory shareholder demographics (Promoter, Institutional FII/DII, and Public floating shares).
   * Price target alert creation engine.
5. **Ownership Demographics & Market Decoupling**:
   * Divergence intelligence engine isolating portfolio stocks contradicting broad market momentum.

### 4.3 F&O Mode Features
1. **NSE Option Chain Matrix (`OptionChainView.tsx`)**:
   * Bidirectional strike ladder around At-The-Money (ATM).
   * Real-time calculation of Call & Put Open Interest (OI), Volume, Implied Volatility (IV), Delta, Theta, and Last Traded Price (LTP).
   * Formula & criteria hover cards for **Max Pain Strike ($K^*$)**, **Put-Call Ratio (PCR)**, and each table column header.
2. **Strategy Builder & Payoff Simulator (`StrategyBuilder.tsx`)**:
   * Multi-leg options and index futures builder (up to 4 legs).
   * Real-time SVG payoff chart showing expiration payoff curve, T+n target holding date valuation curve, underlying spot marker, and breakeven roots.
   * **IV Scenario Shift Slider**: Stress-tests portfolio valuation across $-15\%$ to $+15\%$ volatility shifts with first-order Vega repricing.
   * **Target DTE Slider**: Visualizes non-linear time-decay ($1/\sqrt{T}$) acceleration up to expiry day.
   * Strategy summary matrix with formula hover cards: Net Outlay/Cashflow, Max Profit ceiling, Max Loss drawdown, Probability of Profit ($POP \approx N(d_2)$), and Risk:Reward ratio.
   * Institutional quick blueprints (Bull Call Spread, Bear Put Spread, Iron Condor, Protective Collar).
3. **Black-Scholes Greeks Sensitivity Lab (`GreeksLab.tsx`)**:
   * Dynamic sliders for Spot Price ($S$), Strike ($K$), Days to Expiration ($T$), Implied Volatility ($\sigma$), and Risk-Free Rate ($r$).
   * Side-by-side European Call vs. Put pricing and partial derivative sensitivities:
     * Delta ($\Delta = \partial V / \partial S$)
     * Gamma ($\Gamma = \partial^2 V / \partial S^2$)
     * Theta ($\theta = -\partial V / \partial t$)
     * Vega ($\nu = \partial V / \partial \sigma$)
     * Rho ($\rho = \partial V / \partial r$)
   * Analytical closed-form solutions card detailing $d_1$, $d_2$, Call pricing equation, and Put-Call Parity identity.
4. **AI F&O Microstructure Advisor**:
   * Full drawer modal generating institutional audits on Open Interest distributions, PCR sentiment, and defined-risk recommendations.

---

## 5. Mathematical & Quantitative Models Reference

### 5.1 Black-Scholes-Merton Partial Differential Equation Solutions
$$d_1 = \frac{\ln(S / K) + (r + \frac{1}{2} \sigma^2) T}{\sigma \sqrt{T}}, \quad d_2 = d_1 - \sigma \sqrt{T}$$

* **European Call**: $C = S \cdot N(d_1) - K \cdot e^{-rT} \cdot N(d_2)$
* **European Put**: $P = K \cdot e^{-rT} \cdot N(-d_2) - S \cdot N(-d_1)$
* **Put-Call Parity**: $C - P = S - K \cdot e^{-rT}$

### 5.2 The 5 Greeks
* $\Delta_{\text{call}} = N(d_1), \quad \Delta_{\text{put}} = N(d_1) - 1$
* $\Gamma = \frac{N'(d_1)}{S \sigma \sqrt{T}}$
* $\theta_{\text{call}} = -\frac{S N'(d_1) \sigma}{2 \sqrt{T}} - r K e^{-rT} N(d_2)$
* $\nu = \frac{S \sqrt{T} N'(d_1)}{100}$
* $\rho_{\text{call}} = \frac{K T e^{-rT} N(d_2)}{100}, \quad \rho_{\text{put}} = -\frac{K T e^{-rT} N(-d_2)}{100}$

### 5.3 Max Pain Strike Minimization
$$K^* = \arg\min_K \left[ \sum_{i} \text{OI}_{\text{call}, i} \cdot \max(0, K - K_i) + \sum_{j} \text{OI}_{\text{put}, j} \cdot \max(0, K_j - K) \right]$$

### 5.4 Put-Call Ratio (PCR)
$$\text{PCR} = \frac{\sum \text{Put Open Interest}}{\sum \text{Call Open Interest}}$$
* $\text{PCR} > 1.20$: Bullish / Oversold sentiment (heavy put writing)
* $0.80 \le \text{PCR} \le 1.20$: Neutral equilibrium
* $\text{PCR} < 0.80$: Bearish / Overbought sentiment (heavy call buying)
