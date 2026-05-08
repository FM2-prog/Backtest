
export interface PerformanceMetrics {
  drawdown_current: number;
  consistency_score: number;
  win_rate: number;
  expectancy: number;
  profit_target: number;
  current_profit: number;
  equity_data: { day: string; equity: number; drawdown: number }[];
  rr_data: { name: string; value: number; type: string }[];
}

export const STRATEGY_PERFORMANCE_DATA: Record<string, PerformanceMetrics> = {
  // We'll use the IDs generated in the app. For demo purposes, I'll map them or provide fallbacks.
  "default": {
    drawdown_current: -0.76,
    consistency_score: 85.2,
    win_rate: 68.4,
    expectancy: 412,
    profit_target: 30000,
    current_profit: 28200,
    equity_data: [
      { day: 'Day 1', equity: 25000, drawdown: 0 },
      { day: 'Day 2', equity: 25200, drawdown: 0 },
      { day: 'Day 3', equity: 24800, drawdown: -0.8 },
      { day: 'Day 4', equity: 24700, drawdown: -1.2 },
      { day: 'Day 5', equity: 25100, drawdown: 0 },
      { day: 'Day 10', equity: 26000, drawdown: -0.76 },
      { day: 'Day 15', equity: 28200, drawdown: 0 },
    ],
    rr_data: [
      { name: 'Planned', value: 1.5, type: 'theoretical' },
      { name: 'Executed', value: 1.28, type: 'actual' },
    ]
  },
  "high_risk": {
    drawdown_current: -4.8,
    consistency_score: 40.5,
    win_rate: 41.0,
    expectancy: -45,
    profit_target: 30000,
    current_profit: 24500,
    equity_data: [
      { day: 'Day 1', equity: 25000, drawdown: 0 },
      { day: 'Day 2', equity: 26500, drawdown: 0 },
      { day: 'Day 3', equity: 23500, drawdown: -6.0 },
      { day: 'Day 4', equity: 24000, drawdown: -4.0 },
      { day: 'Day 5', equity: 24500, drawdown: -2.0 },
    ],
    rr_data: [
      { name: 'Planned', value: 3.0, type: 'theoretical' },
      { name: 'Executed', value: 1.1, type: 'actual' },
    ]
  }
};
