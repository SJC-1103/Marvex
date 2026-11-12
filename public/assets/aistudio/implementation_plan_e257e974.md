# Implementation Plan: Complete Technical Manual & Specification Document

## Overview
Generate an exhaustive, plain-text styled Markdown technical specification document (`TECHNICAL_SPECIFICATION.md`) in the project root documenting every technical aspect, mathematical formula, architectural pattern, data model, feature, mode, and workflow present in the Meridian Derivatives & F&O platform. In accordance with the user's explicit instruction, the document will focus strictly on technical specs, features, formulas, data structures, and mechanics without font colors or decorative presentation styling.

---

## User Constraints & Preferences
- **File Format**: Markdown technical specification document (`.md`).
- **Technical Depth**: Complete technical manual covering all systems (architecture, mathematical engines, data models, features, modes, workflows).
- **Tone/Style**: No decorative font coloring or presentation styling; direct, comprehensive, structured technical documentation.

---

## Detailed Structure of the Technical Manual (`TECHNICAL_SPECIFICATION.md`)

1. **System Overview & Technology Stack**
   - Runtime environment (Node.js, Vite, React 19, TypeScript 5.7, Tailwind CSS).
   - Component architecture and client-side single-page application (SPA) state flow.
   - Global currency translation subsystem (INR/USD dynamic exchange rate engine).

2. **Mathematical & Financial Computational Engines**
   - **Black-Scholes-Merton (BSM) Pricing Engine** (`src/utils/blackScholes.ts`):
     - Analytical pricing formulas for European Calls ($C$) and Puts ($P$).
     - Cumulative normal distribution approximation ($N(d)$) and probability density ($N'(d)$).
     - Standard parameters ($S, K, T, \sigma, r, q$).
   - **The Greeks Computation Engine**:
     - Delta ($\Delta$): First derivative with respect to underlying spot $\frac{\partial V}{\partial S}$.
     - Gamma ($\Gamma$): Second derivative with respect to underlying spot $\frac{\partial^2 V}{\partial S^2}$.
     - Theta ($\theta$): First derivative with respect to time decay $-\frac{\partial V}{\partial t}$ (annualized and daily per-share decay).
     - Vega ($\nu$): First derivative with respect to volatility $\frac{\partial V}{\partial \sigma}$.
     - Rho ($\rho$): First derivative with respect to risk-free interest rate $\frac{\partial V}{\partial r}$.
   - **Payoff Matrix & Multi-Leg Simulation Algorithm**:
     - Net debit/credit calculation.
     - Expiry P&L curve calculation across discrete spot steps (80-step interpolation).
     - Target Date (intermediate $T+n$) P&L curve modeling with dynamic IV shifts.
     - Breakeven point determination via zero-crossing linear interpolation.
     - Unbounded max profit / max loss edge case boundary detection.
   - **Futures Cost-of-Carry Model**:
     - Forward pricing: $F = S \cdot (1 + r \cdot \frac{DTE}{365})$ with dividend yield adjustment.

3. **Core Data Models & Interfaces** (`src/types/derivatives.ts`)
   - `OptionType`, `PositionType`, `MarketOutlook`.
   - `ContractPeriodType` and `ContractPeriodInfo` (7-Day, 14-Day, 1-Month, 2-Month, 3-Month classification).
   - `StrategyLeg` schema (instrument, type, position, strike, expiry, DTE, lots, lot size, entry price, IV, enabled toggle).
   - `OptionChainRow` & `OptionChainItem` (LTP, open interest, OI change, volume, IV, Greeks).
   - `UnderlyingAsset` schema (symbol, spot, strike interval, lot size, tick size, max pain, PCR OI, 30-day volatility).
   - Corporate Fundamental Schemas:
     - `ShareholdingPattern` (Promoter, FII, DII, Public, Pledged shares %, F&O implications).
     - `CompanyFinancials` (Revenue, EBITDA, PAT, FCF, EPS, PE, PB, next earnings date, F&O impact models).
     - `DebtLiabilityProfile` (Total debt, liquid cash, net debt, debt/equity, interest coverage, loan schedules, credit rating, solvency F&O impact).
   - `StrategyBlueprint` schema (templates for defined/undefined risk structures).

4. **Functional Modules & Operating Modes**
   - **Mode 1: Interactive Strategy Builder & Payoff Matrix** (`StrategyBuilder.tsx`):
     - Multi-leg configuration (up to 4 concurrent legs).
     - Interactive SVG Payoff Graph (zero baseline, spot marker, breakevens, target date curve, crosshair tooltip).
     - Custom Contract Architect modal (`CustomContractModal.tsx`).
     - Dynamic target DTE slider and IV shift controls.
     - Strategy loading banner and live state synchronization.
   - **Mode 2: Underlying Stock & F&O Analytical Report** (`UnderlyingAnalyticalReport.tsx`):
     - Interactive SVG Shareholding Donut Pie Chart with direct slice percentage badges.
     - Promoter pledge risk analysis and institutional float mechanics.
     - Financial statement analysis and 4-pillar F&O impact (IV crush, margins, dividend skew).
     - Debt & liabilities schedule with solvency put skew analysis.
     - Sample Deep-Dive: Contract Period Sensitivity Matrix (7D vs 14D vs 1M vs 2M comparison across premium, theta bleed, and scenario P&L).
   - **Mode 3: NSE Option Chain Matrix** (`OptionChainView.tsx`):
     - Bidirectional strike ladder around ATM.
     - Visible contract period selectors and metrics.
     - Open Interest (OI) concentration and Put-Call Ratio (PCR).
     - Max Pain calculation and 1-click builder loading.
   - **Mode 4: Greeks Sensitivity Lab** (`GreeksLab.tsx`):
     - Interactive parameter manipulation (Spot, Strike, DTE, IV, Risk-Free Rate).
     - Real-time gauge metrics and Greek risk diagnostics.
   - **Mode 5: Hedging & Strategy Playbook** (`StrategyPlaybook.tsx`):
     - Curated institutional blueprints (Bull Call Spread, Bear Put Spread, Iron Condor, Protective Collar, etc.).
     - Side-by-side risk comparison: Unhedged/Naked vs. Defined-Risk Hedged spreads.
     - 1-click "Build for Underlying" deployment with automatic leg generation and visual banner notification.
   - **Mode 6: F&O Risk Academy** (`FOAcademy.tsx`):
     - Buyer vs. seller risk-reward dynamics.
     - Indian contract lot sizing and leverage multiplier math.
     - SEBI statistical risk audits and capital preservation rules.

5. **Shared Platform Subsystems**
   - **Portal Tooltip Engine** (`TermTooltip.tsx`):
     - Direct viewport fixed-coordinate anchoring via `ReactDOM.createPortal`.
     - Zero clipping by overflow containers or table stacking contexts.
     - Built-in F&O glossary dictionary.
   - **Platform Orientation Guide System** (`PlatformGuideModal.tsx` & `ToolOrientationBanner.tsx`).
   - **Global Footer & Regulatory Disclaimers** (`GlobalFooter.tsx`).

---

## Verification Plan
1. Create `TECHNICAL_SPECIFICATION.md` in the workspace root.
2. Verify all formulas, models, and component names correspond accurately to the codebase.
3. Verify that the document strictly adheres to technical documentation standards without color styling.
4. Run `compile_applet` and `lint_applet` to confirm the application build remains unaffected and healthy.
