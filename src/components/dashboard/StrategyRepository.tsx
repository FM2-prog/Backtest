import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Target, 
  Shield, 
  Briefcase, 
  Settings, 
  Zap, 
  Sparkles,
  Search,
  ExternalLink,
  ChevronRight,
  Trash,
  Edit2
} from 'lucide-react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Strategy } from '../../types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { PerformanceDashboard } from './PerformanceDashboard';
import { GeminiAssistant } from './GeminiAssistant';
import { DeployStrategyModal } from './DeployStrategyModal';
import { useBacktest } from '../../context/BacktestContext';

interface StrategyRepositoryProps {
  onBack?: () => void;
}

export const StrategyRepository: React.FC<StrategyRepositoryProps> = ({ onBack }) => {
  const { strategies, addStrategy, updateStrategy, deleteStrategy, setActiveStrategyId } = useBacktest();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  const [newStrategy, setNewStrategy] = useState<Partial<Strategy>>({
    name: '',
    initialBalance: 25000,
    rules: { entry: '', exit: '' },
    isPropFirm: false,
    propConfig: { firmName: '', accountType: '', rules: '' }
  });

  const handleSaveStrategy = (strategyData: Partial<Strategy>) => {
    if (editingId) {
      const strategy: Strategy = {
        id: editingId,
        name: strategyData.name || 'Unnamed Strategy',
        initialBalance: Number(strategyData.initialBalance) || 0,
        rules: strategyData.rules as { entry: string, exit: string },
        isPropFirm: !!strategyData.isPropFirm,
        propConfig: strategyData.isPropFirm ? strategyData.propConfig : undefined
      };
      updateStrategy(strategy);
    } else {
      const strategy: Strategy = {
        id: Math.random().toString(36).substr(2, 9),
        name: strategyData.name || 'Unnamed Strategy',
        initialBalance: Number(strategyData.initialBalance) || 0,
        rules: strategyData.rules as { entry: string, exit: string },
        isPropFirm: !!strategyData.isPropFirm,
        propConfig: strategyData.isPropFirm ? strategyData.propConfig : undefined
      };
      addStrategy(strategy);
    }
    closeModal();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setNewStrategy({
      name: '',
      initialBalance: 25000,
      rules: { entry: '', exit: '' },
      isPropFirm: false,
      propConfig: { firmName: '', accountType: '', rules: '' }
    });
  };

  const openEditModal = (strategy: Strategy) => {
    setEditingId(strategy.id);
    setNewStrategy({
      name: strategy.name,
      initialBalance: strategy.initialBalance,
      rules: { ...strategy.rules },
      isPropFirm: strategy.isPropFirm || false,
      propConfig: strategy.propConfig ? { ...strategy.propConfig } : { firmName: '', accountType: '', rules: '' }
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    if (deleteConfirmId === id) {
      deleteStrategy(id);
      setDeleteConfirmId(null);
    } else {
      setDeleteConfirmId(id);
      setTimeout(() => {
        setDeleteConfirmId(prev => (prev === id ? null : prev));
      }, 3000);
    }
  };

  const toggleGeminiChat = () => {
    setIsChatOpen(prev => !prev);
  };

  if (selectedStrategy) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="performance-dashboard"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="w-full"
        >
          <PerformanceDashboard 
            strategy={selectedStrategy} 
            onBack={() => setSelectedStrategy(null)} 
          />
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <div className="flex w-full relative">
      <div className="flex flex-col min-h-screen pb-32 overflow-y-auto w-full transition-all">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter text-foreground">
              Strategy Repository
            </h1>
            <p className="text-slate-300 text-sm font-medium mt-1">
              Configure rule-sets and Prop Firm constraints.
            </p>
          </div>
        </div>

        <DeployStrategyModal
          isOpen={isModalOpen}
          onClose={closeModal}
          onSave={handleSaveStrategy}
          initialData={newStrategy}
          isEditing={!!editingId}
        />

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

          {strategies.map((strategy, index) => (
            <motion.div
              key={strategy.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-card border-border shadow-sm relative overflow-hidden group h-full flex flex-col grainy-texture">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Target className="h-16 w-16" />
                </div>
                
                <CardContent className="p-6 flex flex-col h-full relative z-10">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-lg border border-border group-hover:border-primary/50 transition-colors">
                        <Target className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground tracking-tight">{strategy.name}</h3>
                        <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest mt-0.5">
                          BALANCE INIT: ${strategy.initialBalance.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {strategy.isPropFirm && (
                      <Badge className="bg-foreground text-background hover:bg-foreground/90 text-[9px] font-black uppercase px-2 py-0.5 tracking-tighter">
                        PROP FIRM SYNC
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-4 mb-6 flex-1">
                    <div>
                      <label className="text-[9px] uppercase font-black text-muted-foreground mb-1.5 block tracking-widest">Entry Logic</label>
                      <div className="bg-input p-3 rounded-lg border border-border">
                        <code className="text-[11px] font-mono text-foreground leading-relaxed block overflow-hidden text-ellipsis whitespace-nowrap">
                          {strategy.rules.entry}
                        </code>
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] uppercase font-black text-muted-foreground mb-1.5 block tracking-widest">Exit Logic</label>
                      <div className="bg-input p-3 rounded-lg border border-border">
                        <code className="text-[11px] font-mono text-foreground leading-relaxed block overflow-hidden text-ellipsis whitespace-nowrap">
                          {strategy.rules.exit}
                        </code>
                      </div>
                    </div>

                    {strategy.isPropFirm && strategy.propConfig && (
                      <div className="pt-4 border-t border-border">
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="h-3 w-3 text-primary" />
                          <span className="text-[10px] uppercase font-black text-foreground/90">
                            RISK PARAMETERS ({strategy.propConfig.firmName})
                          </span>
                        </div>
                        <div className="bg-primary/5 p-3 rounded-lg border border-primary/20">
                          <p className="text-[10px] font-mono text-primary font-bold">
                            {strategy.propConfig.rules}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 mt-auto">
                    <Button 
                      onClick={() => {
                        setSelectedStrategy(strategy);
                      }}
                      className="flex-1 bg-muted border border-border hover:bg-accent text-foreground font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"
                    >
                      <Briefcase className="h-3 w-3" />
                      View Performance
                    </Button>
                    <Button 
                      size="icon" 
                      variant="outline" 
                      className="border-border hover:bg-muted text-muted-foreground group relative"
                      onClick={() => {
                        openEditModal(strategy);
                        // Scroll to top to see form
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    >
                      <Settings className="h-4 w-4 relative z-10 transition-transform hover:scale-110 group-hover:text-primary" />
                    </Button>
                    <Button 
                      size={deleteConfirmId === strategy.id ? "default" : "icon"} 
                      variant={deleteConfirmId === strategy.id ? "destructive" : "outline"} 
                      className={cn(
                        "transition-all duration-300",
                        deleteConfirmId === strategy.id 
                          ? "bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] uppercase tracking-wider px-3 border border-red-500"
                          : "border-red-500/20 hover:bg-red-500/10 hover:border-red-500/50 text-red-500 hover:text-red-400"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(strategy.id);
                      }}
                    >
                      <Trash className={cn("h-4 w-4", deleteConfirmId === strategy.id && "mr-2")} />
                      {deleteConfirmId === strategy.id && "Confirm"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}

          {/* Phantom Card */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            onClick={() => {
              setIsModalOpen(true);
            }}
            className="group cursor-pointer xl:col-span-1"
          >
              <div className="h-full min-h-[350px] border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center p-8 text-center hover:bg-muted transition-all grainy-texture">
                <div className="p-4 bg-muted rounded-full border border-border mb-4 group-hover:scale-110 transition-transform relative z-10">
                  <Zap className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <h3 className="text-foreground font-bold mb-2 relative z-10">Deploy New Logic</h3>
                <p className="text-muted-foreground text-xs max-w-[200px] leading-relaxed mx-auto relative z-10">
                  Define a new systematic rule-set to start capturing high-alpha data.
                </p>
              </div>
            </motion.div>
        </div>
      </div>
    </div>
  );
};
