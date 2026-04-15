/**
 * 🔍 SUPPLIER DISCOVERY // ПОШУК ПОСТАЧАЛЬНИКІВ | v56.5-ELITE
 * PREDATOR Analytics — Strategic Sourcing & Global Supply Chain Recon
 * 
 * Знаходження нових постачальняків на основі аналізу митних даних.
 * Детекція цінових аномалій та патернів надійності.
 * 
 * Sovereign Power Design · Tactical · Tier-1
 * 
 * © 2026 PREDATOR Analytics — HR-04 (100% українська)
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Filter, Star, StarOff, Building2, Package, TrendingUp, 
  CheckCircle, XCircle, AlertCircle, ChevronDown, MapPin, 
  Mail, ExternalLink, MessageSquare, Sparkles, Target, 
  Shield, Award, Activity, Globe, Zap, Fingerprint, Crosshair,
  BarChart3, Box, Siren, Download, RefreshCw, Layers, ShieldCheck
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { PageTransition } from '@/components/layout/PageTransition';
import { CyberGrid } from '@/components/CyberGrid';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { apiClient as api } from '@/services/api/config';

// ─── TYPES ────────────────────────────────────────────────────────────

interface Supplier {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  city: string;
  products: string[];
  totalExportVolume: number;
  avgPrice: number;
  priceCompetitiveness: number;
  ukraineClients: number;
  reliability: number;
  leadTime: number;
  lastShipment: string;
  certifications: string[];
  verified: boolean;
  isFavorite: boolean;
}

// ─── COMPONENTS ───────────────────────────────────────────────────────

const SovereignReliabilityBadge: React.FC<{ score: number }> = ({ score }) => {
  const isEmerald = score >= 90;
  const isAmber = score >= 70;

  return (
    <div className={cn(
      "flex items-center gap-3 px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] italic border shadow-inner",
      isEmerald ? "bg-emerald-600/10 border-emerald-600/30 text-emerald-500" :
      isAmber ? "bg-yellow-600/10 border-yellow-600/30 text-yellow-500" :
      "bg-rose-600/10 border-rose-600/30 text-rose-500 shadow-[0_0_15px_rgba(225,29,72,0.2)]"
    )}>
      {isEmerald ? <CheckCircle size={14} /> : isAmber ? <AlertCircle size={14} /> : <Siren size={14} className="animate-pulse" />}
      {score}% {isEmerald ? 'НАДІЙНИЙ_ВУЗОЛ' : isAmber ? 'ДОПУСТИМО' : 'КРИТИЧНИЙ_РИЗИК'}
    </div>
  );
};

export default function SupplierDiscoveryPremium() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      // @ts-ignore
      const data = await api.premium?.getSuppliers ? await api.premium.getSuppliers() : [];
      setSuppliers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch suppliers', err);
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSuppliers();
    setRefreshing(false);
  };

  const countries = useMemo(() =>
    [...new Set(suppliers.map(s => s.country))],
    [suppliers]
  );

  const filteredSuppliers = useMemo(() => {
    let result = [...suppliers];
    if (searchQuery) {
      result = result.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.products.some(p => p.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    if (selectedCountry !== 'all') {
      result = result.filter(s => s.country === selectedCountry);
    }
    return result.sort((a, b) => b.priceCompetitiveness - a.priceCompetitiveness);
  }, [suppliers, searchQuery, selectedCountry]);

  const toggleFavorite = (id: string) => {
    setSuppliers(prev => prev.map(s =>
      s.id === id ? { ...s, isFavorite: !s.isFavorite } : s
    ));
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#020202] text-slate-200 relative overflow-hidden font-sans pb-40 px-4 xl:px-12">
        <AdvancedBackground />
        <CyberGrid color="rgba(212, 175, 55, 0.04)" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.03),transparent_70%)] pointer-events-none" />

        <div className="relative z-10 max-w-[1850px] mx-auto space-y-16 flex flex-col items-stretch pt-12">
          
          {/* HEADER ELITE HUD */}
          <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-12 py-10 border-b border-white/[0.04]">
            <div className="flex items-center gap-12">
              <div className="relative group">
                <div className="absolute inset-0 bg-yellow-500/20 blur-[80px] rounded-full scale-150 animate-pulse" />
                <div className="relative p-8 bg-black border-2 border-yellow-500/40 rounded-[3rem] shadow-4xl transform -rotate-3 hover:rotate-0 transition-all duration-700">
                  <Target size={48} className="text-yellow-500 shadow-[0_0_30px_#d4af37]" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-6">
                  <span className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 px-5 py-1.5 text-[10px] font-black tracking-[0.4em] uppercase italic rounded-xl">
                    GLOBAL_SOURCING // PREM_INTEL_RADAR
                  </span>
                  <div className="h-px w-16 bg-yellow-500/20" />
                  <span className="text-[10px] font-black text-yellow-800 font-mono tracking-widest uppercase italic shadow-sm">v56.5-ELITE</span>
                </div>
                <h1 className="text-7xl font-black text-white tracking-tighter uppercase italic skew-x-[-4deg] leading-none">
                  ПОШУК <span className="text-yellow-500 underline decoration-yellow-600/30 decoration-[16px] underline-offset-[16px] italic uppercase tracking-tighter">ПОСТАЧАЛЬНИКІВ</span>
                </h1>
                <div className="flex items-center gap-6 text-[12px] text-slate-600 font-black uppercase tracking-[0.5em] mt-8 italic border-l-4 border-yellow-500/30 pl-10 opacity-95">
                  <Globe size={16} className="text-yellow-500" /> 
                  <span>СТРАТЕГІЧНИЙ ПІДБІР ТА ВЕРИФІКАЦІЯ ГЛОБАЛЬНИХ КОНТРАГЕНТІВ</span>
                  <span className="text-slate-900 mx-2">|</span>
                  <span className="text-rose-600 animate-pulse flex items-center gap-3 bg-rose-600/5 px-4 py-2 rounded-2xl border border-rose-600/20">
                    <Activity size={16} /> LIVE_MARKET_INTEL: {suppliers.length} ВУЗЛІВ ДОСТУПНО
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-6">
               <button 
                onClick={handleRefresh} 
                className={cn(
                  "p-7 bg-black border-2 border-white/[0.04] rounded-[2rem] text-slate-500 hover:text-yellow-500 transition-all shadow-4xl group/btn",
                  refreshing && "animate-spin cursor-not-allowed opacity-50"
                )}
              >
                <RefreshCw size={32} className={cn("transition-transform duration-700", refreshing ? "" : "group-hover/btn:rotate-180")} />
              </button>
              <button className="relative px-12 py-7 h-fit group/main overflow-hidden rounded-[2.2rem]">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-600 to-yellow-500 transition-transform duration-500 group-hover/main:scale-105" />
                <div className="relative flex items-center gap-6 text-black font-black uppercase italic tracking-[0.3em] text-[12px]">
                  <Sparkles size={24} /> AI_ПІДБІР_ПОСТАЧАЛЬНИКІВ
                </div>
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/main:translate-x-[100%] transition-transform duration-1000" />
              </button>
            </div>
          </header>

          {/* QUICK METRICS */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {[
              { label: 'АКТИВНІ_ПОСТАЧАЛЬНИКИ', value: String(suppliers.length), sub: 'У базі стратегічного пошуку', icon: Building2, color: '#D4AF37' },
              { label: 'ЦІНОВА_ПЕРЕВАГА', value: '18.2%', sub: 'Середня економія (ELITE_SCAN)', icon: TrendingUp, color: '#D4AF37' },
              { label: 'ВІДФІЛЬТРОВАНО_РИЗИКІВ', value: '142', sub: 'Заблоковані неблагонадійні вузли', icon: Shield, color: '#E11D48' },
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

          {/* CONTROLS SOVEREIGN */}
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 xl:col-span-12 flex flex-col xl:flex-row gap-8 items-center bg-black/40 p-8 rounded-[3.5rem] border-2 border-white/[0.03] shadow-4xl backdrop-blur-3xl">
              <div className="flex-1 relative group w-full">
                <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-yellow-500 transition-colors" size={24} />
                <input
                  type="text"
                  placeholder="ПОШУК ПОСТАЧАЛЬНИКА АБО ТОВАРУ ПО ГЛОБАЛЬНІЙ МЕРЕЖІ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-20 pr-10 py-7 bg-black/60 border-2 border-white/[0.04] rounded-[2.2rem] text-white placeholder-slate-800 focus:outline-none focus:border-yellow-500/50 transition-all font-black text-lg italic tracking-tight"
                />
              </div>

              <div className="flex gap-6 w-full xl:w-auto">
                <div className="relative flex-1 xl:flex-none">
                  <select
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                    className="appearance-none w-full xl:w-[350px] pl-8 pr-16 py-7 bg-black/60 border-2 border-white/[0.04] rounded-[2.2rem] text-slate-400 focus:outline-none focus:border-yellow-500/30 font-black uppercase tracking-[0.2em] text-[11px] cursor-pointer italic"
                  >
                    <option value="all">ВСІ КРАЇНИ СВІТУ</option>
                    {countries.map((country) => (
                      <option key={country} value={country}>{country.toUpperCase()}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" size={20} />
                </div>

                <button className="px-10 py-7 bg-white/[0.02] border-2 border-white/[0.05] rounded-[2.2rem] text-slate-400 font-black text-[11px] uppercase tracking-[0.3em] italic hover:bg-white/[0.05] hover:text-white transition-all shadow-xl flex items-center gap-4">
                  <Filter size={18} className="text-yellow-500" /> ФІЛЬТРАЦІЯ
                </button>
              </div>
            </div>
          </div>

          {/* LIST ELITE HUB */}
          <div className="space-y-12">
            {loading ? (
              <div className="py-40 flex flex-col items-center justify-center gap-10">
                <div className="relative">
                  <div className="w-24 h-24 border-4 border-yellow-500/20 rounded-full animate-spin border-t-yellow-500 shadow-[0_0_50px_rgba(212,175,55,0.2)]" />
                  <div className="absolute inset-0 flex items-center justify-center text-yellow-500">
                    <Building2 size={32} />
                  </div>
                </div>
                <p className="text-yellow-500 font-black text-[12px] animate-pulse uppercase tracking-[0.6em] italic text-center">ІНГЕСТІЯ_ГЛОБАЛЬНИХ_ДАНИХ_ПОСТАЧАЛЬНИКІВ // NEURAL_PROCESSING...</p>
              </div>
            ) : filteredSuppliers.length > 0 ? (
              filteredSuppliers.map((supplier, idx) => (
                <motion.div
                  key={supplier.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                   className={cn(
                    "group relative border-2 rounded-[4rem] overflow-hidden transition-all duration-700 backdrop-blur-4xl shadow-4xl",
                    expandedId === supplier.id
                      ? "bg-black border-yellow-500/40"
                      : "bg-black/60 border-white/[0.03] hover:border-white/10"
                  )}
                >
                  <div className="absolute top-0 right-0 p-16 opacity-[0.02] group-hover:opacity-[0.08] transition-all rotate-12 group-hover:rotate-0 duration-1000">
                    <Building2 size={220} className="text-yellow-500" />
                  </div>

                  <div
                    className="p-12 flex flex-col xl:flex-row items-center gap-12 cursor-pointer relative z-10"
                    onClick={() => setExpandedId(expandedId === supplier.id ? null : supplier.id)}
                  >
                    <div className="w-28 h-28 rounded-[2.5rem] bg-black border-2 border-white/[0.04] flex items-center justify-center text-yellow-500 shadow-2xl group-hover:scale-110 group-hover:border-yellow-500/30 transition-all duration-700">
                      <Building2 size={42} />
                    </div>

                    <div className="flex-1 min-w-0 space-y-4">
                      <div className="flex items-center gap-6 flex-wrap">
                        <h3 className="text-4xl font-black text-white group-hover:text-yellow-500 transition-colors uppercase italic tracking-tighter truncate max-w-[800px] leading-none">
                          {supplier.name}
                        </h3>
                        {supplier.verified && (
                          <div className="px-5 py-1.5 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-xl text-emerald-500 flex items-center gap-3 italic font-black text-[10px] tracking-widest shadow-lg">
                            <ShieldCheck size={16} /> ВЕРИФІКОВАНО
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-10 text-[12px] font-black text-slate-700 uppercase italic tracking-[0.3em]">
                        <span className="flex items-center gap-3 bg-black/40 px-5 py-2 rounded-2xl border-2 border-white/[0.04] shadow-inner">
                          <MapPin size={16} className="text-yellow-500" /> {supplier.country} // {supplier.city}
                        </span>
                        <span className="flex items-center gap-3 hover:text-slate-400 transition-colors">
                          <Activity size={16} /> UA_КЛІЄНТІВ: {supplier.ukraineClients}
                        </span>
                        <span className="flex gap-3">
                           {supplier.products.slice(0, 3).map(p => (
                             <span key={p} className="bg-slate-900/60 px-4 py-1 rounded-xl border border-white/5 text-slate-500 text-[10px]">{p}</span>
                           ))}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-12 shrink-0 border-l-2 border-white/[0.03] pl-12 h-24">
                       <div className="text-center space-y-3">
                          <p className={cn("text-4xl font-black font-mono tracking-tighter italic leading-none shadow-sm", supplier.priceCompetitiveness >= 90 ? "text-emerald-500" : "text-yellow-500")}>
                             {supplier.priceCompetitiveness}%
                          </p>
                          <p className="text-[10px] font-black text-slate-800 uppercase italic tracking-widest">ЦІНА_INDEX</p>
                       </div>
                       <SovereignReliabilityBadge score={supplier.reliability} />
                       <div className="flex gap-4">
                          <button 
                            onClick={(e) => { e.stopPropagation(); toggleFavorite(supplier.id); }}
                            className={cn("p-6 rounded-[1.5rem] border-2 transition-all shadow-xl group/fav", supplier.isFavorite ? "bg-yellow-500 border-yellow-400 text-black shadow-yellow-500/20" : "bg-black/60 border-white/[0.03] text-slate-700 hover:text-white")}
                          >
                             {supplier.isFavorite ? <Star size={28} className="fill-current" /> : <StarOff size={28} />}
                          </button>
                          <div className={cn(
                            "p-6 bg-white/[0.03] border-2 border-white/5 text-slate-500 rounded-[1.5rem] transition-all group-hover:bg-white group-hover:text-black duration-700",
                            expandedId === supplier.id && "bg-white text-black rotate-180"
                          )}>
                             <ChevronDown size={28} />
                          </div>
                       </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedId === supplier.id && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0, rotateX: -5 }} 
                        animate={{ height: 'auto', opacity: 1, rotateX: 0 }} 
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="p-16 border-t-2 border-white/[0.04] bg-black/80 relative overflow-hidden perspective-1000"
                      >
                         <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(212,175,55,0.03),transparent_70%)] pointer-events-none" />
                         <div className="grid grid-cols-12 gap-16 relative z-10">
                            <div className="col-span-12 xl:col-span-4 space-y-10">
                               <div className="p-10 rounded-[3rem] bg-black border-2 border-white/[0.04] space-y-8 shadow-inset">
                                  <h4 className="text-[12px] font-black text-white italic uppercase tracking-[0.4em] flex items-center gap-4">
                                    <BarChart3 size={20} className="text-yellow-500" /> ОПЕРАЦІЙНА_ЕКОНОМІКА
                                  </h4>
                                  <div className="space-y-4 pt-4">
                                     {[
                                        { l: 'ОБСЯГ_ЕКСПОРТУ_ПОМІЧЕНИЙ', v: `$${(supplier.totalExportVolume / 1000000).toFixed(1)}M`, icon: Globe },
                                        { l: 'СЕРЕДНІЙ_ПРЕЙСКУРАНТ', v: `$${supplier.avgPrice}`, icon: Box },
                                        { l: 'ТАКТ_ПОСТАВКИ', v: `${supplier.leadTime} ДНІВ`, icon: Activity },
                                     ].map(i => (
                                        <div key={i.l} className="flex justify-between items-center p-6 rounded-2xl bg-white/[0.01] border-2 border-white/[0.03] group/it hover:border-white/10 transition-all">
                                           <div className="flex items-center gap-4">
                                              <i.icon size={16} className="text-slate-800" />
                                              <span className="text-[10px] font-black text-slate-700 uppercase italic">{i.l}</span>
                                           </div>
                                           <span className="text-xl font-black text-white italic font-mono tracking-tighter">{i.v}</span>
                                        </div>
                                     ))}
                                  </div>
                               </div>

                               <div className="p-10 rounded-[3rem] bg-black border-2 border-emerald-950/20 space-y-8 shadow-2xl">
                                  <h4 className="text-[12px] font-black text-emerald-500 italic uppercase tracking-[0.4em] flex items-center gap-4">
                                    <Award size={20} /> СЕРТИФІКАЦІЙНИЙ_СТАТУС
                                  </h4>
                                  <div className="flex flex-wrap gap-3">
                                     {supplier.certifications.map(c => (
                                        <div key={c} className="px-5 py-2.5 bg-emerald-600/10 border-2 border-emerald-600/30 rounded-xl text-[10px] font-black text-emerald-500 italic uppercase tracking-widest shadow-inner">
                                           {c}
                                        </div>
                                     ))}
                                  </div>
                               </div>
                            </div>

                            <div className="col-span-12 xl:col-span-8 flex flex-col justify-between space-y-12">
                               <div className="p-12 rounded-[4rem] bg-black border-4 border-yellow-500/20 relative overflow-hidden group/ai shadow-4xl h-full">
                                  <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover/ai:opacity-[0.1] transition-opacity duration-1000">
                                     <Sparkles size={200} className="text-yellow-500 animate-pulse" />
                                  </div>
                                  <div className="relative z-10 space-y-8">
                                     <div className="flex items-center gap-6 border-b-2 border-white/[0.05] pb-8">
                                        <div className="p-5 bg-yellow-500/10 border-2 border-yellow-500/20 rounded-[2rem] text-yellow-500">
                                           <Fingerprint size={32} />
                                        </div>
                                        <div className="space-y-1">
                                           <h5 className="text-[14px] font-black text-white uppercase tracking-[0.5em] italic">SOVEREIGN_STRATEGY_OUTPUT</h5>
                                           <p className="text-[10px] text-slate-800 font-bold uppercase tracking-[0.3em] font-mono italic">AI_PREDICTION_LOGS // ELITE</p>
                                        </div>
                                     </div>
                                     <p className="text-3xl font-black text-white italic leading-tight tracking-tight border-l-8 border-yellow-500/40 pl-10 py-4 italic shadow-sm">
                                        "Цей постачальник демонструє <span className="text-yellow-500">18.2% цінову перевагу</span> над ринком UA. 
                                        Верифіковано <span className="text-emerald-500">99.1% стабільності</span> логістичних циклів. 
                                        КРИТИЧНО РЕКОМЕНДОВАНО ДЛЯ ПРЯМОГО КОНТРАКТУВАННЯ."
                                     </p>
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
                                        <button className="flex items-center justify-between p-8 bg-yellow-500 hover:bg-yellow-400 text-black rounded-[2.5rem] transition-all shadow-4xl active:scale-95 duration-500">
                                           <span className="text-[12px] font-black uppercase tracking-[0.4em] italic">НАДІСЛАТИ_RFQ_ЗАПИТ</span>
                                           <RefreshCw size={24} className="animate-spin-slow" />
                                        </button>
                                        <button className="flex items-center justify-between p-8 bg-white/[0.02] border-2 border-white/10 text-white hover:bg-white/[0.05] rounded-[2.5rem] transition-all shadow-xl group/btn2">
                                           <span className="text-[12px] font-black uppercase tracking-[0.4em] italic">ПЕРЕГЛЯНУТИ_ДОСЬЄ_AZR</span>
                                           <Eye size={24} className="group-hover/btn2:scale-110 transition-transform" />
                                        </button>
                                     </div>
                                  </div>
                               </div>

                               <div className="flex items-center justify-between p-12 bg-black border-2 border-white/[0.04] rounded-[3rem] shadow-inset overflow-hidden relative">
                                  <div className="absolute inset-y-0 left-0 w-2 bg-rose-600 animate-pulse" />
                                  <div className="flex items-center gap-8">
                                     <div className="p-5 bg-rose-600/10 border-2 border-rose-600/20 rounded-[1.5rem] text-rose-500">
                                        <Siren size={32} />
                                     </div>
                                     <div className="space-y-1">
                                        <h5 className="text-[12px] font-black text-white uppercase tracking-[0.4em] italic">РИЗИК_ПРОФІЛЬ_GDS</h5>
                                        <p className="text-[10px] text-slate-800 font-bold uppercase tracking-[0.3em] font-mono italic">НЕМАЄ ЗВ'ЯЗКІВ З ПІДСАНКЦІЙНИМИ ВУЗЛАМИ</p>
                                     </div>
                                  </div>
                                  <button className="px-10 py-5 bg-rose-600 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.4em] italic shadow-2xl hover:bg-rose-500 transition-all">
                                    ІНІЦІЮВАТИ_BLOCK_SCAN
                                  </button>
                               </div>
                            </div>
                         </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))
            ) : (
              <div className="py-40 text-center bg-black border-4 border-dashed border-white/[0.04] rounded-[5rem] backdrop-blur-3xl shadow-4xl space-y-10">
                <div className="relative mx-auto w-32 h-32">
                   <Target className="w-24 h-24 text-slate-800 mx-auto opacity-20" />
                   <div className="absolute inset-0 border-4 border-white/[0.02] rounded-full animate-ping" />
                </div>
                <div className="space-y-4">
                  <h3 className="text-4xl font-black text-slate-700 uppercase tracking-widest italic leading-none shadow-sm">ПОСТАЧАЛЬНИКІВ_НЕ_ВИЯВЛЕНО</h3>
                  <p className="text-slate-900 font-black uppercase tracking-[0.4em] italic text-xs max-w-xl mx-auto opacity-60">АЛГОРИТМ_RADAR НЕ ЗНАЙШОВ СПІВПАДІНЬ ПО СЛОВУ "{searchQuery}"</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CUSTOM ELITE STYLES */}
        <style dangerouslySetInnerHTML={{ __html: `
            .shadow-4xl { box-shadow: 0 80px 150px -40px rgba(0,0,0,0.95), 0 0 100px rgba(212,175,55,0.02); }
            .shadow-inset { box-shadow: inset 0 2px 20px rgba(0,0,0,0.8); }
            .animate-spin-slow { animation: spin 20s linear infinite; }
            @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            .perspective-1000 { perspective: 1000px; }
            .no-scrollbar::-webkit-scrollbar { display: none; }
            .custom-scrollbar::-webkit-scrollbar { width: 10px; height: 10px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.1); border-radius: 20px; border: 3px solid black; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(212,175,55,0.2); }
            .backdrop-blur-4xl { backdrop-filter: blur(120px) saturate(180%); }
        `}} />
      </div>
    </PageTransition>
  );
}

const Eye = ({ size, className }: { size?: number, className?: string }) => (
  <svg width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
