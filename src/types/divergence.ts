export interface ShareholdingPattern {
  promotersPercent: number; // e.g. 50.3%
  institutionalPercent: number; // e.g. 38.4% (FII + DII)
  publicPercent: number; // e.g. 11.3% (Retail + Non-institution)
  pledgedPromoterSharesPercent?: number; // e.g. 0.0%
  lastAuditedQuarter: string; // e.g. "Q2 FY26"
  majorityHolder: 'PROMOTERS' | 'INSTITUTIONAL' | 'PUBLIC';
  fiiPercent?: number;
  diiPercent?: number;
}

export type AttributedDriver =
  | 'PROMOTER_ACTIVITY'
  | 'INSTITUTIONAL_OFFLOADING'
  | 'RETAIL_CHURN'
  | 'MACRO_DECOUPLING';

export interface StockContradiction {
  stockId: string;
  symbol: string;
  name: string;
  assetClass: 'EQUITY' | 'MUTUAL_FUND';
  exchangeOrAmc: string;
  currentPrice: number;
  stockChangePercent: number;
  marketChangePercent: number;
  divergenceSpreadPercent: number;
  shareholding: ShareholdingPattern;
  attributedDriver: AttributedDriver;
  driverExplanation: string;
  responsibleDemographic: 'Company Promoters' | 'Institutional Investors (FII/DII)' | 'General Public / Retail';
}

export interface MarketDivergenceDiagnostic {
  marketState: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  marketBenchmarkSymbol: string;
  marketChangePercent: number;
  portfolioState: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  portfolioChangePercent: number;
  hasDivergence: boolean;
  divergenceType?: 'MARKET_UP_PORTFOLIO_DOWN' | 'MARKET_DOWN_PORTFOLIO_UP';
  divergenceSeverity: 'NONE' | 'MODERATE' | 'SEVERE';
  summaryHeadline: string;
  contradictingStocks: StockContradiction[];
  concordantStocksCount: number;
}

export interface AiStockAnalysisResult {
  symbol: string;
  companyName: string;
  timestamp: string;
  summary: string;
  primaryCatalyst: string;
  recentNewsArticles: {
    headline: string;
    source: string;
    timeAgo: string;
    snippet: string;
    sentiment: 'NEGATIVE' | 'POSITIVE' | 'NEUTRAL';
  }[];
  divergenceRationale: string;
  isSimulatedFallback?: boolean;
}
