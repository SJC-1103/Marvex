import { DailyBar, Stock } from '../types/market';
import { PortfolioHolding } from '../types/portfolio';
import {
  ShareholdingPattern,
  StockContradiction,
  MarketDivergenceDiagnostic,
  AttributedDriver,
} from '../types/divergence';

/**
 * Calculates Simple Moving Average (SMA)
 */
export function calculateSMA(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      const slice = data.slice(i - period + 1, i + 1);
      const sum = slice.reduce((a, b) => a + b, 0);
      result.push(sum / period);
    }
  }
  return result;
}

/**
 * Calculates standard Bollinger Bands (20 periods, 2 standard deviations)
 */
export function calculateBollingerBands(
  closes: number[],
  period = 20,
  stdDevMultiplier = 2
): {
  middle: (number | null)[];
  upper: (number | null)[];
  lower: (number | null)[];
} {
  const middle = calculateSMA(closes, period);
  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];

  for (let i = 0; i < closes.length; i++) {
    const ma = middle[i];
    if (ma === null || i < period - 1) {
      upper.push(null);
      lower.push(null);
    } else {
      const slice = closes.slice(i - period + 1, i + 1);
      const variance = slice.reduce((acc, val) => acc + Math.pow(val - ma, 2), 0) / period;
      const stdDev = Math.sqrt(variance);
      upper.push(ma + stdDev * stdDevMultiplier);
      lower.push(ma - stdDev * stdDevMultiplier);
    }
  }

  return { middle, upper, lower };
}

/**
 * Calculates Wilder's Relative Strength Index (RSI 14)
 */
export function calculateRSI(closes: number[], period = 14): (number | null)[] {
  const rsi: (number | null)[] = [];
  if (closes.length < period + 1) {
    return closes.map(() => null);
  }

  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 0; i < closes.length; i++) {
    if (i === 0) {
      rsi.push(null);
      continue;
    }

    const change = closes[i] - closes[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;

    if (i <= period) {
      avgGain += gain;
      avgLoss += loss;
      if (i === period) {
        avgGain /= period;
        avgLoss /= period;
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        rsi.push(100 - 100 / (1 + rs));
      } else {
        rsi.push(null);
      }
    } else {
      // Wilder's smoothing
      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      rsi.push(100 - 100 / (1 + rs));
    }
  }

  return rsi;
}

/**
 * Re-bases a historical price series to Growth of 100
 */
export function calculateGrowthOf100(closes: number[]): number[] {
  if (closes.length === 0) return [];
  const base = closes[0] || 1;
  return closes.map(c => Number(((c / base) * 100).toFixed(2)));
}

/**
 * Calculates Historical Peak-to-Trough Drawdown (%) series and Maximum Drawdown
 */
export function calculateDrawdown(closes: number[]): {
  drawdownSeries: number[];
  maxDrawdownPercent: number;
} {
  if (closes.length === 0) {
    return { drawdownSeries: [], maxDrawdownPercent: 0 };
  }

  let peak = closes[0];
  let maxDd = 0;
  const drawdownSeries: number[] = [];

  for (let i = 0; i < closes.length; i++) {
    const val = closes[i];
    if (val > peak) {
      peak = val;
    }
    const dd = peak > 0 ? ((val - peak) / peak) * 100 : 0;
    drawdownSeries.push(Number(dd.toFixed(2)));
    if (dd < maxDd) {
      maxDd = dd;
    }
  }

  return {
    drawdownSeries,
    maxDrawdownPercent: Math.abs(maxDd),
  };
}

/**
 * Calculates Compound Annual Growth Rate (CAGR)
 */
export function calculateCAGR(startValue: number, endValue: number, days: number): number {
  if (startValue <= 0 || endValue <= 0 || days <= 0) return 0;
  const years = days / 365.25;
  if (years < 1) {
    // For under 1 year, return annualized simple return
    return ((endValue - startValue) / startValue) * 100;
  }
  const cagr = Math.pow(endValue / startValue, 1 / years) - 1;
  return Number((cagr * 100).toFixed(2));
}

