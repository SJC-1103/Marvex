import { StrategyLeg, PayoffCurvePoint, StrategyPayoffSummary, Greeks } from '../types/derivatives';
import { calculateBlackScholes } from './blackScholes';

export interface PayoffSimulationOptions {
  spotPrice: number;
  legs: StrategyLeg[];
  targetDte?: number; // Days to target date (0 <= targetDte <= leg.dte)
  ivShift?: number;   // Volatility shift in % points (-15% to +15%)
  riskFreeRate?: number;
}

/**
 * Calculates net strategy P&L curve across spot prices at expiration and at target evaluation date.
 */
export function calculateStrategyPayoff(options: PayoffSimulationOptions): StrategyPayoffSummary {
  const { spotPrice, legs, targetDte = 0, ivShift = 0, riskFreeRate = 0.065 } = options;
  const activeLegs = legs.filter(l => l.enabled);

  if (activeLegs.length === 0) {
    return {
      netCostOrCredit: 0,
      maxProfit: 0,
      maxLoss: 0,
      breakevens: [],
      riskRewardRatio: '1:1',
      netGreeks: { delta: 0, gamma: 0, theta: 0, vega: 0, rho: 0 },
      pop: 50,
      marginRequired: 0,
      curve: [],
    };
  }

  // 1. Calculate Net Cost / Credit and Net Greeks
  let netCostOrCredit = 0; // Positive = credit, negative = debit
  let netDelta = 0;
  let netGamma = 0;
  let netTheta = 0;
  let netVega = 0;
  let netRho = 0;
  let estimatedMargin = 0;

  for (const leg of activeLegs) {
    const totalShares = leg.lots * leg.lotSize;
    const premiumCashFlow = leg.entryPrice * totalShares;

    if (leg.position === 'BUY') {
      netCostOrCredit -= premiumCashFlow; // Net debit
      estimatedMargin += premiumCashFlow; // Buyer capital outlay
    } else {
      netCostOrCredit += premiumCashFlow; // Net credit
      // Naked seller exchange margin estimate: ~18% of contract notional
      estimatedMargin += (spotPrice * totalShares * 0.18);
    }

    // Compute Greeks for leg
    if (leg.instrument === 'OPTION') {
      const bsm = calculateBlackScholes({
        spot: spotPrice,
        strike: leg.strike,
        dte: leg.dte,
        volatility: Math.max(5, leg.iv + ivShift),
        rate: riskFreeRate,
      });

      const greeks = leg.type === 'CALL' ? bsm.callGreeks : bsm.putGreeks;
      const directionMultiplier = leg.position === 'BUY' ? 1 : -1;

      netDelta += greeks.delta * totalShares * directionMultiplier;
      netGamma += greeks.gamma * totalShares * directionMultiplier;
      netTheta += greeks.theta * totalShares * directionMultiplier;
      netVega += greeks.vega * totalShares * directionMultiplier;
      netRho += greeks.rho * totalShares * directionMultiplier;
    } else {
      // Future
      const directionMultiplier = leg.position === 'BUY' ? 1 : -1;
      netDelta += 1 * totalShares * directionMultiplier;
    }
  }

  // 2. Determine spot price simulation range (min -25% to max +25% of current spot or strikes)
  const allStrikes = activeLegs.map(l => l.strike);
  const minStrike = Math.min(spotPrice, ...allStrikes);
  const maxStrike = Math.max(spotPrice, ...allStrikes);
  const rangeLower = Math.max(1, minStrike * 0.75);
  const rangeUpper = maxStrike * 1.25;

  const steps = 80;
  const stepSize = (rangeUpper - rangeLower) / steps;
  const curve: PayoffCurvePoint[] = [];

  let minPnlAtExpiry = Infinity;
  let maxPnlAtExpiry = -Infinity;

  for (let i = 0; i <= steps; i++) {
    const s = rangeLower + i * stepSize;
    let pnlAtExpiry = 0;
    let pnlAtTarget = 0;

    for (const leg of activeLegs) {
      const totalShares = leg.lots * leg.lotSize;
      const positionMult = leg.position === 'BUY' ? 1 : -1;

      if (leg.instrument === 'OPTION') {
        // PnL at Expiry
        let intrinsicValue = 0;
        if (leg.type === 'CALL') {
          intrinsicValue = Math.max(0, s - leg.strike);
        } else {
          intrinsicValue = Math.max(0, leg.strike - s);
        }
        const legExpiryPnl = (intrinsicValue - leg.entryPrice) * totalShares * positionMult;
        pnlAtExpiry += legExpiryPnl;

        // PnL at Target Date (T+n)
        const targetRemainingDte = Math.max(0.01, leg.dte - targetDte);
        const bsmTarget = calculateBlackScholes({
          spot: s,
          strike: leg.strike,
          dte: targetRemainingDte,
          volatility: Math.max(5, leg.iv + ivShift),
          rate: riskFreeRate,
        });
        const targetOptionPrice = leg.type === 'CALL' ? bsmTarget.callPrice : bsmTarget.putPrice;
        const legTargetPnl = (targetOptionPrice - leg.entryPrice) * totalShares * positionMult;
        pnlAtTarget += legTargetPnl;
      } else {
        // Future
        const futurePnl = (s - leg.entryPrice) * totalShares * positionMult;
        pnlAtExpiry += futurePnl;
        pnlAtTarget += futurePnl;
      }
    }

    curve.push({
      spotPrice: Number(s.toFixed(2)),
      pnlAtExpiry: Number(pnlAtExpiry.toFixed(2)),
      pnlAtTargetDate: Number(pnlAtTarget.toFixed(2)),
    });

    if (pnlAtExpiry < minPnlAtExpiry) minPnlAtExpiry = pnlAtExpiry;
    if (pnlAtExpiry > maxPnlAtExpiry) maxPnlAtExpiry = pnlAtExpiry;
  }

  // 3. Find Breakeven Points (where expiry P&L crosses zero)
  const breakevens: number[] = [];
  for (let i = 0; i < curve.length - 1; i++) {
    const p1 = curve[i];
    const p2 = curve[i + 1];
    if ((p1.pnlAtExpiry <= 0 && p2.pnlAtExpiry >= 0) || (p1.pnlAtExpiry >= 0 && p2.pnlAtExpiry <= 0)) {
      // Linear interpolation
      const diffPnl = p2.pnlAtExpiry - p1.pnlAtExpiry;
      if (Math.abs(diffPnl) > 0.0001) {
        const factor = (0 - p1.pnlAtExpiry) / diffPnl;
        const bePrice = p1.spotPrice + factor * (p2.spotPrice - p1.spotPrice);
        breakevens.push(Number(bePrice.toFixed(2)));
      }
    }
  }

  // Deduplicate and round breakevens
  const uniqueBreakevens = Array.from(new Set(breakevens)).sort((a, b) => a - b);

  // 4. Check for Unlimited upside / downside
  const firstPoint = curve[0];
  const lastPoint = curve[curve.length - 1];
  const hasUnlimitedProfit = lastPoint.pnlAtExpiry > maxPnlAtExpiry * 0.95 && lastPoint.pnlAtExpiry > curve[Math.floor(curve.length / 2)].pnlAtExpiry + 5000;
  const hasUnlimitedLoss = lastPoint.pnlAtExpiry < -100000 && lastPoint.pnlAtExpiry < firstPoint.pnlAtExpiry;

  const maxProfit: number | 'UNLIMITED' = hasUnlimitedProfit ? 'UNLIMITED' : Number(maxPnlAtExpiry.toFixed(2));
  const maxLoss: number | 'UNLIMITED' = hasUnlimitedLoss ? 'UNLIMITED' : Number(minPnlAtExpiry.toFixed(2));

  // Risk reward ratio string
  let riskRewardRatio = 'N/A';
  if (typeof maxProfit === 'number' && typeof maxLoss === 'number' && maxLoss !== 0) {
    const ratio = Math.abs(maxProfit / maxLoss).toFixed(2);
    riskRewardRatio = `1:${ratio}`;
  } else if (maxProfit === 'UNLIMITED') {
    riskRewardRatio = 'Unlimited:1';
  }

  // Estimate POP (Probability of Profit) using Delta heuristics
  let pop = 50;
  if (uniqueBreakevens.length === 1) {
    const be = uniqueBreakevens[0];
    const distance = (be - spotPrice) / spotPrice;
    pop = Math.min(95, Math.max(5, Math.round(50 + (netDelta > 0 ? -distance * 100 : distance * 100))));
  } else if (uniqueBreakevens.length === 2) {
    const lower = uniqueBreakevens[0];
    const upper = uniqueBreakevens[1];
    if (spotPrice >= lower && spotPrice <= upper) {
      pop = Math.min(90, Math.max(30, Math.round(65 - Math.abs(netDelta / 10))));
    } else {
      pop = 35;
    }
  }

  return {
    netCostOrCredit: Number(netCostOrCredit.toFixed(2)),
    maxProfit,
    maxLoss,
    breakevens: uniqueBreakevens,
    riskRewardRatio,
    netGreeks: {
      delta: Number(netDelta.toFixed(2)),
      gamma: Number(netGamma.toFixed(4)),
      theta: Number(netTheta.toFixed(2)),
      vega: Number(netVega.toFixed(2)),
      rho: Number(netRho.toFixed(2)),
    },
    pop,
    marginRequired: Number(estimatedMargin.toFixed(2)),
    curve,
  };
}
