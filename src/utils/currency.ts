import { Currency } from '../types/market';

// Reference spot benchmark: $1 = ₹86.85 (RBI Reference Rate Baseline)
export const DEFAULT_USD_INR_RATE = 86.85;
export const REFERENCE_RATE_NOTE = '$1.00 USD = ₹86.85 INR (RBI Reference Benchmark)';

/**
 * Converts an amount from one currency to another using the spot benchmark rate
 */
export function convertCurrency(
  amount: number,
  from: Currency,
  to: Currency,
  rate: number = DEFAULT_USD_INR_RATE
): number {
  if (from === to) return amount;
  if (from === 'USD' && to === 'INR') {
    return amount * rate;
  }
  if (from === 'INR' && to === 'USD') {
    return amount / rate;
  }
  return amount;
}

/**
 * Standard financial currency formatting
 */
export function formatCurrency(
  amount: number,
  targetCurrency: Currency,
  fromCurrency: Currency = targetCurrency,
  rate: number = DEFAULT_USD_INR_RATE,
  decimals: number = 2
): string {
  const converted = convertCurrency(amount, fromCurrency, targetCurrency, rate);

  if (targetCurrency === 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: decimals,
      minimumFractionDigits: decimals,
    }).format(converted);
  } else {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: decimals,
      minimumFractionDigits: decimals,
    }).format(converted);
  }
}

/**
 * Formats large financial figures in Indian notation (₹ Lakh, ₹ Cr) or International ($K, $M, $B, $T)
 */
export function formatCompactFinancial(
  amount: number,
  targetCurrency: Currency,
  fromCurrency: Currency = targetCurrency,
  rate: number = DEFAULT_USD_INR_RATE
): string {
  const val = convertCurrency(amount, fromCurrency, targetCurrency, rate);

  if (targetCurrency === 'INR') {
    const absVal = Math.abs(val);
    const sign = val < 0 ? '-' : '';

    // 1 Lakh Cr = 10^12
    if (absVal >= 1e12) {
      return `${sign}₹${(absVal / 1e12).toFixed(2)} Lakh Cr`;
    }
    // 1 Crore = 10^7
    if (absVal >= 1e7) {
      return `${sign}₹${(absVal / 1e7).toFixed(2)} Cr`;
    }
    // 1 Lakh = 10^5
    if (absVal >= 1e5) {
      return `${sign}₹${(absVal / 1e5).toFixed(2)} L`;
    }
    return `${sign}₹${absVal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  } else {
    const absVal = Math.abs(val);
    const sign = val < 0 ? '-' : '';

    if (absVal >= 1e12) {
      return `${sign}$${(absVal / 1e12).toFixed(2)}T`;
    }
    if (absVal >= 1e9) {
      return `${sign}$${(absVal / 1e9).toFixed(2)}B`;
    }
    if (absVal >= 1e6) {
      return `${sign}$${(absVal / 1e6).toFixed(2)}M`;
    }
    if (absVal >= 1e3) {
      return `${sign}$${(absVal / 1e3).toFixed(1)}K`;
    }
    return `${sign}$${absVal.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  }
}

// Backwards-compatible aliases
export const formatMarketCap = formatCompactFinancial;
export function formatVolume(volume: number, currency: Currency): string {
  return formatCompactFinancial(volume, currency).replace(/[₹$]/g, '');
}
