import { Button } from '@/components/ui/button';
import React from 'react';
import { useUiStore } from '../../core/state/ui.store';
import { cn } from '../../utils/cn';

export const TopBar: React.FC = () => {
  const activePanel = useUiStore((state) => state.activePanel);
  const setActivePanel = useUiStore((state) => state.setActivePanel);

  return (
    <div className="absolute top-0 left-16 right-0 h-12 bg-black/40 backdrop-blur-xl border-b border-gray-800 flex items-center justify-between px-6 pointer-events-auto">
      <div className="flex items-center gap-4 text-sm font-mono text-slate-300">
        <span className="text-teal-400 font-bold tracking-widest">PREDATOR</span>
        <span className="text-gray-600">/</span>
        <span>THE OBSERVATORY</span>
      </div>

      <div className="flex items-center gap-2 bg-black border border-white/10 rounded-lg p-1">
        <Button variant="cyber" 
          onClick={() => setActivePanel('graph')}
          className={cn(
            "px-4 py-1 rounded text-xs font-bold tracking-widest uppercase transition-colors",
            activePanel === 'graph' ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"
          )}
        >
          ГРАФ
        </Button>
        <Button variant="cyber" 
          onClick={() => setActivePanel('map')}
          className={cn(
            "px-4 py-1 rounded text-xs font-bold tracking-widest uppercase transition-colors",
            activePanel === 'map' ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"
          )}
        >
          КАРТА
        </Button>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search entities..." 
            className="bg-black/50 border border-gray-700 rounded-md px-3 py-1 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-teal-500 transition-colors w-64"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs text-gray-400 uppercase tracking-widest">Environment: PROD</span>
        </div>
      </div>
    </div>
  );
};
