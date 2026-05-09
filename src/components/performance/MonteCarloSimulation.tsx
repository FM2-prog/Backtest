import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Trade } from '../../types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

interface MonteCarloSimulationProps {
  trades: Trade[];
}

interface SimulationStats {
  avgFinalBalance: number;
  medianFinalBalance: number;
  maxFinalBalance: number;
  avgMaxDrawdown: number;
  worstDrawdown: number;
  maxWinStreak: number;
  maxLossStreak: number;
  avgRR: number;
}

export const MonteCarloSimulation: React.FC<MonteCarloSimulationProps> = ({ trades }) => {
  const defaultParams = useMemo(() => {
    let winCount = 0;
    let lossCount = 0;
    let totalWinPnl = 0;
    let totalLossPnl = 0;

    trades.forEach(t => {
      if (t.pnl > 0) {
        winCount++;
        totalWinPnl += t.pnl;
      } else if (t.pnl < 0) {
        lossCount++;
        totalLossPnl += Math.abs(t.pnl);
      }
    });

    const total = winCount + lossCount;
    const wr = total > 0 ? (winCount / total) * 100 : 50;
    const aw = winCount > 0 ? totalWinPnl / winCount : 100;
    const al = lossCount > 0 ? totalLossPnl / lossCount : 50;

    return {
      simulations: 50,
      tradesPerSim: 100,
      startBalance: 50000,
      winRate: Number(wr.toFixed(2)),
      avgGain: Number(aw.toFixed(2)),
      avgLoss: Number(al.toFixed(2)),
    };
  }, [trades]);

  const [simulationsCount, setSimulationsCount] = useState(defaultParams.simulations.toString());
  const [tradesPerSim, setTradesPerSim] = useState(defaultParams.tradesPerSim.toString());
  const [startBalance, setStartBalance] = useState(defaultParams.startBalance.toString());
  const [winRate, setWinRate] = useState(defaultParams.winRate.toString());
  const [avgGain, setAvgGain] = useState(defaultParams.avgGain.toString());
  const [avgLoss, setAvgLoss] = useState(defaultParams.avgLoss.toString());

  const [chartData, setChartData] = useState<any[]>([]);
  const [stats, setStats] = useState<SimulationStats | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const handleReset = () => {
    setSimulationsCount(defaultParams.simulations.toString());
    setTradesPerSim(defaultParams.tradesPerSim.toString());
    setStartBalance(defaultParams.startBalance.toString());
    setWinRate(defaultParams.winRate.toString());
    setAvgGain(defaultParams.avgGain.toString());
    setAvgLoss(defaultParams.avgLoss.toString());
  };

  const runSimulation = useCallback(() => {
    setIsSimulating(true);

    const numSims = parseInt(simulationsCount) || 50;
    const numTrades = parseInt(tradesPerSim) || 100;
    const initialBal = parseFloat(startBalance) || 50000;
    const wr = (parseFloat(winRate) || 50) / 100;
    const gain = parseFloat(avgGain) || 100;
    const loss = parseFloat(avgLoss) || 50;

    // Use setTimeout to avoid blocking the main thread immediately
    setTimeout(() => {
      let globalMaxFinal = 0;
      let finalBalances: number[] = [];
      let maxDrawdowns: number[] = [];
      let globalMaxWinStreak = 0;
      let globalMaxLossStreak = 0;

      const newChartData: any[] = [];

      for (let t = 0; t <= numTrades; t++) {
        newChartData.push({ trade: t });
      }

      for (let s = 1; s <= numSims; s++) {
        let currentBalance = initialBal;
        let peakBalance = initialBal;
        let maxDd = 0;
        let currentWinStreak = 0;
        let currentLossStreak = 0;
        let maxWinS = 0;
        let maxLossS = 0;

        newChartData[0][`sim${s}`] = currentBalance;

        for (let t = 1; t <= numTrades; t++) {
          const isWin = Math.random() < wr;
          
          if (isWin) {
            currentBalance += gain;
            currentWinStreak++;
            currentLossStreak = 0;
            if (currentWinStreak > maxWinS) maxWinS = currentWinStreak;
          } else {
            currentBalance -= loss;
            currentLossStreak++;
            currentWinStreak = 0;
            if (currentLossStreak > maxLossS) maxLossS = currentLossStreak;
          }

          if (currentBalance > peakBalance) {
            peakBalance = currentBalance;
          }

          const dd = (peakBalance - currentBalance) / peakBalance * 100; // Drawdown percentage
          if (dd > maxDd) {
            maxDd = dd;
          }

          newChartData[t][`sim${s}`] = currentBalance;
        }

        finalBalances.push(currentBalance);
        if (currentBalance > globalMaxFinal) globalMaxFinal = currentBalance;
        maxDrawdowns.push(maxDd);
        if (maxWinS > globalMaxWinStreak) globalMaxWinStreak = maxWinS;
        if (maxLossS > globalMaxLossStreak) globalMaxLossStreak = maxLossS;
      }

      finalBalances.sort((a, b) => a - b);
      const medianFinal = finalBalances.length % 2 === 0 
        ? (finalBalances[finalBalances.length / 2 - 1] + finalBalances[finalBalances.length / 2]) / 2
        : finalBalances[Math.floor(finalBalances.length / 2)];
      
      const avgFinal = finalBalances.reduce((a, b) => a + b, 0) / finalBalances.length;
      const avgDd = maxDrawdowns.reduce((a, b) => a + b, 0) / maxDrawdowns.length;
      const worstDd = Math.max(...maxDrawdowns);
      
      setChartData(newChartData);
      setStats({
        avgFinalBalance: avgFinal,
        medianFinalBalance: medianFinal,
        maxFinalBalance: globalMaxFinal,
        avgMaxDrawdown: avgDd,
        worstDrawdown: worstDd,
        maxWinStreak: globalMaxWinStreak,
        maxLossStreak: globalMaxLossStreak,
        avgRR: loss > 0 ? gain / loss : gain,
      });

      setIsSimulating(false);
    }, 10);
  }, [simulationsCount, tradesPerSim, startBalance, winRate, avgGain, avgLoss]);

  useEffect(() => {
    const timer = setTimeout(() => {
      runSimulation();
    }, 300);
    return () => clearTimeout(timer);
  }, [runSimulation]);

  return (
    <Card className="bg-card border-border shadow-sm overflow-hidden mb-8">
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border">
        <CardTitle className="text-sm uppercase font-black text-foreground tracking-widest">
          Monte Carlo Simulation
        </CardTitle>
        <Button 
          variant="destructive" 
          onClick={handleReset}
          className="bg-red-500 hover:bg-red-600 text-white font-black text-[10px] uppercase tracking-wider h-8 rounded-sm"
        >
          Reset Values
        </Button>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-6 mb-8">
          <div className="space-y-1">
            <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">No. Simulations</Label>
            <Input type="number" value={simulationsCount} onChange={e => setSimulationsCount(e.target.value)} className="bg-input border-border h-9 font-mono text-xs text-primary font-black focus-visible:ring-1 focus-visible:ring-slate-700" />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Trades per Sim</Label>
            <Input type="number" value={tradesPerSim} onChange={e => setTradesPerSim(e.target.value)} className="bg-input border-border h-9 font-mono text-xs text-primary font-black focus-visible:ring-1 focus-visible:ring-slate-700" />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Start Balance $</Label>
            <Input type="number" value={startBalance} onChange={e => setStartBalance(e.target.value)} className="bg-input border-border h-9 font-mono text-xs text-primary font-black focus-visible:ring-1 focus-visible:ring-slate-700" />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Win Rate %</Label>
            <Input type="number" step="0.1" value={winRate} onChange={e => setWinRate(e.target.value)} className="bg-input border-border h-9 font-mono text-xs text-primary font-black focus-visible:ring-1 focus-visible:ring-slate-700" />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Avg Gain $</Label>
            <Input type="number" step="0.1" value={avgGain} onChange={e => setAvgGain(e.target.value)} className="bg-input border-border h-9 font-mono text-xs text-primary font-black focus-visible:ring-1 focus-visible:ring-slate-700" />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Avg Loss $</Label>
            <Input type="number" step="0.1" value={avgLoss} onChange={e => setAvgLoss(e.target.value)} className="bg-input border-border h-9 font-mono text-xs text-primary font-black focus-visible:ring-1 focus-visible:ring-slate-700" />
          </div>
        </div>

        <div className="h-[400px] w-full mb-8 relative">
          {isSimulating && (
            <div className="absolute inset-0 bg-background/50 z-10 flex items-center justify-center">
              <span className="text-sm font-black uppercase text-muted-foreground">Simulating...</span>
            </div>
          )}
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis 
                dataKey="trade" 
                stroke="var(--foreground)" 
                fontSize={10} 
                tickMargin={10}
                tick={{ fill: 'var(--foreground)' }}
                tickFormatter={(val) => `T${val}`}
              />
              <YAxis 
                stroke="var(--foreground)" 
                fontSize={10} 
                tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                domain={['auto', 'auto']}
                tick={{ fill: 'var(--foreground)' }}
              />
              <ReferenceLine y={parseFloat(startBalance)} stroke="var(--foreground)" strokeDasharray="3 3" />
              {chartData.length > 0 && Array.from({ length: parseInt(simulationsCount) || 50 }).map((_, i) => (
                <Line 
                  key={i}
                  type="monotone" 
                  dataKey={`sim${i + 1}`} 
                  stroke={`hsl(${(i * 137.5) % 360}, 70%, 50%)`} 
                  strokeWidth={1.5} 
                  dot={false}
                  activeDot={false}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-6">
            <MetricCard label="Trades / Sim" value={tradesPerSim} isCurrency={false} />
            <MetricCard label="Avg Final Balance" value={stats.avgFinalBalance} />
            <MetricCard label="Median Final Balance" value={stats.medianFinalBalance} />
            <MetricCard label="Max Final Balance" value={stats.maxFinalBalance} />
            
            <MetricCard label="Avg Max Drawdown" value={stats.avgMaxDrawdown} isCurrency={false} suffix="%" isLoss />
            <MetricCard label="Worst Drawdown" value={stats.worstDrawdown} isCurrency={false} suffix="%" isLoss />
            <div className="grid grid-cols-2 gap-4 h-full items-stretch">
              <MetricCard className="h-full" label="Max Win Streak" value={stats.maxWinStreak} isCurrency={false} isProfit />
              <MetricCard className="h-full" label="Max Loss Streak" value={stats.maxLossStreak} isCurrency={false} isLoss />
            </div>
            <MetricCard label="Avg. R:R" value={stats.avgRR} isCurrency={false} prefix="1:" />
          </div>
        )}

      </CardContent>
    </Card>
  );
};

const MetricCard: React.FC<{ 
  label: string, 
  value: number | string, 
  isCurrency?: boolean,
  isProfit?: boolean,
  isLoss?: boolean,
  prefix?: string,
  suffix?: string,
  className?: string,
}> = ({ label, value, isCurrency = true, isProfit, isLoss, prefix = '', suffix = '', className = '' }) => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  let colorClass = "text-foreground";
  if (isProfit) colorClass = "text-success";
  if (isLoss) colorClass = "text-destructive";
  
  if (isCurrency && !isProfit && !isLoss) {
    if (numValue > 0) colorClass = "text-success";
    else if (numValue < 0) colorClass = "text-destructive";
  }

  const displayValue = isCurrency 
    ? `$${numValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : typeof value === 'number' ? value.toFixed(2).replace(/\.00$/, '') : value;

  return (
    <div className={`bg-card border border-border rounded-lg p-4 flex flex-col justify-center ${className}`}>
      <span className="text-[10px] uppercase font-black text-muted-foreground tracking-widest mb-1">{label}</span>
      <span className={`font-mono text-xl font-black ${colorClass}`}>
        {prefix}{displayValue}{suffix}
      </span>
    </div>
  );
}
