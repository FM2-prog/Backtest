import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Trade } from '../../types';
import { Activity } from 'lucide-react';
import { useBacktest } from '../../context/BacktestContext';

interface EquityChartProps {
  trades: Trade[];
}

export const EquityChart: React.FC<EquityChartProps> = ({ trades }) => {
  const { strategies, activeStrategyId } = useBacktest();
  const [metricMode, setMetricMode] = useState<'$' | '%'>('$');

  const initialBalance = useMemo(() => {
    if (activeStrategyId && activeStrategyId !== 'all') {
      const s = strategies.find(strat => strat.id === activeStrategyId);
      return s ? s.initialBalance : 0;
    }
    return strategies.reduce((sum, start) => sum + start.initialBalance, 0);
  }, [strategies, activeStrategyId]);

  const data = useMemo(() => {
    let currentPct = 0;
    let currentDollar = initialBalance;
    const points = [{ index: 0, balancePct: 0, balanceDollar: initialBalance }];
    trades.forEach((trade, i) => {
      currentPct += trade.pnlPercentage;
      currentDollar += trade.pnl; // ensure Trade has pnl? It does.
      points.push({
        index: i + 1,
        balancePct: currentPct,
        balanceDollar: currentDollar
      });
    });
    return points;
  }, [trades, initialBalance]);

  return (
    <Card className="bg-card border border-border rounded-xl overflow-hidden shadow-sm h-full flex flex-col">
      <CardHeader className="p-4 border-b border-border flex flex-row items-center justify-between bg-muted/30 shrink-0">
        <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
          <Activity className="h-3 w-3 text-primary" />
          Equity Curve (Cumulative)
        </CardTitle>
        <div className="flex items-center gap-4">
          <div className="flex bg-muted rounded p-0.5 border border-border">
            <button
              onClick={() => setMetricMode('$')}
              className={`px-3 py-0.5 text-[10px] font-black rounded-sm transition-colors ${metricMode === '$' ? 'bg-primary text-slate-950' : 'text-slate-400 hover:text-slate-300'}`}
            >
              $
            </button>
            <button
              onClick={() => setMetricMode('%')}
              className={`px-3 py-0.5 text-[10px] font-black rounded-sm transition-colors ${metricMode === '%' ? 'bg-primary text-slate-950' : 'text-slate-400 hover:text-slate-300'}`}
            >
              %
            </button>
          </div>
          <span className="text-[10px] text-primary font-mono font-black tracking-tighter uppercase">ENGINE: AX-CORE_7</span>
        </div>
      </CardHeader>
      <CardContent className="p-2 mt-4 flex-1 min-h-[300px]">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
              <defs>
                <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="var(--background)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis 
                dataKey="index" 
                stroke="var(--foreground)" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                style={{ fontWeight: 700, opacity: 0.5 }}
              />
              <YAxis 
                stroke="var(--foreground)" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(v) => metricMode === '$' ? `$${v.toLocaleString()}` : `${v.toFixed(1)}%`}
                domain={['dataMin', 'dataMax']}
                padding={{ top: 20, bottom: 20 }}
                style={{ fontWeight: 700, opacity: 0.5, fontFamily: 'monospace' }}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--foreground)' }}
                itemStyle={{ color: 'var(--foreground)', fontSize: '12px', fontWeight: 900, fontFamily: 'monospace' }}
                labelStyle={{ color: 'var(--muted-foreground)', fontSize: '10px', marginBottom: '4px', fontWeight: 700 }}
                formatter={(value: number, name: string, item: any) => {
                  return [ 
                    `$${item.payload.balanceDollar.toLocaleString()} / ${item.payload.balancePct.toFixed(2)}%`, 
                    'Equity' 
                  ]
                }}
              />
              <ReferenceLine y={metricMode === '$' ? initialBalance : 0} stroke="var(--destructive)" strokeDasharray="3 3" opacity={0.3} />
              <Area 
                type="monotone" 
                dataKey={metricMode === '$' ? "balanceDollar" : "balancePct"} 
                stroke="var(--primary)" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorEquity)"
                dot={false}
                activeDot={{ r: 6, strokeWidth: 0, fill: 'var(--primary)' }}
                animationDuration={1000}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-xs font-black uppercase tracking-widest italic">
            Esperando datos de operaciones...
          </div>
        )}
      </CardContent>
    </Card>
  );
};
