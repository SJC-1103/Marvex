import { Stock, MarketIndex, DataFeedMode } from '../types/market';
import { MutualFundScheme } from '../types/mutualFund';
import { VERIFIED_STOCKS, VERIFIED_MUTUAL_FUNDS, VERIFIED_INDICES } from '../data/marketData';

export type UnifiedInstrument =
  | (Stock & { assetCategory: 'EQUITY' })
  | (MutualFundScheme & { assetCategory: 'MUTUAL_FUND' })
  | (MarketIndex & { assetCategory: 'INDEX' });

class MarketDataService {
  private stocks: Stock[] = VERIFIED_STOCKS;
  private mutualFunds: MutualFundScheme[] = VERIFIED_MUTUAL_FUNDS;
  private indices: MarketIndex[] = VERIFIED_INDICES;
  private feedMode: DataFeedMode = 'LIVE_EXCHANGE';
  private latencyMs: number = 24;
  private subscribers: Set<(stocks: Stock[], indices: MarketIndex[]) => void> = new Set();
  private intervalId: any = null;
  private lastLiveSync: string = new Date().toISOString();
  private isSyncing = false;

  constructor() {
    this.syncLiveExchangeQuotes();
    this.startMicroTicks();
  }

  public getFeedMode(): DataFeedMode {
    return this.feedMode;
  }

  public setFeedMode(mode: DataFeedMode): void {
    this.feedMode = mode;
    if (mode === 'LIVE_EXCHANGE') {
      this.syncLiveExchangeQuotes();
    }
  }

  public getLastSyncTime(): string {
    return this.lastLiveSync;
  }

  public getApiLatency(): number {
    return this.latencyMs;
  }

  public async syncLiveExchangeQuotes(): Promise<void> {
    if (this.isSyncing) return;
    this.isSyncing = true;
    const startMs = Date.now();
    try {
      const res = await fetch('/api/market/live-quotes');
      if (res.ok) {
        const payload = await res.json();
        const quotes = payload.quotes || {};
        this.latencyMs = Date.now() - startMs;
        this.lastLiveSync = new Date().toISOString();

        // Update Stocks with real exchange prices
        this.stocks = this.stocks.map(s => {
          const symKey = s.symbol.toUpperCase();
          const q = quotes[symKey];
          if (!q) return s;

          return {
            ...s,
            price: q.price,
            previousClose: q.previousClose,
            change: q.change,
            changePercent: q.changePercent,
            dayHigh: q.dayHigh || s.dayHigh,
            dayLow: q.dayLow || s.dayLow,
            volume: q.volume || s.volume,
            bid: Number((q.price * 0.9995).toFixed(2)),
            ask: Number((q.price * 1.0005).toFixed(2)),
            lastUpdated: q.lastUpdated || new Date().toISOString(),
          };
        });

        // Update Indices with real exchange quotes
        this.indices = this.indices.map(idx => {
          const symKey = idx.symbol.toUpperCase();
          const q = quotes[symKey];
          if (!q) return idx;

          return {
            ...idx,
            value: q.price,
            change: q.change,
            changePercent: q.changePercent,
            high: q.dayHigh || idx.high,
            low: q.dayLow || idx.low,
            dayHigh: q.dayHigh || idx.dayHigh || idx.high,
            dayLow: q.dayLow || idx.dayLow || idx.low,
            lastUpdated: q.lastUpdated || new Date().toISOString(),
          };
        });

        this.subscribers.forEach(cb => cb(this.stocks, this.indices));
      }
    } catch {
      // Keep verified baseline
    } finally {
      this.isSyncing = false;
    }
  }

  public getStocks(): Stock[] {
    return this.stocks;
  }

  public getMutualFunds(): MutualFundScheme[] {
    return this.mutualFunds;
  }

  public getIndices(): MarketIndex[] {
    return this.indices;
  }

  public getStockById(id: string): Stock | undefined {
    return this.stocks.find(s => s.id === id || s.symbol.toUpperCase() === id.toUpperCase());
  }

  public getMutualFundById(id: string): MutualFundScheme | undefined {
    return this.mutualFunds.find(
      mf => mf.id === id || mf.schemeCode === id || mf.symbol.toUpperCase() === id.toUpperCase()
    );
  }

