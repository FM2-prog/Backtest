import React, { useMemo } from 'react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer, LineChart, Line, YAxis
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Target, TrendingUp, AlertTriangle, Eye, ArrowDownRight, ArrowUpRight, MoreHorizontal } from 'lucide-react';
import { Trade } from '../../types';

interface DeepAnalyticsProps {
  trades: Trade[];
}

const quantile = (arr: number[], q: number) => {
  const sorted = [...arr].sort((a, b) => a - b);
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  } else {
    return sorted[base] || 0;
  }
};

const BoxPlotBar = ({ data, color }: { data: number[], color: string }) => {
  if (!data || data.length === 0) return <div className="h-6 w-full bg-white/5 rounded-md flex items-center justify-center">No data</div>;
  
  const min = Math.min(...data);
  const max = Math.max(...data);
  const q1 = quantile(data, 0.25);
  const med = quantile(data, 0.50);
  const q3 = quantile(data, 0.75);

  const range = max - min || 1;
  
  const toPct = (val: number) => ((val - min) / range) * 100;

  return (
    <div className="relative w-full h-8 flex items-center py-2">
      {/* Base track representing full min-max range (invisible or faint) */}
      <div className="absolute w-full h-1 bg-white/10 rounded-full" />
      
      {/* Whisker left */}
      <div className="absolute h-1 bg-slate-600 rounded-l-full" style={{ left: '0%', width: `${toPct(q1)}%` }} />
      
      {/* Box (Q1 to Q3) */}
      <div 
        className="absolute h-4 rounded shadow-sm flex items-center" 
        style={{ left: `${toPct(q1)}%`, width: `${toPct(q3) - toPct(q1)}%`, backgroundColor: color, opacity: 0.8 }}
      >
        {/* Median Line */}
        <div 
          className="absolute w-1 h-5 bg-white shadow-md z-10" 
          style={{ left: `${((med - q1) / (q3 - q1 || 1)) * 100}%`, top: '-2px', transform: 'translateX(-50%)' }} 
        />
      </div>

      {/* Whisker right */}
      <div className="absolute h-1 bg-slate-600 rounded-r-full" style={{ left: `${toPct(q3)}%`, width: `${100 - toPct(q3)}%` }} />
      
      {/* Labels */}
      <div className="absolute -bottom-4 left-0 text-[8px] font-mono text-slate-500">{min.toFixed(2)}</div>
      <div className="absolute -bottom-4 right-0 text-[8px] font-mono text-slate-500">{max.toFixed(2)}</div>
    </div>
  );
};

