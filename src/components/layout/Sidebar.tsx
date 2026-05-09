import React from 'react';
import { LayoutDashboard, TrendingUp, History, Settings, Sun, Moon, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, theme, setTheme }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Terminal Entry', icon: LayoutDashboard },
    { id: 'history', label: 'Log History', icon: History },
    { id: 'strategy', label: 'Strategy Repo', icon: TrendingUp },
    { id: 'performance', label: 'performance', icon: Calendar },
  ];

  return (
    <div className="w-56 h-screen bg-sidebar border-r border-border flex flex-col p-4 gap-8">
      <div className="flex items-center gap-3 px-2 py-4">
        <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center font-bold text-slate-950">QA</div>
        <div className="flex flex-col">
          <span className="text-sm font-black tracking-tight text-foreground">QUANT AUDIT</span>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">Trading Terminal</p>
          <nav className="flex flex-col gap-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded transition-all duration-200 text-xs font-bold",
                  activeTab === item.id 
                    ? "bg-primary/10 border border-primary/20 text-primary shadow-sm" 
                    : "text-foreground hover:bg-muted"
                )}
              >
                <item.icon className={cn("h-3.5 w-3.5", activeTab === item.id ? "text-primary" : "text-muted-foreground")} />
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="mt-auto flex flex-col gap-2 pt-4 border-t border-border">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="justify-start gap-3 h-8 text-xs text-foreground font-bold px-2"
        >
          {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </Button>
        <Button variant="ghost" size="sm" className="justify-start gap-3 h-8 text-xs text-foreground font-bold px-2">
          <Settings className="h-3.5 w-3.5 text-muted-foreground" />
          Settings
        </Button>
      </div>
    </div>
  );
};
