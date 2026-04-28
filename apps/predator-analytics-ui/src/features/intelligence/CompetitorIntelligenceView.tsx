
/**
 * 🎯 Competitor Intelligence View v58.2-WRAITH
 * "Strategic Competitor Nexus Matrix"
 * Sovereign Power Design · Tactical Market Domination · Tier-1
 *
 * Стратегічний аналіз конкурентів на основі митних даних, OSINT та нейронних прогнозів.
 * 
 * © 2026 PREDATOR Analytics — HR-04 (100% українська)
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Filter, Download,
  TrendingUp, TrendingDown, Building2, Package,
  DollarSign, Globe, Star, StarOff, ChevronRight,
  ChevronDown, BarChart3, Bell, ArrowUpRight, ArrowDownRight,
  Target, Crown, Layers, Zap, MoreHorizontal, FileText, Share2, Eye,
  ShieldAlert, Activity, Cpu, Briefcase, Network, ExternalLink,
  Radar, Scan, ZapOff, Fingerprint, Crosshair
} from 'lucide-react';
import { intelligenceApi } from '@/services/api';
import { ViewHeader } from '@/components/ViewHeader';
import { cn } from '@/utils/cn';
import { DataSkeleton } from '@/components/shared/DataSkeleton';
import { TacticalCard } from '@/components/ui/TacticalCard';
import { CyberOrb } from '@/components/CyberOrb';
import { HoloContainer } from '@/components/HoloContainer';
import { PageTransition } from '@/components/layout/PageTransition';
import AIInsightsHub from '@/features/ai/AIInsightsHub';
import { Badge } from '@/components/ui/badge';
import { useBackendStatus } from '@/hooks/useBackendStatus';

// --- LOCALIZATION ---
const localLocales = {
  title: 'СТРАТЕГІЧНИЙ НЕКСУС КОНКУ ЕНТІВ',
  breadcrumbs: ['РОЗВІДКА', 'МАТ ИЦЯ  ИНКУ', 'v58.2.WRAITH'],
  stats: {
    database: 'БАЗА ДАНИХ',
    monitoring: 'МОНІТО ИНГ',
    risk: 'РІВЕНЬ ЗАГ ОЗ',
  },
  filters: {
    placeholder: 'Пошук сутностей за назвою, ЄД ПОУ або доменом...',
    sort: {
      volume: 'ЗА ОБСЯГОМ',
      share: 'ЗА ЧАСТКОЮ',
      trend: 'ЗА ДИНАМІКОЮ',
    },
    btn: 'ФІЛЬТ И',
  },
  card: {
    tracked: 'ПЕ ЕБУВАЄ ПІД НАГЛЯДОМ',
    highRisk: 'ВИСОКИЙ РИЗИК СИНЕ ГІЇ',
    geography: 'ГЕОГ АФІЯ ЕКСПАНСІЇ',
    suppliers: 'ВУЗЛИ ПОСТАЧАННЯ',
    actions: {
      analytics: 'ГЛИБОКА АНАЛІТИКА',
      report: 'ЕКСПОРТ П ОФІЛЮ (PDF)',
      share: 'ПЕ ЕДАТИ ДАНІ',
    }
  },
  empty: {
    title: 'СИГНАЛІВ НЕ ВИЯВЛЕНО',
    subtitle: 'Параметри пошуку не збігаються з жодним активним суб\'єктом ринку',
  },
  aiInsights: {
    title: 'НЕЙРОННИЙ П ОГНОЗ  ИНКУ',
    subtitle: 'Аналіз конкурентного ландшафту в реальному часі',
  }
};

// --- TYPES ---
interface Competitor {
  id: string;
  name: string;
  edrpou: string;
  totalImport: number;
  totalExport: number;
  countries: string[];
  products: string[];
  topSuppliers: string[];
  marketShare: number;
  trend: 'up' | 'down' | 'stable';
  trendPercent: number;
  riskScore: number;
  lastActivity: string;
  isTracked: boolean;
}

// --- COMPONENTS ---

const CompetitorCardWRAITH: React.FC<{
  competitor: Competitor;
  isExpanded: boolean;
  onToggle: () => void;
  onTrack: () => void;
}> = ({ competitor, isExpanded, onToggle, onTrack }) => {
  return (
    <TacticalCard
      variant={isExpanded ? "holographic" : "cyber"}
      glow={competitor.riskScore > 50 ? 'red' : isExpanded ? 'gold' : 'blue'}
      className="transition-all duration-500 border-white/[0.03]"
      noPadding
    >
      <div
        className="p-6 cursor-pointer relative overflow-hidden group"
        onClick={onToggle}
      >
        {/* Background Decorative Element */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full -mr-16 -mt-16 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-5">
            {/* Holographic Avatar */}
            <div className={cn(
              "w-20 h-20 rounded-2xl flex items-center justify-center font-black text-2xl shadow-2xl border transition-all duration-700 relative overflow-hidden",
              competitor.marketShare > 10
                ? "bg-gradient-to-br from-[#D4AF37]/20 to-[#E11D48]/20 text-[#D4AF37] border-[#D4AF37]/40 shadow-[#D4AF37]/10"
                : "bg-black text-slate-500 border-white/5"
            )}>
               {competitor.marketShare > 10 && <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />}
              <Building2 size={32} className={cn("transition-transform duration-700", isExpanded && "scale-110 drop-shadow-[0_0_12px_rgba(212,175,55,0.4)]")} />
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase skew-x-[-2deg] group-hover:text-[#D4AF37] transition-colors duration-400">
                  {competitor.name}
                </h3>
                {competitor.isTracked && (
                  <Badge variant="outline" className="bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/30 text-[10px] font-black tracking-[0.2em] uppercase italic px-3 py-1">
                    {localLocales.card.tracked}
                  </Badge>
                )}
                {competitor.riskScore > 50 && (
                  <Badge variant="outline" className="bg-[#E11D48]/10 text-[#E11D48] border-[#E11D48]/30 text-[10px] font-black tracking-[0.2em] uppercase italic px-3 py-1 flex items-center gap-2">
                    <ShieldAlert size={12} /> {localLocales.card.highRisk} [{competitor.riskScore}%]
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[11px] font-black text-slate-500 uppercase tracking-widest italic">
                <span className="bg-white/[0.01] px-2 py-0.5 rounded border border-white/5 text-[#D4AF37]/80 font-mono tracking-normal">{competitor.edrpou}</span>
                <span className="flex items-center gap-2"><Globe size={13} className="text-[#D4AF37]" /> {(competitor.countries || []).slice(0, 3).join(', ')}</span>
                <span className="flex items-center gap-2"><Package size={13} className="text-amber-500" /> {(competitor.products || []).slice(0, 2).join(', ')}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-8 self-end md:self-center">
            <div className="text-right space-y-1">
              <span className="text-[10px] text-slate-600 font-black tracking-[0.3em] block uppercase italic leading-none"> ИНКОВИЙ ОБСЯГ</span>
              <p className="text-4xl font-black text-white tracking-tighter italic font-mono leading-none">
                ${(((competitor as any).totalImport || (competitor as any).imports || 0) / 1000000).toFixed(1)}M
              </p>
              <div className={cn("flex items-center justify-end gap-1.5 text-[11px] font-black italic uppercase",
                competitor.trend === 'up' ? "text-[#D4AF37]" : competitor.trend === 'down' ? "text-[#E11D48]" : "text-slate-500"
              )}>
                {competitor.trend === 'up' ? <ArrowUpRight size={14} /> : competitor.trend === 'down' ? <ArrowDownRight size={14} /> : <Activity size={12} />}
                <span>{competitor.trend !== 'stable' && (competitor.trendPercent > 0 ? '+' : '')}{competitor.trendPercent}% GROWTH</span>
              </div>
            </div>

            <div className="flex items-center gap-3 border-l border-white/5 pl-6">
              <button
                onClick={(e) => { e.stopPropagation(); onTrack(); }}
                className={cn(
                  "p-4 rounded-2xl transition-all duration-500 border shadow-2xl",
                  competitor.isTracked
                    ? "bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/40 shadow-[#D4AF37]/10"
                    : "bg-black text-slate-700 border-white/5 hover:border-[#D4AF37]/30 hover:text-[#D4AF37]"
                )}
              >
                <Star size={24} fill={competitor.isTracked ? "currentColor" : "none"} strokeWidth={competitor.isTracked ? 1.5 : 2} />
              </button>
              <div className={cn("transition-transform duration-700 text-slate-800 group-hover:text-[#D4AF37]", isExpanded && "rotate-180")}>
                <ChevronDown size={32} />
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Market Share Line */}
        <div className="absolute bottom-0 left-0 h-[3px] w-full bg-slate-900">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${competitor.marketShare}%` }}
            transition={{ duration: 2, ease: [0.23, 1, 0.32, 1] }}
            className="h-full bg-gradient-to-r from-[#D4AF37] via-[#D4AF37] to-white/40 shadow-[0_0_15px_rgba(212,175,55,0.4)]"
          />
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="border-t border-white/5 bg-black/40 relative overflow-hidden"
          >
            {/* Grid Decoration */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.02] pointer-events-none" />

            <div className="p-10 grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
              <div className="space-y-6">
                <h4 className="text-[11px] font-black text-slate-600 uppercase tracking-[0.4em] flex items-center gap-3 italic">
                  <div className="w-2 h-2 bg-[#D4AF37] rounded-full animate-pulse shadow-[0_0_8px_#D4AF37]" />
                  {localLocales.card.geography}
                </h4>
                <div className="flex flex-wrap gap-2.5">
                  {(competitor.countries || []).map(c => (
                    <div key={c} className="px-4 py-3 bg-black border border-white/[0.03] hover:border-[#D4AF37]/30 rounded-xl text-[10px] font-black text-slate-400 transition-all uppercase tracking-widest italic cursor-default hover:text-white shadow-xl">
                      {c}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="text-[11px] font-black text-slate-600 uppercase tracking-[0.4em] flex items-center gap-3 italic">
                  <div className="w-2 h-2 bg-[#D4AF37] rounded-full animate-pulse shadow-[0_0_8px_#D4AF37]" />
                  {localLocales.card.suppliers}
                </h4>
                <ul className="space-y-4">
                  {(competitor.topSuppliers || []).map(s => (
                    <li key={s} className="flex items-center justify-between text-[11px] font-black text-slate-400 group/item border-b border-white/[0.02] pb-3 last:border-0 italic uppercase tracking-wider">
                      <div className="flex items-center gap-3">
                        <Network size={16} className="text-slate-800 group-hover/item:text-[#D4AF37] transition-colors" />
                        <span className="group-hover/item:text-white transition-colors">{s}</span>
                      </div>
                      <button className="text-slate-800 hover:text-[#D4AF37] transition-all p-1.5 rounded-lg hover:bg-white/5">
                        <ExternalLink size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-6">
                <h4 className="text-[11px] font-black text-slate-600 uppercase tracking-[0.4em] flex items-center gap-3 italic">
                  <div className="w-2 h-2 bg-amber-600 rounded-full animate-pulse shadow-[0_0_8px_#f43f5e]" />
                  {localLocales.card.actions.analytics}
                </h4>
                <div className="flex flex-col gap-4">
                  <button className="flex items-center justify-between group/btn px-5 py-5 bg-[#D4AF37]/5 hover:bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-2xl transition-all duration-400 shadow-2xl">
                    <div className="flex items-center gap-4">
                      <BarChart3 size={20} className="text-[#D4AF37]" />
                      <span className="text-[11px] font-black text-[#D4AF37] uppercase tracking-[0.2em] italic">{localLocales.card.actions.analytics}</span>
                    </div>
                    <ArrowUpRight size={18} className="text-[#D4AF37]/50 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                  </button>

                  <button className="flex items-center gap-4 px-5 py-5 bg-black border border-white/5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] italic text-slate-500 hover:text-white hover:border-white/20 transition-all shadow-xl">
                    <FileText size={20} className="text-amber-500" /> {localLocales.card.actions.report}
                  </button>

                  <button className="flex items-center gap-4 px-5 py-5 bg-black border border-white/5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] italic text-slate-500 hover:text-white hover:border-white/20 transition-all shadow-xl">
                    <Share2 size={20} className="text-[#D4AF37]" /> {localLocales.card.actions.share}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </TacticalCard>
  );
}

// --- MAIN VIEW ---

const CompetitorIntelligenceView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'import' | 'share' | 'trend'>('import');

  const { isOffline, nodeSource } = useBackendStatus();

  // Load Real Data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await intelligenceApi.getCompetitors();
        if (data && Array.isArray(data)) {
          setCompetitors(data);
          
          if (isOffline) {
            window.dispatchEvent(new CustomEvent('predator-error', {
              detail: {
                service: 'CompetitorIntel',
                message: 'МАТ ИЦЯ КОНКУ ЕНТІВ: Дані успішно синхронізовано через MIRROR_CHANNEL (COMPETITOR_NODES).',
                severity: 'info',
                timestamp: new Date().toISOString(),
                code: 'COMPETITOR_NODES'
              }
            }));
          }
        } else {
          setCompetitors([]);
        }
      } catch (e) {
        console.error("Competitor load error", e);
        setCompetitors([]);
        
        window.dispatchEvent(new CustomEvent('predator-error', {
          detail: {
            service: 'CompetitorIntel',
            message: 'К ИТИЧНА ПОМИЛКА ДОСТУПУ ДО ВУЗЛА COMPETITOR_NODES. Перевірте з\'єднання.',
            severity: 'critical',
            timestamp: new Date().toISOString(),
            code: 'COMPETITOR_NODES'
          }
        }));
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [isOffline]);

  useEffect(() => {
    if (isOffline) {
      window.dispatchEvent(new CustomEvent('predator-error', {
        detail: {
          service: 'CompetitorIntel',
          message: 'АКТИВОВАНО АВТОНОМНУ МАТ ИЦЮ КОНКУ ЕНТІВ (COMPETITOR_NODES). Перехід на локальні OSINT-дзеркала.',
          severity: 'warning',
          timestamp: new Date().toISOString(),
          code: 'COMPETITOR_NODES'
        }
      }));
    }
  }, [isOffline]);

  const filteredCompetitors = useMemo(() => {
    let result = [...competitors];
    if (searchQuery) {
      result = result.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.edrpou.includes(searchQuery)
      );
    }
    result.sort((a, b) => {
      switch (sortBy) {
        case 'import': return b.totalImport - a.totalImport;
        case 'share': return b.marketShare - a.marketShare;
        case 'trend': return b.trendPercent - a.trendPercent;
        default: return 0;
      }
    });
    return result;
  }, [competitors, searchQuery, sortBy]);

  const toggleTrack = (id: string) => {
    setCompetitors(prev => prev.map(c => c.id === id ? { ...c, isTracked: !c.isTracked } : c));
  };

  return (
    <PageTransition>
      <div className="min-h-screen pb-24 relative overflow-hidden bg-[#020202]">
        {/* Background Depth */}
        <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden"><HoloContainer>{null}</HoloContainer></div>
        <div className="absolute top-1/4 -right-20 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-1/4 -left-20 w-80 h-80 bg-amber-600/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-20">
          <ViewHeader
            title={
              <div className="flex items-center gap-10">
                <div className="relative group">
                  <div className="absolute inset-0 bg-[#D4AF37]/20 blur-3xl rounded-full scale-150 animate-pulse" />
                  <div className="relative p-7 bg-black border-2 border-[#D4AF37]/40 rounded-[2.5rem] shadow-4xl transform rotate-2 hover:rotate-0 transition-all">
                    <Radar size={42} className="text-[#D4AF37] shadow-[0_0_20px_#d4af37]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-4">
                    <span className="bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] px-4 py-1 text-[10px] font-black tracking-[0.4em] uppercase italic rounded-lg">
                      COMPETITOR_SIGINT // {isOffline ? 'OFFLINE_MIRROR' : 'HUB_MATRIX'}
                    </span>
                    <div className="h-px w-12 bg-[#D4AF37]/20" />
                    <span className="text-[10px] font-black text-yellow-800 font-mono tracking-widest uppercase italic shadow-sm">v58.2-{isOffline ? 'MIRROR' : 'WRAITH'}</span>
                  </div>
                  <h1 className="text-6xl font-black text-white tracking-tighter uppercase italic skew-x-[-3deg] leading-none">
                    {localLocales.title}
                  </h1>
                </div>
              </div>
            }
            breadcrumbs={localLocales.breadcrumbs}
            badges={[
              { label: 'DOMINATION_MODE', color: 'gold', icon: <Crown size={10} /> },
              { label: 'SIGINT_ACTIVE', color: 'primary', icon: <Zap size={10} /> },
            ]}
            stats={[
              { label: localLocales.stats.database, value: String(competitors.length), icon: <Layers size={14} />, color: 'primary' },
              { label: localLocales.stats.monitoring, value: String(competitors.filter(c => c.isTracked).length), icon: <Eye size={14} />, color: 'primary' },
              { label: localLocales.stats.risk, value: 'MEDIUM', icon: <ShieldAlert size={14} />, color: 'warning' },
              { label: 'MATRIX_INDEX', value: '0.842', icon: <Fingerprint />, color: 'gold' },
            ]}
          />

          <div className="max-w-[1700px] mx-auto px-10 mt-14 grid grid-cols-1 xl:grid-cols-4 gap-12">
            {/* Main Content Area */}
            <div className="xl:col-span-3 space-y-10">

              {/* Controls Bar */}
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col md:flex-row gap-6 p-3 bg-black border border-white/[0.04] shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)] rounded-[2.5rem]"
              >
                <div className="flex-1 relative group">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-[#D4AF37] transition-all duration-400" size={24} />
                  <input
                    type="text"
                    placeholder={localLocales.filters.placeholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-16 pr-8 py-6 bg-transparent border-none text-white placeholder-slate-800 focus:outline-none focus:ring-0 font-black italic uppercase tracking-tighter text-xl"
                  />
                </div>

                <div className="flex items-center gap-4 p-2 md:p-0 pr-4">
                  <div className="relative group">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="appearance-none pl-6 pr-14 py-4 bg-black border border-white/5 rounded-2xl text-[11px] font-black tracking-[0.2em] text-slate-500 hover:text-[#D4AF37] uppercase transition-all cursor-pointer focus:outline-none focus:border-[#D4AF37]/50 italic"
                    >
                      <option value="import">{localLocales.filters.sort.volume}</option>
                      <option value="share">{localLocales.filters.sort.share}</option>
                      <option value="trend">{localLocales.filters.sort.trend}</option>
                    </select>
                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-700 group-hover:text-[#D4AF37] transition-colors pointer-events-none" size={20} />
                  </div>

                  <button className="px-10 py-4 bg-[#D4AF37] hover:bg-white hover:text-black text-black rounded-2xl font-black text-[11px] tracking-[0.3em] uppercase shadow-2xl active:scale-95 transition-all flex items-center gap-4 group italic">
                    <Filter size={18} className="group-hover:rotate-180 transition-transform duration-700" />
                    {localLocales.filters.btn}
                  </button>
                </div>
              </motion.div>

              {/* Competitors List */}
              <div className="space-y-6">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="p-12 bg-black border border-white/5 rounded-[3rem] shadow-2xl">
                      <DataSkeleton className="mb-8" width="40%" height={32} />
                      <div className="flex gap-8">
                        <DataSkeleton width="20%" height={24} />
                        <DataSkeleton width="25%" height={24} />
                      </div>
                    </div>
                  ))
                ) : filteredCompetitors.length > 0 ? (
                  <AnimatePresence mode="popLayout">
                    {filteredCompetitors.map((competitor, idx) => (
                      <motion.div
                        key={competitor.id}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                      >
                        <CompetitorCardWRAITH
                          competitor={competitor}
                          isExpanded={expandedId === competitor.id}
                          onToggle={() => setExpandedId(expandedId === competitor.id ? null : competitor.id)}
                          onTrack={() => toggleTrack(competitor.id)}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-40 bg-black border-2 border-dashed border-white/[0.03] rounded-[4rem] shadow-inner-xl"
                  >
                    <div className="relative inline-block mb-10">
                      <Search className="h-24 w-24 text-slate-900" />
                      <motion.div
                        animate={{ opacity: [0.2, 0.4, 0.2], scale: [1, 1.1, 1] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <ZapOff size={48} className="text-[#E11D48]/30" />
                      </motion.div>
                    </div>
                    <h3 className="text-white font-black text-3xl tracking-tighter uppercase mb-3 italic skew-x-[-2deg]">{localLocales.empty.title}</h3>
                    <p className="text-slate-700 text-sm max-w-sm mx-auto leading-relaxed font-black uppercase tracking-[0.2em] italic opacity-60">{localLocales.empty.subtitle}</p>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Right Sidebar Widgets */}
            <aside className="space-y-10">
              {/* Visual Flair */}
              <div className="hidden xl:flex justify-center py-10">
                <CyberOrb size="lg" color="gold" intensity="medium" />
              </div>

              {/* AI Insights Hub */}
              <div className="rounded-[2.5rem] overflow-hidden border border-white/[0.04] shadow-3xl">
                <AIInsightsHub isWidgetMode={true} />
              </div>

              {/* Market Scanning Status Card */}
              <TacticalCard
                title="СТАТУС СКАНУВАННЯ"
                glow="gold"
                variant="minimal"
                className="p-10 rounded-[2.5rem] border-white/[0.02]"
              >
                <div className="space-y-6 pt-4">
                  <div className="flex justify-between items-center text-[11px] font-black tracking-[0.3em] text-slate-600 italic uppercase">
                    <span>АКТИВНІСТЬ ОСИНТ (Σ)</span>
                    <span className="text-[#D4AF37] font-mono text-sm tracking-tighter">92.4%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden shadow-inner border border-white/[0.02]">
                    <motion.div
                      animate={{ x: [-150, 250] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="h-full w-1/3 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent shadow-[0_0_20px_#D4AF37]"
                    />
                  </div>
                  <div className="space-y-3 mt-8 font-mono text-[10px] text-slate-700 font-bold uppercase tracking-widest">
                    <p className="flex justify-between border-b border-white/[0.02] pb-2"><span>NODE // ALFA:</span> <span className="text-[#D4AF37] glow-text">CONNECTED</span></p>
                    <p className="flex justify-between border-b border-white/[0.02] pb-2"><span>LINK // SIGMA:</span> <span className="text-[#D4AF37] glow-text">STABLE</span></p>
                    <p className="flex justify-between"><span>V56.5_KERNEL:</span> <span className="text-amber-600 glow-text italic">PREMIUM_ACTIVE</span></p>
                  </div>
                  
                  <div className="pt-6 flex justify-center">
                    <Crosshair size={32} className="text-slate-900 animate-spin-slow" />
                  </div>
                </div>
              </TacticalCard>
            </aside>
          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        .glow-text { text-shadow: 0 0 10px currentColor; }
        .animate-spin-slow { animation: spin 8s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .shadow-inner-xl { box-shadow: inset 0 20px 40px rgba(0,0,0,0.8); }
      `}} />
    </PageTransition>
  );
};

export default CompetitorIntelligenceView;
