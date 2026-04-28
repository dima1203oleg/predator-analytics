import React from 'react';
import { motion } from 'framer-motion';
import { 
  Factory, Zap, Play, AlertTriangle, Binary, BrainCircuit, Sparkles, 
  Wrench, History as HistoryIcon, Scan, ShieldCheck, Server, Cloud, 
  Microscope, Fingerprint, RotateCcw
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TacticalCard } from '@/components/ui/TacticalCard';

export interface FactoryImprovementPanelProps {
  infiniteRunning: boolean;
  infinitePhase: 'observe' | 'orient' | 'decide' | 'act';
  improvementStatus: 'idle' | 'running' | 'success' | 'error' | 'done';
  improvementProgress: number;
  improvementMode: 'tech' | 'analytic' | 'complex' | null;
  setImprovementMode: (mode: 'tech' | 'analytic' | 'complex' | null) => void;
  techComponents: string[];
  setTechComponents: (v: string[]) => void;
  analyticComponents: string[];
  setAnalyticComponents: (v: string[]) => void;
  infiniteLogs: string[];
  infiniteStats: { improvements: number; bugs: number; cycles: number };
  goldPatterns: any[];
  bugs: any[];
  healthChecks: any[];
  handleStartImprovement: () => void;
  handleUpdateKnowledgeMap: () => void;
  handleStopInfinite: () => void;
  handleMasterStart: () => void;
}

const techOptions = [
  { id: 'frontend', label: 'Фронтенд (веб-інтерфейс, візуальність)' },
  { id: 'backend', label: 'Бекенд (Core API, Meta-Controller, логіка)' },
  { id: 'infra', label: 'Інфраструктура (K8s Pods, мережа)' },
  { id: 'db', label: 'База даних та Memory Layer' },
  { id: 'perf', label: 'Загальна продуктивність і стабільність' }
];

const analyticOptions = [
  { id: 'knowledge', label: 'Мапа Знань (Knowledge Map + патерни)' },
  { id: 'datasets', label: 'Студія Датасетів' },
  { id: 'facts', label: 'Студія Фактів' },
  { id: 'activity', label: 'Аналітика Діяльності' },
  { id: 'data', label: 'Аналітика Даних' }
];

