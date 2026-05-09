import { useState, useMemo, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { MetricsHeader } from './components/dashboard/MetricsHeader';
import { TradeForm } from './components/dashboard/TradeForm';
import { EquityChart } from './components/dashboard/EquityChart';
import { LogHistory } from './components/dashboard/LogHistory';
import { StrategyRepository } from './components/dashboard/StrategyRepository';
import { ChronologicalPerformance } from './components/performance/ChronologicalPerformance';
import { MonteCarloSimulation } from './components/performance/MonteCarloSimulation';
import { PnLCalendar } from './components/dashboard/PnLCalendar';
import { GeminiAssistant } from './components/dashboard/GeminiAssistant';
import { TradingStats } from './types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, BrainCircuit, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useBacktest } from './context/BacktestContext';

export default function App() {
  const { strategies, trades, activeStrategyId, setActiveStrategyId } = useBacktest();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  
  const filteredTrades = useMemo(() => {
    if (!activeStrategyId || activeStrategyId === 'all') return trades;
    return trades.filter(t => t.strategyId === activeStrategyId);
  }, [trades, activeStrategyId]);

  const stats: TradingStats = useMemo(() => {
    const total = filteredTrades.length;
    if (total === 0) return { winRate: 0, profitFactor: 0, totalTrades: 0, netProfit: 0, maxDrawdown: 0, avgR: 0 };
    
    const wins = filteredTrades.filter(t => t.status === 'win');
    const losses = filteredTrades.filter(t => t.status === 'loss');
    
    const grossProfit = wins.reduce((sum, t) => sum + t.pnlPercentage, 0);
    const grossLoss = Math.abs(losses.reduce((sum, t) => sum + t.pnlPercentage, 0));
    
    // Calculate Balance Curve for Drawdown
    let currentBalance = 0;
    let maxBalance = 0;
    let maxDD = 0;
    
    filteredTrades.forEach(t => {
      currentBalance += t.pnlPercentage;
      if (currentBalance > maxBalance) maxBalance = currentBalance;
      const dd = maxBalance - currentBalance;
      if (dd > maxDD) maxDD = dd;
    });

    return {
      winRate: wins.length / total,
      profitFactor: grossLoss === 0 ? grossProfit : grossProfit / grossLoss,
      totalTrades: total,
      netProfit: currentBalance,
      maxDrawdown: maxDD,
      avgR: 1.5
    };
  }, [filteredTrades]);

  const analyticsContext = useMemo(() => {
    if (filteredTrades.length === 0) return 'No data available.';
    const sessions = { Ldn: { trades: 0, wins: 0 }, Ny: { trades: 0, wins: 0 }, Other: { trades: 0, wins: 0 } };
    filteredTrades.forEach(t => {
      const hour = new Date(t.timestamp).getUTCHours();
      const s = (hour >= 8 && hour < 13) ? 'Ldn' : ((hour >= 13 && hour < 21) ? 'Ny' : 'Other');
      sessions[s].trades++;
      if (t.pnl > 0) sessions[s].wins++;
    });
    const statsStr = Object.entries(sessions).map(([k, v]) => `${k} Session: ${v.trades} trades, ${(v.trades ? (v.wins/v.trades)*100 : 0).toFixed(0)}% WR`).join(' | ');
    const avgMae = filteredTrades.reduce((acc, t) => acc + (t.maePercent||0), 0) / filteredTrades.length;
    const avgMfe = filteredTrades.reduce((acc, t) => acc + (t.mfePercent||0), 0) / filteredTrades.length;
    return `Session Performance: ${statsStr}. Average MAE: ${avgMae.toFixed(2)}%, Average MFE: ${avgMfe.toFixed(2)}%.`;
  }, [filteredTrades]);

  // Theme Sync
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key.toUpperCase() === 'L') {
        setActiveTab('dashboard');
      }
      if (e.shiftKey && e.key.toUpperCase() === 'H') {
        setActiveTab('history');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden selection:bg-primary selection:text-primary-foreground flex-col font-sans">
      <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-background z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center font-black text-slate-950">QA</div>
          <h1 className="text-lg font-black tracking-tighter uppercase text-foreground">
            QUANT AUDIT
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-muted border border-border rounded font-black text-foreground text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span> SYSTEM: ONLINE
          </div>
          
          <div className="flex items-center gap-2 bg-muted border border-border rounded-lg px-2 h-9">
            <Filter className="h-3.5 w-3.5 text-muted-foreground ml-1" />
            <Select value={activeStrategyId || 'all'} onValueChange={(val) => setActiveStrategyId(val === 'all' ? null : val)}>
              <SelectTrigger className="w-[180px] border-0 h-8 text-[10px] font-black uppercase tracking-widest bg-transparent focus:ring-0">
                <SelectValue placeholder="All Strategies" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Global Data</SelectItem>
                {strategies.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={() => setIsAssistantOpen(true)}
            variant="outline"
            className="h-9 gap-2 text-[10px] font-black uppercase tracking-widest text-foreground hover:text-foreground border-border bg-background"
          >
            <BrainCircuit className="h-4 w-4 text-primary" />
            Gemini Assistant
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} theme={theme} setTheme={setTheme} />
        
        <main className="flex-1 flex flex-col min-h-0 bg-background relative border-r border-border overflow-hidden">
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-8 pt-8 pb-40 scroll-smooth">
            <div className="flex justify-start mb-4">
              <span className="text-sm font-black uppercase tracking-widest text-foreground">
                resumen del portfolio
              </span>
            </div>
            <MetricsHeader stats={stats} />

            <Tabs value={activeTab === 'dashboard' || activeTab === 'calendar' ? activeTab : activeTab} onValueChange={setActiveTab} className="w-full mt-8">
              <div className="flex items-center justify-between mb-6">
                <TabsList className="bg-muted border border-border p-1">
                  <TabsTrigger value="calendar" className="text-[10px] uppercase font-black px-4 data-[state=active]:bg-background">PnL Calendar</TabsTrigger>
                </TabsList>
              </div>

              <div className="mt-0 outline-none">
                <AnimatePresence mode="wait">
                  {activeTab === 'dashboard' && (
                    <motion.div
                      key="dashboard"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-stretch w-full"
                    >
                      <div className="lg:col-span-1 flex flex-col">
                        <div className="w-full h-full flex flex-col">
                          <TradeForm />
                        </div>
                      </div>
                      <div className="lg:col-span-3 flex flex-col overflow-hidden">
                        <div className="w-full h-full flex flex-col">
                          <EquityChart trades={filteredTrades} />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'calendar' && (
                    <motion.div
                      key="calendar"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <PnLCalendar trades={filteredTrades} />
                    </motion.div>
                  )}

                  {activeTab === 'history' && (
                    <motion.div
                      key="history"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <LogHistory />
                    </motion.div>
                  )}

                  {activeTab === 'strategy' && (
                    <motion.div
                      key="strategy"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <StrategyRepository onBack={() => setActiveTab('dashboard')} />
                    </motion.div>
                  )}

              {activeTab === 'performance' && (
                <motion.div
                  key="performance"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col gap-8"
                >
                  <MonteCarloSimulation trades={filteredTrades} />
                  <ChronologicalPerformance trades={filteredTrades} />
                </motion.div>
              )}
                </AnimatePresence>
              </div>
            </Tabs>
          </div>
        </main>
      </div>

      <GeminiAssistant isOpen={isAssistantOpen} onClose={() => setIsAssistantOpen(false)} analyticsContext={analyticsContext} />
    </div>
  );
}
