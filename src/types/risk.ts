export interface ConcentrationDiagnostic {
  hasWarning: boolean;
  warningMessage?: string;
  maxPositionWeight: number; // percentage
  maxPositionSymbol: string;
  top3WeightPercent: number;
}

export interface SectorWeight {
  sector: string;
  value: number;
  weightPercent: number;
}

export interface HoldingAttribution {
  symbol: string;
  name: string;
  weightPercent: number;
  returnPercent: number;
  contributionPercent: number; // weight * return
}

export interface QuantitativeRiskMetrics {
  annualizedVolatility: number; // sigma * sqrt(252)
  beta: number; // vs benchmark index
  benchmarkSymbol: string;
  sharpeRatio: number; // (CAGR - Rf) / Volatility
  riskFreeRatePercent: number; // Baseline RBI Repo rate (6.50%)
  maxDrawdownPercent: number; // Historical peak-to-trough drop
  cagrPercent: number; // Compound annual growth rate
  concentration: ConcentrationDiagnostic;
  sectorBreakdown: SectorWeight[];
  attributions: HoldingAttribution[];
}
