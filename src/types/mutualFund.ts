import { Currency, DailyBar } from './market';

export type FundCategory =
  | 'Flexi Cap'
  | 'Large Cap'
  | 'Mid Cap'
  | 'Small Cap'
  | 'Index'
  | 'Hybrid'
  | 'Debt';

export type FundPlanType = 'Direct' | 'Regular';
export type FundOption = 'Growth' | 'IDCW';

export interface MutualFundScheme {
  id: string;
  type: 'MUTUAL_FUND';
  schemeCode: string; // AMFI code, e.g. "122639"
  symbol: string; // Ticker shorthand, e.g. "PPFAS-FLEXI"
  name: string;
  amc: string; // e.g. "Parag Parikh Financial Advisory Services", "HDFC Asset Management"
  category: FundCategory;
  planType: FundPlanType;
  option: FundOption;
  nav: number; // Net Asset Value in INR
  change: number;
  changePercent: number;
  currency: Currency; // Usually INR
  aumCrores: number; // AUM in ₹ Crore
  expenseRatio: number; // percentage, e.g. 0.63%
  cagr1Y: number; // percentage
  cagr3Y: number; // percentage
  cagr5Y: number; // percentage
  fundManager: string;
  benchmarkIndex: string; // e.g. "NIFTY 500 TRI", "NIFTY 50 TRI"
  inceptionDate: string;
  turnoverRatio?: number; // percentage
  riskGrade: 'Low' | 'Moderate' | 'High' | 'Very High';
  history: DailyBar[]; // Historical daily NAV records
}
