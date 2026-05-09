import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { BrainCircuit, X, Send, Loader2, Sparkles, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from '@google/genai';
import { cn } from '@/lib/utils';

interface GeminiAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  strategyContext?: any;
  analyticsContext?: string;
  isSidebarVariant?: boolean;
}

export const GeminiAssistant: React.FC<GeminiAssistantProps> = ({ isOpen, onClose, strategyContext, analyticsContext, isSidebarVariant }) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; content: string }[]>([
    { role: 'model', content: "System online. I am your Research Assistant. How can I help you validate Prop Firm rules or optimize your strategy logic today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Add strategyContext hook effect
  useEffect(() => {
    if (isOpen && (strategyContext || analyticsContext) && messages.length === 1) {
      let initMsg = '';
      if (strategyContext) {
         initMsg += `Current Strategy Context:\nName: ${strategyContext.name}\nBalance: ${strategyContext.initialBalance}\nRules: Entry - ${strategyContext.rules?.entry || 'none'}, Exit - ${strategyContext.rules?.exit || 'none'}\nProp Firm: ${strategyContext.isPropFirm ? `${strategyContext.propConfig?.firmName} - ${strategyContext.propConfig?.rules}` : 'None'}\n`;
      }
      if (analyticsContext) {
         initMsg += `\nAnalytics Snapshot:\n${analyticsContext}`;
      }
      setMessages(prev => [
        ...prev,
        { role: 'user', content: initMsg },
        { role: 'model', content: `I have received the context for your workspace. What would you like to know or optimize? I can analyze your sessions, drawdowns, and strategy drift.` }
      ]);
    }
  }, [isOpen, strategyContext, analyticsContext]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const apiKey = process.env.GEMINI_API_KEY || '';
      if (!apiKey) throw new Error('API Key missing');
      const ai = new GoogleGenAI({ apiKey });
      
      const systemPrompt = "You are an AI Trading Assistant specialized in Prop Firm rules (FTMO, Topstep, MyFundedFX, etc.) and quantitative trading strategies. Be concise, technical, and high-contrast in your analysis. Use points for clarity.";
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          { role: 'user', parts: [{ text: systemPrompt }] },
          ...messages.map(m => ({
            role: m.role,
            parts: [{ text: m.content }]
          })),
          { role: 'user', parts: [{ text: userMsg }] }
        ],
      });

      const responseText = response.text || "No response received.";
      setMessages(prev => [...prev, { role: 'model', content: responseText }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', content: "Error communicating with Gemini Core. Check link status." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {!isSidebarVariant && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
          )}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={cn(
              "shadow-2xl flex flex-col transition-colors",
              isSidebarVariant 
                ? "w-full h-full bg-sidebar border-0" 
                : "fixed right-0 top-0 h-screen w-[400px] z-[60] bg-background border-l border-border"
            )}
          >
            {!isSidebarVariant && (
              <CardHeader className="border-b border-border p-4 shrink-0 flex flex-row items-center justify-between bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-slate-950">
                    <BrainCircuit className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-[11px] font-black text-foreground uppercase tracking-widest flex items-center gap-2">
                      Cortex Research Assistant
                    </CardTitle>
                    <div className="flex items-center gap-1.5 opacity-60">
                      <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                      <span className="text-[9px] font-black uppercase tracking-tighter">Gemini v1.5 Flash Connected</span>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive">
                  <X className="h-5 w-5" />
                </Button>
              </CardHeader>
            )}
            
            <ScrollArea className="flex-1 p-6" viewportRef={scrollRef}>
              <div className="space-y-6">
                {messages.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={cn(
                      "flex flex-col gap-2",
                      m.role === 'user' ? "items-end" : "items-start"
                    )}
                  >
                    <div className={cn(
                      "max-w-[85%] p-3 text-[11px] font-bold leading-relaxed shadow-sm",
                      m.role === 'user' 
                        ? "bg-primary text-slate-950 rounded-l-xl rounded-tr-xl" 
                        : "bg-muted border border-border text-foreground rounded-r-xl rounded-tl-xl"
                    )}>
                      {m.content}
                    </div>
                  </motion.div>
                ))}
                {loading && (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest animate-pulse">Processing cortex logic...</span>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="p-4 border-t border-border bg-muted/30">
              <div className="flex gap-2">
                <Input 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask about Prop Firm limits or strategy bias..."
                  className="bg-card border-border h-10 text-xs font-bold focus:ring-primary"
                />
                <Button onClick={handleSend} disabled={loading} className="h-10 w-10 p-0 bg-primary text-slate-950">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center justify-center gap-4 mt-3 opacity-40">
                <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-tighter">
                  <ShieldCheck className="h-3 w-3" /> Rule Match
                </div>
                <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-tighter">
                  <Sparkles className="h-3 w-3 text-primary" /> Alpha Insight
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
