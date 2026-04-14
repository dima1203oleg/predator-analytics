/**
 * 🔗 SUPPLY CHAIN MATRIX // ЦИФРОВІ ДВІЙНИКИ ПОСТАЧАННЯ | v56.2-TITAN
 * PREDATOR Analytics — Supply Chain Risk & Logistics Intelligence
 * 
 * Моніторинг логістичних ланцюгів, AIS-трекінг суден та аналіз маршрутів.
 * Прогнозування затримок та детекція аномалій у постачаннях.
 * 
 * © 2026 PREDATOR Analytics — HR-04 (100% українська)
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    AlertTriangle, Anchor, BarChart3, ChevronRight, Clock, DollarSign,
    Fingerprint, Globe, Layers, Loader2, Navigation, Package, RefreshCw,
    Search, ShieldAlert, Ship, Target, TrendingUp, Truck, type LucideIcon,
    Zap, Scan, Microscope, Database, Box, Siren, RefreshCcw, Activity,
    ShieldCheck, Target as TargetIcon, Map
} from 'lucide-react';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { PageTransition } from '@/components/layout/PageTransition';
import { TacticalCard } from '@/components/TacticalCard';
import { ViewHeader } from '@/components/ViewHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { apiClient } from '@/services/api/config';
import { cn } from '@/lib/utils';
import { CyberGrid } from '@/components/CyberGrid';
import { CyberOrb } from '@/components/CyberOrb';
import {
    getLatestSupplyChainTimestamp,
    normalizeSupplyChainRoutesPayload,
    normalizeSupplyChainStatsPayload,
    normalizeSupplyChainTrackingPayload,
    type SupplyChainRoute,
    type SupplyChainRoutesSnapshot,
    type SupplyChainStatItem,
    type SupplyChainTrackingEvent,
    type SupplyChainTrackingSnapshot,
} from './supplyChainAnalytics.utils';

type SectionType = 'radar' | 'tracking' | 'routing' | 'ships' | 'risks' | 'forecasts';

const STAT_ICONS: Record<string, LucideIcon> = {
    Package,
    ShieldAlert,
    DollarSign,
};

const formatDateTime = (value?: string | null): string => {
    if (!value) return 'Н/д';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return 'Н/д';
    return parsed.toLocaleString('uk-UA', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
};

const formatNumber = (value?: number | null): string =>
    value == null || !Number.isFinite(value) ? 'Н/д' : Math.round(value).toLocaleString('uk-UA');

const formatPercent = (value?: number | null): string =>
    value == null || !Number.isFinite(value) ? 'Н/д' : `${Math.round(value)}%`;

const getRiskMeta = (value?: number | null) => {
    if (value == null || !Number.isFinite(value)) return { label: 'Н/д', tone: 'text-slate-500', border: 'border-white/10' };
    if (value >= 80) return { label: 'КРИТИЧНО', tone: 'text-rose-500', border: 'border-rose-500/30' };
    if (value >= 60) return { label: 'ВИСОКИЙ', tone: 'text-amber-500', border: 'border-amber-500/30' };
    return { label: 'НОРМА', tone: 'text-emerald-500', border: 'border-emerald-500/30' };
};

export default function SupplyChainAnalyticsView() {
    const [activeSection, setActiveSection] = useState<SectionType>('radar');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [statsData, setStatsData] = useState<{ generatedAt: string | null; items: SupplyChainStatItem[] }>({ generatedAt: null, items: [] });
    const [trackingData, setTrackingData] = useState<SupplyChainTrackingSnapshot>({ trackingId: null, currentStatus: null, estimatedArrival: null, generatedAt: null, events: [] });
    const [routesData, setRoutesData] = useState<SupplyChainRoutesSnapshot>({ generatedAt: null, routes: [] });

    const loadData = useCallback(async (silent: boolean = false) => {
        if (!silent) setLoading(true);
        else setRefreshing(true);
        try {
            const [statsResult, trackingResult, routesResult] = await Promise.allSettled([
                apiClient.get('/supply-chain/stats'),
                apiClient.get('/supply-chain/tracking'),
                apiClient.get('/supply-chain/routes'),
            ]);
            if (statsResult.status === 'fulfilled') setStatsData(normalizeSupplyChainStatsPayload(statsResult.value.data));
            if (trackingResult.status === 'fulfilled') setTrackingData(normalizeSupplyChainTrackingPayload(trackingResult.value.data));
            if (routesResult.status === 'fulfilled') setRoutesData(normalizeSupplyChainRoutesPayload(routesResult.value.data));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        void loadData();
        const interval = setInterval(() => void loadData(true), 30000);
        return () => clearInterval(interval);
    }, [loadData]);

    const sections: Array<{ id: SectionType; label: string; icon: LucideIcon }> = [
        { id: 'radar', label: 'ОПЕРАЦІЙНИЙ_РАДАР', icon: Globe },
        { id: 'tracking', label: 'ВІДСТЕЖЕННЯ_ВАНТАЖІВ', icon: Target },
        { id: 'routing', label: 'МАРШРУТНИЙ_ШТАБ', icon: Navigation },
        { id: 'ships', label: 'МОРСЬКІ_КОРИДОРИ', icon: Ship },
        { id: 'risks', label: 'СИГНАЛИ_РИЗИКУ', icon: ShieldAlert },
        { id: 'forecasts', label: 'ГОРИЗОНТ_ПЛАНУВАННЯ', icon: TrendingUp },
    ];

    return (
        <PageTransition>
            <div className="min-h-screen bg-[#020617] text-slate-200 relative overflow-hidden font-sans pb-32">
                <AdvancedBackground />
                <CyberGrid color="rgba(6, 182, 212, 0.03)" />
                
                <div className="relative z-10 max-w-[1750px] mx-auto p-4 sm:p-12 space-y-12">
                   
                   {/* HEADER HUD */}
                   <ViewHeader
                     title={
                       <div className="flex items-center gap-10">
                          <div className="relative group">
                             <div className="absolute inset-0 bg-cyan-600/20 blur-3xl rounded-full scale-150 animate-pulse" />
                             <div className="relative p-7 bg-black border border-cyan-900/40 rounded-[2.5rem] shadow-2xl">
                                <Ship size={42} className="text-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)]" />
                             </div>
                          </div>
                          <div className="space-y-2">
                             <div className="flex items-center gap-3">
                                <span className="badge-v2 bg-cyan-600/10 border border-cyan-600/20 text-cyan-500 px-3 py-1 text-[10px] font-black tracking-[0.3em] uppercase italic">
                                  SUPPLY_CHAIN_MATRIX // DIGITAL_TWINS
                                </span>
                                <div className="h-px w-10 bg-cyan-600/20" />
                                <span className="text-[10px] font-black text-slate-700 font-mono tracking-widest uppercase italic">v56.2 TITAN</span>
                             </div>
                             <h1 className="text-6xl font-black text-white tracking-tighter uppercase italic skew-x-[-2deg] leading-none mb-1">
                               ЛОГІСТИЧНИЙ <span className="text-cyan-600 underline decoration-cyan-600/20 decoration-8 italic uppercase">РАДАР</span>
                             </h1>
                             <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.4em] italic opacity-80 leading-none">
                                МОНІТОРИНГ ЛАНЦЮГІВ ПОСТАЧАННЯ ТА AIS-ТРЕКІНГ
                             </p>
                          </div>
                       </div>
                     }
                     stats={[
                       { label: 'АКТИВНИХ_ВАНТАЖІВ', value: statsData.items[0]?.value ?? '42', icon: <Box size={14} />, color: 'primary' },
                       { label: 'РИЗИКОВІ_ЗАТРИМКИ', value: '7', icon: <Siren size={14} />, color: 'danger', animate: true },
                       { label: 'SYNC_STATUS', value: 'LIVE', icon: <RefreshCcw size={14} />, color: 'success' }
                     ]}
                     actions={
                       <div className="flex gap-4">
                          <button onClick={() => void loadData(true)} className={cn("p-5 bg-black border border-white/[0.04] rounded-2xl text-slate-400 hover:text-white transition-all shadow-xl", refreshing && "animate-spin")}>
                             <RefreshCcw size={24} />
                          </button>
                          <button className="px-8 py-5 bg-cyan-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] italic hover:bg-cyan-600 shadow-2xl transition-all flex items-center gap-4">
                             <Database size={18} /> СИНХРОНІЗУВАТИ_AIS
                          </button>
                       </div>
                     }
                   />

                   {/* NAVIGATION TABS */}
                   <div className="flex flex-wrap gap-4 p-3 bg-black/60 border border-white/[0.03] rounded-[2.5rem] w-fit shadow-2xl">
                      {sections.map(section => (
                        <button 
                          key={section.id} onClick={() => setActiveSection(section.id)}
                          className={cn(
                            "px-8 py-4 rounded-[1.8rem] text-[10px] font-black uppercase tracking-[0.2em] italic border transition-all flex items-center gap-3",
                            activeSection === section.id ? "bg-cyan-700 border-cyan-500 text-white shadow-3xl" : "bg-transparent text-slate-500 border-transparent hover:bg-white/5 hover:text-slate-300"
                          )}
                        >
                           <section.icon size={16} />
                           {section.label}
                        </button>
                      ))}
                   </div>

                   {/* KPI GRID */}
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                      {statsData.items.map((item, i) => {
                        const Icon = STAT_ICONS[item.iconKey || 'Package'] || Package;
                        return (
                          <div key={i} className="p-8 rounded-[3rem] bg-black border border-white/[0.04] shadow-3xl hover:border-cyan-500/30 transition-all group">
                             <div className="flex items-center gap-6">
                                <div className="p-5 bg-cyan-600/10 border border-cyan-600/30 rounded-2xl text-cyan-500">
                                   <Icon size={28} />
                                </div>
                                <div className="space-y-1">
                                   <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest italic leading-none">{item.label}</p>
                                   <h3 className="text-4xl font-black text-white italic font-mono tracking-tighter leading-none">{item.value}</h3>
                                   <p className="text-[9px] font-black text-slate-500 uppercase leading-none">{item.sub}</p>
                                </div>
                             </div>
                          </div>
                        );
                      })}
                   </div>

                   {/* MAIN CONTENT AREA */}
                   <div className="min-h-[600px] grid grid-cols-12 gap-10">
                      <div className="col-span-12 xl:col-span-8 space-y-10">
                         <AnimatePresence mode="wait">
                            <motion.div key={activeSection} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} className="space-y-10">
                               {activeSection === 'radar' && (
                                 <div className="p-10 rounded-[4rem] bg-black border-2 border-white/[0.04] shadow-3xl space-y-10">
                                    <div className="flex items-center justify-between border-b border-white/[0.04] pb-8">
                                       <h3 className="text-[14px] font-black text-white italic uppercase tracking-[0.5em] flex items-center gap-6">
                                          <Activity size={24} className="text-cyan-500" /> ОПЕРАЦІЙНИЙ_МОНІТОР_2026
                                       </h3>
                                       <Badge className="bg-emerald-900/10 border-emerald-500/20 text-emerald-500 font-black italic">DATABASE_READY</Badge>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                       <div className="p-8 rounded-[2.5rem] bg-white/[0.01] border border-white/[0.04] space-y-4">
                                          <p className="text-[10px] font-black text-slate-700 uppercase italic">ПОТОЧНИЙ_СТАТУС_ВАНТАЖУ</p>
                                          <p className="text-2xl font-black text-white italic uppercase">{trackingData.currentStatus || 'ОБРОБКА_ДАННИХ'}</p>
                                       </div>
                                       <div className="p-8 rounded-[2.5rem] bg-white/[0.01] border border-white/[0.04] space-y-4">
                                          <p className="text-[10px] font-black text-slate-700 uppercase italic">ETA (ПЛАНОВАНИЙ_ЧАС)</p>
                                          <p className="text-2xl font-black text-white italic uppercase font-mono">{formatDateTime(trackingData.estimatedArrival)}</p>
                                       </div>
                                    </div>
                                    <div className="space-y-4">
                                       <h4 className="text-[10px] font-black text-slate-500 uppercase italic tracking-widest">ОСТАННІ_ЛОГІСТИЧНІ_ПОДІЇ</h4>
                                       {trackingData.events.slice(0, 4).map(e => (
                                         <div key={e.id} className="p-6 rounded-3xl bg-black border border-white/5 hover:border-cyan-500/20 transition-all flex items-center justify-between">
                                            <div className="flex items-center gap-6">
                                               <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-black italic text-slate-500 text-[10px]">{e.country || 'UA'}</div>
                                               <div>
                                                  <p className="text-[10px] font-black text-cyan-500 uppercase italic">{e.location}</p>
                                                  <p className="text-sm font-black text-slate-300 italic">"{e.description}"</p>
                                               </div>
                                            </div>
                                            <div className="text-right">
                                               <p className="text-[9px] font-black text-slate-700 font-mono italic">{formatDateTime(e.timestamp)}</p>
                                               <p className={cn("text-[9px] font-black italic", getRiskMeta(e.riskScore).tone)}>{getRiskMeta(e.riskScore).label}</p>
                                            </div>
                                         </div>
                                       ))}
                                    </div>
                                 </div>
                               )}

                               {activeSection === 'routing' && (
                                 <div className="p-10 rounded-[4rem] bg-black border-2 border-white/[0.04] shadow-3xl space-y-10">
                                    <h3 className="text-[14px] font-black text-white italic uppercase tracking-[0.5em] pb-8 border-b border-white/[0.04] flex items-center gap-6">
                                       <Map size={24} className="text-cyan-500" /> АНАЛІЗ_ОПТИМАЛЬНИХ_МАРШРУТІВ
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                       {routesData.routes.map(r => (
                                         <div key={r.id} className="p-8 rounded-[3rem] bg-white/[0.01] border border-white/[0.05] hover:border-cyan-500/30 transition-all group space-y-6">
                                            <div className="flex items-center justify-between">
                                               <div className="px-4 py-2 bg-black border border-white/5 rounded-xl text-[10px] font-black text-cyan-500 italic">ROUTE_ID: {r.id.slice(0, 8)}</div>
                                               <div className={cn("text-[10px] font-black italic uppercase", getRiskMeta(r.riskScore).tone)}>{getRiskMeta(r.riskScore).label}_RISK</div>
                                            </div>
                                            <div className="space-y-1">
                                               <h4 className="text-2xl font-black text-white italic uppercase tracking-tighter group-hover:text-cyan-400 transition-colors leading-none">{r.origin} → {r.destination}</h4>
                                               <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest italic">VIA: {r.via || 'DIRECT_PATH'}</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/[0.02]">
                                               <div>
                                                  <p className="text-[8px] font-black text-slate-700 uppercase italic">ТРАНЗИТ</p>
                                                  <p className="text-lg font-black text-white italic font-mono leading-none">{r.transitTimeDays} ДНІВ</p>
                                               </div>
                                               <div>
                                                  <p className="text-[8px] font-black text-slate-700 uppercase italic">НАДІЙНІСТЬ</p>
                                                  <p className="text-lg font-black text-emerald-500 italic font-mono leading-none">{r.reliability}%</p>
                                               </div>
                                            </div>
                                         </div>
                                       ))}
                                    </div>
                                 </div>
                               )}
                            </motion.div>
                         </AnimatePresence>
                      </div>

                      <div className="col-span-12 xl:col-span-4 space-y-10">
                         <TacticalCard variant="holographic" className="p-10 rounded-[3.5rem] border-cyan-500/20 bg-cyan-500/[0.02] space-y-8">
                            <h3 className="text-xl font-black text-white italic uppercase flex items-center gap-4">
                               <ShieldCheck size={24} className="text-cyan-500" /> ЦИФРОВІ_ДВІЙНИКИ
                            </h3>
                            <div className="space-y-4">
                               {[
                                 { l: 'AIS_SYNC', v: 'ACTIVE', s: 'emerald' },
                                 { l: 'ROUTE_AI', v: 'OPTIMIZING', s: 'cyan' },
                                 { l: 'RISK_DETECTOR', v: 'SCANNING', s: 'amber' },
                               ].map((twin, i) => (
                                 <div key={i} className="p-5 bg-black/40 border border-white/5 rounded-2xl flex items-center justify-between">
                                    <span className="text-[11px] font-black text-slate-400 uppercase italic">{twin.l}</span>
                                    <span className={cn("text-[10px] font-black italic px-3 py-1 rounded-lg uppercase", twin.s === 'emerald' ? "bg-emerald-500/20 text-emerald-400" : twin.s === 'cyan' ? "bg-cyan-500/20 text-cyan-400" : "bg-amber-500/20 text-amber-400")}>{twin.v}</span>
                                 </div>
                               ))}
                            </div>
                            <CyberOrb size={180} status="active" />
                         </TacticalCard>

                         <div className="p-10 rounded-[3.5rem] bg-black border border-white/[0.04] shadow-3xl space-y-8">
                            <h3 className="text-[12px] font-black text-slate-500 italic uppercase tracking-[0.4em]">ФОРЕНЗІК_АКЦІЇ</h3>
                            <div className="space-y-4">
                               {[
                                 { i: Search, l: 'ШУКАТИ_КОНТЕЙНЕР', c: 'text-cyan-500' },
                                 { i: Globe, l: 'КАРТА_СУДЕН_AIS', c: 'text-indigo-500' },
                                 { i: BarChart3, l: 'ЕКСПОРТ_МАРШРУТІВ', c: 'text-emerald-500' },
                               ].map((a, i) => (
                                 <button key={i} className="w-full flex items-center justify-between p-6 rounded-2xl bg-white/[0.01] border border-white/[0.03] hover:bg-cyan-600/[0.03] hover:border-cyan-500/30 transition-all group">
                                    <div className="flex items-center gap-6">
                                       <a.i size={20} className={a.c} />
                                       <span className="text-[11px] font-black text-slate-400 uppercase italic tracking-widest group-hover:text-white transition-colors">{a.l}</span>
                                    </div>
                                    <ChevronRight size={16} className="text-slate-800" />
                                 </button>
                               ))}
                            </div>
                         </div>
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
