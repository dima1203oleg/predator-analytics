/**
 * 📊 Advanced Charts Dashboard
 *
 * Потужні графіки для аналітики
 * Різні типи візуалізації даних
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import {
  BarChart3,
  PieChart,
  LineChart,
  AreaChart,
  TrendingUp,
  TrendingDown,
  Download,
  Filter,
  Maximize2,
  RefreshCw,
  Calendar,
  Crown,
  Sparkles,
  ChevronDown,
  Settings,
  Share2,
  Plus
} from 'lucide-react';

// ========================
// Types
// ========================

type ChartType = 'bar' | 'line' | 'pie' | 'area' | 'heatmap' | 'scatter';

interface ChartData {
  label: string;
  value: number;
  color?: string;
  trend?: number;
}

interface ChartConfig {
  id: string;
  title: string;
  type: ChartType;
  data: ChartData[];
  height: number;
  gridSpan: 1 | 2 | 3;
}

// ========================
// Mock Data
// ========================

const monthlyImportData: ChartData[] = [
  { label: 'Січ', value: 78, trend: 5.2 },
  { label: 'Лют', value: 82, trend: 5.1 },
  { label: 'Бер', value: 95, trend: 15.8 },
  { label: 'Кві', value: 88, trend: -7.4 },
  { label: 'Тра', value: 92, trend: 4.5 },
  { label: 'Чер', value: 105, trend: 14.1 },
  { label: 'Лип', value: 98, trend: -6.7 },
  { label: 'Сер', value: 110, trend: 12.2 },
  { label: 'Вер', value: 95, trend: -13.6 },
  { label: 'Жов', value: 102, trend: 7.4 },
  { label: 'Лис', value: 115, trend: 12.7 },
  { label: 'Гру', value: 125, trend: 8.7 },
];

const categoryData: ChartData[] = [
  { label: 'Електроніка', value: 245, color: '#22d3ee' },
  { label: 'Хімія', value: 189, color: '#a855f7' },
  { label: 'С/Г техніка', value: 156, color: '#22c55e' },
  { label: 'Будматеріали', value: 134, color: '#f59e0b' },
  { label: 'Текстиль', value: 98, color: '#ec4899' },
  { label: 'Метал', value: 87, color: '#6366f1' },
];

const countryData: ChartData[] = [
  { label: 'Китай', value: 35, color: '#ef4444' },
  { label: 'Німеччина', value: 18, color: '#3b82f6' },
  { label: 'Польща', value: 15, color: '#f97316' },
  { label: 'Туреччина', value: 12, color: '#10b981' },
  { label: "В'єтнам", value: 10, color: '#8b5cf6' },
  { label: 'Інші', value: 10, color: '#6b7280' },
];

// ========================
// Chart Components
// ========================

interface BarChartProps {
  data: ChartData[];
  height: number;
  showLabels?: boolean;
  animated?: boolean;
}

const AnimatedBarChart: React.FC<BarChartProps> = ({ data, height, showLabels = true, animated = true }) => {
  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 flex items-end justify-around gap-2 mb-2" style={{ height: height - 40 }}>
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * 100;

          return (
            <div key={index} className="flex-1 flex flex-col items-center">
              <motion.div
                initial={animated ? { height: 0 } : false}
                animate={{ height: `${barHeight}%` }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className="w-full max-w-12 rounded-t-lg bg-gradient-to-t from-cyan-600 to-cyan-400 relative group"
              >
                {/* Hover tooltip */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                  ${item.value}M
                  {item.trend && (
                    <span className={item.trend >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {' '}{item.trend >= 0 ? '+' : ''}{item.trend}%
                    </span>
                  )}
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>

      {showLabels && (
        <div className="flex justify-around text-xs text-slate-500">
          {data.map((item, index) => (
            <span key={index} className="flex-1 text-center truncate px-1">
              {item.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

interface DonutChartProps {
  data: ChartData[];
  size: number;
  thickness?: number;
}

const AnimatedDonutChart: React.FC<DonutChartProps> = ({ data, size, thickness = 30 }) => {
  const total = data.reduce((acc, item) => acc + item.value, 0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  let cumulativePercent = 0;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 100 100">
        {data.map((item, index) => {
          const percent = (item.value / total) * 100;
          const startAngle = cumulativePercent * 3.6 - 90;
          cumulativePercent += percent;
          const endAngle = cumulativePercent * 3.6 - 90;

          const startRad = (startAngle * Math.PI) / 180;
          const endRad = (endAngle * Math.PI) / 180;

          const x1 = 50 + 40 * Math.cos(startRad);
          const y1 = 50 + 40 * Math.sin(startRad);
          const x2 = 50 + 40 * Math.cos(endRad);
          const y2 = 50 + 40 * Math.sin(endRad);

          const largeArc = percent > 50 ? 1 : 0;

          return (
            <motion.path
              key={index}
              d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
              fill={item.color}
              opacity={hoveredIndex === null || hoveredIndex === index ? 1 : 0.5}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              initial={{ scale: 0 }}
              animate={{ scale: hoveredIndex === index ? 1.05 : 1 }}
              style={{ transformOrigin: '50px 50px', cursor: 'pointer' }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            />
          );
        })}

        {/* Center hole */}
        <circle cx="50" cy="50" r="25" fill="#0f172a" />
      </svg>

      {/* Center text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-black text-white">
            {hoveredIndex !== null ? `${data[hoveredIndex].value}%` : `${total}%`}
          </p>
          <p className="text-[10px] text-slate-500">
            {hoveredIndex !== null ? data[hoveredIndex].label : 'Всього'}
          </p>
        </div>
      </div>
    </div>
  );
};

interface LineChartComponentProps {
  data: ChartData[];
  height: number;
  filled?: boolean;
  color?: string;
}

const AnimatedLineChart: React.FC<LineChartComponentProps> = ({
  data,
  height,
  filled = false,
  color = '#22d3ee'
}) => {
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue;

  const points = data.map((item, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((item.value - minValue) / range) * 80 - 10;
    return { x, y, value: item.value };
  });

  const pathD = points.map((p, i) =>
    `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
  ).join(' ');

  const areaD = `${pathD} L 100 100 L 0 100 Z`;

  return (
    <svg width="100%" height={height} viewBox="0 0 100 100" preserveAspectRatio="none">
      {/* Grid lines */}
      {[0, 25, 50, 75, 100].map((y) => (
        <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="rgba(100, 116, 139, 0.2)" strokeWidth="0.5" />
      ))}

      {/* Filled area */}
      {filled && (
        <motion.path
          d={areaD}
          fill={`url(#gradient-${color})`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ duration: 1 }}
        />
      )}

      {/* Line */}
      <motion.path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5 }}
      />

      {/* Points */}
      {points.map((p, i) => (
        <motion.circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="2"
          fill={color}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1 + i * 0.1 }}
        />
      ))}

      <defs>
        <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>
    </svg>
  );
};

// ========================
// Chart Card Component
// ========================

interface ChartCardProps {
  title: string;
  type: ChartType;
  children: React.ReactNode;
  gridSpan?: 1 | 2 | 3;
  onExpand?: () => void;
}

const ChartCard: React.FC<ChartCardProps> = ({ title, type, children, gridSpan = 1, onExpand }) => {
  const typeIcons = {
    bar: BarChart3,
    line: LineChart,
    pie: PieChart,
    area: AreaChart,
    heatmap: BarChart3,
    scatter: BarChart3
  };

  const Icon = typeIcons[type];

  return (
    <div className={`
      bg-slate-900/60 border border-white/5 rounded-2xl p-5
      ${gridSpan === 2 ? 'md:col-span-2' : gridSpan === 3 ? 'md:col-span-3' : ''}
    `}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon className="text-cyan-400" size={18} />
          <h3 className="font-bold text-white">{title}</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onExpand}
            className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-colors"
            title="Розгорнути"
          >
            <Maximize2 size={14} />
          </button>
          <button className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-colors">
            <Settings size={14} />
          </button>
        </div>
      </div>
      {children}
    </div>
  );
};

// ========================
// Main Component
// ========================

const AdvancedChartsPremium: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('year');
  const [expandedChart, setExpandedChart] = useState<string | null>(null);
  const [marketTrends, setMarketTrends] = useState<ChartData[]>([]);
  const [categories, setCategories] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [trends, hsAnalytics] = await Promise.all([
          api.premium.getMarketTrends(),
          api.premium.getHSAnalytics()
        ]);

        setMarketTrends(Array.isArray(trends) ? trends : []);
        setCategories((Array.isArray(hsAnalytics) ? hsAnalytics : []).map((item: any) => ({
          label: item.name || item.code,
          value: Math.round(item.volume / 1000000),
          color: ['#22d3ee', '#a855f7', '#22c55e', '#f59e0b', '#ec4899', '#6366f1'][Math.floor(Math.random() * 6)]
        })));
      } catch (err) {
        console.error("Failed to fetch chart data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/3 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-3">
              <BarChart3 className="text-purple-400" />
              Аналітичні Графіки
              <span className="ml-2 px-3 py-1 bg-amber-500/20 text-amber-400 text-sm rounded-full flex items-center gap-1">
                <Crown size={14} />
                Premium
              </span>
            </h1>
            <p className="text-slate-500 mt-1">
              Візуалізація даних в реальному часі
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Time Range */}
            <div className="flex items-center gap-1 p-1 bg-slate-900/60 rounded-xl border border-white/5">
              {(['week', 'month', 'quarter', 'year'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${timeRange === range
                    ? 'bg-purple-500/20 text-purple-400'
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
              <RefreshCw size={16} />
            </button>

            <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold text-sm">
              <Download size={16} />
              Експорт
            </button>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {loading ? (
            Array(6).fill(0).map((_, i) => (
              <div key={i} className="h-64 bg-slate-900/60 rounded-2xl animate-pulse border border-white/5" />
            ))
          ) : (
            <>
              {/* Monthly Import Trend */}
              <ChartCard title="Динаміка імпорту" type="bar" gridSpan={2}>
                <AnimatedBarChart data={marketTrends} height={200} />
              </ChartCard>

              {/* Category Distribution */}
              <ChartCard title="Розподіл по категоріях" type="pie">
                <div className="flex items-center justify-center py-4">
                  <AnimatedDonutChart data={categories} size={180} />
                </div>
              </ChartCard>

              {/* Line Chart */}
              <ChartCard title="Тренд імпорту" type="line">
                <AnimatedLineChart data={marketTrends} height={150} filled color="#a855f7" />
              </ChartCard>

              {/* Country Distribution */}
              <ChartCard title="Країни-імпортери" type="pie">
                <div className="flex items-center justify-center py-4">
                  <AnimatedDonutChart data={categories.slice(0, 3)} size={180} />
                </div>
              </ChartCard>

              {/* Growth Chart */}
              <ChartCard title="Зростання по місяцях" type="area">
                <AnimatedLineChart data={marketTrends} height={150} filled color="#22c55e" />
              </ChartCard>

              {/* Category Bar Chart */}
              <ChartCard title="ТОП Категорії" type="bar" gridSpan={3}>
                <div className="flex items-end gap-4 h-48">
                  {categories.map((item, index) => {
                    const maxVal = Math.max(...categories.map(d => d.value), 1);
                    const height = (item.value / maxVal) * 100;

                    return (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${height}%` }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                          className="w-full rounded-t-xl"
                          style={{ backgroundColor: item.color }}
                        />
                        <div className="mt-3 text-center">
                          <p className="text-white font-bold">${item.value}M</p>
                          <p className="text-xs text-slate-500 mt-1">{item.label}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ChartCard>
            </>
          )}
        </div>

        {/* AI Insights */}
        <div className="mt-8 p-6 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/20 rounded-2xl">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="text-purple-400" size={20} />
            <h2 className="text-lg font-bold text-white">AI Аналіз трендів</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: TrendingUp, title: 'Зростання імпорту', desc: 'Прогнозується зростання на 15% у наступному кварталі', color: 'emerald' },
              { icon: BarChart3, title: 'Сезонність', desc: 'Пік імпорту електроніки очікується в листопаді-грудні', color: 'cyan' },
              { icon: PieChart, title: 'Диверсифікація', desc: 'Рекомендуємо розширити список постачальників з В\'єтнаму', color: 'purple' },
            ].map((insight, i) => (
              <div key={i} className="p-4 bg-slate-900/60 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <insight.icon className={`text-${insight.color}-400`} size={16} />
                  <span className="text-sm font-bold text-white">{insight.title}</span>
                </div>
                <p className="text-sm text-slate-400">{insight.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedChartsPremium;
