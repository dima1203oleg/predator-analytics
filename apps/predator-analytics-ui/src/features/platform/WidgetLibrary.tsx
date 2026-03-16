/**
 * 🧩 Widget Library
 *
 * Бібліотека готових віджетів для дашбордів
 * Drag & Drop, налаштування, превью
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Grid3X3,
  Plus,
  Search,
  Filter,
  Star,
  StarOff,
  Copy,
  Download,
  Settings,
  Eye,
  ChevronRight,
  Crown,
  Sparkles,
  BarChart3,
  LineChart,
  PieChart,
  Activity,
  TrendingUp,
  DollarSign,
  Package,
  Building2,
  Globe,
  AlertTriangle,
  Bell,
  Clock,
  Map,
  Table,
  Calendar,
  Target,
  Users,
  Shield,
  Zap,
  Heart,
  Lock
} from 'lucide-react';

// ========================
// Types
// ========================

type WidgetCategory = 'charts' | 'metrics' | 'tables' | 'maps' | 'alerts' | 'custom';
type WidgetSize = 'small' | 'medium' | 'large';

interface Widget {
  id: string;
  name: string;
  description: string;
  category: WidgetCategory;
  size: WidgetSize;
  icon: React.ElementType;
  color: string;
  isPremium: boolean;
  isFavorite: boolean;
  usageCount: number;
  preview: React.ReactNode;
}

// ========================
// Widget Previews
// ========================

const MiniBarChart: React.FC = () => (
  <div className="flex items-end gap-1 h-12">
    {[40, 65, 45, 80, 55, 70, 90].map((h, i) => (
      <motion.div
        key={i}
        initial={{ height: 0 }}
        animate={{ height: `${h}%` }}
        transition={{ delay: i * 0.05 }}
        className="flex-1 bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t"
      />
    ))}
  </div>
);

const MiniLineChart: React.FC = () => (
  <svg width="100%" height="48" viewBox="0 0 100 48" className="overflow-visible">
    <motion.path
      d="M 0 40 Q 15 20, 30 30 T 50 25 T 70 35 T 100 10"
      fill="none"
      stroke="url(#lineGradient)"
      strokeWidth="2"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 1 }}
    />
    <defs>
      <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#22d3ee" />
        <stop offset="100%" stopColor="#a855f7" />
      </linearGradient>
    </defs>
  </svg>
);

const MiniDonut: React.FC = () => (
  <div className="relative w-12 h-12 mx-auto">
    <svg width="48" height="48" viewBox="0 0 48 48">
      <circle cx="24" cy="24" r="18" fill="none" stroke="#334155" strokeWidth="6" />
      <motion.circle
        cx="24"
        cy="24"
        r="18"
        fill="none"
        stroke="#22d3ee"
        strokeWidth="6"
        strokeDasharray="113"
        strokeDashoffset="28"
        initial={{ strokeDashoffset: 113 }}
        animate={{ strokeDashoffset: 28 }}
        transition={{ duration: 1 }}
        transform="rotate(-90 24 24)"
      />
    </svg>
  </div>
);

const MiniMetric: React.FC<{ value: string; change: string }> = ({ value, change }) => (
  <div className="text-center">
    <p className="text-xl font-black text-white">{value}</p>
    <p className="text-xs text-emerald-400">{change}</p>
  </div>
);

// ========================
// Mock Data
// ========================

const widgets: Widget[] = [
  {
    id: '1',
    name: 'Bar Chart',
    description: 'Стовпчастий графік для порівняння значень',
    category: 'charts',
    size: 'medium',
    icon: BarChart3,
    color: 'cyan',
    isPremium: false,
    isFavorite: true,
    usageCount: 1245,
    preview: <MiniBarChart />
  },
  {
    id: '2',
    name: 'Line Chart',
    description: 'Лінійний графік для відображення трендів',
    category: 'charts',
    size: 'medium',
    icon: LineChart,
    color: 'purple',
    isPremium: false,
    isFavorite: true,
    usageCount: 987,
    preview: <MiniLineChart />
  },
  {
    id: '3',
    name: 'Pie Chart',
    description: 'Кругова діаграма для розподілу',
    category: 'charts',
    size: 'small',
    icon: PieChart,
    color: 'amber',
    isPremium: false,
    isFavorite: false,
    usageCount: 756,
    preview: <MiniDonut />
  },
  {
    id: '4',
    name: 'KPI Metric',
    description: 'Великі числа з індикатором зміни',
    category: 'metrics',
    size: 'small',
    icon: TrendingUp,
    color: 'emerald',
    isPremium: false,
    isFavorite: true,
    usageCount: 2134,
    preview: <MiniMetric value="$2.4M" change="+12.5%" />
  },
  {
    id: '5',
    name: 'Import Counter',
    description: 'Лічильник імпортних операцій',
    category: 'metrics',
    size: 'small',
    icon: Package,
    color: 'cyan',
    isPremium: false,
    isFavorite: false,
    usageCount: 543,
    preview: <MiniMetric value="7,432" change="+234 сьогодні" />
  },
  {
    id: '6',
    name: 'Alert List',
    description: 'Список активних сповіщень',
    category: 'alerts',
    size: 'large',
    icon: Bell,
    color: 'rose',
    isPremium: false,
    isFavorite: false,
    usageCount: 432,
    preview: (
      <div className="space-y-1">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-2 bg-slate-700 rounded animate-pulse" style={{ width: `${100 - i * 20}%` }} />
        ))}
      </div>
    )
  },
  {
    id: '7',
    name: 'Trade Map',
    description: 'Інтерактивна карта торгових потоків',
    category: 'maps',
    size: 'large',
    icon: Map,
    color: 'purple',
    isPremium: true,
    isFavorite: false,
    usageCount: 321,
    preview: (
      <div className="relative h-12 bg-slate-700/50 rounded flex items-center justify-center">
        <Globe className="text-slate-500" size={20} />
      </div>
    )
  },
  {
    id: '8',
    name: 'Real-time Stream',
    description: 'WebSocket дані в реальному часі',
    category: 'custom',
    size: 'medium',
    icon: Activity,
    color: 'emerald',
    isPremium: true,
    isFavorite: true,
    usageCount: 567,
    preview: <MiniLineChart />
  },
  {
    id: '9',
    name: 'Competitor Table',
    description: 'Таблиця конкурентів з сортуванням',
    category: 'tables',
    size: 'large',
    icon: Table,
    color: 'blue',
    isPremium: false,
    isFavorite: false,
    usageCount: 678,
    preview: (
      <div className="space-y-1">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex gap-2">
            <div className="h-2 w-8 bg-slate-700 rounded" />
            <div className="h-2 flex-1 bg-slate-700 rounded" />
            <div className="h-2 w-12 bg-slate-700 rounded" />
          </div>
        ))}
      </div>
    )
  },
  {
    id: '10',
    name: 'Risk Score Gauge',
    description: 'Індикатор ризик-скору',
    category: 'metrics',
    size: 'small',
    icon: Shield,
    color: 'rose',
    isPremium: true,
    isFavorite: false,
    usageCount: 234,
    preview: <MiniDonut />
  },
];

const categories: { id: WidgetCategory; label: string; icon: React.ElementType }[] = [
  { id: 'charts', label: 'Графіки', icon: BarChart3 },
  { id: 'metrics', label: 'Метрики', icon: TrendingUp },
  { id: 'tables', label: 'Таблиці', icon: Table },
  { id: 'maps', label: 'Карти', icon: Map },
  { id: 'alerts', label: 'Алерти', icon: Bell },
  { id: 'custom', label: 'Кастомні', icon: Sparkles },
];

// ========================
// Components
// ========================

interface WidgetCardProps {
  widget: Widget;
  onAddWidget: () => void;
  onToggleFavorite: () => void;
}

const WidgetCard: React.FC<WidgetCardProps> = ({ widget, onAddWidget, onToggleFavorite }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden
        ${isHovered ? 'border-cyan-500/30 bg-slate-900/80' : 'border-white/5 bg-slate-900/40'}
      `}
    >
      {/* Premium Badge */}
      {widget.isPremium && (
        <div className="absolute top-2 right-2 px-2 py-0.5 bg-amber-500/20 border border-amber-500/30 rounded-full flex items-center gap-1">
          <Crown size={10} className="text-amber-400" />
          <span className="text-[10px] font-bold text-amber-400">PRO</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg bg-${widget.color}-500/20`}>
          <widget.icon className={`text-${widget.color}-400`} size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-white text-sm truncate">{widget.name}</h4>
          <p className="text-[10px] text-slate-500">{widget.usageCount} використань</p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
          className="p-1 hover:bg-white/10 rounded transition-colors"
        >
          {widget.isFavorite ? (
            <Star size={14} className="text-amber-400 fill-amber-400" />
          ) : (
            <StarOff size={14} className="text-slate-500" />
          )}
        </button>
      </div>

      {/* Preview */}
      <div className="h-16 mb-3 flex items-center justify-center">
        {widget.preview}
      </div>

      {/* Description */}
      <p className="text-xs text-slate-400 mb-3 line-clamp-2">{widget.description}</p>

      {/* Actions */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex gap-2"
          >
            <button
              onClick={onAddWidget}
              className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg font-bold text-xs transition-colors ${
                widget.isPremium
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-cyan-500/20 text-cyan-400'
              }`}
            >
              {widget.isPremium ? <Lock size={12} /> : <Plus size={12} />}
              {widget.isPremium ? 'Upgrade' : 'Додати'}
            </button>
            <button className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors">
              <Eye size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ========================
// Main Component
// ========================

const WidgetLibrary: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<WidgetCategory | 'all'>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [widgetList, setWidgetList] = useState(widgets);

  const filteredWidgets = useMemo(() => {
    let result = [...widgetList];

    if (searchQuery) {
      result = result.filter(w =>
        w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      result = result.filter(w => w.category === selectedCategory);
    }

    if (showFavoritesOnly) {
      result = result.filter(w => w.isFavorite);
    }

    return result;
  }, [widgetList, searchQuery, selectedCategory, showFavoritesOnly]);

  const toggleFavorite = (id: string) => {
    setWidgetList(prev => prev.map(w =>
      w.id === id ? { ...w, isFavorite: !w.isFavorite } : w
    ));
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/3 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-3">
              <Grid3X3 className="text-purple-400" />
              Widget Library
              <span className="ml-2 px-3 py-1 bg-amber-500/20 text-amber-400 text-sm rounded-full flex items-center gap-1">
                <Crown size={14} />
                Premium
              </span>
            </h1>
            <p className="text-slate-500 mt-1">
              {widgets.length} віджетів для ваших дашбордів
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-colors ${
                showFavoritesOnly ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400'
              }`}
            >
              <Star size={16} />
              Улюблені
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold text-sm">
              <Sparkles size={16} />
              Створити віджет
            </button>
          </div>
        </div>

        {/* Search & Categories */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Пошук віджетів..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-900/60 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                selectedCategory === 'all' ? 'bg-purple-500/20 text-purple-400' : 'text-slate-500 hover:text-white'
              }`}
            >
              Всі
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  selectedCategory === cat.id ? 'bg-purple-500/20 text-purple-400' : 'text-slate-500 hover:text-white'
                }`}
              >
                <cat.icon size={14} />
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Widgets Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredWidgets.map((widget) => (
            <WidgetCard
              key={widget.id}
              widget={widget}
              onAddWidget={() => console.log('Add widget:', widget.id)}
              onToggleFavorite={() => toggleFavorite(widget.id)}
            />
          ))}
        </div>

        {filteredWidgets.length === 0 && (
          <div className="text-center py-16">
            <Grid3X3 className="text-slate-700 mx-auto mb-4" size={48} />
            <p className="text-slate-500">Віджетів не знайдено</p>
          </div>
        )}

        {/* Stats */}
        <div className="mt-8 p-6 bg-slate-900/40 border border-white/5 rounded-xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { label: 'Всього віджетів', value: widgets.length.toString() },
              { label: 'Premium', value: widgets.filter(w => w.isPremium).length.toString() },
              { label: 'Ваші улюблені', value: widgetList.filter(w => w.isFavorite).length.toString() },
              { label: 'Категорій', value: categories.length.toString() },
            ].map((stat, i) => (
              <div key={i}>
                <p className="text-2xl font-black text-purple-400">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WidgetLibrary;
