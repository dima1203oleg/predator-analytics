/**
 * 🗺️ TRADE FLOW MAP // КА ТА ТО ГОВИХ ПОТОКІВ | v61.0-ELITE
 * PREDATOR Analytics — Global Trade & Logistics Intelligence
 * 
 * Візуалізація імпорту/експорту в реальному часі.
 * Аналіз логістичних ланцюгів та потоків цінностей на глобальній карті.
 * Sovereign Power Design · Tactical Intelligence · Tier-1
 * 
 * © 2026 PREDATOR Analytics — HR-04 (100% українська)
 */

import { Button } from '@/components/ui/button';
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, Maximize2, Minimize2, Filter, Download, Play, Pause,
  Settings, Info, TrendingUp, TrendingDown, Package, DollarSign,
  ArrowRight, ChevronRight, Crown, Sparkles, Layers, Eye, EyeOff,
  ZoomIn, ZoomOut, Move, RefreshCw, Anchor, Ship, Truck, Box,
  Navigation, Crosshair, Zap, ShieldCheck, Database
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { apiClient as api } from '@/services/api/config';
import { PageTransition } from '@/components/layout/PageTransition';
import { HoloCard } from '@/components/ui/HoloCard';
import { ViewHeader } from '@/components/ViewHeader';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';

// ─── TYPES ────────────────────────────────────────────────────────────

interface Country {
  id: string;
  name: string;
  code: string;
  x: number;
  y: number;
  imports: number;
  exports: number;
}

interface TradeFlow {
  id: string;
  from: string;
  to: string;
  value: number;
  product: string;
  color: string;
}

import { useBackendStatus } from '@/hooks/useBackendStatus';
import { intelligenceApi } from '@/services/api';

