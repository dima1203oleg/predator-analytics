/**
 * 🚩 ZRADA CONTROL // СИСТЕМА ДЕТЕКЦІЇ ЗРАДИ | v58.2-WRAITH
 * PREDATOR Analytics — Corruption & Collaboration Intelligence
 * 
 * Моніторинг ризиків: Корупція, Колаборація, промислове шпигунство.
 * Elite Power Design · Integrity Sentinel · Tier-1
 * 
 * © 2026 PREDATOR Analytics — HR-04 (100% українська)
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldX, RefreshCw, Radio, Search, Plus, AlertTriangle, Users,
  Phone, Mail, Building2, Clock, ChevronRight, ArrowRight, Eye,
  Trash2, FileText, Activity, Network, MessageSquare, Target,
  Zap, CheckCircle2, TrendingUp, Filter, Link, UserX, ShieldCheck,
  Fingerprint, Mic, Video, Globe, Database, Cpu, Scan, Microscope,
  FileSearch, Binary, MapPin, Share2, Crosshair, Skull, Crown,
  Lock
} from 'lucide-react';
import { PageTransition } from '@/components/layout/PageTransition';
import { TacticalCard } from '@/components/ui/TacticalCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ViewHeader } from '@/components/ViewHeader';
import { cn } from '@/utils/cn';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { useEffect } from 'react';

type BetrayalRisk = 'Підтверджено' | 'Висока підозра' | 'Моніторинг' | 'Очищено';
type EvidenceType = 'telegram' | 'тендер' | 'телефон' | 'соцмережі' | 'контракт' | 'аудіо' | 'відео' | 'геолокація' | 'крипто';

interface BetrayalSubject {
  id: string;
  name: string;
  role: string;
  company?: string;
  phone?: string;
  email?: string;
  addedDate: string;
  lastSignal: string;
  risk: BetrayalRisk;
  evidenceCount: number;
  competitor: string;
  signals: BetrayalSignal[];
}

interface BetrayalSignal {
  id: string;
  type: EvidenceType;
  date: string;
  description: string;
  source: string;
  confidence: number;
  metadata?: Record<string, string>;
}

const MOCK_SUBJECTS: BetrayalSubject[] = [
  {
    id: '1',
    name: 'Ковальчук Дмитро Олексійович',
    role: 'Партнер-посередник',
    company: 'ТОВ "Меркурій Торг"',
    phone: '+380501112233',
    email: 'kovalchuk@mercury.ua',
    addedDate: '2026-01-10',
    lastSignal: '2026-03-23 18:40',
    risk: 'Підтверджено',
    evidenceCount: 7,
    competitor: 'ТОВ "КОНКУРЕНТ-АЛЬФА"',
    signals: [
      { id: 's1', type: 'telegram', date: '2026-03-22', description: 'Виявлено в Telegram-каналі конкурента «Альфа-Бізнес» — коментує та ставить реакції на 12 постах', source: 'PREDATOR_TG_PARSER', confidence: 91 },
      { id: 's2', type: 'tender', date: '2026-03-15', description: 'Спільний тендер на ProZorro: ТОВ "Меркурій Торг" + ТОВ "Конкурент-Альфа"', source: 'PROZORRO_API', confidence: 98 },
      { id: 's3', type: 'audio', date: '2026-03-05', description: 'Перехоплення розмови: обговорення відкатів за передачу клієнтської бази', source: 'SIGINT_AUDIO', confidence: 94, metadata: { duration: '1:42', quality: 'High' } }
    ],
  },
  {
    id: '2',
    name: 'Зінченко Марина Вікторівна',
    role: 'Постачальник',
    phone: '+380672223344',
    addedDate: '2026-02-01',
    lastSignal: '2026-03-20 09:15',
    risk: 'Висока підозра',
    evidenceCount: 4,
    competitor: 'БЕТА_ГРУП',
    signals: [
      { id: 's4', type: 'social', date: '2026-03-19', description: 'Спільне фото з директором БетаГруп на корпоративі (Instagram)', source: 'OSINT_SOCIAL', confidence: 65 },
      { id: 's11', type: 'crypto', date: '2026-03-18', description: 'Транзакція 2.5 ETH з гаманця, асоційованого з конкурентом', source: 'BLOCKCHAIN_FORENSIC', confidence: 72 }
    ],
  }
];

export default function ZradaControlView() {
  const [selectedSubject, setSelectedSubject] = useState<BetrayalSubject | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRisk, setFilterRisk] = useState<BetrayalRisk | 'Всі'>('Всі');
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [isOsintLoading, setIsOsintLoading] = useState(false);
  const { isOffline } = useBackendStatus();

  useEffect(() => {
    if (isOffline) {
      window.dispatchEvent(new CustomEvent('predator-error', {
        detail: {
          service: 'ВнутрішняДоброчесність',
          message: 'Активовано автономний режим детекції (ВУЗЛИ_ЗРАДИ). Можливе обмеження глибини OSINT-пошуку.',
          severity: 'warning',
          timestamp: new Date().toISOString(),
          code: 'ВУЗЛИ_ЗРАДИ'
        }
      }));
    }
  }, [isOffline]);

  const stats = useMemo(() => ({
    total: MOCK_SUBJECTS.length,
    confirmed: MOCK_SUBJECTS.filter(s => s.risk === 'Підтверджено').length,
    suspicious: MOCK_SUBJECTS.filter(s => s.risk === 'Висока підозра').length,
    monitoring: MOCK_SUBJECTS.filter(s => s.risk === 'Моніторинг').length,
  }), []);

  const filtered = useMemo(() =>
    MOCK_SUBJECTS.filter(s => {
      const q = searchQuery.toLowerCase();
      const matchSearch = s.name.toLowerCase().includes(q) || s.company?.toLowerCase().includes(q) || s.role.toLowerCase().includes(q);
      const matchRisk = filterRisk === 'Всі' || s.risk === filterRisk;
      return matchSearch && matchRisk;
    }),
  [searchQuery, filterRisk]);

  const runDeepOsint = () => {
    setIsOsintLoading(true);
    setTimeout(() => setIsOsintLoading(false), 3000);
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#020202] text-slate-200 relative overflow-hidden font-sans pb-32">
        <AdvancedBackground />
        <CyberGrid color="rgba(225, 29, 72, 0.04)" />

        <div className="relative z-10 max-w-[1750px] mx-auto p-4 sm:p-12 space-y-12 h-screen flex flex-col">
           
           <ViewHeader
             title={
               <div className="flex items-center gap-10">
                  <div className="relative group">
                     <div className="absolute inset-0 bg-rose-600/20 blur-3xl rounded-full scale-150 animate-pulse" />
                     <div className="relative p-7 bg-black border-2 border-rose-500/40 rounded-[2.5rem] shadow-4xl transform -rotate-2 hover:rotate-0 transition-all">
                        <ShieldX size={42} className="text-rose-600 shadow-[0_0_20px_#e11d48]" />
                     </div>
                  </div>
                  <div className="space-y-2">
                     <div className="flex items-center gap-4">
                        <span className="bg-rose-500/10 border border-rose-500/20 text-rose-500 px-4 py-1 text-[10px] font-black tracking-[0.4em] uppercase italic rounded-lg">
                          МОНІТОРИНГ_ДОБРОЧЕСНОСТІ // КОНТУР_ЗРАДА
                        </span>
                        <div className="h-px w-12 bg-rose-500/20" />
                        <span className="text-[10px] font-black text-rose-800 font-mono tracking-widest uppercase italic shadow-sm">v58.2-WRAITH</span>
                     </div>
                     <h1 className="text-6xl font-black text-white tracking-tighter uppercase italic skew-x-[-3deg] leading-none">
                       СИСТЕМА <span className="text-rose-600 underline decoration-rose-600/30 decoration-[14px] underline-offset-[12px] italic uppercase tracking-tighter">ЗРАДА</span>
                     </h1>
                  </div>
               </div>
             }
             breadcrumbs={['ІНТЕЛЕКТ', 'ДОБРОЧЕСНІСТЬ', 'ЕКРАН_ЗРАДИ']}
             badges={[
               { label: 'СЕКРЕТНО_S2', color: 'danger', icon: <Lock size={10} /> },
               { label: 'ВАРТОВИЙ_ЩИТ', color: 'primary', icon: <ShieldCheck size={10} /> },
             ]}
             stats={[
               { label: 'ПІД_НАГЛЯДОМ', value: String(stats.total), icon: <Users size={14} />, color: 'primary' },
               { label: 'ПІДТВЕРДЖЕНА_ЗРАДА', value: String(stats.confirmed), icon: <Skull size={14} />, color: 'danger', animate: true },
               { label: 'СЕРЕДНІЙ_РИЗИК', value: '84%', icon: <AlertTriangle size={14} />, color: 'warning' },
               { label: 'ІНДЕКС_ДОБРОЧЕСНОСТІ', value: '0.912', icon: <Fingerprint />, color: 'success' },
             ]}
             actions={
               <div className="flex gap-4">
                  <button onClick={runDeepOsint} className="px-8 py-4 bg-rose-900/10 border border-rose-500/20 text-rose-500 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] italic hover:bg-rose-600 hover:text-white transition-all shadow-xl">
                     {isOsintLoading ? <RefreshCw className="animate-spin" size={16} /> : <Scan size={16} className="inline mr-2" />}
                     {isOsintLoading ? 'СКАНУВАННЯ...' : 'НЕЙРОННИЙ_СКРІНІНГ'}
                  </button>
                  <button onClick={() => setIsAddingMode(true)} className="px-8 py-4 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] italic hover:bg-rose-500 shadow-2xl transition-all border border-rose-400/20">
                     <Plus size={16} className="inline mr-2" /> ДОДАТИ_ОБ'ЄКТ
                  </button>
               </div>
             }
           />

           <div className="grid grid-cols-12 gap-10 flex-1 min-h-0">
              
              {/* OBJECT LIST PANEL */}
              <section className="col-span-12 xl:col-span-5 flex flex-col gap-8">
                 <div className="p-8 rounded-[3rem] bg-black border border-white/[0.04] shadow-3xl space-y-6">
                    <div className="relative group">
                       <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-rose-500 transition-colors" size={24} />
                       <input 
                         type="text" placeholder="ПОШУК: ІМ'Я, ЄДРПОУ, РОЛЬ..."
                         value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                         className="w-full bg-white/[0.01] border-2 border-white/[0.04] p-5 pl-16 rounded-2xl text-lg font-black text-white italic tracking-tighter focus:border-rose-500/40 outline-none transition-all"
                       />
                    </div>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                       {(['Всі', 'Підтверджено', 'Висока підозра', 'Моніторинг'].map(r => (
                         <button key={r} onClick={() => setFilterRisk(r as any)} className={cn("px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest italic border transition-all whitespace-nowrap", filterRisk === r ? "bg-rose-600 border-rose-400 text-white shadow-lg shadow-rose-900/20" : "bg-black text-slate-600 border-white/5")}>
                           {r}
                         </button>
                       )))}
                    </div>
                 </div>

                 <div className="flex-1 overflow-y-auto no-scrollbar space-y-6">
                    {filtered.map((subject, i) => (
                       <motion.div key={subject.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} onClick={() => setSelectedSubject(subject)} className={cn("p-8 rounded-[2.5rem] bg-black border-2 cursor-pointer transition-all group relative overflow-hidden", selectedSubject?.id === subject.id ? "border-rose-500/40 bg-rose-500/[0.05]" : "border-white/[0.04] hover:border-rose-600/20")}>
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-6">
                                <div className={cn("p-4 rounded-2xl border bg-black/40 shadow-xl", subject.risk === 'Підтверджено' ? "text-rose-500 border-rose-500/30" : "text-slate-600 border-white/10")}>
                                   <UserX size={28} />
                                </div>
                                <div className="space-y-1">
                                   <h3 className="text-xl font-black text-white uppercase italic tracking-tighter group-hover:text-rose-500 transition-colors leading-none">{subject.name}</h3>
                                   <div className="flex items-center gap-3">
                                      <span className={cn("text-[9px] font-black uppercase border px-2 py-0.5 rounded", subject.risk === 'Підтверджено' ? "text-rose-500 border-rose-500/20" : "text-slate-700 border-white/5")}>{subject.risk}</span>
                                      <span className="text-[9px] font-black text-slate-800 uppercase italic font-mono tracking-widest">{subject.role}</span>
                                   </div>
                                </div>
                             </div>
                             <div className="text-right">
                                <p className="text-3xl font-black text-rose-500 italic font-mono leading-none tracking-tighter mb-1">{subject.evidenceCount}</p>
                                <p className="text-[8px] font-black text-slate-800 uppercase tracking-widest leading-none opacity-50">ДОКАЗІВ</p>
                             </div>
                          </div>
                       </motion.div>
                    ))}
                 </div>
              </section>

              {/* DETAILS PANEL */}
              <section className="col-span-12 xl:col-span-7 flex flex-col gap-8">
                 <AnimatePresence mode="wait">
                    {selectedSubject ? (
                      <motion.div key={selectedSubject.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-10">
                         <TacticalCard variant="holographic" className="p-10 rounded-[4rem] border-white/5 relative overflow-hidden h-fit">
                            <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none rotate-12">
                               <Fingerprint size={300} className="text-rose-600" />
                            </div>
                            <div className="relative z-10 flex flex-col gap-10">
                               <div className="flex items-start justify-between">
                                  <div className="space-y-3">
                                     <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none skew-x-[-2deg]">{selectedSubject.name}</h2>
                                     <div className="flex items-center gap-4">
                                        <span className="px-4 py-1.5 bg-rose-600/10 border border-rose-600/30 text-rose-500 text-[10px] font-black italic rounded-full uppercase tracking-widest shadow-lg shadow-rose-900/10 ">{selectedSubject.risk}</span>
                                        <p className="text-[11px] font-black text-slate-700 uppercase tracking-[0.4em] italic leading-none">{selectedSubject.role} // MONITOR_ID: {selectedSubject.id}</p>
                                     </div>
                                  </div>
                                  <div className="flex gap-4">
                                     <button className="px-8 py-3 bg-white/5 hover:bg-[#E11D48] border border-white/10 hover:border-[#E11D48]/50 text-white hover:text-black text-[10px] font-black uppercase tracking-[0.2em] italic rounded-2xl transition-all shadow-2xl">ФОРЕНЗІК_ПРОФІЛЬ</button>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-black/80 rounded-[2.5rem] border border-white/5 shadow-inner-xl">
                                   <div className="space-y-1 pl-4 border-l-2 border-rose-600/20">
                                      <p className="text-[9px] font-black text-slate-700 uppercase tracking-widest italic mb-2">КОНТАКТНИЙ_СЛІД</p>
                                      <p className="text-sm font-black text-white italic font-mono leading-none">{selectedSubject.phone || 'N/A'}</p>
                                   </div>
                                   <div className="space-y-1 pl-4 border-l-2 border-rose-600/20">
                                      <p className="text-[9px] font-black text-slate-700 uppercase tracking-widest italic mb-2">АСОЦІЙОВАНА_ЦІЛЬ</p>
                                      <p className="text-sm font-black text-rose-600 italic font-mono leading-none">{selectedSubject.competitor}</p>
                                   </div>
                                   <div className="space-y-1 pl-4 border-l-2 border-rose-600/20">
                                      <p className="text-[9px] font-black text-slate-700 uppercase tracking-widest italic mb-2">ПОСТАНОВКА_НА_ОБЛІК</p>
                                      <p className="text-sm font-black text-white italic font-mono leading-none">{selectedSubject.addedDate}</p>
                                   </div>
                                </div>
                            </div>
                         </TacticalCard>

                         <div className="p-10 rounded-[4rem] bg-black border-2 border-white/[0.04] shadow-3xl space-y-10 flex-1 overflow-y-auto no-scrollbar border-t-rose-600/10">
                              <div className="flex items-center gap-6 pb-6 border-b border-white/[0.04]">
                                 <Crosshair size={24} className="text-rose-600 animate-spin-slow" />
                                 <h3 className="text-[14px] font-black text-white italic uppercase tracking-[0.5em] ">СИГНАЛЬНИЙ ДЕШБОРД (DETECTION_LOG)</h3>
                              </div>
                              <div className="space-y-6">
                                 {selectedSubject.signals.map((signal, i) => (
                                   <div key={signal.id} className="p-8 bg-white/[0.01] border border-white/[0.04] rounded-[2.5rem] hover:border-rose-600/30 transition-all group space-y-6 shadow-xl">
                                      <div className="flex items-start gap-6">
                                         <div className="p-4 bg-black border border-white/10 rounded-2xl text-rose-500 shadow-lg">
                                            {signal.type === 'telegram' ? <MessageSquare size={20} /> : signal.type === 'audio' ? <Mic size={20} /> : <FileText size={20} />}
                                         </div>
                                         <div className="space-y-2 flex-1">
                                            <div className="flex items-center justify-between">
                                               <p className="text-[10px] font-black text-slate-700 italic uppercase tracking-widest">SOURCE: {signal.source} // {signal.date}</p>
                                               <span className="text-[11px] font-black text-rose-500 italic font-mono">{signal.confidence}% CONF.</span>
                                            </div>
                                            <p className="text-lg font-black text-white italic leading-snug group-hover:text-rose-400 transition-colors">"{signal.description}"</p>
                                         </div>
                                      </div>
                                      <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden shadow-inner">
                                         <motion.div initial={{ width: 0 }} animate={{ width: `${signal.confidence}%` }} className={cn("h-full shadow-[0_0_10px_rgba(225,29,72,0.4)]", signal.confidence > 80 ? "bg-rose-600" : "bg-rose-500/40")} />
                                      </div>
                                   </div>
                                 ))}
                              </div>
                         </div>
                      </motion.div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center space-y-10 opacity-20">
                         <Target size={120} className="text-slate-600" />
                         <p className="text-xl font-black text-slate-500 uppercase tracking-[1em] italic text-center">ОБЕРІТЬ ОБ'ЄКТ МОНІТОРИНГУ</p>
                      </div>
                    )}
                 </AnimatePresence>
              </section>
           </div>
        </div>

        {/* MODAL: ADD TARGET */}
        <AnimatePresence>
           {isAddingMode && (
             <div className="fixed inset-0 z-[200] flex items-center justify-center p-8 bg-black/95 backdrop-blur-3xl">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-2xl bg-[#020202] border-2 border-rose-500/20 p-12 rounded-[4.5rem] shadow-[0_0_100px_rgba(225,29,72,0.1)] space-y-10 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-16 opacity-[0.02] pointer-events-none rotate-45">
                      <Plus size={300} className="text-rose-500" />
                   </div>
                   <div className="space-y-2 relative z-10 border-l-4 border-rose-600 pl-8">
                      <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter skew-x-[-2deg] leading-none">АВТОРИЗАЦІЯ ОБ'ЄКТА</h2>
                      <p className="text-[11px] font-black text-slate-700 uppercase tracking-[0.5em] italic leading-none">NEW_INTEGRITY_TARGET_v58.2-WRAITH</p>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-slate-700 uppercase italic tracking-widest">ПІБ_ЦІЛІ</label>
                         <Input className="h-16 bg-white/[0.01] border-white/10 rounded-2xl font-black italic uppercase text-white focus:border-rose-500/40 transition-all placeholder:text-slate-800" />
                      </div>
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-slate-700 uppercase italic tracking-widest">АСОЦІЙОВАНИЙ_КОНКУРЕНТ</label>
                         <Input className="h-16 bg-white/[0.01] border-white/10 rounded-2xl font-black italic uppercase text-white focus:border-rose-500/40 transition-all placeholder:text-slate-800" />
                      </div>
                      <div className="col-span-2 space-y-3">
                         <label className="text-[10px] font-black text-slate-700 uppercase italic tracking-widest">ДЕТАЛІ_ПІДОЗРИ (EVIDENCE_BASE)</label>
                         <textarea className="w-full h-40 bg-white/[0.01] border border-white/10 rounded-3xl p-8 font-black italic uppercase outline-none focus:border-rose-500/40 transition-all text-white placeholder:text-slate-800" />
                      </div>
                   </div>
                   <div className="flex gap-4 relative z-10 pt-4">
                      <button onClick={() => setIsAddingMode(false)} className="flex-1 py-6 bg-white/5 border border-white/5 text-slate-600 rounded-2xl text-[11px] font-black uppercase italic tracking-widest hover:text-white transition-all">СКАСУВАТИ</button>
                      <button onClick={() => setIsAddingMode(false)} className="flex-[3] px-12 py-6 bg-rose-700 text-white rounded-2xl text-[11px] font-black uppercase italic tracking-widest shadow-2xl hover:bg-rose-600 hover:shadow-rose-900/40 transition-all">АКТИВУВАТИ_ВІДСТЕЖЕННЯ</button>
                   </div>
                </motion.div>
             </div>
           )}
        </AnimatePresence>

        <style dangerouslySetInnerHTML={{ __html: `
            .shadow-3xl { box-shadow: 0 60px 100px -30px rgba(0,0,0,0.8); }
            .no-scrollbar::-webkit-scrollbar { display: none; }
            .animate-spin-slow { animation: spin 5s linear infinite; }
            @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}} />
      </div>
    </PageTransition>
  );
}
