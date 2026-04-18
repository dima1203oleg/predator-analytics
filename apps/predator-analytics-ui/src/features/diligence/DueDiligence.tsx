/**
 * ✅ DUE DILIGENCE WORKFLOW | v57.2-WRAITH
 * PREDATOR Analytics — Tactical Compliance Auditing
 * 
 * Багатоетапний процес перевірки контрагентів із застосуванням
 * ШІ-скорингу, автоматичних запитів та фінального затвердження.
 * 
 * © 2026 PREDATOR Analytics — HR-04 (100% українська)
 */

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, AlertCircle, Clock, Shield, Search, 
  FileText, Lock, Unlock, AlertTriangle, Fingerprint,
  Zap, ArrowRight, Save, X, Eye, Target, 
  Layers, Activity, ChevronDown, CheckCircle2
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { PageTransition } from '@/components/layout/PageTransition';
import { CyberGrid } from '@/components/CyberGrid';
import { Badge } from '@/components/ui/badge';

// --- TYPES ---
interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  category: 'legal' | 'financial' | 'compliance' | 'operational';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  comment?: string;
  auto?: boolean;
}

// --- MOCK DATA ---
const DEFAULT_CHECKLIST: ChecklistItem[] = [
  { id: 'l1', title: '🏢 Статус Реєстрації', description: 'Аналіз CERS/ЄДР на предмет активності', category: 'legal', status: 'completed', auto: true },
  { id: 'l2', title: '⚖️ Судові Навантаження', description: 'Перевірка активних кримінальних проваджень', category: 'legal', status: 'in_progress', auto: true },
  { id: 'c1', title: '⚠️ Санкційні Хвилі', description: 'РНБО, OFAC, ЄС шлюзи', category: 'compliance', status: 'completed', auto: true },
  { id: 'c2', title: '🔍 AML / UBO Scan', description: 'Пошук кінцевих бенефіціарів та PEP-зв\'язків', category: 'compliance', status: 'pending', auto: true },
  { id: 'f1', title: '💰 Податкова Дисципліна', description: 'Аналіз заборгованостей та звітності', category: 'financial', status: 'pending', auto: true },
  { id: 'f2', title: '📊 Фінансовий Стан', description: 'Manual: Оцінка ліквідності за 24 міс.', category: 'financial', status: 'pending', auto: false },
  { id: 'o1', title: '🏭 Заводський Аудит', description: 'Manual: Наявність потужностей/складів', category: 'operational', status: 'pending', auto: false },
];

