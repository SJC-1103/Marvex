/**
 * Automated Verification Test Suite for Institutional Fundamental Scoring Engine
 * 
 * Verifies:
 * 1. Preservation of verified test case company scores (Reliance, TCS, HDFC Bank, NVIDIA, Tesla).
 * 2. Proper handling and rejection of unsupported sectors (returns UNSUPPORTED_SECTOR and null scores, never default 80).
 * 3. Dynamic sensitivity: modifying financial ratios directly affects resulting scores.
 * 4. FCF Conversion (%) vs Free Cash Flow absolute calculations.
 */

import {
  calculateCompanyScores,
  calculateFreeCashFlow,
  calculateFcfConversionRate,
  CompanyFinancialInputs,
} from '../utils/fundamentalScoring';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

console.log('\n--- 1. Testing Verified Test Cases ---');

// Test Case 1: Reliance Industries
const relianceInputs: CompanyFinancialInputs = {
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
  specializedMetrics: {
    interestCoverageRatio: 9.8,
  },
};

const relResult = calculateCompanyScores(relianceInputs);
assert(relResult.status === 'SUCCESS', 'Reliance evaluated successfully');
if (relResult.status === 'SUCCESS') {
  assert(relResult.profitability.score === 88, `Reliance Profitability expected 88, got ${relResult.profitability.score}`);
  assert(relResult.solvency.score === 86, `Reliance Solvency expected 86, got ${relResult.solvency.score}`);
  assert(relResult.growth.score === 76, `Reliance Growth expected 76, got ${relResult.growth.score}`);
  assert(relResult.verdictScore === 84, `Reliance Verdict expected 84, got ${relResult.verdictScore}`);
}

// Test Case 2: TCS
const tcsInputs: CompanyFinancialInputs = {
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
  totalLiabilities: 38100,
  shareholdersEquity: 110400,
  cashAndEquivalents: 18450,
  roePercent: 48.2,
  operatingCashFlow: 12430,
  capex: 1230,
  specializedMetrics: {
    tcvDealIntakeBillions: 10.0,
  },
};

const tcsResult = calculateCompanyScores(tcsInputs);
assert(tcsResult.status === 'SUCCESS', 'TCS evaluated successfully');
if (tcsResult.status === 'SUCCESS') {
  assert(tcsResult.profitability.score === 96, `TCS Profitability expected 96, got ${tcsResult.profitability.score}`);
  assert(tcsResult.solvency.score === 98, `TCS Solvency expected 98, got ${tcsResult.solvency.score}`);
  assert(tcsResult.growth.score === 74, `TCS Growth expected 74, got ${tcsResult.growth.score}`);
  assert(tcsResult.verdictScore === 91, `TCS Verdict expected 91, got ${tcsResult.verdictScore}`);
}

// Test Case 3: HDFC Bank
const hdfcInputs: CompanyFinancialInputs = {
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
  banking: {
    returnOnAssetsPercent: 1.92,
    netInterestMarginPercent: 3.46,
    costToIncomePercent: 38.2,
    capitalAdequacyRatioPercent: 19.8,
    grossNpaPercent: 1.36,
    depositGrowthYoyPercent: 15.4,
    advanceGrowthYoyPercent: 13.8,
  },
};

const hdfcResult = calculateCompanyScores(hdfcInputs);
assert(hdfcResult.status === 'SUCCESS', 'HDFC Bank evaluated successfully');
if (hdfcResult.status === 'SUCCESS') {
  assert(hdfcResult.profitability.score === 89, `HDFC Bank Profitability expected 89, got ${hdfcResult.profitability.score}`);
  assert(hdfcResult.solvency.score === 92, `HDFC Bank Solvency expected 92, got ${hdfcResult.solvency.score}`);
  assert(hdfcResult.growth.score === 82, `HDFC Bank Growth expected 82, got ${hdfcResult.growth.score}`);
  assert(hdfcResult.verdictScore === 88, `HDFC Bank Verdict expected 88, got ${hdfcResult.verdictScore}`);
}

// Test Case 4: NVIDIA
const nvdaInputs: CompanyFinancialInputs = {
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
};

const nvdaResult = calculateCompanyScores(nvdaInputs);
assert(nvdaResult.status === 'SUCCESS', 'NVIDIA evaluated successfully');
if (nvdaResult.status === 'SUCCESS') {
  assert(nvdaResult.profitability.score === 97, `NVIDIA Profitability expected 97, got ${nvdaResult.profitability.score}`);
  assert(nvdaResult.solvency.score === 94, `NVIDIA Solvency expected 94, got ${nvdaResult.solvency.score}`);
  assert(nvdaResult.growth.score === 96, `NVIDIA Growth expected 96, got ${nvdaResult.growth.score}`);
  assert(nvdaResult.verdictScore === 96, `NVIDIA Verdict expected 96, got ${nvdaResult.verdictScore}`);
}

