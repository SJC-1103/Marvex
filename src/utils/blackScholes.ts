import { Greeks } from '../types/derivatives';

// Standard normal cumulative distribution function (Abramowitz & Stegun approximation)
export function cdfNormal(x: number): number {
  const b1 = 0.319381530;
  const b2 = -0.356563782;
  const b3 = 1.781477937;
  const b4 = -1.821255978;
  const b5 = 1.330274429;
  const p = 0.2316419;
  const c = 0.3989422804014327; // 1 / sqrt(2 * PI)

  if (x >= 0.0) {
    const t = 1.0 / (1.0 + p * x);
    return 1.0 - c * Math.exp(-x * x / 2.0) * t *
      (t * (t * (t * (t * b5 + b4) + b3) + b2) + b1);
  } else {
    const t = 1.0 / (1.0 - p * x);
    return c * Math.exp(-x * x / 2.0) * t *
      (t * (t * (t * (t * b5 + b4) + b3) + b2) + b1);
  }
}

// Standard normal probability density function
export function pdfNormal(x: number): number {
  return (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * x * x);
}

export interface BSMInputs {
  spot: number;          // S: Current underlying spot price
  strike: number;        // K: Option strike price
  dte: number;           // Days to expiration
  volatility: number;    // sigma: Implied volatility as a percentage e.g. 24.5 for 24.5%
  rate?: number;         // r: Annualized risk-free rate e.g. 0.065 for 6.5% (default: 6.5% INR / 4.5% USD)
  dividendYield?: number;// q: Annualized dividend yield e.g. 0.01 (default: 0)
}

export interface BSMResult {
  callPrice: number;
  putPrice: number;
  callGreeks: Greeks;
  putGreeks: Greeks;
  d1: number;
  d2: number;
}

/**
 * Calculates European Option price and Greeks using Black-Scholes-Merton model
 */
export function calculateBlackScholes(inputs: BSMInputs): BSMResult {
  const S = Math.max(inputs.spot, 0.001);
  const K = Math.max(inputs.strike, 0.001);
  const T = Math.max(inputs.dte, 0.0001) / 365; // Time in years
  const sigma = Math.max(inputs.volatility, 0.1) / 100; // Decimal volatility
  const r = inputs.rate ?? 0.065; // 6.5% default risk-free rate
  const q = inputs.dividendYield ?? 0;

  const sqrtT = Math.sqrt(T);
  const d1 = (Math.log(S / K) + (r - q + 0.5 * sigma * sigma) * T) / (sigma * sqrtT);
  const d2 = d1 - sigma * sqrtT;

  const expNegQT = Math.exp(-q * T);
  const expNegRT = Math.exp(-r * T);

  const Nd1 = cdfNormal(d1);
  const Nd2 = cdfNormal(d2);
  const NNegD1 = cdfNormal(-d1);
  const NNegD2 = cdfNormal(-d2);
  const pdfD1 = pdfNormal(d1);

  // Prices
  const callPrice = Math.max(0, S * expNegQT * Nd1 - K * expNegRT * Nd2);
  const putPrice = Math.max(0, K * expNegRT * NNegD2 - S * expNegQT * NNegD1);

  // Greeks
  // Delta
  const callDelta = expNegQT * Nd1;
  const putDelta = expNegQT * (Nd1 - 1);

  // Gamma (same for Call and Put)
  const gamma = (expNegQT * pdfD1) / (S * sigma * sqrtT);

  // Vega (same for Call and Put, per 1% move in IV)
  const vega = (S * expNegQT * pdfD1 * sqrtT) / 100;

  // Theta (annualized then converted to 1-day decay per share)
  const thetaCommon = -(S * expNegQT * pdfD1 * sigma) / (2 * sqrtT);
  const callThetaAnnual = thetaCommon - r * K * expNegRT * Nd2 + q * S * expNegQT * Nd1;
  const putThetaAnnual = thetaCommon + r * K * expNegRT * NNegD2 - q * S * expNegQT * NNegD1;

  const callTheta = callThetaAnnual / 365;
  const putTheta = putThetaAnnual / 365;

  // Rho (per 1% move in interest rate)
  const callRho = (K * T * expNegRT * Nd2) / 100;
  const putRho = (-K * T * expNegRT * NNegD2) / 100;

  return {
    callPrice: Number(callPrice.toFixed(2)),
    putPrice: Number(putPrice.toFixed(2)),
    callGreeks: {
      delta: Number(callDelta.toFixed(3)),
      gamma: Number(gamma.toFixed(4)),
      theta: Number(callTheta.toFixed(2)),
      vega: Number(vega.toFixed(2)),
      rho: Number(callRho.toFixed(3)),
    },
    putGreeks: {
      delta: Number(putDelta.toFixed(3)),
      gamma: Number(gamma.toFixed(4)),
      theta: Number(putTheta.toFixed(2)),
      vega: Number(vega.toFixed(2)),
      rho: Number(putRho.toFixed(3)),
    },
    d1,
    d2,
  };
}

/**
 * Forward futures cost-of-carry model:
 * F = S * (1 + (r - q) * (DTE / 365))
 */
export function calculateFuturesForward(spot: number, dte: number, rate = 0.065, dividendYield = 0.01): number {
  const T = Math.max(dte, 0) / 365;
  const forward = spot * Math.exp((rate - dividendYield) * T);
  return Number(forward.toFixed(2));
}
