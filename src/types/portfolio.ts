import { Currency, AssetType } from './market';

export interface PortfolioHolding {
  id: string;
  assetType: AssetType; // 'EQUITY' | 'MUTUAL_FUND'
  symbolOrCode: string; // Stock symbol or AMFI scheme code
  name: string;
  exchangeOrAmc: string; // e.g. "NSE", "BSE", "NYSE", "NASDAQ", or AMC name
  quantityOrUnits: number; // Shares for equity, units for mutual fund
  averageCost: number; // In asset's native currency
  purchaseDate: string; // YYYY-MM-DD
  currency: Currency;

  // Compatibility aliases
  stockId?: string;
  symbol?: string;
  shares?: number;
  averageBuyPrice?: number;
  addedAt?: string;
}

export interface PortfolioBook {
  id: string;
  name: string; // e.g. "Core Retirement", "Global Tech Growth"
  description?: string;
  baseCurrency: Currency;
  cashBalance: number; // Uninvested cash balance in base currency
  holdings: PortfolioHolding[];
  createdAt: string;
  updatedAt: string;
}

export interface CalculatedHolding {
  holding: PortfolioHolding;
  currentPrice: number; // in active view currency
  currentValue: number; // in active view currency
  costBasis: number; // in active view currency
  unrealizedGain: number; // in active view currency
  unrealizedGainPercent: number;
  weightPercent: number; // percentage of total portfolio net worth
  dailyChange: number; // in active view currency
  dailyChangePercent: number;

  // Compatibility aliases
  investedValue?: number;
  totalPnL?: number;
  totalPnLPercent?: number;
  dayPnL?: number;
  dayPnLPercent?: number;
  allocationPercent?: number;
}

export interface BookValuationSummary {
  bookId: string;
  bookName: string;
  currency: Currency;
  totalMarketValue: number; // Equities + Mutual funds
  cashBalance: number; // Uninvested cash
  totalNetWorth: number; // Market value + Cash
  totalInvestedCost: number;
  totalUnrealizedGain: number;
  totalUnrealizedGainPercent: number;
  equityAllocationPercent: number;
  mutualFundAllocationPercent: number;
  cashAllocationPercent: number;
  calculatedHoldings: CalculatedHolding[];
}

export interface PortfolioSummary {
  totalValue: number;
  totalInvested: number;
  totalPnL: number;
  totalPnLPercent: number;
  totalDayPnL: number;
  holdingsCount: number;
  calculatedHoldings: CalculatedHolding[];
}
