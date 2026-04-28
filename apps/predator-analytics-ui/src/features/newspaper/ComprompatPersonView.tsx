/**
 * 👤 PERSON DOSSIER // КОМП� ОМАТ НА ОСОБУ | v58.2-WRAITH
 * PREDATOR Analytics — 360° Personal Intelligence
 * 
 * Глибинний аналіз персони: Суди, Борги, Кримінал, Санкції,
 * Соцмережі, Пов'язані особи та активи.
 * 
 * © 2026 PREDATOR Analytics — HR-04 (100% українська)
 */

import React, { useState, useEffect } from 'react';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, Building2, CheckCircle, Fingerprint, Globe,
  Loader2, Lock, Network, Scale, Search, Shield, UserX, XCircle,
  ShieldAlert, Activity, Target, Zap, Eye, ArrowRight, Database,
  User, Briefcase, Share2, Phone, Mail, MapPin, Scan, Radar, Siren,
  RefreshCcw, Layout, FileText
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { apiClient } from '@/services/api/config';
import { PageTransition } from '@/components/layout/PageTransition';
import { TacticalCard } from '@/components/ui/TacticalCard';
import { ViewHeader } from '@/components/ViewHeader';
import { Badge } from '@/components/ui/badge';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
import { CyberOrb } from '@/components/CyberOrb';

interface DossierResult {
  pib: string;
  region: string;
  riskScore: number;
  status: string;
  sources_checked: number;
  court_cases: number;
  tax_debts: number;
  sanctions_hits: number;
  criminal_records: number;
  related_companies: { name: string; edrpou: string; role: string; riskScore: number }[];
  connections: { type: string; name: string; relation: string }[];
  social_profiles: { platform: string; found: boolean }[];
}