const categoryNames = {
  legal: { label: 'ЮРИДИЧНИЙ АУДИТ', color: 'text-yellow-400', border: 'border-yellow-500/30', bg: 'bg-yellow-600/10' },
  financial: { label: 'ФІНАНСОВИЙ АУДИТ', color: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-600/10' },
  compliance: { label: 'COMPLIANCE / AML', color: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-600/10' },
  operational: { label: 'ОПЕРАЦІЙНИЙ КОНТРОЛЬ', color: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-600/10' },
};

export const DueDiligence: React.FC<{ ueid?: string; companyName?: string }> = ({
  ueid = '12345678',
  companyName = 'АТ Укрнафта'
}) => {
  const [items, setItems] = useState<ChecklistItem[]>(DEFAULT_CHECKLIST);
  const [activeTab, setActiveTab] = useState<'legal' | 'financial' | 'compliance' | 'operational'>('legal');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const stats = useMemo(() => {
    const done = items.filter(i => i.status === 'completed').length;
    const fail = items.filter(i => i.status === 'failed').length;
    const total = items.length;
    const progress = (done / total) * 100;
    const risk = Math.min(100, (fail * 40) + (items.filter(i => i.status === 'pending').length * 10));
    return { done, fail, total, progress, risk };
  }, [items]);

  const updateStatus = (id: string, status: ChecklistItem['status']) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, status } : i));
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#020617] text-slate-200 relative overflow-hidden font-sans pb-32">
        <CyberGrid color="rgba(14, 165, 233, 0.03)" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(14,165,233,0.05),transparent_70%)] pointer-events-none" />

        <div className="relative z-10 max-w-[1750px] mx-auto p-6 lg:p-12 space-y-12">
          
          {/* ── HEADER ── */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-10 py-6 border-b border-white/[0.04]">
            <div className="flex items-center gap-8">
               <div className="relative group">
                  <div className="absolute inset-0 bg-sky-600/20 blur-3xl rounded-full scale-150 animate-pulse" />
                  <div className="relative p-6 bg-black border border-sky-900/40 rounded-[2rem] shadow-2xl">
                     <Shield size={42} className="text-sky-500 animate-pulse" />
                  </div>
               </div>
               <div className="space-y-2">
                  <div className="flex items-center gap-3">
                     <span className="badge-v2 bg-sky-600/10 border border-sky-600/20 text-sky-500 px-3 py-1 text-[10px] font-black tracking-[0.3em] uppercase italic">
                       DUE_DILIGENCE // COMPLIANCE_SHIELD
                     </span>
                     <div className="h-px w-10 bg-sky-600/20" />
                     <span className="text-[10px] font-black text-slate-700 font-mono tracking-widest uppercase italic">v57.2-WRAITH</span>
                  </div>
                  <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic skew-x-[-2deg] leading-none">
                    ВЕРИФІКАЦІЯ <span className="text-sky-500 underline decoration-sky-600/20 decoration-8">КОНТРАГЕНТА</span>
                  </h1>
                  <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.4em] italic opacity-80 leading-none">
                     {companyName} • UEID:{ueid} • ПЕРЕВІРКА ЦІЛІСНОСТІ
                  </p>
               </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 bg-black/40 p-5 rounded-[2.5rem] border border-white/[0.05] shadow-2xl">
               <div className="text-center px-6">
                  <p className="text-[8px] font-black text-slate-700 uppercase tracking-widest mb-1 italic">ПРОГРЕС</p>
                  <p className="text-2xl font-black text-white italic font-mono leading-none tracking-tighter">{Math.round(stats.progress)}%</p>
               </div>
               <div className="h-10 w-px bg-white/5" />
               <div className="text-center px-6">
                  <p className="text-[8px] font-black text-slate-700 uppercase tracking-widest mb-1 italic">РИЗИК-СКОР</p>
                  <p className={cn("text-2xl font-black italic font-mono leading-none tracking-tighter", stats.risk > 60 ? 'text-red-500' : stats.risk > 30 ? 'text-amber-500' : 'text-emerald-500')}>
                    {stats.risk}/100
                  </p>
               </div>
               <button className="ml-4 px-10 py-4 bg-sky-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-sky-600 transition-all shadow-xl italic">
                  ЗВІТ_ДЛЯ_CEO
               </button>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-10">
            
            {/* LEFT: WORKFLOW HUD (8/12) */}
            <div className="col-span-12 xl:col-span-8 space-y-10">
               
               {/* Risk Warning if high */}
               {stats.risk >= 50 && (
                 <motion.div 
                   initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                   className="p-8 rounded-[2.5rem] bg-red-600/10 border-2 border-red-600/30 flex items-center justify-between shadow-2xl group"
                 >
                    <div className="flex items-center gap-6">
                       <div className="p-4 bg-red-600 text-white rounded-2xl animate-pulse">
                          <AlertTriangle size={24} />
                       </div>
                       <div>
                          <h4 className="text-lg font-black text-white uppercase italic tracking-tighter">КРИТИЧНИЙ РЕНТГЕН-РИЗИК</h4>
                          <p className="text-[10px] font-bold text-red-400 uppercase tracking-[0.2em] italic">ВИЯВЛЕНО НЕВІДПОВІДНОСТІ В СТРУКТУРІ UBO ТА САНКЦІЙНИХ СПИСКАХ</p>
                       </div>
                    </div>
                    <ArrowRight size={20} className="text-red-600 group-hover:translate-x-2 transition-transform" />
                 </motion.div>
               )}

               {/* Tabs Sidebar Pattern for Categories */}
               <div className="grid grid-cols-12 gap-8">
                  <div className="col-span-12 md:col-span-4 flex flex-col gap-4">
                     {(Object.keys(categoryNames) as Array<keyof typeof categoryNames>).map(catKey => (
                       <button
                         key={catKey}
                         onClick={() => setActiveTab(catKey)}
                         className={cn(
                           "p-6 rounded-[2rem] border-2 text-left transition-all relative overflow-hidden group",
                           activeTab === catKey 
                             ? cn("bg-black/60 shadow-2xl", categoryNames[catKey].border)
                             : "bg-black/20 border-white/[0.04] opacity-50 hover:opacity-100"
                         )}
                       >
                          {activeTab === catKey && (
                            <motion.div layoutId="catGlow" className={cn("absolute inset-0 opacity-[0.03]", categoryNames[catKey].bg)} />
                          )}
                          <p className={cn("text-[9px] font-black uppercase tracking-[0.3em] italic mb-3", activeTab === catKey ? categoryNames[catKey].color : 'text-slate-600')}>
                            {categoryNames[catKey].label}
                          </p>
                          <div className="flex items-center justify-between">
                             <span className="text-[13px] font-black italic uppercase tracking-tighter text-white">
                                {items.filter(i => i.category === catKey && i.status === 'completed').length} / {items.filter(i => i.category === catKey).length}
                             </span>
                             <div className={cn("h-1 w-12 rounded-full", activeTab === catKey ? categoryNames[catKey].bg : 'bg-slate-800')} />
                          </div>
                       </button>
                     ))}
                  </div>

                  {/* Checklist Detail */}
                  <div className="col-span-12 md:col-span-8">
                     <section className="rounded-[3rem] bg-black border-2 border-white/[0.04] p-10 shadow-3xl h-full relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none">
                           <Activity size={240} className="text-sky-500" />
                        </div>
                        <div className="flex items-center justify-between mb-10 pb-6 border-b border-white/[0.04]">
                           <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">{categoryNames[activeTab].label}</h3>
                           <Badge className="bg-white/5 border-white/10 text-slate-500 text-[9px] font-black italic">CHECKPOINT_MODE</Badge>
                        </div>

                        <div className="space-y-4">
                           {items.filter(i => i.category === activeTab).map((item, idx) => (
                             <motion.div
                               key={item.id}
                               initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.08 }}
                               onClick={() => setSelectedId(item.id)}
                               className={cn(
                                 "p-6 rounded-[2rem] border-2 transition-all cursor-pointer group flex items-start gap-6",
                                 selectedId === item.id 
                                   ? "bg-sky-600/10 border-sky-600/30" 
                                   : "bg-white/[0.01] border-white/5 hover:border-white/10 hover:bg-white/[0.03]"
                               )}
                             >
                                <div className="mt-1">
                                   {item.status === 'completed' ? <CheckCircle2 className="text-emerald-500" size={24} /> :
                                    item.status === 'failed' ? <AlertCircle className="text-red-500" size={24} /> :
                                    item.status === 'in_progress' ? <Clock className="text-amber-500 animate-spin-slow" size={24} /> :
                                    <div className="h-6 w-6 rounded-full border-2 border-slate-800 group-hover:border-sky-500 transition-colors" />}
                                </div>
                                <div className="flex-1">
                                   <div className="flex items-center gap-4 mb-2">
                                      <h4 className="text-[15px] font-black text-white uppercase italic tracking-tight">{item.title}</h4>
                                      {item.auto && <span className="text-[8px] font-black px-2 py-0.5 rounded bg-sky-600/10 text-sky-500 border border-sky-600/20">AUTO</span>}
                                   </div>
                                   <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">{item.description}</p>
                                </div>
                                <ChevronDown size={18} className={cn("text-slate-800 transition-transform", selectedId === item.id ? "rotate-180 text-sky-500" : "")} />
                             </motion.div>
                           ))}
                        </div>
                     </section>
                  </div>
               </div>
            </div>

            {/* RIGHT: ACTION HUD (4/12) */}
            <div className="col-span-12 xl:col-span-4 space-y-10">
               
               {/* Item Details Editor */}
               <AnimatePresence mode="wait">
                 {selectedId ? (
                   <motion.section
                     key={selectedId}
                     initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                     className="rounded-[3rem] bg-black border-2 border-sky-900/40 p-10 shadow-3xl space-y-10"
                   >
                      <div className="flex items-center gap-6 mb-8 border-b border-white/[0.04] pb-8">
                         <div className="p-4 rounded-xl bg-sky-600/10 text-sky-500 border border-sky-600/20">
                            <Fingerprint size={24} />
                         </div>
                         <div>
                            <h3 className="text-lg font-black text-white italic uppercase tracking-tighter leading-none mb-1">ДЕТАЛІ ПЕРЕВІРКИ</h3>
                            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{selectedId.toUpperCase()}</p>
                         </div>
                      </div>

                      <div className="space-y-6">
                         <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic mb-4">ВСТАНОВИТИ ВЕРДИКТ</p>
                            <div className="grid grid-cols-2 gap-3">
                               {[
                                  { id: 'completed', l: 'VALID', c: 'bg-emerald-600/10 text-emerald-500 border-emerald-600/20' },
                                  { id: 'failed', l: 'BREACH', c: 'bg-red-600/10 text-red-500 border-red-600/20' },
                                  { id: 'in_progress', l: 'SYNCING', c: 'bg-amber-600/10 text-amber-500 border-amber-600/20' },
                                  { id: 'pending', l: 'IDLE', c: 'bg-slate-900 text-slate-600 border-white/5' },
                               ].map(st => (
                                 <button
                                   key={st.id}
                                   onClick={() => updateStatus(selectedId, st.id as any)}
                                   className={cn(
                                      "px-4 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest italic border transition-all",
                                      items.find(i => i.id === selectedId)?.status === st.id ? st.c : 'bg-black border-white/5 text-slate-700'
                                   )}
                                 >
                                    {st.l}
                                 </button>
                               ))}
                            </div>
                         </div>

                         <div className="space-y-3">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic leading-none">КОМЕНТАР АУДИТОРА</p>
                            <textarea
                               className="w-full bg-black border-2 border-white/5 rounded-2xl p-6 text-[13px] font-bold text-slate-300 italic focus:border-sky-500/40 outline-none transition-all placeholder:text-slate-800"
                               placeholder="ДОДАЙТЕ ПРИМІТКУ..."
                               rows={4}
                            />
                         </div>

                         <button className="w-full py-5 bg-sky-700 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] italic hover:bg-sky-600 shadow-xl flex items-center justify-center gap-4">
                            <Save size={18} /> ЗБЕРЕГТИ_СТАТУС
                         </button>
                      </div>
                   </motion.section>
                 ) : (
                   <div className="rounded-[3rem] bg-black/40 border-2 border-dashed border-white/5 p-16 flex flex-col items-center justify-center text-center space-y-6">
                      <Eye size={48} className="text-slate-800" />
                      <p className="text-[11px] font-bold text-slate-700 uppercase tracking-[0.4em] italic">ВИБЕРІТЬ ПУНКТ<br/>ДЛЯ РЕДАГУВАННЯ</p>
                   </div>
                 )}
               </AnimatePresence>

               {/* Final Decision Panel */}
               <section className="rounded-[3rem] bg-black border-2 border-white/[0.04] p-10 shadow-3xl space-y-6">
                  <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] italic mb-6">ФІНАЛЬНЕ РІШЕННЯ</h3>
                  <button className="w-full py-6 bg-emerald-700 text-white rounded-[1.5rem] text-[12px] font-black uppercase tracking-[0.3em] italic hover:bg-emerald-600 transition-all shadow-2xl flex items-center justify-center gap-4 group">
                     <CheckCircle size={20} className="group-hover:scale-110 transition-transform" /> ЗАТВЕРДИТИ_КОНТРАГЕНТА
                  </button>
                  <button className="w-full py-6 bg-red-700 text-white rounded-[1.5rem] text-[12px] font-black uppercase tracking-[0.3em] italic hover:bg-red-600 transition-all shadow-2xl flex items-center justify-center gap-4 group">
                     <X size={20} className="group-hover:rotate-90 transition-transform" /> ВІДХИЛИТИ_РИЗИК
                  </button>
               </section>

            </div>

          </div>
        </div>
        <style dangerouslySetInnerHTML={{ __html: `
            .shadow-3xl { box-shadow: 0 60px 100px -30px rgba(0,0,0,0.8); }
            .no-scrollbar::-webkit-scrollbar { display: none; }
            .animate-spin-slow { animation: spin 4s linear infinite; }
            @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}} />
      </div>
    </PageTransition>
  );
};

export default DueDiligence;
