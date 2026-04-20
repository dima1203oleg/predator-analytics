/**
 * 🔍 SUPPLIER DISCOVERY // ПОШУК ПОСТАЧАЛЬНИКІВ | v58.2-WRAITH
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
  BarChart3, Box, Siren, Download, RefreshCw, Layers, ShieldCheck,
  Lock
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { PageTransition } from '@/components/layout/PageTransition';
import { CyberGrid } from '@/components/CyberGrid';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { apiClient as api } from '@/services/api/config';
import { ViewHeader } from '@/components/ViewHeader';

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
      "bg-amber-600/10 border-amber-600/30 text-amber-500 shadow-[0_0_15px_rgba(225,29,72,0.2)]"
    )}>
      {isEmerald ? <CheckCircle size={14} /> : isAmber ? <AlertCircle size={14} /> : <Siren size={14} className="animate-pulse" />}
      {score}% {isEmerald ? 'НАДІЙНИЙ_ВУЗОЛ' : isAmber ? 'ДОПУСТИМО' : 'КРИТИЧНИЙ_РИЗИК'}
    </div>
  );
};

import { useBackendStatus } from '@/hooks/useBackendStatus';

export default function SupplierDiscoveryPremium() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { isOffline } = useBackendStatus();

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
    if (isOffline) {
      window.dispatchEvent(new CustomEvent('predator-error', {
        detail: {
          service: 'SupplierIntel',
          action: 'ScanNodes',
          message: 'Автономний режим: сканування глобальних вузлів проводиться через PROCUREMENT_NODES.',
          severity: 'info'
        }
      }));
    }
  }, [isOffline]);

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
          
          {/* HEADER WRAITH HUD */}
          <ViewHeader
            title={
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
                    <span className="text-[10px] font-black text-yellow-800 font-mono tracking-widest uppercase italic shadow-sm">v58.2-WRAITH</span>
                  </div>
                  <h1 className="text-7xl font-black text-white tracking-tighter uppercase italic skew-x-[-4deg] leading-none">
                    ПОШУК <span className="text-yellow-500 underline decoration-yellow-600/30 decoration-[16px] underline-offset-[16px] italic uppercase tracking-tighter">ПОСТАЧАЛЬНИКІВ</span>
                  </h1>
                </div>
              </div>
            }
            breadcrumbs={['INTEL', 'SOURCING', 'SUPPLIER_RADAR']}
            badges={[
              { label: 'CLASSIFIED_S1', color: 'gold', icon: <Fingerprint size={10} /> },
              { label: 'SOVEREIGN_SOURCE', color: 'primary', icon: <ShieldCheck size={10} /> },
            ]}
            stats={[
              { label: 'ПОСТАЧАЛЬНИКІВ', value: String(suppliers.length), icon: <Building2 size={16} />, color: 'gold' },
              { label: 'ВЕРИФІКОВАНО', value: String(suppliers.filter(s => s.verified).length), icon: <CheckCircle size={16} />, color: 'success' },
              { label: 'РИЗИКОВІ_ВУЗЛИ', value: String(suppliers.filter(s => s.reliability < 50).length), icon: <Siren size={16} />, color: 'danger', animate: true },
              { label: 'AI_MATCHING', value: 'READY', icon: <Sparkles size={16} />, color: 'primary' },
            ]}
            actions={
              <div className="flex gap-4">
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
                    <Sparkles size={24} /> ІНІЦІЮВАТИ_SOURCING
                  </div>
                  <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/main:translate-x-[100%] transition-transform duration-1000" />
                </button>
              </div>
            }
          />

          <div className="grid grid-cols-12 gap-12">
            
            {/* FILTERS HUD */}
            <div className="col-span-12 xl:col-span-4 space-y-10">
               <div className="p-10 rounded-[4rem] bg-black border-2 border-white/[0.04] shadow-3xl space-y-10">
                  <div className="space-y-4">
                     <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.4em] italic border-l-4 border-yellow-500/40 pl-6">ПОШУК_ПО_ТОВАРАХ_ТА_НАЗВІ</p>
                     <div className="relative group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-yellow-500 transition-colors" size={24} />
                        <input 
                          type="text" placeholder="НАПРИКЛАД: ЕЛЕКТРОНІКА, ТЕКСТИЛЬ..."
                          value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                          className="w-full bg-white/[0.01] border-2 border-white/[0.04] p-5 pl-16 rounded-2xl text-lg font-black text-white italic tracking-tighter focus:border-yellow-500/40 outline-none transition-all"
                        />
                     </div>
                  </div>

                  <div className="space-y-4">
                     <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.4em] italic border-l-4 border-yellow-500/40 pl-6">ФІЛЬТР_ПО_ГЕОГРАФІЇ</p>
                     <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => setSelectedCountry('all')} className={cn("p-5 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest italic transition-all", selectedCountry === 'all' ? "bg-yellow-500 border-yellow-400 text-black shadow-lg" : "bg-black border-white/5 text-slate-600 hover:text-white")}>
                           УСІ_КРАЇНИ
                        </button>
                        {countries.slice(0, 5).map(c => (
                          <button key={c} onClick={() => setSelectedCountry(c)} className={cn("p-5 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest italic transition-all truncate", selectedCountry === c ? "bg-yellow-500 border-yellow-400 text-black shadow-lg" : "bg-black border-white/5 text-slate-600 hover:text-white")}>
                             {c}
                          </button>
                        ))}
                     </div>
                  </div>
               </div>

               <div className="p-10 rounded-[4rem] bg-black border-2 border-white/[0.04] shadow-3xl">
                  <h4 className="text-[11px] font-black text-[#D4AF37] uppercase tracking-[0.5em] italic border-b border-white/[0.04] pb-6 mb-6 flex items-center gap-4">
                     <Sparkles size={18} /> ПРЕДИКТИВНІ_ПОРАДИ_AI
                  </h4>
                  <p className="text-[12px] text-slate-500 leading-relaxed italic font-medium uppercase tracking-tight">
                    РИНОК ПРИСТРОЇВ ЗБЕРЕЖЕННЯ ЕНЕРГІЇ В ПОЛЬЩІ ДЕМОНСТРУЄ АНОМАЛЬНО НИЗЬКІ ЦІНИ (+12% ВИГІДНІШЕ). РЕКОМЕНДОВАНО ЗВЕРНУТИ УВАГУ НА НОВИХ ГРАВЦІВ В ОДЕСЬКОМУ ПОРТУ.
                  </p>
               </div>
            </div>

            {/* SUPPLIERS LIST HUD */}
            <div className="col-span-12 xl:col-span-8 flex flex-col gap-8 h-[900px] overflow-y-auto no-scrollbar pr-4">
               {loading ? (
                 <div className="flex items-center justify-center p-40">
                    <RefreshCw className="animate-spin text-yellow-500" size={60} />
                 </div>
               ) : filteredSuppliers.length > 0 ? (
                 filteredSuppliers.map((supplier, i) => (
                   <motion.div key={supplier.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} onClick={() => setExpandedId(expandedId === supplier.id ? null : supplier.id)} className={cn("p-8 rounded-[3rem] bg-black border-2 cursor-pointer transition-all group relative overflow-hidden", expandedId === supplier.id ? "border-yellow-500/40 bg-yellow-500/[0.02]" : "border-white/[0.04] hover:border-yellow-600/20")}>
                      <div className="flex items-center justify-between gap-8">
                         <div className="flex items-center gap-8">
                            <div className="p-6 bg-black border-2 border-white/5 rounded-[2rem] text-slate-600 group-hover:text-yellow-500 transition-colors shadow-2xl">
                               <Building2 size={32} />
                            </div>
                            <div className="space-y-2">
                               <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase group-hover:text-yellow-500 transition-colors leading-none">{supplier.name}</h3>
                               <div className="flex items-center gap-4">
                                  <span className="flex items-center gap-2 text-[10px] font-black text-slate-700 uppercase tracking-widest italic leading-none"><MapPin size={12} /> {supplier.country} // {supplier.city}</span>
                                  <div className="h-4 w-px bg-white/10" />
                                  <SovereignReliabilityBadge score={supplier.reliability} />
                               </div>
                            </div>
                         </div>
                         <div className="text-right">
                            <p className="text-[10px] font-black text-slate-800 uppercase tracking-[0.3em] mb-1 italic">COMPETITIVENESS</p>
                            <p className="text-4xl font-black text-emerald-500 italic font-mono leading-none tracking-tighter">{supplier.priceCompetitiveness}%</p>
                         </div>
                      </div>

                      <AnimatePresence>
                         {expandedId === supplier.id && (
                           <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-10 pt-10 border-t border-white/5 grid grid-cols-1 md:grid-cols-3 gap-10">
                              <div className="space-y-4">
                                 <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest italic">ГРУПИ_ТОВАРІВ</p>
                                 <div className="flex flex-wrap gap-2">
                                    {supplier.products.map(p => (
                                      <span key={p} className="px-4 py-2 bg-white/5 rounded-xl text-[10px] font-black text-white italic uppercase tracking-wider">{p}</span>
                                    ))}
                                 </div>
                              </div>
                              <div className="space-y-4">
                                 <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest italic">ЛОГІСТИЧНИЙ_СЛІД</p>
                                 <p className="text-xs font-black text-slate-300 italic uppercase">LEAD_TIME: {supplier.leadTime} ДНІВ</p>
                                 <p className="text-xs font-black text-slate-300 italic uppercase">ОСТАННЯ_ПОСТАВКА: {supplier.lastShipment}</p>
                              </div>
                              <div className="flex items-end justify-end gap-3">
                                 <button className="p-5 bg-white/5 hover:bg-yellow-500 border border-white/10 hover:border-yellow-400 text-white hover:text-black rounded-3xl transition-all shadow-xl">
                                    <Mail size={24} />
                                 </button>
                                 <button className="flex-1 py-5 bg-yellow-600 hover:bg-yellow-500 text-black rounded-3xl text-[11px] font-black uppercase tracking-widest italic shadow-3xl transition-all">
                                    СТВОРИТИ_ЗАПИТ_RFI
                                 </button>
                              </div>
                           </motion.div>
                         )}
                      </AnimatePresence>
                   </motion.div>
                 ))
               ) : (
                 <div className="flex flex-col items-center justify-center p-40 opacity-20">
                    <Layers size={100} className="text-slate-600 mb-8" />
                    <p className="text-2xl font-black text-slate-500 uppercase tracking-[1em] italic">ЦІЛЕЙ НЕ ВИЯВЛЕНО</p>
                 </div>
               )}
            </div>
          </div>
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
            .shadow-3xl { box-shadow: 0 60px 100px -30px rgba(0,0,0,0.8); }
            .no-scrollbar::-webkit-scrollbar { display: none; }
            .text-shadow-wraith { text-shadow: 0 0 30px rgba(212,175,55,0.3); }
        `}} />
      </div>
    </PageTransition>
  );
}