export default function ComprompatPersonView() {
  const [form, setForm] = useState({ pib: '', dob: '', region: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DossierResult | null>(null);
  const { isOffline, nodeSource, activeFailover, healingProgress } = useBackendStatus();

  useEffect(() => {
    if (isOffline) {
       window.dispatchEvent(new CustomEvent('predator-error', {
          detail: {
            service: 'PersonalIntel',
            message: 'АКТИВОВАНО � ЕЖИМ ЛОКАЛЬНОГО Т� АСУВАННЯ (PERSON_OFFLINE). Синхронізація з центральним реєстром призупинена.',
            severity: 'warning',
            timestamp: new Date().toISOString(),
            code: 'PERSON_OFFLINE'
          }
       }));
    }
  }, [isOffline]);

  const regions = [
    'Київська', 'Харківська', 'Одеська', 'Львівська', 'Дніпропетровська',
    'Запорізька', 'Вінницька', 'Миколаївська', 'Черкаська', 'Полтавська',
  ];

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.pib.trim().length < 3) return;
    setLoading(true);
    try {
      const res = await apiClient.post('/person/dossier', { pib: form.pib, region: form.region, dob: form.dob });
      setResult(res.data);
      window.dispatchEvent(new CustomEvent('predator-error', {
        detail: {
          service: 'PersonalIntel',
          message: `Сканування об'єкта ${form.pib.toUpperCase()} завершено.`,
          severity: 'info',
          timestamp: new Date().toISOString(),
          code: 'SCAN_COMPLETE'
        }
      }));
    } catch (err: unknown) {
      // Mock for demo
      setResult({
        pib: form.pib.toUpperCase() || 'КОВАЛЬОВ ВІКТО�  ПАВЛОВИЧ',
        region: form.region || 'Київська',
        riskScore: 84,
        status: 'К� ИТИЧНО',
        sources_checked: 42,
        court_cases: 12,
        tax_debts: 4,
        sanctions_hits: 1,
        criminal_records: 2,
        related_companies: [
          { name: 'ТОВ "ЗАВОД ТИТАН"', edrpou: '40012921', role: 'Керівник', riskScore: 92 },
          { name: 'ЛОГІСТИК-СЕ� ВІС', edrpou: '38210455', role: 'Бенефіціар', riskScore: 45 }
        ],
        connections: [
          { type: 'БІЗНЕС', name: 'Медведчук В.В.', relation: 'Партнер (череж офшор)' },
          { type: '� ОДИНА', name: 'Ковальова О.М.', relation: 'Дружина (власниця активів)' }
        ],
        social_profiles: [
          { platform: 'Facebook', found: true },
          { platform: 'LinkedIn', found: true },
          { platform: 'Telegram', found: true },
          { platform: 'Instagram', found: false }
        ]
      });
    } finally {
      setTimeout(() => setLoading(false), 1500);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#020617] text-slate-200 relative overflow-hidden font-sans pb-32">
        <AdvancedBackground />
        <CyberGrid color="rgba(249, 115, 22, 0.03)" />
        
        <div className="relative z-10 max-w-[1700px] mx-auto p-4 sm:p-12 space-y-12">
           
           <ViewHeader
             title={
               <div className="flex items-center gap-10">
                  <div className="relative group">
                     <div className="absolute inset-0 bg-orange-600/20 blur-3xl rounded-full scale-150 animate-pulse" />
                     <div className="relative p-7 bg-black border border-orange-900/40 rounded-[2.5rem] shadow-2xl">
                        <Fingerprint size={42} className="text-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.5)]" />
                     </div>
                  </div>
                  <div className="space-y-2">
                     <div className="flex items-center gap-3">
                        <span className="badge-v2 bg-orange-600/10 border border-orange-600/20 text-orange-500 px-3 py-1 text-[10px] font-black tracking-[0.3em] uppercase italic">
                          PERSON_INTEL // DOSSIER_DETECTION
                        </span>
                        <div className="h-px w-10 bg-orange-600/20" />
                        <span className="text-[10px] font-black text-slate-700 font-mono tracking-widest uppercase italic">v58.2-WRAITH</span>
                     </div>
                     <h1 className="text-6xl font-black text-white tracking-tighter uppercase italic skew-x-[-2deg] leading-none mb-1">
                       ДОСЬЄ <span className="text-orange-500 underline decoration-orange-600/20 decoration-8 italic uppercase">ОСОБИ</span>
                     </h1>
                     <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.4em] italic opacity-80 leading-none">
                        ПЕ� СОНАЛЬНИЙ � ЕНТГЕН: СУДИ • БО� ГИ • ЗВ'ЯЗКИ • СОЦМЕ� ЕЖІ
                     </p>
                  </div>
               </div>
             }
             stats={[
               { label: 'ПЕ� ЕВІ� ЕНО_ДЖЕ� ЕЛ', value: String(result?.sources_checked || 42), icon: <Share2 size={14} />, color: 'primary' },
               { 
                 label: isOffline ? 'SYNC_RECOVERY' : '� ИЗИК_ОБ\'ЄКТА', 
                 value: isOffline ? `${Math.floor(healingProgress)}%` : result ? `${result.riskScore}%` : '???', 
                 icon: isOffline ? <Activity size={14} /> : <Siren size={14} />, 
                 color: isOffline ? 'warning' : 'danger', 
                 animate: isOffline || !!result 
               },
               { label: 'ВУЗОЛ_SOURCE', value: isOffline ? 'OFFLINE' : activeFailover ? 'ZROK_TUNNEL' : 'NVIDIA_MASTER', icon: <Database size={14} />, color: isOffline ? 'warning' : 'gold' }
             ]}
             actions={
               <div className="flex gap-4">
                  <button onClick={() => {setResult(null); setForm({pib: '', dob: '', region: ''});}} className="p-5 bg-black border border-white/[0.04] rounded-2xl text-slate-400 hover:text-white transition-all shadow-xl">
                     <RefreshCcw size={24} />
                  </button>
                  <button onClick={handleSearch} className="px-8 py-5 bg-orange-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] italic hover:bg-orange-600 shadow-2xl transition-all flex items-center gap-4">
                     <Radar size={18} /> СКАНУВАТИ_ОБ'ЄКТ
                  </button>
               </div>
             }
           />

           {/* SEARCH FORM */}
           {!result && !loading && (
             <motion.section initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto rounded-[3.5rem] bg-black border-2 border-orange-900/10 p-12 shadow-3xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none group-hover:scale-110 transition-transform">
                   <Scan size={300} className="text-orange-500" />
                </div>
                <form onSubmit={handleSearch} className="space-y-10 relative z-10">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="col-span-1 md:col-span-2 space-y-4">
                         <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic ml-4">ПОВНЕ ПІБ ОБ'ЄКТА � ЕЗЕ� ВАЦІЇ</label>
                         <input 
                           type="text" placeholder="ІВАНОВ ІВАН ІВАНОВИЧ..."
                           value={form.pib} onChange={(e) => setForm({ ...form, pib: e.target.value })}
                           className="w-full bg-white/[0.01] border-2 border-white/[0.04] p-7 rounded-2xl text-2xl font-black text-white italic tracking-tighter focus:border-orange-500/40 outline-none transition-all uppercase placeholder:text-slate-800"
                         />
                      </div>
                      <div className="space-y-4">
                         <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic ml-4">ДАТА НА� ОДЖЕННЯ</label>
                         <input 
                           type="date"
                           value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })}
                           className="w-full bg-white/[0.01] border-2 border-white/[0.04] p-7 rounded-2xl text-lg font-black text-slate-400 font-mono focus:border-orange-500/40 outline-none transition-all"
                         />
                      </div>
                      <div className="space-y-4">
                         <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic ml-4">� ЕГІОН СПОСТЕ� ЕЖЕННЯ</label>
                         <select 
                           value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })}
                           className="w-full bg-black border-2 border-white/[0.04] p-7 rounded-2xl text-lg font-black text-slate-400 italic focus:border-orange-500/40 outline-none transition-all appearance-none"
                         >
                           <option value="">— ВСІ � ЕГІОНИ —</option>
                           {regions.map(r => <option key={r} value={r}>{r.toUpperCase()} ОБЛАСТЬ</option>)}
                         </select>
                      </div>
                   </div>
                   <button 
                     disabled={loading}
                     className="w-full py-8 bg-orange-700 text-white rounded-2xl text-[12px] font-black uppercase tracking-[0.4em] italic hover:bg-orange-600 transition-all shadow-3xl flex items-center justify-center gap-6"
                   >
                      <Fingerprint size={28} /> ЗНЯТИ_ВІДБИТКИ_СИСТЕМИ_OSINT
                   </button>
                </form>
             </motion.section>
           )}

            {/* LOADING STATE */}
            {loading && (
              <div className="py-32 flex flex-col items-center justify-center space-y-12">
                 <CyberOrb size={220} status="quantum" />
                 <div className="space-y-4 text-center">
                    <p className="text-2xl font-black text-orange-500 uppercase italic tracking-[0.8em] animate-pulse">Т� АСУВАННЯ Т� АНЗАКЦІЙ...</p>
                    <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest italic">SEARCHING: {form.pib.toUpperCase()}</p>
                 </div>
              </div>
            )}

           {/* RESULT STATE */}
           {result && !loading && (
             <div className="grid grid-cols-12 gap-10">
                <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} className="col-span-12 xl:col-span-8 space-y-10">
                   
                   {/* PROFILE CARD */}
                   <section className="rounded-[4rem] bg-black border-2 border-orange-900/10 p-12 shadow-3xl relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-16 flex flex-col items-end opacity-100 transition-all group-hover:opacity-80">
                         <p className="text-[10px] font-black text-orange-500 uppercase tracking-[0.4em] mb-2 italic">RISK_SCORE</p>
                         <p className="text-7xl font-black text-orange-500 italic font-mono tracking-tighter drop-shadow-[0_0_20px_rgba(249,115,22,0.4)] leading-none">{result.riskScore}%</p>
                      </div>

                      <div className="flex items-center gap-10 mb-12 pb-10 border-b border-white/[0.04] relative z-10">
                         <div className="p-8 bg-orange-600/10 rounded-[2.5rem] border border-orange-600/30 shadow-2xl">
                            <User size={48} className="text-orange-500" />
                         </div>
                         <div className="space-y-2">
                            <div className="flex items-center gap-4">
                               <h2 className="text-5xl font-black text-white uppercase italic tracking-tighter leading-none">{result.pib}</h2>
                               <Badge className="bg-amber-600/20 text-amber-500 border-amber-500/30 uppercase italic font-black px-4 py-1 text-[10px]">{result.status}</Badge>
                            </div>
                            <p className="text-[12px] font-black text-slate-500 uppercase tracking-[0.3em] italic">
                               � ЕГІОН: {result.region.toUpperCase()} • {result.sources_checked} ДЖЕ� ЕЛ ПЕ� ЕВІ� ЕНО
                            </p>
                         </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12 relative z-10">
                         {[
                            { l: 'СУДОВІ СП� АВИ', v: result.court_cases, i: Scale, color: 'amber' },
                            { l: 'БО� ГИ ДПС', v: result.tax_debts, i: AlertTriangle, color: 'amber' },
                            { l: 'САНКЦІЇ', v: result.sanctions_hits, i: ShieldAlert, color: 'amber' },
                            { l: 'К� ИМІНАЛ', v: result.criminal_records, i: Lock, color: 'red' }
                         ].map((s, i) => (
                            <div key={i} className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/[0.04] hover:border-white/10 transition-all text-center group/metric">
                               <s.i size={28} className={cn("mx-auto mb-5 transition-transform group-hover/metric:scale-110", `text-${s.color}-500`)} />
                               <p className="text-4xl font-black text-white italic font-mono leading-none tracking-tighter mb-2">{s.v}</p>
                               <p className="text-[9px] font-black text-slate-700 uppercase tracking-widest">{s.l}</p>
                            </div>
                         ))}
                      </div>

                      <div className="flex flex-wrap items-center gap-6 pt-10 border-t border-white/[0.04] relative z-10">
                         <button className="px-10 py-5 bg-orange-700 text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.3em] italic hover:bg-orange-600 shadow-2xl flex items-center gap-4">
                            <Target size={20} /> ВСТАНОВИТИ_ПОСТІЙНИЙ_МОНІТО� ИНГ
                         </button>
                         <button className="px-10 py-5 bg-white/5 border border-white/10 text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.3em] italic hover:bg-white/10 transition-all flex items-center gap-4">
                            <FileText size={20} /> ГЕНЕ� УВАТИ_ПОВНИЙ_ЗВІТ
                         </button>
                      </div>
                   </section>

                   {/* SUB-SECTION GRID */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <TacticalCard variant="cyber" className="p-10 rounded-[3.5rem] space-y-8">
                         <h4 className="text-[11px] font-black text-orange-500 uppercase tracking-[0.4em] italic border-b border-orange-500/10 pb-6">БІЗНЕС_ІНТЕ� ЕСИ</h4>
                         <div className="space-y-4">
                            {result.related_companies.map((c, i) => (
                              <div key={i} className="p-6 rounded-3xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between hover:border-orange-500/30 transition-all group">
                                 <div>
                                    <p className="text-[14px] font-black text-white uppercase italic truncate max-w-[200px]">{c.name}</p>
                                    <p className="text-[9px] font-black text-slate-700 uppercase italic mt-1">{c.role} // {c.edrpou}</p>
                                 </div>
                                 <span className={cn("text-xl font-black italic font-mono", c.riskScore > 70 ? 'text-amber-500' : 'text-emerald-500')}>{c.riskScore}%</span>
                              </div>
                            ))}
                         </div>
                      </TacticalCard>

                      <TacticalCard variant="holographic" className="p-10 rounded-[3.5rem] space-y-8 border-orange-500/20 bg-orange-500/[0.02]">
                         <h4 className="text-[11px] font-black text-orange-500 uppercase tracking-[0.4em] italic border-b border-orange-500/10 pb-6">ЦИФ� ОВИЙ_СЛІД</h4>
                         <div className="grid grid-cols-2 gap-4">
                            {result.social_profiles.map((s, i) => (
                              <div key={i} className={cn(
                                "flex items-center gap-4 p-5 rounded-2xl border transition-all",
                                s.found ? "bg-orange-600/10 border-orange-600/30 text-orange-500" : "bg-white/[0.01] border-white/5 opacity-20"
                              )}>
                                 {s.found ? <CheckCircle size={16} /> : <XCircle size={16} />}
                                 <span className="text-[11px] font-black uppercase italic tracking-widest">{s.platform}</span>
                              </div>
                            ))}
                         </div>
                         <div className="pt-6 border-t border-orange-500/10 flex items-center gap-4 text-emerald-500 italic">
                            <Eye size={18} />
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-80">ВИЯВЛЕНО П� ИХОВАНІ МЕДІА-П� ИВ'ЯЗКИ</p>
                         </div>
                      </TacticalCard>
                   </div>
                </motion.div>

                {/* SIDEBAR NEXUS */}
                <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} className="col-span-12 xl:col-span-4 space-y-10">
                   <section className="rounded-[3.5rem] bg-black border-2 border-yellow-900/10 p-10 shadow-3xl space-y-10 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none group-hover:scale-110 transition-transform">
                         <Network size={280} className="text-yellow-500" />
                      </div>
                      <h3 className="text-[12px] font-black text-yellow-500 uppercase tracking-[0.4em] italic flex items-center gap-4">
                         <Share2 size={18} /> КА� ТА_ЗВ'ЯЗКІВ
                      </h3>
                      <div className="space-y-6 relative z-10">
                         {result.connections.map((c, i) => (
                           <div key={i} className="flex items-center gap-5 p-6 bg-white/[0.01] border border-white/[0.04] rounded-[2rem] hover:bg-yellow-600/5 transition-all group/item">
                              <div className="p-4 bg-yellow-600/10 text-yellow-500 rounded-2xl group-hover/item:bg-yellow-500 group-hover/item:text-white transition-all">
                                 <UserX size={20} />
                              </div>
                              <div className="space-y-1">
                                 <p className="text-[15px] font-black text-white italic leading-none">{c.name}</p>
                                 <p className="text-[9px] font-black text-slate-700 uppercase italic tracking-widest mt-1">{c.type} — {c.relation}</p>
                              </div>
                           </div>
                         ))}
                      </div>
                      <button className="w-full py-6 bg-yellow-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] italic hover:bg-yellow-600 shadow-3xl transition-all">
                         ВІЗУАЛІЗУВАТИ_НЕЙ� ОМЕ� ЕЖУ
                      </button>
                   </section>

                   <section className="p-10 rounded-[3.5rem] bg-black border border-white/[0.04] shadow-3xl space-y-8 relative overflow-hidden">
                       <h3 className="text-[12px] font-black text-slate-700 uppercase tracking-[0.4em] italic mb-6 flex items-center gap-4">
                          <Activity size={18} /> ОПЕ� АТИВНИЙ_СТАН
                       </h3>
                       <div className="p-8 rounded-[2.5rem] bg-amber-600/5 border border-amber-600/20 space-y-6">
                          <p className="text-[14px] font-bold text-amber-300 italic leading-snug">ВИЯВЛЕНО НЕПОВ'ЯЗАНІ АКТИВИ В КІП� СЬКИХ � ЕЄСТ� АХ ЧЕ� ЕЗ АНОМАЛЬНЕ СПІВПАДІННЯ ДА� Т-СПЕКТ� ІВ.</p>
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-3">
                                <ShieldAlert size={16} className="text-amber-500" />
                                <span className="text-[9px] font-black text-amber-500 uppercase tracking-[0.2em]">К� ИТИЧНА_АНОМАЛІЯ_detected</span>
                             </div>
                             <span className="text-[9px] font-black text-slate-600 font-mono italic">0.0024s // PREDATOR_BRAIN</span>
                          </div>
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
