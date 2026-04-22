import React from 'react';
import { motion } from 'framer-motion';
import { 
  Box, GitBranch, RotateCcw
} from 'lucide-react';
import { cn } from '@/utils/cn';

const SearchIcon = (props: any) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
  </svg>
);

export interface FactoryCicdPanelProps {
  pipelineProgress: number;
  systemScore: {
    quality: number | null;
    coverage: number | null;
    security: number | null;
  };
}

export const FactoryCicdPanel: React.FC<FactoryCicdPanelProps> = ({
  pipelineProgress,
  systemScore
}) => {
  return (
    <div className="space-y-6">
      <section className="page-section section-amber shadow-xl overflow-hidden mt-6">
        <div className="section-header">
          <div className="section-dot-amber" />
          <h2 className="section-title">Конвеєр Вдосконалення Системи</h2>
        </div>
        <div className="p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-cyber-grid opacity-10 pointer-events-none" />
          <div className="relative z-10 grid grid-cols-4 gap-4 items-center">
            {[
              { name: 'Аналіз & Лінтер', state: pipelineProgress >= 20, icon: SearchIcon },
              { name: 'Збірка Образів', state: pipelineProgress >= 50, icon: Box },
              { name: 'GitOps Оновлення', state: pipelineProgress >= 80, icon: GitBranch },
              { name: 'ArgoCD Синхр.', state: pipelineProgress === 100, icon: RotateCcw }
            ].map((step, idx) => (
              <div key={idx} className="flex flex-col items-center gap-3 relative">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 z-10",
                  step.state ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]" : "bg-slate-900 border-slate-700 text-slate-500"
                )}>
                  <step.icon size={20} />
                </div>
                <div className="text-[10px] font-black uppercase text-center text-slate-400">{step.name}</div>
                {idx !== 3 && (
                  <div className="absolute top-6 left-[60%] w-[80%] h-0.5 bg-slate-800 -z-10">
                    <motion.div 
                      initial={{ width: 0 }} 
                      animate={{ width: step.state ? '100%' : '0%' }} 
                      className="h-full bg-emerald-500 shadow-[0_0_10px_#10b981]" 
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-8 grid grid-cols-3 gap-4">
            <div className="bg-slate-900/50 p-4 border border-yellow-500/20 rounded-xl relative overflow-hidden group">
              <div className="absolute bottom-0 left-0 h-1 bg-yellow-500 transition-all duration-1000" style={{ width: `${systemScore.quality ?? 0}%` }} />
              <div className="text-[10px] text-slate-500 uppercase font-black">Якість Коду (Sonar)</div>
              <div className="text-2xl font-black text-yellow-400 mt-1">{systemScore.quality == null ? 'Н/д' : `${systemScore.quality}%`}</div>
            </div>
            <div className="bg-slate-900/50 p-4 border border-rose-500/20 rounded-xl relative overflow-hidden group">
              <div className="absolute bottom-0 left-0 h-1 bg-rose-500 transition-all duration-1000" style={{ width: `${systemScore.coverage ?? 0}%` }} />
              <div className="text-[10px] text-slate-500 uppercase font-black">Тестове покриття</div>
              <div className="text-2xl font-black text-rose-400 mt-1">{systemScore.coverage == null ? 'Н/д' : `${systemScore.coverage}%`}</div>
            </div>
            <div className="bg-slate-900/50 p-4 border border-rose-500/20 rounded-xl relative overflow-hidden group">
              <div className="absolute bottom-0 left-0 h-1 bg-rose-500 transition-all duration-1000" style={{ width: `${systemScore.security ?? 0}%` }} />
              <div className="text-[10px] text-slate-500 uppercase font-black">Безпека (Trivy + OPA)</div>
              <div className="text-2xl font-black text-rose-400 mt-1">{systemScore.security == null ? 'Н/д' : `${systemScore.security}%`}</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
