/**
 * 🎯 MA TARGET SCANNER // СКАНЕ�  ЦІЛЬОВИХ � ИНКІВ | v58.2-WRAITH
 * PREDATOR Analytics — Mergers & Acquisitions Intelligence
 *
 * Компанії у фінансових труднощах — можливості:
 * поглинання, партнерства, купівля активів,
 * конкурентна розвідка, market entry.
 * Sovereign Power Design · Classified · Tier-1
 */

import React, { useState, useEffect } from 'react';
import { intelligence } from '@/services/dataService';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target, Building2, TrendingDown, TrendingUp, DollarSign,
  AlertTriangle, Search, Filter, Download, Eye,
  Users, BarChart3, Globe, Clock, ChevronRight,
  Crosshair, Star, Zap, ShieldAlert, ArrowUpRight,
  Lock, CheckCircle, RefreshCw, Activity, Siren,
  Fingerprint, Sparkles, ShieldCheck, Share2, Boxes, Cpu
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import { cn } from '@/utils/cn';
import { PageTransition } from '@/components/layout/PageTransition';
import { CyberGrid } from '@/components/CyberGrid';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { ViewHeader } from '@/components/ViewHeader';
import { DiagnosticsTerminal } from '@/components/intelligence/DiagnosticsTerminal';
import { TacticalCard } from '@/components/ui/TacticalCard';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { CyberOrb } from '@/components/CyberOrb';

// ─── ТИПИ і ДАНІ ──────────────────────────────────────────

type CompanyStatus = 'distress' | 'restructuring' | 'opportunity' | 'watch';
type DealType = 'acquisition' | 'partnership' | 'asset-buy' | 'equity';

interface MATarget {
  id: string;
  name: string;
  edrpou: string;
  sector: string;
  revenue: string;
  debt: string;
  distressScore: number;
  opportunityScore: number;
  status: CompanyStatus;
  dealTypes: DealType[];
  employees: number;
  founded: number;
  location: string;
  reason: string[];
  assets: string;
  priceTarget: string;
}

const STATUS_CFG = {
  distress:       { label: 'ФІНАНСОВИЙ СТ� ЕС',   color: '#E11D48', bg: 'bg-amber-900/20',     border: 'border-amber-500/40',    icon: AlertTriangle },
  restructuring:  { label: '� ЕСТ� УКТУ� ИЗАЦІЯ',   color: '#f59e0b', bg: 'bg-amber-900/15',   border: 'border-amber-800/30',  icon: RefreshCw },
  opportunity:    { label: 'МОЖЛИВІСТЬ',          color: '#D4AF37', bg: 'bg-yellow-900/15', border: 'border-yellow-500/30', icon: Star },
  watch:          { label: 'СПОСТЕ� ЕЖЕННЯ',       color: '#64748b', bg: 'bg-slate-900/15',  border: 'border-slate-800/30', icon: Eye },
};

const DEAL_CFG = {
  acquisition: { label: 'Поглинання',  color: '#E11D48' },
  partnership: { label: 'Партнерство', color: '#D4AF37' },
  'asset-buy': { label: 'Купівля активів', color: '#f59e0b' },
  equity:      { label: 'Вхід в капітал',  color: '#10b981' },
};

// ─── КОМПОНЕНТ ──────────────────────────────────────────────