/**
 * Calculates Annualized Volatility (sigma * sqrt(252)) from daily bar closes
 */
export function calculateAnnualizedVolatility(closes: number[]): number {
  if (closes.length < 5) return 0;
  const dailyReturns: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    const ret = (closes[i] - closes[i - 1]) / closes[i - 1];
    dailyReturns.push(ret);
  }

  const mean = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
  const variance = dailyReturns.reduce((acc, r) => acc + Math.pow(r - mean, 2), 0) / (dailyReturns.length - 1);
  const dailyStdDev = Math.sqrt(variance);
  const annualized = dailyStdDev * Math.sqrt(252) * 100;

  return Number(annualized.toFixed(2));
}

/**
 * Calculates Beta relative to benchmark series
 */
export function calculateBeta(assetCloses: number[], benchmarkCloses: number[]): number {
  const minLen = Math.min(assetCloses.length, benchmarkCloses.length);
  if (minLen < 10) return 1.0;

  const assetReturns: number[] = [];
  const benchmarkReturns: number[] = [];

  for (let i = 1; i < minLen; i++) {
    assetReturns.push((assetCloses[i] - assetCloses[i - 1]) / assetCloses[i - 1]);
    benchmarkReturns.push((benchmarkCloses[i] - benchmarkCloses[i - 1]) / benchmarkCloses[i - 1]);
  }

  const meanAsset = assetReturns.reduce((a, b) => a + b, 0) / assetReturns.length;
  const meanBenchmark = benchmarkReturns.reduce((a, b) => a + b, 0) / benchmarkReturns.length;

  let covariance = 0;
  let benchmarkVariance = 0;

  for (let i = 0; i < assetReturns.length; i++) {
    const aDiff = assetReturns[i] - meanAsset;
    const bDiff = benchmarkReturns[i] - meanBenchmark;
    covariance += aDiff * bDiff;
    benchmarkVariance += bDiff * bDiff;
  }

  if (benchmarkVariance === 0) return 1.0;
  return Number((covariance / benchmarkVariance).toFixed(2));
}

/**
 * Calculates Sharpe Ratio with documented Risk-Free Hurdle
 * Baseline: 6.50% (RBI Repo Rate Baseline)
 */
export function calculateSharpeRatio(
  annualizedReturnPercent: number,
  annualizedVolatilityPercent: number,
  riskFreeRatePercent = 6.50
): number {
  if (annualizedVolatilityPercent <= 0) return 0;
  const excess = annualizedReturnPercent - riskFreeRatePercent;
  return Number((excess / annualizedVolatilityPercent).toFixed(2));
}

/**
 * Calculates weighted shareholder demographic distribution across an entire portfolio of equity positions.
 */
