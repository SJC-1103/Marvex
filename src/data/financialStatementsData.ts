import {
  calculateCompanyScores,
  CompanyFinancialInputs,
  ScoringResult,
} from '../utils/fundamentalScoring';

export interface BalanceSheetData {
  totalAssetsCr: number;
  currentAssetsCr: number;
  cashAndBankCr: number;
  inventoriesCr: number;
  tradeReceivablesCr: number;
  nonCurrentAssetsCr: number;
  propertyPlantEquipmentCr: number;
  totalLiabilitiesCr: number;
  currentLiabilitiesCr: number;
  shortTermDebtCr: number;
  nonCurrentLiabilitiesCr: number;
  longTermDebtCr: number;
  shareholdersEquityCr: number;
  retainedEarningsCr: number;
}

export interface IncomeStatementData {
  periodLabel: string;
  totalRevenueCr: number;
  revenueGrowthYoy: number;
  operatingExpensesCr: number;
  ebitdaCr: number;
  ebitdaMarginPercent: number;
  depreciationAmortizationCr: number;
  ebitCr: number;
  interestExpenseCr: number;
  profitBeforeTaxCr: number;
  taxExpenseCr: number;
  netProfitCr: number;
  netProfitMarginPercent: number;
  epsTrailing: number;
}

export interface CashFlowData {
  operatingCashFlowCr: number;
  investingCashFlowCr: number;
  capexCr: number;
  financingCashFlowCr: number;
  freeCashFlowCr: number;
  dividendsPaidCr: number;
}

export interface SubMetricScore {
  name: string;
  value: string;
  benchmark: string;
  earned: number;
  max: number;
  formula: string;
}

export interface PillarSubScore {
  score: number; // 0-100
  rating: string;
  weightPercent: number; // e.g. 40
  formula: string;
  criteriaSummary: string;
  metrics: SubMetricScore[];
}

export interface ScoringModelBreakdown {
  methodology: string;
  totalScoreFormula: string;
  profitabilityWeight: number;
  solvencyWeight: number;
  growthWeight: number;
}

export interface InvestorKeyHighlights {
  executiveVerdict: string;
  verdictScore: number; // 0-100
  profitabilityHealth: 'EXCELLENT' | 'STABLE' | 'CAUTION';
  profitabilitySubScore: PillarSubScore;
  solvencyRisk: 'VERY_LOW' | 'MANAGEABLE' | 'HIGH';
  solvencySubScore: PillarSubScore;
  growthTrajectory: 'HIGH_GROWTH' | 'STEADY_COMPOUNDER' | 'CYCLICAL';
  growthSubScore: PillarSubScore;
  scoringModel: ScoringModelBreakdown;
  keyTakeaways: string[];
  bullCasePoints: string[];
  bearCasePoints: string[];
  crucialRatios: {
    label: string;
    value: string;
    status: 'POSITIVE' | 'NEUTRAL' | 'WARNING';
    description: string;
    formula?: string;
  }[];
}

export interface CompanyFinancialDossier {
  symbol: string;
  name: string;
  fiscalYear: string;
  quarter: string;
  auditFirm: string;
  filingDate: string;
  currency: 'INR' | 'USD';
  incomeStatement: IncomeStatementData;
  balanceSheet: BalanceSheetData;
  cashFlow: CashFlowData;
  highlights: InvestorKeyHighlights;
}

/**
 * Computes live investor highlights directly from the fundamental scoring engine.
 * The scoring engine is the single source of truth for all pillar scores, verdicts, and formulas.
 */
