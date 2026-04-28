import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Save, RefreshCw, Layers, Copy, Search,
  Terminal, Shield, Play, Lock, FileCode, Server,
  AlertCircle, CheckCircle2
} from 'lucide-react';
import { ViewHeader } from '@/components/ViewHeader';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { TacticalCard } from '@/components/ui/TacticalCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { optimizerApi } from '@/services/api/intelligence';

const SystemPromptsView = () => {
  const { isOffline, nodeSource } = useBackendStatus();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch all templates
  const { data: templates, isLoading: listLoading, refetch } = useQuery({
    queryKey: ['optimizer', 'templates'],
    queryFn: () => optimizerApi.getTemplates(),
    refetchInterval: 60000,
  });

  // Fetch selected template details
  const { data: selectedTemplate, isLoading: detailsLoading } = useQuery({
    queryKey: ['optimizer', 'template', selectedId],
    queryFn: () => selectedId ? optimizerApi.getTemplate(selectedId) : null,
    enabled: !!selectedId,
  });

  useEffect(() => {
    if (isOffline) {
      window.dispatchEvent(new CustomEvent('predator-error', {
        detail: {
          service: 'Prompt_Engine',
          message: 'ЯДРО П ОМПТІВ ПЕ ЕЙШЛО В АВТОНОМНИЙ  ЕЖИМ (PROMPT_OFFLINE). Використовуються закешовані версії.',
          severity: 'warning',
          timestamp: new Date().toISOString(),
          code: 'PROMPT_OFFLINE'
        }
      }));
    }
  }, [isOffline]);

  const promptCategories = useMemo(() => [
    { id: 'extraction', label: 'Екстракція Даних', icon: Layers, status: 'Активно', count: templates?.length || 0 },
    { id: 'analysis', label: 'Глибока Аналітика', icon: Search, status: 'Активно', count: Math.round((templates?.length || 0) * 0.4) },
    { id: 'decision', label: 'Прийняття  ішень', icon: Shield, status: 'Бета', count: 5 },
    { id: 'factory', label: 'Системні Промпти Заводу', icon: Zap, status: 'Критично', count: 32 },
  ], [templates]);

  return (
    <div className="min-h-screen bg-[#010714] text-slate-200 font-sans pb-20">
      <AdvancedBackground mode="sovereign" />
      
      <ViewHeader 
        title="СИСТЕМНІ П ОМПТІ ШІ"
        subtitle="Керування інструкціями для нейромереж та системної логіки PREDATOR"
        icon={<Terminal size={24} className="text-rose-400" />}
        breadcrumbs={['П ЕДАТО ', 'ЗАВОД', 'П ОМПТИ']}
        stats={[
          { label: 'ДЖЕРЕЛО', value: nodeSource, icon: <Server size={14} />, color: isOffline ? 'warning' : 'gold' },
          { label: 'ШАБЛОНИ', value: templates?.length?.toString() || '...', icon: <Zap size={14} />, color: 'primary' },
          { label: 'СТАТУС', value: isOffline ? 'АВТОНОМНО' : 'СИНХ ОНІЗОВАНО', icon: <Lock size={14} />, color: isOffline ? 'warning' : 'success' }
        ]}
      />

      <div className="max-w-[1700px] mx-auto px-6 mt-10 grid grid-cols-1 lg:grid-cols-12 gap-10 relative z-10">
        {/* Left Column: Categories and Status */}
        <div className="lg:col-span-3 space-y-8">
           <div className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] px-2 mb-6 italic">КАТЕГО ІЇ_СУТНОСТЕЙ</h3>
              {promptCategories.map(cat => (
                 <TacticalCard key={cat.id} variant="holographic" className="p-5 hover:border-rose-500/30 transition-all cursor-pointer group">
                    <div className="flex items-center justify-between mb-4">
                       <div className="p-3 bg-rose-500/10 rounded-xl text-rose-500 border border-rose-500/20 group-hover:scale-110 transition-transform">
                          <cat.icon size={18} />
                       </div>
                       <Badge variant={cat.status === 'Критично' ? 'destructive' : 'secondary'} className="text-[8px] font-black">
                          {cat.status}
                       </Badge>
                    </div>
                    <div className="space-y-1">
                       <h4 className="text-[12px] font-black text-white group-hover:text-rose-400 transition-colors uppercase">{cat.label}</h4>
                       <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest leading-none">{cat.count} ДИ ЕКТИВ</p>
                    </div>
                 </TacticalCard>
              ))}
           </div>
           
           <TacticalCard variant="cyber" className="p-6 bg-rose-500/5 border-rose-500/20">
              <div className="flex items-center gap-3 mb-6">
                 <Shield className="text-rose-500 h-5 w-5" />
                 <span className="text-[10px] font-black text-white uppercase tracking-widest italic leading-none">CORTEX SECURITY OK</span>
              </div>
              <p className="text-[11px] text-slate-500 uppercase tracking-tighter sm:font-mono italic">Усі системні промпти проходять через Firewall на наявність Leak-ін'єкцій.</p>
           </TacticalCard>
        </div>

        {/* Middle Column: Prompts List */}
        <div className="lg:col-span-4 space-y-6">
           <div className="flex items-center justify-between px-2 mb-4">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic mb-0">ДИ ЕКТИВИ_v58.2-WRAITH</h3>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-500 hover:text-rose-400" onClick={() => refetch()}>
                 <RefreshCw size={14} className={listLoading ? 'animate-spin' : ''} />
              </Button>
           </div>
           
           <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
              {templates?.map((p: any) => (
                 <motion.div
                   key={p.id}
                   whileHover={{ x: 8 }}
                   onClick={() => setSelectedId(p.id)}
                   className={cn(
                      "p-5 rounded-2xl border transition-all cursor-pointer group flex flex-col gap-4",
                      selectedId === p.id 
                        ? "bg-rose-500/10 border-rose-500/40 shadow-[0_0_20px_rgba(245,158,11,0.15)]" 
                        : "bg-slate-900/40 border-white/5 hover:border-white/10"
                   )}
                 >
                    <div className="flex items-center justify-between">
                       <div className="flex flex-col">
                          <span className="text-[13px] font-black text-white group-hover:text-rose-400 transition-colors tracking-tight italic">{p.name}</span>
                          <span className="text-[9px] font-mono text-slate-600 flex items-center gap-2">
                             <FileCode size={10} /> {p.id.substring(0, 8)}... | {p.is_optimized ? 'OPTIMIZED' : 'DRAFT'}
                          </span>
                       </div>
                       <Badge variant={p.is_optimized ? 'success' : 'secondary'} className="text-[8px] font-black uppercase">
                          {p.is_optimized ? 'АКТИВНО' : 'ЧЕ НЕТКА'}
                       </Badge>
                    </div>
                    <div className="flex items-center justify-between border-t border-white/5 pt-4">
                       <span className="text-[9px] text-slate-700 font-mono tracking-tighter italic uppercase">СКО : {p.score || 'Н/Д'}</span>
                       <button className="text-[9px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-colors"> ЕДАГУВАТИ <Copy size={10} className="inline ml-1 opacity-50" /></button>
                    </div>
                 </motion.div>
              ))}
              {listLoading && Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-24 bg-white/5 animate-pulse rounded-2xl border border-white/5" />
              ))}
           </div>
        </div>

        {/* Right Column: Code Editor */}
        <div className="lg:col-span-5 space-y-8">
           <TacticalCard variant="holographic" className="p-0 overflow-hidden flex flex-col bg-black/60 border-white/10 min-h-[600px]">
              <div className="flex items-center justify-between px-6 py-4 bg-white/5 border-b border-white/5">
                 <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                       <div className="w-2.5 h-2.5 rounded-full bg-rose-500/50" />
                       <div className="w-2.5 h-2.5 rounded-full bg-rose-500/50" />
                       <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
                    </div>
                    <div className="w-px h-6 bg-white/10 mx-2" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic font-mono">
                       ЕДАКТО : {selectedTemplate?.name || "ОБЕ ІТЬ_П ОМПТ"}
                    </span>
                 </div>
                 <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-white hover:bg-white/5">
                       <Copy size={14} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10">
                       <Save size={14} />
                    </Button>
                 </div>
              </div>
              
              <div className="flex-1 p-8 font-mono text-[13px] leading-relaxed text-slate-400 overflow-y-auto custom-scrollbar bg-[#020617]/50">
                 {detailsLoading ? (
                    <div className="h-full flex items-center justify-center">
                       <RefreshCw className="animate-spin text-rose-500/40" size={32} />
                    </div>
                 ) : selectedTemplate ? (
                    <div className="space-y-6">
                       <div className="space-y-2">
                          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">ШАБЛОН // СИСТЕМНА ІНСТ УКЦІЯ</p>
                          <div className="p-4 bg-black/40 border border-white/5 rounded-xl text-slate-300 whitespace-pre-wrap leading-loose italic">
                            {selectedTemplate.template}
                          </div>
                       </div>
                       
                       {selectedTemplate.optimized_template && (
                          <div className="space-y-2">
                             <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                               <Zap size={10} /> ОПТИМІЗОВАНА ВЕРСІЯ (DSPy)
                             </p>
                             <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-emerald-400/80 whitespace-pre-wrap leading-loose italic">
                               {selectedTemplate.optimized_template}
                             </div>
                          </div>
                       )}

                       {selectedTemplate.variables?.length > 0 && (
                          <div className="space-y-2">
                             <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">А ГУМЕНТИ // ЗМІННІ</p>
                             <div className="flex flex-wrap gap-2">
                                {selectedTemplate.variables.map((v: string) => (
                                   <code key={v} className="px-2 py-1 bg-white/5 rounded border border-white/10 text-rose-400 text-[10px]">
                                      {v}
                                   </code>
                                ))}
                             </div>
                          </div>
                       )}
                    </div>
                 ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-30 select-none">
                       <Lock size={48} className="mb-6 mx-auto" />
                       <p className="text-[12px] font-black uppercase tracking-[0.4em]">Оберіть промпт для перегляду ядра</p>
                    </div>
                 )}
              </div>
              
              <div className="p-6 bg-white/5 border-t border-white/5 flex items-center justify-between">
                 <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">
                       СКО : {selectedTemplate?.score || 'Н/Д'}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">
                       П ИКЛАДИ: {selectedTemplate?.examples?.length || 0}
                    </div>
                 </div>
                 <Button 
                    className="bg-rose-600 hover:bg-rose-500 text-black font-black text-[10px] uppercase tracking-[0.3em] rounded-xl px-12 italic"
                    disabled={!selectedTemplate}
                  >
                    <Play size={12} className="mr-2" /> ТЕСТ_ІНФЕ ЕНСУ
                 </Button>
              </div>
           </TacticalCard>
        </div>
      </div>
    </div>
  );
};

export default SystemPromptsView;
