/**
 * 📊 Market Analytics Premium Dashboard
 *
 * Детальна ринкова аналітика для бізнесу
 * Тренди, прогнози, можливості
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  LineChart,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  DollarSign,
  Globe,
  Building2,
  Calendar,
  Filter,
  Download,
  Sparkles,
  Target,
  Eye,
  Bell,
  Crown,
  ChevronRight,
  ChevronDown,
  Search,
  Layers,
  Zap,
  AlertTriangle,
  CheckCircle,
  Activity,
  RefreshCw
} from 'lucide-react';
import { marketApi } from '../features/market';
import { MarketOverviewResponse, TopProduct } from '../features/market/types';
import { useAppStore } from '../store/useAppStore';
import { premiumLocales } from '../locales/uk/premium';
import { HoloContainer } from '../components/HoloContainer';
import { TacticalCard } from '../components/TacticalCard';
import { CyberOrb } from '../components/CyberOrb';
import { cn } from '../utils/cn';

// ========================
// Types
// ========================

interface MarketSegment {
  id: string;
  name: string;
  volume: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  topPlayers: string[];
  avgPrice: number;
  priceChange: number;
}

interface PricePoint {
  date: string;
  price: number;
  volume: number;
}

interface Opportunity {
  id: string;
  type: 'price_drop' | 'new_supplier' | 'trend' | 'gap';
  title: string;
  description: string;
  potentialSaving: number;
  confidence: number;
  urgency: 'high' | 'medium' | 'low';
}

// Mock data removed in favor of API
const defaultSegments: MarketSegment[] = [];
const defaultOpportunities: Opportunity[] = [];

// ========================
// Components
// ========================

const formatCurrency = (value: number): string => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value}`;
};

interface SegmentCardProps {
  segment: MarketSegment;
  isExpanded: boolean;
  onToggle: () => void;
}

const SegmentCard: React.FC<SegmentCardProps> = ({ segment, isExpanded, onToggle }) => (
  <motion.div
    layout
    className={`
      bg-slate-900/60 border rounded-2xl overflow-hidden transition-all
      ${isExpanded ? 'border-cyan-500/30' : 'border-white/5 hover:border-white/10'}
    `}
  >
    <div
      className="p-5 cursor-pointer"
      onClick={onToggle}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`
            p-3 rounded-xl
            ${segment.trend === 'up' ? 'bg-emerald-500/20' :
              segment.trend === 'down' ? 'bg-rose-500/20' : 'bg-slate-800'}
          `}>
            {segment.trend === 'up' ? (
              <TrendingUp className="text-emerald-400" size={24} />
            ) : segment.trend === 'down' ? (
              <TrendingDown className="text-rose-400" size={24} />
            ) : (
              <Activity className="text-slate-400" size={24} />
            )}
          </div>

          <div>
            <h3 className="text-lg font-bold text-white">{segment.name}</h3>
            <p className="text-sm text-slate-500">
              {segment.topPlayers.length} основних гравців
            </p>
          </div>
        </div>

        <div className="flex items-center gap-8">
          {/* Volume */}
          <div className="text-right">
            <p className="text-2xl font-black text-white">
              {formatCurrency(segment.volume)}
            </p>
            <div className={`flex items-center justify-end gap-1 text-sm ${segment.change >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
              {segment.change >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              <span>{segment.change > 0 ? '+' : ''}{segment.change}%</span>
            </div>
          </div>

          {/* Avg Price */}
          <div className="text-right min-w-[100px]">
            <p className="text-lg font-bold text-slate-300">
              ${segment.avgPrice}
            </p>
            <div className={`flex items-center justify-end gap-1 text-xs ${segment.priceChange < 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
              <span>Ціна {segment.priceChange < 0 ? '' : '+'}{segment.priceChange}%</span>
            </div>
          </div>

          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            className="text-slate-500"
          >
            <ChevronDown size={20} />
          </motion.div>
        </div>
      </div>
    </div>

    {/* Expanded Content */}
    <AnimatePresence>
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-t border-white/5"
        >
          <div className="p-5 bg-slate-950/50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Price Chart Placeholder */}
              <div className="md:col-span-2 bg-slate-800/50 rounded-xl p-4 h-48 flex items-center justify-center">
                <div className="text-center">
                  <LineChart className="text-cyan-400 mx-auto mb-2" size={48} />
                  <p className="text-slate-500">Графік цін за 12 місяців</p>
                </div>
              </div>

              {/* Top Players */}
              <div>
                <h4 className="text-sm font-bold text-slate-400 mb-3">ТОП Гравці</h4>
                <div className="space-y-2">
                  {segment.topPlayers.map((player, index) => (
                    <div key={player} className="flex items-center gap-3 p-2 bg-slate-800/50 rounded-lg">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${index === 0 ? 'bg-amber-500/20 text-amber-400' :
                        index === 1 ? 'bg-slate-600/50 text-slate-300' :
                          'bg-orange-500/20 text-orange-400'
                        }`}>
                        {index + 1}
                      </span>
                      <span className="text-sm text-slate-300">{player}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 flex gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded-xl text-sm font-bold">
                <BarChart3 size={16} />
                Детальний звіт
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-sm">
                <Bell size={16} />
                Відстежувати
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </motion.div>
);

const OpportunityCard: React.FC<{ opportunity: Opportunity }> = ({ opportunity }) => {
  const typeConfig = {
    price_drop: { icon: TrendingDown, color: 'emerald', label: 'Зниження ціни' },
    new_supplier: { icon: Building2, color: 'cyan', label: 'Новий постачальник' },
    trend: { icon: TrendingUp, color: 'purple', label: 'Тренд' },
    gap: { icon: Target, color: 'amber', label: 'Ринкова ніша' }
  };

  const config = typeConfig[opportunity.type];
  const Icon = config.icon;

  return (
    <motion.div
      whileHover={{ x: 4 }}
      className={`
        p-4 rounded-xl bg-slate-900/60 border-l-4
        ${opportunity.urgency === 'high' ? 'border-rose-500' :
          opportunity.urgency === 'medium' ? 'border-amber-500' : 'border-slate-600'}
      `}
    >
      <div className="flex items-start gap-4">
        <div className={`p-2 rounded-lg bg-${config.color}-500/20`}>
          <Icon className={`text-${config.color}-400`} size={20} />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-bold text-${config.color}-400`}>
              {config.label}
            </span>
            <span className="text-xs text-slate-600">•</span>
            <span className="text-xs text-slate-500">
              Впевненість: {opportunity.confidence}%
            </span>
          </div>

          <h4 className="font-bold text-white mb-1">{opportunity.title}</h4>
          <p className="text-sm text-slate-400">{opportunity.description}</p>

          {opportunity.potentialSaving > 0 && (
            <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/10 text-emerald-400 text-sm rounded-lg">
              <DollarSign size={14} />
              <span>Потенційна економія: {formatCurrency(opportunity.potentialSaving)}</span>
            </div>
          )}
        </div>

        <button className="text-cyan-400 hover:text-cyan-300">
          <ChevronRight size={20} />
        </button>
      </div>
    </motion.div>
  );
};

// ========================
// Main Component
// ========================

const MarketAnalyticsPremium: React.FC = () => {
  const { userRole, persona } = useAppStore();
  const [marketOverview, setMarketOverview] = useState<MarketOverviewResponse | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSegment, setExpandedSegment] = useState<string | null>(null);
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Using canonical marketApi
        const overview = await marketApi.getOverview(timeRange === 'month' ? 'last_30_days' : 'last_year');
        setMarketOverview(overview);

        // Opportunities still coming from legacy/intelligence for now 
        // until a dedicated diligence/opportunity API is fully ready
        const opps = await marketApi.getOverview(); // Mocking ops from same source for now or keep old
      } catch (err) {
        console.error("Failed to fetch market data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [timeRange]);

  const totalVolume = useMemo(() =>
    marketOverview?.total_value_usd || 0,
    [marketOverview]
  );

  const avgGrowth = useMemo(() => {
    if (!marketOverview || marketOverview.top_products.length === 0) return 0;
    const sum = marketOverview.top_products.reduce((acc, p) => acc + (p.change_percent || 0), 0);
    return sum / marketOverview.top_products.length;
  }, [marketOverview]);

  return (
    <div className="min-h-screen bg-slate-950 p-10 relative overflow-hidden">
      {/* Background FX */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-0 left-1/4 w-[800px] h-[800px] bg-cyan-500/5 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />
      </div>

      <div className="relative z-10 max-w-[1600px] mx-auto">
        {/* Sovereign Header */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 mb-12 p-8 bg-slate-900/40 border border-white/5 rounded-[32px] backdrop-blur-3xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent pointer-events-none" />
          <div className="flex items-center gap-6 relative z-10">
            <div className="p-5 bg-slate-900 border border-white/5 rounded-2xl shadow-2xl panel-3d">
              <BarChart3 className="text-emerald-400" size={32} />
            </div>
            <div>
              <div className="flex items-center gap-4 mb-2">
                <h1 className="text-3xl font-black text-white tracking-tighter uppercase font-display">
                  Ринкова Аналітика
                </h1>
                <div className="px-4 py-1.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-black rounded-full flex items-center gap-2 uppercase tracking-widest">
                  <Crown size={12} />
                  {personaLabel}
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500 font-mono font-bold uppercase tracking-wider">
                <span className="flex items-center gap-2">
                  <Calendar size={14} className="text-slate-600" />
                  Моніторинг: СІЧЕНЬ 2026
                </span>
                <span className="w-1 h-1 bg-slate-700 rounded-full" />
                <span className="flex items-center gap-2">
                  <RefreshCw size={14} className={cn("text-emerald-500", loading ? "animate-spin" : "")} />
                  Live Sync: Активно
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 relative z-10">
            <div className="flex items-center gap-1 p-1.5 bg-slate-950/60 rounded-2xl border border-white/5 backdrop-blur-md">
              {(['week', 'month', 'quarter', 'year'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${timeRange === range
                    ? 'bg-emerald-500/20 text-emerald-400 shadow-lg'
                    : 'text-slate-500 hover:text-slate-300'
                    }`}
                >
                  {range === 'week' ? '7 Днів' :
                    range === 'month' ? '30 Днів' :
                      range === 'quarter' ? 'Квартал' : 'Рік'}
                </button>
              ))}
            </div>

            <button className="flex items-center gap-3 px-8 py-3.5 bg-slate-800/80 hover:bg-slate-700 border border-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl">
              <Download size={18} className="text-emerald-400" />
              Експорт Intel
            </button>
          </div>
        </div>

        {/* Summary KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
          <TacticalCard
            title="Загальний обсяг"
            variant="holographic"
            glow="cyan"
            icon={<Package size={20} className="text-cyan-400" />}
            metrics={[{ label: 'Value', value: loading ? '...' : formatCurrency(totalVolume), trend: 'up', trendValue: '12%' }]}
          >
            <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '70%' }}
                className="h-full bg-cyan-500 shadow-[0_0_10px_cyan]"
              />
            </div>
          </TacticalCard>

          <TacticalCard
            title="Середнє зростання"
            variant="holographic"
            glow="emerald"
            icon={<TrendingUp size={20} className="text-emerald-400" />}
            metrics={[{ label: 'Growth', value: loading ? '...' : `+${avgGrowth.toFixed(1)}%`, trend: 'up', trendValue: '2.4%' }]}
          >
            <div className="flex gap-1 items-end h-8">
              {[4, 6, 3, 8, 5, 9, 7].map((h, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${h * 10}%` }}
                  className="w-1.5 bg-emerald-500/40 rounded-t-sm"
                />
              ))}
            </div>
          </TacticalCard>

          <TacticalCard
            title="Активні сегменти"
            variant="holographic"
            glow="purple"
            icon={<Layers size={20} className="text-purple-400" />}
            metrics={[{ label: 'Count', value: loading ? '...' : marketOverview?.top_products.length || 0 }]}
          >
            <div className="text-[10px] text-slate-500 uppercase font-mono">
              Cluster Alpha: Stable
            </div>
          </TacticalCard>

          <TacticalCard
            title="AI Можливості"
            variant="holographic"
            glow="amber"
            icon={<Sparkles size={20} className="text-amber-400" />}
            metrics={[{ label: 'Detected', value: loading ? '...' : opportunities.length, trend: 'up', trendValue: 'New' }]}
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-[10px] text-amber-500/80 font-black uppercase">Ready for Analysis</span>
            </div>
          </TacticalCard>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
          {/* Market Segments */}
          <div className="xl:col-span-8 space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black text-white tracking-widest uppercase flex items-center gap-4">
                <div className="w-8 h-px bg-emerald-500/50" />
                Ринкові Сегменти
              </h2>
              <div className="flex items-center gap-4">
                <Search className="text-slate-600" size={18} />
                <Filter className="text-slate-600" size={18} />
              </div>
            </div>

            <HoloContainer className="p-1">
              <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
                {marketOverview?.top_products.map((product) => (
                  <div key={product.code} className="bg-slate-900/60 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
                          <Package size={24} />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white">{product.name}</h3>
                          <p className="text-xs text-slate-500 font-mono">{product.code}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-black text-white">{formatCurrency(product.value_usd)}</p>
                        <div className={`flex items-center justify-end gap-1 text-sm ${product.change_percent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {product.change_percent >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                          <span>{product.change_percent > 0 ? '+' : ''}{product.change_percent}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {loading && Array(4).fill(0).map((_, i) => (
                  <div key={i} className="h-24 bg-slate-900/40 border border-white/5 rounded-2xl animate-pulse" />
                ))}
              </div>
            </HoloContainer>
          </div>

          {/* Opportunities & Neural Intel */}
          <div className="xl:col-span-4 space-y-8">
            <TacticalCard
              variant="cyber"
              glow="emerald"
              title="Neural Intelligence"
              subtitle="Signal Processing Engine"
              icon={<CyberOrb size="sm" status="active" />}
            >
              <div className="space-y-4">
                <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-100 transition-opacity">
                    <Zap size={14} className="text-emerald-400" />
                  </div>
                  <p className="text-[11px] leading-relaxed text-emerald-100/80 italic font-serif">
                    "Глобальний аналіз потоків вказує на зміщення ліквідності в сегменті {marketOverview?.top_products[0]?.name || 'Alpha'}. Рекомендовано переглянути стратегію закупівель."
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Predator AI • v55</span>
                    <span className="text-[9px] text-slate-500">Confidence: 94.2%</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                      <Sparkles size={16} className="text-amber-400" />
                      AI Траєкторії
                    </h3>
                    <span className="text-[10px] text-slate-500">Live Fetch</span>
                  </div>

                  {opportunities.map((opp) => (
                    <OpportunityCard key={opp.id} opportunity={opp} />
                  ))}
                </div>

                <button className="w-full py-4 bg-slate-800/50 hover:bg-slate-700/50 border border-white/5 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] transition-all hover:text-white">
                  Показати всі можливості
                </button>
              </div>
            </TacticalCard>

            <TacticalCard
              variant="glass"
              title="Матриця Ризиків"
              icon={<AlertTriangle size={18} className="text-rose-400" />}
            >
              <div className="flex items-center justify-center h-40 bg-slate-950/40 rounded-2xl border border-white/5 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <Activity className="text-rose-500/20 group-hover:text-rose-500/40 transition-all scale-150" size={80} />
                <span className="absolute bottom-4 text-[10px] font-black text-rose-500/60 uppercase tracking-widest">Anomaly Detection Ready</span>
              </div>
            </TacticalCard>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketAnalyticsPremium;
