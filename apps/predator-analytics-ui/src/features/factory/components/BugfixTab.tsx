import React from 'react';
import { motion } from 'framer-motion';
import { Bug, AlertTriangle, CheckCircle2, Search, XCircle, Wrench, FileText } from 'lucide-react';
import { TacticalCard } from '@/components/ui/TacticalCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/utils/cn';
import { RiskLevelValue } from '@/types/intelligence';

type BugSeverity = RiskLevelValue;
type BugStatus = 'detected' | 'fixing' | 'fixed';

interface BugRecord {
  id: string;
  description: string;
  severity: BugSeverity;
  component: string;
  file: string;
  status: BugStatus;
  fixProgress: number;
}

interface BugfixTabProps {
  bugs: BugRecord[];
  handleFixBug: (id: string) => void;
  refreshData: () => void;
}

export const BugfixTab: React.FC<BugfixTabProps> = ({
  bugs,
  handleFixBug,
  refreshData
}) => {
  const getSeverityColor = (sev: BugSeverity) => {
    switch (sev) {
      case 'CRITICAL': return 'text-rose-500';
      case 'HIGH': return 'text-orange-500';
      case 'MEDIUM': return 'text-yellow-500';
      default: return 'text-emerald-500';
    }
  };

  const getStatusBadge = (status: BugStatus) => {
    switch (status) {
      case 'fixed': return <Badge variant="cyber" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">ВИПРАВЛЕНО</Badge>;
      case 'fixing': return <Badge variant="neon" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20 animate-pulse">ВИПРАВЛЕННЯ...</Badge>;
      default: return <Badge variant="neon" className="bg-rose-500/10 text-rose-400 border-rose-500/20">ВИЯВЛЕНО</Badge>;
    }
  };

  return (
    <motion.div 
      key="bugfix" 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      className="space-y-6"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.2)]">
            <Bug size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black uppercase tracking-[0.2em] text-white">Центр Авто-Виправлення</h3>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mt-1">Виявлення та автоматичне усунення дефектів коду</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <div className="bg-black/40 border border-white/5 rounded-xl px-4 py-2 flex items-center gap-3">
              <span className="text-[10px] font-black uppercase text-slate-500">Загалом:</span>
              <span className="text-sm font-black text-white font-mono">{bugs.length}</span>
           </div>
           <Button variant="cyber" size="sm" onClick={refreshData} className="h-10 text-[10px] font-black uppercase tracking-widest bg-slate-800 border-white/10 hover:border-rose-500/50">
             Сканувати знову
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {bugs.length > 0 ? bugs.map((bug) => (
          <TacticalCard 
            key={bug.id} 
            variant="minimal" 
            className={cn(
              "border-rose-500/10 bg-slate-900/40 transition-all hover:bg-rose-500/5 hover:border-rose-500/30 group",
              bug.status === 'fixing' && "border-yellow-500/30 bg-yellow-500/5"
            )}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-2">
              <div className="flex items-start gap-5">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center border shadow-lg shrink-0 transition-transform group-hover:scale-110",
                  bug.status === 'fixed' ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-rose-500/10 border-rose-500/30 text-rose-400"
                )}>
                  {bug.status === 'fixed' ? <CheckCircle2 size={24} /> : bug.severity === 'CRITICAL' ? <XCircle size={24} /> : <AlertTriangle size={24} />}
                </div>
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-[11px] font-black uppercase tracking-widest text-white">{bug.id}</span>
                    <Badge variant="outline" className={cn("text-[8px] font-mono", getSeverityColor(bug.severity))}>{bug.severity}</Badge>
                    {getStatusBadge(bug.status)}
                  </div>
                  <h4 className="text-sm text-slate-200 font-medium mt-2 leading-relaxed">{bug.description}</h4>
                  <div className="flex items-center gap-4 mt-3 font-mono text-[9px] text-slate-500 uppercase tracking-widest">
                    <span className="flex items-center gap-1.5"><Wrench size={12} className="text-rose-500" /> {bug.component}</span>
                    <span className="flex items-center gap-1.5"><FileText size={12} className="text-slate-500" /> {bug.file}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-4 min-w-[250px]">
                {bug.status === 'fixing' && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-yellow-400">
                      <span>Прогрес виправлення</span>
                      <span>{bug.fixProgress}%</span>
                    </div>
                    <Progress value={bug.fixProgress} variant="neon" className="h-2 bg-yellow-500/10" />
                  </div>
                )}
                
                <div className="flex gap-2 justify-end">
                  <Button variant="cyber" size="sm" className="h-9 px-4 text-[9px] font-black uppercase border-white/5 text-slate-400 hover:text-white">Аналіз</Button>
                  <Button 
                    variant="neon" 
                    size="sm" 
                    onClick={() => handleFixBug(bug.id)}
                    disabled={bug.status !== 'detected'}
                    className={cn(
                      "h-9 px-6 text-[9px] font-black uppercase tracking-widest",
                      bug.status === 'detected' ? "bg-rose-600/20 text-rose-400 border-rose-500/50 shadow-[0_0_10px_rgba(244,63,94,0.1)]" : "opacity-30"
                    )}
                  >
                    Автофікс (AI)
                  </Button>
                </div>
              </div>
            </div>
          </TacticalCard>
        )) : (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500 font-mono uppercase tracking-[0.3em] text-[10px] bg-slate-900/20 border border-dashed border-white/5 rounded-3xl">
            <Search size={48} className="mb-6 opacity-10" />
            🎉 Жодних активних багів у черзі...
          </div>
        )}
      </div>
    </motion.div>
  );
};
