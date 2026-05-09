import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trade } from '../../types';
import { PlusCircle, Target, Shield, Activity, Briefcase, Calendar, Coins, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useBacktest } from '../../context/BacktestContext';

export const TradeForm: React.FC = () => {
  const { strategies, addTrade } = useBacktest();
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const now = new Date();
  const defaultEntryTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const { register, handleSubmit, reset, setValue, watch } = useForm<any>({
    defaultValues: {
      pair: '',
      side: 'long',
      riskAmount: 1,
      emotion: 'calm',
      strategyId: '',
      lots: 1,
      entryTimestamp: now.toISOString().split('T')[0],
      entryTime: defaultEntryTime,
      exitTime: '',
      tpPercent: 2,
      slPercent: 1,
      maePercent: 0,
      mfePercent: 0,
    }
  });

  const handleTimeInput = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 4) val = val.substring(0, 4);
    if (val.length >= 3) {
      val = val.substring(0, 2) + ":" + val.substring(2);
    }
    setValue(fieldName as any, val);
  };

  const onSubmit = (data: any) => {
    if (!data.strategyId) {
      alert("Please select a Strategy ID. Trades must be linked to a strategy.");
      return;
    }

    const calculateDuration = (entry: string, exit: string) => {
      if (!entry || !exit) return 0;
      const [eH, eM] = entry.split(':').map(Number);
      const [xH, xM] = exit.split(':').map(Number);
      let durationMins = (xH * 60 + xM) - (eH * 60 + eM);
      if (durationMins < 0) {
        durationMins += 24 * 60; // overnight
      }
      return durationMins;
    };

    const duration = calculateDuration(data.entryTime, data.exitTime);
    const [eH, eM] = (data.entryTime || "00:00").split(':').map(Number);
    let session = 'Other';
    if (eH >= 8 && eH < 13) session = 'Ldn';
    else if (eH >= 13 && eH < 21) session = 'Ny';

    const entryDate = new Date(data.entryTimestamp);
    if (data.entryTime) entryDate.setUTCHours(eH, eM);
    
    const exitDate = new Date(entryDate);
    if (data.exitTime) {
      const [xH, xM] = data.exitTime.split(':').map(Number);
      exitDate.setUTCHours(xH, xM);
      if (exitDate.getTime() < entryDate.getTime()) {
         exitDate.setDate(exitDate.getDate() + 1);
      }
    }

    const entry = parseFloat(data.entryPrice);
    const exit = parseFloat(data.exitPrice);
    const side = data.side;
    
    const pnlReal = (side === 'long') 
  ? (exit - entry) * data.lots 
  : (entry - exit) * data.lots;

    const pnlPercentage = (side === 'long')
      ? ((exit - entry) / entry) * 100
      : ((entry - exit) / entry) * 100;

    const trade: Trade = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: entryDate.toISOString(),
      exitTimestamp: data.exitTime ? exitDate.toISOString() : undefined,
      entryTime: data.entryTime,
      exitTime: data.exitTime,
      duration,
      session,
      entryPrice: entry,
      exitPrice: exit,
      stopLoss: parseFloat(data.stopLoss),
      takeProfit: parseFloat(data.takeProfit),
      lots: parseFloat(data.lots),
      tpPercent: parseFloat(data.tpPercent),
      slPercent: parseFloat(data.slPercent),
      maePercent: parseFloat(data.maePercent),
      mfePercent: parseFloat(data.mfePercent),
      pnlPercentage,
      pnl: pnlReal,
      status: pnlReal > 0 ? 'win' : pnlReal < 0 ? 'loss' : 'breakeven',
      tags: [],
      ema45Proximity: 0,
      isEngulfingExit: false,
    };
    
    addTrade(trade);
    reset({ ...data, entryTime: defaultEntryTime, exitTime: '', entryPrice: '', exitPrice: '', notes: '' });
  };

  return (
    <Card className="bg-card border-border rounded-xl overflow-hidden shadow-sm grainy-texture relative h-full flex flex-col">
      <CardContent className="p-6 relative z-10 flex-1 flex flex-col justify-between">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-1">
            <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest flex items-center gap-2">
              <Briefcase className="h-3 w-3 text-primary" /> Select Strategy *
            </Label>
            <Select onValueChange={(v) => setValue('strategyId', v)}>
              <SelectTrigger className="bg-input border-border h-9 text-xs font-bold">
                <SelectValue placeholder="Link to Strategy..." />
              </SelectTrigger>
              <SelectContent>
                {strategies.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="entryTimestamp" className="text-[10px] uppercase font-black text-muted-foreground tracking-widest flex items-center gap-2">
                <Calendar className="h-3 w-3 text-primary" /> Entry Date
              </Label>
              <Input id="entryTimestamp" type="date" {...register('entryTimestamp')} className="bg-input border-border h-9 font-mono text-xs font-bold" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="lots" className="text-[10px] uppercase font-black text-muted-foreground tracking-widest flex items-center gap-2">
                <Coins className="h-3 w-3 text-primary" /> Lots
              </Label>
              <Input id="lots" type="number" step="0.01" {...register('lots')} className="bg-input border-border h-9 font-mono text-xs font-bold" placeholder="0.10" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="pair" className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Active Asset</Label>
              <Input id="pair" tabIndex={1} {...register('pair')} className="bg-input border-border h-9 font-mono text-xs font-bold focus:ring-1 focus:ring-primary" placeholder="BTCUSD" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Execution</Label>
              <Select onValueChange={(v) => setValue('side', v)} defaultValue="long">
                <SelectTrigger tabIndex={2} className="bg-input border-border h-9 text-xs font-bold">
                  <SelectValue placeholder="Side" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="long">Buy / Long</SelectItem>
                  <SelectItem value="short">Sell / Short</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-6 border-t border-border pt-4">
            <div className="flex flex-col gap-y-4">
              <div className="space-y-1">
                <Label htmlFor="entryPrice" className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Entry Price</Label>
                <Input id="entryPrice" tabIndex={3} type="number" step="0.00000001" {...register('entryPrice', { required: true })} className="bg-input border-border h-9 font-mono text-xs text-primary font-black w-full" />
              </div>
              <div className="space-y-1 min-w-[100px]">
                <Label htmlFor="entryTime" className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Entry Time</Label>
                <Input id="entryTime" tabIndex={4} value={watch('entryTime') || ''} onChange={(e) => handleTimeInput(e, 'entryTime')} className="bg-input border-border h-9 font-mono text-xs font-black w-full tracking-[0.2em]" placeholder="HH:MM" />
              </div>
            </div>
            <div className="flex flex-col gap-y-4">
              <div className="space-y-1">
                <Label htmlFor="exitPrice" className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Exit Price</Label>
                <Input id="exitPrice" tabIndex={5} type="number" step="0.00000001" {...register('exitPrice', { required: true })} className="bg-input border-border h-9 font-mono text-xs font-black w-full" />
              </div>
              <div className="space-y-1 min-w-[100px]">
                <Label htmlFor="exitTime" className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Exit Time</Label>
                <Input id="exitTime" tabIndex={6} value={watch('exitTime') || ''} onChange={(e) => handleTimeInput(e, 'exitTime')} className="bg-input border-border h-9 font-mono text-xs font-black w-full tracking-[0.2em]" placeholder="HH:MM" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-border pt-4">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest flex items-center gap-2">
                <Shield className="h-3 w-3 text-destructive" /> SL
              </Label>
              <Input id="stopLoss" tabIndex={7} type="number" step="0.00000001" {...register('stopLoss')} className="bg-input border-border h-8 font-mono text-xs font-bold" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest flex items-center gap-2">
                <Target className="h-3 w-3 text-success" /> TP
              </Label>
              <Input id="takeProfit" tabIndex={8} type="number" step="0.00000001" {...register('takeProfit')} className="bg-input border-border h-8 font-mono text-xs font-bold" />
            </div>
          </div>

          <div className="space-y-4 border-t border-border pt-4">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Psychology</Label>
              <Select onValueChange={(v) => setValue('emotion', v)} defaultValue="calm">
                <SelectTrigger className="bg-input border-border h-9 text-xs font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="calm">😌 Calm Execution</SelectItem>
                  <SelectItem value="fomo">🚀 FOMO Entry</SelectItem>
                  <SelectItem value="revenge">😡 Revenge Trading</SelectItem>
                  <SelectItem value="greedy">🤑 Greedy Exit</SelectItem>
                  <SelectItem value="fearful">😨 Fearful Management</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="pt-2">
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-[10px] uppercase font-black flex items-center gap-2 hover:bg-muted"
              >
                {showAdvanced ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                {showAdvanced ? 'Hide Advanced Metrics' : 'Show Advanced Metrics (TP/SL/MAE/MFE)'}
              </Button>

              <AnimatePresence>
                {showAdvanced && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 pb-2">
                      <div className="space-y-1">
                        <Label className="text-[9px] uppercase font-bold text-muted-foreground">TP (%)</Label>
                        <Input type="number" step="0.1" {...register('tpPercent')} className="bg-input border-border h-8 text-[10px] font-bold" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px] uppercase font-bold text-muted-foreground">SL (%)</Label>
                        <Input type="number" step="0.1" {...register('slPercent')} className="bg-input border-border h-8 text-[10px] font-bold" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px] uppercase font-bold text-muted-foreground">MAE (%)</Label>
                        <Input type="number" step="0.1" {...register('maePercent')} className="bg-input border-border h-8 text-[10px] font-bold" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px] uppercase font-bold text-muted-foreground">MFE (%)</Label>
                        <Input type="number" step="0.1" {...register('mfePercent')} className="bg-input border-border h-8 text-[10px] font-bold" />
                      </div>
                    </div>
                    <div className="space-y-1 pt-2">
                      <Label className="text-[9px] uppercase font-bold text-muted-foreground flex items-center gap-2">
                        <MessageSquare className="h-2 w-2" /> Comments / Notes
                      </Label>
                      <Input {...register('notes')} placeholder="Trade journal details..." className="bg-input border-border h-9 text-xs font-bold" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <Button type="submit" className="w-full h-11 text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/10 transition-all hover:scale-[1.01] active:scale-[0.99] bg-primary text-primary-foreground">
            <PlusCircle className="h-4 w-4 mr-2" />
            [ENTER] LOG TRADE
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
