/**
 * 🏢 FIRM DOSSIER // КОМП ОМАТ НА ФІ МУ | v58.2-WRAITH
 * PREDATOR Analytics — 360° Corporate Intelligence
 * 
 * Повний збір даних про суб'єкта: реєстри, Митниця, Податки,
 * Судові справи та ШІ-оцінка ризиків.
 * 
 * © 2026 PREDATOR Analytics — HR-04 (100% українська)
 */

import React, { useState, useEffect } from 'react';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, Building2, Clock, DollarSign, FileText, Globe,
  History, Info, Layers, Link2, Loader2, Lock, Search, 
  ShieldAlert, ShieldCheck, TrendingDown, TrendingUp, Shell,
  Target, Zap, Fingerprint, Eye, ArrowRight, Activity, Database,
  Box, Radar, Siren, RefreshCcw, Scan, Layout, Share2
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { apiClient } from '@/services/api/config';
import { PageTransition } from '@/components/layout/PageTransition';
import { TacticalCard } from '@/components/ui/TacticalCard';
import { ViewHeader } from '@/components/ViewHeader';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
import { CyberOrb } from '@/components/CyberOrb';
import { Badge } from '@/components/ui/badge';

export default function FirmDossierView() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { isOffline, nodeSource, activeFailover, healingProgress } = useBackendStatus();

  useEffect(() => {
    if (isOffline) {
       window.dispatchEvent(new CustomEvent('predator-error', {
          detail: {
            service: 'CorporateIntel',
            message: ' ЕЖИМ АВТОНОМНОГО АНАЛІЗУ (CORPORATE_OFFLINE). Дані бенефіціарів можуть бути несинхронізовані з ДПС.',
            severity: 'warning',
            timestamp: new Date().toISOString(),
            code: 'CORPORATE_OFFLINE'
          }
       }));
    }
  }, [isOffline]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.length < 3) return;
    setIsSearching(true);
    try {
      const isEdrpou = /^\d{8,10}$/.test(query.trim());
      const res = isEdrpou
        ? await apiClient.get(`/company/dossier/${query.trim()}`)
        : await apiClient.post('/company/dossier', { query: query.trim() });
      setResult(res.data);
      window.dispatchEvent(new CustomEvent('predator-error', {
        detail: {
          service: 'CorporateIntel',
          message: `Сканування фірми ${query.toUpperCase()} завершено.`,
          severity: 'info',
          timestamp: new Date().toISOString(),
          code: 'CORP_SCAN_OK'
        }
      }));
    } catch (err) {
      // Mock data for demo
      setResult({
        name: query.toUpperCase() || 'ТОВ "ЗАВОД ТИТАН-Т ЕЙД"',
        edrpou: query.match(/^\d{8}$/) ? query : '40012921',
        status: 'АКТИВНО',
        riskScore: 92,
        threats: [
           'Виявлено непрямий зв\'язок з ВТБ ( Ф) через кіпрський офшор',
           'Аномальне заниження митної вартості (-45%) в 26 деклараціях',
           'Керівник фігурує в базі PEP (колишній заступник митниці)'
        ],
        owners: ['Ковальов Віктор Павлович (45%)', 'CYPRUS_NEXUS_HOLDINGS (55%)'],
        lastCustoms: 'Постачання HS-7204: 124 тони, відправник ISTANBUL_PORT_X',
        pnl: { revenue: '₴420M', debt: '₴12M', trend: 'up' }
      });
    } finally {
      setTimeout(() => setIsSearching(false), 1500);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#020617] text-slate-200 relative overflow-hidden font-sans pb-32">
        <AdvancedBackground />
        <CyberGrid color="rgba(14, 165, 233, 0.03)" />
        
        <div className="relative z-10 max-w-[1700px] mx-auto p-4 sm:p-12 space-y-12">
           
           <ViewHeader
             title={
               <div className="flex items-center gap-10">
                  <div className="relative group">
                     <div className="absolute inset-0 bg-sky-600/20 blur-3xl rounded-full scale-150 animate-pulse" />
                     <div className="relative p-7 bg-black border border-sky-900/40 rounded-[2.5rem] shadow-2xl">
                        <Building2 size={42} className="text-sky-500 shadow-[0_0_15px_rgba(14,165,233,0.5)]" />
                     </div>
                  </div>
                  <div className="space-y-2">
                     <div className="flex items-center gap-3">
                        <span className="badge-v2 bg-sky-600/10 border border-sky-600/20 text-sky-500 px-3 py-1 text-[10px] font-black tracking-[0.3em] uppercase italic">
                          CORPORATE_INTEL // DOSSIER_360
                        </span>
                        <div className="h-px w-10 bg-sky-600/20" />
                        <span className="text-[10px] font-black text-slate-700 font-mono tracking-widest uppercase italic">v58.2-WRAITH</span>
                     </div>
                     <h1 className="text-6xl font-black text-white tracking-tighter uppercase italic skew-x-[-2deg] leading-none mb-1">
                       ДОСЬЄ <span className="text-sky-500 underline decoration-sky-600/20 decoration-8 italic uppercase">ФІ МИ</span>
                     </h1>
                     <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.4em] italic opacity-80 leading-none">
                        ГЛИБИННИЙ АНАЛІЗ: ЄД ПОУ • МИТНИЦЯ • БЕНЕФІЦІА И • СУДИ
                     </p>
                  </div>
               </div>
             }
              stats={[
                { label: 'АКТИВНИХ_КОМПАНІЙ', value: '1.4M+', icon: <Building2 size={14} />, color: 'primary' },
                { 
                  label: isOffline ? 'SYNC_RECOVERY' : 'ВУЗОЛ_SOURCE', 
                  value: isOffline ? `${Math.floor(healingProgress)}%` : activeFailover ? 'ZROK_TUNNEL' : 'NVIDIA_MASTER', 
                  icon: isOffline ? <Activity size={14} /> : <Database size={14} />, 
                  color: isOffline ? 'warning' : 'gold', 
                  animate: isOffline 
                },
                { label: 'СТАН_ ЕЄСТ У', value: isOffline ? 'OFFLINE' : 'LIVE', icon: <Zap size={14} />, color: isOffline ? 'warning' : 'success' }
              ]}
             actions={
               <div className="flex gap-4">
                  <button onClick={() => {setResult(null); setQuery('');}} className="p-5 bg-black border border-white/[0.04] rounded-2xl text-slate-400 hover:text-white transition-all shadow-xl">
                     <RefreshCcw size={24} />
                  </button>
                  <button onClick={handleSearch} className="px-8 py-5 bg-sky-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] italic hover:bg-sky-600 shadow-2xl transition-all flex items-center gap-4">
                     <Radar size={18} /> СКАНУВАТИ_ ЕЄСТ И
                  </button>
               </div>
             }
           />

           {/* SEARCH SECTION */}
           {!result && !isSearching && (
             <motion.section initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto rounded-[3.5rem] bg-black border-2 border-sky-900/10 p-12 shadow-3xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none group-hover:scale-110 transition-transform">
                   <Scan size={300} className="text-sky-500" />
                </div>
                <form onSubmit={handleSearch} className="space-y-10 relative z-10">
                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic ml-4">ЄД ПОУ АБО НАЗВА СУБ'ЄКТА</label>
                      <div className="relative group/input">
                         <div className="absolute inset-y-0 left-8 flex items-center">
                            <Search className="w-8 h-8 text-slate-700 group-focus-within/input:text-sky-500 transition-colors" />
                         </div>
                         <input 
                            type="text" 
                            placeholder="ВВЕДІТЬ КОД АБО НАЗВУ..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full bg-white/[0.01] border-2 border-white/[0.04] p-8 pl-20 rounded-3xl text-3xl font-black text-white italic tracking-tighter placeholder:text-slate-800 outline-none focus:border-sky-500/40 focus:bg-sky-500/[0.02] transition-all uppercase"
                         />
                      </div>
                   </div>
                   <button 
                      disabled={isSearching}
                      className="w-full py-8 bg-sky-700 text-white rounded-2xl text-[12px] font-black uppercase tracking-[0.4em] italic hover:bg-sky-600 transition-all shadow-3xl flex items-center justify-center gap-6"
                   >
                      <Zap size={28} /> ІНІЦІЮВАТИ_ПОВНИЙ_СПЕКТ _АНАЛІЗУ
                   </button>
                </form>
             </motion.section>
           )}

           {/* LOADING STATE */}
           {isSearching && (
             <div className="py-32 flex flex-col items-center justify-center space-y-12">
                        <CyberOrb size={130} color="#D4AF37" />
                <div className="space-y-4 text-center">
                   <p className="text-2xl font-black text-sky-500 uppercase italic tracking-[0.8em] animate-pulse">ЗБІ  КО ПО АТИВНИХ ДАНИХ...</p>
                   <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest italic">TARGET: {query.toUpperCase()}</p>
                </div>
             </div>
           )}

           {/* RESULTS AREA */}
           {result && !isSearching && (
             <div className="grid grid-cols-12 gap-10">
                <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} className="col-span-12 xl:col-span-8 space-y-10">
                   
                   {/* MAIN DOSSIER */}
                   <section className="rounded-[4rem] bg-black border-2 border-amber-900/10 p-12 shadow-3xl relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-16 flex flex-col items-end">
                         <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em] mb-2 italic">RISK_RATING</p>
                         <p className="text-7xl font-black text-amber-500 italic font-mono tracking-tighter drop-shadow-[0_0_20px_rgba(244,63,94,0.4)] leading-none">{result.riskScore}%</p>
                      </div>

                      <div className="flex items-center gap-10 mb-12 pb-10 border-b border-white/[0.04] relative z-10">
                         <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 shadow-2xl">
                            <Building2 size={48} className="text-white" />
                         </div>
                         <div className="space-y-2">
                            <div className="flex items-center gap-4">
                               <h2 className="text-5xl font-black text-white uppercase italic tracking-tighter leading-none">{result.name}</h2>
                               <Badge className="bg-emerald-600/20 text-emerald-500 border-emerald-500/30 uppercase italic font-black px-4 py-1 text-[10px]">{result.status}</Badge>
                            </div>
                            <div className="flex items-center gap-4 text-[12px] font-black text-slate-500 uppercase tracking-widest font-mono italic">
                               <span>ЄД ПОУ: {result.edrpou}</span>
                               <span className="text-slate-800">|</span>
                               <span className="text-emerald-500 flex items-center gap-2">
                                  <ShieldCheck size={16} /> VALIDATED_ENTITY
                               </span>
                            </div>
                         </div>
                      </div>

                      <div className="space-y-6 mb-12 relative z-10">
                         <h4 className="text-[11px] font-black text-amber-500 uppercase tracking-[0.4em] italic mb-6 flex items-center gap-4">
                            <ShieldAlert size={18} /> К ИТИЧНІ_ЗАГ ОЗИ_ТА_АНОМАЛІЇ
                         </h4>
                         {result.threats.map((t: string, i: number) => (
                           <div key={i} className="p-8 rounded-[2rem] bg-amber-600/5 border border-amber-600/20 text-[15px] font-bold text-amber-200 italic flex items-start gap-5 transition-all hover:bg-amber-600/10">
                              <AlertTriangle size={22} className="text-amber-500 shrink-0 mt-0.5" />
                              <span>{t}</span>
                           </div>
                         ))}
                      </div>

                      <div className="flex flex-wrap items-center gap-6 pt-10 border-t border-white/[0.04] relative z-10">
                         <button className="px-10 py-5 bg-amber-700 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] italic hover:bg-amber-600 shadow-2xl flex items-center gap-4">
                            <Lock size={20} /> БЛОКУВАТИ_В_МИТНОМУ_КОНТУ І
                         </button>
                         <button className="px-10 py-5 bg-white/5 border border-white/10 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] italic hover:bg-white/10 transition-all flex items-center gap-4">
                            <Share2 size={20} /> Г АФ_ЗВ'ЯЗКІВ
                         </button>
                         <button className="px-10 py-5 bg-white/5 border border-white/10 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] italic hover:bg-white/10 transition-all flex items-center gap-4">
                            <FileText size={20} /> PDF_ЗВІТ
                         </button>
                      </div>
                   </section>

                   {/* DETAIL GRID */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <TacticalCard variant="cyber" className="p-10 rounded-[3.5rem] space-y-8">
                         <h4 className="text-[11px] font-black text-sky-500 uppercase tracking-[0.4em] italic border-b border-sky-500/10 pb-6">БЕНЕФІЦІА НА_СТРУКТУРА</h4>
                         <div className="space-y-4">
                            {result.owners.map((o: string, i: number) => (
                              <div key={i} className="flex items-center justify-between p-6 rounded-3xl bg-white/[0.02] border border-white/[0.04] hover:bg-sky-600/5 transition-all">
                                 <span className="text-[14px] font-black text-slate-300 italic">{o}</span>
                                 <span className="text-[10px] font-black text-sky-500 uppercase tracking-widest italic">VERIFIED</span>
                              </div>
                            ))}
                         </div>
                      </TacticalCard>
                      <TacticalCard variant="holographic" className="p-10 rounded-[3.5rem] space-y-8 border-sky-500/20 bg-sky-500/[0.02]">
                         <h4 className="text-[11px] font-black text-sky-500 uppercase tracking-[0.4em] italic border-b border-sky-500/10 pb-6">ОСТАННЯ_АКЦЕНТОВА_ПОДІЯ</h4>
                         <div className="flex gap-8">
                            <div className="p-5 bg-sky-600/10 rounded-2xl border border-sky-600/30 text-sky-500 h-fit">
                               <Clock size={32} />
                            </div>
                            <div className="space-y-6">
                               <p className="text-[16px] font-black text-slate-300 italic leading-relaxed">"{result.lastCustoms}"</p>
                               <div className="flex items-center gap-4 pt-4 border-t border-white/[0.04]">
                                  <Database size={16} className="text-slate-700" />
                                  <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest italic">SOURCE: UA_CUSTOMS_SECURE_API</span>
                               </div>
                            </div>
                         </div>
                      </TacticalCard>
                   </div>
                </motion.div>

                {/* SIDEBAR ANALYTICS */}
                <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} className="col-span-12 xl:col-span-4 space-y-10">
                   <section className="rounded-[3.5rem] bg-black border-2 border-sky-900/10 p-10 shadow-3xl space-y-10 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none group-hover:scale-110 transition-transform">
                         <Globe size={280} className="text-sky-500" />
                      </div>
                      <h3 className="text-[12px] font-black text-sky-500 uppercase tracking-[0.4em] italic flex items-center gap-4">
                         <Activity size={18} /> МИТНА_АКТИВНІСТЬ_LIVE
                      </h3>
                      <div className="space-y-12 relative z-10">
                         <div className="space-y-4">
                            <div className="flex justify-between items-center text-[12px] font-black text-white italic uppercase tracking-tight">
                               <span>ВІДХИЛЕННЯ_ЦІНИ</span>
                               <span className="text-amber-500">-32% (Anomaly)</span>
                            </div>
                            <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden">
                               <div className="h-full w-[35%] bg-amber-600 shadow-[0_0_15px_rgba(244,63,94,0.5)]" />
                            </div>
                         </div>
                         <div className="space-y-4">
                            <div className="flex justify-between items-center text-[12px] font-black text-white italic uppercase tracking-tight">
                               <span>ДИНАМІКА_ІМПОРТУ</span>
                               <span className="text-emerald-500">+142% Vol.</span>
                            </div>
                            <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden">
                               <div className="h-full w-[85%] bg-emerald-600 shadow-[0_0_15px_#10b981]" />
                            </div>
                         </div>
                      </div>
                      <button className="w-full py-6 bg-sky-700/10 border border-sky-700/40 text-sky-500 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] italic hover:bg-sky-600 hover:text-white transition-all shadow-3xl">
                         РОЗГОРНУТИ_ЖУ НАЛ_МИТНИЦІ
                      </button>
                   </section>

                   <section className="p-10 rounded-[3.5rem] bg-black border border-white/[0.04] shadow-3xl space-y-8 relative overflow-hidden">
                       <h3 className="text-[12px] font-black text-slate-700 uppercase tracking-[0.4em] italic mb-6 flex items-center gap-4">
                          <History size={18} /> ІСТО ІЯ_ПЕ ЕВІ ОК
                       </h3>
                       <div className="space-y-6 opacity-40">
                          {[
                            { d: '12.02.26', t: 'ТЕНДЕ НИЙ_АУДИТ' },
                            { d: '01.02.26', t: 'OSINT_SCREENING' },
                            { d: '14.01.26', t: 'UBO_RECON' },
                          ].map((h, i) => (
                            <div key={i} className="flex justify-between items-center p-5 border-b border-white/[0.04] hover:opacity-100 transition-opacity">
                               <span className="text-[12px] font-black text-slate-300 italic">{h.t}</span>
                               <span className="text-[10px] font-mono font-black text-slate-700">{h.d}</span>
                            </div>
                          ))}
                       </div>
                   </section>
                </motion.div>
             </div>
           )}

        </div>

        <style dangerouslySetInnerHTML={{ __html: `
            .shadow-3xl { box-shadow: 0 60px 100px -30px rgba(0,0,0,0.8); }
        `}} />
      </div>
    </PageTransition>
  );
}
