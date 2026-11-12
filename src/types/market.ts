export type Exchange = 'NSE' | 'BSE' | 'NYSE' | 'NASDAQ';
export type Country = 'IN' | 'US';
export type Currency = 'INR' | 'USD';
export type AssetType = 'EQUITY' | 'MUTUAL_FUND' | 'INDEX';
export type DataFeedMode = 'LIVE_EXCHANGE' | 'SIMULATED' | 'EOD_HISTORICAL' | 'REST_GATEWAY';

export type Sector =
  | 'Technology'
  | 'Banking & Finance'
  | 'Energy & Power'
  | 'Automotive'
  | 'Healthcare & Pharma'
  | 'Consumer & Retail'
  | 'Telecommunications'
  | 'Diversified'
  | 'Quantum & DeepTech';

export interface DailyBar {
  date: string; // YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface CandlePoint {
  time: string;
  timeStr?: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface OrderBookEntry {
  price: number;
  amount: number;
  total: number;
}

export interface OrderBook {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
}

export interface Stock {
  id: string;
  type: 'EQUITY';
  symbol: string;
  name: string;
  exchange: Exchange;
  country: Country;
  baseCurrency: Currency;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high52w: number;
  low52w: number;
  previousClose: number;
  volume: number;
  avgVolume30D: number;
  marketCap: number; // in base currency
  peRatio: number;
  forwardPE: number;
  dividendYield: number; // percentage
  beta: number;
  sector: Sector;
  description: string;
  ceo: string;
  headquarters: string;
  lastAuditedDate: string;
  history: DailyBar[]; // 750+ days of historical bars

  // Institutional Ownership & Demographic Distribution
  shareholding?: import('./divergence').ShareholdingPattern;

  // Supplemental institutional fields for orderbook, execution & analytics
  week52High?: number;
  week52Low?: number;
  dayHigh?: number;
  dayLow?: number;
  bid?: number;
  ask?: number;
  lotSize?: number;
  quantumScore?: number;
  lastUpdated?: string;
  orderBook?: OrderBook;
  historical?: Record<string, CandlePoint[]>;
}

export interface MarketIndex {
  id: string;
  type: 'INDEX';
  symbol: string;
  name: string;
  exchange: string;
  country: Country;
  currency: Currency;
  value: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  dayHigh?: number;
  dayLow?: number;
  history: DailyBar[];
  timezone: string; // 'Asia/Kolkata' | 'America/New_York'
  sparkline?: number[];
  lastUpdated?: string;
}

export type Timeframe = '1D' | '1W' | '1M' | '3M' | '6M' | 'YTD' | '1Y' | '3Y' | '5Y' | 'ALL' | 'MAX';
