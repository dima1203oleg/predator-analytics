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
import { api } from '../services/api';

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
  const [marketSegments, setMarketSegments] = useState<MarketSegment[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSegment, setExpandedSegment] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [segments, opps] = await Promise.all([
          api.premium.getMarketSegments(),
          api.premium.getOpportunities()
        ]);
        setMarketSegments(segments);
        setOpportunities(opps);
      } catch (err) {
        console.error("Failed to fetch market data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalVolume = useMemo(() =>
    marketSegments.reduce((acc, s) => acc + s.volume, 0),
    [marketSegments]
  );

  const avgGrowth = useMemo(() => {
    if (marketSegments.length === 0) return 0;
    const sum = marketSegments.reduce((acc, s) => acc + s.change, 0);
    return sum / marketSegments.length;
  }, [marketSegments]);

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/3 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-3">
              <BarChart3 className="text-emerald-400" />
              Ринкова Аналітика
              <span className="ml-2 px-3 py-1 bg-amber-500/20 text-amber-400 text-sm rounded-full flex items-center gap-1">
                <Crown size={14} />
                Premium
              </span>
            </h1>
            <p className="text-slate-500 mt-1">
              Аналіз ринку імпорту • Січень 2026
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Time Range Selector */}
            <div className="flex items-center gap-1 p-1 bg-slate-900/60 rounded-xl border border-white/5">
              {(['week', 'month', 'quarter', 'year'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${timeRange === range
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'text-slate-500 hover:text-slate-300'
                    }`}
                >
                  {range === 'week' ? 'Тиждень' :
                    range === 'month' ? 'Місяць' :
                      range === 'quarter' ? 'Квартал' : 'Рік'}
                </button>
              ))}
            </div>

            <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-xl">
              <Download size={16} />
              Експорт
            </button>
          </div>
        </div>

        {/* Summary KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-500 text-sm">Загальний обсяг</span>
              <Package className="text-cyan-400" size={20} />
            </div>
            {loading ? <div className="h-8 w-24 bg-slate-800 animate-pulse rounded" /> : <p className="text-3xl font-black text-white">{formatCurrency(totalVolume)}</p>}
          </div>

          <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-500 text-sm">Середнє зростання</span>
              <TrendingUp className="text-emerald-400" size={20} />
            </div>
            {loading ? <div className="h-8 w-24 bg-slate-800 animate-pulse rounded" /> : <p className="text-3xl font-black text-white">+{avgGrowth.toFixed(1)}%</p>}
          </div>

          <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-500 text-sm">Активних сегментів</span>
              <Layers className="text-purple-400" size={20} />
            </div>
            {loading ? <div className="h-8 w-24 bg-slate-800 animate-pulse rounded" /> : <p className="text-3xl font-black text-white">{marketSegments.length}</p>}
          </div>

          <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-500 text-sm">Можливостей</span>
              <Sparkles className="text-amber-400" size={20} />
            </div>
            {loading ? <div className="h-8 w-24 bg-slate-800 animate-pulse rounded" /> : <p className="text-3xl font-black text-white">{opportunities.length}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Market Segments */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-bold text-white mb-4">Ринкові Сегменти</h2>
            {marketSegments.map((segment) => (
              <SegmentCard
                key={segment.id}
                segment={segment}
                isExpanded={expandedSegment === segment.id}
                onToggle={() => setExpandedSegment(
                  expandedSegment === segment.id ? null : segment.id
                )}
              />
            ))}
          </div>

          {/* Opportunities */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="text-amber-400" size={20} />
                AI Можливості
              </h2>
              <span className="text-xs text-slate-500">Оновлено 5 хв тому</span>
            </div>

            <div className="space-y-3">
              {opportunities.map((opp) => (
                <OpportunityCard key={opp.id} opportunity={opp} />
              ))}
            </div>

            <button className="w-full mt-4 py-3 border border-white/10 rounded-xl text-slate-400 hover:text-white hover:border-white/20 transition-colors text-sm">
              Показати всі можливості
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketAnalyticsPremium;
