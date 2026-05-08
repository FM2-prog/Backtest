import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Strategy } from '../../types';
import { Plus, Target, Shield, Briefcase, Zap, Settings } from 'lucide-react';
import { motion } from 'motion/react';

interface StrategyManagerProps {
  strategies: Strategy[];
  onAddStrategy: (strategy: Strategy) => void;
}

export const StrategyManager: React.FC<StrategyManagerProps> = ({ strategies, onAddStrategy }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black tracking-tight text-foreground">STRATEGY REPOSITORY</h2>
          <p className="text-xs text-muted-foreground font-bold">Configure rule-sets and Prop Firm constraints.</p>
        </div>
        <Button className="h-9 px-4 text-[10px] font-black uppercase tracking-widest gap-2 bg-primary text-primary-foreground">
          <Plus className="h-4 w-4" />
          Deploy New Strategy
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {strategies.map((strategy, i) => (
          <motion.div
            key={strategy.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="bg-card border border-border overflow-hidden group hover:border-primary/50 transition-all">
              <CardHeader className="p-5 border-b border-border flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <Target className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-black text-foreground uppercase tracking-tight">
                      {strategy.name}
                    </CardTitle>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-70">
                      Balance Init: ${strategy.initialBalance.toLocaleString()}
                    </p>
                  </div>
                </div>
                {strategy.isPropFirm && (
                  <div className="px-2 py-1 bg-primary text-slate-950 rounded text-[9px] font-black uppercase tracking-tighter">
                    Prop Firm Sync
                  </div>
                )}
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-black text-muted-foreground opacity-50 tracking-widest">Entry Logic</Label>
                    <div className="p-2 bg-muted rounded font-mono text-[10px] font-bold text-foreground">
                      {strategy.rules.entry}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-black text-muted-foreground opacity-50 tracking-widest">Exit Logic</Label>
                    <div className="p-2 bg-muted rounded font-mono text-[10px] font-bold text-foreground">
                      {strategy.rules.exit}
                    </div>
                  </div>
                </div>

                {strategy.isPropFirm && strategy.propConfig && (
                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-3.5 w-3.5 text-primary" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Risk Parameters ({strategy.propConfig.firmName})</span>
                    </div>
                    <p className="text-[11px] font-bold text-muted-foreground leading-relaxed italic">
                      {strategy.propConfig.rules}
                    </p>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1 text-[10px] font-black uppercase tracking-wider bg-muted h-8 border-border">
                    <Briefcase className="h-3.5 w-3.5 mr-2" /> View Performance
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 border-border">
                    <Settings className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        <Card className="bg-muted/50 border border-dashed border-border flex flex-col items-center justify-center p-8 text-center min-h-[250px]">
          <Zap className="h-8 w-8 text-muted-foreground mb-4 opacity-20" />
          <p className="text-[11px] font-bold text-muted-foreground tracking-tight max-w-[200px]">
            Define a new systematic rule-set to start capturing high-alpha data.
          </p>
        </Card>
      </div>
    </div>
  );
};
