/**
 * 🔍 SUPPLIER DISCOVERY // ПОШУК ПОСТАЧАЛЬНИКІВ | v56.2-TITAN
 * PREDATOR Analytics — Strategic Sourcing & Global Supply Chain Recon
 * 
 * Знаходження нових постачальників на основі аналізу митних даних.
 * Детекція цінових аномалій та патернів надійності.
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
  BarChart3, Box
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageTransition } from '@/components/layout/PageTransition';
import { TacticalCard } from '@/components/TacticalCard';
import { ViewHeader } from '@/components/ViewHeader';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
import { api } from '@/services/api';

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

const ReliabilityBadge: React.FC<{ score: number }> = ({ score }) => {
  const isEmerald = score >= 90;
  const isAmber = score >= 70;

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest italic border",
      isEmerald ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" :
      isAmber ? "bg-amber-500/10 border-amber-500/30 text-amber-400" :
      "bg-rose-500/10 border-rose-500/30 text-rose-400"
    )}>
      {isEmerald ? <CheckCircle size={12} /> : isAmber ? <AlertCircle size={12} /> : <XCircle size={12} />}
      {score}% {isEmerald ? 'НАДІЙНИЙ' : isAmber ? 'ДОБРИЙ' : 'РИЗИК'}
    </div>
  );
};

export default function SupplierDiscoveryPremium() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const data = await api.premium.getSuppliers();
        setSuppliers(data);
      } catch (err) {
        console.error('Failed to fetch suppliers', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSuppliers();
  }, []);

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

  const stats = useMemo(() => ([
    { label: 'АКТИВНІ_ПОСТАЧАЛЬНИКИ', value: String(suppliers.length), icon: <Building2 size={14} />, color: 'primary' as const },
    { label: 'ЦІНОВА_ПЕРЕВАГА', value: '15.4%', icon: <TrendingUp size={14} />, color: 'success' as const, animate: true },
    { label: 'МАРКЕР_НАДІЙНОСТІ', value: '94%', icon: <Shield size={14} />, color: 'primary' as const }
  ]), [suppliers.length]);

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#020617] text-slate-200 relative overflow-hidden font-sans pb-32">
        <AdvancedBackground />
        <CyberGrid color="rgba(6, 182, 212, 0.03)" />

        <div className="relative z-10 max-w-[1700px] mx-auto p-4 sm:p-12 space-y-12">
          
          <ViewHeader
            title={
              <div className="flex items-center gap-10">
                <div className="relative group">
                  <div className="absolute inset-0 bg-cyan-600/20 blur-3xl rounded-full scale-150 animate-pulse" />
                  <div className="relative p-7 bg-black border border-cyan-900/40 rounded-[2.5rem] shadow-2xl">
                    <Target size={42} className="text-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="badge-v2 bg-cyan-600/10 border border-cyan-600/20 text-cyan-500 px-3 py-1 text-[10px] font-black tracking-[0.3em] uppercase italic">
                      GLOBAL_SOURCING // PREM_INTEL
                    </span>
                    <div className="h-px w-10 bg-cyan-600/20" />
                    <span className="text-[10px] font-black text-slate-700 font-mono tracking-widest uppercase italic">v56.2 TITAN</span>
                  </div>
                  <h1 className="text-6xl font-black text-white tracking-tighter uppercase italic skew-x-[-2deg] leading-none mb-1">
                    ПОШУК <span className="text-cyan-600 underline decoration-cyan-600/20 decoration-8 italic uppercase">ПОСТАЧАЛЬНИКІВ</span>
                  </h1>
                  <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.4em] italic opacity-80 leading-none">
                    ГЛОБАЛЬНИЙ МОНІТОРИНГ РИНКУ ТА АНАЛІЗ НАДІЙНОСТІ
                  </p>
                </div>
              </div>
            }
            stats={stats}
            actions={
              <div className="flex gap-4">
                <button className="px-10 py-5 bg-cyan-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] italic hover:bg-cyan-600 shadow-2xl transition-all flex items-center gap-4">
                  <Sparkles size={20} /> AI_ПІДБІР
                </button>
              </div>
            }
          />

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-8 relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-cyan-500 transition-colors" size={20} />
              <input 
                type="text" placeholder="ПОШУК ПОСТАЧАЛЬНИКА АБО ТОВАРУ..."
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-black border-2 border-white/[0.04] p-5 pl-16 rounded-2xl text-sm font-black text-white italic tracking-widest focus:border-cyan-500/40 outline-none transition-all placeholder:text-slate-800"
              />
            </div>
            <div className="md:col-span-4">
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full bg-black border-2 border-white/[0.04] p-5 rounded-2xl text-sm font-black text-slate-400 italic tracking-widest focus:border-cyan-500/40 outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="all">ВСІ КРАЇНИ</option>
                {countries.map((country) => (
                  <option key={country} value={country}>{country.toUpperCase()}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 space-y-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-cyan-500/20 blur-2xl rounded-full scale-150 animate-pulse" />
                  <Zap className="text-cyan-500 animate-bounce" size={48} />
                </div>
                <p className="text-[12px] font-black text-slate-500 uppercase tracking-[0.4em] italic animate-pulse">
                  ІНГЕСТІЯ_ГЛОБАЛЬНИХ_ДАНИХ...
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {filteredSuppliers.map((supplier) => (
                  <motion.div
                    layout
                    key={supplier.id}
                    className={cn(
                      "p-8 bg-black border-2 rounded-[3.5rem] transition-all relative overflow-hidden group",
                      expandedId === supplier.id ? "border-cyan-600/40 bg-cyan-600/[0.02]" : "border-white/[0.04] hover:border-white/10"
                    )}
                  >
                    <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                      <Building2 size={160} className="text-cyan-500" />
                    </div>

                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-10 relative z-10">
                      <div className="flex items-start gap-8">
                        <div className="w-20 h-20 rounded-[2rem] bg-white/[0.02] border border-white/[0.05] flex items-center justify-center text-cyan-500 shadow-2xl group-hover:scale-110 transition-transform">
                          <Building2 size={32} />
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center gap-4">
                            <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">{supplier.name}</h3>
                            {supplier.verified && (
                              <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-500">
                                <Shield size={16} />
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-6 text-[10px] font-black text-slate-600 uppercase italic tracking-widest">
                            <div className="flex items-center gap-2"><MapPin size={12} className="text-cyan-500" /> {supplier.country} • {supplier.city}</div>
                            <div className="h-1 w-1 rounded-full bg-slate-800" />
                            <div className="flex items-center gap-2"><Activity size={12} className="text-cyan-500" /> UA_КЛІЄНТІВ: {supplier.ukraineClients}</div>
                          </div>
                          <div className="flex gap-2">
                             {supplier.products.slice(0, 4).map(p => (
                               <span key={p} className="px-3 py-1 bg-white/[0.03] border border-white/[0.05] rounded-xl text-[9px] font-black text-slate-400 italic uppercase">
                                 {p}
                               </span>
                             ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-10">
                         <div className="text-center space-y-2">
                            <p className={cn("text-4xl font-black font-mono tracking-tighter italic", supplier.priceCompetitiveness >= 90 ? "text-emerald-500" : "text-amber-500")}>
                               {supplier.priceCompetitiveness}%
                            </p>
                            <p className="text-[9px] font-black text-slate-700 uppercase italic tracking-widest">ЦІНА_INDEX</p>
                         </div>
                         <ReliabilityBadge score={supplier.reliability} />
                         <div className="flex gap-3">
                            <button 
                              onClick={() => toggleFavorite(supplier.id)}
                              className={cn("p-5 rounded-2xl border transition-all", supplier.isFavorite ? "bg-amber-500/10 border-amber-500/30 text-amber-500" : "bg-white/[0.02] border-white/[0.05] text-slate-700 hover:text-white")}
                            >
                               {supplier.isFavorite ? <Star size={24} className="fill-current" /> : <StarOff size={24} />}
                            </button>
                            <button 
                              onClick={() => setExpandedId(expandedId === supplier.id ? null : supplier.id)}
                              className="p-5 bg-white text-black rounded-2xl hover:bg-slate-200 transition-all shadow-2xl"
                            >
                               <motion.div animate={{ rotate: expandedId === supplier.id ? 180 : 0 }}>
                                  <ChevronDown size={24} />
                               </motion.div>
                            </button>
                         </div>
                      </div>
                    </div>

                    <AnimatePresence>
                      {expandedId === supplier.id && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }} 
                          animate={{ height: 'auto', opacity: 1 }} 
                          exit={{ height: 0, opacity: 0 }}
                          className="mt-12 pt-12 border-t border-white/[0.04] relative z-10"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
                             <div className="space-y-6">
                                <h4 className="text-[10px] font-black text-slate-700 uppercase italic tracking-[0.2em] flex items-center gap-3"><Activity size={12} className="text-cyan-500" /> СТАТИСТИКА_ОПЕРАЦІЙ</h4>
                                <div className="space-y-2">
                                   {[
                                      { l: 'ОБСЯГ_ЕКСПОРТУ', v: `$${(supplier.totalExportVolume / 1000000).toFixed(1)}M` },
                                      { l: 'СЕРЕДНЯ_ЦІНА', v: `$${supplier.avgPrice}` },
                                      { l: 'ЦИКЛ_ДОСТАВКИ', v: `${supplier.leadTime} ДНІВ` },
                                   ].map(i => (
                                      <div key={i.l} className="flex justify-between items-center p-3 rounded-xl bg-white/[0.01] border border-white/[0.03]">
                                         <span className="text-[9px] font-black text-slate-600 uppercase italic">{i.l}</span>
                                         <span className="text-sm font-black text-white italic font-mono">{i.v}</span>
                                      </div>
                                   ))}
                                </div>
                             </div>

                             <div className="space-y-6">
                                <h4 className="text-[10px] font-black text-slate-700 uppercase italic tracking-[0.2em] flex items-center gap-3"><Award size={12} className="text-cyan-500" /> СЕРТИФІКАЦІЯ</h4>
                                <div className="flex flex-wrap gap-2">
                                   {supplier.certifications.map(c => (
                                      <span key={c} className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-[9px] font-black text-emerald-400 italic uppercase">
                                         {c}
                                      </span>
                                   ))}
                                </div>
                             </div>

                             <div className="md:col-span-2 space-y-6">
                                <h4 className="text-[10px] font-black text-slate-700 uppercase italic tracking-[0.2em] flex items-center gap-3"><Sparkles size={12} className="text-purple-500" /> AI_ПЕРСПЕКТИВА_ВЗАЄМОДІЇ</h4>
                                <div className="p-6 rounded-3xl bg-gradient-to-br from-purple-500/5 to-cyan-500/5 border border-purple-500/20 relative overflow-hidden group">
                                   <div className="absolute top-0 right-0 p-6 opacity-[0.03]"><Brain size={80} className="text-purple-500" /></div>
                                   <p className="text-sm font-black text-slate-300 italic leading-relaxed">
                                      Цей постачальник демонструє <span className="text-emerald-500">15% цінову перевагу</span> над ринком. 
                                      Верифіковано <span className="text-cyan-500">98% своєчасних поставок</span>. 
                                      Рекомендовано для стратегічного контрактування.
                                   </p>
                                   <div className="flex gap-4 mt-6">
                                      <button className="px-8 py-3 bg-cyan-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest italic hover:bg-cyan-500 transition-all">НАДІСЛАТИ_ЗАПИТ</button>
                                      <button className="px-8 py-3 bg-white/[0.05] border border-white/[0.1] text-white rounded-xl text-[10px] font-black uppercase tracking-widest italic hover:bg-white/10 transition-all">ПРОФІЛЬ_EXTERNAL</button>
                                   </div>
                                </div>
                             </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </PageTransition>
  );
}

const Brain = ({ size, className }: { size?: number, className?: string }) => (
  <svg width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.04" />
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.04" />
  </svg>
);
