import React from 'react';
import { motion } from 'framer-motion';
import { 
  Bug, Flame, Wrench, Loader2, CheckCircle2
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { type FactoryBugRecord } from '../systemFactoryView.utils';

export interface FactoryBugFixPanelProps {
  bugs: FactoryBugRecord[];
  handleFixBug: (bugId: string) => void;
}

export const FactoryBugFixPanel: React.FC<FactoryBugFixPanelProps> = ({
  bugs,
  handleFixBug
}) => {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {bugs.map(bug => (
          <motion.div key={bug.id} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className={cn(
            "p-4 rounded-xl border backdrop-blur-md flex items-center justify-between transition-all",
            bug.status === 'fixed' && "bg-emerald-950/20 border-emerald-500/20",
            bug.status === 'fixing' && "bg-rose-950/20 border-rose-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]",
            bug.status === 'detected' && "bg-rose-950/10 border-rose-500/10",
          )}>
            <div className="flex items-center gap-4 w-full">
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border",
                bug.severity === 'critical' ? "bg-rose-600/20 text-rose-400 border-rose-500/50" : 
                bug.severity === 'high' ? "bg-orange-500/20 text-orange-400 border-orange-500/50" : 
                bug.severity === 'medium' ? "bg-rose-500/20 text-rose-400 border-rose-500/50" : "bg-slate-700/20 text-slate-400 border-slate-500/50"
              )}>
                 {bug.severity === 'critical' || bug.severity === 'high' ? <Flame size={18} /> : <Bug size={18} />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono text-slate-500">{bug.id}</span>
                  <Badge variant={bug.severity === 'critical' ? 'destructive' : bug.severity === 'high' ? 'outline' : 'default'} className={cn("text-[9px]", 
                      bug.severity === 'critical' && "bg-rose-600/20 text-rose-400",
                      bug.severity === 'high' && "bg-orange-500/20 text-orange-400",
                      bug.severity === 'medium' && "bg-rose-500/20 text-rose-400",
                      bug.severity === 'low' && "bg-slate-700/20 text-slate-400"
                  )}>{bug.severity}</Badge>
                  <span className="text-[10px] text-slate-500 font-mono">{bug.component}</span>
                </div>
                <p className="text-sm text-white/90 mb-1">{bug.description}</p>
                <p className="text-[10px] text-slate-500 font-mono">{bug.file}</p>
                
                <div className="mt-2">
                  {bug.status === 'fixing' && (
                    <div className="flex items-center gap-2 flex-1 max-w-[200px]">
                      <span className="text-rose-400 font-mono font-black">{bug.fixProgress}%</span>
                      <div className="h-1.5 flex-1 bg-black/50 rounded-full overflow-hidden border border-white/5">
                        <motion.div 
                          className="h-full bg-gradient-to-r from-rose-500 to-emerald-500 rounded-full"
                          animate={{ width: `${bug.fixProgress}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="shrink-0">
                {bug.status === 'detected' && (
                  <Button variant="neon" size="sm" className="bg-rose-600/20 text-rose-300 border-rose-500/50 text-[9px] uppercase font-black" onClick={() => handleFixBug(bug.id)}>
                    <Wrench size={12} className="mr-1" /> Виправити
                  </Button>
                )}
                {bug.status === 'fixing' && (
                  <div className="flex items-center gap-2 text-rose-400 text-[10px] font-mono">
                    <Loader2 size={14} className="animate-spin" /> ВИП АВЛЕННЯ...
                  </div>
                )}
                {bug.status === 'fixed' && (
                  <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-black uppercase">
                    <CheckCircle2 size={16} /> ВИП АВЛЕНО
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
