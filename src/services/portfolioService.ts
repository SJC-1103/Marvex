import { PortfolioBook, PortfolioHolding, BookValuationSummary, CalculatedHolding } from '../types/portfolio';
import { Currency } from '../types/market';
import { PriceAlert } from '../types/alert';
import { QuantitativeRiskMetrics, ConcentrationDiagnostic, SectorWeight, HoldingAttribution } from '../types/risk';
import { marketService } from './marketDataService';
import { convertCurrency, DEFAULT_USD_INR_RATE } from '../utils/currency';
import {
  calculateAnnualizedVolatility,
  calculateBeta,
  calculateDrawdown,
  calculateCAGR,
  calculateSharpeRatio,
} from '../utils/analytics';

export type SaveState = 'saved' | 'saving' | 'unsaved';

export interface AppBackupData {
  version: string;
  exportedAt: string;
  activeBookId: string;
  books: PortfolioBook[];
  watchlist: string[];
  alerts: PriceAlert[];
  currency: Currency;
  autosaveEnabled: boolean;
}

const STORAGE_KEY_BOOKS = 'mavix_portfolio_books_v2';
const STORAGE_KEY_ACTIVE_BOOK = 'mavix_active_book_id_v2';
const STORAGE_KEY_SETTINGS = 'mavix_app_settings_v2';

