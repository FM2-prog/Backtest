import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trade } from '../../types';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TradeHistoryProps {
  trades: Trade[];
}

export const TradeHistory: React.FC<TradeHistoryProps> = ({ trades }) => {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
      <ScrollArea className="h-[450px]">
        <Table>
          <TableHeader className="bg-muted sticky top-0 z-10 shadow-sm border-b border-border">
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="w-[100px] text-[10px] uppercase font-black text-muted-foreground tracking-widest">Timestamp</TableHead>
              <TableHead className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Asset</TableHead>
              <TableHead className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Side</TableHead>
              <TableHead className="text-[10px] uppercase font-black text-muted-foreground tracking-widest text-right">Lots</TableHead>
              <TableHead className="text-[10px] uppercase font-black text-muted-foreground tracking-widest text-right">Entry</TableHead>
              <TableHead className="text-[10px] uppercase font-black text-muted-foreground tracking-widest text-right">Exit</TableHead>
              <TableHead className="text-[10px] uppercase font-black text-muted-foreground tracking-widest text-right">PnL Δ</TableHead>
              <TableHead className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Metrics</TableHead>
              <TableHead className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Psych</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trades.length > 0 ? (
              trades.slice().reverse().map((trade) => (
                <TableRow key={trade.id} className="border-border hover:bg-muted/50 group transition-colors">
                  <TableCell className="font-mono text-[9px] text-muted-foreground font-bold">
                    {new Date(trade.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })}
                  </TableCell>
                  <TableCell className="font-black text-foreground tracking-tight">{trade.pair}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn(
                      "text-[9px] px-1.5 py-0 font-bold border-0 bg-opacity-10",
                      trade.side === 'long' ? "text-success bg-success" : "text-destructive bg-destructive"
                    )}>
                      {trade.side.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-[11px] text-right text-foreground/80 font-bold">{trade.lots.toFixed(2)}</TableCell>
                  <TableCell className="font-mono text-[11px] text-right text-foreground/80 font-bold">{trade.entryPrice.toLocaleString()}</TableCell>
                  <TableCell className="font-mono text-[11px] text-right text-foreground/80 font-bold">{trade.exitPrice.toLocaleString()}</TableCell>
                  <TableCell className={cn(
                    "font-mono font-black text-right",
                    trade.pnlPercentage > 0 ? "text-success" : trade.pnlPercentage < 0 ? "text-destructive" : "text-muted-foreground"
                  )}>
                    {trade.pnlPercentage > 0 ? '+' : ''}{trade.pnlPercentage.toFixed(2)}%
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <div className="flex gap-1 text-[8px] font-mono text-muted-foreground/60">
                        {trade.tpPercent && <span>T{trade.tpPercent}%</span>}
                        {trade.maePercent && <span>M{trade.maePercent}%</span>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-base group-hover:scale-110 transition-transform inline-block grayscale group-hover:grayscale-0">
                      {trade.emotion === 'calm' && '😌'}
                      {trade.emotion === 'fomo' && '🚀'}
                      {trade.emotion === 'revenge' && '😡'}
                      {trade.emotion === 'greedy' && '🤑'}
                      {trade.emotion === 'fearful' && '😨'}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="h-48 text-center text-muted-foreground italic text-xs font-mono font-bold">
                  &gt; STANDBY: Waiting for trade data...
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
};
