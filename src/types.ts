export type TradeStatus = 'win' | 'loss' | 'breakeven';

export interface PropConfig {
  firmName: string;
  accountType: string;
  rules: string;
}

export interface Strategy {
  id: string;
  name: string;
  initialBalance: number;
  rules: {
    entry: string;
    exit: string;
  };
  isPropFirm: boolean;
  propConfig?: PropConfig;
}

export interface Trade {
  id: string;
  strategyId: string;
  timestamp: string; // ISO String
  exitTimestamp?: string; // ISO String
  pair: string;
  side: 'long' | 'short';
  entryPrice: number;
  exitPrice: number;
  stopLoss: number;
  takeProfit: number;
  lots: number;
  entryTime?: string;
  exitTime?: string;
  duration?: number;
  session?: string;
  
  // Performance Metrics
  tpPercent?: number;
  slPercent?: number;
  maePercent?: number;
  mfePercent?: number;
  
  // Technical Indicators
  rsi?: number;
  stoch?: number;
  hasHammer?: boolean;
  hasDoji?: boolean;
  hasMarubozu?: boolean;
  ema45Proximity: number; // % distance to EMA45
  isEngulfingExit: boolean;
  
  // Risk Management
  riskAmount: number; // in currency or %
  pnl: number; // in currency
  pnlPercentage: number;
  status: TradeStatus;
  
  // Emotional Tagging & AI
  emotion: 'fomo' | 'revenge' | 'calm' | 'greedy' | 'fearful';
  notes: string;
  tags: string[];
  aiAudit?: string;
}

export interface TradingStats {
  winRate: number;
  profitFactor: number;
  totalTrades: number;
  netProfit: number;
  maxDrawdown: number;
  avgR: number;
}
