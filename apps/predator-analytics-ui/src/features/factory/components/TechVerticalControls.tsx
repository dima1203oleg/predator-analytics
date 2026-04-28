import React from 'react';
import { Button } from '@/components/ui/button';
import { TacticalCard } from '@/components/ui/TacticalCard';
import { cn } from '@/utils/cn';
import { Wrench, History, Scan } from 'lucide-react';

interface TechVerticalControlsProps {
  techOptions: { id: string; label: string }[];
  techComponents: string[];
  setTechComponents: React.Dispatch<React.SetStateAction<string[]>>;
  onOptimize: () => void;
}

export function TechVerticalControls({
  techOptions,
  techComponents,
  setTechComponents,
  onOptimize
}: TechVerticalControlsProps) {
  const toggleSelection = (id: string) => {
    setTechComponents(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <TacticalCard title="ТЕХНОЛОГІЧНИЙ СТЕК" variant="cyber" className="border-yellow-500/30">
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-1 gap-2">
           {techOptions.map(opt => (
             <label key={opt.id} className={cn("flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer", 
               techComponents.includes(opt.id) ? "bg-yellow-500/10 border-yellow-500/40" : "bg-black/20 border-white/5 hover:border-white/10")}>
                <input 
                  type="checkbox" 
                  checked={techComponents.includes(opt.id)} 
                  onChange={() => toggleSelection(opt.id)} 
                  className="accent-yellow-500 w-4 h-4" 
                />
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-200">{opt.label}</span>
                  {techComponents.includes(opt.id) && <span className="text-[8px] text-yellow-400 animate-pulse uppercase tracking-[0.2em]">П� ИЗНАЧЕНО ДЛЯ ОПТИМІЗАЦІЇ</span>}
                </div>
             </label>
           ))}
        </div>
        <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
           <Button onClick={onOptimize} variant="neon" className="w-full bg-yellow-600/20 text-yellow-400 border-yellow-500/50 font-black uppercase tracking-widest text-[10px] h-11"><Wrench size={14} className="mr-2"/> Оптимізувати Ядро</Button>
           <div className="grid grid-cols-2 gap-2">
             <Button variant="cyber" className="text-[9px] h-9"><History size={12} className="mr-1"/> Відкат (Rollback)</Button>
             <Button variant="cyber" className="text-[9px] h-9 text-emerald-400 border-emerald-500/20"><Scan size={12} className="mr-1"/> Сканування Безпеки</Button>
           </div>
        </div>
      </div>
    </TacticalCard>
  );
}