// Test Case 5: Tesla
const tslaInputs: CompanyFinancialInputs = {
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
  specializedMetrics: {
    autoGrossMarginExCreditsPercent: 17.1,
    vehicleDeliveryGrowthPercent: 6.4,
    energyStorageDeploymentGrowthPercent: 75.0,
  },
};

const tslaResult = calculateCompanyScores(tslaInputs);
assert(tslaResult.status === 'SUCCESS', 'Tesla evaluated successfully');
if (tslaResult.status === 'SUCCESS') {
  assert(tslaResult.profitability.score === 74, `Tesla Profitability expected 74, got ${tslaResult.profitability.score}`);
  assert(tslaResult.solvency.score === 93, `Tesla Solvency expected 93, got ${tslaResult.solvency.score}`);
  assert(tslaResult.growth.score === 72, `Tesla Growth expected 72, got ${tslaResult.growth.score}`);
  assert(tslaResult.verdictScore === 80, `Tesla Verdict expected 80, got ${tslaResult.verdictScore}`);
}

console.log('\n--- 2. Testing Unsupported Company & Sector Fallback ---');

const unsupportedInputs: any = {
  symbol: 'UNSUPPORTED_CORP',
  sector: 'PHARMACEUTICALS', // Not one of the 5 configured sectors
  revenue: 1000,
  ebitda: 200,
  ebit: 150,
  interestExpense: 20,
  netProfit: 100,
  revenueGrowthYoy: 5.0,
  totalDebt: 500,
  totalAssets: 2000,
  shareholdersEquity: 1000,
  cashAndEquivalents: 100,
  operatingCashFlow: 150,
  capex: 50,
};

const unsuppResult = calculateCompanyScores(unsupportedInputs);
assert(unsuppResult.status === 'UNSUPPORTED_SECTOR', 'Unsupported sector properly flagged');
assert(unsuppResult.verdictScore === null, 'Verdict score is null (never fake 80/100)');
assert(unsuppResult.profitability === null, 'Profitability is null for unsupported sector');
if (unsuppResult.status === 'UNSUPPORTED_SECTOR') {
  assert(unsuppResult.message.includes('PHARMACEUTICALS'), 'Message names the unconfigured sector');
}

console.log('\n--- 3. Testing Dynamic Input Sensitivity (Changes Alter Scores) ---');

// Deteriorate Reliance's EBITDA from 42,593 to 15,000 (Margin drops to 6.4%)
const stressedReliance: CompanyFinancialInputs = {
  ...relianceInputs,
  ebitda: 15000,
  operatingCashFlow: 12000,
};

const stressedResult = calculateCompanyScores(stressedReliance);
if (stressedResult.status === 'SUCCESS' && relResult.status === 'SUCCESS') {
  assert(
    stressedResult.profitability.score < relResult.profitability.score,
    `Stressed Profitability (${stressedResult.profitability.score}) is lower than baseline (${relResult.profitability.score})`
  );
  assert(
    stressedResult.verdictScore < relResult.verdictScore,
    `Stressed Verdict (${stressedResult.verdictScore}) is lower than baseline (${relResult.verdictScore})`
  );
}

// Add 100,000 Cr debt to TCS (currently 0)
const indebtedTcs: CompanyFinancialInputs = {
  ...tcsInputs,
  totalDebt: 100000,
};

const indebtedResult = calculateCompanyScores(indebtedTcs);
if (indebtedResult.status === 'SUCCESS' && tcsResult.status === 'SUCCESS') {
  assert(
    indebtedResult.solvency.score < tcsResult.solvency.score,
    `Indebted TCS Solvency (${indebtedResult.solvency.score}) dropped significantly from pristine zero debt (${tcsResult.solvency.score})`
  );
}

console.log('\n--- 4. Testing FCF and FCF Conversion Precision ---');

const ocf = 32600;
const capex = 18400;
const fcf = calculateFreeCashFlow(ocf, capex);
assert(fcf === 14200, `FCF = OCF - Capex = 14200 Cr, got ${fcf}`);

const fcfConversion = calculateFcfConversionRate(fcf, ocf);
assert(fcfConversion === 43.6, `FCF Conversion = (14200 / 32600) * 100 = 43.6%, got ${fcfConversion}%`);

console.log('\n--- 5. Testing Single Source of Truth in FINANCIAL_DOSSIERS ---');
import { FINANCIAL_DOSSIERS, getCompanyScoringResult } from '../data/financialStatementsData';

