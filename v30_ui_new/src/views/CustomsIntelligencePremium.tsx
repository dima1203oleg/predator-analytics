/**
 * 💎 Premium Customs Intelligence Dashboard
 *
 * Комерційна платформа аналітики митних даних
 * Для бізнесу та контролюючих органів
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Package,
  DollarSign,
  Globe,
  Building2,
  Users,
  ShieldAlert,
  Eye,
  Search,
  Filter,
  Download,
  Star,
  Crown,
  Lock,
  Zap,
  Target,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart,
  Map,
  FileText,
  Bell,
  Sparkles,
  ChevronRight
} from 'lucide-react';

// ========================
// Types
// ========================

interface UserRole {
  type: 'business' | 'government' | 'premium';
  title: string;
  icon: typeof Crown;
  color: string;
  features: string[];
}

interface CustomsRecord {
  id: string;
  company: string;
  product: string;
  amount: number;
  value: number;
  country: string;
  date: string;
  type: 'import' | 'export';
  taxCode: string;
  riskScore?: number;
}

interface CompetitorData {
  name: string;
  imports: number;
  exports: number;
  topProducts: string[];
  countries: string[];
  trend: 'up' | 'down' | 'stable';
  marketShare: number;
}

// ========================
// User Roles Config
// ========================

const userRoles: UserRole[] = [
  {
    type: 'business',
    title: 'Бізнес Аналітика',
    icon: Building2,
    color: 'cyan',
    features: [
      'Аналіз конкурентів',
      'Ринкові тренди',
      'Пошук постачальників',
      'Цінова аналітика'
    ]
  },
  {
    type: 'government',
    title: 'Контроль та Моніторинг',
    icon: ShieldAlert,
    color: 'rose',
    features: [
      'Виявлення порушень',
      'Ризик-моніторинг',
      'Схеми ухилення',
      'Компроматні зв\'язки'
    ]
  },
  {
    type: 'premium',
    title: 'Premium Intelligence',
    icon: Crown,
    color: 'amber',
    features: [
      'AI прогнози',
      'Інсайдерські дані',
      'Власні дашборди',
      'API доступ'
    ]
  }
];

// ========================
// Mock Data
// ========================

const mockTopImporters: CompetitorData[] = [
  { name: 'ТОВ "Укрторг"', imports: 15420000, exports: 2100000, topProducts: ['Електроніка', 'Комплектуючі'], countries: ['Китай', 'В\'єтнам'], trend: 'up', marketShare: 12.5 },
  { name: 'ТОВ "ГлобалТрейд"', imports: 12800000, exports: 8900000, topProducts: ['Хімія', 'Пластик'], countries: ['Німеччина', 'Польща'], trend: 'up', marketShare: 10.2 },
  { name: 'ТОВ "АгроІмпорт"', imports: 9500000, exports: 1200000, topProducts: ['Добрива', 'Техніка'], countries: ['Білорусь', 'Росія'], trend: 'down', marketShare: 7.8 },
  { name: 'ПрАТ "МеталТорг"', imports: 8200000, exports: 5600000, topProducts: ['Метал', 'Сплави'], countries: ['Туреччина', 'Індія'], trend: 'stable', marketShare: 6.5 },
  { name: 'ТОВ "ТехноІмпорт"', imports: 7100000, exports: 900000, topProducts: ['Обладнання', 'Запчастини'], countries: ['Китай', 'Тайвань'], trend: 'up', marketShare: 5.8 },
];

const mockRiskAlerts = [
  { id: 1, company: 'ТОВ "Схема"', risk: 'high', reason: 'Заниження митної вартості на 340%', amount: 2400000 },
  { id: 2, company: 'ФОП Петренко', risk: 'high', reason: 'Підозріла зміна кодів УКТЗЕД', amount: 890000 },
  { id: 3, company: 'ТОВ "Транзит"', risk: 'medium', reason: 'Нетипові обсяги для галузі', amount: 1200000 },
  { id: 4, company: 'ТОВ "Оптима"', risk: 'medium', reason: 'Пов\'язані структури в офшорах', amount: 5600000 },
];

// ========================
// Premium KPI Cards
// ========================

interface KPICardProps {
  title: string;
  value: string;
  change: number;
  icon: typeof TrendingUp;
  color: string;
  premium?: boolean;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, change, icon: Icon, color, premium }) => (
  <motion.div
    whileHover={{ scale: 1.02, y: -4 }}
    className={`
      relative overflow-hidden rounded-2xl p-6
      bg-gradient-to-br from-slate-900/90 to-slate-950/90
      border border-white/10 backdrop-blur-xl
      ${premium ? 'ring-2 ring-amber-500/50' : ''}
    `}
  >
    {/* Glow effect */}
    <div className={`absolute -top-20 -right-20 w-40 h-40 bg-${color}-500/20 rounded-full blur-3xl`} />

    {premium && (
      <div className="absolute top-3 right-3">
        <Crown size={16} className="text-amber-400" />
      </div>
    )}

    <div className="relative z-10">
      <div className={`inline-flex p-3 rounded-xl bg-${color}-500/20 mb-4`}>
        <Icon className={`text-${color}-400`} size={24} />
      </div>

      <p className="text-slate-400 text-sm mb-1">{title}</p>
      <p className="text-3xl font-black text-white mb-2">{value}</p>

      <div className={`inline-flex items-center gap-1 text-sm ${change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
        {change >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
        <span className="font-bold">{Math.abs(change)}%</span>
        <span className="text-slate-500">vs минулий місяць</span>
      </div>
    </div>
  </motion.div>
);

// ========================
// Competitor Analysis Card
// ========================

const CompetitorCard: React.FC<{ data: CompetitorData; rank: number }> = ({ data, rank }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: rank * 0.1 }}
    className="group relative overflow-hidden rounded-xl bg-slate-900/60 border border-white/5 p-4 hover:border-cyan-500/30 transition-all duration-300"
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className={`
          w-10 h-10 rounded-full flex items-center justify-center font-black text-lg
          ${rank === 0 ? 'bg-amber-500/20 text-amber-400' :
            rank === 1 ? 'bg-slate-400/20 text-slate-300' :
            rank === 2 ? 'bg-orange-600/20 text-orange-400' :
            'bg-slate-800 text-slate-500'}
        `}>
          {rank + 1}
        </div>

        <div>
          <h4 className="font-bold text-white group-hover:text-cyan-400 transition-colors">
            {data.name}
          </h4>
          <p className="text-xs text-slate-500">
            {data.topProducts.join(' • ')}
          </p>
        </div>
      </div>

      <div className="text-right">
        <p className="text-lg font-black text-white">
          ${(data.imports / 1000000).toFixed(1)}M
        </p>
        <div className={`flex items-center justify-end gap-1 text-xs ${
          data.trend === 'up' ? 'text-emerald-400' :
          data.trend === 'down' ? 'text-rose-400' : 'text-slate-400'
        }`}>
          {data.trend === 'up' ? <TrendingUp size={12} /> :
           data.trend === 'down' ? <TrendingDown size={12} /> : null}
          <span>{data.marketShare}% ринку</span>
        </div>
      </div>
    </div>

    {/* Hover reveal - more details */}
    <motion.div
      className="mt-4 pt-4 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity"
    >
      <div className="flex gap-4 text-xs">
        <div>
          <span className="text-slate-500">Країни:</span>
          <span className="ml-2 text-slate-300">{data.countries.join(', ')}</span>
        </div>
        <div>
          <span className="text-slate-500">Експорт:</span>
          <span className="ml-2 text-emerald-400">${(data.exports / 1000000).toFixed(1)}M</span>
        </div>
      </div>
    </motion.div>
  </motion.div>
);

// ========================
// Risk Alert Card
// ========================

const RiskAlertCard: React.FC<{ alert: typeof mockRiskAlerts[0] }> = ({ alert }) => (
  <motion.div
    whileHover={{ x: 4 }}
    className={`
      p-4 rounded-xl border-l-4 bg-slate-900/60
      ${alert.risk === 'high' ? 'border-rose-500' : 'border-amber-500'}
    `}
  >
    <div className="flex items-start justify-between">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle size={14} className={alert.risk === 'high' ? 'text-rose-400' : 'text-amber-400'} />
          <span className={`text-xs font-bold uppercase ${alert.risk === 'high' ? 'text-rose-400' : 'text-amber-400'}`}>
            {alert.risk === 'high' ? 'Високий ризик' : 'Середній ризик'}
          </span>
        </div>
        <p className="font-bold text-white">{alert.company}</p>
        <p className="text-sm text-slate-400 mt-1">{alert.reason}</p>
      </div>
      <div className="text-right">
        <p className="text-lg font-black text-white">
          ₴{(alert.amount / 1000).toFixed(0)}K
        </p>
        <button className="mt-2 text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
          Розслідувати <ChevronRight size={12} />
        </button>
      </div>
    </div>
  </motion.div>
);

// ========================
// Premium Feature Lock
// ========================

const PremiumLock: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/80 to-slate-950/80 border border-amber-500/20 p-8">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(251,191,36,0.1),transparent)] pointer-events-none" />

    <div className="relative z-10 text-center">
      <div className="inline-flex p-4 rounded-2xl bg-amber-500/10 mb-4">
        <Lock className="text-amber-400" size={32} />
      </div>

      <h3 className="text-xl font-black text-white mb-2">{title}</h3>
      <p className="text-slate-400 mb-6 max-w-md mx-auto">{description}</p>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black rounded-xl flex items-center gap-2 mx-auto"
      >
        <Crown size={18} />
        Отримати Premium
      </motion.button>
    </div>
  </div>
);

// ========================
// Main Dashboard Component
// ========================

const CustomsIntelligencePremium: React.FC = () => {
  const [activeRole, setActiveRole] = useState<'business' | 'government' | 'premium'>('business');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPremium] = useState(true); // Toggle for premium access

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
                  <Target className="text-white" size={20} />
                </div>
                <div>
                  <h1 className="text-lg font-black text-white tracking-tight">
                    CUSTOMS INTELLIGENCE
                  </h1>
                  <p className="text-xs text-slate-500">Аналітика митних даних • Січень 2026</p>
                </div>
              </div>
            </div>

            {/* Role Switcher */}
            <div className="flex items-center gap-2 p-1 bg-slate-900/60 rounded-xl border border-white/5">
              {userRoles.map((role) => (
                <button
                  key={role.type}
                  onClick={() => setActiveRole(role.type)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all
                    ${activeRole === role.type
                      ? `bg-${role.color}-500/20 text-${role.color}-400 border border-${role.color}-500/30`
                      : 'text-slate-500 hover:text-slate-300'}
                  `}
                >
                  <role.icon size={16} />
                  <span className="hidden md:inline">{role.title}</span>
                </button>
              ))}
            </div>

            {/* Premium Badge */}
            {isPremium && (
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-xl">
                <Crown className="text-amber-400" size={16} />
                <span className="text-amber-400 font-bold text-sm">Premium</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
            <input
              type="text"
              placeholder="Пошук компанії, товару, коду УКТЗЕД..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-900/60 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20"
            />
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-3 bg-slate-900/60 border border-white/10 rounded-xl text-slate-300 hover:bg-slate-800/60 transition-colors">
              <Filter size={18} />
              <span>Фільтри</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-3 bg-cyan-500/20 border border-cyan-500/30 rounded-xl text-cyan-400 hover:bg-cyan-500/30 transition-colors">
              <Download size={18} />
              <span>Експорт</span>
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KPICard
            title="Загальний імпорт"
            value="$847M"
            change={12.4}
            icon={Package}
            color="cyan"
          />
          <KPICard
            title="Унікальних компаній"
            value="12,847"
            change={8.2}
            icon={Building2}
            color="purple"
          />
          <KPICard
            title="Митні платежі"
            value="₴2.4B"
            change={-3.1}
            icon={DollarSign}
            color="emerald"
          />
          <KPICard
            title="Ризикові операції"
            value="847"
            change={24.5}
            icon={AlertTriangle}
            color="rose"
            premium
          />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Column - Competitor Analysis */}
          <div className="lg:col-span-2 space-y-6">

            {/* Top Importers */}
            <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <BarChart3 className="text-cyan-400" size={20} />
                    ТОП Імпортери
                  </h2>
                  <p className="text-sm text-slate-500">За обсягом імпорту за місяць</p>
                </div>
                <button className="text-cyan-400 text-sm hover:text-cyan-300 flex items-center gap-1">
                  Всі компанії <ChevronRight size={14} />
                </button>
              </div>

              <div className="space-y-3">
                {mockTopImporters.map((company, index) => (
                  <CompetitorCard key={company.name} data={company} rank={index} />
                ))}
              </div>
            </div>

            {/* Market Map (Premium) */}
            {activeRole === 'premium' && isPremium ? (
              <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-black text-white flex items-center gap-2">
                      <Globe className="text-purple-400" size={20} />
                      Геокарта торгівлі
                      <span className="ml-2 px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">Premium</span>
                    </h2>
                    <p className="text-sm text-slate-500">Візуалізація торгових потоків</p>
                  </div>
                </div>

                {/* Placeholder for map */}
                <div className="h-[300px] bg-slate-800/50 rounded-xl flex items-center justify-center border border-white/5">
                  <div className="text-center">
                    <Map className="text-slate-600 mx-auto mb-2" size={48} />
                    <p className="text-slate-500">Інтерактивна карта торгівлі</p>
                    <p className="text-xs text-slate-600">Реальні торгові потоки між країнами</p>
                  </div>
                </div>
              </div>
            ) : (
              <PremiumLock
                title="Геокарта торгівлі"
                description="Інтерактивна візуалізація торгових потоків між країнами з аналітикою обсягів та трендів"
              />
            )}
          </div>

          {/* Right Column - Alerts & Insights */}
          <div className="space-y-6">

            {/* Risk Alerts (Government) */}
            {activeRole === 'government' || activeRole === 'premium' ? (
              <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-black text-white flex items-center gap-2">
                      <ShieldAlert className="text-rose-400" size={20} />
                      Ризик-алерти
                    </h2>
                    <p className="text-sm text-slate-500">Підозрілі операції</p>
                  </div>
                  <span className="px-3 py-1 bg-rose-500/20 text-rose-400 text-xs font-bold rounded-full">
                    {mockRiskAlerts.length} нових
                  </span>
                </div>

                <div className="space-y-3">
                  {mockRiskAlerts.map((alert) => (
                    <RiskAlertCard key={alert.id} alert={alert} />
                  ))}
                </div>
              </div>
            ) : (
              <PremiumLock
                title="Ризик-моніторинг"
                description="Автоматичне виявлення підозрілих схем, заниження вартості та порушень митного законодавства"
              />
            )}

            {/* AI Insights */}
            <div className="bg-gradient-to-br from-purple-500/10 to-cyan-500/10 border border-purple-500/20 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="text-purple-400" size={20} />
                <h2 className="text-lg font-black text-white">AI Інсайти</h2>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-slate-900/60 rounded-xl">
                  <p className="text-sm text-slate-300">
                    <span className="text-cyan-400 font-bold">Тренд:</span> Імпорт електроніки з Китаю зріс на 34% за останній тиждень
                  </p>
                </div>
                <div className="p-4 bg-slate-900/60 rounded-xl">
                  <p className="text-sm text-slate-300">
                    <span className="text-amber-400 font-bold">Увага:</span> 15 компаній змінили код УКТЗЕД на товари з меншим митом
                  </p>
                </div>
                <div className="p-4 bg-slate-900/60 rounded-xl">
                  <p className="text-sm text-slate-300">
                    <span className="text-emerald-400 font-bold">Можливість:</span> Нові постачальники добрив з Польщі пропонують ціни на 12% нижче
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6">
              <h2 className="text-lg font-black text-white mb-4">Швидкі дії</h2>

              <div className="space-y-2">
                {[
                  { icon: Search, label: 'Знайти конкурентів', color: 'cyan' },
                  { icon: Target, label: 'Аналіз постачальника', color: 'purple' },
                  { icon: BarChart3, label: 'Побудувати звіт', color: 'emerald' },
                  { icon: Bell, label: 'Налаштувати алерти', color: 'amber' },
                ].map((action) => (
                  <motion.button
                    key={action.label}
                    whileHover={{ x: 4 }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 hover:bg-${action.color}-500/10 border border-transparent hover:border-${action.color}-500/30 transition-all text-left`}
                  >
                    <action.icon size={18} className={`text-${action.color}-400`} />
                    <span className="text-slate-300 text-sm">{action.label}</span>
                    <ChevronRight size={14} className="ml-auto text-slate-600" />
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CustomsIntelligencePremium;