export const FactoryImprovementPanel: React.FC<FactoryImprovementPanelProps> = ({
  infiniteRunning,
  infinitePhase,
  improvementStatus,
  improvementProgress,
  improvementMode,
  setImprovementMode,
  techComponents,
  setTechComponents,
  analyticComponents,
  setAnalyticComponents,
  infiniteLogs,
  infiniteStats,
  goldPatterns,
  bugs,
  healthChecks,
  handleStartImprovement,
  handleUpdateKnowledgeMap,
  handleStopInfinite,
  handleMasterStart
}) => {
  const toggleSelection = (id: string, list: string[], setList: (v: string[]) => void) => {
    if (list.includes(id)) setList(list.filter(x => x !== id));
    else setList([...list, id]);
  };

  return (
    <div className="space-y-6">
      {/* Sovereign Control Center Header */}
      <TacticalCard variant="holographic" className="border-rose-500/40 bg-rose-500/5 backdrop-blur-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-[0_0_30px_rgba(244,63,94,0.3)] shrink-0">
              <Factory size={32} className="animate-pulse" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xl font-black uppercase tracking-[0.2em] text-white">ПУЛЬТ УП АВЛІННЯ ЦИКЛОМ</h3>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 font-mono text-[10px] uppercase">
                <span className={cn(infiniteRunning ? "text-emerald-400" : "text-rose-500", "flex items-center gap-1.5")}>
                   <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                   <span className="opacity-50 text-slate-400">СТАТУС:</span>
                   {infiniteRunning ? 'АКТИВНИЙ ЦИКЛ' : ' ЕЖИМ ОЧІКУВАННЯ'}
                </span>
                <span className="text-slate-700">|</span>
                <span className="text-rose-400">
                   <span className="opacity-50 text-slate-400 mr-1.5">ФАЗА:</span>
                   {infinitePhase === 'observe' ? 'СПОСТЕ ЕЖЕННЯ' : 
                    infinitePhase === 'orient' ? 'О ІЄНТАЦІЯ' : 
                    infinitePhase === 'decide' ? ' ІШЕННЯ' : 'ДІЯ'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
             <Button 
               variant="neon" 
               size="sm" 
               className="flex-1 lg:flex-none px-6 bg-emerald-600/20 text-emerald-400 border-emerald-500/50 text-[10px] uppercase font-black h-12 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
               onClick={handleMasterStart}
             >
               <Zap size={14} className="mr-2" /> МАЙСТЕР  ЗАПУСК
             </Button>
             <Button 
               variant="neon" 
               size="sm" 
               className="flex-1 lg:flex-none px-6 bg-rose-600/20 text-rose-400 border-rose-500/50 text-[10px] uppercase font-black h-12 shadow-[0_0_20px_rgba(244,63,94,0.2)]"
               onClick={handleStartImprovement}
             >
               <Play size={14} className="mr-2" /> ЗАПУСТИТИ
             </Button>
             <Button 
               variant="cyber" 
               size="sm" 
               className="flex-1 lg:flex-none px-4 bg-slate-800 text-slate-400 border-white/10 text-[10px] uppercase font-black h-12 hover:border-rose-500/50 hover:text-rose-500"
               onClick={handleStopInfinite}
             >
               <AlertTriangle size={14} className="mr-2" /> ЗУПИНКА
             </Button>
          </div>
        </div>
      </TacticalCard>

      {/* Mode Selection Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <TacticalCard 
            onClick={() => setImprovementMode('tech')}
            variant={improvementMode === 'tech' ? 'holographic' : 'minimal'}
            className={cn("cursor-pointer py-10 flex flex-col items-center gap-5 transition-all group border-rose-500/20", 
              improvementMode === 'tech' ? 'border-rose-500 shadow-[0_0_40px_rgba(244,63,94,0.15)] bg-rose-500/5' : 'hover:border-rose-500/40 opacity-70 hover:opacity-100')}
          >
            <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center border transition-transform group-hover:scale-110 shadow-lg",
              improvementMode === 'tech' ? "bg-rose-500/20 border-rose-500/40 text-rose-400" : "bg-white/5 border-white/10 text-slate-500")}>
              <Binary size={32} />
            </div>
            <div className="text-center">
              <span className="text-sm font-black uppercase tracking-[0.2em] block text-white">Технологічна Вертикаль</span>
              <span className="text-[10px] text-rose-500/80 font-mono mt-2 uppercase tracking-widest">Інфраструктура та Core API</span>
            </div>
          </TacticalCard>

          <TacticalCard 
            onClick={() => setImprovementMode('analytic')}
            variant={improvementMode === 'analytic' ? 'holographic' : 'minimal'}
            className={cn("cursor-pointer py-10 flex flex-col items-center gap-5 transition-all group border-rose-500/20", 
              improvementMode === 'analytic' ? 'border-rose-500 shadow-[0_0_40px_rgba(244,63,94,0.15)] bg-rose-500/5' : 'hover:border-rose-500/40 opacity-70 hover:opacity-100')}
          >
            <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center border transition-transform group-hover:scale-110 shadow-lg",
              improvementMode === 'analytic' ? "bg-rose-500/20 border-rose-500/40 text-rose-400" : "bg-white/5 border-white/10 text-slate-500")}>
              <BrainCircuit size={32} />
            </div>
            <div className="text-center">
              <span className="text-sm font-black uppercase tracking-[0.2em] block text-white">Аналітична Вертикаль</span>
              <span className="text-[10px] text-rose-500/80 font-mono mt-2 uppercase tracking-widest">Карти Знань та Патерни</span>
            </div>
          </TacticalCard>

          <TacticalCard 
            onClick={() => setImprovementMode('complex')}
            variant={improvementMode === 'complex' ? 'holographic' : 'minimal'}
            className={cn("cursor-pointer py-10 flex flex-col items-center gap-5 transition-all group border-rose-500/20", 
              improvementMode === 'complex' ? 'border-rose-500 shadow-[0_0_40px_rgba(244,63,94,0.15)] bg-rose-500/5' : 'hover:border-rose-500/40 opacity-70 hover:opacity-100')}
          >
            <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center border transition-transform group-hover:scale-110 shadow-lg",
              improvementMode === 'complex' ? "bg-rose-500/20 border-rose-500/40 text-rose-400" : "bg-white/5 border-white/10 text-slate-500")}>
              <Sparkles size={32} />
            </div>
            <div className="text-center">
              <span className="text-sm font-black uppercase tracking-[0.2em] block text-white">Комплексний Нагляд</span>
              <span className="text-[10px] text-rose-500/80 font-mono mt-2 uppercase tracking-widest">Суверенне  озгортання</span>
            </div>
          </TacticalCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Technical Column */}
        {(improvementMode === 'tech' || improvementMode === 'complex') && (
          <TacticalCard variant="cyber" className="border-rose-500/30 overflow-hidden">
            <div className="flex items-center gap-3 mb-6 p-4 border-b border-rose-500/20 bg-rose-500/5">
              <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]" />
              <h2 className="text-xs font-black uppercase tracking-widest text-white">Технологічний Стек</h2>
            </div>
            <div className="p-4 space-y-4 pt-0">
              <div className="grid grid-cols-1 gap-2">
                 {techOptions.map(opt => (
                   <label key={opt.id} className={cn("flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer", 
                     techComponents.includes(opt.id) ? "bg-rose-500/10 border-rose-500/40" : "bg-black/20 border-white/5 hover:border-white/10")}>
                      <input type="checkbox" checked={techComponents.includes(opt.id)} onChange={() => toggleSelection(opt.id, techComponents, setTechComponents)} className="accent-rose-500 w-4 h-4" />
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-200">{opt.label}</span>
                        {techComponents.includes(opt.id) && <span className="text-[8px] text-rose-400 animate-pulse uppercase tracking-[0.2em] mt-1">П ИЗНАЧЕНО ДЛЯ ОПТИМІЗАЦІЇ</span>}
                      </div>
                   </label>
                 ))}
              </div>
              <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
                 <Button onClick={handleStartImprovement} variant="neon" className="w-full bg-rose-600/20 text-rose-400 border-rose-500/50 font-black uppercase tracking-widest text-[10px] h-12 shadow-[0_0_15px_rgba(244,63,94,0.1)]"><Wrench size={14} className="mr-2"/> Оптимізувати Ядро</Button>
                 <div className="grid grid-cols-2 gap-2">
                   <Button variant="cyber" className="text-[9px] h-10 border-white/10 text-slate-400 hover:text-white"><HistoryIcon size={12} className="mr-1"/> Відкат (Rollback)</Button>
                   <Button variant="cyber" className="text-[9px] h-10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10"><Scan size={12} className="mr-1"/> Сканування Безпеки</Button>
                 </div>
              </div>
            </div>
          </TacticalCard>
        )}

        {/* Analytical Column */}
        {(improvementMode === 'analytic' || improvementMode === 'complex') && (
          <TacticalCard variant="cyber" className="border-rose-500/30 overflow-hidden">
            <div className="flex items-center gap-3 mb-6 p-4 border-b border-rose-500/20 bg-rose-500/5">
              <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]" />
              <h2 className="text-xs font-black uppercase tracking-widest text-white">Аналітичний Інтелект</h2>
            </div>
            <div className="p-4 space-y-4 pt-0">
              <div className="grid grid-cols-1 gap-2">
                 {analyticOptions.map(opt => (
                   <label key={opt.id} className={cn("flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer", 
                     analyticComponents.includes(opt.id) ? "bg-rose-500/10 border-rose-500/40" : "bg-black/20 border-white/5 hover:border-white/10")}>
                      <input type="checkbox" checked={analyticComponents.includes(opt.id)} onChange={() => toggleSelection(opt.id, analyticComponents, setAnalyticComponents)} className="accent-rose-500 w-4 h-4" />
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-200">{opt.label}</span>
                        {analyticComponents.includes(opt.id) && <span className="text-[8px] text-rose-400 animate-pulse uppercase tracking-[0.2em] mt-1">ОНОВЛЕННЯ ПАТЕ НУ АКТИВНЕ</span>}
                      </div>
                   </label>
                 ))}
              </div>
              <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
                 <Button onClick={handleStartImprovement} variant="neon" className="w-full bg-rose-600/20 text-rose-400 border-rose-500/50 font-black uppercase tracking-widest text-[10px] h-12 shadow-[0_0_15px_rgba(244,63,94,0.1)]"><Sparkles size={14} className="mr-2"/> Оновити Знання</Button>
                 <Button onClick={handleUpdateKnowledgeMap} variant="cyber" className="w-full text-[10px] h-12 border-white/10 text-slate-400 hover:text-white"><RotateCcw size={14} className="mr-2"/> Синхронізувати Гравітацію Фактів</Button>
              </div>
            </div>
          </TacticalCard>
        )}
      </div>

      <TacticalCard variant="minimal" className="border-rose-500/20 bg-black/40">
        <div className="flex items-center gap-3 mb-6 p-4 border-b border-white/5">
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
          <h2 className="text-xs font-black uppercase tracking-widest text-white">Суверенні Інтеграції</h2>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
             <div className="w-12 h-12 rounded-xl bg-slate-500/10 flex items-center justify-center text-slate-400 shrink-0">
               <ShieldCheck size={24} />
             </div>
             <div className="flex-1 min-w-0">
               <div className="text-[11px] font-black uppercase text-white truncate">Зовнішні SaaS</div>
               <div className="text-[8px] text-slate-500 font-mono mt-1">HR-15 забороняє інтеграції</div>
             </div>
             <Badge variant="cyber" className="bg-slate-500/20 text-slate-400 text-[8px] shrink-0">Вимкнено</Badge>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-rose-500/20">
             <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400 shrink-0">
               <Server size={24} />
             </div>
             <div className="flex-1 min-w-0">
               <div className="text-[11px] font-black uppercase text-white truncate">Серверні Хаби</div>
               <div className="text-[8px] text-rose-400 font-mono mt-1">Внутрішні health телеметрії</div>
             </div>
             <Badge variant="cyber" className="bg-rose-500/20 text-rose-400 text-[8px] shrink-0">{healthChecks.length > 0 ? 'АКТИВНО' : 'Н/Д'}</Badge>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-rose-500/20">
             <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400 shrink-0">
               <Cloud size={24} />
             </div>
             <div className="flex-1 min-w-0">
               <div className="text-[11px] font-black uppercase text-white truncate">Хмарне Сполучення (Cloud Connect)</div>
                <div className="text-[8px] text-rose-400 font-mono mt-1">Очікування контракту</div>
              </div>
              <Badge variant="neon" className="bg-rose-500/20 text-rose-400 text-[8px] shrink-0">ОФЛАЙН</Badge>
           </div>
         </div>
       </TacticalCard>

       {/* Realtime Progress & Results UI */}
       {(improvementStatus === 'running' || improvementStatus === 'done' || infiniteRunning) && (
         <TacticalCard variant="holographic" className="border-rose-500/30 mt-6">
           <div className="flex items-center gap-3 mb-6 p-4 border-b border-rose-500/20 bg-rose-500/5">
             <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.5)]" />
             <h2 className="text-xs font-black uppercase tracking-widest text-white">Канал Подій Заводу (Events)</h2>
           </div>
           <div className="p-4">
             <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-center">
                <div>
                   <div className="flex items-center justify-between mb-3">
                     <span className="text-[11px] font-black uppercase tracking-wider text-rose-400">ПОТОЧНИЙ П ОГ ЕС ЦИКЛУ</span>
                     <span className="font-mono text-2xl font-black text-white">{improvementProgress}%</span>
                   </div>
                   <Progress value={improvementProgress} variant="holographic" className="h-4 shadow-[0_0_20px_rgba(244,63,94,0.1)]" />
                   
                   <div className="mt-8 grid grid-cols-2 gap-4">
                     <div className="bg-black/60 border border-white/5 rounded-2xl p-5 flex flex-col items-center shadow-lg">
                       <Microscope size={28} className="text-rose-400 mb-3" />
                       <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Аналіз</span>
                       <Badge variant="cyber" className="mt-2 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">ЗАВЕ ШЕНО</Badge>
                     </div>
                     <div className="bg-black/60 border border-white/5 rounded-2xl p-5 flex flex-col items-center shadow-lg">
                       <Fingerprint size={28} className="text-rose-400 mb-3" />
                       <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Автентичність</span>
                       <Badge variant="cyber" className="mt-2 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">ПЕ ЕВІ ЕНО</Badge>
                     </div>
                   </div>
                </div>

                <div className="bg-slate-950/80 rounded-2xl p-4 border border-rose-500/10 font-mono text-[10px] h-[200px] overflow-y-auto custom-scrollbar shadow-inner relative">
                   <div className="text-rose-400/60 mb-2 uppercase font-black tracking-widest">[ ПІДТВЕ ДЖЕНІ ЛОГИ OODA ]</div>
                   {infiniteLogs.length > 0 ? (
                     <div className="space-y-1">
                       {infiniteLogs.slice(-10).map((log, index) => (
                         <div key={`${index}-${log}`} className={cn(
                           'break-words',
                           log.includes('ERROR') ? 'text-rose-300' : log.includes('SYSTEM') ? 'text-yellow-300' : 'text-slate-400',
                         )}>
                           {log}
                         </div>
                       ))}
                     </div>
                   ) : (
                     <div className="text-slate-500">Бекенд не повернув журнал OODA. Блок не генерує локальні події.</div>
                   )}
                </div>
             </div>

             {improvementStatus === 'done' && (
               <div className="mt-8 pt-8 border-t border-white/10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-widest text-white">ФІНАЛЬНИЙ ЗВІТ ПО ВЕ ТИКАЛЯХ</h4>
                      <p className="text-[9px] text-emerald-500/70 font-mono uppercase">Звіт формується лише з підтверджених server-side станів OODA та Factory API</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-[11px] font-mono border-separate border-spacing-y-2">
                      <thead>
                        <tr className="text-slate-500 text-[9px] uppercase tracking-widest text-left">
                          <th className="pb-2 font-black pl-3">Вертикаль</th>
                          <th className="pb-2 font-black">Впроваджено</th>
                          <th className="pb-2 font-black">Статус</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="bg-white/5 rounded-xl transition-all hover:bg-white/10">
                          <td className="p-3 text-yellow-400 font-bold border-l-2 border-yellow-500">Технологічна</td>
                          <td className="p-3 text-slate-200">Стан за OODA та telemetry</td>
                          <td className="p-3 text-emerald-400 font-bold">{infiniteRunning ? 'АКТИВНО' : 'ОЧІКУВАННЯ'}</td>
                        </tr>
                        <tr className="bg-white/5 rounded-xl transition-all hover:bg-white/10">
                          <td className="p-3 text-rose-400 font-bold border-l-2 border-rose-500">Аналітична</td>
                          <td className="p-3 text-slate-200">Gold patterns і bug queue</td>
                          <td className="p-3 text-emerald-400 font-bold">{goldPatterns.length > 0 || bugs.length > 0 ? 'ПІДТВЕ ДЖЕНО' : 'Н/Д'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
               </div>
             )}
           </div>
         </TacticalCard>
       )}
    </div>
  );
};
