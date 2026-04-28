import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cloud, 
  Terminal, 
  ShieldAlert, 
  Zap, 
  Cpu, 
  Layout, 
  BarChart3, 
  Network,
  Search,
  ArrowRight,
  MessageSquare,
  Bot
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TacticalCard } from '@/components/ui/TacticalCard';
import { cn } from '@/utils/cn';

/**
 * Gemini Cloud Assist — інтелектуальний помічник для GCP.
 * Компонент інтегрується у Фабрику для управління хмарною інфраструктурою.
 */
export function GeminiCloudAssist() {
  const [activeTab, setActiveTab] = useState<'architecture' | 'health' | 'costs' | 'chat'>('chat');
  const [query, setQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const mockInsights = [
    { id: 1, title: 'Оптимізація BigQuery', desc: 'Виявлено 12 запитів з високим споживанням слотів.', priority: 'medium', icon: BarChart3, color: 'text-amber-400' },
    { id: 2, title: 'Безпека GKE', desc: 'Застаріла версія Control Plane у кластері predator-prod.', priority: 'high', icon: ShieldAlert, color: 'text-rose-500' },
    { id: 3, title: 'VRAM Allocation', desc: 'рекомендовано збільшити квоту L4 GPU у регіоні us-central1.', priority: 'low', icon: Cpu, color: 'text-emerald-400' },
  ];

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Bot size={24} className="text-white animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-tight uppercase">Gemini Cloud Assist</h2>
            <div className="flex items-center gap-2">
              <Badge variant="cyber" className="bg-blue-500/10 text-blue-400 text-[8px] font-black border-blue-500/20 uppercase tracking-widest">GCP EXPERT v2.5</Badge>
              <span className="text-[10px] text-slate-500 font-mono">CONNECTED // PROJECT: ancient-bond-493314-c5</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
           {['chat', 'architecture', 'health', 'costs'].map((t) => (
             <button
               key={t}
               onClick={() => setActiveTab(t as any)}
               className={cn(
                 "px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all",
                 activeTab === t ? "border-blue-500/40 bg-blue-500/10 text-blue-400" : "border-white/5 bg-white/5 text-slate-500 hover:text-white"
               )}
             >
               {t}
             </button>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* ── Main Panel ── */}
        <div className="xl:col-span-2 space-y-6">
          <TacticalCard variant="holographic" className="border-blue-500/20 bg-blue-500/5">
            <div className="p-6">
               <AnimatePresence mode="wait">
                 {activeTab === 'chat' && (
                   <motion.div
                     key="chat"
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0 }}
                     className="space-y-4"
                   >
                     <div className="bg-black/40 rounded-3xl p-6 border border-white/5 h-[350px] overflow-y-auto flex flex-col gap-4 font-mono text-[11px]">
                        <div className="flex gap-3">
                           <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0 border border-blue-500/30 text-blue-400">G</div>
                           <div className="bg-white/5 rounded-2xl rounded-tl-none p-4 text-slate-300 max-w-[80%] border border-white/5 leading-relaxed">
                             Вітаю у **Gemini Cloud Assist**! Я ваш інтелектуальний помічник у світі Google Cloud Platform. 
                             Чим я можу допомогти вам сьогодні? Я маю доступ до логів вашого проекту `ancient-bond` та конфігурацій GKE.
                           </div>
                        </div>
                        <div className="flex gap-3 flex-row-reverse">
                           <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center shrink-0 border border-rose-500/30 text-rose-400">P</div>
                           <div className="bg-rose-500/10 rounded-2xl rounded-tr-none p-4 text-rose-100 max-w-[80%] border border-rose-500/20 leading-relaxed italic">
                             Проаналізуй затримку між Core API та Neo4j у кластері iMac-Node.
                           </div>
                        </div>
                        <div className="flex gap-3">
                           <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0 border border-blue-500/30 text-blue-400">G</div>
                           <div className="bg-white/5 rounded-2xl rounded-tl-none p-4 text-slate-300 max-w-[80%] border border-white/5 leading-relaxed">
                             Аналізую... Виявлено затримку 150ms через DNS-резолвінг у VPC-тунелі. рекомендую перевірити налаштування `zrok` та локальний DNS-кеш на iMac.
                           </div>
                        </div>
                     </div>
                     <div className="relative">
                        <input 
                          type="text" 
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          placeholder="Запитай Cloud Assist про свою архітектуру..."
                          className="w-full h-14 bg-black/60 border border-white/10 rounded-2xl px-14 pr-16 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all font-medium placeholder:text-slate-600"
                        />
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                           <label className="cursor-pointer text-slate-500 hover:text-blue-400 transition-colors">
                              <input type="file" className="hidden" accept="image/*" onChange={() => alert('Vision Analysis ініційовано...')} />
                              <Layout size={20} />
                           </label>
                        </div>
                        <button className="absolute right-2 top-2 bottom-2 w-10 bg-blue-600 hover:bg-blue-500 rounded-xl flex items-center justify-center text-white transition-colors">
                           <ArrowRight size={18} />
                        </button>
                     </div>
                   </motion.div>
                 )}

                 {activeTab === 'architecture' && (
                   <motion.div
                     key="arch"
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     className="h-[420px] flex flex-col items-center justify-center text-center p-8 bg-black/20 rounded-3xl border border-dashed border-white/10"
                   >
                      <Layout size={48} className="text-slate-700 mb-4" />
                      <h3 className="text-lg font-black text-white uppercase tracking-widest mb-2">Architecture Designer</h3>
                      <p className="text-xs text-slate-500 max-w-sm mb-6">Завантажте скріншот архітектури або опишіть її текстом, і Gemini створить інтерактивну мапу GCP ресурсів.</p>
                      <Button variant="cyber" className="border-blue-500/40 text-blue-400 h-11 px-8 uppercase text-[10px] font-black tracking-widest">
                        Ініціалізувати Канвас
                      </Button>
                   </motion.div>
                 )}
               </AnimatePresence>
            </div>
          </TacticalCard>

          <div className="grid grid-cols-2 gap-4">
             <div className="p-5 rounded-3xl bg-black/40 border border-white/5 group hover:border-emerald-500/30 transition-colors">
                <div className="flex items-center gap-3 mb-2">
                   <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                      <Zap size={16} />
                   </div>
                   <div className="text-[10px] font-black text-white uppercase tracking-widest">Fast Reasoning</div>
                </div>
                <div className="text-[9px] text-slate-500 font-mono leading-relaxed">
                   Gemini 2.5 Flash активовано для миттєвого аналізу хмарних логів.
                </div>
             </div>
             <div className="p-5 rounded-3xl bg-black/40 border border-white/5 group hover:border-blue-500/30 transition-colors">
                <div className="flex items-center gap-3 mb-2">
                   <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                      <Network size={16} />
                   </div>
                   <div className="text-[10px] font-black text-white uppercase tracking-widest">Cloud Topology</div>
                </div>
                <div className="text-[9px] text-slate-500 font-mono leading-relaxed">
                   Синхронізація з VPC та Subnets у проекті ancient-bond.
                </div>
             </div>
          </div>
        </div>

        {/* ── Side Panel ── */}
        <div className="space-y-6">
          <div className="bg-black/40 rounded-[32px] border border-white/5 p-6 flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-2">
               <Zap size={14} className="text-amber-400" />
               <span className="text-[10px] font-black uppercase tracking-widest text-white">Smart Insights</span>
            </div>
            {mockInsights.map((insight) => (
              <div key={insight.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
                 <div className="flex items-center gap-3 mb-2">
                    <insight.icon size={16} className={insight.color} />
                    <span className="text-[11px] font-black text-white uppercase tracking-tight">{insight.title}</span>
                    <ArrowRight size={12} className="ml-auto text-slate-600 group-hover:text-white transition-colors" />
                 </div>
                 <div className="text-[10px] text-slate-400 font-mono leading-relaxed">
                    {insight.desc}
                 </div>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-br from-blue-600/20 to-emerald-500/20 rounded-[32px] border border-blue-500/20 p-6">
             <div className="flex items-center gap-3 mb-4">
                <Cloud size={20} className="text-blue-400" />
                <span className="text-[12px] font-black text-white uppercase tracking-widest">Sovereign Cloud Shield</span>
             </div>
             <div className="space-y-3">
                <div className="flex justify-between text-[10px]">
                   <span className="text-slate-400 uppercase font-black">Безпека Даних</span>
                   <span className="text-emerald-400 font-black">98%</span>
                </div>
                <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                   <div className="h-full bg-emerald-500 w-[98%] rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                </div>
             </div>
             <p className="text-[9px] text-slate-400 mt-4 leading-relaxed font-mono">
                Усі запити до Gemini проходять через **Data Privacy Shield**. Google не використовує дані PREDATOR для навчання своїх моделей.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
