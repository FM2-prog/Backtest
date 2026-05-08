import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Strategy, Trade } from '../types';

interface BacktestContextType {
  strategies: Strategy[];
  trades: Trade[];
  activeStrategyId: string | null;
  addStrategy: (strategy: Strategy) => void;
  updateStrategy: (strategy: Strategy) => void;
  deleteStrategy: (id: string) => void;
  addTrade: (trade: Trade) => void;
  setActiveStrategyId: (id: string | null) => void;
}

const BacktestContext = createContext<BacktestContextType | undefined>(undefined);

export const BacktestProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [activeStrategyId, setActiveStrategyId] = useState<string | null>(null);

  // Persistence: Load from LocalStorage
  useEffect(() => {
    const savedStrategies = localStorage.getItem('bt_strategies');
    const savedTrades = localStorage.getItem('bt_trades');
    const savedActiveId = localStorage.getItem('bt_active_id');

    if (savedStrategies) {
      setStrategies(JSON.parse(savedStrategies));
    } else {
      // Initial Demo Data
      setStrategies([
        {
          id: 'rev-01',
          name: 'Hammer Reversion Pro',
          initialBalance: 25000,
          rules: { entry: 'Hammer Close', exit: 'EMA 45 Touch or 0.7% SL' },
          isPropFirm: true,
          propConfig: {
            firmName: 'FTMO',
            accountType: '25k Challenge',
            rules: 'Max Daily: 5% | Max Overall: 10%'
          }
        },
        {
          id: 'trend-foll-02',
          name: 'Trend Continuity',
          initialBalance: 10000,
          rules: { entry: 'EMA 20/50 Cross + Bullish Engulfing', exit: 'Opposite Cross' },
          isPropFirm: false
        }
      ]);
    }

    if (savedTrades) {
      setTrades(JSON.parse(savedTrades));
    } else {
      // Initial Demo Trades
      setTrades([
        {
          id: 'trade-1',
          strategyId: 'rev-01',
          timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
          pair: 'BTCUSD',
          side: 'long',
          entryPrice: 62000,
          exitPrice: 63500,
          stopLoss: 61500,
          takeProfit: 65000,
          ema45Proximity: 0.1,
          rsi: 28,
          hasHammer: true,
          isEngulfingExit: false,
          riskAmount: 100,
          pnl: 1499.50,
          pnlPercentage: 2.41,
          status: 'win',
          emotion: 'calm',
          notes: 'Executed per rules at EMA support.',
          tags: ['Calm'],
          aiAudit: 'Perfect execution, discipline maintained'
        }
      ]);
    }

    if (savedActiveId) setActiveStrategyId(savedActiveId);
  }, []);

  // Persistence: Save to LocalStorage
  useEffect(() => {
    localStorage.setItem('bt_strategies', JSON.stringify(strategies));
  }, [strategies]);

  useEffect(() => {
    localStorage.setItem('bt_trades', JSON.stringify(trades));
  }, [trades]);

  useEffect(() => {
    if (activeStrategyId) {
      localStorage.setItem('bt_active_id', activeStrategyId);
    } else {
      localStorage.removeItem('bt_active_id');
    }
  }, [activeStrategyId]);

  const addStrategy = (strategy: Strategy) => {
    setStrategies(prev => [strategy, ...prev]);
  };

  const updateStrategy = (updated: Strategy) => {
    setStrategies(prev => prev.map(s => s.id === updated.id ? updated : s));
  };

  const deleteStrategy = (id: string) => {
    setStrategies(prev => prev.filter(s => s.id !== id));
    // also delete its trades
    setTrades(prev => prev.filter(t => t.strategyId !== id));
  };

  const addTrade = (trade: Trade) => {
    setTrades(prev => [trade, ...prev]);
  };

  return (
    <BacktestContext.Provider value={{
      strategies,
      trades,
      activeStrategyId,
      addStrategy,
      updateStrategy,
      deleteStrategy,
      addTrade,
      setActiveStrategyId
    }}>
      {children}
    </BacktestContext.Provider>
  );
};

export const useBacktest = () => {
  const context = useContext(BacktestContext);
  if (!context) throw new Error('useBacktest must be used within a BacktestProvider');
  return context;
};
