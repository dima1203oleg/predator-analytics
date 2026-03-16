
/**
 * 🎯 Competitor Intelligence View v55
 * "Strategic Competitor Nexus Matrix"
 *
 * Стратегічний аналіз конкурентів на основі митних даних, OSINT та нейронних прогнозів.
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
  Radar, Scan, ZapOff
} from 'lucide-react';
import { api } from '@/services/api';
import { ViewHeader } from '@/components/ViewHeader';
import { cn } from '@/utils/cn';
import { DataSkeleton } from '@/components/shared/DataSkeleton';
import { TacticalCard } from '@/components/TacticalCard';
import { CyberOrb } from '@/components/CyberOrb';
import { HoloContainer } from '@/components/HoloContainer';
import { PageTransition } from '@/components/layout/PageTransition';
import AIInsightsHub from '@/features/ai/AIInsightsHub';
import { Badge } from '@/components/ui/badge';

// --- LOCALIZATION ---
const localLocales = {
  title: 'СТРАТЕГІЧНИЙ НЕКСУС КОНКУРЕНТІВ',
  breadcrumbs: ['РОЗВІДКА', 'МАТРИЦЯ РИНКУ', 'v55.NEXUS'],
  stats: {
    database: 'БАЗА ДАНИХ',
    monitoring: 'МОНІТОРИНГ',
    risk: 'РІВЕНЬ ЗАГРОЗ',
  },
  filters: {
    placeholder: 'Пошук сутностей за назвою, ЄДРПОУ або доменом...',
    sort: {
      volume: 'ЗА ОБСЯГОМ',
      share: 'ЗА ЧАСТКОЮ',
      trend: 'ЗА ДИНАМІКОЮ',
    },
    btn: 'ФІЛЬТРИ',
  },
  card: {
    tracked: 'ПЕРЕБУВАЄ ПІД НАГЛЯДОМ',
    highRisk: 'ВИСОКИЙ РИЗИК СИНЕРГІЇ',
    geography: 'ГЕОГРАФІЯ ЕКСПАНСІЇ',
    suppliers: 'ВУЗЛИ ПОСТАЧАННЯ',
    actions: {
      analytics: 'ГЛИБОКА АНАЛІТИКА',
      report: 'ЕКСПОРТ ПРОФІЛЮ (PDF)',
      share: 'ПЕРЕДАТИ ДАНІ',
    }
  },
  empty: {
    title: 'СИГНАЛІВ НЕ ВИЯВЛЕНО',
    subtitle: 'Параметри пошуку не збігаються з жодним активним суб\'єктом ринку',
  },
  aiInsights: {
    title: 'НЕЙРОННИЙ ПРОГНОЗ РИНКУ',
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

const CompetitorCardV55: React.FC<{
  competitor: Competitor;
  isExpanded: boolean;
  onToggle: () => void;
  onTrack: () => void;
}> = ({ competitor, isExpanded, onToggle, onTrack }) => {
  return (
    <TacticalCard
      variant={isExpanded ? "holographic" : "cyber"}
      glow={competitor.riskScore > 50 ? 'red' : isExpanded ? 'indigo' : 'cyan'}
      className="transition-all duration-500"
      noPadding
    >
      <div
        className="p-5 cursor-pointer relative overflow-hidden group"
        onClick={onToggle}
      >
        {/* Background Decorative Element */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-500/5 to-transparent rounded-full -mr-10 -mt-10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-4">
            {/* Holographic Avatar */}
            <div className={cn(
              "w-16 h-16 rounded-xl flex items-center justify-center font-black text-xl shadow-2xl border transition-all duration-500",
              competitor.marketShare > 10
                ? "bg-gradient-to-br from-indigo-500/20 to-purple-600/20 text-indigo-400 border-indigo-500/40 shadow-indigo-500/10"
                : "bg-slate-800/40 text-slate-500 border-slate-700/50"
            )}>
              <Building2 size={28} className={cn("transition-transform duration-500", isExpanded && "scale-110")} />
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-bold text-white group-hover:text-primary-400 transition-colors duration-300">
                  {competitor.name}
                </h3>
                {competitor.isTracked && (
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-[9px] font-black tracking-tighter uppercase">
                    {localLocales.card.tracked}
                  </Badge>
                )}
                {competitor.riskScore > 50 && (
                  <Badge variant="outline" className="bg-rose-500/10 text-rose-400 border-rose-500/30 text-[9px] font-black tracking-tighter uppercase flex items-center gap-1">
                    <ShieldAlert size={10} /> {localLocales.card.highRisk} [{competitor.riskScore}%]
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-[11px] font-mono text-slate-400">
                <span className="bg-slate-950/60 px-2 py-0.5 rounded border border-white/5 text-primary-500/80">{competitor.edrpou}</span>
                <span className="flex items-center gap-1.5"><Globe size={12} className="text-secondary-400" /> {(competitor.countries || []).slice(0, 3).join(', ')}</span>
                <span className="flex items-center gap-1.5"><Package size={12} className="text-purple-400" /> {(competitor.products || []).slice(0, 2).join(', ')}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 self-end md:self-center">
            <div className="text-right">
              <span className="text-[10px] text-slate-500 font-bold tracking-widest block mb-1 uppercase">РИНКОВИЙ ОБСЯГ</span>
              <p className="text-2xl font-black text-white tracking-tight font-display">
                ${(((competitor as any).totalImport || (competitor as any).imports || 0) / 1000000).toFixed(1)}M
              </p>
              <div className={cn("flex items-center justify-end gap-1 text-xs font-bold",
                competitor.trend === 'up' ? "text-success-400" : competitor.trend === 'down' ? "text-danger-400" : "text-slate-400"
              )}>
                {competitor.trend === 'up' ? <ArrowUpRight size={14} /> : competitor.trend === 'down' ? <ArrowDownRight size={14} /> : <Activity size={12} />}
                <span>{competitor.trend !== 'stable' && (competitor.trendPercent > 0 ? '+' : '')}{competitor.trendPercent}%</span>
              </div>
            </div>

            <div className="flex items-center gap-2 border-l border-white/5 pl-4 ml-2">
              <button
                onClick={(e) => { e.stopPropagation(); onTrack(); }}
                className={cn(
                  "p-3 rounded-xl transition-all duration-300 border",
                  competitor.isTracked
                    ? "bg-amber-500/20 text-amber-500 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                    : "bg-slate-900/60 text-slate-500 border-slate-800 hover:border-slate-600 hover:text-white"
                )}
              >
                <Star size={20} fill={competitor.isTracked ? "currentColor" : "none"} />
              </button>
              <div className={cn("transition-transform duration-500 text-slate-600 group-hover:text-primary-500", isExpanded && "rotate-180")}>
                <ChevronDown size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Market Share Line */}
        <div className="absolute bottom-0 left-0 h-[2px] w-full bg-slate-800/30">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${competitor.marketShare}%` }}
            transition={{ duration: 1.5, ease: "circOut" }}
            className="h-full bg-gradient-to-r from-primary-500 via-indigo-500 to-purple-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
          />
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: "circOut" }}
            className="border-t border-white/5 bg-slate-950/40 relative"
          >
            {/* Grid Decoration */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />

            <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-10 relative z-10">
              <div className="space-y-5">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-secondary-500 rounded-full animate-pulse" />
                  {localLocales.card.geography}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {(competitor.countries || []).map(c => (
                    <div key={c} className="px-3 py-2 bg-slate-900/80 border border-slate-800 hover:border-secondary-500/40 rounded-lg text-[10px] font-bold text-slate-300 transition-colors uppercase tracking-wider">
                      {c}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-5">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse" />
                  {localLocales.card.suppliers}
                </h4>
                <ul className="space-y-3">
                  {(competitor.topSuppliers || []).map(s => (
                    <li key={s} className="flex items-center justify-between text-xs text-slate-300 group/item">
                      <div className="flex items-center gap-2">
                        <Network size={14} className="text-slate-600 group-hover/item:text-primary-400" />
                        <span className="group-hover/item:text-white transition-colors capitalize">{s}</span>
                      </div>
                      <button className="text-slate-700 hover:text-primary-500 transition-colors p-1 rounded-md hover:bg-white/5">
                        <ExternalLink size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-5">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                  {localLocales.card.actions.analytics}
                </h4>
                <div className="flex flex-col gap-3">
                  <button className="flex items-center justify-between group/btn px-4 py-3 bg-primary-500/5 hover:bg-primary-500/15 border border-primary-500/20 rounded-xl transition-all duration-300">
                    <div className="flex items-center gap-3">
                      <BarChart3 size={16} className="text-primary-500" />
                      <span className="text-[10px] font-black text-primary-400 uppercase tracking-wider">{localLocales.card.actions.analytics}</span>
                    </div>
                    <ArrowUpRight size={14} className="text-primary-500/50 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                  </button>

                  <button className="flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 text-slate-400 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all">
                    <FileText size={16} /> {localLocales.card.actions.report}
                  </button>

                  <button className="flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 text-slate-400 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all">
                    <Share2 size={16} /> {localLocales.card.actions.share}
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

  // Load Real Data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await api.premium.getCompetitors();
        if (data && Array.isArray(data)) {
          setCompetitors(data);
        } else {
          setCompetitors([]);
        }
      } catch (e) {
        console.error("Competitor load error", e);
        setCompetitors([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

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
      <div className="min-h-screen pb-24 relative overflow-hidden">
        {/* Background Depth */}
        <div className="absolute inset-0 opacity-40 pointer-events-none overflow-hidden"><HoloContainer>{null}</HoloContainer></div>
        <div className="absolute top-1/4 -right-20 w-96 h-96 bg-primary-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-1/4 -left-20 w-80 h-80 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-20">
          <ViewHeader
            title={localLocales.title}
            icon={<Radar size={22} className="text-secondary-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]" />}
            breadcrumbs={localLocales.breadcrumbs}
            stats={[
              { label: localLocales.stats.database, value: String(competitors.length), icon: <Layers size={14} />, color: 'primary' },
              { label: localLocales.stats.monitoring, value: String(competitors.filter(c => c.isTracked).length), icon: <Eye size={14} />, color: 'secondary' },
              { label: localLocales.stats.risk, value: 'MEDIUM', icon: <ShieldAlert size={14} />, color: 'warning' },
            ]}
          />

          <div className="max-w-[1600px] mx-auto px-6 mt-10 grid grid-cols-1 xl:grid-cols-4 gap-8">
            {/* Main Content Area */}
            <div className="xl:col-span-3 space-y-8">

              {/* Controls Bar */}
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col md:flex-row gap-4 p-2 bg-slate-900/40 backdrop-blur-md rounded-3xl border border-white/5 shadow-2lx"
              >
                <div className="flex-1 relative group">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary-500 transition-colors duration-300" size={20} />
                  <input
                    type="text"
                    placeholder={localLocales.filters.placeholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-14 pr-6 py-5 bg-transparent border-none text-white placeholder-slate-600 focus:outline-none focus:ring-0 font-medium md:text-lg"
                  />
                </div>

                <div className="flex items-center gap-3 p-2 md:p-0">
                  <div className="h-10 w-[1px] bg-white/5 hidden md:block mx-2" />

                  <div className="relative group">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="appearance-none pl-5 pr-12 py-3 bg-slate-950/60 border border-slate-800 rounded-2xl text-[10px] font-black tracking-[0.1em] text-slate-400 hover:text-white uppercase transition-all cursor-pointer focus:outline-none focus:border-primary-500/50"
                    >
                      <option value="import">{localLocales.filters.sort.volume}</option>
                      <option value="share">{localLocales.filters.sort.share}</option>
                      <option value="trend">{localLocales.filters.sort.trend}</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 group-hover:text-primary-500 transition-colors pointer-events-none" size={16} />
                  </div>

                  <button className="px-8 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl font-black text-[10px] tracking-[0.15em] uppercase shadow-lg shadow-primary-600/20 active:scale-95 transition-all flex items-center gap-3 group">
                    <Filter size={16} className="group-hover:rotate-180 transition-transform duration-500" />
                    {localLocales.filters.btn}
                  </button>
                </div>
              </motion.div>

              {/* Competitors List */}
              <div className="space-y-5">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="p-10 bg-slate-900/40 border border-white/5 rounded-3xl">
                      <DataSkeleton className="mb-6" width="30%" height={28} />
                      <div className="flex gap-6">
                        <DataSkeleton width="15%" height={18} />
                        <DataSkeleton width="20%" height={18} />
                      </div>
                    </div>
                  ))
                ) : filteredCompetitors.length > 0 ? (
                  <AnimatePresence mode="popLayout">
                    {filteredCompetitors.map((competitor, idx) => (
                      <motion.div
                        key={competitor.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <CompetitorCardV55
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
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-32 bg-slate-900/20 border border-dashed border-slate-800 rounded-[40px] shadow-inner"
                  >
                    <div className="relative inline-block mb-6">
                      <Search className="h-16 w-16 text-slate-800" />
                      <motion.div
                        animate={{ opacity: [0.2, 0.5, 0.2] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <ZapOff size={32} className="text-danger-500/40" />
                      </motion.div>
                    </div>
                    <h3 className="text-slate-300 font-black text-xl tracking-wider uppercase mb-2">{localLocales.empty.title}</h3>
                    <p className="text-slate-600 text-sm max-w-xs mx-auto leading-relaxed">{localLocales.empty.subtitle}</p>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Right Sidebar Widgets */}
            <aside className="space-y-8">
              {/* Visual Flair */}
              <div className="hidden xl:flex justify-center py-6">
                <CyberOrb size="lg" color="blue" intensity="low" />
              </div>

              {/* AI Insights Hub */}
              <AIInsightsHub isWidgetMode={true} />

              {/* Market Scanning Status Card */}
              <TacticalCard
                title="СТАТУС СКАНУВАННЯ"
                glow="cyan"
                variant="minimal"
              >
                <div className="space-y-4 pt-2">
                  <div className="flex justify-between items-center text-[10px] font-bold tracking-widest text-slate-500">
                    <span>АКТИВНІСТЬ ОСИНТ</span>
                    <span className="text-primary-400">92%</span>
                  </div>
                  <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      animate={{ x: [-100, 100] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      className="h-full w-1/3 bg-primary-500 shadow-[0_0_10px_#06b6d4]"
                    />
                  </div>
                  <div className="space-y-2 mt-4 font-mono text-[9px] text-slate-600">
                    <p className="flex justify-between"><span>NODE // ALFA:</span> <span className="text-success-500">CONNECTED</span></p>
                    <p className="flex justify-between"><span>LINK // SIGMA:</span> <span className="text-success-500">STABLE</span></p>
                    <p className="flex justify-between"><span>V55_KERNEL:</span> <span className="text-primary-400">ACTIVE</span></p>
                  </div>
                </div>
              </TacticalCard>
            </aside>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default CompetitorIntelligenceView;
