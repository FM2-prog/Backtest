import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Calendar, 
  XCircle, 
  ChevronDown, 
  Loader2,
  ExternalLink,
  ArrowUpDown,
  History,
  LayoutGrid
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useBacktest } from '../../context/BacktestContext';

export const LogHistory = () => {
  const { trades, strategies } = useBacktest();
  const [loading, setLoading] = useState(true);
  const [searchTicket, setSearchTicket] = useState('');
  const [accountFilter, setAccountFilter] = useState('all');
  const [setupFilter, setSetupFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    // Simulate initial data fetch
    const timer = setTimeout(() => {
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const resetFilters = () => {
    setSearchTicket('');
    setAccountFilter('all');
    setSetupFilter('all');
    setDateRange({ start: '', end: '' });
  };

  const filteredTrades = useMemo(() => {
    return trades.filter(trade => {
      const matchTicket = trade.id.toLowerCase().includes(searchTicket.toLowerCase());
      const strategy = strategies.find(s => s.id === trade.strategyId);
      const matchAccount = accountFilter === 'all' || trade.strategyId === accountFilter;
      const matchSetup = setupFilter === 'all' || (trade.tags && trade.tags.some(t => t.toLowerCase().includes(setupFilter.toLowerCase())));
      
      const tradeDate = new Date(trade.timestamp).toISOString().split('T')[0];
      const matchDate = (!dateRange.start || tradeDate >= dateRange.start) && 
                        (!dateRange.end || tradeDate <= dateRange.end);

      return matchTicket && matchAccount && matchSetup && matchDate;
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [searchTicket, accountFilter, setupFilter, dateRange, trades, strategies]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-[10px] uppercase font-black text-slate-500 tracking-[0.3em]">Querying Archive...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6">
      {/* Control Panel */}
      <div className="sticky top-0 z-20 bg-card border border-border rounded-xl p-4 shadow-sm mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Account Selector */}
          <div className="flex-1 min-w-[150px]">
            <Select value={accountFilter} onValueChange={setAccountFilter}>
              <SelectTrigger className="bg-input border-border h-10 text-xs font-bold focus:ring-primary">
                <SelectValue placeholder="Select Strategy" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border text-popover-foreground">
                <SelectItem value="all">All Strategies</SelectItem>
                {strategies.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Setup Selector */}
          <div className="flex-1 min-w-[150px]">
            <Select value={setupFilter} onValueChange={setSetupFilter}>
              <SelectTrigger className="bg-input border-border h-10 text-xs font-bold focus:ring-primary">
                <SelectValue placeholder="All Tags" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border text-popover-foreground">
                <SelectItem value="all">All Tags</SelectItem>
                <SelectItem value="Calm">Calm</SelectItem>
                <SelectItem value="FOMO">FOMO Entry</SelectItem>
                <SelectItem value="Revenge">Revenge</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Ticket Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <Input 
              placeholder="Search Ticket ID..." 
              value={searchTicket}
              onChange={(e) => setSearchTicket(e.target.value)}
              className="pl-9 bg-input border-border h-10 text-xs focus:ring-primary text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Date Range */}
          <div className="flex items-center gap-2 bg-input border border-border rounded-md px-3 h-10 w-[240px]">
            <Calendar className="h-3.5 w-3.5 text-slate-500" />
            <input 
              type="date" 
              className="bg-transparent border-none text-[10px] text-foreground focus:ring-0 w-full font-mono"
              value={dateRange.start}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
            />
            <span className="text-muted-foreground">-</span>
            <input 
              type="date" 
              className="bg-transparent border-none text-[10px] text-foreground focus:ring-0 w-full font-mono"
              value={dateRange.end}
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
            />
          </div>

          {/* Reset button */}
          <Button 
            variant="ghost" 
            onClick={resetFilters}
            className="text-destructive hover:text-destructive hover:bg-destructive/10 text-[10px] font-black uppercase tracking-widest h-10 px-4"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      {/* Data Grid */}
      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm relative grainy-texture">
        <Table>
          <TableHeader className="bg-muted w-full">
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Ticket</TableHead>
              <TableHead className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Date & Time</TableHead>
              <TableHead className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Strategy</TableHead>
              <TableHead className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Asset/Pair</TableHead>
              <TableHead className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Execution</TableHead>
              <TableHead className="text-[10px] uppercase font-black text-muted-foreground tracking-widest text-right">PnL</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTrades.length > 0 ? (
              filteredTrades.map((trade) => {
                const strategy = strategies.find(s => s.id === trade.strategyId);
                return (
                  <TableRow 
                    key={trade.id} 
                    className="border-border hover:bg-muted transition-colors cursor-pointer group"
                  >
                    <TableCell className="font-mono text-[10px] text-blue-400 font-bold tracking-tight">
                      {trade.id}
                    </TableCell>
                    <TableCell className="text-[10px] text-slate-400 font-medium">
                      {new Date(trade.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-muted border-border text-[8px] font-black uppercase tracking-tighter h-5 text-foreground">
                        {strategy?.name || 'Unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[10px] font-black text-foreground">
                      {trade.pair}
                    </TableCell>
                    <TableCell className="text-[10px] text-slate-400 uppercase font-bold">
                      <span className={`px-1.5 py-0.5 rounded ${trade.side === 'long' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                        {trade.side}
                      </span>
                    </TableCell>
                    <TableCell className={`text-right font-mono font-black text-[11px] ${trade.pnl >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                      <span className="ml-2 opacity-50 text-[9px]">({trade.pnlPercentage.toFixed(2)}%)</span>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-[300px] text-center">
                  <div className="flex flex-col items-center justify-center space-y-3 opacity-50">
                    <History className="h-10 w-10 text-slate-700" />
                    <div>
                      <p className="text-sm font-bold text-foreground mb-1">No trades found matching the current filters</p>
                      <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Adjust criteria to refine search</p>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={resetFilters}
                      className="mt-4 border-border hover:bg-muted h-8 text-[9px] font-black uppercase tracking-widest"
                    >
                      Reset All Filters
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Footer Info */}
      <div className="flex items-center justify-between px-2 opacity-50">
        <p className="text-[9px] uppercase font-black text-slate-500 tracking-[0.2em]">
          Total Sample: {filteredTrades.length} Nodes Retreived
        </p>
        <p className="text-[9px] uppercase font-black text-slate-500 tracking-[0.2em]">
          End of Ledger // {new Date().toLocaleDateString()}
        </p>
      </div>
    </div>
  );
};
