/**
 * 📡 CONVERSATION INTEL // СИГНАЛЬНИЙ ДЕКОДЕР | v56.2-TITAN
 * PREDATOR Analytics — Neural Signal Decoding & OSINT
 * 
 * Моніторинг Telegram каналів, ЗМІ, соцмереж та даркнет-форумів.
 * Виявлення прихованих наративів, дезінформації та сигналів впливу в реальному часі.
 * 
 * © 2026 PREDATOR Analytics — HR-04 (100% українська)
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Radio, MessageCircle, TrendingUp, TrendingDown, Search, 
    Filter, Download, Eye, AlertTriangle, Users, Globe, 
    Flame, Activity, Clock, ChevronRight, Newspaper, Hash, 
    Target, Zap, RefreshCw, BarChart3, Star, ArrowUpRight, 
    Shield, Lock, Siren, Radar, RefreshCcw, Layout, FileText,
    Signal, MessageSquare, Satellite, Fingerprint, Scan, Box
} from 'lucide-react';
import ReactECharts from '@/components/ECharts';
import { cn } from '@/lib/utils';
import { PageTransition } from '@/components/layout/PageTransition';
import { TacticalCard } from '@/components/TacticalCard';
import { ViewHeader } from '@/components/ViewHeader';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
import { CyberOrb } from '@/components/CyberOrb';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/services/api/config';
import { useQuery } from '@tanstack/react-query';

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
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  risk_score?: number;
  isDisinfo: boolean;
  original_text?: string;
  summary?: string;
}

// ─── MOCK DATA ────────────────────────────────────────────────────────

const MESSAGES: Message[] = [
  {
    id: 'msg-001', channel: '@legitimniy', platform: 'telegram',
    text: 'Підприємство АГРО-ЛІДЕР ГРУП отримало $47M з держбюджету. Власники — в Дубаї. Ткаченко підтверджує.',
    time: '04:18', views: '142K', sentiment: 'negative',
    entities: ['АГРО-ЛІДЕР ГРУП', 'Ткаченко В.М.', 'Дубай'],
    riskLevel: 'critical', isDisinfo: false,
  },
  {
    id: 'msg-002', channel: '@rezident_ua', platform: 'telegram',
    text: 'НАБУ відкрило справу проти замміністра *** результати вже в нашому каналі, деталі нижче.',
    time: '03:47', views: '89K', sentiment: 'negative',
    entities: ['НАБУ', 'Заст. міністра'],
    riskLevel: 'high', isDisinfo: false,
  },
  {
    id: 'msg-003', channel: '@dark_ua_intel', platform: 'forum',
    text: 'ЗЛИВ: база даних рахунків ПАТ "КАРГО-ТРАНС". 847 транзакцій на $22M. Архів доступний.',
    time: '03:12', views: '12K', sentiment: 'negative',
    entities: ['КАРГО-ТРАНС', 'База даних'],
    riskLevel: 'critical', isDisinfo: false,
  }
];

// ─── MAIN COMPONENT ──────────────────────────────────────────────────

export default function ConversationIntelView() {
    const [activeTab, setActiveTab] = useState<'feed' | 'analytics' | 'risk'>('feed');
    const [liveCount, setLiveCount] = useState(8234);

    const { data: messages = [], isLoading } = useQuery({
        queryKey: ['telegram-feed'],
        queryFn: async () => {
            const res = await apiClient.get('/telegram/feed');
            return Array.isArray(res.data) ? res.data : [];
        },
        refetchInterval: 10000 // Refresh every 10s
    });

    useEffect(() => {
        const id = setInterval(() => setLiveCount(c => c + Math.floor(Math.random() * 5)), 3000);
        return () => clearInterval(id);
    }, []);

    const chartOption = useMemo(() => ({
        backgroundColor: 'transparent',
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { top: 10, left: 10, right: 10, bottom: 10, containLabel: true },
        xAxis: { type: 'category', data: ['00', '04', '08', '12', '16', '20'], axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: '#475569', fontSize: 10 } },
        yAxis: { type: 'value', splitLine: { lineStyle: { color: 'rgba(255,255,255,0.03)' } }, axisLabel: { show: false } },
        series: [
            {
                name: 'Pubs',
                type: 'line',
                smooth: true,
                symbol: 'none',
                lineStyle: { color: '#0ea5e9', width: 2 },
                areaStyle: { color: 'rgba(14, 165, 233, 0.1)' },
                data: [120, 240, 450, 320, 580, 420]
            }
        ]
    }), []);

    return (
        <PageTransition>
            <div className="min-h-screen bg-[#020617] text-slate-200 relative overflow-hidden font-sans pb-32">
                <AdvancedBackground />
                <CyberGrid color="rgba(14, 165, 233, 0.03)" />

                <div className="relative z-10 max-w-[1780px] mx-auto p-4 sm:p-12 space-y-12">
                   
                   <ViewHeader
                     title={
                       <div className="flex items-center gap-10">
                          <div className="relative group">
                             <div className="absolute inset-0 bg-sky-600/20 blur-3xl rounded-full scale-150 animate-pulse" />
                             <div className="relative p-7 bg-black border border-sky-900/40 rounded-[2.5rem] shadow-2xl">
                                <Radio size={42} className="text-sky-500 shadow-[0_0_15px_rgba(14,165,233,0.5)]" />
                             </div>
                          </div>
                          <div className="space-y-2">
                             <div className="flex items-center gap-3">
                                <span className="badge-v2 bg-sky-600/10 border border-sky-600/20 text-sky-500 px-3 py-1 text-[10px] font-black tracking-[0.3em] uppercase italic">
                                  SIGNAL_DECODER // NEURAL_OSINT
                                </span>
                                <div className="h-px w-10 bg-sky-600/20" />
                                <span className="text-[10px] font-black text-slate-700 font-mono tracking-widest uppercase italic">v56.2 TITAN</span>
                             </div>
                             <h1 className="text-6xl font-black text-white tracking-tighter uppercase italic skew-x-[-2deg] leading-none mb-1">
                               СИГНАЛЬНИЙ <span className="text-sky-500 underline decoration-sky-600/20 decoration-8 italic uppercase">ДЕКОДЕР</span>
                             </h1>
                             <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.4em] italic opacity-80 leading-none">
                                МОНІТОРИНГ ТЕЛЕГРАМ-КАНАЛІВ, ЗМІ ТА ДАРКНЕТ-ФОРУМІВ
                             </p>
                          </div>
                       </div>
                     }
                     stats={[
                       { label: 'АКТИВНІ_ДЖЕРЕЛА', value: '428', icon: <Satellite size={14} />, color: 'primary' },
                       { label: 'ДЕТЕКТОВАНО_ФЕЙКІВ', value: '12', icon: <Shield size={14} />, color: 'warning' },
                       { label: 'СИГНАЛІВ_ЗА_ДОБУ', value: liveCount.toLocaleString(), icon: <Activity size={14} />, color: 'success' }
                     ]}
                     actions={
                       <div className="flex gap-4">
                          <button className="p-5 bg-black border border-white/[0.04] rounded-2xl text-slate-400 hover:text-white transition-all shadow-xl">
                             <RefreshCcw size={24} />
                          </button>
                          <button className="px-8 py-5 bg-sky-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] italic hover:bg-sky-600 shadow-2xl transition-all flex items-center gap-4">
                             <Satellite size={18} /> ЗАПУСТИТИ_ПЕРЕХОПЛЕННЯ
                          </button>
                       </div>
                     }
                   />

                   <div className="grid grid-cols-12 gap-10">
                      
                      {/* LIVE FEED LIST */}
                      <div className="col-span-12 xl:col-span-7 space-y-8">
                         <div className="flex gap-4 p-2 bg-black/60 border border-white/[0.03] rounded-3xl">
                            {(['feed', 'analytics', 'risk'] as const).map(tab => (
                              <button key={tab} onClick={() => setActiveTab(tab)} className={cn("flex-1 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all", activeTab === tab ? "bg-sky-600 text-white border-sky-400 shadow-2xl" : "bg-transparent text-slate-500 border-transparent")}>
                                {tab === 'feed' ? 'LIVE_ПОТІК' : tab === 'analytics' ? 'АНАЛІТИКА' : 'РИЗИК_СИГНАЛИ'}
                              </button>
                            ))}
                         </div>

                         <div className="space-y-4 max-h-[800px] overflow-y-auto no-scrollbar pr-2">
                            {isLoading ? (
                                <div className="p-20 text-center animate-pulse">
                                    <Satellite size={48} className="mx-auto text-sky-500/20 mb-4" />
                                    <p className="text-[10px] font-black uppercase text-slate-700 tracking-[0.4em]">INITIATING_SIGNAL_ACQUISITION...</p>
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="p-20 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
                                    <AlertTriangle size={32} className="mx-auto text-slate-800 mb-4" />
                                    <p className="text-[10px] font-black uppercase text-slate-700 tracking-[0.4em]">NO_ACTUAL_SIGNALS_DECODED</p>
                                </div>
                            ) : messages.map((msg: Message, i: number) => (
                               <motion.div key={msg.id || i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className={cn("p-8 rounded-[3rem] bg-black border-2 border-white/[0.04] hover:border-sky-500/40 transition-all group space-y-5 relative overflow-hidden", (msg.risk_score || 0) > 70 ? 'border-rose-900/10' : '')}>
                                 <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                       <div className="w-10 h-10 rounded-xl bg-sky-600/10 border border-sky-600/30 flex items-center justify-center text-sky-500">
                                          {msg.platform === 'telegram' ? <MessageCircle size={20} /> : <Globe size={20} />}
                                       </div>
                                       <div>
                                          <p className="text-sm font-black text-sky-400 uppercase italic leading-none">{msg.channel}</p>
                                          <p className="text-[10px] font-black text-slate-700 uppercase italic mt-1">{msg.time} // {msg.views} VIEWS</p>
                                       </div>
                                    </div>
                                    {msg.riskLevel === 'critical' && <Badge className="bg-rose-600/20 text-rose-500 border-rose-500/30 uppercase italic font-black">КРИТИЧНА_ЗАГРОЗА</Badge>}
                                 </div>
                                 <p className="text-lg font-black text-white italic leading-relaxed group-hover:text-sky-300 transition-colors uppercase">
                                    {msg.text || msg.original_text || msg.summary}
                                 </p>
                                 <div className="flex flex-wrap gap-3 pt-4 border-t border-white/[0.03]">
                                    {msg.entities.map((e, j) => (
                                      <span key={j} className="text-[9px] font-black px-3 py-1 bg-white/[0.02] border border-white/[0.05] text-slate-500 uppercase tracking-widest">#{e.replace(/\s/g, '_')}</span>
                                    ))}
                                 </div>
                              </motion.div>
                            ))}
                         </div>
                      </div>

                      {/* SIDE ANALYTICS */}
                      <div className="col-span-12 xl:col-span-5 space-y-10">
                         <section className="p-10 rounded-[4rem] bg-black border-2 border-white/[0.04] shadow-3xl space-y-10 relative overflow-hidden group">
                             <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none group-hover:scale-110 transition-transform duration-[3s]">
                                <Satellite size={300} className="text-sky-500" />
                             </div>
                             <h3 className="text-[12px] font-black text-sky-500 uppercase tracking-[0.4em] italic flex items-center gap-4">
                                <Activity size={18} /> ДИНАМІКА_МЕДІА_ПОЛЯ
                             </h3>
                             <div className="h-[200px]">
                                <ReactECharts option={chartOption} style={{ height: '100%', width: '100%' }} />
                             </div>
                             <div className="grid grid-cols-2 gap-6">
                                <div className="p-6 bg-white/[0.02] border border-white/[0.04] rounded-3xl space-y-2">
                                   <p className="text-[9px] font-black text-slate-700 uppercase italic tracking-widest">SENTIMENT_AVG</p>
                                   <p className="text-2xl font-black text-rose-500 italic font-mono">-42% NEG</p>
                                </div>
                                <div className="p-6 bg-white/[0.02] border border-white/[0.04] rounded-3xl space-y-2">
                                   <p className="text-[9px] font-black text-slate-700 uppercase italic tracking-widest">DETECTION_SPD</p>
                                   <p className="text-2xl font-black text-emerald-500 italic font-mono">0.42s</p>
                                </div>
                             </div>
                         </section>

                         <section className="p-10 rounded-[4rem] bg-black border border-white/[0.04] shadow-3xl space-y-8 relative overflow-hidden">
                             <h3 className="text-[12px] font-black text-slate-700 uppercase tracking-[0.4em] italic mb-6 flex items-center gap-4">
                                <Hash size={18} /> ТОП_НАРАТИВИ_24г
                             </h3>
                             <div className="space-y-4">
                                {[
                                  { topic: 'ОФШОРНІ_СХЕМИ', count: 1240, risk: 'high' },
                                  { topic: 'ТИТАНОВИЙ_ЛОБІЗМ', count: 890, risk: 'critical' },
                                  { topic: 'РЕЗЕРВ_КАРГО', count: 678, risk: 'medium' }
                                ].map((t, i) => (
                                  <div key={i} className="flex items-center justify-between p-6 bg-white/[0.01] border border-white/[0.04] rounded-3xl hover:border-sky-500/30 transition-all">
                                     <div className="flex items-center gap-4">
                                        <div className={cn("w-2 h-2 rounded-full", t.risk === 'critical' ? 'bg-rose-500 animate-pulse' : t.risk === 'high' ? 'bg-amber-500' : 'bg-sky-500')} />
                                        <span className="text-[13px] font-black text-white italic tracking-tighter">{t.topic}</span>
                                     </div>
                                     <span className="text-[10px] font-black text-slate-700 font-mono tracking-widest">{t.count} SIGS</span>
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
                .no-scrollbar::-webkit-scrollbar { display: none; }
            `}} />
        </PageTransition>
    );
}
