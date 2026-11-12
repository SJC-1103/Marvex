export type OptionType = 'CALL' | 'PUT';
export type PositionType = 'BUY' | 'SELL';
export type MarketOutlook = 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'VOLATILE';

export type ContractPeriodType = '7D' | '14D' | '1M' | '2M' | '3M';

export interface ContractPeriodInfo {
  id: ContractPeriodType;
  label: string;
  dte: number;
  description: string;
  typicalIv: number;
}

export interface Greeks {
  delta: number;
  gamma: number;
  theta: number; // daily decay per share
  vega: number;  // per 1% move in IV
  rho: number;   // per 1% move in interest rate
}

export interface StrategyLeg {
  id: string;
  instrument: 'OPTION' | 'FUTURE';
  type: OptionType;
  position: PositionType;
  strike: number;
  expiry: string;
  dte: number;
  lots: number;
  lotSize: number;
  entryPrice: number;
  currentPrice: number;
  iv: number;
  enabled: boolean;
  greeks?: Greeks;
}

export interface OptionChainItem {
  strike: number;
  ltp: number;
  change: number;
  changePercent: number;
  oi: number;
  oiChange: number;
  volume: number;
  iv: number;
  greeks: Greeks;
  bid: number;
  ask: number;
}

export interface OptionChainRow {
  strike: number;
  call: OptionChainItem;
  put: OptionChainItem;
  distanceFromSpot: number;
}

export interface ShareholdingPattern {
  promoters: number;
  institutions: number; // FII + DII
  fii: number;
  dii: number;
  public: number;
  pledgedPromoterShares: number;
  foImplication: string;
}

export interface CompanyFinancials {
  revenueQuarterlyCr: number;
  revenueYoyGrowth: number;
  ebitdaMarginPercent: number;
  patQuarterlyCr: number;
  freeCashFlowCr: number;
  epsTrailing: number;
  peRatio: number;
  pbRatio: number;
  nextEarningsDate: string;
  ivCrushRisk: 'HIGH' | 'MODERATE' | 'LOW';
  foImpactNotes: string;
}

export interface DebtLiabilityProfile {
  totalDebtCr: number;
  cashAndEquivalentsCr: number;
  netDebtCr: number;
  debtToEquity: number;
  interestCoverageRatio: number;
  creditRating: string;
  solvencyPutSkew: 'ELEVATED' | 'BALANCED' | 'DEFENSIVE';
  foImplication: string;
}

export interface UnderlyingAsset {
  symbol: string;
  name: string;
  exchange: 'NSE' | 'BSE' | 'NASDAQ' | 'NYSE';
  country: 'IN' | 'US';
  currency: 'INR' | 'USD';
  spot: number;
  change: number;
  changePercent: number;
  lotSize: number;
  strikeInterval: number;
  tickSize: number;
  maxPain: number;
  pcrOi: number;
  ivRank: number; // 0-100
  historicalVolatility30d: number;
  activeExpiries: string[];
  shareholding: ShareholdingPattern;
  financials: CompanyFinancials;
  debtProfile: DebtLiabilityProfile;
  futuresLtp: number;
  futuresBasis: number; // futures - spot
}

export interface PayoffCurvePoint {
  spotPrice: number;
  pnlAtExpiry: number;
  pnlAtTargetDate: number;
}

export interface StrategyPayoffSummary {
  netCostOrCredit: number; // negative = debit (cost), positive = credit received
  maxProfit: number | 'UNLIMITED';
  maxLoss: number | 'UNLIMITED';
  breakevens: number[];
  riskRewardRatio: string;
  netGreeks: Greeks;
  pop: number; // Probability of Profit percentage (0-100)
  marginRequired: number;
  curve: PayoffCurvePoint[];
}

export interface StrategyBlueprint {
  id: string;
  name: string;
  outlook: MarketOutlook;
  description: string;
  riskType: 'DEFINED_RISK' | 'UNDEFINED_RISK';
  complexity: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  idealIvEnvironment: 'HIGH_IV' | 'LOW_IV' | 'ANY';
  buildLegs: (spot: number, strikeInterval: number, lotSize: number, expiry: string, dte: number, baseIv: number) => Omit<StrategyLeg, 'id'>[];
  rationale: string;
}
