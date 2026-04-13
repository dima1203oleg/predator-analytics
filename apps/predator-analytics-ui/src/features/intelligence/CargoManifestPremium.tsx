/**
 * 📦 CARGO MANIFEST FORENSIC // МИТНА ФОРЕНЗИКА | v56.2-TITAN
 * PREDATOR Analytics — Deep Manifest Analysis & Fraud Detection
 * 
 * Аналіз митних декларацій, вантажних маніфестів та виявлення невідповідностей.
 * Детекція схем з підміни кодів УКТЗЕД та заниження митної вартості.
 * 
 * © 2026 PREDATOR Analytics — HR-04 (100% українська)
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileSearch, ShieldAlert, AlertTriangle, CheckCircle, Search, 
  Filter, Download, ArrowRight, Layers, Database, Sparkles,
  Zap, Package, Truck, Ship, Anchor, Fingerprint, Activity,
  Scale, Crosshair, BarChart3, ChevronRight, List
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageTransition } from '@/components/layout/PageTransition';
import { TacticalCard } from '@/components/TacticalCard';
import { ViewHeader } from '@/components/ViewHeader';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';

// ─── TYPES ────────────────────────────────────────────────────────────

interface ManifestItem {
  id: string;
  manifestId: string;
  consignee: string; // Отримувач
  consignor: string; // Відправник
  goodsDescription: string;
  hsCode: string;
  weight: number;
  declaredValue: number;
  riskScore: number;
  anomalies: string[];
  status: 'SAFE' | 'WARNING' | 'CRITICAL';
}

// ─── MOCK DATA ────────────────────────────────────────────────────────

const MOCK_MANIFESTS: ManifestItem[] = [
  {
    id: 'm1',
    manifestId: 'UA/ODS/22901',
    consignee: 'ТОВ_САН_МАРІНО_ТРЕЙД',
    consignor: 'GOLDEN_DRAGON_LOGISTICS_XIAMEN',
    goodsDescription: 'ЕЛЕКТРОННІ_КОМПОНЕНТИ_ТА_ЗАПЧАСТИНИ',
    hsCode: '8541 10 00 00',
    weight: 1240,
    declaredValue: 45200,
    riskScore: 88,
    anomalies: ['VALUE_UNDERESTIMATION', 'WEIGHT_MISMATCH'],
    status: 'CRITICAL'
  },
  {
    id: 'm2',
    manifestId: 'UA/LVV/11405',
    consignee: 'АГРО_ТЕХ_СЕРВІС_ПЛЮС',
    consignor: 'AGRO_GLOBAL_GMBH_BERLIN',
    goodsDescription: 'ЗАПЧАСТИНИ_ДО_ТРАКТОРІВ_ДЛЯ_СІЛЬСЬКОГО_ГОСПОДАРСТВА',
    hsCode: '8433 90 00 00',
    weight: 4500,
    declaredValue: 128000,
    riskScore: 12,
    anomalies: [],
    status: 'SAFE'
  },
  {
    id: 'm3',
    manifestId: 'UA/ODS/22912',
    consignee: 'ТЕХНО_ПРОМ_ГРУП',
    consignor: 'TURK_EXPORT_LOGISTIC_IST',
    goodsDescription: 'ТКАНИНИ_СИНТЕТИЧНІ_РУЛОННІ',
    hsCode: '5407 10 00 00',
    weight: 850,
    declaredValue: 1200,
    riskScore: 65,
    anomalies: ['CODE_MISCLASSIFICATION'],
    status: 'WARNING'
  }
];

export default function CargoManifestPremium() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedManifest, setSelectedManifest] = useState<ManifestItem | null>(MOCK_MANIFESTS[0]);

  const stats = useMemo(() => ([
    { label: 'ПЕРЕВІРЕНО_МАНІФЕСТІВ', value: '1,429', icon: <FileSearch size={14} />, color: 'primary' },
    { label: 'ВИЯВЛЕНО_АНОМАЛІЙ', value: '184', icon: <ShieldAlert size={14} />, color: 'danger', animate: true },
    { label: 'ЗАГАЛЬНИЙ_РИЗИК', value: '47%', icon: <Activity size={14} />, color: 'warning' }
  ]), []);

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#020617] text-slate-200 relative overflow-hidden font-sans pb-32">
        <AdvancedBackground />
        <CyberGrid color="rgba(244, 63, 94, 0.03)" />

        <div className="relative z-10 max-w-[1700px] mx-auto p-4 sm:p-12 space-y-12">
          
           <ViewHeader
             title={
               <div className="flex items-center gap-10">
                  <div className="relative group">
                     <div className="absolute inset-0 bg-rose-600/20 blur-3xl rounded-full scale-150 animate-pulse" />
                     <div className="relative p-7 bg-black border border-rose-900/40 rounded-[2.5rem] shadow-2xl">
                        <Fingerprint size={42} className="text-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)]" />
                     </div>
                  </div>
                  <div className="space-y-2">
                     <div className="flex items-center gap-3">
                        <span className="badge-v2 bg-rose-600/10 border border-rose-600/20 text-rose-500 px-3 py-1 text-[10px] font-black tracking-[0.3em] uppercase italic">
                          MANIFEST_FORENSIC // DEEP_SCAN
                        </span>
                        <div className="h-px w-10 bg-rose-600/20" />
                        <span className="text-[10px] font-black text-slate-700 font-mono tracking-widest uppercase italic">v56.2 TITAN</span>
                     </div>
                     <h1 className="text-6xl font-black text-white tracking-tighter uppercase italic skew-x-[-2deg] leading-none mb-1">
                       МИТНА <span className="text-rose-600 underline decoration-rose-600/20 decoration-8 italic uppercase">ФОРЕНЗИКА</span>
                     </h1>
                     <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.4em] italic opacity-80 leading-none">
                        АНАЛІЗ ВАНТАЖНИХ МАНІФЕСТІВ ТА ДЕТЕКЦІЯ ШАХРАЙСТВА
                     </p>
                  </div>
               </div>
             }
             stats={stats}
             actions={
               <div className="flex gap-4">
                  <button className="px-10 py-5 bg-rose-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] italic hover:bg-rose-600 shadow-2xl transition-all flex items-center gap-4">
                     <Crosshair size={20} /> ЗАПУСТИТИ_СКАНУВАННЯ
                  </button>
               </div>
             }
           />

           <div className="grid grid-cols-12 gap-10">
              
              {/* MANIFEST LIST */}
              <div className="col-span-12 xl:col-span-4 space-y-8">
                 <div className="relative group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-rose-500 transition-colors" size={20} />
                    <input 
                      type="text" placeholder="ID МАНІФЕСТА АБО КОМПАНІЯ..."
                      value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                      className="w-full bg-black border-2 border-white/[0.04] p-5 pl-16 rounded-2xl text-sm font-black text-white italic tracking-widest focus:border-rose-500/40 outline-none transition-all placeholder:text-slate-800"
                    />
                 </div>

                 <div className="space-y-4 max-h-[700px] overflow-y-auto no-scrollbar pr-2">
                    {MOCK_MANIFESTS.map(m => (
                      <button 
                        key={m.id} onClick={() => setSelectedManifest(m)}
                        className={cn(
                          "w-full p-6 bg-black border-2 rounded-[2.5rem] transition-all text-left flex items-center justify-between group",
                          selectedManifest?.id === m.id ? "border-rose-600/40 bg-rose-600/[0.02]" : "border-white/[0.04] hover:border-white/10"
                        )}
                      >
                         <div className="flex items-center gap-5">
                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border", m.status === 'CRITICAL' ? "bg-rose-500/10 border-rose-500/30 text-rose-500" : m.status === 'WARNING' ? "bg-amber-500/10 border-amber-500/30 text-amber-500" : "bg-emerald-500/10 border-emerald-500/30 text-emerald-500")}>
                               <Package size={20} />
                            </div>
                            <div>
                               <h4 className="text-lg font-black text-white italic tracking-tighter uppercase leading-none">{m.manifestId}</h4>
                               <p className="text-[9px] font-black text-slate-700 uppercase italic tracking-widest truncate max-w-[180px]">{m.consignee}</p>
                            </div>
                         </div>
                         <div className="text-right">
                            <p className={cn("text-xl font-black font-mono tracking-tighter italic", m.riskScore > 80 ? "text-rose-500" : "text-emerald-500")}>{m.riskScore}%</p>
                            <p className="text-[8px] font-black text-slate-800 uppercase italic">RISK_SCORE</p>
                         </div>
                      </button>
                    ))}
                 </div>
              </div>

              {/* MANIFEST DETAILS */}
              <div className="col-span-12 xl:col-span-8 space-y-10">
                 <AnimatePresence mode="wait">
                    {selectedManifest && (
                      <motion.div key={selectedManifest.id} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="space-y-10">
                         <div className="p-12 rounded-[4rem] bg-black border-2 border-white/[0.04] shadow-3xl space-y-10 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-12 opacity-5"><Scale size={200} className="text-rose-500" /></div>
                            <div className="flex items-center justify-between border-b border-white/[0.04] pb-8 relative z-10">
                               <div className="space-y-1">
                                  <h3 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">{selectedManifest.manifestId}</h3>
                                  <p className="text-[10px] font-black text-slate-700 uppercase italic tracking-widest flex items-center gap-3">
                                     <Activity size={12} className="text-rose-500" /> FORENSIC_DOSSIER_ID: {selectedManifest.id.toUpperCase()}
                                  </p>
                               </div>
                               <button className="p-4 bg-rose-600/10 border border-rose-500/30 rounded-xl text-rose-500 hover:bg-rose-600 hover:text-white transition-all">
                                  <Download size={24} />
                               </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                               <div className="space-y-6">
                                  <div className="p-6 bg-white/[0.01] border border-white/[0.04] rounded-3xl space-y-2">
                                     <p className="text-[9px] font-black text-slate-700 uppercase italic">ОТРИМУВАЧ_ВАНТАЖУ</p>
                                     <p className="text-xl font-black text-white italic uppercase tracking-tighter">{selectedManifest.consignee}</p>
                                  </div>
                                  <div className="p-6 bg-white/[0.01] border border-white/[0.04] rounded-3xl space-y-2">
                                     <p className="text-[9px] font-black text-slate-700 uppercase italic">ВІДПРАВНИК_ВАНТАЖУ</p>
                                     <p className="text-xl font-black text-white italic uppercase tracking-tighter">{selectedManifest.consignor}</p>
                                  </div>
                               </div>
                               <div className="space-y-6">
                                  <div className="p-6 bg-white/[0.01] border border-white/[0.04] rounded-3xl space-y-2">
                                     <p className="text-[9px] font-black text-slate-700 uppercase italic">ОПИС_ТОВАРУ (ДЕКЛАРОВАНИЙ)</p>
                                     <p className="text-sm font-black text-slate-300 italic uppercase">"{selectedManifest.goodsDescription}"</p>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                     <div className="p-6 bg-white/[0.01] border border-white/[0.04] rounded-3xl space-y-1">
                                        <p className="text-[9px] font-black text-slate-700 uppercase italic">ВАГА_KG</p>
                                        <p className="text-xl font-black text-white italic font-mono">{selectedManifest.weight.toLocaleString()}</p>
                                     </div>
                                     <div className="p-6 bg-white/[0.01] border border-white/[0.04] rounded-3xl space-y-1">
                                        <p className="text-[9px] font-black text-slate-700 uppercase italic">ВАРТІСТЬ_USD</p>
                                        <p className="text-xl font-black text-emerald-500 italic font-mono">${selectedManifest.declaredValue.toLocaleString()}</p>
                                     </div>
                                  </div>
                               </div>
                            </div>

                            {selectedManifest.anomalies.length > 0 && (
                              <div className="relative z-10 p-8 rounded-[2.5rem] bg-rose-500/[0.02] border border-rose-500/20 space-y-4">
                                 <h4 className="text-[10px] font-black text-rose-500 uppercase italic tracking-widest flex items-center gap-3">
                                    <Siren size={16} /> ВИЯВЛЕНІ_АНОМАЛІЇ_СУБ'ЄКТА
                                 </h4>
                                 <div className="flex flex-wrap gap-4">
                                    {selectedManifest.anomalies.map((a, i) => (
                                      <div key={i} className="px-5 py-2 bg-rose-500/10 border border-rose-500/30 rounded-xl text-[10px] font-black text-rose-400 italic uppercase tracking-widest">
                                         {a}
                                      </div>
                                    ))}
                                 </div>
                              </div>
                            )}

                            <div className="relative z-10 pt-10 border-t border-white/[0.04] flex items-center gap-10">
                               <div className="flex items-center gap-4">
                                  <div className="w-4 h-4 rounded-full bg-rose-500 animate-pulse" />
                                  <p className="text-[10px] font-black text-slate-500 uppercase italic tracking-widest">DEEP_FORENSIC_ANALYSIS_IN_PROGRESS...</p>
                               </div>
                               <div className="flex-1 h-px bg-white/[0.04]" />
                               <button className="px-10 py-5 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] italic hover:bg-slate-200 shadow-2xl transition-all">
                                  ГЕНЕРУВАТИ_ЗВІТ
                                </button>
                            </div>
                         </div>

                         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <TacticalCard variant="cyber" className="p-8 rounded-[2.5rem] border-white/[0.04] bg-black shadow-2xl space-y-4">
                               <h5 className="text-[9px] font-black text-slate-700 uppercase italic tracking-widest">ХРОНОЛОГІЯ_СУБ'ЄКТА</h5>
                               <div className="space-y-4">
                                  {[1,2,3].map(i => (
                                    <div key={i} className="flex items-center gap-4 text-xs">
                                       <div className="w-2 h-2 rounded-full bg-slate-800" />
                                       <p className="text-slate-500 font-black italic">202{6-i}/03/2{i} // МАНІФЕСТ_OK</p>
                                    </div>
                                  ))}
                               </div>
                            </TacticalCard>
                            <TacticalCard variant="holographic" className="p-8 rounded-[2.5rem] border-rose-500/20 bg-rose-500/[0.02] shadow-2xl space-y-4">
                               <h5 className="text-[9px] font-black text-rose-500 uppercase italic tracking-widest">AI_ПРЕДИКЦІЯ_РИЗИКУ</h5>
                               <p className="text-xs text-slate-400 font-black italic">Ймовірність заниження вартості: <span className="text-rose-500">92.4%</span></p>
                               <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                                  <div className="h-full bg-rose-600 w-[92%]" />
                               </div>
                            </TacticalCard>
                            <TacticalCard variant="cyber" className="p-8 rounded-[2.5rem] border-white/[0.04] bg-black shadow-2xl space-y-4">
                               <h5 className="text-[9px] font-black text-slate-700 uppercase italic tracking-widest">ПОРІВНЯННЯ_HSCODE</h5>
                               <div className="space-y-2">
                                  <p className="text-[10px] font-black text-slate-500 italic">ДЕКЛАРОВАНО: 8541</p>
                                  <p className="text-[10px] font-black text-emerald-500 italic">РЕКОМЕНДОВАНО: 8542</p>
                               </div>
                            </TacticalCard>
                         </div>
                      </motion.div>
                    )}
                 </AnimatePresence>
              </div>

           </div>
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
            .shadow-3xl { box-shadow: 0 60px 100px -30px rgba(0,0,0,0.8); }
            .no-scrollbar::-webkit-scrollbar { display: none; }
        `}} />
      </div>
    </PageTransition>
  );
}

const Siren = ({ size }: { size?: number }) => (
  <svg width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 18v-6a5 5 0 1 1 10 0v6" />
    <path d="M5 21a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-1a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v1z" />
    <path d="M12 7V2" />
    <path d="M9 4l2 2" />
    <path d="M15 4l-2 2" />
  </svg>
);
