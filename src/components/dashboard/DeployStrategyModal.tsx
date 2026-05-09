import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Target, Zap, Shield, Sparkles, X, Bot } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Strategy } from '../../types';
import { GeminiAssistant } from './GeminiAssistant';
import { cn } from '@/lib/utils';

interface DeployStrategyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (strategy: Partial<Strategy>) => void;
  initialData?: Partial<Strategy>;
  isEditing?: boolean;
}

export const DeployStrategyModal: React.FC<DeployStrategyModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  isEditing
}) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [newStrategy, setNewStrategy] = useState<Partial<Strategy>>({
    name: '',
    initialBalance: 25000,
    rules: { entry: '', exit: '' },
    isPropFirm: false,
    propConfig: { firmName: '', accountType: '', rules: '' }
  });

  useEffect(() => {
    if (isOpen && initialData) {
      setNewStrategy({
        ...initialData,
        rules: { ...initialData.rules } as any,
        propConfig: initialData.propConfig ? { ...initialData.propConfig } : { firmName: '', accountType: '', rules: '' }
      });
    } else if (isOpen && !initialData) {
      setNewStrategy({
        name: '',
        initialBalance: 25000,
        rules: { entry: '', exit: '' },
        isPropFirm: false,
        propConfig: { firmName: '', accountType: '', rules: '' }
      });
    }
  }, [isOpen, initialData]);

  const handleSave = () => {
    onSave(newStrategy);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-background/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={cn(
              "w-full h-[85vh] relative flex transition-[max-width,gap] duration-500 ease-in-out",
              isChatOpen ? "max-w-6xl gap-4" : "max-w-2xl gap-0"
            )}
          >
            {/* Close Button top-right absolute */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose} 
              className="absolute -top-12 right-0 text-slate-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </Button>

            {/* Left Side: Configurator */}
            <Card className={cn(
              "bg-card border-border shadow-md flex flex-col h-full overflow-hidden relative shrink-0 transition-[width] duration-500 ease-in-out",
              isChatOpen ? "w-[calc(50%-8px)]" : "w-full"
            )}>
              <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                <Zap className="w-64 h-64 text-primary" />
              </div>
              <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-card">
                <div>
                  <h2 className="text-xl font-black uppercase tracking-widest text-white">
                    {isEditing ? 'EDIT STRATEGY' : 'DEPLOY NEW STRATEGY'}
                  </h2>
                  <p className="text-slate-400 font-mono text-[10px] mt-1">Configure your systematic edge and parameters.</p>
                </div>
              </div>
              
              <CardContent className="p-6 relative z-10 overflow-y-auto flex-1 custom-scrollbar">
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-[10px] uppercase font-black text-slate-500">Strategy name</Label>
                      <Input 
                        id="name" 
                        placeholder="e.g. Gamma Scalper" 
                        className="bg-background border-border focus:ring-primary h-10 font-mono text-sm text-foreground rounded-lg"
                        value={newStrategy.name}
                        onChange={(e) => setNewStrategy({...newStrategy, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="balance" className="text-[10px] uppercase font-black text-slate-500">Init. Balance</Label>
                      <Input 
                        id="balance" 
                        type="number" 
                        placeholder="25000" 
                        className="bg-background border-border focus:ring-primary h-10 font-mono text-sm text-foreground rounded-lg"
                        value={newStrategy.initialBalance}
                        onChange={(e) => setNewStrategy({...newStrategy, initialBalance: Number(e.target.value)})}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-black text-slate-500">Entry Logic</Label>
                    <Textarea 
                      placeholder="Define entry triggers..." 
                      className="bg-background border-border font-mono text-xs text-foreground min-h-[80px] rounded-lg"
                      value={newStrategy.rules?.entry}
                      onChange={(e) => setNewStrategy({...newStrategy, rules: { ...newStrategy.rules!, entry: e.target.value }})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-black text-slate-500">Exit Logic</Label>
                    <Textarea 
                      placeholder="Define manual or automated exits..." 
                      className="bg-background border-border font-mono text-xs text-foreground min-h-[80px] rounded-lg"
                      value={newStrategy.rules?.exit}
                      onChange={(e) => setNewStrategy({...newStrategy, rules: { ...newStrategy.rules!, exit: e.target.value }})}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-background border border-border">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-black uppercase text-white">Prop Firm Sync</Label>
                      <p className="text-[10px] text-slate-500 font-mono">Enable funding rules evaluation</p>
                    </div>
                    <Switch 
                      checked={newStrategy.isPropFirm}
                      onCheckedChange={(checked) => setNewStrategy({...newStrategy, isPropFirm: checked})}
                    />
                  </div>

                  <AnimatePresence>
                    {newStrategy.isPropFirm && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="space-y-4 overflow-hidden"
                      >
                        <div className="grid grid-cols-2 gap-4 pt-2">
                          <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-black text-slate-500">Firm Name</Label>
                            <Input 
                              placeholder="FTMO, Topstep..." 
                              className="bg-background border-border h-9 text-xs font-mono text-foreground rounded-lg"
                              value={newStrategy.propConfig?.firmName}
                              onChange={(e) => setNewStrategy({
                                ...newStrategy, 
                                propConfig: { ...newStrategy.propConfig!, firmName: e.target.value }
                              })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-black text-slate-500">Type</Label>
                            <Input 
                              placeholder="Evaluation, Instant..." 
                              className="bg-background border-border h-9 text-xs font-mono text-foreground rounded-lg"
                              value={newStrategy.propConfig?.accountType}
                              onChange={(e) => setNewStrategy({
                                ...newStrategy, 
                                propConfig: { ...newStrategy.propConfig!, accountType: e.target.value }
                              })}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase font-black text-slate-500">Risk Rules</Label>
                          <Textarea 
                            placeholder="Max daily: 5%, Max total: 10%..." 
                            className="bg-background border-border font-mono text-xs text-foreground min-h-[60px] rounded-lg"
                            value={newStrategy.propConfig?.rules}
                            onChange={(e) => setNewStrategy({
                              ...newStrategy, 
                              propConfig: { ...newStrategy.propConfig!, rules: e.target.value }
                            })}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="pt-2 border-t border-border mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsChatOpen(!isChatOpen)}
                      className={cn(
                        "w-full h-11 font-black uppercase text-[10px] tracking-widest flex justify-center items-center gap-2 transition-all mt-4",
                        isChatOpen 
                         ? "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white" 
                         : "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20"
                      )}
                    >
                      <Sparkles className="w-4 h-4" />
                      {isChatOpen ? 'CERRAR CORTEX' : 'CONSULTAR CORTEX'}
                    </Button>
                  </div>
                </div>
              </CardContent>
              <div className="p-4 border-t border-border bg-card">
                <Button 
                  onClick={handleSave}
                  className="w-full bg-primary text-primary-foreground font-black uppercase tracking-widest py-6 rounded-lg text-xs"
                >
                  {isEditing ? 'UPDATE STRATEGY ARCHIVE' : 'CREATE STRATEGY ARCHIVE'}
                </Button>
              </div>
            </Card>

            {/* Right Side: Chat Assistant */}
            <Card className={cn(
              "bg-card border-border shadow-md flex flex-col h-full overflow-hidden relative shrink-0 transition-[width,opacity,border] duration-500 ease-in-out border-l",
              isChatOpen ? "w-[calc(50%-8px)] opacity-100" : "w-0 opacity-0 border-transparent overflow-hidden"
            )}>
              <div className="px-5 py-4 border-b border-border flex justify-between items-center bg-card whitespace-nowrap min-w-[300px]">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center border border-primary/30">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black uppercase tracking-widest text-primary">
                      CORTEX RESEARCH ASSISTANT
                    </h2>
                    <p className="text-slate-400 font-mono text-[9px] mt-0.5">Real-time strategy validation and insight.</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsChatOpen(false)} 
                  className="text-slate-400 hover:text-white shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex-1 relative overflow-hidden min-w-[300px]">
                <GeminiAssistant 
                  isOpen={true} 
                  onClose={() => setIsChatOpen(false)} 
                  isSidebarVariant={true}
                  strategyContext={newStrategy}
                />
              </div>
            </Card>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