export function calculatePortfolioShareholding(
  holdings: PortfolioHolding[],
  stocks: Stock[]
): {
  shareholding: ShareholdingPattern;
  evaluatedPositionsCount: number;
  totalEvaluatedValue: number;
} {
  let totalValue = 0;
  let weightedPromoterSum = 0;
  let weightedInstSum = 0;
  let weightedPublicSum = 0;
  let weightedFiiSum = 0;
  let weightedDiiSum = 0;
  let evaluatedPositionsCount = 0;

  holdings.forEach(h => {
    // Look up stock
    const symbolClean = (h.symbolOrCode || h.symbol || '').toUpperCase();
    const stock = stocks.find(s => s.symbol.toUpperCase() === symbolClean || s.id === h.stockId);
    if (stock && stock.shareholding) {
      const quantity = h.quantityOrUnits || h.shares || 0;
      const positionValue = quantity * stock.price;
      if (positionValue > 0) {
        totalValue += positionValue;
        weightedPromoterSum += positionValue * stock.shareholding.promotersPercent;
        weightedInstSum += positionValue * stock.shareholding.institutionalPercent;
        weightedPublicSum += positionValue * stock.shareholding.publicPercent;
        weightedFiiSum += positionValue * (stock.shareholding.fiiPercent || 0);
        weightedDiiSum += positionValue * (stock.shareholding.diiPercent || 0);
        evaluatedPositionsCount++;
      }
    }
  });

  if (totalValue <= 0 || evaluatedPositionsCount === 0) {
    // Default balanced snapshot if no holdings or equities
    return {
      shareholding: {
        promotersPercent: 32.5,
        institutionalPercent: 51.2,
        publicPercent: 16.3,
        fiiPercent: 30.1,
        diiPercent: 21.1,
        pledgedPromoterSharesPercent: 0.0,
        lastAuditedQuarter: 'Q2 FY26 / CY26',
        majorityHolder: 'INSTITUTIONAL',
      },
      evaluatedPositionsCount: 0,
      totalEvaluatedValue: 0,
    };
  }

  const promotersPercent = Number((weightedPromoterSum / totalValue).toFixed(1));
  const institutionalPercent = Number((weightedInstSum / totalValue).toFixed(1));
  const publicPercent = Number((100 - promotersPercent - institutionalPercent).toFixed(1));

  let majorityHolder: 'PROMOTERS' | 'INSTITUTIONAL' | 'PUBLIC' = 'INSTITUTIONAL';
  if (promotersPercent >= institutionalPercent && promotersPercent >= publicPercent) {
    majorityHolder = 'PROMOTERS';
  } else if (publicPercent >= institutionalPercent && publicPercent >= promotersPercent) {
    majorityHolder = 'PUBLIC';
  }

  return {
    shareholding: {
      promotersPercent,
      institutionalPercent,
      publicPercent,
      fiiPercent: Number((weightedFiiSum / totalValue).toFixed(1)),
      diiPercent: Number((weightedDiiSum / totalValue).toFixed(1)),
      pledgedPromoterSharesPercent: 0.0,
      lastAuditedQuarter: 'Consolidated EOD',
      majorityHolder,
    },
    evaluatedPositionsCount,
    totalEvaluatedValue: totalValue,
  };
}

/**
 * Aggregates market-cap-weighted shareholder demographics across all tracked Indian NSE companies
 */
export function calculateIndianUniverseShareholding(stocks: Stock[]): {
  shareholding: ShareholdingPattern;
  indianStocks: Stock[];
  totalMarketCapInr: number;
} {
  const indianStocks = stocks.filter(s => s.country === 'IN' && s.shareholding);
  let totalCap = 0;
  let weightedPromoter = 0;
  let weightedInst = 0;
  let weightedFii = 0;
  let weightedDii = 0;
  let weightedPledged = 0;

  indianStocks.forEach(s => {
    const cap = s.marketCap || s.price;
    if (!s.shareholding || cap <= 0) return;
    totalCap += cap;
    weightedPromoter += cap * s.shareholding.promotersPercent;
    weightedInst += cap * s.shareholding.institutionalPercent;
    weightedFii += cap * (s.shareholding.fiiPercent || 0);
    weightedDii += cap * (s.shareholding.diiPercent || 0);
    weightedPledged += cap * (s.shareholding.pledgedPromoterSharesPercent || 0);
  });

  if (totalCap <= 0 || indianStocks.length === 0) {
    return {
      shareholding: {
        promotersPercent: 0,
        institutionalPercent: 0,
        publicPercent: 0,
        fiiPercent: 0,
        diiPercent: 0,
        pledgedPromoterSharesPercent: 0,
        lastAuditedQuarter: 'Q2 FY26',
        majorityHolder: 'INSTITUTIONAL',
      },
      indianStocks: [],
      totalMarketCapInr: 0,
    };
  }

  const promotersPercent = Number((weightedPromoter / totalCap).toFixed(1));
  const institutionalPercent = Number((weightedInst / totalCap).toFixed(1));
  const publicPercent = Number(Math.max(0, 100 - promotersPercent - institutionalPercent).toFixed(1));

  let majorityHolder: 'PROMOTERS' | 'INSTITUTIONAL' | 'PUBLIC' = 'INSTITUTIONAL';
  if (promotersPercent >= institutionalPercent && promotersPercent >= publicPercent) {
    majorityHolder = 'PROMOTERS';
  } else if (publicPercent >= institutionalPercent && publicPercent >= promotersPercent) {
    majorityHolder = 'PUBLIC';
  }

  return {
    shareholding: {
      promotersPercent,
      institutionalPercent,
      publicPercent,
      fiiPercent: Number((weightedFii / totalCap).toFixed(1)),
      diiPercent: Number((weightedDii / totalCap).toFixed(1)),
      pledgedPromoterSharesPercent: Number((weightedPledged / totalCap).toFixed(2)),
      lastAuditedQuarter: `Q2 FY26 (${indianStocks.length} NSE Companies)`,
      majorityHolder,
    },
    indianStocks,
    totalMarketCapInr: totalCap,
  };
}