export const DeepAnalytics: React.FC<DeepAnalyticsProps> = ({ trades }) => {
  const analyticsData = useMemo(() => {
    const sessions = {
      Ldn: { trades: 0, pnl: 0, wins: 0, winningRRSum: 0 },
      Ny: { trades: 0, pnl: 0, wins: 0, winningRRSum: 0 },
      Other: { trades: 0, pnl: 0, wins: 0, winningRRSum: 0 }
    };

    const maeData: number[] = [];
    const mfeData: number[] = [];
    const rrData: number[] = [];
    
    // Sparkline series
    const series = trades.map((t, i) => {
      const date = new Date(t.timestamp);
      const hour = date.getUTCHours();
      let session: 'Ldn' | 'Ny' | 'Other' = 'Other';
      if (hour >= 8 && hour < 13) session = 'Ldn';
      else if (hour >= 13 && hour < 21) session = 'Ny';

      sessions[session].trades++;
      sessions[session].pnl += t.pnl;
      
      let realRR = 0;
      const risk = t.stopLoss ? Math.abs(t.entryPrice - t.stopLoss) : 0;
      const reward = Math.abs(t.exitPrice - t.entryPrice);
      
      if (t.pnl > 0) {
        sessions[session].wins++;
        if (risk > 0) {
          realRR = reward / risk;
          sessions[session].winningRRSum += realRR;
          rrData.push(realRR);
        }
      }

      const mae = t.maePercent || 0;
      const mfe = t.mfePercent || 0;
      if (mae > 0) maeData.push(mae);
      if (mfe > 0) mfeData.push(mfe);

      return { i, mae, mfe, rr: realRR };
    });

    const radarChartData = [
      {
        session: 'Ldn',
        profit: sessions.Ldn.pnl,
        winRate: sessions.Ldn.trades > 0 ? (sessions.Ldn.wins / sessions.Ldn.trades) * 100 : 0,
        trades: sessions.Ldn.trades,
        avgRR: sessions.Ldn.wins > 0 ? sessions.Ldn.winningRRSum / sessions.Ldn.wins : 0
      },
      {
        session: 'Ny',
        profit: sessions.Ny.pnl,
        winRate: sessions.Ny.trades > 0 ? (sessions.Ny.wins / sessions.Ny.trades) * 100 : 0,
        trades: sessions.Ny.trades,
        avgRR: sessions.Ny.wins > 0 ? sessions.Ny.winningRRSum / sessions.Ny.wins : 0
      },
      {
        session: 'Other',
        profit: sessions.Other.pnl,
        winRate: sessions.Other.trades > 0 ? (sessions.Other.wins / sessions.Other.trades) * 100 : 0,
        trades: sessions.Other.trades,
        avgRR: sessions.Other.wins > 0 ? sessions.Other.winningRRSum / sessions.Other.wins : 0
      }
    ];

    return {
      radarChartData,
      maeData,
      mfeData,
      rrData,
      series
    };
  }, [trades]);

  const { radarChartData, maeData, mfeData, rrData, series } = analyticsData;

  const avgMae = maeData.length ? maeData.reduce((a,b)=>a+b,0) / maeData.length : 0;
  const avgMfe = mfeData.length ? mfeData.reduce((a,b)=>a+b,0) / mfeData.length : 0;
  const avgRr = rrData.length ? rrData.reduce((a,b)=>a+b,0) / rrData.length : 0;

  return (
    <div className="mt-12 space-y-8">
      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-primary/10 rounded border border-primary/20">
          <Eye className="h-4 w-4 text-primary" />
        </div>
        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">Section 03: Deep Analytics</h3>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Radar Charts Grid */}
        <div className="xl:col-span-6 grid grid-cols-2 gap-4">
          {[
            { key: 'profit', label: 'Profit By Session' },
            { key: 'winRate', label: 'Win Rate By Session' },
            { key: 'trades', label: 'Trades By Session' },
            { key: 'avgRR', label: 'Avg Profitable RR' }
          ].map(metric => (
             <Card key={metric.key} className="bg-card border-border shadow-sm grainy-texture relative overflow-hidden">
               <CardHeader className="pb-0 pt-4 px-4">
                 <CardTitle className="text-[9px] uppercase font-black text-muted-foreground tracking-widest text-center">
                   {metric.label}
                 </CardTitle>
               </CardHeader>
               <CardContent className="h-[140px] flex items-center justify-center -mt-2">
                 <ResponsiveContainer width="100%" height="100%">
                   <RadarChart cx="50%" cy="50%" outerRadius="60%" data={radarChartData}>
                     <PolarGrid stroke="var(--border)" />
                     <PolarAngleAxis dataKey="session" tick={{ fill: 'var(--muted-foreground)', fontSize: 10, fontFamily: 'monospace' }} />
                     <PolarRadiusAxis angle={30} domain={['auto', 'auto']} tick={false} axisLine={false} />
                     <Radar
                       name={metric.label}
                       dataKey={metric.key}
                       stroke="var(--primary)"
                       fill="var(--primary)"
                       fillOpacity={0.4}
                     />
                   </RadarChart>
                 </ResponsiveContainer>
               </CardContent>
             </Card>
          ))}
        </div>

        {/* Distributions */}
        <div className="xl:col-span-6 space-y-4">
          
          {/* MAE Distribution */}
          <Card className="bg-card border-border shadow-sm grainy-texture">
            <CardHeader className="flex flex-row items-center justify-between pb-2 px-5 pt-4">
               <div>
                 <CardTitle className="text-[10px] uppercase font-black text-muted-foreground tracking-widest flex items-center gap-2">
                   <ArrowDownRight className="w-3 h-3 text-destructive" />
                   Drawdown Stats (MAE)
                 </CardTitle>
               </div>
               <div className="flex items-center gap-2">
                 <Badge variant="outline" className="font-mono text-xs border-destructive/30 text-destructive bg-destructive/10 h-6">
                   Avg: {avgMae.toFixed(2)}%
                 </Badge>
                 <Select>
                   <SelectTrigger className="h-6 w-6 p-0 flex items-center justify-center bg-transparent border-0 text-muted-foreground hover:text-foreground [&>svg:first-child]:hidden shadow-none ring-0">
                     <MoreHorizontal className="h-4 w-4" />
                   </SelectTrigger>
                   <SelectContent align="end">
                     <SelectItem value="view">View Raw Data</SelectItem>
                     <SelectItem value="export">Export CSV</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
            </CardHeader>
            <CardContent className="px-5 pb-4 space-y-4">
              <BoxPlotBar data={maeData} color="var(--destructive)" />
              <div className="h-10 mt-2">
                 <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={series}>
                       <YAxis hide domain={['dataMin', 'dataMax']} />
                       <Line type="monotone" dataKey="mae" stroke="var(--destructive)" strokeWidth={1} dot={false} isAnimationActive={false} />
                    </LineChart>
                 </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* MFE Distribution */}
          <Card className="bg-card border-border shadow-sm grainy-texture">
            <CardHeader className="flex flex-row items-center justify-between pb-2 px-5 pt-4">
               <div>
                 <CardTitle className="text-[10px] uppercase font-black text-muted-foreground tracking-widest flex items-center gap-2">
                   <ArrowUpRight className="w-3 h-3 text-success" />
                   Max Potential Profit (MFE)
                 </CardTitle>
               </div>
               <div className="flex items-center gap-2">
                 <Badge variant="outline" className="font-mono text-xs border-success/30 text-success bg-success/10 h-6">
                   Avg: {avgMfe.toFixed(2)}%
                 </Badge>
                 <Select>
                   <SelectTrigger className="h-6 w-6 p-0 flex items-center justify-center bg-transparent border-0 text-muted-foreground hover:text-foreground [&>svg:first-child]:hidden shadow-none ring-0">
                     <MoreHorizontal className="h-4 w-4" />
                   </SelectTrigger>
                   <SelectContent align="end">
                     <SelectItem value="view">View Raw Data</SelectItem>
                     <SelectItem value="export">Export CSV</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
            </CardHeader>
            <CardContent className="px-5 pb-4 space-y-4">
              <BoxPlotBar data={mfeData} color="var(--success)" />
              <div className="h-10 mt-2">
                 <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={series}>
                       <YAxis hide domain={['dataMin', 'dataMax']} />
                       <Line type="monotone" dataKey="mfe" stroke="var(--success)" strokeWidth={1} dot={false} isAnimationActive={false} />
                    </LineChart>
                 </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* RR Distribution */}
          <Card className="bg-card border-border shadow-sm grainy-texture">
            <CardHeader className="flex flex-row items-center justify-between pb-2 px-5 pt-4">
               <div>
                 <CardTitle className="text-[10px] uppercase font-black text-muted-foreground tracking-widest flex items-center gap-2">
                   <Target className="w-3 h-3 text-primary" />
                   Profitable RR Stats
                 </CardTitle>
               </div>
               <div className="flex items-center gap-2">
                 <Badge variant="outline" className="font-mono text-xs border-primary/30 text-primary bg-primary/10 h-6">
                   Avg: {avgRr.toFixed(2)}R
                 </Badge>
                 <Select>
                   <SelectTrigger className="h-6 w-6 p-0 flex items-center justify-center bg-transparent border-0 text-muted-foreground hover:text-foreground [&>svg:first-child]:hidden shadow-none ring-0">
                     <MoreHorizontal className="h-4 w-4" />
                   </SelectTrigger>
                   <SelectContent align="end">
                     <SelectItem value="view">View Raw Data</SelectItem>
                     <SelectItem value="export">Export CSV</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
            </CardHeader>
            <CardContent className="px-5 pb-4 space-y-4">
              <BoxPlotBar data={rrData} color="var(--primary)" />
              <div className="h-10 mt-2">
                 <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={series}>
                       <YAxis hide domain={['dataMin', 'dataMax']} />
                       <Line type="monotone" dataKey="rr" stroke="var(--primary)" strokeWidth={1} dot={false} isAnimationActive={false} />
                    </LineChart>
                 </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
};
