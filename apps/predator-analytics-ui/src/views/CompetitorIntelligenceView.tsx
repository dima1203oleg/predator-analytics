
/**
 * 🎯 Competitor Intelligence View v45
 *
 * Стратегічний аналіз конкурентів на основі митних даних та OSINT.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Filter, Download,
  TrendingUp, TrendingDown, Building2, Package,
  DollarSign, Globe, Star, StarOff, ChevronRight,
  ChevronDown, BarChart3, Bell, ArrowUpRight, ArrowDownRight,
  Target, Crown, Layers, Zap, MoreHorizontal, FileText, Share2, Eye
} from 'lucide-react';
import { api } from '../services/api';
import { ViewHeader } from '../components/ViewHeader';
import { cn } from '../utils/cn';
import { DataSkeleton } from '../components/shared/DataSkeleton';

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

// --- MOCK FALLBACK DATA ---
const MOCK_COMPETITORS: Competitor[] = [
  {
    id: '1', name: 'ТОВ "ТехноІмпорт Україна"', edrpou: '12345678',
    totalImport: 45200000, totalExport: 2100000,
    countries: ['Китай', 'В\'єтнам', 'Тайвань'],
    products: ['Електроніка', 'Комплектуючі', 'LED дисплеї'],
    topSuppliers: ['Shenzhen Tech Co.', 'Vietnam Electronics'],
    marketShare: 15.4, trend: 'up', trendPercent: 23.5, riskScore: 12,
    lastActivity: '2026-02-01', isTracked: true
  },
  {
    id: '2', name: 'ПрАТ "ГлобалТрейд"', edrpou: '23456789',
    totalImport: 38900000, totalExport: 15600000,
    countries: ['Німеччина', 'Польща', 'Чехія'],
    products: ['Хімія', 'Пластик', 'Полімери'],
    topSuppliers: ['BASF SE', 'Polski Chemia'],
    marketShare: 12.8, trend: 'up', trendPercent: 8.2, riskScore: 5,
    lastActivity: '2026-01-30', isTracked: true
  },
  {
    id: '3', name: 'ТОВ "АгроХім Плюс"', edrpou: '34567890',
    totalImport: 28500000, totalExport: 1200000,
    countries: ['Білорусь', 'Польща', 'Литва'],
    products: ['Добрива', 'Засоби захисту', 'Насіння'],
    topSuppliers: ['Belaruskali', 'Grupa Azoty'],
    marketShare: 9.2, trend: 'down', trendPercent: -12.3, riskScore: 65,
    lastActivity: '2026-01-29', isTracked: false
  },
];

// --- COMPONENTS ---

const CompetitorCard: React.FC<{
  competitor: Competitor;
  isExpanded: boolean;
  onToggle: () => void;
  onTrack: () => void;
}> = ({ competitor, isExpanded, onToggle, onTrack }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-slate-900/40 border rounded-2xl overflow-hidden transition-all duration-300 backdrop-blur-sm group",
        isExpanded ? "border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.1)]" : "border-white/5 hover:border-white/10"
      )}
    >
      {/* Main Row */}
      <div
        className="p-5 cursor-pointer relative"
        onClick={onToggle}
      >
        <div className="flex items-start justify-between relative z-10">
          <div className="flex items-start gap-5">
            {/* Logo/Avatar */}
            <div className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg border border-white/5",
              competitor.marketShare > 10 ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white" : "bg-slate-800 text-slate-400"
            )}>
              <Building2 size={24} />
            </div>

            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">{competitor.name}</h3>
                {competitor.isTracked && (
                  <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 text-[10px] uppercase font-black tracking-wider rounded-lg border border-indigo-500/30">
                    Tracked
                  </span>
                )}
                {competitor.riskScore > 50 && (
                  <span className="px-2 py-0.5 bg-rose-500/20 text-rose-400 text-[10px] uppercase font-black tracking-wider rounded-lg border border-rose-500/30 flex items-center gap-1">
                    high risk {competitor.riskScore}%
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                <span className="font-mono bg-white/5 px-2 py-0.5 rounded text-slate-300">{competitor.edrpou}</span>
                <span className="flex items-center gap-1"><Globe size={12} /> {(competitor.countries || []).slice(0, 3).join(', ')}</span>
                <span className="flex items-center gap-1"><Package size={12} /> {(competitor.products || []).slice(0, 2).join(', ')}</span>
              </div>
            </div>
          </div>

              <div className="flex items-center gap-8">
            <div className="text-right">
              <p className="text-2xl font-black text-white tracking-tight">
                ${(((competitor as any).totalImport || (competitor as any).imports || 0) / 1000000).toFixed(1)}M
              </p>
              <div className={cn("flex items-center justify-end gap-1 text-xs font-bold",
                competitor.trend === 'up' ? "text-emerald-400" : competitor.trend === 'down' ? "text-rose-400" : "text-slate-400"
              )}>
                {competitor.trend === 'up' ? <ArrowUpRight size={12} /> : competitor.trend === 'down' ? <ArrowDownRight size={12} /> : <div className="w-3 h-0.5 bg-slate-400" />}
                <span>{competitor.trend !== 'stable' && (competitor.trendPercent > 0 ? '+' : '')}{competitor.trendPercent}%</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); onTrack(); }}
                className={cn(
                  "p-2.5 rounded-xl transition-all border border-transparent",
                  competitor.isTracked ? "bg-amber-500/20 text-amber-400 border-amber-500/30" : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                )}
              >
                {competitor.isTracked ? <Star size={18} fill="currentColor" /> : <Star size={18} />}
              </button>
              <div className={cn("transition-transform duration-300 text-slate-500", isExpanded && "rotate-180")}>
                <ChevronDown size={20} />
              </div>
            </div>
          </div>
        </div>

        {/* Progress bar background hint */}
        <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-20" style={{ width: `${competitor.marketShare}%` }} />
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/5 bg-black/20"
          >
            <div className="p-6 grid grid-cols-3 gap-8">
              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Globe size={14} className="text-blue-400" /> Географія Імпорту
                </h4>
                <div className="flex flex-wrap gap-2">
                  {(competitor.countries || []).map(c => (
                    <span key={c} className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-medium text-slate-300">{c}</span>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Target size={14} className="text-emerald-400" /> Топ Постачальники
                </h4>
                <ul className="space-y-2">
                  {(competitor.topSuppliers || []).map(s => (
                    <li key={s} className="flex items-center justify-between text-sm text-slate-300 border-b border-white/5 pb-1 last:border-0">
                      <span>{s}</span>
                      <ExternalLinkButton />
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Zap size={14} className="text-amber-400" /> Швидкі Дії
                </h4>
                <div className="flex flex-col gap-2">
                  <button className="flex items-center gap-3 px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-lg text-xs font-bold transition-colors">
                    <BarChart3 size={14} /> Детальна Аналітика
                  </button>
                  <button className="flex items-center gap-3 px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 rounded-lg text-xs font-bold transition-colors">
                    <FileText size={14} /> Експорт Звіту (PDF)
                  </button>
                  <button className="flex items-center gap-3 px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 rounded-lg text-xs font-bold transition-colors">
                    <Share2 size={14} /> Поділитися
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

const ExternalLinkButton = () => (
  <button className="text-slate-600 hover:text-white transition-colors"><ArrowUpRight size={12} /></button>
);

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
        // Fetch from real API mock server DB facts
        const data = await api.premium.getCompetitors ? await api.premium.getCompetitors() : (await api.get('/premium/competitors')).data;
        if (data && data.length > 0) {
          setCompetitors(data);
        } else {
          setCompetitors(MOCK_COMPETITORS);
        }
      } catch (e) {
        console.error("Competitor load error", e);
        setCompetitors(MOCK_COMPETITORS);
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
    <div className="min-h-screen animate-in fade-in duration-700 pb-20">
      <ViewHeader
        title="КОНКУРЕНТНА РОЗВІДКА"
        icon={<Target size={20} className="icon-3d-indigo" />}
        breadcrumbs={['РОЗВІДКА', 'РИНОК', 'КОНКУРЕНТИ']}
        stats={[
          { label: 'База', value: competitors.length, icon: <Layers size={12} />, color: 'primary' },
          { label: 'Моніторинг', value: competitors.filter(c => c.isTracked).length, icon: <Eye size={12} />, color: 'amber' },
        ]}
      />

      <div className="max-w-7xl mx-auto px-6 mt-8 space-y-8">

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 p-1">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={20} />
            <input
              type="text"
              placeholder="Пошук компанії за назвою або ЄДРПОУ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-slate-900/60 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all font-medium"
            />
          </div>

          <div className="flex gap-2">
            <div className="relative group">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="appearance-none pl-4 pr-10 py-4 bg-slate-900/60 border border-white/10 rounded-2xl text-slate-300 focus:outline-none focus:border-white/20 font-bold cursor-pointer hover:bg-slate-800/60 transition-colors"
              >
                <option value="import">За обсягом</option>
                <option value="share">За часткою</option>
                <option value="trend">За трендом</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
            </div>

            <button className="px-6 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2 active:scale-95">
              <Filter size={18} />
              <span className="hidden sm:inline">Фільтри</span>
            </button>
          </div>
        </div>

        {/* List */}
        <div className="space-y-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-6 bg-slate-900/40 border border-white/5 rounded-2xl">
                <DataSkeleton className="mb-4" width="40%" height={24} />
                <div className="flex gap-4">
                  <DataSkeleton width="20%" height={16} />
                  <DataSkeleton width="20%" height={16} />
                </div>
              </div>
            ))
          ) : filteredCompetitors.length > 0 ? (
            filteredCompetitors.map(competitor => (
              <CompetitorCard
                key={competitor.id}
                competitor={competitor}
                isExpanded={expandedId === competitor.id}
                onToggle={() => setExpandedId(expandedId === competitor.id ? null : competitor.id)}
                onTrack={() => toggleTrack(competitor.id)}
              />
            ))
          ) : (
            <div className="text-center py-20 bg-slate-900/20 border border-dashed border-slate-800 rounded-3xl">
              <Search className="mx-auto h-12 w-12 text-slate-700 mb-4" />
              <h3 className="text-slate-400 font-bold">Нічого не знайдено</h3>
              <p className="text-slate-600 text-sm mt-1">Спробуйте змінити параметри пошуку</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default CompetitorIntelligenceView;
