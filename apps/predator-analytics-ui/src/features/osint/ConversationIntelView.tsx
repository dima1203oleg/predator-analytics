/**
 * 📡 CONVERSATION INTEL // СИГНАЛЬНИЙ ДЕКОДЕ  | v58.2-WRAITH
 * PREDATOR Analytics — Neural Signal Decoding & OSINT
 * 
 * Моніторинг Telegram каналів, ЗМІ, соцмереж та даркнет-форумів.
 * Виявлення прихованих наративів, дезінформації та сигналів впливу в реальному часі.
 * 
 * © 2026 PREDATOR Analytics — HR-04 (100% українська)
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Radio, MessageCircle, Activity, Globe, 
    AlertTriangle, Newspaper, Hash, 
    Target, Zap, RefreshCcw, Satellite, 
    Fingerprint, Scan, Shield, Search,
    Filter, Database, Signal, MessageSquare,
    Eye, Box, Cpu, Radar, Siren, ArrowUpRight, Users
} from 'lucide-react';
import ReactECharts from '@/components/ECharts';
import { cn } from '@/utils/cn';
import { PageTransition } from '@/components/layout/PageTransition';
import { TacticalCard } from '@/components/ui/TacticalCard';
import { ViewHeader } from '@/components/ViewHeader';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
import { CyberOrb } from '@/components/CyberOrb';
import { Badge } from '@/components/ui/badge';
import { intelligence } from '@/services/dataService';
import { useQuery } from '@tanstack/react-query';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { DiagnosticsTerminal } from '@/components/intelligence/DiagnosticsTerminal';
import { RiskLevelValue } from '@/types/intelligence';

// ─── TYPES ────────────────────────────────────────────────────────────

type Platform = 'telegram' | 'news' | 'social' | 'forum';
type Sentiment = 'positive' | 'negative' | 'neutral' | 'mixed';

interface Message {
  id: string;
  channel: string;
  platform: Platform;
  text: string;
  time: string;
  views: string;
  sentiment: Sentiment;
  entities: string[];
  riskLevel: RiskLevelValue;
  risk_score?: number;
  isDisinfo: boolean;
  original_text?: string;
  summary?: string;
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────

export default function ConversationIntelView() {
    const [activeTab, setActiveTab] = useState<'feed' | 'analytics' | 'risk'>('feed');
    const [liveCount, setLiveCount] = useState(8234);
    const backendStatus = useBackendStatus();
    const { isOffline, activeFailover } = backendStatus;

    const { data: messages = [], isLoading, refetch, error } = useQuery({
        queryKey: ['telegram-feed'],
        queryFn: () => intelligence.getSignalFeed(),
        refetchInterval: 15000 
    });

    // Trace: v58.2-WRAITH Error Protocol Integration
    useEffect(() => {
        if (isOffline) {
            window.dispatchEvent(new CustomEvent('predator-error', { 
                detail: { 
                    service: 'ConversationIntel', 
                    message: `СИГНАЛЬНИЙ ДЕКОДЕ  [${backendStatus.nodeSource}]:  обота в автономному режимі MIRROR. Синхронізація OSINT обмежена.`,
                    severity: 'warning',
                    timestamp: new Date().toISOString(),
                    code: 'OSINT_OFFLINE'
                } 
            }));
        } else if (!isLoading && !error) {
            window.dispatchEvent(new CustomEvent('predator-error', { 
                detail: { 
                    service: 'ConversationIntel', 
                    message: `DECODER_READY [${backendStatus.nodeSource}]: Канали перехоплення (Telegram/News) стабільні. Сигнали надходять.`,
                    severity: 'info',
                    timestamp: new Date().toISOString(),
                    code: 'OSINT_SUCCESS'
                } 
            }));
        }

        if (error) {
            window.dispatchEvent(new CustomEvent('predator-error', { 
                detail: { 
                    service: 'ConversationIntel', 
                    message: error instanceof Error ? `ПОМИЛКА_SIGINT: ${error.message}` : 'Втрачено контакт з OSINT-процесором.',
                    severity: 'critical',
                    timestamp: new Date().toISOString(),
                    code: 'OSINT_FAIL'
                } 
            }));
        }
    }, [error, isOffline, isLoading, backendStatus.nodeSource]);

    useEffect(() => {
        const id = setInterval(() => setLiveCount(c => c + Math.floor(Math.random() * 5)), 3000);
        return () => clearInterval(id);
    }, []);

    const chartOption = useMemo(() => ({
        backgroundColor: 'transparent',
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { top: 10, left: 10, right: 10, bottom: 10, containLabel: true },
        xAxis: { type: 'category', data: ['00', '04', '08', '12', '16', '20'], axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: '#475569', fontSize: 10 } },
        yAxis: { type: 'value', splitLine: { lineStyle: { color: 'rgba(16, 185, 129, 0.05)' } }, axisLabel: { show: false } },
        series: [
            {
                name: 'Sigs',
                type: 'line',
                smooth: true,
                symbol: 'none',
                lineStyle: { color: '#10b981', width: 3 },
                areaStyle: { color: 'rgba(16, 185, 129, 0.1)' },
                data: [120, 240, 450, 320, 580, 420]
            }
        ]
    }), []);

    return (
        <PageTransition>
            <div className="min-h-screen bg-[#020202] text-slate-200 relative overflow-hidden font-sans pb-40 flex flex-col">
                <AdvancedBackground mode="sovereign" />
                <CyberGrid opacity={0.03} />

                <div className="relative z-10 max-w-[1880px] mx-auto p-12 w-full space-y-12 flex-1 flex flex-col h-screen overflow-hidden">
                   
                   <ViewHeader
                     title={
                       <div className="flex items-center gap-10">
                          <div className="relative group">
                             <div className="absolute inset-0 bg-emerald-500/15 blur-3xl rounded-full scale-150 group-hover:scale-200 transition-transform duration-[2s]" />
                             <div className="relative p-7 bg-black border-2 border-emerald-500/30 rounded-[3rem] shadow-4xl transform -rotate-3 hover:rotate-0 transition-all cursor-crosshair">
                                <Radio size={54} className="text-emerald-500 drop-shadow-[0_0_20px_rgba(16,185,129,0.4)] animate-pulse" />
                                <span className="absolute inset-x-0 bottom-4 h-1 bg-emerald-500/20 blur-lg mx-8" />
                             </div>
                          </div>
                          <div>
                             <div className="flex items-center gap-4 mb-3">
                                <span className={cn("w-1.5 h-1.5 rounded-full shadow-[0_0_10px_currentColor] animate-ping", isOffline ? "bg-amber-500 text-amber-500" : "bg-emerald-500 text-emerald-500")} />
                                <span className={cn("text-[10px] font-black uppercase tracking-[0.8em] italic leading-none", isOffline ? "text-amber-500/80" : "text-emerald-500/80")}>
                                   {isOffline ? 'SOVEREIGN_EMERGENCY' : 'SIGNAL_DECODER'} // NEURAL_OSINT_V56.5
                                </span>
                             </div>
                             <h1 className="text-6xl font-black text-white tracking-tighter uppercase italic skew-x-[-3deg] leading-none mb-1">
                               СИГНАЛЬНИЙ <span className={cn("italic uppercase underline decoration-8 underline-offset-8", isOffline ? "text-amber-500 decoration-amber-500/20" : "text-emerald-500 decoration-emerald-500/20")}>ДЕКОДЕ </span>
                             </h1>
                             <p className="text-[12px] text-slate-600 font-black uppercase tracking-[0.5em] mt-6 italic border-l-4 border-emerald-500/20 pl-8 opacity-90 max-w-2xl">
                               МОНІТО ИНГ ТЕЛЕГ АМ-КАНАЛІВ, ЗМІ ТА ДА КНЕТ-ФО УМІВ // SOVEREIGN CLOUD
                             </p>
                          </div>
                       </div>
                     }
                     stats={[
                       { label: 'NODE_SOURCE', value: isOffline ? 'SOVEREIGN_MIRROR' : 'NVIDIA_PROD', icon: <Cpu size={14} />, color: isOffline ? 'warning' : 'success' },
                       { label: 'FAILOVER', value: activeFailover ? 'COLAB_SHARED' : isOffline ? 'LOCAL_PROXY' : 'STANDBY', icon: <Satellite size={14} />, color: isOffline ? 'warning' : 'primary' },
                       { label: 'СИГНАЛЬНИЙ_Т АФІК', value: liveCount.toLocaleString(), icon: <Activity size={14} />, color: 'success' }
                     ]}
                     actions={
                       <div className="flex items-center gap-6">
                          <button onClick={() => refetch()} className="p-6 bg-black border-2 border-white/5 rounded-[2rem] text-slate-500 hover:text-emerald-500 transition-all shadow-4xl group">
                             <RefreshCcw size={24} className="group-hover:rotate-180 transition-transform duration-1000" />
                          </button>
                          <button className="px-14 py-6 bg-emerald-600 text-white rounded-[2rem] text-[12px] font-black uppercase tracking-[0.4em] italic hover:brightness-110 shadow-4xl transition-all flex items-center gap-5 border-4 border-emerald-500/20">
                             <Radar size={24} className="animate-spin-slow" /> ЗАПУСТИТИ_ПЕ ЕХОПЛЕННЯ
                          </button>
                       </div>
                     }
                   />

                   <div className="grid grid-cols-12 gap-12 flex-1 overflow-hidden">
                      
                      {/* LIVE FEED LIST */}
                      <div className="col-span-12 xl:col-span-7 space-y-10 flex flex-col h-full overflow-hidden">
                         <div className="flex items-center gap-4 p-3 bg-black border-2 border-white/5 rounded-[2.5rem] w-fit shadow-4xl backdrop-blur-3xl">
                             <div className="flex gap-2 bg-black border-2 border-white/5 p-2 rounded-2xl shadow-inner">
                                {(['feed', 'analytics', 'risk'] as const).map(tab => (
                                  <button 
                                    key={tab} 
                                    onClick={() => setActiveTab(tab)} 
                                    className={cn(
                                        "px-10 py-3 text-[10px] font-black uppercase tracking-[0.3em] transition-all rounded-xl italic",
                                        activeTab === tab 
                                          ? "bg-emerald-600 text-white shadow-4xl scale-105 font-bold" 
                                          : "text-slate-600 hover:text-slate-300 border-2 border-transparent hover:border-emerald-500/10 hover:bg-white/5"
                                    )}
                                  >
                                    {tab === 'feed' ? 'LIVE_ПОТІК' : tab === 'analytics' ? 'АНАЛІТИКА' : 'РИЗИК_СИГНАЛИ'}
                                  </button>
                                ))}
                             </div>
                         </div>

                         <div className="space-y-6 flex-1 overflow-y-auto custom-scrollbar pr-6 pb-20 no-scrollbar">
                            {isLoading ? (
                                <div className="p-40 text-center border-2 border-white/5 rounded-[4rem] bg-black/40 h-full flex flex-col items-center justify-center">
                                    <div className="mb-8 relative inline-block">
                                        <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full scale-150 animate-pulse" />
                                        <Satellite size={80} className="relative z-10 text-emerald-500 animate-spin-slow" />
                                    </div>
                                    <p className="text-[12px] font-black uppercase text-slate-700 tracking-[0.8em] italic animate-pulse">ІНІЦІАЛІЗАЦІЯ_ПЕ ЕХОПЛЕННЯ_СИГНАЛІВ...</p>
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="p-40 text-center border-4 border-dashed border-white/5 rounded-[4rem] bg-black/40 h-full flex flex-col items-center justify-center">
                                    <div className="mb-10 text-slate-800">
                                        <Scan size={100} className="mx-auto" />
                                    </div>
                                    <p className="text-[12px] font-black uppercase text-slate-700 tracking-[0.6em] italic leading-none">АКТУАЛЬНИХ_СИГНАЛІВ_НЕ_ВИЯВЛЕНО</p>
                                </div>
                            ) : messages.map((msg: Message, i: number) => (
                               <motion.div 
                                 key={msg.id || i} 
                                 initial={{ opacity: 0, scale: 0.98, y: 20 }} 
                                 animate={{ opacity: 1, scale: 1, y: 0 }} 
                                 transition={{ delay: i * 0.05 }} 
                                 className={cn(
                                     "p-12 rounded-[4rem] border-2 transition-all group space-y-8 relative overflow-hidden shadow-3xl",
                                     msg.riskLevel === 'critical' 
                                        ? 'bg-red-500/5 border-red-500/30' 
                                        : 'bg-black/80 border-white/5 hover:border-emerald-500/20'
                                 )}
                               >
                                  {msg.riskLevel === 'critical' && (
                                     <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
                                        <Siren size={100} className="text-red-500 animate-pulse" />
                                     </div>
                                  )}

                                  <div className="flex items-center justify-between relative z-10">
                                     <div className="flex items-center gap-8">
                                        <div className="w-16 h-16 rounded-[1.5rem] bg-black border-2 border-white/5 flex items-center justify-center text-emerald-500 shadow-inner group-hover:border-emerald-500/40 transition-all">
                                           {msg.platform === 'telegram' ? <MessageSquare size={32} /> : <Globe size={32} />}
                                        </div>
                                        <div>
                                           <div className="flex items-center gap-4 mb-2">
                                              <p className="text-xl font-black text-emerald-400 italic leading-none uppercase tracking-tighter">{msg.channel}</p>
                                              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
                                           </div>
                                           <p className="text-[10px] font-black text-slate-700 uppercase italic tracking-widest leading-none">
                                              {msg.time} // {msg.views} VIEWS · {msg.platform.toUpperCase()}
                                           </p>
                                        </div>
                                     </div>
                                     {msg.riskLevel === 'critical' ? (
                                        <div className="px-6 py-2 bg-red-600 text-white rounded-full text-[10px] font-black uppercase italic tracking-[0.3em] shadow-4xl animate-pulse">
                                           К ИТИЧНИЙ_РИЗИК
                                        </div>
                                     ) : (
                                        <div className="flex gap-2">
                                            <span className="w-1.5 h-1.5 bg-slate-800 rounded-full" />
                                            <span className="w-1.5 h-1.5 bg-slate-800 rounded-full" />
                                            <span className="w-1.5 h-1.5 bg-slate-800 rounded-full" />
                                        </div>
                                     )}
                                  </div>

                                  <p className="text-2xl font-black text-white italic leading-tight group-hover:text-emerald-300 transition-colors uppercase tracking-tight relative z-10 font-serif">
                                     {msg.text || msg.original_text || msg.summary}
                                  </p>

                                  <div className="flex flex-wrap gap-4 pt-8 border-t border-white/5 relative z-10">
                                     {msg.entities.map((e, j) => (
                                       <span key={j} className="text-[10px] font-black px-5 py-2 bg-emerald-500/5 border-2 border-emerald-500/10 text-emerald-600 uppercase tracking-widest rounded-full italic hover:bg-emerald-500/10 transition-all cursor-pointer">
                                         #{e.replace(/\s/g, '_')}
                                       </span>
                                     ))}
                                     <div className="ml-auto flex gap-3">
                                        <button className="p-4 rounded-full bg-white/5 border border-white/10 text-slate-600 hover:text-white transition-all">
                                           <Eye size={18} />
                                        </button>
                                        <button className="p-4 rounded-full bg-white/5 border border-white/10 text-slate-600 hover:text-emerald-500 transition-all">
                                           <ArrowUpRight size={18} />
                                        </button>
                                     </div>
                                  </div>
                               </motion.div>
                            ))}
                         </div>
                      </div>

                      {/* SIDE ANALYTICS */}
                      <div className="col-span-12 xl:col-span-5 space-y-12 h-screen overflow-y-auto no-scrollbar pr-4">
                         <TacticalCard variant="holographic" className="p-12 bg-black border-2 border-white/5 rounded-[4rem] shadow-4xl space-y-12 relative overflow-hidden group">
                             <div className="absolute top-0 right-0 p-20 opacity-[0.03] pointer-events-none group-hover:scale-125 transition-transform duration-[5s]">
                                <Signal size={350} className="text-emerald-500" />
                             </div>
                             <div className="relative z-10">
                                <h3 className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.6em] italic mb-10 flex items-center gap-6">
                                   <Activity size={24} className="animate-pulse" /> ДИНАМІКА_СИГНАЛІВ_24Г
                                </h3>
                                <div className="h-[260px] mb-12 border-b-2 border-white/5 pb-10">
                                   <ReactECharts option={chartOption} style={{ height: '100%', width: '100%' }} />
                                </div>
                                <div className="grid grid-cols-2 gap-8">
                                   <div className="p-8 bg-black/60 border-2 border-white/5 rounded-[3rem] space-y-4 shadow-inner group/stat hover:border-red-500/30 transition-all">
                                      <p className="text-[10px] font-black text-slate-800 uppercase italic tracking-widest leading-none">SENTIMENT_AVG</p>
                                      <p className="text-4xl font-black text-red-500 italic font-mono tracking-tighter leading-none">-42.8%</p>
                                      <p className="text-[9px] text-red-700 uppercase font-black tracking-widest italic opacity-60">NEGATIVE_TREND</p>
                                   </div>
                                   <div className="p-8 bg-black/60 border-2 border-white/5 rounded-[3rem] space-y-4 shadow-inner group/stat hover:border-emerald-500/30 transition-all">
                                      <p className="text-[10px] font-black text-slate-800 uppercase italic tracking-widest leading-none">DETECTION_SPD</p>
                                      <p className="text-4xl font-black text-emerald-500 italic font-mono tracking-tighter leading-none">0.38s</p>
                                      <p className="text-[9px] text-emerald-700 uppercase font-black tracking-widest italic opacity-60">WRAITH_LATENCY</p>
                                   </div>
                                </div>
                             </div>
                         </TacticalCard>

                         <TacticalCard className="p-12 bg-black/80 border-2 border-white/5 rounded-[4rem] shadow-4xl space-y-10 relative overflow-hidden group">
                             <div className="absolute -bottom-10 -left-10 opacity-5">
                                <Hash size={120} className="text-emerald-500 group-hover:rotate-12 transition-transform duration-700" />
                             </div>
                             <div className="relative z-10">
                                <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.6em] italic mb-10 flex items-center gap-5 leading-none">
                                   <Fingerprint size={24} className="text-emerald-500" /> ТОП_НА АТИВИ_ЦИКЛУ
                                </h3>
                                <div className="space-y-6">
                                   {[
                                     { topic: 'ОФШО НІ_СХЕМИ_АП', count: 1240, risk: 'high', gold: true },
                                     { topic: 'ТИТАНОВИЙ_ЛОБІЗМ', count: 890, risk: 'critical', gold: false },
                                     { topic: ' ЕЗЕ В_КА ГО_ЗЛИВ', count: 678, risk: 'medium', gold: false }
                                   ].map((t, i) => (
                                     <div key={i} className="flex items-center justify-between p-8 bg-black border-2 border-white/5 rounded-[2.5rem] hover:border-emerald-500/40 transition-all group/item shadow-2xl relative overflow-hidden">
                                        {t.gold && <div className="absolute inset-0 bg-emerald-500/[0.03] pointer-events-none" />}
                                        <div className="flex items-center gap-6">
                                           <div className={cn("w-3 h-3 rounded-full shadow-[0_0_10px_currentColor]", t.risk === 'critical' ? 'text-red-500 bg-red-500 animate-pulse' : t.risk === 'high' ? 'text-amber-500 bg-amber-500' : 'text-emerald-500 bg-emerald-500')} />
                                           <span className="text-[18px] font-black text-white italic tracking-tighter uppercase group-hover/item:text-emerald-400 transition-colors">{t.topic}</span>
                                        </div>
                                        <div className="text-right">
                                           <p className="text-[14px] font-black text-emerald-500/80 font-mono italic tabular-nums leading-none tracking-tighter">{t.count}</p>
                                           <p className="text-[8px] text-slate-800 uppercase font-black italic mt-1 font-mono">SIGNALS</p>
                                        </div>
                                     </div>
                                   ))}
                                </div>
                             </div>
                         </TacticalCard>

                         <TacticalCard className="p-10 bg-emerald-900/10 border-2 border-emerald-500/20 rounded-[3rem] relative overflow-hidden shadow-4xl group">
                             <div className="flex items-center gap-8 relative z-10">
                                <div className="p-5 bg-black border-2 border-emerald-500/30 rounded-[2rem] text-emerald-500 shadow-4xl">
                                   <Cpu size={32} className="animate-pulse" />
                                </div>
                                <div>
                                   <h4 className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.5em] italic mb-2">NEURAL_DECODER_MODEL</h4>
                                   <p className="text-[15px] font-black text-emerald-100 uppercase italic tracking-tight leading-snug">
                                      МОДЕЛЬ: PREDATOR_LLM_V4 // ОЧІКУВАННЯ ТЕКСТОВОГО BURST
                                   </p>
                                </div>
                             </div>
                             <div className="absolute top-0 right-0 p-8 opacity-10">
                                <Signal size={40} className="text-emerald-600 animate-ping" />
                             </div>
                         </TacticalCard>
                      </div>

                   </div>
                </div>

                <div className="max-w-[1880px] mx-auto px-12 pb-20 mt-[-40px] relative z-20">
                    <DiagnosticsTerminal />
                </div>

                <style dangerouslySetInnerHTML={{ __html: `
                    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(16,185,129,0.1); border-radius: 20px; }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(16,185,129,0.3); }
                    .animate-spin-slow { animation: spin 20s linear infinite; }
                    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                    .no-scrollbar::-webkit-scrollbar { display: none; }
                `}} />
            </div>
        </PageTransition>
    );
}