  public getIndexById(id: string): MarketIndex | undefined {
    return this.indices.find(idx => idx.id === id || idx.symbol.toUpperCase() === id.toUpperCase());
  }

  public findInstrument(identifier: string): {
    instrument: Stock | MutualFundScheme | MarketIndex | undefined;
    type: 'EQUITY' | 'MUTUAL_FUND' | 'INDEX' | 'UNKNOWN';
  } {
    const cleanId = identifier.trim().toUpperCase();

    const stock = this.stocks.find(s => s.id === identifier || s.symbol.toUpperCase() === cleanId);
    if (stock) return { instrument: stock, type: 'EQUITY' };

    const fund = this.mutualFunds.find(
      mf => mf.id === identifier || mf.schemeCode === cleanId || mf.symbol.toUpperCase() === cleanId
    );
    if (fund) return { instrument: fund, type: 'MUTUAL_FUND' };

    const index = this.indices.find(idx => idx.id === identifier || idx.symbol.toUpperCase() === cleanId);
    if (index) return { instrument: index, type: 'INDEX' };

    return { instrument: undefined, type: 'UNKNOWN' };
  }

  public searchAll(
    query: string,
    typeFilter: 'ALL' | 'EQUITY' | 'MUTUAL_FUND' | 'INDEX' = 'ALL',
    regionFilter: 'ALL' | 'IN' | 'US' = 'ALL'
  ): UnifiedInstrument[] {
    const q = query.trim().toLowerCase();
    const results: UnifiedInstrument[] = [];

    // Equities
    if (typeFilter === 'ALL' || typeFilter === 'EQUITY') {
      this.stocks.forEach(s => {
        if (regionFilter !== 'ALL' && s.country !== regionFilter) return;
        if (!q || s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q) || s.sector.toLowerCase().includes(q)) {
          results.push({ ...s, assetCategory: 'EQUITY' });
        }
      });
    }

    // Mutual Funds (India)
    if (typeFilter === 'ALL' || typeFilter === 'MUTUAL_FUND') {
      if (regionFilter === 'ALL' || regionFilter === 'IN') {
        this.mutualFunds.forEach(mf => {
          if (!q || mf.symbol.toLowerCase().includes(q) || mf.name.toLowerCase().includes(q) || mf.amc.toLowerCase().includes(q) || mf.category.toLowerCase().includes(q)) {
            results.push({ ...mf, assetCategory: 'MUTUAL_FUND' });
          }
        });
      }
    }

    // Indices
    if (typeFilter === 'ALL' || typeFilter === 'INDEX') {
      this.indices.forEach(idx => {
        if (regionFilter !== 'ALL' && idx.country !== regionFilter) return;
        if (!q || idx.symbol.toLowerCase().includes(q) || idx.name.toLowerCase().includes(q)) {
          results.push({ ...idx, assetCategory: 'INDEX' });
        }
      });
    }

    return results;
  }

  public subscribe(callback: (stocks: Stock[], indices: MarketIndex[]) => void): () => void {
    this.subscribers.add(callback);
    callback(this.stocks, this.indices);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private startMicroTicks(): void {
    if (this.intervalId) return;
    let liveTickCounter = 0;
    this.intervalId = setInterval(() => {
      if (this.feedMode === 'LIVE_EXCHANGE') {
        liveTickCounter++;
        // Poll live exchange every 5 seconds (every 2 intervals of 2500ms)
        if (liveTickCounter % 2 === 0) {
          this.syncLiveExchangeQuotes();
        }
      } else if (this.feedMode === 'SIMULATED') {
        // Micro-drift simulated prices
        this.stocks = this.stocks.map(s => {
          const deltaPct = (Math.random() - 0.49) * 0.001; // tiny tick
          const newPrice = Number((s.price * (1 + deltaPct)).toFixed(2));
          const change = Number((newPrice - s.previousClose).toFixed(2));
          const changePercent = Number(((change / s.previousClose) * 100).toFixed(2));
          return {
            ...s,
            price: newPrice,
            change,
            changePercent,
            bid: Number((newPrice * 0.9995).toFixed(2)),
            ask: Number((newPrice * 1.0005).toFixed(2)),
            lastUpdated: new Date().toISOString(),
          };
        });

        this.subscribers.forEach(cb => cb(this.stocks, this.indices));
      }
    }, 2500);
  }
}

export const marketService = new MarketDataService();
