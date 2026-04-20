/**
 * 🏛️ POWER STRUCTURE // МАПА ВПЛИВУ | v58.2-WRAITH
 * PREDATOR Analytics — Tactical Influence Mapping
 * 
 * Хто під ким стоїть? Карта реального впливу, бенефіціарів та "акціонерів" українського ринку.
 * Система аналізує політичні зв'язки, лобізм та прихований контроль.
 * 
 * © 2026 PREDATOR Analytics — HR-04 (100% українська)
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Landmark, Shield, User, Network, Target, ChevronRight,
    RefreshCw, AlertTriangle, Info, Activity, Database,
    Siren, Radar, RefreshCcw, Layout, Share2, Globe, Scan,
    ArrowRight, Fingerprint, Lock, ShieldAlert, Zap
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { apiClient } from '@/services/api/config';
import { PageTransition } from '@/components/layout/PageTransition';
import { TacticalCard } from '@/components/ui/TacticalCard';
import { ViewHeader } from '@/components/ViewHeader';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
import { CyberOrb } from '@/components/CyberOrb';
import { useBackendStatus } from '@/hooks/useBackendStatus';

interface PowerNode {
  id: string;
  name: string;
  role: string;
  power: number;
  status: string;
  edrpou: string;
  riskScore: number;
  totalValue: number;
  category: string;
  connections: number;
}

interface PowerStructureData {
  levels: {
    level1: { name: string; nodes: PowerNode[] };
    level2: { name: string; nodes: PowerNode[] };
    level3: { name: string; nodes: PowerNode[] };
  };
  insights: { question: string; answer: string; type: string }[];
  recentChanges: string[];
  summary: {
    totalNodes: number;
    highRiskCount: number;
    totalValue: number;
    avgRisk: number;
    topCategory: string;
  };
}

// ─── HELPER COMPONENTS ───────────────────────────────────────────────

const PowerNodeCard = ({ node, color }: { node: PowerNode; color?: string }) => (
    <motion.div 
        whileHover={{ scale: 1.02, x: 5 }}
        className="flex items-center gap-6 p-6 rounded-[2.5rem] bg-black border border-white/[0.04] hover:border-cyan-500/50 transition-all group cursor-pointer shadow-xl relative overflow-hidden"
    >
        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center bg-slate-900 border border-white/5 shadow-2xl transition-all group-hover:bg-cyan-500/10 group-hover:border-cyan-500/30", color)}>
            <Landmark className="w-7 h-7 text-white group-hover:text-cyan-400 transition-colors" />
        </div>
        <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
                <h4 className="text-lg font-black text-white italic tracking-tighter uppercase leading-none truncate max-w-[200px]">{node.name}</h4>
                <span className="text-[9px] px-3 py-1 rounded-full bg-slate-800 text-slate-400 border border-white/5 font-black uppercase italic">
                    {node.status}
                </span>
            </div>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{node.role}</p>
            <div className="flex items-center gap-4 text-[9px] text-slate-700 font-black uppercase italic">
                <span>ЄДРПОУ: {node.edrpou}</span>
                <span>РИЗИК: <span className={cn(node.riskScore > 70 ? 'text-amber-500' : 'text-emerald-500')}>{node.riskScore}%</span></span>
            </div>
            
            <div className="mt-4 flex items-center gap-4">
                <div className="flex-1 h-1.5 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${node.power}%` }}
                        className="h-full bg-gradient-to-r from-cyan-600 to-blue-600 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                    />
                </div>
                <span className="text-[10px] font-black font-mono text-cyan-400 italic leading-none">{node.power}% ВПЛИВУ</span>
            </div>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-800 group-hover:text-cyan-400 transition-all shrink-0" />
    </motion.div>
);

// ─── MAIN COMPONENT ──────────────────────────────────────────────────

export default function PowerStructureView() {
    const [data, setData] = useState<PowerStructureData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/power-structure');
            setData(res.data);
        } catch (err) {
            // Mock data for demo
            setData({
                levels: {
                    level1: { 
                        name: 'ВЕРХОВНИЙ_АРХІТЕКТОР', 
                        nodes: [{ id: '1', name: 'ОЛЕКСАНДР_Г.В.', role: 'Тіньовий Куратор Митниці', power: 94, status: 'КРИТИЧНО', edrpou: 'PRIVATE', riskScore: 88, totalValue: 450000000, category: 'Politics', connections: 124 }] 
                    },
                    level2: { 
                        name: 'ФІНАНСОВІ_ОПЕРАТОРИ', 
                        nodes: [
                            { id: '2', name: 'ТОВ "ЗАВОД ТИТАН"', role: 'Промисловий Вузол', power: 72, status: 'ПІД_НАГЛЯДОМ', edrpou: '40012921', riskScore: 45, totalValue: 120000000, category: 'Business', connections: 45 },
                            { id: '3', name: 'БАНК_ЦИТАДЕЛЬ', role: 'Фінансовий Шлюз', power: 68, status: 'АКТИВНО', edrpou: '38210455', riskScore: 12, totalValue: 840000000, category: 'Finance', connections: 78 }
                        ] 
                    },
                    level3: { 
                        name: 'РЕГІОНАЛЬНІ_КЕЙСИ', 
                        nodes: [
                            { id: '4', name: 'ОДЕСЬКА_ФІЛІЯ', role: 'Логістика', power: 45, status: 'LIVE', edrpou: '00124921', riskScore: 56, totalValue: 12000000, category: 'Port', connections: 12 },
                            { id: '5', name: 'ЛЬВІВСЬКИЙ_ХАБ', role: 'Західний Коридор', power: 34, status: 'LIVE', edrpou: '11204921', riskScore: 32, totalValue: 8500000, category: 'Customs', connections: 8 }
                        ] 
                    }
                },
                insights: [
                    { question: 'ХТО КОНТРОЛЮЄ ТИТАНОВИЙ ШЛЕЙФ?', answer: 'Група "Оріон" через 3 офшори.', type: 'critical' },
                    { question: 'ОБСЛУГОВУЮЧИЙ БАНК?', answer: 'Банк Альянс-Преміум (EDRPOU: 124001).', type: 'warning' }
                ],
                recentChanges: ['Зміна бенефіціара ТОВ Тесла', 'Вихід зі складу акціонерів офшору XYZ'],
                summary: { totalNodes: 45, highRiskCount: 12, totalValue: 1240000000, avgRisk: 42, topCategory: 'Industrial' }
            });
        } finally {
            setLoading(false);
        }
    }, []);

    const { isOffline, nodeSource, activeFailover, healingProgress } = useBackendStatus();

    useEffect(() => {
        if (isOffline) {
           window.dispatchEvent(new CustomEvent('predator-error', {
              detail: {
                service: 'PowerNexus',
                message: 'РЕЖИМ АВТОНОМНОГО КАРТОГРАФУВАННЯ (POWER_OFFLINE). Тіньові зв\'язки базуються на локальних кеш-вузлах.',
                severity: 'info',
                timestamp: new Date().toISOString(),
                code: 'POWER_OFFLINE'
              }
           }));
        }
    }, [isOffline]);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 60000);
        return () => clearInterval(interval);
    }, [fetchData]);

    return (
        <PageTransition>
            <div className="min-h-screen bg-[#020617] text-slate-200 relative overflow-hidden font-sans pb-32">
                <AdvancedBackground />
                <CyberGrid color="rgba(6, 182, 212, 0.03)" />

                <div className="relative z-10 max-w-[1780px] mx-auto p-4 sm:p-12 space-y-12">
                   
                   <ViewHeader
                     title={
                       <div className="flex items-center gap-10">
                          <div className="relative group">
                             <div className="absolute inset-0 bg-cyan-600/20 blur-3xl rounded-full scale-150 animate-pulse" />
                             <div className="relative p-7 bg-black border border-cyan-900/40 rounded-[2.5rem] shadow-2xl">
                                <Landmark size={42} className="text-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)]" />
                             </div>
                          </div>
                          <div className="space-y-2">
                             <div className="flex items-center gap-3">
                                <span className="badge-v2 bg-cyan-600/10 border border-cyan-600/20 text-cyan-500 px-3 py-1 text-[10px] font-black tracking-[0.3em] uppercase italic">
                                  POWER_NEXUS // INFLUENCE_MAPPING
                                </span>
                                <div className="h-px w-10 bg-cyan-600/20" />
                                <span className="text-[10px] font-black text-slate-700 font-mono tracking-widest uppercase italic">v58.2-WRAITH</span>
                             </div>
                             <h1 className="text-6xl font-black text-white tracking-tighter uppercase italic skew-x-[-2deg] leading-none mb-1">
                               МАПА <span className="text-cyan-500 underline decoration-cyan-600/20 decoration-8 italic uppercase">ВПЛИВУ</span>
                             </h1>
                             <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.4em] italic opacity-80 leading-none">
                               ВЕРТИКАЛЬ КОНТРОЛЮ, ТІНЬОВІ БЕНЕФІЦІАРИ ТА ЛОБІЗМ
                             </p>
                          </div>
                       </div>
                     }
                     stats={[
                       { label: 'АКТИВНІ_ВУЗЛИ', value: String(data?.summary.totalNodes || 0), icon: <Network size={14} />, color: 'primary' },
                       { 
                         label: isOffline ? 'SYNC_RECOVERY' : 'ВУЗОЛ_SOURCE', 
                         value: isOffline ? `${Math.floor(healingProgress)}%` : activeFailover ? 'ZROK_TUNNEL' : 'NVIDIA_MASTER', 
                         icon: isOffline ? <Activity /> : <Database size={14} />, 
                         color: isOffline ? 'warning' : 'gold', 
                         animate: isOffline 
                       },
                       { label: 'СТАН_КАНАЛУ', value: isOffline ? 'FAILOVER' : 'LIVE', icon: <Zap size={14} />, color: isOffline ? 'warning' : 'success' }
                     ]}
                     actions={
                       <div className="flex gap-4">
                          <button onClick={fetchData} className={cn("p-5 bg-black border border-white/[0.04] rounded-2xl text-slate-400 hover:text-white transition-all shadow-xl", loading && "animate-spin")}>
                             <RefreshCcw size={24} />
                          </button>
                          <button className="px-8 py-5 bg-cyan-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] italic hover:bg-cyan-600 shadow-2xl transition-all flex items-center gap-4">
                             <Radar size={18} /> СКАНУВАТИ_ВЕРТИКАЛЬ
                          </button>
                       </div>
                     }
                   />

                   <div className="grid grid-cols-12 gap-10">
                      
                      {/* PYRAMID OF CONTROL */}
                      <div className="col-span-12 xl:col-span-8 space-y-10">
                         <div className="p-12 rounded-[4rem] bg-black border-2 border-white/[0.04] shadow-3xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-16 opacity-[0.03] pointer-events-none group-hover:scale-110 group-hover:rotate-6 transition-transform duration-[3s]">
                               <Share2 size={500} className="text-cyan-500" />
                            </div>
                            
                            <div className="relative z-10 space-y-12">
                               <div className="flex items-center gap-6 pb-8 border-b border-white/[0.04]">
                                  <Shield className="w-8 h-8 text-cyan-500" />
                                  <h3 className="text-3xl font-black text-white italic uppercase tracking-widest skew-x-[-2deg]">ВЕРТИКАЛЬ_ЦЕНТРАЛЬНОГО_КОНТРОЛЮ</h3>
                               </div>
                               
                               {data?.levels && (
                                 <div className="space-y-16">
                                    {/* LEVEL 1 */}
                                    <div className="space-y-6">
                                       <div className="flex items-center gap-4">
                                          <span className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.6em] italic font-mono pr-4 border-r border-cyan-500/20">LEVEL_ALPHA</span>
                                          <span className="text-[12px] font-black text-slate-500 uppercase italic tracking-widest">{data.levels.level1.name}</span>
                                       </div>
                                       <div className="max-w-2xl">
                                          {data.levels.level1.nodes.map(node => (
                                            <PowerNodeCard key={node.id} node={node} color="shadow-[0_0_30px_rgba(6,182,212,0.3)] border-cyan-500/40 bg-cyan-500/[0.02]" />
                                          ))}
                                       </div>
                                    </div>

                                    <div className="w-px h-16 bg-gradient-to-b from-cyan-500/40 via-cyan-500/10 to-transparent mx-12" />

                                    {/* LEVEL 2 */}
                                    <div className="space-y-6">
                                       <div className="flex items-center gap-4">
                                          <span className="text-[10px] font-black text-slate-700 uppercase tracking-[0.6em] italic font-mono pr-4 border-r border-white/10">LEVEL_BETA</span>
                                          <span className="text-[12px] font-black text-slate-500 uppercase italic tracking-widest">{data.levels.level2.name}</span>
                                       </div>
                                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                          {data.levels.level2.nodes.map(node => (
                                            <PowerNodeCard key={node.id} node={node} />
                                          ))}
                                       </div>
                                    </div>

                                    <div className="w-px h-16 bg-gradient-to-b from-white/10 to-transparent mx-12" />

                                    {/* LEVEL 3 */}
                                    <div className="space-y-6">
                                       <div className="flex items-center gap-4">
                                          <span className="text-[10px] font-black text-slate-700 uppercase tracking-[0.6em] italic font-mono pr-4 border-r border-white/10">LEVEL_GAMMA</span>
                                          <span className="text-[12px] font-black text-slate-500 uppercase italic tracking-widest">{data.levels.level3.name}</span>
                                       </div>
                                       <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                          {data.levels.level3.nodes.map(node => (
                                            <div key={node.id} className="p-6 rounded-3xl bg-white/[0.01] border border-white/[0.04] text-center hover:border-cyan-500/30 transition-all group/it">
                                               <p className="text-sm font-black text-white italic uppercase truncate mb-1">{node.name}</p>
                                               <p className="text-[9px] font-black text-slate-700 uppercase italic">Вплив {node.power}% | Ризик {node.riskScore}%</p>
                                            </div>
                                          ))}
                                       </div>
                                    </div>
                                 </div>
                               )}
                            </div>
                         </div>
                      </div>

                      {/* INTELLIGENCE SIDEBAR */}
                      <div className="col-span-12 xl:col-span-4 space-y-10">
                         <section className="p-10 rounded-[3.5rem] bg-black border-2 border-yellow-900/10 shadow-3xl space-y-10 relative overflow-hidden group">
                             <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none group-hover:scale-110 transition-transform">
                                <Scan size={280} className="text-yellow-500" />
                             </div>
                             <h3 className="text-[12px] font-black text-yellow-500 uppercase tracking-[0.4em] italic flex items-center gap-4">
                                <Target size={18} /> КРИТИЧНІ_ІНСАЙТИ
                             </h3>
                             <div className="space-y-6 relative z-10">
                                {data?.insights.map((insight, i) => (
                                  <div key={i} className={cn("p-6 rounded-[2rem] border transition-all", insight.type === 'critical' ? 'bg-amber-900/5 border-amber-900/20' : 'bg-yellow-900/5 border-yellow-900/20')}>
                                     <div className="flex items-center gap-3 text-[10px] font-black text-yellow-400 uppercase italic mb-2 tracking-widest">
                                        {insight.type === 'critical' ? <AlertTriangle size={14} className="text-amber-500" /> : <Info size={14} className="text-yellow-500" />}
                                        {insight.question}
                                     </div>
                                     <p className="text-lg font-black text-white italic leading-tight">{insight.answer}</p>
                                  </div>
                                ))}
                             </div>
                             <button className="w-full py-6 bg-yellow-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] italic hover:bg-yellow-600 shadow-3xl transition-all">
                                ПЕРЕГЛЯНУТИ_ГРАФ_ВПЛИВУ
                             </button>
                         </section>

                         <section className="p-10 rounded-[3.5rem] bg-black border border-white/[0.04] shadow-3xl space-y-8 relative overflow-hidden">
                             <h3 className="text-[12px] font-black text-slate-700 uppercase tracking-[0.4em] italic mb-6 flex items-center gap-4">
                                <Activity size={18} /> ОСТАННІ_ЗМІНИ_В_NEXUS
                             </h3>
                             <div className="space-y-6">
                                {data?.recentChanges.map((log, i) => (
                                  <div key={i} className="flex gap-4 p-5 rounded-2xl bg-white/[0.01] border border-white/[0.04] transition-all hover:bg-white/[0.03]">
                                     <div className="w-2 h-2 rounded-full bg-cyan-500 mt-2 shrink-0 animate-pulse" />
                                     <span className="text-[12px] font-black text-slate-400 italic leading-snug">{log}</span>
                                  </div>
                                ))}
                             </div>
                         </section>
                      </div>

                   </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .shadow-3xl { box-shadow: 0 60px 100px -30px rgba(0,0,0,0.8); }
            `}} />
        </PageTransition>
    );
}
