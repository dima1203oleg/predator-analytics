import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, Save, RefreshCw, Layers, Copy, Search,
  Terminal, Shield, Play, Lock, FileCode
} from 'lucide-react';
import { ViewHeader } from '@/components/ViewHeader';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { TacticalCard } from '@/components/TacticalCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const SystemPromptsView = () => {
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);

  const promptCategories = [
    { id: 'extraction', label: 'Екстракція Даних', icon: Layers, status: 'Active', count: 12 },
    { id: 'analysis', label: 'Глибока Аналітика', icon: Search, status: 'Active', count: 8 },
    { id: 'decision', label: 'Прийняття Рішень', icon: Shield, status: 'Beta', count: 5 },
    { id: 'factory', label: 'Системні Промпти Заводу', icon: Zap, status: 'Critical', count: 32 },
  ];

  const prompts = [
    { id: 'PR-101', name: 'PREDATOR_V55_OODA_REASONING', category: 'factory', version: 'v2.4.1', status: 'АКТИВНО', lastUpdate: '2026-03-20T12:00:00Z' },
    { id: 'PR-102', name: 'ANTI_FRAUD_HEURISTICS_SCAN', category: 'analysis', version: 'v1.8.0', status: 'БЕТА', lastUpdate: '2026-03-21T09:30:00Z' },
    { id: 'PR-103', name: 'CUSTOMS_CODE_LEGAL_ENTITY_EXTRACT', category: 'extraction', version: 'v4.0.0', status: 'АКТИВНО', lastUpdate: '2026-03-22T14:15:00Z' },
    { id: 'PR-104', name: 'CRITICAL_RISK_SCORE_EXPLAINABILITY', category: 'decision', version: 'v1.0.2', status: 'АКТИВНО', lastUpdate: '2026-03-23T10:00:00Z' },
  ];

  return (
    <div className="min-h-screen bg-[#010714] text-slate-200 font-sans pb-20">
      <AdvancedBackground />
      
      <ViewHeader 
        title="СИСТЕМНІ ПРОМПТИ ШІ"
        subtitle="Керування інструкціями для нейромереж та системної логіки PREDATOR"
        icon={<Terminal size={24} className="text-amber-400" />}
        breadcrumbs={['ПРЕДАТОР', 'ЗАВОД', 'ПРОМПТИ']}
        stats={[
          { label: 'Prompt Engine', value: 'V5 LIVE', icon: <Zap size={14} />, color: 'primary' },
          { label: 'Latency', value: '250ms AVG', icon: <RefreshCw size={14} />, color: 'success' }
        ]}
      />

      <div className="max-w-[1700px] mx-auto px-6 mt-10 grid grid-cols-1 lg:grid-cols-12 gap-10 relative z-10">
        {/* Left Column: Categories and Status */}
        <div className="lg:col-span-3 space-y-8">
           <div className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] px-2 mb-6 italic">КАТЕГОРІЇ_СУТНОСТЕЙ</h3>
              {promptCategories.map(cat => (
                 <TacticalCard key={cat.id} variant="holographic" className="p-5 hover:border-amber-500/30 transition-all cursor-pointer group">
                    <div className="flex items-center justify-between mb-4">
                       <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500 border border-amber-500/20 group-hover:scale-110 transition-transform">
                          <cat.icon size={18} />
                       </div>
                       <Badge variant={cat.status === 'Critical' ? 'destructive' : 'secondary'} className="text-[8px] font-black">
                          {cat.status}
                       </Badge>
                    </div>
                    <div className="space-y-1">
                       <h4 className="text-[12px] font-black text-white group-hover:text-amber-400 transition-colors uppercase">{cat.label}</h4>
                       <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest leading-none">{cat.count} ДИРЕКТИВ</p>
                    </div>
                 </TacticalCard>
              ))}
           </div>
           
           <TacticalCard variant="cyber" className="p-6 bg-amber-500/5 border-amber-500/20">
              <div className="flex items-center gap-3 mb-6">
                 <Shield className="text-amber-500 h-5 w-5" />
                 <span className="text-[10px] font-black text-white uppercase tracking-widest italic leading-none">CORTEX SECURITY OK</span>
              </div>
              <p className="text-[11px] text-slate-500 uppercase tracking-tighter sm:font-mono italic">Усі системні промпти проходять через Firewall на наявність Leak-ин'єкцій.</p>
           </TacticalCard>
        </div>

        {/* Middle Column: Prompts List */}
        <div className="lg:col-span-4 space-y-6">
           <div className="flex items-center justify-between px-2 mb-4">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic mb-0">ДИРЕКТИВИ_v56.2-TITAN</h3>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-500 hover:text-amber-400">
                 <RefreshCw size={14} />
              </Button>
           </div>
           
           {prompts.map(p => (
              <motion.div
                key={p.id}
                whileHover={{ x: 8 }}
                onClick={() => setSelectedPrompt(p.id)}
                className={cn(
                   "p-5 rounded-2xl border transition-all cursor-pointer group flex flex-col gap-4",
                   selectedPrompt === p.id 
                     ? "bg-amber-500/10 border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.15)]" 
                     : "bg-slate-900/40 border-white/5 hover:border-white/10"
                )}
              >
                 <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                       <span className="text-[13px] font-black text-white group-hover:text-amber-400 transition-colors tracking-tight italic">{p.name}</span>
                       <span className="text-[9px] font-mono text-slate-600 flex items-center gap-2">
                          <FileCode size={10} /> {p.id} | {p.version}
                       </span>
                    </div>
                    <Badge variant={p.status === 'АКТИВНО' ? 'success' : 'warning'} className="text-[8px] font-black">
                       {p.status}
                    </Badge>
                 </div>
                 <div className="flex items-center justify-between border-t border-white/5 pt-4">
                    <span className="text-[9px] text-slate-700 font-mono tracking-tighter italic">UPDATE: {new Date(p.lastUpdate).toLocaleTimeString('uk-UA')}</span>
                    <button className="text-[9px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-colors">РЕДАГУВАТИ <Copy size={10} className="inline ml-1 opacity-50" /></button>
                 </div>
              </motion.div>
           ))}
        </div>

        {/* Right Column: Code Editor Placeholder */}
        <div className="lg:col-span-5 space-y-8">
           <TacticalCard variant="holographic" className="p-0 overflow-hidden flex flex-col bg-black/60 border-white/10 min-h-[600px]">
              <div className="flex items-center justify-between px-6 py-4 bg-white/5 border-b border-white/5">
                 <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                       <div className="w-2.5 h-2.5 rounded-full bg-rose-500/50" />
                       <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
                       <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
                    </div>
                    <div className="w-px h-6 bg-white/10 mx-2" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic font-mono">EDITOR: {selectedPrompt || "CHOOSE_PROMPT"}</span>
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
              
              <div className="flex-1 p-8 font-mono text-[13px] leading-relaxed text-slate-400 overflow-y-auto custom-scrollbar">
                 {selectedPrompt ? (
                    <div className="space-y-4">
                       <p className="text-emerald-400/60 break-all leading-tight">{"/* SYSTEM_CONTEXT_INITIALIZATION */"}</p>
                       <p><span className="text-amber-500">ROLE:</span> Senior Strategic Analyst covering Customs Ukraine Infrastructure.</p>
                       <p><span className="text-amber-500">MISSION:</span> Identify high-risk entities and corruption-related anomalies in real-time streams.</p>
                       <p><span className="text-amber-500">CONSTRAINTS:</span> 1. Neutral analytical tone. 2. Legal compliance strict checking. 3. Zero hallucination policy.</p>
                       <div className="w-full h-px bg-white/10 my-4" />
                       <p><span className="text-indigo-400">INSTRUCTION_SET:</span> Analyze 'HS_CODE' against historical seasonal deviations of +/- 15%. If 'IMPORT_VALUE' exceeds median for 'COUNTRY_OF_ORIGIN' by 300%, flag as 'CRITICAL_RISK'.</p>
                       <p className="animate-pulse opacity-40">|</p>
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
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest italic group hover:text-indigo-300 cursor-help">
                       <RefreshCw size={12} className="group-hover:rotate-180 transition-transform duration-700" /> SYMBOLS: 1024
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">
                       TOKEN_COST: $0.002
                    </div>
                 </div>
                 <Button className="bg-amber-600 hover:bg-amber-500 text-black font-black text-[10px] uppercase tracking-[0.3em] rounded-xl px-12 italic">
                    <Play size={12} className="mr-2" /> ТЕСТ_ІНФЕРЕНСУ
                 </Button>
              </div>
           </TacticalCard>
        </div>
      </div>
    </div>
  );
};

export default SystemPromptsView;
