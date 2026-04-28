import React from 'react';
import { Button } from '@/components/ui/button';
import { TacticalCard } from '@/components/ui/TacticalCard';
import { cn } from '@/utils/cn';
import { Sparkles, RotateCcw } from 'lucide-react';

interface AnalyticVerticalControlsProps {
  analyticOptions: { id: string; label: string }[];
  analyticComponents: string[];
  setAnalyticComponents: React.Dispatch<React.SetStateAction<string[]>>;
  onOptimize: () => void;
  onUpdateKnowledgeMap: () => void;
}

export function AnalyticVerticalControls({
  analyticOptions,
  analyticComponents,
  setAnalyticComponents,
  onOptimize,
  onUpdateKnowledgeMap
}: AnalyticVerticalControlsProps) {
  const toggleSelection = (id: string) => {
    setAnalyticComponents(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <TacticalCard title="АНАЛІТИЧНИЙ ІНТЕЛЕКТ" variant="cyber" className="border-rose-500/30">
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-1 gap-2">
           {analyticOptions.map(opt => (
             <label key={opt.id} className={cn("flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer", 
               analyticComponents.includes(opt.id) ? "bg-rose-500/10 border-rose-500/40" : "bg-black/20 border-white/5 hover:border-white/10")}>
                <input 
                  type="checkbox" 
                  checked={analyticComponents.includes(opt.id)} 
                  onChange={() => toggleSelection(opt.id)} 
                  className="accent-rose-500 w-4 h-4" 
                />
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-200">{opt.label}</span>
                  {analyticComponents.includes(opt.id) && <span className="text-[8px] text-rose-400 animate-pulse uppercase tracking-[0.2em]">ОНОВЛЕННЯ ПАТЕ НУ АКТИВНЕ</span>}
                </div>
             </label>
           ))}
        </div>
        <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
           <Button onClick={onOptimize} variant="neon" className="w-full bg-rose-600/20 text-rose-400 border-rose-500/50 font-black uppercase tracking-widest text-[10px] h-11"><Sparkles size={14} className="mr-2"/> Оновити Знання</Button>
           <Button onClick={onUpdateKnowledgeMap} variant="cyber" className="w-full text-[10px] h-11"><RotateCcw size={14} className="mr-2"/> Синхронізувати Гравітацію Фактів</Button>
        </div>
      </div>
    </TacticalCard>
  );
}