/**
 * Compares portfolio performance against the overall market benchmark,
 * detects decoupling/contradictions, flags dissenting stocks, and attributes demographic drivers.
 */
export function calculateMarketDivergence(
  holdings: PortfolioHolding[],
  stocks: Stock[],
  benchmark: { symbol: string; changePercent: number }
): MarketDivergenceDiagnostic {
  const marketChangePercent = benchmark.changePercent;
  const marketState: 'BULLISH' | 'BEARISH' | 'NEUTRAL' =
    marketChangePercent > 0.15 ? 'BULLISH' : marketChangePercent < -0.15 ? 'BEARISH' : 'NEUTRAL';

  // Calculate portfolio aggregate day change %
  let totalCurrentVal = 0;
  let totalDayPnl = 0;
  let validHoldingCount = 0;

  const stockPerformanceMap: {
    stock: Stock;
    holding: PortfolioHolding;
    positionVal: number;
  }[] = [];

  holdings.forEach(h => {
    const symbolClean = (h.symbolOrCode || h.symbol || '').toUpperCase();
    const stock = stocks.find(s => s.symbol.toUpperCase() === symbolClean || s.id === h.stockId);
    if (stock) {
      const qty = h.quantityOrUnits || h.shares || 0;
      const val = qty * stock.price;
      const dayPnl = qty * stock.change;
      totalCurrentVal += val;
      totalDayPnl += dayPnl;
      validHoldingCount++;
      stockPerformanceMap.push({ stock, holding: h, positionVal: val });
    }
  });

  const portfolioChangePercent =
    totalCurrentVal > 0 ? Number(((totalDayPnl / (totalCurrentVal - totalDayPnl)) * 100).toFixed(2)) : 0;

  const portfolioState: 'BULLISH' | 'BEARISH' | 'NEUTRAL' =
    portfolioChangePercent > 0.15 ? 'BULLISH' : portfolioChangePercent < -0.15 ? 'BEARISH' : 'NEUTRAL';

  const hasDivergence =
    (marketState === 'BULLISH' && portfolioState === 'BEARISH') ||
    (marketState === 'BEARISH' && portfolioState === 'BULLISH');

  let divergenceType: 'MARKET_UP_PORTFOLIO_DOWN' | 'MARKET_DOWN_PORTFOLIO_UP' | undefined;
  if (marketState === 'BULLISH' && portfolioState === 'BEARISH') {
    divergenceType = 'MARKET_UP_PORTFOLIO_DOWN';
  } else if (marketState === 'BEARISH' && portfolioState === 'BULLISH') {
    divergenceType = 'MARKET_DOWN_PORTFOLIO_UP';
  }

  // Detect individual stocks contradicting the benchmark
  const contradictingStocks: StockContradiction[] = [];
  let concordantStocksCount = 0;

  stockPerformanceMap.forEach(({ stock }) => {
    const stockChange = stock.changePercent;
    let isContradicting = false;

    if (marketChangePercent > 0.15 && stockChange < -0.1) {
      isContradicting = true;
    } else if (marketChangePercent < -0.15 && stockChange > 0.1) {
      isContradicting = true;
    } else if (Math.abs(stockChange - marketChangePercent) >= 1.5) {
      isContradicting = true;
    }

    if (isContradicting) {
      const shareholding: ShareholdingPattern = stock.shareholding || {
        promotersPercent: 50.0,
        institutionalPercent: 35.0,
        publicPercent: 15.0,
        lastAuditedQuarter: 'Q2 FY26',
        majorityHolder: 'PROMOTERS',
      };

      let attributedDriver: AttributedDriver = 'MACRO_DECOUPLING';
      let responsibleDemographic: 'Company Promoters' | 'Institutional Investors (FII/DII)' | 'General Public / Retail' =
        'Institutional Investors (FII/DII)';
      let driverExplanation = '';

      if (shareholding.institutionalPercent >= 55) {
        attributedDriver = 'INSTITUTIONAL_OFFLOADING';
        responsibleDemographic = 'Institutional Investors (FII/DII)';
        driverExplanation = stockChange < 0
          ? `Institutional cohort (${shareholding.institutionalPercent}% holding) exhibiting aggressive block distribution contrary to market uptrend.`
          : `Institutional absorption (${shareholding.institutionalPercent}% holding) providing structural support despite macro selloff.`;
      } else if (shareholding.promotersPercent >= 45 || (shareholding.pledgedPromoterSharesPercent ?? 0) > 0) {
        attributedDriver = 'PROMOTER_ACTIVITY';
        responsibleDemographic = 'Company Promoters';
        driverExplanation = `High promoter concentration (${shareholding.promotersPercent}%) insulating asset or reflecting insider reallocation events.`;
      } else {
        attributedDriver = 'RETAIL_CHURN';
        responsibleDemographic = 'General Public / Retail';
        driverExplanation = `Elevated retail float (${shareholding.publicPercent}%) driving speculative sentiment decoupling from broad index momentum.`;
      }

      contradictingStocks.push({
        stockId: stock.id,
        symbol: stock.symbol,
        name: stock.name,
        assetClass: 'EQUITY',
        exchangeOrAmc: stock.exchange,
        currentPrice: stock.price,
        stockChangePercent: stockChange,
        marketChangePercent,
        divergenceSpreadPercent: Number(Math.abs(stockChange - marketChangePercent).toFixed(2)),
        shareholding,
        attributedDriver,
        driverExplanation,
        responsibleDemographic,
      });
    } else {
      concordantStocksCount++;
    }
  });

  // Sort contradicting stocks by widest divergence spread
  contradictingStocks.sort((a, b) => b.divergenceSpreadPercent - a.divergenceSpreadPercent);

  const spread = Math.abs(portfolioChangePercent - marketChangePercent);
  const divergenceSeverity = spread > 1.8 ? 'SEVERE' : spread > 0.7 ? 'MODERATE' : 'NONE';

  let summaryHeadline = '';
  if (divergenceType === 'MARKET_UP_PORTFOLIO_DOWN') {
    summaryHeadline = `Market Bullish (+${marketChangePercent}%) while Portfolio Lags (${portfolioChangePercent}%). ${contradictingStocks.length} holding(s) driving divergence.`;
  } else if (divergenceType === 'MARKET_DOWN_PORTFOLIO_UP') {
    summaryHeadline = `Market Bearish (${marketChangePercent}%) while Portfolio Outperforms (+${portfolioChangePercent}%). Defensive relative strength detected.`;
  } else if (marketState === portfolioState && marketState !== 'NEUTRAL') {
    summaryHeadline = `Portfolio is concordant with ${benchmark.symbol} momentum (${marketState.toLowerCase()} at ${portfolioChangePercent}% vs ${marketChangePercent}%).`;
  } else {
    summaryHeadline = `Market is currently moving in a neutral consolidation range (${marketChangePercent}%).`;
  }

  return {
    marketState,
    marketBenchmarkSymbol: benchmark.symbol,
    marketChangePercent,
    portfolioState,
    portfolioChangePercent,
    hasDivergence,
    divergenceType,
    divergenceSeverity,
    summaryHeadline,
    contradictingStocks,
    concordantStocksCount,
  };
}
