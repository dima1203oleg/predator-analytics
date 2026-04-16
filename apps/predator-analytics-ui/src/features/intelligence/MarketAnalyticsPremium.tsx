/**
 * 📊 MARKET ANALYTICS PREMIUM // РИНКОВА АНАЛІТИКА | v56.5-ELITE
 * PREDATOR Analytics — Advanced Market Intelligence & Strategic Forecasting
 * 
 * Глобальний моніторинг ринків, аналіз трендів та виявлення прихованих можливостей.
 * Sovereign Power Design · Tactical · Tier-1
 * 
 * © 2026 PREDATOR Analytics — HR-04 (100% українська)
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, TrendingDown, BarChart3, PieChart, LineChart,
  ArrowUpRight, ArrowDownRight, Package, DollarSign, Globe,
  Building2, Calendar, Filter, Download, Sparkles, Target,
  Eye, Bell, Crown, ChevronRight, ChevronDown, Search,
  Layers, Zap, AlertTriangle, CheckCircle, Activity, RefreshCw,
  Cpu, Orbit, Database, Crosshair, Scan, Microscope, Fingerprint,
  Boxes, LayoutDashboard, Shield
} from 'lucide-react';
import { marketApi } from '@/features/market';
import { MarketOverviewResponse, TopProduct } from '@/features/market/types';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/utils/cn';
import { PageTransition } from '@/components/layout/PageTransition';
import { CyberGrid } from '@/components/CyberGrid';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { TacticalCard } from '@/components/TacticalCard';
import { CyberOrb } from '@/components/CyberOrb';
import { HoloContainer } from '@/components/HoloContainer';
import { ViewHeader } from '@/components/ViewHeader';

interface Opportunity {
  id: string;
  type: 'price_drop' | 'new_supplier' | 'trend' | 'gap';
  title: string;
  description: string;
  potentialSaving: number;
  confidence: number;
  urgency: 'high' | 'medium' | 'low';
}

const formatCurrency = (value: number): string => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value}`;
};

export default function MarketAnalyticsPremium() {
  const { persona } = useAppStore();
  const [marketOverview, setMarketOverview] = useState<MarketOverviewResponse | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  const personaLabel = useMemo(() => {
    const labels: Record<string, string> = {
      BUSINESS: 'Corporate Alpha',
      GOVERNMENT: 'State Monitor',
      INTELLIGENCE: 'Signal Hunter',
      BANKING: 'Liquidity Core',
      MEDIA: 'Public Pulse'
    };
    return labels[persona] || 'Standard';
  }, [persona]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const overview = await marketApi.getOverview(timeRange === 'month' ? 'last_30_days' : 'last_year');
      setMarketOverview(overview);
      
      // Mock opportunities based on trends
      setOpportunities([
        { 
          id: '1', type: 'trend', title: 'ЗНИЖЕННЯ ЛОГІСТИЧНИХ ВИТРАТ', 
          description: 'Оптимізація морських перевезень з Китаю дає 15% економії.', 
          potentialSaving: 420000, confidence: 94, urgency: 'high' 
        },
        { 
          id: '2', type: 'price_drop', title: 'АНОМАЛЬНА ЦІНА: ПАЛИВО', 
          description: 'Виявлено демпінг у портах Одеси. Рекомендовано закупівлю.', 
          potentialSaving: 850000, confidence: 88, urgency: 'medium' 
        }
      ]);
    } catch (err) {
      console.error("Failed to fetch market data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  const stats = useMemo(() => ({
    volume: marketOverview?.total_value_usd || 0,
    growth: 12.4, // Mock or calculate from historical
    segments: marketOverview?.top_products.length || 0,
    ops: 2
  }), [marketOverview]);

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#020202] text-slate-200 relative overflow-hidden font-sans pb-40 px-4 xl:px-12 pt-12">
        <AdvancedBackground />
        <CyberGrid color="rgba(212, 175, 55, 0.04)" />
        <div className="absolute inset-x-0 top-0 h-[800px] bg-[radial-gradient(circle_at_50%_0%,rgba(212,175,55,0.08),transparent_70%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(225,29,72,0.04),transparent_60%)] pointer-events-none" />

        <div className="relative z-10 max-w-[1850px] mx-auto space-y-16 flex flex-col items-stretch">
          
          {/* ELITE HEADER HUD */}
          <ViewHeader
            title={
              <div className="flex items-center gap-12">
                <div className="relative group">
                  <div className="absolute inset-0 bg-yellow-600/20 blur-[80px] rounded-full scale-150 animate-pulse" />
                  <div className="relative p-8 bg-black border-2 border-yellow-500/40 rounded-[3rem] shadow-4xl transform -rotate-3 hover:rotate-0 transition-all duration-700">
                    <BarChart3 size={48} className="text-[#D4AF37] shadow-[0_0_30px_#D4AF37]" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-6">
                    <span className="bg-yellow-500/10 border border-yellow-500/20 text-[#D4AF37] px-5 py-1.5 text-[10px] font-black tracking-[0.4em] uppercase italic rounded-xl">
                      MARKET_INTEL_ELITE // QUORUM_SCAN
                    </span>
                    <div className="h-px w-16 bg-yellow-500/20" />
                    <span className="text-[10px] font-black text-yellow-800 font-mono tracking-widest uppercase italic shadow-sm">v56.5-ELITE</span>
                  </div>
                  <h1 className="text-7xl font-black text-white tracking-tighter uppercase italic skew-x-[-4deg] leading-none">
                    РИНКОВА <span className="text-[#D4AF37] underline decoration-[#D4AF37]/30 decoration-[16px] underline-offset-[16px] italic uppercase tracking-tighter">АНАЛІТИКА</span>
                  </h1>
                </div>
              </div>
            }
            breadcrumbs={['INTEL', 'MARKET', 'STRATEGIC_SCAN']}
            badges={[
              { label: 'QUORUM_VERIFIED', color: 'gold', icon: <Crown size={10} /> },
              { label: 'LIVE_SIGNAL', color: 'primary', icon: <Activity size={10} /> },
            ]}
            stats={[
              { label: 'МАРЖИНАЛЬНІСТЬ', value: '14.2%', icon: <TrendingUp />, color: 'success' },
              { label: 'SIGNAL_DECODE', value: 'SYNC', icon: <Zap />, color: 'warning' },
              { label: 'ALPHA_TRUST', value: '98.4%', icon: <Shield />, color: 'primary' },
              { label: 'NODES_ACTIVE', value: '1,248', icon: <Globe />, color: 'primary' },
            ]}
          />
          <div className="flex justify-end">
            <button
              onClick={() => fetchData()}
              disabled={loading}
              className={cn(
                "p-7 bg-black border-2 border-white/[0.04] rounded-[2rem] text-slate-500 hover:text-[#D4AF37] transition-all shadow-4xl group/btn",
                loading && "animate-spin cursor-not-allowed opacity-50"
              )}
            >
              <RefreshCw size={32} className={cn("transition-transform duration-700", !loading && "group-hover/btn:rotate-180")} />
            </button>
          </div>

          {/* METRICS GRID ELITE */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { label: 'ОБСЯГ_РИНКУ', value: formatCurrency(stats.volume), icon: Boxes, color: '#D4AF37' },
                { label: 'СЕРЕДНЄ_ЗРОСТАННЯ', value: `+${stats.growth}%`, icon: TrendingUp, color: '#22c55e' },
                { label: 'АКТИВНІ_СЕГМЕНТИ', value: stats.segments, icon: Layers, color: '#3b82f6' },
                { label: 'AI_МОЖЛИВОСТІ', value: stats.ops, icon: Sparkles, color: '#f59e0b' },
              ].map((m, i) => (
                <div key={i} className="p-10 rounded-[4rem] bg-black border-2 border-white/[0.03] shadow-4xl group relative overflow-hidden transition-all hover:border-yellow-500/30">
                  <div className="absolute -top-6 -right-6 p-10 opacity-[0.03] group-hover:opacity-[0.1] transition-all duration-700">
                    <m.icon size={120} style={{ color: m.color }} />
                  </div>
                  <div className="relative z-10 space-y-4">
                     <p className="text-[11px] font-black text-slate-800 uppercase tracking-[0.3em] italic leading-none">{m.label}</p>
                     <h3 className="text-5xl font-black text-white italic font-mono tracking-tighter leading-none" style={{ color: i === 0 ? '#D4AF37' : '#fff' }}>{m.value}</h3>
                  </div>
                </div>
              ))}
          </section>

          {/* MAIN CONTENT GRID */}
          <div className="grid grid-cols-12 gap-12">
            
            {/* SEGMENTS COLUMN */}
            <div className="col-span-12 xl:col-span-8 space-y-12">
               <div className="p-16 rounded-[5rem] bg-black border-2 border-white/[0.04] shadow-4xl space-y-12 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-16 opacity-[0.02]">
                     <Orbit size={320} className="text-yellow-500 animate-spin-slow" />
                  </div>
                  <div className="flex items-center justify-between border-b-2 border-white/[0.04] pb-10 relative z-10">
                     <h3 className="text-2xl font-black text-white italic uppercase tracking-[0.5em] flex items-center gap-6">
                        <Database size={32} className="text-[#D4AF37]" /> ДЕТАЛІЗАЦІЯ_ТОВАРНИХ_ГРУП
                     </h3>
                     <div className="flex gap-4">
                        <div className="relative">
                           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700" size={16} />
                           <input type="text" placeholder="FILTER_CODE..." className="pl-12 pr-6 py-3 bg-white/[0.02] border border-white/5 rounded-2xl text-[10px] font-black italic uppercase tracking-widest text-[#D4AF37] focus:outline-none focus:border-yellow-500/30 transition-all" />
                        </div>
                     </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-8 relative z-10 max-h-[1400px] overflow-y-auto no-scrollbar pr-4">
                     {loading ? (
                       Array(4).fill(0).map((_, i) => <div key={i} className="h-40 rounded-[3rem] bg-white/[0.02] animate-pulse border-2 border-white/5" />)
                     ) : (
                       marketOverview?.top_products.map((product) => (
                         <div key={product.code} className="p-10 rounded-[4rem] bg-white/[0.01] border-2 border-white/[0.03] hover:bg-yellow-500/[0.02] hover:border-yellow-500/30 transition-all duration-700 group cursor-pointer relative overflow-hidden">
                            <div className="flex items-center justify-between">
                               <div className="flex items-center gap-10">
                                  <div className="p-6 bg-black border-2 border-white/[0.05] rounded-[2.5rem] text-[#D4AF37] group-hover:bg-yellow-600/10 group-hover:border-yellow-500/30 transition-all shadow-inner">
                                     <Package size={32} />
                                  </div>
                                  <div className="space-y-3">
                                     <h4 className="text-3xl font-black text-white italic uppercase tracking-tighter group-hover:text-[#D4AF37] transition-all leading-none">{product.name}</h4>
                                     <div className="flex gap-10 text-[11px] font-black text-slate-800 uppercase italic tracking-widest leading-none font-mono">
                                        <span className="flex items-center gap-2">CODEX: <span className="text-slate-400">{product.code}</span></span>
                                        <span className="flex items-center gap-2 pb-1 border-b border-yellow-500/20"><Building2 size={12} className="text-[#D4AF37]" /> ГРАВЦІВ: {Math.floor(Math.random() * 50) + 10}</span>
                                     </div>
                                  </div>
                               </div>
                               <div className="text-right space-y-1">
                                  <p className="text-4xl font-black text-white italic font-mono tracking-tighter leading-none mb-1 group-hover:scale-105 transition-transform duration-700">{formatCurrency(product.value_usd)}</p>
                                  <div className={cn("flex items-center justify-end gap-2 text-[10px] font-black uppercase tracking-widest italic", product.change_percent >= 0 ? "text-emerald-500" : "text-rose-500")}>
                                     {product.change_percent >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                     {product.change_percent}% GROWTH
                                  </div>
                               </div>
                            </div>
                         </div>
                       ))
                     )}
                  </div>
               </div>
            </div>

            {/* AI HUB & NEURAL INTEL */}
            <div className="col-span-12 xl:col-span-4 space-y-12">
               
               {/* NEURAL INTEL HUB */}
               <div className="p-12 rounded-[5rem] bg-gradient-to-br from-yellow-700/10 to-yellow-900/10 border-4 border-yellow-600/20 shadow-4xl space-y-10 relative overflow-hidden group/ai">
                  <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover/ai:opacity-[0.1] transition-opacity duration-1000">
                     <Microscope size={180} className="text-yellow-500 animate-pulse" />
                  </div>
                  <div className="flex items-center gap-6 border-b-2 border-white/[0.05] pb-8 relative z-10">
                    <CyberOrb size="sm" status="active" />
                    <div className="space-y-1">
                       <h3 className="text-xl font-black text-white italic uppercase tracking-[0.5em]">NEURAL Intelligence</h3>
                       <p className="text-[10px] font-bold text-slate-800 uppercase tracking-[0.3em] font-mono italic">SIGNAL_PREDICTION_ENGINE</p>
                    </div>
                  </div>
                  
                  <div className="space-y-6 relative z-10 pt-4">
                     <div className="p-8 rounded-[3rem] bg-black/60 border-2 border-yellow-500/20 shadow-inner group/msg">
                        <p className="text-[11px] font-black text-yellow-500 uppercase tracking-[0.3em] italic mb-4 flex items-center gap-3">
                           <Zap size={14} /> AI_РЕКОМЕНДАЦІЯ_СИСТЕМИ
                        </p>
                        <p className="text-lg font-black text-slate-200 italic leading-snug tracking-tight">
                           "Глобальний аналіз вказує на зміщення ліквідності в сегменті {marketOverview?.top_products[0]?.name || 'Alpha'}. Рекомендовано переглянути стратегію закупівель на Q3 2026."
                        </p>
                        <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
                           <span className="text-[9px] font-black text-yellow-800 uppercase tracking-widest">Confidence: 94.2%</span>
                           <span className="text-[9px] font-bold text-slate-700 italic">Predator Intel v56.5</span>
                        </div>
                     </div>

                     <div className="space-y-4 pt-6 italic font-black">
                        <h4 className="text-[10px] text-slate-700 uppercase tracking-[0.4em] mb-4">AI_ТРАЄКТОРІЇ_ТА_МОЖЛИВОСТІ</h4>
                        {opportunities.map((opp) => (
                           <div key={opp.id} className="p-8 rounded-[2.5rem] bg-black/40 border-2 border-white/[0.03] hover:border-yellow-500/30 transition-all group/opp cursor-pointer">
                              <div className="flex items-center justify-between mb-4">
                                 <span className={cn("text-[9px] px-3 py-1 rounded-lg uppercase tracking-widest", opp.urgency === 'high' ? "bg-rose-500/10 text-rose-500 border border-rose-500/20" : "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20")}>{opp.type}</span>
                                 <span className="text-slate-800 font-mono text-[9px]">CONF: {opp.confidence}%</span>
                              </div>
                              <h5 className="text-lg text-white mb-2 leading-none uppercase">{opp.title}</h5>
                              <p className="text-[11px] text-slate-500 leading-relaxed uppercase tracking-tight">{opp.description}</p>
                              {opp.potentialSaving > 0 && (
                                <div className="mt-4 text-[10px] text-emerald-500 flex items-center gap-2">
                                   <DollarSign size={12} /> ПОТЕНЦІАЛ: {formatCurrency(opp.potentialSaving)}
                                </div>
                              )}
                           </div>
                        ))}
                     </div>
                  </div>
                  
                  <button className="w-full py-8 bg-[#D4AF37] text-black rounded-[2.5rem] text-[12px] font-black uppercase tracking-[0.5em] italic shadow-4xl hover:bg-yellow-400 hover:scale-[1.02] active:scale-95 transition-all duration-500 relative z-10">
                     ПЕРЕГЛЯНУТИ_ПОВНИЙ_AI_ЗВІТ
                  </button>
               </div>

               {/* QUICK ACTIONS ELITE */}
               <div className="p-12 rounded-[5rem] bg-black border-2 border-white/[0.04] shadow-4xl space-y-12 relative overflow-hidden">
                  <h3 className="text-[14px] font-black text-slate-700 italic uppercase tracking-[0.6em] border-b border-white/[0.03] pb-8 relative z-10 flex items-center justify-between">
                     ТАКТИЧНІ_МАНЕВРИ <Crosshair size={18} />
                  </h3>
                  <div className="space-y-6 relative z-10 pt-4 font-black">
                     {[
                       { i: LayoutDashboard, l: 'МАПРИЦЯ_ТРЕНДІВ', c: 'text-[#D4AF37]', sub: 'TREND_MATRIX_PRO' },
                       { i: Target, l: 'ВЕРТИКАЛЬНИЙ_АНАЛІЗ', c: 'text-blue-500', sub: 'VERTICAL_DEEP_DIVE' },
                       { i: Globe, l: 'ГЛОБАЛЬНІ_ПОТОКИ', c: 'text-emerald-500', sub: 'FLOW_SYNC_MASTER' },
                       { i: Fingerprint, l: 'ІНСАЙТИ_КОНКУРЕНТІВ', c: 'text-rose-500', sub: 'SIGNAL_HUNTER' },
                     ].map((a, i) => (
                       <button key={i} className="w-full flex items-center justify-between p-8 rounded-[3rem] bg-white/[0.01] border-2 border-white/[0.03] hover:bg-white/[0.04] hover:border-yellow-500/20 transition-all duration-500 group/act shadow-xl italic uppercase">
                          <div className="flex items-center gap-8">
                             <div className="p-4 rounded-2xl bg-black border-2 border-white/[0.03] group-hover/act:border-yellow-500/30 transition-all">
                                <a.i size={24} className={a.c} />
                             </div>
                             <div className="text-left">
                                <span className="text-[13px] font-black text-slate-400 uppercase italic tracking-[0.2em] group-hover:text-white transition-colors leading-none">{a.l}</span>
                                <p className="text-[9px] text-slate-800 uppercase tracking-widest mt-1 font-mono">{a.sub}</p>
                             </div>
                          </div>
                          <ChevronRight size={20} className="text-slate-900 group-hover/act:text-yellow-500 transition-all group-hover/act:translate-x-2" />
                       </button>
                     ))}
                  </div>
               </div>
            </div>

          </div>
        </div>

        {/* ELITE CUSTOM STYLES */}
        <style dangerouslySetInnerHTML={{ __html: `
            .shadow-4xl { box-shadow: 0 80px 150px -40px rgba(0,0,0,0.95), 0 0 100px rgba(212,175,55,0.02); }
            .animate-spin-slow { animation: spin 20s linear infinite; }
            @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            .no-scrollbar::-webkit-scrollbar { display: none; }
            .custom-scrollbar::-webkit-scrollbar { width: 4px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(212, 175, 55, 0.2); border-radius: 10px; }
        `}} />
      </div>
    </PageTransition>
  );
}
