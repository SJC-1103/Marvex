import { Currency, AssetType } from './market';

export interface PriceAlert {
  id: string;
  assetType: AssetType;
  symbolOrCode: string;
  name: string;
  targetPrice: number;
  condition: 'ABOVE' | 'BELOW';
  currency: Currency;
  initialPrice: number;
  createdAt: string;
  triggered: boolean;
  triggeredAt?: string;
  triggeredPrice?: number;

  // Compatibility aliases
  stockId?: string;
  symbol?: string;
}

export interface AlertNotification {
  id: string;
  alertId: string;
  symbolOrCode?: string;
  symbol?: string;
  targetPrice: number;
  condition: 'ABOVE' | 'BELOW';
  currency: Currency;
  currentPrice: number;
  timestamp: string;
}
