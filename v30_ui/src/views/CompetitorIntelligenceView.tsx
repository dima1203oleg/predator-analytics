/**
 * 🎯 Competitor Intelligence View
 *
 * Аналіз конкурентів для бізнесу
 * Хто що імпортує, від кого, за скільки
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Download,
  TrendingUp,
  TrendingDown,
  Building2,
  Package,
  DollarSign,
  Globe,
  Eye,
  Star,
  StarOff,
  ChevronRight,
  ChevronDown,
  BarChart3,
  PieChart,
  Calendar,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Target,
  Users,
  Truck,
  Crown,
  Bell,
  Plus,
  X,
  Info
} from 'lucide-react';

// ========================
// Types
// ========================

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

interface ImportRecord {
  id: string;
  date: string;
  product: string;
  quantity: number;
  value: number;
  country: string;
  supplier: string;
  customs: string;
}

// ========================
// Mock Data
// ========================

const mockCompetitors: Competitor[] = [
  {
    id: '1',
    name: 'ТОВ "ТехноІмпорт Україна"',
    edrpou: '12345678',
    totalImport: 45200000,
    totalExport: 2100000,
    countries: ['Китай', 'В\'єтнам', 'Тайвань'],
    products: ['Електроніка', 'Комплектуючі', 'LED дисплеї'],
    topSuppliers: ['Shenzhen Tech Co.', 'Vietnam Electronics'],
    marketShare: 15.4,
    trend: 'up',
    trendPercent: 23.5,
    riskScore: 12,
    lastActivity: '2026-01-31',
    isTracked: true
  },
  {
    id: '2',
    name: 'ПрАТ "ГлобалТрейд"',
    edrpou: '23456789',
    totalImport: 38900000,
    totalExport: 15600000,
    countries: ['Німеччина', 'Польща', 'Чехія'],
    products: ['Хімія', 'Пластик', 'Полімери'],
    topSuppliers: ['BASF SE', 'Polski Chemia'],
    marketShare: 12.8,
    trend: 'up',
    trendPercent: 8.2,
    riskScore: 5,
    lastActivity: '2026-01-30',
    isTracked: true
  },
  {
    id: '3',
    name: 'ТОВ "АгроХім Плюс"',
    edrpou: '34567890',
    totalImport: 28500000,
    totalExport: 1200000,
    countries: ['Білорусь', 'Польща', 'Литва'],
    products: ['Добрива', 'Засоби захисту', 'Насіння'],
    topSuppliers: ['Belaruskali', 'Grupa Azoty'],
    marketShare: 9.2,
    trend: 'down',
    trendPercent: -12.3,
    riskScore: 25,
    lastActivity: '2026-01-29',
    isTracked: false
  },
  {
    id: '4',
    name: 'ТОВ "МеталТорг Інт."',
    edrpou: '45678901',
    totalImport: 22100000,
    totalExport: 8900000,
    countries: ['Туреччина', 'Індія', 'Китай'],
    products: ['Метал', 'Сплави', 'Прокат'],
    topSuppliers: ['Tata Steel', 'Turkish Iron Works'],
    marketShare: 7.5,
    trend: 'stable',
    trendPercent: 0.5,
    riskScore: 8,
    lastActivity: '2026-01-31',
    isTracked: false
  },
  {
    id: '5',
    name: 'ТОВ "ФрутІмпорт"',
    edrpou: '56789012',
    totalImport: 18700000,
    totalExport: 500000,
    countries: ['Туреччина', 'Єгипет', 'Іспанія'],
    products: ['Фрукти', 'Овочі', 'Цитрусові'],
    topSuppliers: ['Antalya Fruits', 'Cairo Agro'],
    marketShare: 6.1,
    trend: 'up',
    trendPercent: 15.8,
    riskScore: 3,
    lastActivity: '2026-01-31',
    isTracked: true
  },
];

const mockImportHistory: ImportRecord[] = [
  { id: '1', date: '2026-01-31', product: 'Смартфони', quantity: 5000, value: 1250000, country: 'Китай', supplier: 'Shenzhen Tech', customs: 'Бориспіль' },
  { id: '2', date: '2026-01-30', product: 'LED панелі', quantity: 2000, value: 890000, country: 'В\'єтнам', supplier: 'VN Display', customs: 'Одеса' },
  { id: '3', date: '2026-01-28', product: 'Комплектуючі', quantity: 15000, value: 450000, country: 'Тайвань', supplier: 'TW Parts Inc', customs: 'Київ' },
  { id: '4', date: '2026-01-25', product: 'Акумулятори', quantity: 8000, value: 720000, country: 'Китай', supplier: 'Battery World', customs: 'Харків' },
];

// ========================
// Competitor Card
// ========================

interface CompetitorCardProps {
  competitor: Competitor;
  isExpanded: boolean;
  onToggle: () => void;
  onTrack: () => void;
}

const CompetitorCard: React.FC<CompetitorCardProps> = ({
  competitor,
  isExpanded,
  onToggle,
  onTrack
}) => {
  return (
    <motion.div
      layout
      className={`
        bg-slate-900/60 border rounded-2xl overflow-hidden transition-all duration-300
        ${isExpanded ? 'border-cyan-500/30 ring-2 ring-cyan-500/10' : 'border-white/5 hover:border-white/10'}
      `}
    >
      {/* Main Row */}
      <div
        className="p-5 cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            {/* Rank/Logo */}
            <div className={`
              w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg
              ${competitor.marketShare > 10
                ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-400'
                : 'bg-slate-800 text-slate-400'}
            `}>
              <Building2 size={24} />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">{competitor.name}</h3>
                {competitor.isTracked && (
                  <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs rounded-full font-bold">
                    Відстежується
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500">ЄДРПОУ: {competitor.edrpou}</p>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-xs text-slate-400">
                  <span className="text-slate-300">{competitor.products.slice(0, 2).join(', ')}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Stats */}
            <div className="text-right">
              <p className="text-2xl font-black text-white">
                ${(competitor.totalImport / 1000000).toFixed(1)}M
              </p>
              <div className={`flex items-center justify-end gap-1 text-sm ${
                competitor.trend === 'up' ? 'text-emerald-400' :
                competitor.trend === 'down' ? 'text-rose-400' : 'text-slate-400'
              }`}>
                {competitor.trend === 'up' ? <ArrowUpRight size={14} /> :
                 competitor.trend === 'down' ? <ArrowDownRight size={14} /> : null}
                <span>{competitor.trend !== 'stable' && (competitor.trendPercent > 0 ? '+' : '')}{competitor.trendPercent}%</span>
              </div>
            </div>

            {/* Market Share */}
            <div className="w-20">
              <div className="text-center mb-1">
                <span className="text-sm font-bold text-white">{competitor.marketShare}%</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${competitor.marketShare * 5}%` }}
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                />
              </div>
              <p className="text-[10px] text-slate-500 text-center mt-1">ринку</p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onTrack();
                }}
                className={`p-2 rounded-lg transition-colors ${
                  competitor.isTracked
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-slate-800 text-slate-500 hover:text-amber-400'
                }`}
                title={competitor.isTracked ? 'Відписатися' : 'Відстежувати'}
              >
                {competitor.isTracked ? <Star size={18} /> : <StarOff size={18} />}
              </motion.button>

              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                className="text-slate-500"
              >
                <ChevronDown size={20} />
              </motion.div>
            </div>
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
            className="overflow-hidden border-t border-white/5"
          >
            <div className="p-5 bg-slate-950/50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Countries */}
                <div>
                  <h4 className="text-sm font-bold text-slate-400 mb-3 flex items-center gap-2">
                    <Globe size={14} />
                    Країни імпорту
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {competitor.countries.map((country) => (
                      <span key={country} className="px-3 py-1 bg-slate-800 text-slate-300 text-sm rounded-lg">
                        {country}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Products */}
                <div>
                  <h4 className="text-sm font-bold text-slate-400 mb-3 flex items-center gap-2">
                    <Package size={14} />
                    Товарні групи
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {competitor.products.map((product) => (
                      <span key={product} className="px-3 py-1 bg-cyan-500/10 text-cyan-400 text-sm rounded-lg border border-cyan-500/20">
                        {product}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Suppliers */}
                <div>
                  <h4 className="text-sm font-bold text-slate-400 mb-3 flex items-center gap-2">
                    <Truck size={14} />
                    ТОП Постачальники
                  </h4>
                  <div className="space-y-2">
                    {competitor.topSuppliers.map((supplier) => (
                      <div key={supplier} className="flex items-center gap-2 text-sm">
                        <span className="w-2 h-2 bg-emerald-400 rounded-full" />
                        <span className="text-slate-300">{supplier}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Import History */}
              <div className="mt-6">
                <h4 className="text-sm font-bold text-slate-400 mb-3 flex items-center gap-2">
                  <Calendar size={14} />
                  Останні імпортні операції
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs text-slate-500 border-b border-white/5">
                        <th className="pb-2 pr-4">Дата</th>
                        <th className="pb-2 pr-4">Товар</th>
                        <th className="pb-2 pr-4">К-сть</th>
                        <th className="pb-2 pr-4">Вартість</th>
                        <th className="pb-2 pr-4">Країна</th>
                        <th className="pb-2">Постачальник</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {mockImportHistory.map((record) => (
                        <tr key={record.id} className="border-b border-white/5 hover:bg-white/5">
                          <td className="py-3 pr-4 text-slate-400">{record.date}</td>
                          <td className="py-3 pr-4 text-white font-medium">{record.product}</td>
                          <td className="py-3 pr-4 text-slate-300">{record.quantity.toLocaleString()}</td>
                          <td className="py-3 pr-4 text-emerald-400 font-bold">${record.value.toLocaleString()}</td>
                          <td className="py-3 pr-4 text-slate-300">{record.country}</td>
                          <td className="py-3 text-slate-300">{record.supplier}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded-xl font-bold text-sm"
                >
                  <BarChart3 size={16} />
                  Детальний аналіз
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/30 text-purple-400 rounded-xl font-bold text-sm"
                >
                  <Bell size={16} />
                  Налаштувати алерти
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold text-sm"
                >
                  <Download size={16} />
                  Експорт даних
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ========================
// Main Component
// ========================

const CompetitorIntelligenceView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [competitors, setCompetitors] = useState(mockCompetitors);
  const [sortBy, setSortBy] = useState<'import' | 'share' | 'trend'>('import');

  const filteredCompetitors = useMemo(() => {
    let result = [...competitors];

    if (searchQuery) {
      result = result.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.products.some(p => p.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'import':
          return b.totalImport - a.totalImport;
        case 'share':
          return b.marketShare - a.marketShare;
        case 'trend':
          return b.trendPercent - a.trendPercent;
        default:
          return 0;
      }
    });

    return result;
  }, [competitors, searchQuery, sortBy]);

  const toggleTrack = (id: string) => {
    setCompetitors(prev => prev.map(c =>
      c.id === id ? { ...c, isTracked: !c.isTracked } : c
    ));
  };

  const trackedCount = competitors.filter(c => c.isTracked).length;

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-3">
              <Target className="text-cyan-400" />
              Аналіз Конкурентів
            </h1>
            <p className="text-slate-500 mt-1">
              {competitors.length} компаній в базі • {trackedCount} відстежується
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-xl font-bold text-sm">
              <Crown size={16} />
              Premium Insights
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
            <input
              type="text"
              placeholder="Пошук компанії або товару..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-900/60 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-4 py-3 bg-slate-900/60 border border-white/10 rounded-xl text-slate-300 focus:outline-none"
            >
              <option value="import">За обсягом імпорту</option>
              <option value="share">За долею ринку</option>
              <option value="trend">За трендом</option>
            </select>

            <button className="flex items-center gap-2 px-4 py-3 bg-slate-900/60 border border-white/10 rounded-xl text-slate-300">
              <Filter size={18} />
              Фільтри
            </button>
          </div>
        </div>
      </div>

      {/* Competitors List */}
      <div className="max-w-6xl mx-auto space-y-4">
        {filteredCompetitors.map((competitor) => (
          <CompetitorCard
            key={competitor.id}
            competitor={competitor}
            isExpanded={expandedId === competitor.id}
            onToggle={() => setExpandedId(expandedId === competitor.id ? null : competitor.id)}
            onTrack={() => toggleTrack(competitor.id)}
          />
        ))}

        {filteredCompetitors.length === 0 && (
          <div className="text-center py-12">
            <Search className="text-slate-600 mx-auto mb-4" size={48} />
            <p className="text-slate-500">Компаній не знайдено</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompetitorIntelligenceView;