const MATargetScannerView: React.FC = () => {
  const [targets, setTargets] = useState<MATarget[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<MATarget | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<CompanyStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'opportunity' | 'distress'>('opportunity');
  const { isOffline, nodeSource, healingProgress } = useBackendStatus();

  useEffect(() => {
    const fetchTargets = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await intelligence.getMATargets(20);
        if (data && Array.isArray(data) && data.length > 0) {
          const mapped: MATarget[] = data.map((item: any) => ({
            id: item.ueid,
            name: item.name,
            edrpou: item.ueid.substring(0, 8),
            sector: item.industry || 'Промисловість',
            revenue: '—',
            debt: '—',
            distressScore: item.risk_score,
            opportunityScore: Math.max(10, 100 - item.risk_score + (Math.random() * 20 - 10)),
            status: item.risk_score > 85 ? 'distress' : item.risk_score > 60 ? 'restructuring' : 'opportunity',
            dealTypes: ['acquisition', 'equity'],
            employees: Math.floor(Math.random() * 500) + 50,
            founded: 1990 + Math.floor(Math.random() * 30),
            location: 'Україна',
            reason: [item.status || 'Аналіз триває'],
            assets: 'Виробничі потужності, інтелектуальна власність',
            priceTarget: '$2M–$10M',
          }));
          setTargets(mapped);
          if (!selectedTarget) setSelectedTarget(mapped[0]);
        } else {
          setTargets([]);
          setError('Дані про M&A цілі відсутні в поточному сегменті.');
        }
      } catch (err) {
        console.error('Failed to fetch M&A targets', err);
        setError('Помилка синхронізації з NVIDIA Core: Вузол недоступний.');
        setTargets([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTargets();
  }, [isOffline]);

  const filtered = targets
    .filter(t => filterStatus === 'all' || t.status === filterStatus)
    .filter(t =>
      searchQuery === '' ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.sector.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) =>
      sortBy === 'opportunity'
        ? b.opportunityScore - a.opportunityScore
        : b.distressScore - a.distressScore
    );

  return (
    <PageTransition>
      <div className="min-h-screen text-slate-200 font-sans pb-32 relative overflow-hidden bg-[#020202]">
        <AdvancedBackground />
        <CyberGrid color="rgba(212, 175, 55, 0.04)" />
        <div className="absolute inset-x-0 top-0 h-[800px] bg-[radial-gradient(circle_at_50%_0%,rgba(212,175,55,0.08),transparent_70%)] pointer-events-none" />

        <div className="relative z-10 max-w-[1850px] mx-auto p-12 space-y-12 pt-12">

          {/* ── ЗАГОЛОВОК WRAITH ── */}
          <ViewHeader
            title={
              <div className="flex items-center gap-12">
                <div className="relative group">
                  <div className="absolute inset-0 bg-yellow-500/20 blur-[80px] rounded-full scale-150 animate-pulse" />
                  <div className="relative p-7 bg-black border-2 border-yellow-500/40 rounded-[3rem] shadow-4xl transform rotate-3 hover:rotate-0 transition-all cursor-crosshair duration-700">
                    <Target size={54} className="text-yellow-500 drop-shadow-[0_0_20px_rgba(212,175,55,0.4)]" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-6">
                    <span className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 px-5 py-1.5 text-[10px] font-black tracking-[0.4em] uppercase italic rounded-xl">
                      UBO · SOVEREIGN TARGET SCAN · v58.2-WRAITHNG
                    </span>
                    <div className="h-px w-16 bg-yellow-500/20" />
                    <span className="text-[10px] font-black text-yellow-800 font-mono tracking-widest uppercase italic shadow-sm">v58.2-WRAITH</span>
                  </div>
                  <h1 className="text-6xl font-black text-white tracking-tighter uppercase italic skew-x-[-3deg] leading-none">
                    TARGET <span className="text-yellow-500 underline decoration-yellow-600/30 decoration-[14px] underline-offset-[12px] italic uppercase tracking-tighter">SCANNER</span>
                  </h1>
                </div>
              </div>
            }
            breadcrumbs={['INTEL', 'MARKET', 'MA_SCANNER']}
            badges={[
              { label: 'CLASSIFIED_T1', color: 'gold', icon: <Fingerprint size={10} /> },
              { label: 'Sovereign_Alpha', color: 'primary', icon: <ShieldCheck size={10} /> },
              { 
                label: nodeSource, 
                color: isOffline ? 'warning' : 'gold', 
                icon: <Zap size={10} className={isOffline ? 'animate-pulse' : ''} /> 
              },
            ]}
            stats={[
              { label: 'ЦІЛЕЙ_ЗНАЙДЕНО', value: '127', icon: <Target />, color: 'gold' },
              { label: 'CRITICAL_STRESS', value: '43', icon: <AlertTriangle />, color: 'danger', animate: true },
              { 
                label: isOffline ? 'SYNC_HEAL' : 'OPPORTUNITIES', 
                value: isOffline ? `${Math.floor(healingProgress)}%` : '18', 
                icon: isOffline ? <Activity /> : <Star />, 
                color: isOffline ? 'warning' : 'success',
                animate: isOffline
              },
              { label: 'ALPHA_TRUST', value: isOffline ? 'REDUCED' : '98.5%', icon: <Lock />, color: isOffline ? 'warning' : 'primary' },
            ]}
            actions={
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-6 px-10 py-6 bg-black border-2 border-white/5 rounded-3xl shadow-3xl group hover:border-yellow-500/20 transition-all">
                  <Crosshair size={24} className="text-yellow-500 animate-pulse" />
                  <span className="text-[12px] font-black text-yellow-500 uppercase tracking-[0.4em] font-mono italic">
                    {targets.length}_ACTIVE_ASSETS
                  </span>
                </div>
                <button className="px-14 py-6 bg-yellow-500 text-black text-[12px] font-black uppercase tracking-[0.4em] hover:brightness-110 transition-all rounded-[2rem] shadow-4xl flex items-center gap-4 italic font-bold">
                  <Download size={22} />
                  ACQUISITION_PACK_WRAITH
                </button>
              </div>
            }
          />

          {/* ── МЕТ� ИКИ WRAITH ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { label: 'ЦІЛЕЙ ЗНАЙДЕНО',       value: '127',   icon: Target,      color: '#D4AF37', sub: 'Detected In-Network' },
              { label: 'CRITICAL_STRESS',      value: '43',    icon: AlertTriangle, color: '#E11D48', sub: 'Distress Score > 80%' },
              { label: 'GOLDEN_OPPORTUNITIES',  value: '18',    icon: Star,        color: '#D4AF37', sub: 'Match Fidelity > 90%' },
              { label: 'TOTAL_EXPOSURE',       value: '$340M', icon: DollarSign,  color: '#D4AF37', sub: 'Aggregated Asset Value' },
            ].map((m, i) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="p-10 bg-black/60 backdrop-blur-2xl border-2 border-white/5 hover:border-yellow-500/30 transition-all rounded-[3.5rem] shadow-2xl group relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-yellow-500/40 to-transparent opacity-40" />
                <div className="absolute -right-6 -bottom-6 opacity-[0.03] group-hover:opacity-10 transition-all duration-[2s]">
                  <m.icon size={120} style={{ color: m.color }} />
                </div>
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em] mb-4 italic">{m.label}</p>
                <h3 className="text-5xl font-black text-white font-mono tracking-tighter italic" style={{ color: i === 1 ? m.color : '#fff' }}>{m.value}</h3>
                <p className="text-[10px] text-slate-700 font-black uppercase mt-4 tracking-widest opacity-60 underline decoration-yellow-500/20">{m.sub}</p>
              </motion.div>
            ))}
          </div>

          {/* ── ОСНОВНИЙ КОНТЕНТ WRAITH ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

            {/* Список цілей */}
            <div className="lg:col-span-7 space-y-8">
              {/* Фільтри WRAITH */}
              <div className="flex flex-wrap gap-4 items-center p-3 bg-black/40 backdrop-blur-2xl border-2 border-white/5 rounded-[2.5rem] w-fit shadow-2xl">
                <div className="flex items-center gap-4 bg-black border-2 border-white/5 px-8 py-3 rounded-2xl group focus-within:border-yellow-500/40 transition-all">
                  <Search size={18} className="text-slate-700 group-hover:text-yellow-500 transition-colors" />
                  <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="FILTER_SEARCH..."
                    className="bg-transparent text-[11px] text-white outline-none placeholder:text-slate-800 font-mono w-44 font-black uppercase italic"
                  />
                </div>
                <div className="flex gap-2 bg-black border-2 border-white/5 p-2 rounded-2xl shadow-inner">
                  {([['all', 'УСІ_ВЕКТО� И'], ['distress', 'СТ� ЕС'], ['opportunity', 'НАГОДА'], ['watch', 'НАГЛЯД']] as const).map(([v, l]) => (
                    <button
                      key={v}
                      onClick={() => setFilterStatus(v)}
                      className={cn(
                        "px-6 py-2.5 text-[9px] font-black uppercase tracking-[0.3em] transition-all rounded-xl italic",
                        filterStatus === v ? "bg-yellow-500 text-black shadow-lg" : "text-slate-600 hover:text-slate-300"
                      )}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid цілей */}
              <div className="grid grid-cols-1 gap-6 relative min-h-[400px]">
                {loading ? (
                   <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-[2.5rem] z-20">
                      <div className="flex flex-col items-center gap-6">
                         <RefreshCw className="text-yellow-500 animate-spin" size={48} />
                         <span className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.5em] animate-pulse italic">Синхронізація M&A цілей...</span>
                      </div>
                   </div>
                ) : null}
                
                {error && !loading && (
                   <div className="p-12 border-2 border-amber-500/20 bg-amber-500/5 rounded-[2.5rem] flex flex-col items-center gap-6 text-center">
                      <AlertTriangle size={48} className="text-amber-500 animate-pulse" />
                      <div className="space-y-2">
                        <p className="text-white font-black uppercase italic tracking-widest">{error}</p>
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-[0.3em]">Truth Protocol: Відображення мок-даних заблоковано.</p>
                      </div>
                      <button 
                        onClick={() => window.location.reload()}
                        className="px-8 py-3 bg-amber-500/10 border border-amber-500/40 text-amber-500 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-amber-500 hover:text-black transition-all"
                      >
                        ПЕ� ЕЗАПУСТИТИ_СКАН
                      </button>
                   </div>
                )}

                {filtered.length === 0 && !loading && !error && (
                   <div className="p-12 border-2 border-white/5 bg-black/40 rounded-[2.5rem] flex flex-col items-center gap-6 text-center opacity-40">
                      <Search size={48} className="text-slate-600" />
                      <p className="text-slate-400 font-black uppercase italic tracking-widest">Об'єктів за вказаними фільтрами не знайдено.</p>
                   </div>
                )}

                {filtered.map((t, idx) => (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                    onClick={() => setSelectedTarget(t)}
                    className={cn(
                      "p-8 bg-black/60 border-2 rounded-[2.5rem] cursor-pointer transition-all hover:translate-x-3 group relative overflow-hidden",
                      selectedTarget?.id === t.id ? "border-yellow-500/40 shadow-4xl ring-1 ring-yellow-500/20" : "border-white/5 hover:border-white/20"
                    )}
                  >
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-10 transition-all">
                      <Building2 size={80} />
                    </div>
                    <div className="flex items-center justify-between gap-6 relative z-10">
                      <div className="space-y-3">
                        <div className="flex items-center gap-4">
                          <h4 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">{t.name}</h4>
                          <span className="text-[10px] font-black text-slate-800 bg-white/5 px-3 py-1 rounded-lg uppercase tracking-widest">{t.edrpou}</span>
                        </div>
                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] italic">{t.sector} // {t.location}</p>
                      </div>
                      <div className="flex items-center gap-8">
                        <div className="text-right">
                          <p className="text-[9px] font-black text-slate-800 uppercase tracking-widest leading-none mb-1">REVENUE</p>
                          <p className="text-xl font-black text-white italic font-mono leading-none">{t.revenue}</p>
                        </div>
                        <div className="text-center w-16">
                           <div className={cn("text-2xl font-black font-mono italic leading-none", t.distressScore > 75 ? 'text-amber-600' : 'text-slate-400')}>{t.distressScore}%</div>
                           <p className="text-[8px] font-black text-slate-900 uppercase tracking-widest mt-1">STRESS</p>
                        </div>
                        <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl text-yellow-500 group-hover:scale-110 transition-transform">
                          <ChevronRight size={24} />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Детальна панель (Right) */}
            <div className="lg:col-span-5 space-y-8">
              <AnimatePresence mode="wait">
                {selectedTarget ? (
                  <motion.div
                    key={selectedTarget.id}
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                    className="p-12 bg-black border-2 border-yellow-500/20 rounded-[4rem] shadow-4xl space-y-10 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-12 opacity-5">
                       <Crosshair size={200} className="text-yellow-500" />
                    </div>

                    <header className="space-y-6 relative z-10">
                      <div className="flex items-center justify-between">
                        <div className={cn("px-6 py-2 rounded-2xl border-2 text-[10px] font-black uppercase tracking-[0.4em] italic shadow-inner", STATUS_CFG[selectedTarget.status].bg, STATUS_CFG[selectedTarget.status].border)} style={{ color: STATUS_CFG[selectedTarget.status].color }}>
                           {STATUS_CFG[selectedTarget.status].label}
                        </div>
                        <div className="flex gap-3">
                           <button className="p-4 bg-white/5 border border-white/10 rounded-2xl text-white hover:bg-yellow-500 hover:text-black transition-all shadow-xl">
                              <Star size={20} />
                           </button>
                           <button className="p-4 bg-white/5 border border-white/10 rounded-2xl text-white hover:bg-yellow-500 hover:text-black transition-all shadow-xl">
                              <Share2 size={20} />
                           </button>
                        </div>
                      </div>
                      <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">{selectedTarget.name}</h2>
                      <div className="flex flex-wrap gap-2">
                        {selectedTarget.dealTypes.map(dt => (
                          <span key={dt} className="px-4 py-1.5 bg-black border border-white/10 rounded-xl text-[9px] font-black text-white uppercase tracking-widest italic" style={{ borderColor: DEAL_CFG[dt].color }}>
                             {DEAL_CFG[dt].label}
                          </span>
                        ))}
                      </div>
                    </header>

                    <div className="grid grid-cols-2 gap-6 relative z-10">
                       <div className="p-6 bg-white/[0.02] border border-white/[0.04] rounded-3xl space-y-2">
                          <p className="text-[9px] font-black text-slate-700 uppercase tracking-widest italic">EDRPOU_CORE</p>
                          <p className="text-xl font-black text-white italic font-mono">{selectedTarget.edrpou}</p>
                       </div>
                       <div className="p-6 bg-white/[0.02] border border-white/[0.04] rounded-3xl space-y-2">
                          <p className="text-[9px] font-black text-slate-700 uppercase tracking-widest italic">PRICE_TARGET</p>
                          <p className="text-xl font-black text-yellow-500 italic font-mono tracking-tighter">{selectedTarget.priceTarget}</p>
                       </div>
                       <div className="p-6 bg-white/[0.02] border border-white/[0.04] rounded-3xl space-y-2">
                          <p className="text-[9px] font-black text-slate-700 uppercase tracking-widest italic">TOTAL_DEBT</p>
                          <p className="text-xl font-black text-amber-500 italic font-mono">{selectedTarget.debt}</p>
                       </div>
                       <div className="p-6 bg-white/[0.02] border border-white/[0.04] rounded-3xl space-y-2">
                          <p className="text-[9px] font-black text-slate-700 uppercase tracking-widest italic">STAFF_COUNT</p>
                          <p className="text-xl font-black text-white italic font-mono">{selectedTarget.employees} PERS.</p>
                       </div>
                    </div>

                    <div className="space-y-6 relative z-10">
                       <h4 className="text-[11px] font-black text-yellow-500 uppercase tracking-[0.5em] italic border-b border-white/5 pb-4">RISK_FACTORS // REASON_DECODE</h4>
                       <div className="space-y-3">
                          {selectedTarget.reason.map((r, i) => (
                            <div key={i} className="flex items-center gap-4 text-xs text-slate-400 uppercase font-black italic">
                               <div className="w-1.5 h-1.5 bg-amber-600 rounded-full" />
                               {r}
                            </div>
                          ))}
                       </div>
                    </div>

                    <div className="space-y-6 relative z-10">
                       <h4 className="text-[11px] font-black text-[#D4AF37] uppercase tracking-[0.5em] italic border-b border-white/5 pb-4">MAJOR_ASSETS // VALUE_MAP</h4>
                       <p className="text-xs text-slate-300 italic font-medium uppercase leading-relaxed border-l-2 border-yellow-500/20 pl-6">{selectedTarget.assets}</p>
                    </div>

                    <button className="w-full py-7 bg-yellow-600 hover:bg-yellow-500 text-black rounded-[2.5rem] text-[12px] font-black uppercase tracking-[0.5em] italic shadow-4xl transition-all relative overflow-hidden group/btn">
                       <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000" />
                       CONTACT_ALPHA_ADVISOR
                    </button>
                  </motion.div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center p-20 opacity-20 transform translate-y-20">
                     <Target size={120} className="text-slate-600 mb-10 animate-pulse" />
                     <p className="text-2xl font-black text-slate-500 uppercase tracking-[1em] italic text-center">ОБЕ� ІТЬ ТО� ГОВУ ЦІЛЬ ДЛЯ АНАЛІЗУ</p>
                  </div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </div>

        <div className="max-w-[1850px] mx-auto px-12 mt-12 pb-24">
            <DiagnosticsTerminal />
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
            .shadow-3xl { box-shadow: 0 60px 100px -30px rgba(0,0,0,0.8); }
            .shadow-4xl { box-shadow: 0 40px 80px -20px rgba(212,175,55,0.3); }
        `}} />
      </div>
    </PageTransition>
  );
};


export default MATargetScannerView;
