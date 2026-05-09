import React, { useState, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  Cell
} from 'recharts';
import { 
  ArrowLeft, 
  Activity, 
  TrendingUp, 
  AlertTriangle, 
  Target, 
  Zap,
  Shield,
  Clock,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Strategy, Trade } from '../../types';
import { useBacktest } from '../../context/BacktestContext';

import { DeepAnalytics } from './DeepAnalytics';
import { TemporalAnalytics } from './TemporalAnalytics';

interface PerformanceDashboardProps {
  strategy: Strategy;
  onBack: () => void;
}

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({ strategy, onBack }) => {
  const { trades } = useBacktest();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [strategy.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-[10px] uppercase font-black text-muted-foreground tracking-[0.3em] animate-pulse">
          Decrypting Node: {strategy.name}
        </p>
      </div>
    );
  }

  const strategyTrades = trades.filter(t => t.strategyId === strategy.id);

  if (strategyTrades.length === 0) {
    return (
      <div className="min-h-screen bg-background p-6 pb-24 overflow-y-auto">
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-10">
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="text-muted-foreground hover:text-foreground hover:bg-muted/50 w-fit h-9 px-3 -ml-3"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Strategy Repo
          </Button>
        </div>
        <div className="flex flex-col items-center justify-center space-y-6 mt-20">
          <AlertTriangle className="h-16 w-16 text-muted-foreground/50" />
          <h2 className="text-xl font-bold text-foreground tracking-tight">No Trade Data Available</h2>
          <p className="text-[10px] uppercase font-black text-muted-foreground tracking-[0.2em] max-w-sm text-center leading-relaxed">
            No hay suficientes datos para calcular el rendimiento. Registra operaciones en la terminal para {strategy.name}.
          </p>
          <Button onClick={onBack} variant="outline" className="mt-4 border-border hover:bg-muted/50 font-black uppercase text-[10px] tracking-widest">
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // --- Dynamic Calculations ---
  let runningEquity = strategy.initialBalance || 25000;
  let peakEquity = runningEquity;
  
  const equityData: any[] = [];
  equityData.push({ day: 0, drawdown: 0, equity: runningEquity, pnl: 0 });

  let wins = 0;
  let losses = 0;
  let grossProfit = 0;
  let grossLoss = 0;
  
  const sortedTrades = [...strategyTrades].sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  sortedTrades.forEach((t, i) => {
    runningEquity += t.pnl;
    if (runningEquity > peakEquity) peakEquity = runningEquity;
    
    let drawdown = 0;
    if (runningEquity < peakEquity) {
      drawdown = ((runningEquity - peakEquity) / peakEquity) * 100;
    }

    equityData.push({
      day: i + 1,
      drawdown: parseFloat(drawdown.toFixed(2)),
      equity: runningEquity,
      pnl: t.pnl
    });

    if (t.pnl > 0) {
      wins++;
      grossProfit += t.pnl;
    } else if (t.pnl < 0) {
      losses++;
      grossLoss += Math.abs(t.pnl);
    }
  });

  const currentEquity = runningEquity;
  const currentDrawdown = equityData[equityData.length - 1].drawdown;

  const avgWin = wins > 0 ? grossProfit / wins : 0;
  const avgLoss = losses > 0 ? grossLoss / losses : 1; 
  const realRR = avgLoss > 0 ? avgWin / avgLoss : avgWin;
  
  const theoreticalTP = sortedTrades.length > 0 ? (sortedTrades.reduce((acc, t) => acc + (t.takeProfit ? Math.abs(t.takeProfit - t.entryPrice) : 0), 0) / sortedTrades.length) : 0;
  const theoreticalSL = sortedTrades.length > 0 ? (sortedTrades.reduce((acc, t) => acc + (t.stopLoss ? Math.abs(t.entryPrice - t.stopLoss) : 0), 0) / sortedTrades.length) : 0;
  const plannedRR = theoreticalSL > 0 ? theoreticalTP / theoreticalSL : 1.5;
  const safePlannedRR = isNaN(plannedRR) || plannedRR === 0 ? 1.5 : plannedRR;

  const rrData = [
    { name: 'Planned', type: 'theoretical', value: parseFloat(safePlannedRR.toFixed(2)) },
    { name: 'Actual', type: 'actual', value: parseFloat(realRR.toFixed(2)) }
  ];

  const rrDeviation = Math.abs((realRR - safePlannedRR) / safePlannedRR);
  const isRRDeviationHigh = rrDeviation > 0.1;

  const winRate = (wins / sortedTrades.length) * 100;
  const lossRate = (losses / sortedTrades.length) * 100;

  const expectancy = (avgWin * (winRate / 100)) - (avgLoss * (lossRate / 100));

  let maxWin = 0;
  sortedTrades.forEach(t => { if (t.pnl > maxWin) maxWin = t.pnl; });
  const maxWinRatio = grossProfit > 0 ? (maxWin / grossProfit) : 1;
  const consistencyScore = Math.max(0, Math.floor(100 - (maxWinRatio * 50)));

  const profitTarget = (strategy.initialBalance || 25000) * 0.1;
  const currentProfit = currentEquity - (strategy.initialBalance || 25000);
  const progressValue = Math.max(0, Math.min(100, (currentProfit / profitTarget) * 100));
  const maxAllowedDrawdown = strategy.propConfig?.rules?.includes('10%') ? -10 : -5;
  


  return (
    <div className="min-h-screen bg-background text-foreground p-6 pb-24 overflow-y-auto">
      {/* Navigation & Header */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10"
      >
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="text-muted-foreground hover:text-foreground hover:bg-muted/50 w-fit h-9 px-3 -ml-3"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Strategy Repo
          </Button>
          <div className="hidden md:block h-6 w-[1px] bg-border" />
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3 text-foreground">
              {strategy.name}
              <Badge variant="outline" className="border-primary/30 text-primary text-[8px] font-black uppercase tracking-widest px-2 h-4">
                NODE_ACTIVE
              </Badge>
            </h2>
            <p className="text-[10px] uppercase font-black text-muted-foreground tracking-[0.2em] mt-1">
              Systematic Performance & Risk Monitoring
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button size="icon" variant="outline" className="border-border hover:bg-muted/50">
            <ExternalLink className="h-4 w-4 text-foreground" />
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* SECTION 1: PROP FIRM HEALTH */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded border border-primary/20">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">Section 01: Prop Firm Health</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Underwater Drawdown */}
            <Card className="bg-card border-border shadow-sm relative overflow-hidden group">
              <CardHeader className="pb-2">
                <CardTitle className="text-[10px] uppercase font-black text-muted-foreground tracking-widest flex items-center justify-between">
                  Underwater Drawdown (%)
                  <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20 text-[9px] font-mono h-5">
                    CURR: {currentDrawdown.toFixed(2)}%
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[200px] pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={equityData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="drawdownGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--destructive)" stopOpacity={0.05}/>
                        <stop offset="100%" stopColor="var(--destructive)" stopOpacity={0.3}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="day" hide />
                    <YAxis 
                      domain={[maxAllowedDrawdown - 2, 0]} 
                      stroke="var(--muted-foreground)" 
                      fontSize={10} 
                      fontFamily="monospace"
                      tickFormatter={(val) => `${val}%`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                      itemStyle={{ color: 'var(--destructive)', fontSize: '10px', fontFamily: 'monospace' }}
                      labelStyle={{ color: 'var(--muted-foreground)', fontSize: '10px', marginBottom: '4px' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="drawdown" 
                      stroke="var(--destructive)" 
                      fillOpacity={1} 
                      fill="url(#drawdownGradient)" 
                      strokeWidth={2}
                      animationDuration={2000}
                    />
                    <ReferenceLine 
                      y={maxAllowedDrawdown} 
                      stroke="var(--destructive)" 
                      strokeDasharray="5 5" 
                      label={{ 
                        position: 'insideBottomRight', 
                        value: 'MAX REJECT THRESHOLD', 
                        fill: 'var(--destructive)', 
                        fontSize: 9, 
                        fontFamily: 'monospace',
                        fontWeight: 'bold' 
                      }} 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Consistency Score Gauge */}
            <Card className="bg-card border-border shadow-sm flex flex-col pt-2">
              <CardHeader className="pb-0">
                <CardTitle className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">
                  Consistency Score
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col items-center justify-center pt-0">
                <div className="relative w-40 h-50 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="80"
                      cy="80"
                      r="65"
                      stroke="currentColor"
                      strokeWidth="10"
                      fill="transparent"
                      className="text-white/5"
                    />
                    <circle
                      cx="80"
                      cy="80"
                      r="65"
                      stroke="currentColor"
                      strokeWidth="10"
                      fill="transparent"
                      strokeDasharray={408}
                      strokeDashoffset={408 - (408 * consistencyScore) / 100}
                      strokeLinecap="round"
                      className="text-primary"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-black font-mono tracking-tighter text-foreground">{consistencyScore}</span>
                    <span className="text-[9px] uppercase font-black text-muted-foreground tracking-widest mt-1">Optimal Stability</span>
                  </div>
                </div>
                <div className="mt-2 text-center px-4">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-success/10 rounded-full border border-success/20 mb-2">
                    <TrendingUp className="h-3 w-3 text-success" />
                    <span className="text-[9px] font-black uppercase text-success">Equity Linear Distribution</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Equity Curve */}
          <Card className="bg-card border-border shadow-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none">
              <TrendingUp className="h-64 w-64" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">
                Account Growth (Equity Curve)
              </CardTitle>
              <div className="text-right">
                <p className="text-3xl font-black font-mono text-foreground tracking-tighter">${currentEquity.toLocaleString()}</p>
                <div className="flex items-center justify-end gap-2 mt-1">
                  <Badge className={`${currentEquity >= (strategy.initialBalance||25000) ? 'bg-success/10 text-success border-success/20' : 'bg-destructive/10 text-destructive border-destructive/20'} text-[9px] font-black`}>
                    PROFIT: {(((currentEquity - (strategy.initialBalance||25000)) / (strategy.initialBalance||25000)) * 100).toFixed(1)}%
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="h-[300px] pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={equityData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="day" hide />
                  <YAxis 
                    domain={['dataMin - 1000', 'dataMax + 1000']} 
                    stroke="var(--muted-foreground)" 
                    fontSize={10} 
                    fontFamily="monospace"
                    tickFormatter={(val) => `$${val/1000}k`}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                    itemStyle={{ color: 'var(--primary)', fontSize: '10px', fontFamily: 'monospace' }}
                    labelStyle={{ color: 'var(--muted-foreground)', fontSize: '10px', marginBottom: '4px' }}
                    formatter={(val: number) => [`$${val.toLocaleString()}`, 'Balance']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="equity" 
                    stroke="var(--primary)" 
                    strokeWidth={4} 
                    dot={{ fill: 'var(--primary)', r: 0 }}
                    activeDot={{ r: 6, fill: 'var(--card)', stroke: 'var(--primary)', strokeWidth: 2 }}
                    animationDuration={1500}
                  />
                  <ReferenceLine y={strategy.initialBalance||25000} stroke="var(--muted-foreground)" strokeDasharray="3 3" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* SECTION 2: EXECUTION & STRATEGY */}
        <div className="lg:col-span-4 space-y-6">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-success/10 rounded border border-success/20">
              <Activity className="h-4 w-4 text-success" />
            </div>
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">Section 02: Execution Meta</h3>
          </div>

          {/* Real vs Theoretical R/R */}
          <Card className="bg-card border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] uppercase font-black text-muted-foreground tracking-widest flex items-center justify-between">
                R/R Efficiency Analysis
                {isRRDeviationHigh && (
                  <Badge variant="destructive" className="animate-pulse bg-destructive/20 text-destructive border-destructive/30 text-[8px] font-black tracking-tighter">
                    HIGH DRIFT
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[200px] pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rrData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                  <XAxis type="number" domain={[0, 3]} hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    stroke="var(--muted-foreground)" 
                    fontSize={9} 
                    width={70}
                    fontFamily="monospace"
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    cursor={{ fill: 'var(--muted)' }}
                    contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
                    itemStyle={{ fontSize: '10px', fontFamily: 'monospace', color: 'var(--foreground)' }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={30}>
                    {rrData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.type === 'actual' && isRRDeviationHigh ? 'var(--destructive)' : (entry.type === 'actual' ? 'var(--primary)' : 'var(--muted-foreground)')} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 p-3 bg-muted/50 rounded-lg border border-border flex items-start gap-3">
                <AlertTriangle className={`h-4 w-4 mt-0.5 ${isRRDeviationHigh ? 'text-destructive' : 'text-muted-foreground'}`} />
                <div>
                  <p className="text-[10px] font-bold text-foreground tracking-widest uppercase">Variance Report</p>
                  <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed italic">
                    {isRRDeviationHigh 
                      ? "Deviation > 10% detected. Slippage or early manual exits are eroding theoretical edge."
                      : "Execution alignment within acceptable tolerance thresholds."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Win Rate & Expectancy Panel */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-card border-border p-5 flex flex-col justify-center relative overflow-hidden group shadow-sm">
              <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:scale-110 transition-transform">
                <Target className="h-16 w-16 text-foreground" />
              </div>
              <p className="text-[9px] uppercase font-black text-muted-foreground mb-1.5 tracking-widest">Win Rate</p>
              <h4 className="text-3xl font-black font-mono tracking-tighter text-foreground">{winRate.toFixed(1)}%</h4>
              <div className="mt-3 h-1 bg-muted rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${winRate}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="h-full bg-success" 
                />
              </div>
            </Card>
            <Card className="bg-card border-primary/20 border-l-4 p-5 flex flex-col justify-center relative group shadow-sm">
              <div className="absolute right-3 top-3">
                <Zap className="h-3 w-3 text-primary opacity-30" />
              </div>
              <p className="text-[9px] uppercase font-black text-muted-foreground mb-1.5 tracking-widest">Expectancy</p>
              <h4 className={`text-3xl font-black font-mono tracking-tighter ${expectancy >= 0 ? 'text-primary' : 'text-destructive'}`}>${expectancy.toFixed(2)}</h4>
              <p className="text-[9px] text-muted-foreground/70 mt-1 font-medium italic">Net / Round Trip Trade</p>
            </Card>
          </div>

          {/* Account Objectives */}
          <Card className="bg-card border-border shadow-sm relative overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="text-[10px] uppercase font-black text-muted-foreground tracking-widest flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Account Progression
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-end text-[10px] uppercase font-black">
                  <span className="text-muted-foreground tracking-widest">Profit Target (${profitTarget.toLocaleString()})</span>
                  <span className="text-primary font-mono text-xs">{progressValue.toFixed(1)}%</span>
                </div>
                <Progress value={progressValue} className="h-1.5 bg-muted" />
              </div>
              
              <div className="space-y-3 opacity-60">
                <div className="flex justify-between items-end text-[10px] uppercase font-black">
                  <span className="text-muted-foreground tracking-widest">Min Trading Days (10/10)</span>
                  <span className="text-success font-mono text-xs">READY</span>
                </div>
                <Progress value={100} className="h-1.5 bg-muted" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* SECTION 3: DEEP ANALYTICS */}
        <div className="lg:col-span-12">
          <DeepAnalytics trades={strategyTrades} />
        </div>

        {/* SECTION 4: TEMPORAL ANALYTICS */}
        <div className="lg:col-span-12">
          <TemporalAnalytics trades={strategyTrades} />
        </div>

      </div>
    </div>
  );
};
