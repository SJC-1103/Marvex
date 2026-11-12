import { PortfolioHolding } from '../types/portfolio';
import { Currency, AssetType } from '../types/market';

export interface CsvParsedRow {
  rowNumber: number;
  rawType: string;
  rawSymbolOrCode: string;
  rawName: string;
  rawExchangeOrAMC: string;
  rawQuantity: string;
  rawAvgCost: string;
  rawPurchaseDate: string;
  rawCurrency: string;
  isValid: boolean;
  errors: string[];
  isDuplicate: boolean;
  parsedHolding?: Omit<PortfolioHolding, 'id'>;
}

export interface CsvValidationResult {
  totalRows: number;
  validRowsCount: number;
  invalidRowsCount: number;
  duplicateRowsCount: number;
  rows: CsvParsedRow[];
  canImport: boolean;
}

export const CSV_EXPECTED_HEADER = 'Type,SymbolOrCode,Name,ExchangeOrAMC,QuantityOrUnits,AvgCost,PurchaseDate,Currency';

export const CSV_SAMPLE_TEMPLATE = `Type,SymbolOrCode,Name,ExchangeOrAMC,QuantityOrUnits,AvgCost,PurchaseDate,Currency
EQUITY,RELIANCE,Reliance Industries Ltd,NSE,25,2890.00,2024-01-15,INR
EQUITY,NVDA,NVIDIA Corporation,NASDAQ,15,129.50,2024-02-10,USD
EQUITY,TATAMOTORS,Tata Motors Passenger Vehicles,NSE,50,920.00,2023-11-20,INR
MUTUAL_FUND,122639,Parag Parikh Flexi Cap Fund Direct Growth,PPFAS Mutual Fund,120.5,74.25,2023-08-14,INR
MUTUAL_FUND,119062,HDFC Top 100 Fund Direct Plan Growth,HDFC Mutual Fund,85.2,982.10,2023-09-01,INR
EQUITY,AAPL,Apple Inc,NASDAQ,20,215.40,2024-03-05,USD`;

/**
 * Parses and validates CSV input for portfolio importing
 */
export function parseAndValidateCsv(
  csvContent: string,
  existingHoldings: PortfolioHolding[] = []
): CsvValidationResult {
  const lines = csvContent
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  if (lines.length === 0) {
    return {
      totalRows: 0,
      validRowsCount: 0,
      invalidRowsCount: 0,
      duplicateRowsCount: 0,
      rows: [],
      canImport: false,
    };
  }

  // Check header
  const firstLine = lines[0].toLowerCase();
  const hasHeader = firstLine.includes('symbol') || firstLine.includes('type') || firstLine.includes('quantity');
  const dataLines = hasHeader ? lines.slice(1) : lines;

  const rows: CsvParsedRow[] = [];
  const seenKeys = new Set<string>();

  existingHoldings.forEach(h => {
    seenKeys.add(`${h.assetType}:${h.symbolOrCode.toUpperCase()}`);
  });

  dataLines.forEach((line, index) => {
    const rowNumber = index + (hasHeader ? 2 : 1);
    // Simple CSV splitter handling potential quotes
    const cols = line.split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
    const errors: string[] = [];

    const rawType = (cols[0] || '').toUpperCase();
    const rawSymbolOrCode = cols[1] || '';
    const rawName = cols[2] || rawSymbolOrCode;
    const rawExchangeOrAMC = cols[3] || 'NSE';
    const rawQuantity = cols[4] || '';
    const rawAvgCost = cols[5] || '';
    const rawPurchaseDate = cols[6] || new Date().toISOString().split('T')[0];
    const rawCurrency = (cols[7] || (rawExchangeOrAMC === 'NASDAQ' || rawExchangeOrAMC === 'NYSE' ? 'USD' : 'INR')).toUpperCase();

    // 1. Validate Asset Type
    let assetType: AssetType = 'EQUITY';
    if (rawType === 'EQUITY' || rawType === 'STOCK' || rawType === 'SHARE') {
      assetType = 'EQUITY';
    } else if (rawType === 'MUTUAL_FUND' || rawType === 'MF' || rawType === 'FUND') {
      assetType = 'MUTUAL_FUND';
    } else {
      errors.push(`Invalid Type "${rawType}". Must be EQUITY or MUTUAL_FUND.`);
    }

    // 2. Validate Symbol
    if (!rawSymbolOrCode || rawSymbolOrCode.length < 1) {
      errors.push('Missing SymbolOrCode.');
    }

    // 3. Validate Quantity
    const qty = parseFloat(rawQuantity);
    if (isNaN(qty) || qty <= 0) {
      errors.push(`Invalid Quantity "${rawQuantity}". Must be positive number.`);
    }

    // 4. Validate Average Cost
    const cost = parseFloat(rawAvgCost);
    if (isNaN(cost) || cost <= 0) {
      errors.push(`Invalid AvgCost "${rawAvgCost}". Must be positive number.`);
    }

    // 5. Validate Date
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(rawPurchaseDate)) {
      errors.push(`Invalid Date "${rawPurchaseDate}". Format must be YYYY-MM-DD.`);
    }

    // 6. Validate Currency
    let currency: Currency = 'INR';
    if (rawCurrency === 'USD') {
      currency = 'USD';
    } else if (rawCurrency === 'INR') {
      currency = 'INR';
    } else {
      errors.push(`Invalid Currency "${rawCurrency}". Must be INR or USD.`);
    }

    // 7. Duplicate Detection
    const key = `${assetType}:${rawSymbolOrCode.toUpperCase()}`;
    const isDuplicate = seenKeys.has(key);
    if (isDuplicate) {
      errors.push(`Duplicate: ${rawSymbolOrCode} already exists in portfolio or previous row.`);
    } else if (errors.length === 0) {
      seenKeys.add(key);
    }

    const isValid = errors.length === 0;

    rows.push({
      rowNumber,
      rawType,
      rawSymbolOrCode,
      rawName,
      rawExchangeOrAMC,
      rawQuantity,
      rawAvgCost,
      rawPurchaseDate,
      rawCurrency,
      isValid,
      errors,
      isDuplicate,
      parsedHolding: isValid
        ? {
            assetType,
            symbolOrCode: rawSymbolOrCode.toUpperCase(),
            name: rawName,
            exchangeOrAmc: rawExchangeOrAMC,
            quantityOrUnits: qty,
            averageCost: cost,
            purchaseDate: rawPurchaseDate,
            currency,
          }
        : undefined,
    });
  });

  const validRowsCount = rows.filter(r => r.isValid).length;
  const duplicateRowsCount = rows.filter(r => r.isDuplicate).length;
  const invalidRowsCount = rows.filter(r => !r.isValid && !r.isDuplicate).length;

  return {
    totalRows: rows.length,
    validRowsCount,
    invalidRowsCount,
    duplicateRowsCount,
    rows,
    canImport: validRowsCount > 0,
  };
}