assert(FINANCIAL_DOSSIERS.RELIANCE.highlights.verdictScore === 84, 'FINANCIAL_DOSSIERS.RELIANCE verdictScore is 84');
assert(FINANCIAL_DOSSIERS.RELIANCE.highlights.profitabilitySubScore.score === 88, 'RELIANCE profitability is 88');
assert(FINANCIAL_DOSSIERS.RELIANCE.highlights.solvencySubScore.score === 86, 'RELIANCE solvency is 86');
assert(FINANCIAL_DOSSIERS.RELIANCE.highlights.growthSubScore.score === 76, 'RELIANCE growth is 76');

assert(FINANCIAL_DOSSIERS.TCS.highlights.verdictScore === 91, 'FINANCIAL_DOSSIERS.TCS verdictScore is 91');
assert(FINANCIAL_DOSSIERS.TCS.highlights.profitabilitySubScore.score === 96, 'TCS profitability is 96');
assert(FINANCIAL_DOSSIERS.TCS.highlights.solvencySubScore.score === 98, 'TCS solvency is 98');
assert(FINANCIAL_DOSSIERS.TCS.highlights.growthSubScore.score === 74, 'TCS growth is 74');

assert(FINANCIAL_DOSSIERS.HDFCBANK.highlights.verdictScore === 88, 'FINANCIAL_DOSSIERS.HDFCBANK verdictScore is 88');
assert(FINANCIAL_DOSSIERS.HDFCBANK.highlights.profitabilitySubScore.score === 89, 'HDFC Bank profitability is 89');
assert(FINANCIAL_DOSSIERS.HDFCBANK.highlights.solvencySubScore.score === 92, 'HDFC Bank solvency is 92');
assert(FINANCIAL_DOSSIERS.HDFCBANK.highlights.growthSubScore.score === 82, 'HDFC Bank growth is 82');

assert(FINANCIAL_DOSSIERS.NVDA.highlights.verdictScore === 96, 'FINANCIAL_DOSSIERS.NVDA verdictScore is 96');
assert(FINANCIAL_DOSSIERS.NVDA.highlights.profitabilitySubScore.score === 97, 'NVIDIA profitability is 97');
assert(FINANCIAL_DOSSIERS.NVDA.highlights.solvencySubScore.score === 94, 'NVIDIA solvency is 94');
assert(FINANCIAL_DOSSIERS.NVDA.highlights.growthSubScore.score === 96, 'NVIDIA growth is 96');

assert(FINANCIAL_DOSSIERS.TSLA.highlights.verdictScore === 80, 'FINANCIAL_DOSSIERS.TSLA verdictScore is 80');
assert(FINANCIAL_DOSSIERS.TSLA.highlights.profitabilitySubScore.score === 74, 'Tesla profitability is 74');
assert(FINANCIAL_DOSSIERS.TSLA.highlights.solvencySubScore.score === 93, 'Tesla solvency is 93');
assert(FINANCIAL_DOSSIERS.TSLA.highlights.growthSubScore.score === 72, 'Tesla growth is 72');

const unknownScoring = getCompanyScoringResult('UNKNOWN_CORP');
assert(unknownScoring.status === 'UNSUPPORTED_SECTOR', 'getCompanyScoringResult for unmapped company returns UNSUPPORTED_SECTOR');
assert(unknownScoring.verdictScore === null, 'getCompanyScoringResult returns null score (never default 80)');

console.log('\n--- 6. Testing Universal Share Selection & getOrBuildDossierForStock ---');
import { getOrBuildDossierForStock } from '../data/financialStatementsData';

const tataDossier = getOrBuildDossierForStock('TATAMOTORS');
assert(tataDossier.symbol === 'TATAMOTORS', 'TATAMOTORS dossier retrieved successfully');
assert(tataDossier.highlights.verdictScore > 0, `TATAMOTORS has calculated score (${tataDossier.highlights.verdictScore})`);

const infyDossier = getOrBuildDossierForStock('INFY');
assert(infyDossier.symbol === 'INFY', 'INFY dossier retrieved successfully');
assert(infyDossier.highlights.verdictScore > 0, `INFY has calculated score (${infyDossier.highlights.verdictScore})`);

const anyShareDossier = getOrBuildDossierForStock('NEW_CUSTOM_SHARE');
assert(anyShareDossier.symbol === 'NEW_CUSTOM_SHARE', 'Arbitrary custom share dossier built dynamically');
assert(anyShareDossier.highlights.verdictScore > 0, `Arbitrary share has calculated score (${anyShareDossier.highlights.verdictScore})`);

// Verify benchmark comparator is '=' and not '>'
if (relResult.status === 'SUCCESS' && relResult.profitability) {
  assert(
    relResult.profitability.metrics[0].benchmarkFormatted.startsWith('='),
    `Benchmark displays '=', got ${relResult.profitability.metrics[0].benchmarkFormatted}`
  );
}

console.log('\n🎉 ALL SCORING ENGINE AND DOSSIER INTEGRATION TESTS PASSED SUCCESSFULLY!\n');