export function computeDossierHighlights(
  inputs: CompanyFinancialInputs,
  narrative: {
    executiveVerdict: string;
    keyTakeaways: string[];
    bullCasePoints: string[];
    bearCasePoints: string[];
    crucialRatios: InvestorKeyHighlights['crucialRatios'];
  }
): InvestorKeyHighlights {
  const result = calculateCompanyScores(inputs);
  if (result.status !== 'SUCCESS') {
    throw new Error(`Scoring calculation failed for ${inputs.symbol}: ${result.message}`);
  }

  const mapPillar = (pillar: typeof result.profitability): PillarSubScore => ({
    score: pillar.score,
    rating: pillar.rating,
    weightPercent: pillar.weightPercent,
    formula: pillar.formula,
    criteriaSummary: pillar.criteriaSummary,
    metrics: pillar.metrics.map(m => ({
      name: m.name,
      value: m.actualFormatted,
      benchmark: m.benchmarkFormatted,
      earned: m.earnedPoints,
      max: m.maxPoints,
      formula: m.formulaDescription,
    })),
  });

  return {
    executiveVerdict: narrative.executiveVerdict,
    verdictScore: result.verdictScore,
    profitabilityHealth: result.profitability.score >= 85 ? 'EXCELLENT' : result.profitability.score >= 70 ? 'STABLE' : 'CAUTION',
    profitabilitySubScore: mapPillar(result.profitability),
    solvencyRisk: result.solvency.score >= 85 ? 'VERY_LOW' : result.solvency.score >= 70 ? 'MANAGEABLE' : 'HIGH',
    solvencySubScore: mapPillar(result.solvency),
    growthTrajectory: result.growth.score >= 85 ? 'HIGH_GROWTH' : result.growth.score >= 70 ? 'STEADY_COMPOUNDER' : 'CYCLICAL',
    growthSubScore: mapPillar(result.growth),
    scoringModel: {
      methodology: `Institutional Multi-Factor ${result.sector} Fundamental Quality Score (0-100)`,
      totalScoreFormula: result.scoringModelFormula,
      profitabilityWeight: result.profitability.weightPercent,
      solvencyWeight: result.solvency.weightPercent,
      growthWeight: result.growth.weightPercent,
    },
    keyTakeaways: narrative.keyTakeaways,
    bullCasePoints: narrative.bullCasePoints,
    bearCasePoints: narrative.bearCasePoints,
    crucialRatios: narrative.crucialRatios,
  };
}

export const COMPANY_FINANCIAL_INPUTS: Record<string, CompanyFinancialInputs> = {
  RELIANCE: {
    symbol: 'RELIANCE',
    sector: 'CONGLOMERATE',
    revenue: 231535,
    ebitda: 42593,
    ebit: 29013,
    interestExpense: 4120,
    netProfit: 19323,
    revenueGrowthYoy: 8.2,
    ebitdaGrowthYoy: 11.2,
    totalDebt: 313900,
    totalAssets: 1845200,
    shareholdersEquity: 846800,
    cashAndEquivalents: 218500,
    roePercent: 12.4,
    operatingCashFlow: 32600,
    capex: 18400,
    freeCashFlow: 14200,
    specializedMetrics: {
      interestCoverageRatio: 9.8,
    },
  },
  TCS: {
    symbol: 'TCS',
    sector: 'IT_SERVICES',
    revenue: 64259,
    ebitda: 16834,
    ebit: 15594,
    interestExpense: 180,
    netProfit: 12434,
    revenueGrowthYoy: 7.6,
    totalDebt: 0,
    totalAssets: 148500,
    totalLiabilities: 38200,
    shareholdersEquity: 110300,
    cashAndEquivalents: 18450,
    roePercent: 48.2,
    operatingCashFlow: 12380,
    capex: 1180,
    freeCashFlow: 11200,
    specializedMetrics: {
      tcvDealIntakeBillions: 10.0,
    },
  },
  HDFCBANK: {
    symbol: 'HDFCBANK',
    sector: 'BANKING',
    revenue: 85500,
    ebitda: 24800,
    ebit: 23600,
    interestExpense: 28400,
    netProfit: 16821,
    revenueGrowthYoy: 15.3,
    totalDebt: 2150000,
    totalAssets: 3680000,
    shareholdersEquity: 440000,
    cashAndEquivalents: 195000,
    operatingCashFlow: 41200,
    capex: 3200,
    freeCashFlow: 12100,
    banking: {
      returnOnAssetsPercent: 1.92,
      netInterestMarginPercent: 3.46,
      costToIncomePercent: 38.2,
      capitalAdequacyRatioPercent: 19.8,
      grossNpaPercent: 1.36,
      depositGrowthYoyPercent: 15.4,
      advanceGrowthYoyPercent: 13.8,
    },
  },
  NVDA: {
    symbol: 'NVDA',
    sector: 'TECHNOLOGY',
    revenue: 35082,
    ebitda: 21926,
    ebit: 21406,
    interestExpense: 68,
    netProfit: 19309,
    revenueGrowthYoy: 94.0,
    grossMarginPercent: 75.1,
    totalDebt: 11100,
    totalAssets: 85200,
    shareholdersEquity: 60600,
    cashAndEquivalents: 34800,
    netCashSurplus: 23.7,
    operatingCashFlow: 17600,
    capex: 850,
    freeCashFlow: 13500,
    specializedMetrics: {
      datacenterScaleBillions: 30.8,
    },
  },
  TSLA: {
    symbol: 'TSLA',
    sector: 'AUTOMOTIVE',
    revenue: 25182,
    ebitda: 4583,
    ebit: 2717,
    interestExpense: 95,
    netProfit: 2167,
    revenueGrowthYoy: 7.8,
    operatingMarginPercent: 10.8,
    totalDebt: 7700,
    totalAssets: 114800,
    shareholdersEquity: 70600,
    cashAndEquivalents: 33600,
    operatingCashFlow: 6250,
    capex: 3508,
    freeCashFlow: 2742,
    specializedMetrics: {
      autoGrossMarginExCreditsPercent: 17.1,
      vehicleDeliveryGrowthPercent: 6.4,
      energyStorageDeploymentGrowthPercent: 75.0,
    },
  },
};