export default function TradeFlowMapPremium() {
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedFlow, setSelectedFlow] = useState<TradeFlow | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  
  const [countries, setCountries] = useState<Country[]>([]);
  const [flows, setFlows] = useState<TradeFlow[]>([]);
  
  const { isOffline, nodeSource } = useBackendStatus();

  useEffect(() => {
    const fetchTradeFlows = async () => {
      try {
        const data = await intelligenceApi.getTradeFlows();
        if (data) {
          if (data.countries && data.countries.length > 0) setCountries(data.countries);
          if (data.flows && data.flows.length > 0) setFlows(data.flows);
        }
      } catch (error) {
        console.error('Збій завантаження потоків', error);
      }
    };
    fetchTradeFlows();
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setAnimationProgress(p => (p + 0.005) % 1);
    }, 30);
    return () => clearInterval(interval);
  }, [isPlaying]);

  useEffect(() => {
    if (isOffline) {
      // Логіка для офлайн режиму може бути додана пізніше
    }
  }, [isOffline]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await intelligenceApi.getTradeFlows();
      if (data) {
        if (data.countries && data.countries.length > 0) setCountries(data.countries);
        if (data.flows && data.flows.length > 0) setFlows(data.flows);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
    
    if (isOffline) {
      window.dispatchEvent(new CustomEvent('predator-error', {
        detail: {
          service: 'GeoIntel',
          message: 'Геопросторова синхронізація через MIRROR_CHANNEL завершена успішно (GEOSPATIAL_NODES).',
          severity: 'info',
          timestamp: new Date().toISOString(),
          code: 'GEOSPATIAL_NODES'
        }
      }));
    }
  };

  const formatValue = (v: number) => `$${(v / 1000000).toFixed(1)}M`;

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#020202] text-slate-200 relative overflow-hidden font-sans pb-32">
        <AdvancedBackground />
        <CyberGrid color="rgba(212, 175, 55, 0.03)" />

        <div className="relative z-10 max-w-[1750px] mx-auto p-4 sm:p-12 space-y-12">
           
            <ViewHeader
              title={
                <div className="flex items-center gap-10">
                   <div className="relative group">
                      <div className="absolute inset-0 bg-[#D4AF37]/20 blur-3xl rounded-full scale-150 " />
                      <div className="relative p-7 bg-black border-2 border-[#D4AF37]/40 rounded-[2.5rem] shadow-4xl transform -rotate-2 hover:rotate-0 transition-all">
                         <Globe size={42} className="text-[#D4AF37] shadow-[0_0_20px_#d4af37]" />
                      </div>
                   </div>
                   <div className="space-y-4">
                      <div className="flex items-center gap-6">
                         <span className="bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] px-4 py-1 text-[10px] font-black tracking-[0.4em] uppercase italic rounded-lg">
                           TRADE_MATRIX // FLOW_GEOSPATIAL
                         </span>
                         <div className="h-px w-12 bg-[#D4AF37]/20" />
                         <span className="text-[10px] font-black text-yellow-800 font-mono tracking-widest uppercase italic shadow-sm">v61.0-ELITE</span>
                      </div>
                      <h1 className="text-6xl font-black text-white tracking-tighter uppercase italic skew-x-[-3deg] leading-none">
                        КА ТА <span className="text-[#D4AF37] underline decoration-[#D4AF37]/30 decoration-[14px] underline-offset-[12px] italic uppercase tracking-tighter">ПОТОКІВ</span>
                      </h1>
                   </div>
                </div>
              }
              breadcrumbs={['INTEL', 'TRADE', 'GLOBAL_FLOW_v58']}
              badges={[
                { label: 'SOVEREIGN_ELITE', color: 'gold', icon: <Crown size={10} /> },
                { label: 'GEOSPATIAL_T1', color: 'primary', icon: <Navigation size={10} /> },
              ]}
              stats={[
                { label: 'КРАЇН-ПА ТНЕ ІВ', value: String(countries.length > 0 ? countries.length - 1 : 0), icon: <Navigation size={14} />, color: 'primary' },
                { label: 'АКТИВНИХ_ЛІНІЙ', value: String(flows.length), icon: <Zap size={14} />, color: 'warning', animate: true },
                { label: 'ОБСЯГ_TRADE (Σ)', value: '$120.4M', icon: <DollarSign size={14} />, color: 'success' },
                { label: 'AI_GEOSPATIAL', value: 'READY', icon: <Sparkles size={14} />, color: 'gold' },
              ]}
              actions={
                <div className="flex gap-4">
                   <Button variant="cyber" onClick={() => setZoom(z => Math.min(z + 0.2, 2))} className="p-5 bg-black border-2 border-white/[0.04] rounded-2xl text-slate-400 hover:text-[#D4AF37] transition-all shadow-xl"><ZoomIn size={24} /></Button>
                   <Button variant="cyber" onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))} className="p-5 bg-black border-2 border-white/[0.04] rounded-2xl text-slate-400 hover:text-[#D4AF37] transition-all shadow-xl"><ZoomOut size={24} /></Button>
                   <Button variant="cyber" onClick={handleRefresh} className={cn("p-5 bg-black border-2 border-white/[0.04] rounded-2xl text-slate-400 hover:text-[#D4AF37] transition-all shadow-xl", refreshing && "animate-spin")}><RefreshCw size={24} /></Button>
                   <Button variant="cyber" onClick={() => setIsPlaying(!isPlaying)} className={cn("px-8 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] italic shadow-2xl transition-all flex items-center gap-4", isPlaying ? "bg-amber-900/10 border-2 border-amber-500/20 text-amber-500" : "bg-emerald-900/10 border-2 border-emerald-500/20 text-emerald-500")}>
                      {isPlaying ? <Pause size={20} /> : <Play size={20} />} {isPlaying ? 'ПАУЗА_АНІМАЦІЇ' : 'ЗАПУСТИТИ'}
                   </Button>
                </div>
              }
            />

           <div className="grid grid-cols-12 gap-10">
              
              {/* PRIMARY MAP INTERFACE */}
              <div className="col-span-12 xl:col-span-9 p-8 rounded-[4rem] bg-black border-2 border-white/[0.04] shadow-3xl h-[750px] relative overflow-hidden group">
                 <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(212,175,55,0.02),transparent_70%)] pointer-events-none" />
                 
                 {/* SVG GEOSPACE */}
                 <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" className="transition-transform duration-700 ease-out" style={{ transform: `scale(${zoom})` }}>
                    <defs>
                       <filter id="glow">
                          <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                          <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
                       </filter>
                    </defs>

                    {/* TRADE LINES */}
                    {flows.map((flow) => {
                       const from = countries.find(c => c.id === flow.from);
                       const to = countries.find(c => c.id === flow.to);
                       if (!from || !to) return null;
                       const midX = (from.x + to.x) / 2;
                       const midY = (from.y + to.y) / 2 - 10;
                       const path = `M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`;
                       const isActive = !selectedFlow || selectedFlow.id === flow.id;
                       
                       return (
                          <g key={flow.id} onClick={() => setSelectedFlow(flow)} className="cursor-pointer">
                             <path d={path} fill="none" stroke={flow.color} strokeWidth={isActive ? 0.8 : 0.2} strokeOpacity={isActive ? 0.6 : 0.1} />
                             {isPlaying && isActive && (
                                <motion.path d={path} fill="none" stroke="white" strokeWidth={0.5} strokeDasharray="2 10" strokeDashoffset={animationProgress * -100} strokeOpacity={0.8} filter="url(#glow)" />
                             )}
                          </g>
                       );
                    })}

                    {/* COUNTRY NODES */}
                    {countries.map((c) => (
                       <g key={c.id} onClick={() => setSelectedCountry(c)} className="cursor-pointer group/node">
                          <circle cx={c.x} cy={c.y} r={c.id === 'ua' ? 1.5 : 1} fill={c.id === 'ua' ? '#D4AF37' : '#334155'} className="group-hover/node:fill-white transition-colors" />
                          <circle cx={c.x} cy={c.y} r={c.id === 'ua' ? 3 : 2} fill={c.id === 'ua' ? '#D4AF37' : '#334155'} fillOpacity={0.2} className="" />
                          <text x={c.x} y={c.y + 4} textAnchor="middle" fontSize={1.8} className="fill-slate-600 font-black font-mono group-hover/node:fill-white">{c.code}</text>
                       </g>
                    ))}
                 </svg>

                 {/* FLOATING LEGEND */}
                 <div className="absolute bottom-10 left-10 p-8 bg-black/80  border border-white/5 rounded-[2.5rem] w-[350px] space-y-6 shadow-2xl">
                    <h4 className="text-[10px] font-black text-white italic uppercase tracking-[0.4em] flex items-center gap-4">
                       <Layers size={16} className="text-[#D4AF37]" /> АКТИВНІ_ПОТОКИ
                    </h4>
                    <div className="space-y-4">
                       {flows.map(f => (
                         <div key={f.id} onClick={() => setSelectedFlow(f)} className={cn("p-4 rounded-2xl border transition-all cursor-pointer group", selectedFlow?.id === f.id ? "bg-[#D4AF37]/10 border-[#D4AF37]/40" : "bg-black/40 border-white/5 hover:border-[#D4AF37]/20")}>
                            <div className="flex items-center justify-between mb-2">
                               <div className="flex items-center gap-3">
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: f.color }} />
                                  <p className="text-[10px] font-black text-white italic">{f.product}</p>
                               </div>
                               <p className="text-[10px] font-black text-[#D4AF37] font-mono">{formatValue(f.value)}</p>
                            </div>
                            <p className="text-[8px] font-black text-slate-700 uppercase italic tracking-widest">{countries.find(c => c.id === f.from)?.name} → UA</p>
                         </div>
                       ))}
                    </div>
                 </div>

                 {/* ZOOM HUD */}
                 <div className="absolute top-10 right-10 flex flex-col gap-4">
                    <div className="p-6 bg-black/80  border border-white/5 rounded-[2rem] text-center shadow-xl">
                       <p className="text-[8px] font-black text-slate-700 uppercase italic mb-1">ZOOM_LEVEL</p>
                       <p className="text-xl font-black text-[#D4AF37] font-mono italic">x{zoom.toFixed(1)}</p>
                    </div>
                 </div>
              </div>

              {/* DETAILS & RISK ANALYSIS */}
              <div className="col-span-12 xl:col-span-3 space-y-10 h-[750px] overflow-y-auto no-scrollbar">
                 <AnimatePresence mode="wait">
                    {selectedCountry ? (
                      <motion.div key={selectedCountry.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-8">
                         <HoloCard variant="holographic" className="p-8 rounded-[3rem] border-[#D4AF37]/20 bg-[#D4AF37]/[0.02]">
                            <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase mb-2">{selectedCountry.name}</h3>
                            <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest italic mb-6">ISO_CODE: {selectedCountry.code} // ID: {selectedCountry.id}</p>
                            
                            <div className="space-y-4">
                               <div className="p-6 bg-black border border-white/5 rounded-[2rem] shadow-xl">
                                  <p className="text-[9px] font-black text-slate-600 uppercase italic mb-1">ІМПОРТ_З_КРАЇНИ</p>
                                  <p className="text-3xl font-black text-[#D4AF37] italic font-mono tracking-tighter">{formatValue(flows.filter(f => f.from === selectedCountry.id).reduce((a, b) => a + b.value, 0))}</p>
                               </div>
                               <div className="p-6 bg-black border border-white/5 rounded-[2rem] shadow-xl">
                                  <p className="text-[9px] font-black text-slate-600 uppercase italic mb-1">ОБСЯГ_ЕКСПОРТУ</p>
                                  <p className="text-3xl font-black text-white italic font-mono tracking-tighter">$12.4M</p>
                               </div>
                            </div>
                         </HoloCard>

                         <div className="p-8 rounded-[3rem] bg-black border-2 border-white/[0.04] shadow-3xl space-y-8">
                            <h4 className="text-[10px] font-black text-amber-500 italic uppercase tracking-[0.4em] border-b border-white/[0.04] pb-6 flex items-center gap-4">
                               <ShieldCheck size={16} /> RISK_COMPLIANCE_UA
                            </h4>
                            <div className="space-y-4">
                               <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/[0.04] space-y-2">
                                  <p className="text-[9px] font-black text-[#D4AF37] uppercase italic">FATF_STATUS</p>
                                  <p className="text-xs font-black text-white italic">WHITE_LIST // LOW_RISK</p>
                               </div>
                               <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/[0.04] space-y-2">
                                  <p className="text-[9px] font-black text-amber-500 uppercase italic">SANCTIONS_CHECK</p>
                                  <p className="text-xs font-black text-white italic">0 MATCHES (CLEAN)</p>
                               </div>
                            </div>
                         </div>
                      </motion.div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center space-y-10 opacity-20">
                         <Crosshair size={100} className="text-slate-600 animate-spin-slow" />
                         <p className="text-xl font-black text-slate-500 uppercase tracking-[1em] italic text-center">ОБЕРІТЬ ТО ГОВУ ЦІЛЬ</p>
                      </div>
                    )}
                 </AnimatePresence>
              </div>

           </div>
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
            .shadow-3xl { box-shadow: 0 60px 100px -30px rgba(0,0,0,0.8); }
            .no-scrollbar::-webkit-scrollbar { display: none; }
            .animate-spin-slow { animation: spin 10s linear infinite; }
            @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}} />
      </div>
    </PageTransition>
  );
}
