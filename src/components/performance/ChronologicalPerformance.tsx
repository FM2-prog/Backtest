import React, { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Trade } from '../../types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, 
  startOfYear, endOfYear, eachMonthOfInterval, getWeekOfMonth, parseISO,
  isSameDay
} from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ChronologicalPerformanceProps {
  trades: Trade[];
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const ChronologicalPerformance: React.FC<ChronologicalPerformanceProps> = ({ trades }) => {
  const [activeTab, setActiveTab] = useState<'yearly' | 'monthly'>('monthly');

  return (
    <div className="space-y-6 pb-32">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black uppercase tracking-widest text-slate-100">Chronological Performance Hub</h2>
        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
          <TabsList className="bg-slate-900 border border-slate-800">
            <TabsTrigger value="monthly" className="text-xs font-bold uppercase tracking-wider">Monthly Detail</TabsTrigger>
            <TabsTrigger value="yearly" className="text-xs font-bold uppercase tracking-wider">Yearly Matrix</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {activeTab === 'monthly' && <MonthlyView trades={trades} />}
      {activeTab === 'yearly' && <YearlyView trades={trades} />}
    </div>
  );
};

const MonthlyView: React.FC<{ trades: Trade[] }> = ({ trades }) => {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    trades.forEach(t => years.add(new Date(t.timestamp).getFullYear()));
    years.add(new Date().getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  }, [trades]);

  const viewDate = new Date(selectedYear, selectedMonth, 1);
  const start = startOfMonth(viewDate);
  const end = endOfMonth(viewDate);
  const daysInMonth = eachDayOfInterval({ start, end });
  const startDayOfWeek = getDay(start);

  const dailyData = useMemo(() => {
    const map = new Map<string, { pnl: number; count: number }>();
    trades.forEach(t => {
      const d = new Date(t.timestamp);
      if (d.getFullYear() === selectedYear && d.getMonth() === selectedMonth) {
        const key = format(d, 'yyyy-MM-dd');
        const existing = map.get(key) || { pnl: 0, count: 0 };
        map.set(key, { pnl: existing.pnl + t.pnl, count: existing.count + 1 });
      }
    });
    return map;
  }, [trades, selectedYear, selectedMonth]);

  const weeklyData = useMemo(() => {
    const weeks: { [key: number]: { pnl: number; count: number } } = {};
    dailyData.forEach((val, dateStr) => {
      const d = parseISO(dateStr);
      const weekNum = getWeekOfMonth(d);
      if (!weeks[weekNum]) weeks[weekNum] = { pnl: 0, count: 0 };
      weeks[weekNum].pnl += val.pnl;
      weeks[weekNum].count += val.count;
    });
    return weeks;
  }, [dailyData]);

  const monthTotalVal = Object.values(weeklyData).reduce((sum, w) => sum + w.pnl, 0);
  const monthCountVal = Object.values(weeklyData).reduce((sum, w) => sum + w.count, 0);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
      <div className="xl:col-span-8 flex flex-col gap-4">
        <div className="flex items-center gap-4 h-9">
          <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
            <SelectTrigger className="w-24 bg-slate-900 border-slate-800 text-slate-100 h-9 font-bold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
            <SelectTrigger className="w-32 bg-slate-900 border-slate-800 text-slate-100 h-9 font-bold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, i) => <SelectItem key={i} value={i.toString()}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <Card className="bg-[#1C1C1C] border-[#2D2D2D] shadow-2xl overflow-hidden flex-1 flex flex-col">
          <CardContent className="p-4 flex-1">
             <div className="grid grid-cols-7 gap-2 h-full content-start">
               {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                 <div key={d} className="text-center text-[10px] font-black uppercase text-slate-500 py-2">
                   {d}
                 </div>
               ))}
               {Array.from({ length: startDayOfWeek }).map((_, i) => (
                 <div key={`empty-start-${i}`} className="h-24 bg-slate-900/20 rounded-md border border-slate-800/30" />
               ))}
               {daysInMonth.map((day, i) => {
                 const key = format(day, 'yyyy-MM-dd');
                 const data = dailyData.get(key);
                 const isPositive = data && data.pnl >= 0;
                 const isNegative = data && data.pnl < 0;

                 return (
                   <div 
                     key={i} 
                     className={`h-24 rounded-md border p-2 flex flex-col justify-between transition-colors
                       ${isPositive ? 'bg-emerald-500/10 border-emerald-500/20' : 
                         isNegative ? 'bg-red-500/10 border-red-500/20' : 
                         'bg-[#020617]/50 border-[#2D2D2D]'}
                     `}
                   >
                     <span className="text-xs font-black text-slate-500">{format(day, 'd')}</span>
                     {data && data.count > 0 && (
                       <div className="flex flex-col items-end">
                         <span className={`font-mono text-sm font-black ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                           {data.pnl >= 0 ? '+' : '-'}${Math.abs(data.pnl).toFixed(2)}
                         </span>
                         <span className="text-[9px] text-slate-500 font-bold uppercase">{data.count} {data.count === 1 ? 'trade' : 'trades'}</span>
                       </div>
                     )}
                   </div>
                 );
               })}
                {Array.from({ length: (7 - ((startDayOfWeek + daysInMonth.length) % 7)) % 7 }).map((_, i) => (
                 <div key={`empty-end-${i}`} className="h-24 bg-slate-900/20 rounded-md border border-slate-800/30" />
               ))}
             </div>
          </CardContent>
        </Card>
      </div>

      <div className="xl:col-span-4 flex flex-col gap-4">
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-300 h-9 flex items-center">P&L By Week - {MONTHS[selectedMonth]} {selectedYear}</h3>
        <div className="flex flex-col justify-between flex-1 gap-2">
          <div className="flex flex-col gap-2">
            {Array.from({ length: Math.max(5, Math.max(...Object.keys(weeklyData).map(k => parseInt(k)), 0)) }).map((_, i) => {
              const week = i + 1;
              const data = weeklyData[week] || { pnl: 0, count: 0 };
              const isPos = data.pnl >= 0;
              return (
                <Card key={week} className={`border bg-[#0B1120] ${data.count > 0 ? (isPos ? 'border-emerald-500/30' : 'border-red-500/30') : 'border-[#2D2D2D]'}`}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <span className="font-bold text-slate-300 text-xs uppercase tracking-wider">Week {week}</span>
                    <div className="flex flex-col items-end">
                      <span className={`font-mono font-black ${data.count > 0 ? (isPos ? 'text-emerald-400' : 'text-red-400') : 'text-slate-500'}`}>
                        {data.pnl >= 0 ? '' : '-'}${Math.abs(data.pnl).toFixed(2)}
                      </span>
                      <span className="text-[9px] text-slate-500 uppercase font-bold">{data.count} Trades</span>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
          
          <Card className={`mt-auto border bg-[#0B1120] ${monthCountVal > 0 ? (monthTotalVal >= 0 ? 'border-emerald-500/50' : 'border-red-500/50') : 'border-[#2D2D2D]'}`}>
            <CardContent className="p-4 flex items-center justify-between">
              <span className="font-black text-slate-100 text-sm uppercase tracking-wider">Monthly Total</span>
              <div className="flex flex-col items-end">
                <span className={`font-mono text-lg font-black ${monthCountVal > 0 ? (monthTotalVal >= 0 ? 'text-emerald-400' : 'text-red-400') : 'text-slate-500'}`}>
                  {monthTotalVal >= 0 ? '' : '-'}${Math.abs(monthTotalVal).toFixed(2)}
                </span>
                <span className="text-[10px] text-slate-400 uppercase font-bold">{monthCountVal} Trades</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

const YearlyView: React.FC<{ trades: Trade[] }> = ({ trades }) => {
  const [metric, setMetric] = useState<'percent' | 'profit' | 'all'>('all');
  const [selectedYearView, setSelectedYearView] = useState<number>(new Date().getFullYear());

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    trades.forEach(t => years.add(new Date(t.timestamp).getFullYear()));
    years.add(new Date().getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  }, [trades]);

  const yearlyMatrixData = useMemo(() => {
    const matrix: any = {};
    trades.forEach(t => {
      const d = new Date(t.timestamp);
      const y = d.getFullYear();
      const m = d.getMonth();
      if (!matrix[y]) {
        matrix[y] = { totalRaw: 0, totalPct: 0, totalCount: 0 };
        for (let i = 0; i < 12; i++) {
          matrix[y][i] = { pnl: 0, pct: 0, count: 0 };
        }
      }
      matrix[y][m].pnl += t.pnl;
      matrix[y][m].pct += (t.pnlPercentage || 0); // Assuming pnlPercentage is available
      matrix[y][m].count += 1;
      
      matrix[y].totalRaw += t.pnl;
      matrix[y].totalPct += (t.pnlPercentage || 0);
      matrix[y].totalCount += 1;
    });
    return matrix;
  }, [trades]);

  return (
    <div className="flex flex-col gap-8">
      <Card className="bg-[#1C1C1C] border-[#2D2D2D] shadow-2xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-[#2D2D2D]">
          <CardTitle className="text-sm uppercase font-black text-slate-200 tracking-widest">
            Percentage Profit by Month
          </CardTitle>
          <Tabs value={metric} onValueChange={(v: any) => setMetric(v)}>
            <TabsList className="bg-slate-900 border border-slate-800">
              <TabsTrigger value="percent" className="text-[10px] font-bold uppercase tracking-wider">Percent</TabsTrigger>
              <TabsTrigger value="profit" className="text-[10px] font-bold uppercase tracking-wider">Profit</TabsTrigger>
              <TabsTrigger value="all" className="text-[10px] font-bold uppercase tracking-wider">All</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-[#020617]/50 border-b border-[#2D2D2D]">
              <tr>
                <th className="px-4 py-3 font-black text-slate-400 uppercase tracking-wider text-[10px]">Year</th>
                {MONTHS.map(m => (
                  <th key={m} className="px-4 py-3 font-black text-slate-400 uppercase tracking-wider text-[10px] text-center">{m}</th>
                ))}
                <th className="px-4 py-3 font-black text-slate-300 uppercase tracking-wider text-[10px] text-center bg-slate-900/30">YTD</th>
              </tr>
            </thead>
            <tbody>
              {availableYears.map(year => {
                const rowData = yearlyMatrixData[year] || { totalRaw: 0, totalPct: 0, totalCount: 0 };
                return (
                  <tr key={year} className="border-b border-[#2D2D2D]/50 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-slate-300">{year}</td>
                    {Array.from({length: 12}).map((_, m) => {
                      const data = rowData[m] || { pnl: 0, pct: 0, count: 0 };
                      const isPos = data.pnl >= 0;
                      const hasTrades = data.count > 0;
                      return (
                        <td key={m} className="px-4 py-3 text-center">
                          {hasTrades ? (
                            <div className="flex flex-col items-center justify-center">
                              {(metric === 'all' || metric === 'percent') && (
                                <span className={`font-mono text-xs font-black ${isPos ? 'text-emerald-400' : 'text-red-400'}`}>
                                  {data.pct.toFixed(2)}%
                                </span>
                              )}
                              {metric === 'all' && (
                                <span className="text-[9px] font-bold uppercase text-slate-500">{data.count} {data.count === 1 ? 'trade' : 'trades'}</span>
                              )}
                              {(metric === 'all' || metric === 'profit') && (
                                <span className={`font-mono text-[10px] font-bold ${isPos ? 'text-emerald-500' : 'text-red-500'}`}>
                                  ${data.pnl.toFixed(2)}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-600 font-mono text-sm">-</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-center bg-slate-900/30">
                      {rowData.totalCount > 0 ? (
                        <div className="flex flex-col items-center justify-center">
                          {(metric === 'all' || metric === 'percent') && (
                            <span className={`font-mono text-sm font-black ${rowData.totalRaw >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {rowData.totalPct.toFixed(2)}%
                            </span>
                          )}
                          {metric === 'all' && (
                            <span className="text-[9px] font-bold uppercase text-slate-500">{rowData.totalCount} trades</span>
                          )}
                          {(metric === 'all' || metric === 'profit') && (
                            <span className={`font-mono text-xs font-bold ${rowData.totalRaw >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                              ${rowData.totalRaw.toFixed(2)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-600 font-mono text-sm">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="flex items-center gap-4">
        <Select value={selectedYearView.toString()} onValueChange={(v) => setSelectedYearView(parseInt(v))}>
          <SelectTrigger className="w-32 bg-slate-900 border-slate-800 text-slate-100 h-9 font-bold">
             <SelectValue />
          </SelectTrigger>
          <SelectContent>
             {availableYears.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-xs uppercase font-black tracking-widest text-slate-500">Yearly Overview Heatmap</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
         {Array.from({length: 12}).map((_, m) => {
           return <MiniCalendar key={m} year={selectedYearView} month={m} trades={trades} />
         })}
      </div>

    </div>
  );
};

const MiniCalendar: React.FC<{ year: number, month: number, trades: Trade[] }> = ({ year, month, trades }) => {
  const viewDate = new Date(year, month, 1);
  const start = startOfMonth(viewDate);
  const end = endOfMonth(viewDate);
  const daysInMonth = eachDayOfInterval({ start, end });
  const startDayOfWeek = getDay(start);

  const dailyData = useMemo(() => {
    const map = new Map<string, { pnl: number, pct: number }>();
    trades.forEach(t => {
      const d = new Date(t.timestamp);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const key = format(d, 'yyyy-MM-dd');
        const existing = map.get(key) || { pnl: 0, pct: 0 };
        map.set(key, { pnl: existing.pnl + t.pnl, pct: existing.pct + (t.pnlPercentage || 0) });
      }
    });
    return map;
  }, [trades, year, month]);

  return (
    <div className="flex flex-col gap-2">
      <h4 className="text-[11px] font-black uppercase text-slate-300 text-center tracking-widest mb-1">{MONTHS[month]} {year}</h4>
      <div className="grid grid-cols-7 gap-1">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={`${d}-${i}`} className="text-center text-[8px] font-black text-slate-600 uppercase mb-1">
            {d}
          </div>
        ))}
        {Array.from({ length: startDayOfWeek }).map((_, i) => (
          <div key={`empty-start-${i}`} className="aspect-square" />
        ))}
        {daysInMonth.map((day, i) => {
           const key = format(day, 'yyyy-MM-dd');
           const data = dailyData.get(key);
           
           if (!data) {
             return (
               <div key={i} className="aspect-square flex items-center justify-center text-[8px] text-slate-700 font-mono hover:bg-slate-800 rounded transition-colors cursor-default">
                 {format(day, 'd')}
               </div>
             )
           }

           const isPos = data.pnl >= 0;
           return (
             <div 
               key={i} 
               className={`aspect-square flex items-center justify-center text-[7px] font-mono font-bold rounded cursor-default border group relative
                 ${isPos ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30'}
               `}
               title={`$${data.pnl.toFixed(2)} (${data.pct.toFixed(2)}%)`}
             >
               {Math.abs(data.pct) >= 0.1 ? data.pct.toFixed(1) : format(day, 'd')}
             </div>
           );
        })}
      </div>
    </div>
  );
}