/**
 * Accessor for universal company scoring result (Single source of truth)
 */
export function getCompanyScoringResult(symbol: string): ScoringResult {
  const inputs = COMPANY_FINANCIAL_INPUTS[symbol.toUpperCase()];
  if (!inputs) {
    return calculateCompanyScores({
      symbol,
      sector: 'UNSUPPORTED_SECTOR' as any,
    } as any);
  }
  return calculateCompanyScores(inputs);
}

export const FINANCIAL_DOSSIERS: Record<string, CompanyFinancialDossier> = {
  RELIANCE: {
    symbol: 'RELIANCE',
    name: 'Reliance Industries Limited',
    fiscalYear: 'FY 2025-26',
    quarter: 'Q2 Audited Results',
    auditFirm: 'D.T.S. & Associates LLP',
    filingDate: '24-OCT-2026',
    currency: 'INR',
    incomeStatement: {
      periodLabel: 'Q2 FY26 (Ended Sept 30)',
      totalRevenueCr: 231535,
      revenueGrowthYoy: 11.2,
      operatingExpensesCr: 188942,
      ebitdaCr: 42593,
      ebitdaMarginPercent: 18.4,
      depreciationAmortizationCr: 13580,
      ebitCr: 29013,
      interestExpenseCr: 4120,
      profitBeforeTaxCr: 24893,
      taxExpenseCr: 5570,
      netProfitCr: 19323,
      netProfitMarginPercent: 8.35,
      epsTrailing: 97.4,
    },
    balanceSheet: {
      totalAssetsCr: 1845200,
      currentAssetsCr: 412500,
      cashAndBankCr: 218500,
      inventoriesCr: 104200,
      tradeReceivablesCr: 28900,
      nonCurrentAssetsCr: 1432700,
      propertyPlantEquipmentCr: 985600,
      totalLiabilitiesCr: 998400,
      currentLiabilitiesCr: 395000,
      shortTermDebtCr: 68400,
      nonCurrentLiabilitiesCr: 603400,
      longTermDebtCr: 245500,
      shareholdersEquityCr: 846800,
      retainedEarningsCr: 588200,
    },
    cashFlow: {
      operatingCashFlowCr: 32600,
      investingCashFlowCr: -21400,
      capexCr: 18400,
      financingCashFlowCr: -8200,
      freeCashFlowCr: 14200,
      dividendsPaidCr: 6760,
    },
    highlights: computeDossierHighlights(COMPANY_FINANCIAL_INPUTS.RELIANCE, {
      executiveVerdict: 'Strong retail and digital telecoms expansion provides valuation buffer against petrochemical cyclicality. Free cash flow turnaround confirms capex peaking.',
      keyTakeaways: [
        'EBITDA expanded +11.2% YoY powered by 5G subscriber monetisation and consumer retail store rollouts.',
        'Net debt contracted to ₹95,400 Cr against ₹218,500 Cr liquid treasury buffer, ensuring 9.8x interest coverage.',
        'Free cash flow generated is positive at ₹14,200 Cr for the quarter, easing previous leverage concerns.',
        'Clean balance sheet with zero encumbered promoter pledge shares.',
      ],
      bullCasePoints: [
        'Accelerating ARPU in Jio Platforms (+7.5% YoY) directly expands operating margins.',
        'Retail grocery and omnichannel footprint capturing unorganized consumption share.',
        'New Energy solar giga-factories approaching operational commissioning in 2027.',
      ],
      bearCasePoints: [
        'Oil-to-Chemicals (O2C) refining margins vulnerable to global Brent spread volatility.',
        'Substantial gross debt (₹313,900 Cr) requires sustained EBITDA generation to maintain AAA rating.',
      ],
      crucialRatios: [
        { label: 'EBITDA Margin', value: '18.4%', status: 'POSITIVE', description: 'Robust margins anchored by digital and consumer retail.', formula: 'EBITDA / Total Revenue' },
        { label: 'Interest Coverage', value: '9.8x', status: 'POSITIVE', description: 'Exceptional earnings cushion above annual debt interest obligations.', formula: 'EBIT / Interest Expense' },
        { label: 'Debt to Equity', value: '0.38', status: 'POSITIVE', description: 'Conservative net gearing relative to industrial capital base.', formula: 'Total Debt / Shareholders Net Worth' },
        { label: 'Return on Equity (ROE)', value: '12.4%', status: 'NEUTRAL', description: 'Moderated slightly by ongoing heavy giga-factory capex absorption.', formula: 'Net Profit / Average Equity' },
      ],
    }),
  },
  TCS: {
    symbol: 'TCS',
    name: 'Tata Consultancy Services Limited',
    fiscalYear: 'FY 2025-26',
    quarter: 'Q2 Audited Results',
    auditFirm: 'BSR & Co. LLP',
    filingDate: '10-OCT-2026',
    currency: 'INR',
    incomeStatement: {
      periodLabel: 'Q2 FY26 (Ended Sept 30)',
      totalRevenueCr: 64259,
      revenueGrowthYoy: 7.6,
      operatingExpensesCr: 47425,
      ebitdaCr: 16834,
      ebitdaMarginPercent: 26.2,
      depreciationAmortizationCr: 1240,
      ebitCr: 15594,
      interestExpenseCr: 180,
      profitBeforeTaxCr: 16740,
      taxExpenseCr: 4306,
      netProfitCr: 12434,
      netProfitMarginPercent: 19.35,
      epsTrailing: 129.8,
    },
    balanceSheet: {
      totalAssetsCr: 148500,
      currentAssetsCr: 98600,
      cashAndBankCr: 18450,
      inventoriesCr: 0,
      tradeReceivablesCr: 48900,
      nonCurrentAssetsCr: 49900,
      propertyPlantEquipmentCr: 14800,
      totalLiabilitiesCr: 38200,
      currentLiabilitiesCr: 32400,
      shortTermDebtCr: 0,
      nonCurrentLiabilitiesCr: 5800,
      longTermDebtCr: 0,
      shareholdersEquityCr: 110300,
      retainedEarningsCr: 98700,
    },
    cashFlow: {
      operatingCashFlowCr: 12380,
      investingCashFlowCr: -840,
      capexCr: 1180,
      financingCashFlowCr: -11200,
      freeCashFlowCr: 11200,
      dividendsPaidCr: 10450,
    },
    highlights: computeDossierHighlights(COMPANY_FINANCIAL_INPUTS.TCS, {
      executiveVerdict: 'Peer-leading 26.2% EBITDA margin and completely debt-free balance sheet with 90%+ operating cash conversion into shareholder payouts.',
      keyTakeaways: [
        'Operating margin maintained at benchmark 26.2% despite wage hikes and discretionary spending pauses.',
        'Zero outstanding debt liabilities and ₹18,450 Cr liquid cash reserves on balance sheet.',
        'Free cash flow conversion surpassed 90% of Net Profit (PAT) at ₹11,200 Cr.',
        'Total Contract Value (TCV) deal pipeline reached $10.0 Billion for the consecutive third quarter.',
      ],
      bullCasePoints: [
        'Generative AI deal pipeline doubled to $1.5 Billion across European banking & healthcare mandates.',
        'High return on capital employed (ROCE > 55%) enables persistent high dividend payouts.',
        'Promoter (Tata Sons) owns 71.8% equity with zero encumbrance.',
      ],
      bearCasePoints: [
        'BFSI discretionary tech budget renewals in North America experiencing elongation.',
        'Hiring moderation reflects cautious near-term volume ramp expectations.',
      ],
      crucialRatios: [
        { label: 'EBITDA Margin', value: '26.2%', status: 'POSITIVE', description: 'Industry benchmark operating efficiency and software delivery discipline.', formula: 'EBITDA / Total Revenue' },
        { label: 'Debt to Equity', value: '0.00', status: 'POSITIVE', description: 'Completely debt-free balance sheet with zero interest rate risk.', formula: 'Total Debt / Equity' },
        { label: 'Free Cash Flow Margin', value: '17.4%', status: 'POSITIVE', description: 'Exceptional liquid cash conversion directly returning value via buybacks/dividends.', formula: 'FCF / Total Revenue' },
        { label: 'Return on Equity (ROE)', value: '48.2%', status: 'POSITIVE', description: 'Elite capital efficiency across global technology enterprises.', formula: 'Net Profit / Net Worth' },
      ],
    }),
  },
  HDFCBANK: {
    symbol: 'HDFCBANK',
    name: 'HDFC Bank Limited',
    fiscalYear: 'FY 2025-26',
    quarter: 'Q2 Audited Results',
    auditFirm: 'Price Waterhouse LLP',
    filingDate: '19-OCT-2026',
    currency: 'INR',
    incomeStatement: {
      periodLabel: 'Q2 FY26 (Ended Sept 30)',
      totalRevenueCr: 85500,
      revenueGrowthYoy: 15.3,
      operatingExpensesCr: 32400,
      ebitdaCr: 24800,
      ebitdaMarginPercent: 21.0,
      depreciationAmortizationCr: 1200,
      ebitCr: 23600,
      interestExpenseCr: 28400,
      profitBeforeTaxCr: 22600,
      taxExpenseCr: 5779,
      netProfitCr: 16821,
      netProfitMarginPercent: 19.67,
      epsTrailing: 88.5,
    },
    balanceSheet: {
      totalAssetsCr: 3680000,
      currentAssetsCr: 540000,
      cashAndBankCr: 195000,
      inventoriesCr: 0,
      tradeReceivablesCr: 0,
      nonCurrentAssetsCr: 3140000,
      propertyPlantEquipmentCr: 28500,
      totalLiabilitiesCr: 3240000,
      currentLiabilitiesCr: 410000,
      shortTermDebtCr: 0,
      nonCurrentLiabilitiesCr: 2830000,
      longTermDebtCr: 2150000,
      shareholdersEquityCr: 440000,
      retainedEarningsCr: 320000,
    },
    cashFlow: {
      operatingCashFlowCr: 41200,
      investingCashFlowCr: -18500,
      capexCr: 3200,
      financingCashFlowCr: -10600,
      freeCashFlowCr: 12100,
      dividendsPaidCr: 7400,
    },
    highlights: computeDossierHighlights(COMPANY_FINANCIAL_INPUTS.HDFCBANK, {
      executiveVerdict: 'Deposit accretion outpacing credit growth brings Loan-to-Deposit ratio to target 99%, confirming full post-merger integration stabilization.',
      keyTakeaways: [
        'Net interest income expanded +15.3% YoY to ₹85,500 Cr with Net Interest Margin (NIM) stable at 3.46%.',
        'Gross NPA ratio remains best-in-class at 1.36%, with Net NPA at 0.38%.',
        'Capital Adequacy Ratio (CAR) stands strong at 19.8% against regulatory minimum of 11.5%.',
        'Branch deposit mobilisation averaged ₹1.4 Lakh Cr across urban and semi-urban territories.',
      ],
      bullCasePoints: [
        'Post-merger cross-selling of mortgage book customers into banking accounts accelerating.',
        'High credit ratings (CRISIL AAA) guarantee the lowest wholesale borrowing costs in India.',
      ],
      bearCasePoints: [
        'Systemic banking liquidity constraints could cap near-term net interest margin expansion.',
        'High institutional float (81.4%) exposes price action to foreign ETF index rebalancings.',
      ],
      crucialRatios: [
        { label: 'Capital Adequacy (CAR)', value: '19.8%', status: 'POSITIVE', description: 'Extremely high regulatory solvency and growth capital cushion.', formula: 'Tier 1 + Tier 2 Capital / Risk-Weighted Assets' },
        { label: 'Gross NPA Ratio', value: '1.36%', status: 'POSITIVE', description: 'Industry-leading asset quality and low provisioning drag.', formula: 'Gross Non-Performing Assets / Total Advances' },
        { label: 'Return on Assets (ROA)', value: '1.92%', status: 'POSITIVE', description: 'Top-tier profitability ratio for a systemically important bank.', formula: 'Net Profit / Average Total Assets' },
        { label: 'Cost to Income Ratio', value: '38.2%', status: 'POSITIVE', description: 'Lean operating cost structure across retail branch network.', formula: 'Operating Expenses / Operating Income' },
      ],
    }),
  },
  NVDA: {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    fiscalYear: 'FY 2026',
    quarter: 'Q3 Financial Filing',
    auditFirm: 'PricewaterhouseCoopers LLP',
    filingDate: '20-NOV-2026',
    currency: 'USD',
    incomeStatement: {
      periodLabel: 'Q3 FY26 (Ended Oct 27)',
      totalRevenueCr: 35082, // in USD millions
      revenueGrowthYoy: 94.0,
      operatingExpensesCr: 4287,
      ebitdaCr: 21926,
      ebitdaMarginPercent: 62.5,
      depreciationAmortizationCr: 520,
      ebitCr: 21406,
      interestExpenseCr: 68,
      profitBeforeTaxCr: 22100,
      taxExpenseCr: 2791,
      netProfitCr: 19309,
      netProfitMarginPercent: 55.04,
      epsTrailing: 2.95,
    },
    balanceSheet: {
      totalAssetsCr: 85200,
      currentAssetsCr: 52400,
      cashAndBankCr: 34800,
      inventoriesCr: 5800,
      tradeReceivablesCr: 9800,
      nonCurrentAssetsCr: 32800,
      propertyPlantEquipmentCr: 6400,
      totalLiabilitiesCr: 24600,
      currentLiabilitiesCr: 13500,
      shortTermDebtCr: 1250,
      nonCurrentLiabilitiesCr: 11100,
      longTermDebtCr: 9850,
      shareholdersEquityCr: 60600,
      retainedEarningsCr: 45200,
    },
    cashFlow: {
      operatingCashFlowCr: 17600,
      investingCashFlowCr: -4100,
      capexCr: 850,
      financingCashFlowCr: -12800,
      freeCashFlowCr: 13500,
      dividendsPaidCr: 245,
    },
    highlights: computeDossierHighlights(COMPANY_FINANCIAL_INPUTS.NVDA, {
      executiveVerdict: 'Monopolistic datacenter AI infrastructure momentum delivered +94% YoY revenue growth with unprecedented 62.5% EBITDA margins and a $23.7B net cash cushion.',
      keyTakeaways: [
        'Datacenter division revenue surged to $30.8 Billion, driven by Blackwell ramp and Hopper demand.',
        'Gross margins reached 75.1%, demonstrating extraordinary pricing power in accelerated computing.',
        'Cash and liquid short-term investments total $34.8 Billion against nominal debt of $11.1 Billion.',
        'Quarterly free cash flow generation reached $13.5 Billion, enabling large share repurchases.',
      ],
      bullCasePoints: [
        'Cloud hyperscalers (Microsoft, Meta, Google, AWS) committed to multi-year capex expansions.',
        'CUDA software moat prevents commoditization and software developer churn.',
      ],
      bearCasePoints: [
        'TSMC advanced packaging capacity allocations remain single biggest supply ceiling.',
        'Export controls on advanced chips to Asian markets create intermittent geographical headwinds.',
      ],
      crucialRatios: [
        { label: 'EBITDA Margin', value: '62.5%', status: 'POSITIVE', description: 'Historic profitability margin among mega-cap global technology leaders.', formula: 'EBITDA / Total Revenue' },
        { label: 'Net Cash Surplus', value: '+$23.7B', status: 'POSITIVE', description: 'Zero structural debt vulnerability with massive cash reserves.', formula: 'Total Cash - Total Debt' },
        { label: 'Return on Invested Capital', value: '78.5%', status: 'POSITIVE', description: 'World-class economic profit generation above cost of capital.', formula: 'NOPAT / (Equity + Debt - Cash)' },
        { label: 'Revenue Growth YoY', value: '+94.0%', status: 'POSITIVE', description: 'Rapid top-line scaling in accelerated datacenter infrastructure.', formula: '(Rev_t - Rev_{t-1}) / Rev_{t-1}' },
      ],
    }),
  },
  TSLA: {
    symbol: 'TSLA',
    name: 'Tesla, Inc.',
    fiscalYear: 'FY 2026',
    quarter: 'Q3 Financial Filing',
    auditFirm: 'PricewaterhouseCoopers LLP',
    filingDate: '23-OCT-2026',
    currency: 'USD',
    incomeStatement: {
      periodLabel: 'Q3 FY26 (Ended Sept 30)',
      totalRevenueCr: 25182, // USD millions
      revenueGrowthYoy: 7.8,
      operatingExpensesCr: 2280,
      ebitdaCr: 4583,
      ebitdaMarginPercent: 18.2,
      depreciationAmortizationCr: 1230,
      ebitCr: 2717,
      interestExpenseCr: 95,
      profitBeforeTaxCr: 2840,
      taxExpenseCr: 673,
      netProfitCr: 2167,
      netProfitMarginPercent: 8.6,
      epsTrailing: 2.14,
    },
    balanceSheet: {
      totalAssetsCr: 114800,
      currentAssetsCr: 62400,
      cashAndBankCr: 33600,
      inventoriesCr: 13200,
      tradeReceivablesCr: 3800,
      nonCurrentAssetsCr: 52400,
      propertyPlantEquipmentCr: 32100,
      totalLiabilitiesCr: 44200,
      currentLiabilitiesCr: 28500,
      shortTermDebtCr: 2100,
      nonCurrentLiabilitiesCr: 15700,
      longTermDebtCr: 5600,
      shareholdersEquityCr: 70600,
      retainedEarningsCr: 31200,
    },
    cashFlow: {
      operatingCashFlowCr: 6250,
      investingCashFlowCr: -3500,
      capexCr: 3508,
      financingCashFlowCr: -1800,
      freeCashFlowCr: 2742,
      dividendsPaidCr: 0,
    },
    highlights: computeDossierHighlights(COMPANY_FINANCIAL_INPUTS.TSLA, {
      executiveVerdict: 'Energy storage segment gross margins (+30.5%) offset automotive pricing pressure. Free cash flow surged to $2.74B with zero solvency risk.',
      keyTakeaways: [
        'Automotive gross margins (excluding regulatory credits) stabilized at 17.1% as cost of goods per vehicle dropped below $35,100.',
        'Energy storage deployments (Megapack) grew +75% YoY, becoming a primary operating income driver.',
        'Cash and liquid short-term portfolio surpassed $33.6 Billion with negligible debt liabilities ($7.7B).',
        'Full Self-Driving (FSD) v13 rollout accelerated active software subscriptions.',
      ],
      bullCasePoints: [
        'Energy storage revenue growing 3x faster than vehicle segment with expanding margins.',
        'Autonomous Robotaxi platform and Cybercab scaling slated for 2027 production.',
      ],
      bearCasePoints: [
        'High competitive discounting from Chinese EV competitors in European and Asian markets.',
        'High retail float (38.7%) paired with CEO pledge exposure introduces sentiment volatility.',
      ],
      crucialRatios: [
        { label: 'Automotive Gross Margin', value: '17.1%', status: 'NEUTRAL', description: 'Stabilized after consecutive quarters of global price cuts.', formula: 'Auto Gross Profit / Auto Revenue' },
        { label: 'Cash Reserves', value: '$33.6B', status: 'POSITIVE', description: 'Fortress balance sheet allowing full internal funding of AI & compute clusters.', formula: 'Cash & Short-Term Investments' },
        { label: 'Debt to Equity', value: '0.11', status: 'POSITIVE', description: 'Extremely conservative debt leverage across automotive OEMs.', formula: 'Total Debt / Shareholders Net Worth' },
        { label: 'Free Cash Flow', value: '$2.74B', status: 'POSITIVE', description: 'Rebounded strongly to positive multi-billion quarterly cash generation.', formula: 'Operating Cash Flow - Capex' },
      ],
    }),
  },
};
