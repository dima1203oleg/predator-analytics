/**
 * 📦 CARGO MANIFEST FORENSIC // МИТНА ФОРЕНЗИКА | v57.2-WRAITH
 * PREDATOR Analytics — Deep Manifest Analysis & Fraud Detection
 * 
 * Аналіз митних декларацій, вантажних маніфестів та виявлення невідповідностей.
 * Детекція схем з підміни кодів УКТЗЕД та заниження митної вартості.
 * 
 * Sovereign Power Design · Tactical · Tier-1
 * 
 * © 2026 PREDATOR Analytics — HR-04 (100% українська)
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileSearch, ShieldAlert, AlertTriangle, CheckCircle, Search,
  Filter, Download, ArrowRight, Layers, Database, Sparkles,
  Zap, Package, Truck, Ship, Anchor, Fingerprint, Activity,
  Scale, Crosshair, BarChart3, ChevronRight, List, Siren, Lock, History,
  Eye, Target, ShieldCheck, RefreshCw, Box, Boxes, ScanFace, Cpu
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { PageTransition } from '@/components/layout/PageTransition';
import { CyberGrid } from '@/components/CyberGrid';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { ViewHeader } from '@/components/ViewHeader';
import { DiagnosticsTerminal } from '@/components/intelligence/DiagnosticsTerminal';
import { useBackendStatus } from '@/hooks/useBackendStatus';

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
  const [refreshing, setRefreshing] = useState(false);
  const { isOffline, nodeSource, healingProgress } = useBackendStatus();

  useEffect(() => {
    if (isOffline) {
      window.dispatchEvent(new CustomEvent('predator-error', {
        detail: {
          service: 'CargoForensic',
          message: `РЕЖИМ АВТОНОМНОЇ МИТНОЇ ФОРЕНЗИКИ [${nodeSource}]: Доступ до центральної бази обмежено. Використовується MIRROR_VAULT.`,
          severity: 'warning',
          timestamp: new Date().toISOString(),
          code: 'MANIFEST_OFFLINE'
        }
      }));
    } else {
      window.dispatchEvent(new CustomEvent('predator-error', {
        detail: {
          service: 'CargoForensic',
          message: `ВАНТАЖНИЙ_ВУЗОЛ [${nodeSource}]: ФОРЕНЗИК-МАТРИЦЮ успішно активовано. Готовність до глибокого аналізу маніфестів.`,
          severity: 'info',
          timestamp: new Date().toISOString(),
          code: 'MANIFEST_SUCCESS'
        }
      }));
    }
  }, [isOffline, nodeSource]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(r => setTimeout(r, 1200));
    setRefreshing(false);
  };

  const filteredManifests = useMemo<ManifestItem[]>(() => {
    return MOCK_MANIFESTS.filter(m => 
      m.manifestId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.consignee.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#020202] text-slate-200 relative overflow-hidden font-sans pb-40 px-4 xl:px-12">
        <AdvancedBackground />
        <CyberGrid color="rgba(245, 158, 11, 0.04)" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.03),transparent_70%)] pointer-events-none" />

        <div className="relative z-10 max-w-[1850px] mx-auto space-y-16 flex flex-col items-stretch pt-12">
          
          <ViewHeader
            title={
              <div className="flex items-center gap-12">
                <div className="relative group">
                  <div className="absolute inset-0 bg-amber-600/20 blur-[80px] rounded-full scale-150 animate-pulse" />
                  <div className="relative p-8 bg-black border-2 border-amber-600/40 rounded-[3rem] shadow-[0_0_30px_rgba(245,158,11,0.2)] transform rotate-3 hover:rotate-0 transition-all duration-700">
                    <Fingerprint size={48} className="text-amber-500 shadow-[0_0_30px_#f59e0b]" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-6">
                    <span className="bg-amber-600/10 border border-amber-600/20 text-amber-500 px-5 py-1.5 text-[10px] font-black tracking-[0.4em] uppercase italic rounded-xl">
                      MANIFEST_FORENSIC // DEEP_SCAN_SYSTEM
                    </span>
                    <div className="h-px w-16 bg-amber-600/20" />
                    <span className="text-[10px] font-black text-amber-800 font-mono tracking-widest uppercase italic shadow-sm">v57.2-WRAITH</span>
                  </div>
                  <h1 className="text-7xl font-black text-white tracking-tighter uppercase italic skew-x-[-4deg] leading-none text-shadow-wraith">
                    МИТНА <span className="text-amber-500 underline decoration-amber-600/30 decoration-[16px] underline-offset-[16px] italic uppercase tracking-tighter">ФОРЕНЗИКА</span>
                  </h1>
                </div>
              </div>
            }
            stats={[
              { label: 'MANIFEST_THROUGHPUT', value: '42.8k', icon: <Boxes size={14} />, color: 'primary' },
              { label: 'RISK_VECTORS', value: '14 ACTIVE', icon: <ScanFace size={14} />, color: 'danger', animate: true },
              { label: 'SYSTEM_STATUS', value: isOffline ? 'MIRROR_ACTIVE' : 'CONNECTED', icon: isOffline ? <Activity size={14} /> : <Cpu size={14} />, color: isOffline ? 'warning' : 'success' }
            ] as const}
            breadcrumbs={['INTEL', 'CUSTOMS', 'FORENSIC_ARRAY']}
            badges={[
              { label: 'FORENSIC_T1', color: 'warning', icon: <Fingerprint size={10} /> },
              { label: nodeSource, color: isOffline ? 'warning' : 'primary', icon: <Database size={10} /> },
              { label: 'v57.2-WRAITH', color: 'danger', icon: <ShieldCheck size={10} /> }
            ]}
          />

          <div className="flex justify-end gap-6 mb-12">
             <button 
              onClick={handleRefresh} 
              className={cn(
                "p-7 bg-black border-2 border-white/[0.04] rounded-[2rem] text-slate-500 hover:text-amber-500 transition-all shadow-4xl group/btn",
                refreshing && "animate-spin cursor-not-allowed opacity-50"
              )}
            >
              <RefreshCw size={32} className={cn("transition-transform duration-700", refreshing ? "" : "group-hover/btn:rotate-180")} />
            </button>
            <button className="relative px-12 py-7 h-fit group/main overflow-hidden rounded-[2.2rem]">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-700 to-amber-600 transition-transform duration-500 group-hover/main:scale-105" />
              <div className="relative flex items-center gap-6 text-slate-950 font-black uppercase italic tracking-[0.3em] text-[12px]">
                <Crosshair size={24} /> ЗАПУСТИТИ_СКАНУВАННЯ
              </div>
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/main:translate-x-[100%] transition-transform duration-1000" />
            </button>
          </div>

          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {[
              { label: 'ПЕРЕВІРЕНО_МАНІФЕСТІВ', value: '1,842', sub: 'За останні 24 години', icon: FileSearch, color: '#D4AF37' },
              { label: 'ВИЯВЛЕНО_АНОМАЛІЙ', value: '291', sub: 'Критичні розбіжності', icon: ShieldAlert, color: '#F59E0B' },
              { label: 'ЗАГАЛЬНИЙ_РИЗИК_UA', value: '54%', sub: 'Середньоринковий показник', icon: Activity, color: '#F59E0B' },
            ].map((m, i) => (
              <div key={i} className="p-10 rounded-[4rem] bg-black border-2 border-white/[0.03] shadow-4xl group relative overflow-hidden transition-all hover:border-white/10">
                <div className="absolute -top-10 -right-10 p-12 opacity-[0.03] group-hover:opacity-[0.1] transition-all duration-700 rotate-12 group-hover:rotate-0">
                  <m.icon size={160} style={{ color: m.color }} />
                </div>
                <div className="relative z-10 flex items-center justify-between">
                   <div className="space-y-4">
                      <p className="text-[11px] font-black text-slate-800 uppercase tracking-[0.4em] italic leading-none">{m.label}</p>
                      <h3 className="text-6xl font-black text-white italic font-mono tracking-tighter leading-none">{m.value}</h3>
                      <p className="text-[10px] font-black text-slate-800 uppercase italic tracking-[0.3em]">{m.sub}</p>
                   </div>
                   <div className="p-6 bg-white/[0.02] border border-white/[0.05] rounded-3xl" style={{ color: m.color }}>
                      <m.icon size={32} />
                   </div>
                </div>
              </div>
            ))}
          </section>

          <div className="grid grid-cols-12 gap-12">
            
            <div className="col-span-12 xl:col-span-4 space-y-10">
              <div className="relative group w-full">
                <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-amber-500 transition-colors" size={24} />
                <input
                  type="text"
                  placeholder="ID МАНІФЕСТА АБО КОМПАНІЯ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-20 pr-10 py-7 bg-black/60 border-2 border-white/[0.04] rounded-[2.2rem] text-white placeholder-slate-800 focus:outline-none focus:border-amber-500/50 transition-all font-black text-lg italic tracking-tight shadow-inset"
                />
              </div>

              <div className="space-y-6 max-h-[850px] overflow-y-auto custom-scrollbar pr-4">
                {filteredManifests.map((m, idx) => (
                  <motion.button 
                    key={m.id} 
                    onClick={() => setSelectedManifest(m)}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={cn(
                      "w-full p-8 bg-black border-2 rounded-[3rem] transition-all duration-500 text-left flex items-center justify-between group relative overflow-hidden",
                      selectedManifest?.id === m.id 
                        ? "border-amber-500/40 bg-amber-500/[0.04] shadow-[0_0_50px_rgba(245,158,11,0.1)]" 
                        : "border-white/[0.03] hover:border-white/10"
                    )}
                  >
                     <div className="flex items-center gap-6 relative z-10">
                        <div className={cn(
                          "w-16 h-16 rounded-2xl flex items-center justify-center border-2 transition-all duration-500", 
                          m.status === 'CRITICAL' ? "bg-amber-500/10 border-amber-500/30 text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.3)]" : 
                          m.status === 'WARNING' ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-500" : 
                          "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                        )}>
                           <Package size={28} />
                        </div>
                        <div className="space-y-1">
                           <h4 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none group-hover:text-amber-500 transition-colors">{m.manifestId}</h4>
                           <p className="text-[10px] font-black text-slate-700 uppercase italic tracking-widest truncate max-w-[200px]">{m.consignee}</p>
                        </div>
                     </div>
                     <div className="text-right relative z-10">
                        <p className={cn("text-3xl font-black font-mono tracking-tighter italic leading-none shadow-sm", m.riskScore > 80 ? "text-amber-500" : m.riskScore > 50 ? "text-yellow-500" : "text-emerald-500")}>{m.riskScore}%</p>
                        <p className="text-[9px] font-black text-slate-800 uppercase italic tracking-widest mt-1">RISK_INDEX</p>
                     </div>
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="col-span-12 xl:col-span-8">
              <AnimatePresence mode="wait">
                {selectedManifest ? (
                  <motion.div 
                    key={selectedManifest.id} 
                    initial={{ opacity: 0, scale: 0.98, rotateX: 5 }} 
                    animate={{ opacity: 1, scale: 1, rotateX: 0 }} 
                    exit={{ opacity: 0, scale: 0.95 }} 
                    className="space-y-12"
                  >
                     <div className="p-16 rounded-[5rem] bg-black border-2 border-white/[0.04] shadow-4xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-16 opacity-[0.03] group-hover:opacity-[0.1] transition-all duration-1000 rotate-6 group-hover:rotate-0">
                          <Scale size={320} className="text-amber-500" />
                        </div>
                        
                        <div className="flex items-center justify-between border-b-2 border-white/[0.04] pb-12 relative z-10">
                           <div className="flex gap-8 items-center">
                              <div className="p-6 bg-amber-600/10 border-2 border-amber-600/20 rounded-[2.5rem] text-amber-500 shadow-2xl">
                                 <Fingerprint size={42} />
                              </div>
                              <div className="space-y-2">
                                 <h3 className="text-5xl font-black text-white italic tracking-tighter uppercase leading-none">{selectedManifest.manifestId}</h3>
                                 <div className="flex items-center gap-4">
                                    <span className="text-[10px] font-black text-yellow-500 bg-yellow-500/5 border border-yellow-500/20 px-4 py-1.5 rounded-xl uppercase tracking-widest italic drop-shadow-sm">
                                       FORENSIC_DOSSIER // {selectedManifest.id.toUpperCase()}
                                    </span>
                                    <div className="w-2 h-2 rounded-full bg-slate-800" />
                                    <span className="text-[10px] text-slate-700 font-black uppercase italic tracking-[0.2em] font-mono">STATUS: <span className={selectedManifest.status === 'CRITICAL' ? 'text-amber-600 animate-pulse' : 'text-emerald-500'}>{selectedManifest.status}</span></span>
                                 </div>
                              </div>
                           </div>
                           <div className="flex gap-4">
                              <button className="p-6 bg-black border-2 border-white/[0.04] rounded-[1.8rem] text-slate-500 hover:text-amber-500 hover:border-amber-500/30 transition-all shadow-xl group/btn2">
                                 <Download size={28} className="group-hover/btn2:scale-110 transition-transform" />
                              </button>
                             <button className="p-6 bg-amber-600 text-slate-950 rounded-[1.8rem] transition-all shadow-4xl hover:bg-amber-500 hover:scale-105 active:scale-95 duration-500 flex items-center justify-center">
                                 <Layers size={28} />
                              </button>
                           </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 relative z-10 pt-16">
                           <div className="space-y-10">
                              <div className="p-10 bg-black/40 border-2 border-white/[0.03] rounded-[3.5rem] space-y-4 shadow-inset relative group/card">
                                 <div className="absolute top-6 right-8 text-slate-900 group-hover/card:text-yellow-500/10 transition-colors"><Truck size={42} /></div>
                                 <p className="text-[10px] font-black text-slate-800 uppercase italic tracking-[0.4em]">ОТРИМУВАЧ_ВАНТАЖУ_UA</p>
                                 <p className="text-4xl font-black text-white italic uppercase tracking-tighter leading-none">{selectedManifest.consignee}</p>
                              </div>
                              <div className="p-10 bg-black/40 border-2 border-white/[0.03] rounded-[3.5rem] space-y-4 shadow-inset relative group/card">
                                 <div className="absolute top-6 right-8 text-slate-900 group-hover/card:text-amber-500/10 transition-colors"><Ship size={42} /></div>
                                 <p className="text-[10px] font-black text-slate-800 uppercase italic tracking-[0.4em]">ВІДПРАВНИК_ВАНТАЖУ_INTL</p>
                                 <p className="text-4xl font-black text-white italic uppercase tracking-tighter leading-none">{selectedManifest.consignor}</p>
                              </div>
                           </div>
                           <div className="flex flex-col gap-10">
                              <div className="p-10 bg-black border-2 border-white/[0.03] rounded-[3.5rem] space-y-4 shadow-inset flex-1">
                                 <p className="text-[10px] font-black text-slate-800 uppercase italic tracking-[0.4em]">ОПИС_ТОВРУ (ДЕКЛАРОВАНИЙ)</p>
                                 <p className="text-xl font-black text-slate-400 italic uppercase leading-relaxed font-mono">"{selectedManifest.goodsDescription}"</p>
                              </div>
                              <div className="grid grid-cols-2 gap-8">
                                 <div className="p-10 bg-black border-2 border-white/[0.03] rounded-[3.5rem] space-y-2 shadow-inset group/val transition-all">
                                    <p className="text-[10px] font-black text-slate-800 uppercase italic tracking-[0.4em]">ВАГА_KG</p>
                                    <p className="text-5xl font-black text-white italic font-mono tracking-tighter group-hover/val:text-yellow-500 transition-colors">{selectedManifest.weight.toLocaleString()}</p>
                                 </div>
                                 <div className="p-10 bg-black border-2 border-white/[0.03] rounded-[3.5rem] space-y-2 shadow-inset group/val transition-all">
                                    <p className="text-[10px] font-black text-slate-800 uppercase italic tracking-[0.4em]">ВАРТІСТЬ_USD</p>
                                    <p className="text-5xl font-black text-emerald-500 italic font-mono tracking-tighter group-hover/val:scale-105 transition-transform duration-700">${selectedManifest.declaredValue.toLocaleString()}</p>
                                 </div>
                              </div>
                           </div>
                        </div>

                        {selectedManifest.anomalies.length > 0 && (
                          <div className="relative z-10 mt-16 p-12 rounded-[4rem] bg-amber-600/[0.02] border-4 border-amber-600/30 space-y-8 shadow-4xl group/anom">
                             <div className="flex items-center justify-between border-b-2 border-amber-500/10 pb-6">
                                <h4 className="text-[13px] font-black text-amber-500 uppercase italic tracking-[0.5em] flex items-center gap-6">
                                   <Siren size={32} className="animate-pulse shadow-amber-600" /> ВИЯВЛЕНІ_АНТРОПОГЕННІ_АНОМАЛІЇ
                                </h4>
                                <span className="bg-amber-600/20 text-amber-500 px-6 py-2 rounded-2xl text-[10px] font-black italic tracking-widest border border-amber-600/30 shadow-lg animate-bounce">УВАГА</span>
                             </div>
                             <div className="flex flex-wrap gap-6 pt-4">
                                {selectedManifest.anomalies.map((a, i) => (
                                  <div key={i} className="px-8 py-4 bg-amber-600/10 border-2 border-amber-600/30 rounded-[1.8rem] text-[12px] font-black text-amber-500 italic uppercase tracking-[0.2em] shadow-inner group-hover/anom:scale-105 transition-transform duration-500">
                                     {a}
                                  </div>
                                ))}
                             </div>
                          </div>
                        )}

                        <div className="relative z-10 mt-16 pt-12 border-t-2 border-white/[0.04] flex flex-col md:flex-row items-center justify-between gap-12">
                           <div className="flex items-center gap-6">
                              <div className={cn("w-5 h-5 rounded-full animate-pulse shadow-lg", isOffline ? "bg-amber-600 shadow-amber-600/50" : "bg-emerald-500 shadow-emerald-500/50")} />
                              <div className="space-y-1">
                                 <p className={cn("text-[11px] font-black uppercase italic tracking-widest leading-none", isOffline ? "text-yellow-500" : "text-emerald-500")}>
                                   {isOffline ? 'ZROK_FAILOVER_ACTIVE' : 'FORENSIC_CORE_ACTIVE'}
                                 </p>
                                 <p className="text-[9px] font-black text-slate-500 uppercase italic tracking-[0.4em]">
                                   {isOffline ? `MOCK_DATA_SOURCE // NODE: ${nodeSource}` : `LIVE_PRODUCTION_DATA // NODE: ${nodeSource}`}
                                 </p>
                              </div>
                           </div>
                           <div className="flex gap-6 w-full md:w-auto">
                             <button className="flex-1 md:flex-none px-12 py-6 bg-black border-2 border-white/[0.05] text-slate-600 hover:text-white hover:border-white/20 rounded-[2.2rem] text-[11px] font-black uppercase tracking-[0.4em] italic shadow-xl transition-all">
                                ЗБЕРЕГТИ_DOSSIER
                             </button>
                             <button className="flex-1 md:flex-none px-12 py-6 bg-white text-black rounded-[2.2rem] text-[11px] font-black uppercase tracking-[0.4em] italic hover:bg-slate-200 shadow-4xl active:scale-95 transition-all duration-300">
                                ГЕНЕРУВАТИ_ПОВНИЙ_ЗВІТ
                             </button>
                           </div>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pt-4">
                        <div className="p-10 rounded-[4rem] border-2 border-white/[0.04] bg-black shadow-4xl space-y-8 relative overflow-hidden group/sub">
                           <div className="absolute top-6 right-8 text-slate-900 group-hover/sub:text-yellow-500/10 transition-colors"><History size={32} /></div>
                           <h5 className="text-[12px] font-black text-slate-700 uppercase italic tracking-[0.5em] border-b border-white/[0.03] pb-6">ХРОНОЛОГІЯ_СУБ'ЄКТА</h5>
                           <div className="space-y-6 pt-4">
                              {[1,2,3].map(i => (
                                <div key={i} className="flex items-center gap-6 group/item transition-all cursor-crosshair">
                                   <div className="w-3 h-3 rounded-full bg-slate-900 border border-white/5 group-hover/item:bg-yellow-500 transition-colors shadow-sm" />
                                   <div className="space-y-1">
                                      <p className="text-white font-black italic uppercase text-[12px] tracking-tight truncate max-w-[150px]">МАНІФЕСТ_OK // 2290{i}</p>
                                      <p className="text-slate-800 font-mono text-[9px] italic">202{6-i}/04/1{i}</p>
                                   </div>
                                 </div>
                              ))}
                           </div>
                        </div>
                        
                        <div className="p-10 rounded-[4rem] border-2 border-amber-600/20 bg-amber-600/[0.02] shadow-4xl space-y-8 relative overflow-hidden group/ai2">
                           <h5 className="text-[12px] font-black text-amber-500 uppercase italic tracking-[0.5em] border-b border-amber-500/10 pb-6">AI_ПРЕДИКЦІЯ_РИЗИКУ</h5>
                           <div className="space-y-6 pt-4 relative z-10">
                              <div className="flex justify-between items-end">
                                 <p className="text-[12px] text-slate-400 font-black italic uppercase">Ймовірність_СХЕМИ:</p>
                                 <span className="text-4xl font-black text-amber-500 font-mono tracking-tighter italic shadow-sm">94.1%</span>
                              </div>
                              <div className="w-full h-4 bg-slate-950 rounded-full overflow-hidden border border-white/5 p-0.5">
                                 <motion.div 
                                    initial={{ width: 0 }} 
                                    animate={{ width: '94.1%' }} 
                                    transition={{ duration: 1.5, ease: "easeOut" }} 
                                    className="h-full bg-gradient-to-r from-amber-700 to-amber-500 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.5)]" 
                                 />
                              </div>
                           </div>
                        </div>

                        <div className="p-10 rounded-[4rem] border-2 border-white/[0.04] bg-black shadow-4xl space-y-8 relative overflow-hidden group/hs">
                           <div className="absolute top-6 right-8 text-slate-900 group-hover/hs:text-emerald-500/10 transition-colors"><Layers size={32} /></div>
                           <h5 className="text-[12px] font-black text-slate-700 uppercase italic tracking-[0.5em] border-b border-white/[0.03] pb-6">ВЕРІФІКАЦІЯ_HSCODE</h5>
                           <div className="space-y-6 pt-4">
                              <div className="p-6 rounded-2xl bg-black border-2 border-white/[0.03] space-y-1 relative group/val1 transition-all">
                                 <p className="text-[9px] font-black text-slate-800 uppercase italic tracking-widest">ДЕКЛАРОВАНО</p>
                                 <div className="flex items-center justify-between">
                                    <p className="text-xl font-black text-slate-400 italic font-mono uppercase tracking-tighter">8541.10.00.00</p>
                                    <ShieldAlert size={16} className="text-amber-500" />
                                 </div>
                              </div>
                              <div className="p-6 rounded-2xl bg-emerald-500/5 border-2 border-emerald-500/20 space-y-1 relative group/val2 transition-all">
                                 <p className="text-[9px] font-black text-emerald-800 uppercase italic tracking-widest">РЕКОМЕНДОВАНО_AZR</p>
                                 <div className="flex items-center justify-between">
                                    <p className="text-xl font-black text-emerald-500 italic font-mono uppercase tracking-tighter">8542.31.90.00</p>
                                    <ShieldCheck size={16} className="text-emerald-500 animate-bounce" />
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>
                  </motion.div>
                ) : (
                  <div className="py-80 text-center bg-black border-4 border-dashed border-white/[0.04] rounded-[5rem] backdrop-blur-3xl shadow-4xl space-y-10 group">
                    <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
                       <FileSearch className="w-24 h-24 text-slate-800 mx-auto opacity-20 group-hover:opacity-40 transition-opacity" />
                       <div className="absolute inset-0 border-4 border-amber-500/10 rounded-full animate-ping group-hover:border-amber-500/30 transition-all" />
                    </div>
                    <div className="space-y-6">
                      <h3 className="text-4xl font-black text-slate-700 uppercase tracking-widest italic leading-none shadow-sm">ОБЕРІТЬ_ОБ'ЄКТ_ДЛЯ_ФОРЕНЗИКИ</h3>
                      <p className="text-slate-900 font-black uppercase tracking-[0.6em] italic text-xs max-w-xl mx-auto opacity-60">СИСТЕМА ГОТОВА ДО ГЛИБИННОГО СКАНУВАННЯ МАНІФЕСТІВ</p>
                    </div>
                  </div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </div>

        <div className="max-w-[1850px] mx-auto px-12 mt-12 pb-24">
            <DiagnosticsTerminal />
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
            .shadow-4xl { box-shadow: 0 80px 150px -40px rgba(0,0,0,0.95), 0 0 100px rgba(212,175,55,0.02); }
            .shadow-inset { box-shadow: inset 0 2px 20px rgba(0,0,0,0.8); }
            .animate-spin-slow { animation: spin 20s linear infinite; }
            @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            .perspective-1000 { perspective: 1000px; }
            .no-scrollbar::-webkit-scrollbar { display: none; }
            .custom-scrollbar::-webkit-scrollbar { width: 10px; height: 10px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(245, 158, 11, 0.1); border-radius: 20px; border: 3px solid black; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(245, 158, 11, 0.2); }
            .backdrop-blur-4xl { backdrop-filter: blur(120px) saturate(180%); }
            .text-shadow-wraith { text-shadow: 0 0 40px rgba(245, 158, 11, 0.2); }
        `}} />
      </div>
    </PageTransition>
  );
}