const DEFAULT_INITIAL_BOOKS: PortfolioBook[] = [
  {
    id: 'book-core-wealth',
    name: 'Core Wealth & Retirement',
    description: 'Long-term diversified capital allocation across Indian bluechips, index funds, and US tech innovators.',
    baseCurrency: 'INR',
    cashBalance: 150000, // ₹1.5 Lakh uninvested liquidity
    holdings: [
      {
        id: 'pos-reliance',
        assetType: 'EQUITY',
        symbolOrCode: 'RELIANCE',
        name: 'Reliance Industries Limited',
        exchangeOrAmc: 'NSE',
        quantityOrUnits: 30,
        averageCost: 2840.00,
        purchaseDate: '2024-01-15',
        currency: 'INR',
      },
      {
        id: 'pos-hdfcbank',
        assetType: 'EQUITY',
        symbolOrCode: 'HDFCBANK',
        name: 'HDFC Bank Limited',
        exchangeOrAmc: 'NSE',
        quantityOrUnits: 65,
        averageCost: 1590.00,
        purchaseDate: '2024-02-12',
        currency: 'INR',
      },
      {
        id: 'pos-ppfas',
        assetType: 'MUTUAL_FUND',
        symbolOrCode: '122639',
        name: 'Parag Parikh Flexi Cap Fund Direct Growth',
        exchangeOrAmc: 'PPFAS Mutual Fund',
        quantityOrUnits: 1500,
        averageCost: 65.40,
        purchaseDate: '2023-06-20',
        currency: 'INR',
      },
      {
        id: 'pos-nvda',
        assetType: 'EQUITY',
        symbolOrCode: 'NVDA',
        name: 'NVIDIA Corporation',
        exchangeOrAmc: 'NASDAQ',
        quantityOrUnits: 18,
        averageCost: 112.50,
        purchaseDate: '2024-03-08',
        currency: 'USD',
      },
      {
        id: 'pos-uti50',
        assetType: 'MUTUAL_FUND',
        symbolOrCode: '120716',
        name: 'UTI Nifty 50 Index Fund Direct Growth',
        exchangeOrAmc: 'UTI Mutual Fund',
        quantityOrUnits: 450,
        averageCost: 152.80,
        purchaseDate: '2023-09-15',
        currency: 'INR',
      },
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'book-global-tech',
    name: 'Global Tech Growth',
    description: 'High-conviction cross-border semiconductor, enterprise cloud, and AI platform equities.',
    baseCurrency: 'USD',
    cashBalance: 5000, // $5,000 cash
    holdings: [
      {
        id: 'pos-aapl',
        assetType: 'EQUITY',
        symbolOrCode: 'AAPL',
        name: 'Apple Inc.',
        exchangeOrAmc: 'NASDAQ',
        quantityOrUnits: 25,
        averageCost: 215.00,
        purchaseDate: '2024-02-28',
        currency: 'USD',
      },
      {
        id: 'pos-msft',
        assetType: 'EQUITY',
        symbolOrCode: 'MSFT',
        name: 'Microsoft Corporation',
        exchangeOrAmc: 'NASDAQ',
        quantityOrUnits: 15,
        averageCost: 405.00,
        purchaseDate: '2024-01-18',
        currency: 'USD',
      },
      {
        id: 'pos-tcs',
        assetType: 'EQUITY',
        symbolOrCode: 'TCS',
        name: 'Tata Consultancy Services Ltd',
        exchangeOrAmc: 'NSE',
        quantityOrUnits: 20,
        averageCost: 3950.00,
        purchaseDate: '2024-03-12',
        currency: 'INR',
      },
    ],
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: new Date().toISOString(),
  },
];

class PortfolioService {
  private books: PortfolioBook[] = [];
  private activeBookId = '';
  private autosaveEnabled = true;
  private saveState: SaveState = 'saved';

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const savedBooks = localStorage.getItem(STORAGE_KEY_BOOKS);
      if (savedBooks) {
        this.books = JSON.parse(savedBooks);
      } else {
        this.books = JSON.parse(JSON.stringify(DEFAULT_INITIAL_BOOKS));
        this.persistBooks();
      }

      const savedActiveId = localStorage.getItem(STORAGE_KEY_ACTIVE_BOOK);
      if (savedActiveId && this.books.some(b => b.id === savedActiveId)) {
        this.activeBookId = savedActiveId;
      } else {
        this.activeBookId = this.books[0]?.id || '';
      }

      const savedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (typeof parsed.autosaveEnabled === 'boolean') {
          this.autosaveEnabled = parsed.autosaveEnabled;
        }
      }
    } catch {
      this.books = JSON.parse(JSON.stringify(DEFAULT_INITIAL_BOOKS));
      this.activeBookId = this.books[0]?.id || '';
    }
  }

  private persistBooks() {
    if (!this.autosaveEnabled) {
      this.saveState = 'unsaved';
      return;
    }
    this.saveState = 'saving';
    try {
      localStorage.setItem(STORAGE_KEY_BOOKS, JSON.stringify(this.books));
      localStorage.setItem(STORAGE_KEY_ACTIVE_BOOK, this.activeBookId);
      this.saveState = 'saved';
    } catch {
      this.saveState = 'unsaved';
    }
  }

  public getSaveState(): SaveState {
    return this.saveState;
  }

  public isAutosaveEnabled(): boolean {
    return this.autosaveEnabled;
  }

  public setAutosaveEnabled(enabled: boolean) {
    this.autosaveEnabled = enabled;
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify({ autosaveEnabled: enabled }));
    } catch {
      // ignore
    }
    if (enabled) {
      this.persistBooks();
    }
  }

  public manualSave() {
    this.saveState = 'saving';
    try {
      localStorage.setItem(STORAGE_KEY_BOOKS, JSON.stringify(this.books));
      localStorage.setItem(STORAGE_KEY_ACTIVE_BOOK, this.activeBookId);
      this.saveState = 'saved';
    } catch {
      this.saveState = 'unsaved';
    }
  }

  public getBooks(): PortfolioBook[] {
    return this.books;
  }

  public getActiveBook(): PortfolioBook {
    const book = this.books.find(b => b.id === this.activeBookId);
    return book || this.books[0] || DEFAULT_INITIAL_BOOKS[0];
  }

  public setActiveBookId(bookId: string) {
    if (this.books.some(b => b.id === bookId)) {
      this.activeBookId = bookId;
      this.persistBooks();
    }
  }

  public createBook(name: string, description?: string, baseCurrency: Currency = 'INR'): PortfolioBook {
    const newBook: PortfolioBook = {
      id: `book-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim() || 'New Portfolio',
      description: description?.trim() || '',
      baseCurrency,
      cashBalance: 0,
      holdings: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.books.push(newBook);
    this.activeBookId = newBook.id;
    this.persistBooks();
    return newBook;
  }

  public renameBook(bookId: string, newName: string, newDescription?: string) {
    const book = this.books.find(b => b.id === bookId);
    if (book) {
      book.name = newName.trim() || book.name;
      if (newDescription !== undefined) {
        book.description = newDescription.trim();
      }
      book.updatedAt = new Date().toISOString();
      this.persistBooks();
    }
  }

  public deleteBook(bookId: string): boolean {
    if (this.books.length <= 1) {
      return false; // Prevent deleting the sole remaining book
    }
    this.books = this.books.filter(b => b.id !== bookId);
    if (this.activeBookId === bookId) {
      this.activeBookId = this.books[0]?.id || '';
    }
    this.persistBooks();
    return true;
  }

  public updateCashBalance(bookId: string, newCashAmount: number) {
    const book = this.books.find(b => b.id === bookId);
    if (book) {
      book.cashBalance = Math.max(0, Number(newCashAmount.toFixed(2)));
      book.updatedAt = new Date().toISOString();
      this.persistBooks();
    }
  }

  public addHolding(bookId: string, holding: Omit<PortfolioHolding, 'id'>) {
    const book = this.books.find(b => b.id === bookId);
    if (!book) return;

    // Check if position already exists for this symbol
    const existingIndex = book.holdings.findIndex(
      h => h.assetType === holding.assetType && h.symbolOrCode.toUpperCase() === holding.symbolOrCode.toUpperCase()
    );

    if (existingIndex >= 0) {
      const existing = book.holdings[existingIndex];
      const totalQty = existing.quantityOrUnits + holding.quantityOrUnits;
      const weightedCost =
        (existing.quantityOrUnits * existing.averageCost + holding.quantityOrUnits * holding.averageCost) / totalQty;

      book.holdings[existingIndex] = {
        ...existing,
        quantityOrUnits: totalQty,
        averageCost: Number(weightedCost.toFixed(2)),
      };
    } else {
      const newHolding: PortfolioHolding = {
        ...holding,
        id: `pos-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      };
      book.holdings.push(newHolding);
    }

    book.updatedAt = new Date().toISOString();
    this.persistBooks();
  }

  public addMultipleHoldings(bookId: string, holdings: Omit<PortfolioHolding, 'id'>[]) {
    holdings.forEach(h => this.addHolding(bookId, h));
  }

  public deleteHolding(bookId: string, holdingId: string) {
    const book = this.books.find(b => b.id === bookId);
    if (book) {
      book.holdings = book.holdings.filter(h => h.id !== holdingId);
      book.updatedAt = new Date().toISOString();
      this.persistBooks();
    }
  }

  /**
   * Calculates comprehensive valuation summary for a given book in display currency
   */
  public calculateBookSummary(
    book: PortfolioBook,
    displayCurrency: Currency,
    exchangeRate: number = DEFAULT_USD_INR_RATE
  ): BookValuationSummary {
    let totalMarketValue = 0;
    let totalInvestedCost = 0;
    let equityValue = 0;
    let mutualFundValue = 0;

    const cashConverted = convertCurrency(book.cashBalance, book.baseCurrency, displayCurrency, exchangeRate);

    const calculatedHoldings: CalculatedHolding[] = [];

    book.holdings.forEach(h => {
      let currentPriceNative = h.averageCost;
      let dailyChangeNative = 0;
      let dailyChangePercent = 0;

      if (h.assetType === 'EQUITY') {
        const stock = marketService.getStockById(h.symbolOrCode);
        if (stock) {
          currentPriceNative = stock.price;
          dailyChangeNative = stock.change;
          dailyChangePercent = stock.changePercent;
        }
      } else if (h.assetType === 'MUTUAL_FUND') {
        const fund = marketService.getMutualFundById(h.symbolOrCode);
        if (fund) {
          currentPriceNative = fund.nav;
          dailyChangeNative = fund.change;
          dailyChangePercent = fund.changePercent;
        }
      }

      // Convert to display currency
      const currentPrice = convertCurrency(currentPriceNative, h.currency, displayCurrency, exchangeRate);
      const costBasis = convertCurrency(h.averageCost * h.quantityOrUnits, h.currency, displayCurrency, exchangeRate);
      const currentValue = currentPrice * h.quantityOrUnits;

      const unrealizedGain = currentValue - costBasis;
      const unrealizedGainPercent = costBasis > 0 ? (unrealizedGain / costBasis) * 100 : 0;

      const dailyChange = convertCurrency(dailyChangeNative * h.quantityOrUnits, h.currency, displayCurrency, exchangeRate);

      totalMarketValue += currentValue;
      totalInvestedCost += costBasis;

      if (h.assetType === 'EQUITY') {
        equityValue += currentValue;
      } else {
        mutualFundValue += currentValue;
      }

      calculatedHoldings.push({
        holding: h,
        currentPrice,
        currentValue,
        costBasis,
        unrealizedGain,
        unrealizedGainPercent,
        weightPercent: 0, // calculated below against total net worth
        dailyChange,
        dailyChangePercent,
      });
    });

    const totalNetWorth = totalMarketValue + cashConverted;
    const totalUnrealizedGain = totalMarketValue - totalInvestedCost;
    const totalUnrealizedGainPercent = totalInvestedCost > 0 ? (totalUnrealizedGain / totalInvestedCost) * 100 : 0;

    calculatedHoldings.forEach(ch => {
      ch.weightPercent = totalNetWorth > 0 ? (ch.currentValue / totalNetWorth) * 100 : 0;
    });

    // Sort descending by position value
    calculatedHoldings.sort((a, b) => b.currentValue - a.currentValue);

    return {
      bookId: book.id,
      bookName: book.name,
      currency: displayCurrency,
      totalMarketValue,
      cashBalance: cashConverted,
      totalNetWorth,
      totalInvestedCost,
      totalUnrealizedGain,
      totalUnrealizedGainPercent,
      equityAllocationPercent: totalNetWorth > 0 ? (equityValue / totalNetWorth) * 100 : 0,
      mutualFundAllocationPercent: totalNetWorth > 0 ? (mutualFundValue / totalNetWorth) * 100 : 0,
      cashAllocationPercent: totalNetWorth > 0 ? (cashConverted / totalNetWorth) * 100 : 0,
      calculatedHoldings,
    };
  }

  /**
   * Generates a complete JSON backup of the user's data
   */
  public generateBackupJson(watchlist: string[], alerts: PriceAlert[], currency: Currency): string {
    const backup: AppBackupData = {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      activeBookId: this.activeBookId,
      books: this.books,
      watchlist,
      alerts,
      currency,
      autosaveEnabled: this.autosaveEnabled,
    };
    return JSON.stringify(backup, null, 2);
  }

  /**
   * Validates and restores a complete JSON backup
   */
  public restoreBackupJson(jsonString: string): { success: boolean; message: string; data?: AppBackupData } {
    try {
      const parsed = JSON.parse(jsonString);

      // Schema verification
      if (!parsed || !Array.isArray(parsed.books) || parsed.books.length === 0) {
        return { success: false, message: 'Invalid backup: missing or empty "books" array.' };
      }

      for (const book of parsed.books) {
        if (!book.id || !book.name || !Array.isArray(book.holdings)) {
          return { success: false, message: 'Invalid backup: one or more portfolio books have invalid structure.' };
        }
      }

      this.books = parsed.books;
      this.activeBookId = parsed.activeBookId && this.books.some(b => b.id === parsed.activeBookId)
        ? parsed.activeBookId
        : this.books[0].id;

      if (typeof parsed.autosaveEnabled === 'boolean') {
        this.autosaveEnabled = parsed.autosaveEnabled;
      }

      this.persistBooks();

      return {
        success: true,
        message: `Successfully restored ${this.books.length} portfolio books and settings.`,
        data: parsed,
      };
    } catch (err: unknown) {
      return { success: false, message: `Failed to parse backup JSON: ${(err as Error).message}` };
    }
  }

  /**
   * Safe factory reset requiring confirmation token 'RESET'
   */
  public factoryReset(confirmationString: string): { success: boolean; message: string } {
    if (confirmationString.trim() !== 'RESET') {
      return { success: false, message: 'Incorrect confirmation string. Type RESET exactly to confirm factory reset.' };
    }

    try {
      localStorage.removeItem(STORAGE_KEY_BOOKS);
      localStorage.removeItem(STORAGE_KEY_ACTIVE_BOOK);
      localStorage.removeItem(STORAGE_KEY_SETTINGS);
      localStorage.removeItem('fmm_quantum_watchlist');
      localStorage.removeItem('fmm_quantum_alerts');
      localStorage.removeItem('mavix_watchlist_v2');
      localStorage.removeItem('mavix_alerts_v2');

      this.books = JSON.parse(JSON.stringify(DEFAULT_INITIAL_BOOKS));
      this.activeBookId = this.books[0].id;
      this.autosaveEnabled = true;
      this.persistBooks();

      return { success: true, message: 'Application successfully reset to factory defaults.' };
    } catch (err: unknown) {
      return { success: false, message: `Reset failed: ${(err as Error).message}` };
    }
  }

  /**
   * Calculates comprehensive Quantitative Risk & Attribution Metrics for a portfolio book
   */
  public calculatePortfolioRisk(
    book: PortfolioBook,
    displayCurrency: Currency,
    exchangeRate: number = DEFAULT_USD_INR_RATE,
    benchmarkSymbol: string = 'NIFTY 50'
  ): QuantitativeRiskMetrics {
    const summary = this.calculateBookSummary(book, displayCurrency, exchangeRate);
    const benchmark = marketService.getIndexById(benchmarkSymbol) || marketService.getIndices()[0];
    const benchmarkBars = benchmark?.history || [];
    const benchmarkCloses = benchmarkBars.map(b => b.close);

    // Build historical composite valuation of the portfolio
    const dateValueMap: Map<string, number> = new Map();

    book.holdings.forEach(h => {
      let historyBars: { date: string; close: number }[] = [];
      if (h.assetType === 'EQUITY') {
        const s = marketService.getStockById(h.symbolOrCode);
        if (s) historyBars = s.history;
      } else {
        const mf = marketService.getMutualFundById(h.symbolOrCode);
        if (mf) historyBars = mf.history;
      }

      if (historyBars.length > 0) {
        historyBars.forEach(bar => {
          const convertedClose = convertCurrency(bar.close, h.currency, displayCurrency, exchangeRate);
          const posVal = convertedClose * h.quantityOrUnits;
          const currentTotal = dateValueMap.get(bar.date) || 0;
          dateValueMap.set(bar.date, currentTotal + posVal);
        });
      }
    });

    // Add cash balance to historical valuation
    const cashVal = summary.cashBalance;
    const sortedDates = Array.from(dateValueMap.keys()).sort();
    const portfolioCloses = sortedDates.map(d => (dateValueMap.get(d) || 0) + cashVal);

    // Annualized volatility
    const annualizedVolatility = portfolioCloses.length >= 10
      ? calculateAnnualizedVolatility(portfolioCloses)
      : 14.5;

    // Beta vs benchmark
    const beta = (portfolioCloses.length >= 10 && benchmarkCloses.length >= 10)
      ? calculateBeta(portfolioCloses, benchmarkCloses)
      : 0.95;

    // Max Drawdown
    const drawdownResult = portfolioCloses.length >= 5
      ? calculateDrawdown(portfolioCloses)
      : { drawdownSeries: [], maxDrawdownPercent: 7.8 };

    // CAGR (1Y or historical duration)
    const cagrPercent = portfolioCloses.length >= 10
      ? calculateCAGR(portfolioCloses[0], portfolioCloses[portfolioCloses.length - 1], portfolioCloses.length)
      : summary.totalUnrealizedGainPercent;

    const riskFreeRatePercent = 6.50; // RBI Repo Rate Baseline
    const sharpeRatio = calculateSharpeRatio(cagrPercent, annualizedVolatility, riskFreeRatePercent);

    // Concentration Diagnostic
    let maxPositionWeight = 0;
    let maxPositionSymbol = 'None';

    summary.calculatedHoldings.forEach(ch => {
      if (ch.weightPercent > maxPositionWeight) {
        maxPositionWeight = ch.weightPercent;
        maxPositionSymbol = ch.holding.symbolOrCode;
      }
    });

    const top3WeightPercent = summary.calculatedHoldings
      .slice(0, 3)
      .reduce((sum, ch) => sum + ch.weightPercent, 0);

    const hasWarning = maxPositionWeight > 20;
    const warningMessage = hasWarning
      ? `Single position ${maxPositionSymbol} exceeds 20.0% of portfolio net worth (${maxPositionWeight.toFixed(1)}%). Elevated idiosyncratic risk.`
      : undefined;

    const concentration: ConcentrationDiagnostic = {
      hasWarning,
      warningMessage,
      maxPositionWeight: Number(maxPositionWeight.toFixed(1)),
      maxPositionSymbol,
      top3WeightPercent: Number(top3WeightPercent.toFixed(1)),
    };

    // Sector breakdown
    const sectorMap: Map<string, number> = new Map();
    summary.calculatedHoldings.forEach(ch => {
      let sectorName = 'Diversified';
      if (ch.holding.assetType === 'EQUITY') {
        const s = marketService.getStockById(ch.holding.symbolOrCode);
        if (s) sectorName = s.sector;
      } else {
        const mf = marketService.getMutualFundById(ch.holding.symbolOrCode);
        if (mf) sectorName = `Mutual Fund (${mf.category})`;
      }
      const existing = sectorMap.get(sectorName) || 0;
      sectorMap.set(sectorName, existing + ch.currentValue);
    });

    if (summary.cashBalance > 0) {
      sectorMap.set('Liquid Cash', summary.cashBalance);
    }

    const sectorBreakdown: SectorWeight[] = Array.from(sectorMap.entries()).map(([sector, value]) => ({
      sector,
      value,
      weightPercent: summary.totalNetWorth > 0 ? Number(((value / summary.totalNetWorth) * 100).toFixed(1)) : 0,
    })).sort((a, b) => b.weightPercent - a.weightPercent);

    // Attributions
    const attributions: HoldingAttribution[] = summary.calculatedHoldings.map(ch => {
      const returnPercent = ch.costBasis > 0 ? ((ch.currentValue - ch.costBasis) / ch.costBasis) * 100 : 0;
      const contributionPercent = (ch.weightPercent / 100) * returnPercent;
      return {
        symbol: ch.holding.symbolOrCode,
        name: ch.holding.name,
        weightPercent: Number(ch.weightPercent.toFixed(2)),
        returnPercent: Number(returnPercent.toFixed(2)),
        contributionPercent: Number(contributionPercent.toFixed(2)),
      };
    }).sort((a, b) => b.contributionPercent - a.contributionPercent);

    return {
      annualizedVolatility,
      beta,
      benchmarkSymbol: benchmark?.symbol || 'NIFTY 50',
      sharpeRatio,
      riskFreeRatePercent,
      maxDrawdownPercent: Number(drawdownResult.maxDrawdownPercent.toFixed(2)),
      cagrPercent: Number(cagrPercent.toFixed(2)),
      concentration,
      sectorBreakdown,
      attributions,
    };
  }
}

export const portfolioService = new PortfolioService();
