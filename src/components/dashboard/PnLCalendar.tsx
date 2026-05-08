import React, { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trade } from '../../types';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameDay, 
  addMonths, 
  subMonths,
  isSameMonth
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PnLCalendarProps {
  trades: Trade[];
}

export const PnLCalendar: React.FC<PnLCalendarProps> = ({ trades }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Navigation to "Today" or latest trade
  const goToLatest = () => {
    if (trades.length > 0) {
      const lastTradeDate = new Date(trades[trades.length - 1].timestamp);
      setCurrentMonth(lastTradeDate);
    } else {
      setCurrentMonth(new Date());
    }
  };

  const calendarData = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days = eachDayOfInterval({ start: startDate, end: endDate });

    return days.map(day => {
      const dayTrades = trades.filter(t => isSameDay(new Date(t.timestamp), day));
      const dailyPnL = dayTrades.reduce((acc, t) => acc + t.pnlPercentage, 0);
      return {
        date: day,
        pnl: dailyPnL,
        tradesCount: dayTrades.length,
        isCurrentMonth: isSameMonth(day, monthStart)
      };
    });
  }, [currentMonth, trades]);

  const weeklySummaries = useMemo(() => {
    const weeks: number[] = [];
    for (let i = 0; i < calendarData.length; i += 7) {
      const week = calendarData.slice(i, i + 7);
      const weekPnL = week.reduce((acc, d) => acc + d.pnl, 0);
      weeks.push(weekPnL);
    }
    return weeks;
  }, [calendarData]);

  const monthlyTotal = useMemo(() => {
    return trades
      .filter(t => isSameMonth(new Date(t.timestamp), currentMonth))
      .reduce((acc, t) => acc + t.pnlPercentage, 0);
  }, [currentMonth, trades]);

  return (
    <Card className="bg-card border border-border rounded-xl overflow-hidden shadow-xl mb-10">
      <CardHeader className="p-4 border-b border-border bg-muted/30 flex flex-row items-center justify-between">
        <div className="flex items-center gap-4">
          <CardTitle className="text-[10px] font-black text-foreground/50 uppercase tracking-widest flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-primary" />
            Performance Calendar
          </CardTitle>
          <div className="flex items-center gap-1 bg-muted px-2 py-1 rounded border border-border">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-[11px] font-black font-mono w-28 text-center uppercase tracking-tighter">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={goToLatest}
            className="h-8 text-[10px] font-black uppercase tracking-widest bg-muted border-border"
          >
            Go to Active
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-[repeat(7,1fr)_80px] border-b border-border bg-muted/50">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} className="py-2 text-[10px] font-black text-center text-muted-foreground uppercase tracking-widest">
              {day}
            </div>
          ))}
          <div className="py-2 text-[10px] font-black text-center text-primary uppercase tracking-widest border-l border-border bg-primary/5">
            W.Sum
          </div>
        </div>

        <div className="grid grid-cols-[repeat(7,1fr)_80px]">
          {calendarData.map((day, i) => (
            <React.Fragment key={day.date.toISOString()}>
              <div 
                className={cn(
                  "min-h-[70px] p-2 border-b border-r border-border transition-all hover:bg-muted/50",
                  !day.isCurrentMonth && "opacity-30",
                  day.pnl > 0 ? "bg-success/5" : day.pnl < 0 ? "bg-destructive/5" : ""
                )}
              >
                <div className="text-[10px] font-black font-mono mb-1">{format(day.date, 'dd')}</div>
                {day.tradesCount > 0 && (
                  <div className={cn(
                    "text-[12px] font-black font-mono",
                    day.pnl > 0 ? "text-success" : day.pnl < 0 ? "text-destructive" : "text-muted-foreground"
                  )}>
                    {day.pnl > 0 ? '+' : ''}{day.pnl.toFixed(2)}%
                  </div>
                )}
                {day.tradesCount > 1 && (
                  <div className="text-[9px] font-bold text-muted-foreground/60 uppercase">
                    {day.tradesCount} trades
                  </div>
                )}
              </div>
              
              {(i + 1) % 7 === 0 && (
                <div className="flex flex-col items-center justify-center border-b border-border bg-primary/5 font-mono">
                  <span className={cn(
                    "text-[11px] font-black",
                    weeklySummaries[Math.floor(i / 7)] > 0 ? "text-success" : weeklySummaries[Math.floor(i / 7)] < 0 ? "text-destructive" : "text-muted-foreground"
                  )}>
                    {weeklySummaries[Math.floor(i / 7)] > 0 ? '+' : ''}{weeklySummaries[Math.floor(i / 7)].toFixed(1)}%
                  </span>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="p-4 bg-muted border-t border-border flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-[11px] font-black uppercase tracking-tight text-foreground">Statistical Edge Summary</span>
          </div>
          <div className="flex gap-8">
            <div className="text-right">
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Monthly Yield</p>
              <h4 className={cn(
                "text-xl font-black font-mono tracking-tighter",
                monthlyTotal >= 0 ? "text-success" : "text-destructive"
              )}>
                {monthlyTotal >= 0 ? '+' : ''}{monthlyTotal.toFixed(2)}%
              </h4>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
