import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Percent, Activity } from 'lucide-react';
import { TradingStats } from '../../types';
import { motion } from 'motion/react';

interface MetricsHeaderProps {
  stats: TradingStats;
}

export const MetricsHeader: React.FC<MetricsHeaderProps> = ({ stats }) => {
  const metrics = [
    { 
      label: 'Win Rate', 
      value: `${(stats.winRate * 100).toFixed(1)}%`, 
      icon: Activity, 
      color: 'text-primary',
      sub: `${stats.totalTrades} Total Trades`
    },
    { 
      label: 'Net P&L', 
      value: `${stats.netProfit > 0 ? '+' : ''}${stats.netProfit.toFixed(2)}%`, 
      icon: TrendingUp, 
      color: stats.netProfit >= 0 ? 'text-success' : 'text-destructive',
      sub: 'Cumulative Return'
    },
    { 
      label: 'Profit Factor', 
      value: stats.profitFactor.toFixed(2), 
      icon: Percent, 
      color: stats.profitFactor >= 1.5 ? 'text-success' : 'text-destructive',
      sub: 'Gross Win / Gross Loss'
    },
    { 
      label: 'Max Drawdown', 
      value: `${stats.maxDrawdown.toFixed(2)}%`, 
      icon: TrendingDown, 
      color: 'text-destructive',
      sub: 'Peak-to-Valley'
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
      {metrics.map((m, i) => (
        <motion.div
          key={m.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <Card className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <CardContent className="p-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">{m.label}</p>
                  <div className="flex items-baseline gap-2">
                    <h3 className={cn("text-2xl font-black font-mono tracking-tighter", m.color || "text-foreground")}>
                      {m.value}
                    </h3>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2 font-mono font-bold">{m.sub}</p>
                </div>
                <div className={cn("p-2 rounded-lg bg-muted border border-border shadow-inner", m.color)}>
                  <m.icon className="h-4 w-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
