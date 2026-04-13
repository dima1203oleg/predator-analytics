/**
 * 💰 PRICE COMPARISON // ПОРІВНЯННЯ ЦІН | v56.2-TITAN
 * PREDATOR Analytics — Market Analysis & Procurement Intelligence
 * 
 * Знаходження найкращих пропозицій від глобальних постачальників.
 * Аналіз демпінгу, економії та надійності ланцюгів постачання.
 * 
 * © 2026 PREDATOR Analytics — HR-04 (100% українська)
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Filter, DollarSign, TrendingUp, TrendingDown, ArrowRight,
  ChevronDown, ChevronUp, Star, Clock, Truck, Shield, Crown,
  Sparkles, CheckCircle, AlertCircle, Globe, Package, BarChart3,
  Download, Target, Layers, Zap, ShieldCheck, Box, Crosshair,
  Factory, BadgeCheck, AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient as api } from '@/services/api/config';
import { PageTransition } from '@/components/layout/PageTransition';
import { TacticalCard } from '@/components/TacticalCard';
import { ViewHeader } from '@/components/ViewHeader';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';

// ─── TYPES ────────────────────────────────────────────────────────────

interface PriceOffer {
  id: string;
  supplierName: string;
  country: string;
  countryCode: string;
  price: number;
  currency: string;
  minQuantity: number;
  leadTime: number;
  reliability: number;
  lastUpdated: string;
  isVerified: boolean;
  isBestPrice: boolean;
}

interface Product {
  id: string;
  name: string;
  category: string;
  hsCode: string;
  unit: string;
  avgPrice: number;
  offers: PriceOffer[];
}

// ─── MOCK DATA ────────────────────────────────────────────────────────

const MOCK_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'ГЕНЕРАТОРИ_ДИЗЕЛЬ_5KW',
    category: 'ЕНЕРГЕТИКА',
    hsCode: '8502 11 20 00',
    unit: 'ШТ',
    avgPrice: 1250,
    offers: [
      { id: 'o1', supplierName: 'SINO_TECH_EXPORT', country: 'КИТАЙ', countryCode: 'CN', price: 980, currency: 'USD', minQuantity: 10, leadTime: 25, reliability: 98, lastUpdated: '2026-03-28', isVerified: true, isBestPrice: true },
      { id: 'o2', supplierName: 'EURO_POWER_GMBH', country: 'НІМЕЧЧИНА', countryCode: 'DE', price: 1450, currency: 'USD', minQuantity: 2, leadTime: 7, reliability: 99, lastUpdated: '2026-03-30', isVerified: true, isBestPrice: false },
      { id: 'o3', supplierName: 'TR_ENERGY_SOLUTIONS', country: 'ТУРЕЧЧИНА', countryCode: 'TR', price: 1120, currency: 'USD', minQuantity: 5, leadTime: 14, reliability: 85, lastUpdated: '2026-03-25', isVerified: false, isBestPrice: false },
    ]
  },
  {
    id: 'p2',
    name: 'АРМАТУРА_СТАЛЕВА_12MM',
    category: 'БУДІВНИЦТВО',
    hsCode: '7214 20 00 00',
    unit: 'ТОННА',
    avgPrice: 840,
    offers: [
      { id: 'o4', supplierName: 'POL_STEEL_WORKS', country: 'ПОЛЬЩА', countryCode: 'PL', price: 790, currency: 'USD', minQuantity: 20, leadTime: 5, reliability: 96, lastUpdated: '2026-03-29', isVerified: true, isBestPrice: true },
      { id: 'o5', supplierName: 'METALL_GROUP_BG', country: 'БОЛГАРІЯ', countryCode: 'BG', price: 820, currency: 'USD', minQuantity: 60, leadTime: 8, reliability: 92, lastUpdated: '2026-03-27', isVerified: true, isBestPrice: false },
    ]
  }
];

export default function PriceComparisonPremium() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedProduct, setExpandedProduct] = useState<string | null>('p1');
  const [loading, setLoading] = useState(false);

  const formatPrice = (p: number) => `$${p.toLocaleString()}`;

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#020617] text-slate-200 relative overflow-hidden font-sans pb-32">
        <AdvancedBackground />
        <CyberGrid color="rgba(16, 185, 129, 0.03)" />

        <div className="relative z-10 max-w-[1700px] mx-auto p-4 sm:p-12 space-y-12">
           
           <ViewHeader
             title={
               <div className="flex items-center gap-10">
                  <div className="relative group">
                     <div className="absolute inset-0 bg-emerald-600/20 blur-3xl rounded-full scale-150 animate-pulse" />
                     <div className="relative p-7 bg-black border border-emerald-900/40 rounded-[2.5rem] shadow-2xl">
                        <DollarSign size={42} className="text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                     </div>
                  </div>
                  <div className="space-y-2">
                     <div className="flex items-center gap-3">
                        <span className="badge-v2 bg-emerald-600/10 border border-emerald-600/20 text-emerald-500 px-3 py-1 text-[10px] font-black tracking-[0.3em] uppercase italic">
                          MARKET_SIGINT // PRICE_DYNAMICS
                        </span>
                        <div className="h-px w-10 bg-emerald-600/20" />
                        <span className="text-[10px] font-black text-slate-700 font-mono tracking-widest uppercase italic">v56.2 TITAN</span>
                     </div>
                     <h1 className="text-6xl font-black text-white tracking-tighter uppercase italic skew-x-[-2deg] leading-none">
                       ПОРІВНЯННЯ <span className="text-emerald-600 underline decoration-emerald-600/20 decoration-8 italic uppercase">ЦІН</span>
                     </h1>
                     <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.4em] italic opacity-80 leading-none">
                        АНАЛІЗ НАЙКРАЩИХ ПРОПОЗИЦІЙ ТА ДЕМПІНГ-ДЕТЕКЦІЯ
                     </p>
                  </div>
               </div>
             }
             stats={[
               { label: 'ТОВАРІВ_У_БАЗІ', value: '47K', icon: <Box size={14} />, color: 'primary' },
               { label: 'ЕКОНОМІЯ_Σ', value: '28%', icon: <TrendingDown size={14} />, color: 'success', animate: true },
               { label: 'ПРОПОЗИЦІЙ', value: '1.2M', icon: <Layers size={14} />, color: 'warning' }
             ]}
             actions={
               <div className="flex gap-4">
                  <button className="px-10 py-5 bg-emerald-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] italic hover:bg-emerald-600 shadow-2xl transition-all flex items-center gap-4">
                     <Sparkles size={20} /> AI_ПОШУК_ЦІН
                  </button>
               </div>
             }
           />

           {/* SEARCH HUD */}
           <section className="p-8 rounded-[3rem] bg-black border border-white/[0.04] shadow-3xl space-y-6 flex items-center gap-6">
              <div className="relative flex-1 group">
                 <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-emerald-500 transition-colors" size={24} />
                 <input 
                   type="text" placeholder="ПОШУК ТОВАРУ, КАТЕГОРІЇ АБО КОДУ УКТЗЕД..."
                   value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                   className="w-full bg-white/[0.01] border-2 border-white/[0.04] p-5 pl-18 rounded-2xl text-xl font-black text-white italic tracking-tighter focus:border-emerald-500/40 outline-none transition-all placeholder:text-slate-800"
                 />
              </div>
              <button className="p-5 bg-white/[0.04] border border-white/5 rounded-2xl text-slate-400 hover:text-white transition-all"><Filter size={24} /></button>
              <button className="p-5 bg-white/[0.04] border border-white/5 rounded-2xl text-slate-400 hover:text-white transition-all"><Download size={24} /></button>
           </section>

           {/* PRODUCTS GRID */}
           <div className="space-y-10">
              {MOCK_PRODUCTS.map((product) => (
                <div key={product.id} className="p-10 rounded-[4rem] bg-black border-2 border-white/[0.04] shadow-3xl space-y-8 overflow-hidden">
                   <div className="flex items-center justify-between pb-8 border-b border-white/[0.04]">
                      <div className="flex items-center gap-8">
                         <div className="p-6 bg-emerald-600/10 border border-emerald-600/30 rounded-[2rem] text-emerald-500">
                            <Package size={32} />
                         </div>
                         <div className="space-y-1">
                            <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">{product.name}</h3>
                            <div className="flex items-center gap-4 text-[10px] font-black text-slate-700 uppercase italic tracking-widest">
                               <span>КАТЕГОРІЯ: {product.category}</span>
                               <span className="text-slate-800">|</span>
                               <span>УКТЗЕД: {product.hsCode}</span>
                            </div>
                         </div>
                      </div>
                      <div className="flex items-center gap-10">
                         <div className="text-right">
                            <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest italic mb-1">СЕРЕДНЯ_ЦІНА</p>
                            <p className="text-3xl font-black text-white italic font-mono tracking-tighter">{formatPrice(product.avgPrice)}</p>
                         </div>
                         <div className="p-6 bg-emerald-600 text-black rounded-[1.8rem] text-center min-w-[140px] shadow-2xl">
                            <p className="text-3xl font-black italic font-mono tracking-tighter leading-none">-{(((Math.max(...product.offers.map(o => o.price)) - Math.min(...product.offers.map(o => o.price))) / Math.max(...product.offers.map(o => o.price))) * 100).toFixed(0)}%</p>
                            <p className="text-[9px] font-black uppercase tracking-widest leading-none mt-1">ОПТІМ_DEAL</p>
                         </div>
                         <button onClick={() => setExpandedProduct(expandedProduct === product.id ? null : product.id)} className="p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all">
                            {expandedProduct === product.id ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                         </button>
                      </div>
                   </div>

                   <AnimatePresence>
                      {expandedProduct === product.id && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-6">
                           <div className="grid grid-cols-1 gap-4">
                              {product.offers.map((offer, idx) => (
                                <div key={offer.id} className={cn("p-8 rounded-[2.5rem] bg-white/[0.01] border-2 transition-all flex items-center justify-between group", offer.isBestPrice ? "border-emerald-600/40 bg-emerald-600/[0.02]" : "border-white/[0.04] hover:border-white/10")}>
                                   <div className="flex items-center gap-8">
                                      <div className={cn("w-12 h-12 rounded-full flex items-center justify-center font-black italic font-mono", idx === 0 ? "bg-amber-600 text-black shadow-xl" : "bg-slate-800 text-slate-500")}>
                                         0{idx+1}
                                      </div>
                                      <div className="space-y-1">
                                         <div className="flex items-center gap-3">
                                            <h4 className="text-xl font-black text-white italic uppercase tracking-tighter group-hover:text-emerald-400 transition-colors leading-none">{offer.supplierName}</h4>
                                            {offer.isVerified && <BadgeCheck size={18} className="text-cyan-500" />}
                                            {offer.isBestPrice && <span className="bg-emerald-600 text-black px-3 py-1 rounded-full text-[8px] font-black italic uppercase tracking-widest">BEST_VALUE</span>}
                                         </div>
                                         <div className="flex items-center gap-4 text-[9px] font-black text-slate-700 uppercase italic tracking-widest">
                                            <span className="flex items-center gap-1"><Globe size={12} /> {offer.country}</span>
                                            <span className="flex items-center gap-1"><Clock size={12} /> {offer.leadTime} ДНІВ</span>
                                            <span className="flex items-center gap-1"><Layers size={12} /> ВІД {offer.minQuantity} {product.unit}</span>
                                         </div>
                                      </div>
                                   </div>
                                   <div className="flex items-center gap-16">
                                      <div className="text-center">
                                         <div className={cn("text-2xl font-black font-mono italic", offer.reliability >= 95 ? "text-emerald-500" : "text-amber-500")}>{offer.reliability}%</div>
                                         <p className="text-[8px] font-black text-slate-800 uppercase tracking-widest leading-none">НАДІЙНІСТЬ</p>
                                      </div>
                                      <div className="text-right">
                                         <p className="text-3xl font-black text-white italic font-mono tracking-tighter leading-none">{formatPrice(offer.price)}</p>
                                         <p className={cn("text-[9px] font-black italic mt-1", offer.price < product.avgPrice ? "text-emerald-500" : "text-rose-500")}>
                                            {offer.price < product.avgPrice ? <TrendingDown size={14} className="inline mr-1" /> : <TrendingUp size={14} className="inline mr-1" />}
                                            {Math.abs(((offer.price - product.avgPrice) / product.avgPrice) * 100).toFixed(1)}% ВІД СЕРЕДНЬОЇ
                                         </p>
                                      </div>
                                      <button className="p-6 bg-emerald-600 text-black rounded-2xl hover:bg-emerald-500 shadow-2xl transition-all">
                                         <ArrowRight size={24} />
                                      </button>
                                   </div>
                                </div>
                              ))}
                           </div>
                        </motion.div>
                      )}
                   </AnimatePresence>
                </div>
              ))}
           </div>
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
            .shadow-3xl { box-shadow: 0 60px 100px -30px rgba(0,0,0,0.8); }
            .no-scrollbar::-webkit-scrollbar { display: none; }
        `}} />
      </div>
    </PageTransition>
  );
}
