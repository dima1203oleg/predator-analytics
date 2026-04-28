/**
 * 🌊 MARITIME INTELLIGENCE // МО� СЬКИЙ СУВЕ� ЕН | v58.2-WRAITH
 * PREDATOR Analytics — Global Maritime Traffic & Risk Intelligence
 * 
 * Моніторинг морського трафіку, AIS-трекінг суден та аналіз портів.
 * Виявлення суден-фантомів та аномальних маршрутів у реальному часі.
 * 
 * © 2026 PREDATOR Analytics — HR-04 (100% українська)
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Anchor, Ship, Globe, AlertTriangle, Activity,
    Search, RefreshCw, Navigation, Wind, Waves, 
    ShieldAlert, Compass, Radar, Droplets, Zap,
    Target, Shield, Eye, Lock, Cpu, Database,
    TrendingUp, Clock, ChevronRight, Filter, X,
    Signal, Satellite, Map as MapIcon, Siren, RefreshCcw
} from 'lucide-react';
import ReactECharts from '@/components/ECharts';
import { apiClient } from '@/services/api/config';
import { PageTransition } from '@/components/layout/PageTransition';
import { TacticalCard } from '@/components/ui/TacticalCard';
import { ViewHeader } from '@/components/ViewHeader';
import { Badge } from '@/components/ui/badge';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
import { cn } from '@/utils/cn';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import {
    normalizePortsPayload,
    normalizeVesselsPayload,
    type Port,
    type Vessel,
} from './maritimeView.utils';

// ─── HELPER COMPONENTS ───────────────────────────────────────────────

const RiskMeter: React.FC<{ score: number; size?: 'sm' | 'md' }> = ({ score, size = 'md' }) => {
    const color = score > 80 ? '#f43f5e' : score > 60 ? '#f59e0b' : score > 40 ? '#3b82f6' : '#10b981';
    const label = score > 80 ? 'К� ИТИЧНИЙ' : score > 60 ? 'ПІДВИЩЕНИЙ' : score > 40 ? 'ПОМІ� НИЙ' : 'НИЗЬКИЙ';

    return (
        <div className="w-full space-y-2">
            <div className="flex items-center justify-between">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">� ИЗИК_ІНДЕКС_CERS</span>
                <span className="text-[9px] font-black uppercase tracking-widest" style={{ color }}>{label}</span>
            </div>
            <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${score}%` }}
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${color}40, ${color})`, boxShadow: `0 0 10px ${color}30` }}
                />
            </div>
        </div>
    );
};

const VesselCard: React.FC<{ vessel: Vessel; isSelected: boolean; onClick: () => void }> = ({ vessel, isSelected, onClick }) => {
    const riskColor = vessel.risk_score > 80 ? 'amber' : vessel.risk_score > 60 ? 'amber' : 'emerald';
    
    return (
        <motion.div
            layout
            onClick={onClick}
            className={cn(
                "group p-6 rounded-[2.5rem] border cursor-pointer transition-all duration-500 relative overflow-hidden",
                isSelected
                    ? "bg-slate-900/80 border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.15)]"
                    : "bg-black border-white/[0.04] hover:border-white/10"
            )}
        >
            <div className="flex items-start justify-between">
               <div className="flex items-center gap-5">
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center border shadow-2xl", vessel.risk_score > 80 ? "bg-amber-500/10 border-amber-500/30 text-amber-500" : "bg-cyan-500/10 border-cyan-500/30 text-cyan-500")}>
                     <Ship size={24} />
                  </div>
                  <div>
                     <h4 className="text-lg font-black text-white italic tracking-tighter uppercase leading-none group-hover:text-cyan-400 transition-colors uppercase truncate max-w-[150px]">{vessel.name}</h4>
                     <p className="text-[9px] font-black text-slate-700 uppercase italic tracking-widest">{vessel.flag} // {vessel.type}</p>
                  </div>
               </div>
               <div className="text-right">
                  <span className={cn("text-2xl font-black italic font-mono tracking-tighter", vessel.risk_score > 80 ? "text-amber-500" : "text-emerald-500")}>{vessel.risk_score}</span>
                  <p className="text-[8px] font-black text-slate-800 uppercase italic leading-none">CERS</p>
               </div>
            </div>
            <div className="mt-6 pt-6 border-t border-white/[0.04] flex items-center justify-between">
               <div className="flex items-center gap-2">
                  <Navigation size={12} className="text-slate-700" />
                  <span className="text-[9px] font-black text-slate-400 italic uppercase truncate max-w-[100px]">{vessel.destination || '??'}</span>
               </div>
               <div className="flex items-center gap-3">
                  <span className="text-[9px] font-black font-mono text-cyan-600">{vessel.speed || '0.0'} KN</span>
                  <div className={cn("w-2 h-2 rounded-full", vessel.risk_score > 80 ? "bg-amber-500 animate-pulse" : "bg-emerald-500")} />
               </div>
            </div>
        </motion.div>
    );
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────

export default function MaritimeView() {
    const [vessels, setVessels] = useState<Vessel[]>([]);
    const [ports, setPorts] = useState<Port[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedVessel, setSelectedVessel] = useState<Vessel | null>(null);
    const [filterMode, setFilterMode] = useState<'all' | 'high_risk' | 'phantom'>('all');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [vesselsRes, portsRes] = await Promise.allSettled([
                apiClient.get('/maritime/vessels'),
                apiClient.get('/maritime/ports'),
            ]);
            if (vesselsRes.status === 'fulfilled') setVessels(normalizeVesselsPayload(vesselsRes.value.data));
            if (portsRes.status === 'fulfilled') setPorts(normalizePortsPayload(portsRes.value.data));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 60000);
        return () => clearInterval(interval);
    }, [fetchData]);

    const filteredVessels = useMemo(() => {
        let list = vessels;
        if (filterMode === 'high_risk') list = list.filter(v => v.risk_score > 70);
        if (filterMode === 'phantom') list = list.filter(v => !v.imo || v.risk_score > 85);
        return list.sort((a, b) => b.risk_score - a.risk_score);
    }, [vessels, filterMode]);

    const mapOptions = useMemo(() => ({
        backgroundColor: 'transparent',
        geo: {
            map: 'world',
            roam: true,
            emphasis: { label: { show: false }, itemStyle: { areaColor: '#0a101f' } },
            itemStyle: {
                areaColor: 'rgba(2, 6, 23, 0.9)',
                borderColor: 'rgba(14, 165, 233, 0.1)',
                borderWidth: 1
            }
        },
        series: [
            {
                name: 'Vessels',
                type: 'effectScatter',
                coordinateSystem: 'geo',
                data: filteredVessels.map(v => ({
                    name: v.name,
                    value: [v.location.lon, v.location.lat, v.risk_score],
                    itemStyle: { color: v.risk_score > 70 ? '#f43f5e' : '#0ea5e9' }
                })),
                symbolSize: (val: any) => 6 + (val[2] / 15),
                rippleEffect: { brushType: 'stroke', scale: 3, period: 4 },
                zlevel: 5
            }
        ]
    }), [filteredVessels]);

    return (
        <PageTransition>
            <div className="min-h-screen bg-[#020617] text-slate-200 relative overflow-hidden font-sans pb-32">
                <AdvancedBackground />
                <CyberGrid color="rgba(14, 165, 233, 0.03)" />

                <div className="relative z-10 max-w-[1780px] mx-auto p-4 sm:p-12 space-y-12">
                   
                   {/* HEADER HUD */}
                   <ViewHeader
                     title={
                       <div className="flex items-center gap-10">
                          <div className="relative group">
                             <div className="absolute inset-0 bg-blue-600/20 blur-3xl rounded-full scale-150 animate-pulse" />
                             <div className="relative p-7 bg-black border border-blue-900/40 rounded-[2.5rem] shadow-2xl">
                                <Navigation size={42} className="text-blue-500 shadow-[0_0_15px_rgba(14,165,233,0.5)]" />
                             </div>
                          </div>
                          <div className="space-y-2">
                             <div className="flex items-center gap-3">
                                <span className="badge-v2 bg-blue-600/10 border border-blue-600/20 text-blue-500 px-3 py-1 text-[10px] font-black tracking-[0.3em] uppercase italic">
                                  MARITIME_SOVEREIGN // GLOBAL_AIS_NET
                                </span>
                                <div className="h-px w-10 bg-blue-600/20" />
                                <span className="text-[10px] font-black text-slate-700 font-mono tracking-widest uppercase italic">v58.2-WRAITH</span>
                             </div>
                             <h1 className="text-6xl font-black text-white tracking-tighter uppercase italic skew-x-[-2deg] leading-none mb-1">
                               МО� СЬКИЙ <span className="text-blue-500 underline decoration-blue-600/20 decoration-8 italic uppercase">СУВЕ� ЕН</span>
                             </h1>
                             <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.4em] italic opacity-80 leading-none">
                                МОНІТО� ИНГ ГЛОБАЛЬНОГО Т� АФІКУ ТА САНКЦІЙНОГО ФЛОТУ
                             </p>
                          </div>
                       </div>
                     }
                     stats={[
                       { label: 'АКТИВНІ_СУДНА', value: String(vessels.length), icon: <Ship size={14} />, color: 'primary' },
                       { label: 'К� ИТИЧНИЙ_� ИЗИК', value: String(vessels.filter(v => v.risk_score > 80).length), icon: <Siren size={14} />, color: 'danger', animate: true },
                       { label: 'ПО� ТИ_В_� ОБОТІ', value: String(ports.length), icon: <Anchor size={14} />, color: 'success' }
                     ]}
                     actions={
                       <div className="flex gap-4">
                          <button onClick={fetchData} className={cn("p-5 bg-black border border-white/[0.04] rounded-2xl text-slate-400 hover:text-white transition-all shadow-xl", loading && "animate-spin")}>
                             <RefreshCcw size={24} />
                          </button>
                          <button className="px-8 py-5 bg-blue-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] italic hover:bg-blue-600 shadow-2xl transition-all flex items-center gap-4">
                             <Radar size={18} /> СКАНУВАТИ_АКВАТО� ІЮ
                          </button>
                       </div>
                     }
                   />

                   <div className="grid grid-cols-12 gap-10">
                      
                      {/* FLEET LIST */}
                      <div className="col-span-12 xl:col-span-4 space-y-8">
                         <div className="flex gap-4 p-2 bg-black/60 border border-white/[0.03] rounded-3xl">
                            {(['all', 'high_risk', 'phantom'] as const).map(m => (
                              <button key={m} onClick={() => setFilterMode(m)} className={cn("flex-1 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all", filterMode === m ? "bg-blue-600 text-white border-blue-400 shadow-2xl" : "bg-transparent text-slate-500 border-transparent")}>
                                {m === 'all' ? 'УВЕСЬ_ФЛОТ' : m === 'high_risk' ? '� ИЗИК' : 'ФАНТОМИ'}
                              </button>
                            ))}
                         </div>
                         <div className="space-y-4 max-h-[700px] overflow-y-auto no-scrollbar pr-2">
                            {filteredVessels.map(v => (
                              <VesselCard key={v.id} vessel={v} isSelected={selectedVessel?.id === v.id} onClick={() => setSelectedVessel(v)} />
                            ))}
                         </div>
                      </div>

                      {/* MAP AND PORT DETAILS */}
                      <div className="col-span-12 xl:col-span-8 space-y-10">
                         <div className="p-8 rounded-[4rem] bg-black border-2 border-white/[0.04] shadow-3xl h-[550px] relative overflow-hidden group">
                             <div className="absolute top-8 left-8 z-20 flex gap-4">
                                <div className="bg-black/80 backdrop-blur-2xl px-6 py-3 border border-white/5 rounded-2xl flex items-center gap-4">
                                   <Radar size={18} className="text-blue-500 animate-spin-slow" />
                                   <span className="text-[10px] font-black text-white italic tracking-[0.3em]">AIS_VECTOR_PROJECTION</span>
                                </div>
                             </div>
                             <ReactECharts option={mapOptions} style={{ height: '100%', width: '100%' }} />
                         </div>

                         <AnimatePresence mode="wait">
                            {selectedVessel ? (
                              <motion.div key={selectedVessel.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-10 rounded-[4rem] bg-black border-2 border-blue-500/20 shadow-3xl space-y-10 relative overflow-hidden">
                                 <div className="absolute top-0 right-0 p-10 opacity-5"><Ship size={200} className="text-blue-500" /></div>
                                 <div className="flex items-center justify-between border-b border-white/[0.04] pb-8 relative z-10">
                                    <div className="space-y-1">
                                       <h3 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none truncate max-w-[400px]">{selectedVessel.name}</h3>
                                       <p className="text-[10px] font-black text-slate-700 uppercase italic tracking-widest">OWNER_PROFILE // SANCTIONS_CHECK_READY</p>
                                    </div>
                                    <button onClick={() => setSelectedVessel(null)} className="p-4 bg-white/5 rounded-xl hover:bg-amber-500 hover:text-white transition-all"><X size={24} /></button>
                                 </div>
                                 <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
                                    {[
                                      { l: 'MMSI', v: selectedVessel.mmsi || 'N/A', i: Signal },
                                      { l: 'IMO', v: selectedVessel.imo || 'N/A', i: Database },
                                      { l: 'П� АПО� ', v: selectedVessel.flag, i: Globe },
                                      { l: 'ETA_DEST', v: selectedVessel.destination || '??', i: Navigation },
                                    ].map((d, i) => (
                                      <div key={i} className="p-6 bg-white/[0.01] border border-white/[0.04] rounded-2xl space-y-1 group hover:border-blue-500/30 transition-all">
                                         <p className="text-[8px] font-black text-slate-700 uppercase italic tracking-widest flex items-center gap-2">
                                            <d.i size={12} className="text-blue-500" /> {d.l}
                                         </p>
                                         <p className="text-lg font-black text-white italic truncate">{d.v}</p>
                                      </div>
                                    ))}
                                 </div>
                                 <div className="relative z-10">
                                    <RiskMeter score={selectedVessel.risk_score} />
                                 </div>
                              </motion.div>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                 {ports.slice(0, 4).map(p => (
                                   <div key={p.id} className="p-8 rounded-[3.5rem] bg-black border border-white/[0.04] shadow-3xl flex items-center justify-between group hover:border-blue-500/30 transition-all">
                                      <div className="flex items-center gap-6">
                                         <div className="w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-600/30 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                                            <Anchor size={32} />
                                         </div>
                                         <div>
                                            <h4 className="text-xl font-black text-white italic uppercase leading-none">{p.name}</h4>
                                            <p className="text-[10px] font-black text-slate-700 uppercase italic mt-1">{p.country}</p>
                                         </div>
                                      </div>
                                      <div className="text-right">
                                         <p className="text-2xl font-black text-white italic font-mono tracking-tighter">{p.vessel_count}</p>
                                         <p className="text-[8px] font-black text-slate-800 uppercase italic">SHIPS_IN_PORT</p>
                                      </div>
                                   </div>
                                 ))}
                              </div>
                            )}
                         </AnimatePresence>
                      </div>

                   </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .shadow-3xl { box-shadow: 0 60px 100px -30px rgba(0,0,0,0.8); }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .animate-spin-slow { animation: spin 8s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}} />
        </PageTransition>
    );
}
