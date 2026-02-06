/**
 * 📱 Mobile Command Center
 *
 * Оптимізований мобільний інтерфейс
 * Швидкий доступ до ключових функцій
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Search,
  Bell,
  User,
  Menu,
  X,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Building2,
  Globe,
  ChevronRight,
  ChevronDown,
  Star,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Crown,
  BarChart3,
  PieChart,
  Target,
  Shield,
  Truck,
  Settings,
  Plus
} from 'lucide-react';

// ========================
// Types
// ========================

interface QuickStat {
  label: string;
  value: string;
  change: number;
  icon: React.ElementType;
  color: string;
}

interface RecentItem {
  id: string;
  type: 'import' | 'competitor' | 'alert' | 'price';
  title: string;
  subtitle: string;
  time: string;
  isNew: boolean;
}

// ========================
// Mock Data
// ========================

const quickStats: QuickStat[] = [
  { label: 'Імпорт сьогодні', value: '$2.4M', change: 12.5, icon: Package, color: 'cyan' },
  { label: 'Активні алерти', value: '7', change: -3, icon: Bell, color: 'amber' },
  { label: 'Нові конкуренти', value: '3', change: 2, icon: Building2, color: 'purple' },
  { label: 'Економія', value: '15%', change: 5.2, icon: DollarSign, color: 'emerald' },
];

const recentItems: RecentItem[] = [
  { id: '1', type: 'alert', title: 'Критичне падіння цін', subtitle: 'LED панелі -23%', time: '5 хв', isNew: true },
  { id: '2', type: 'competitor', title: 'Новий конкурент', subtitle: 'ТехноМакс', time: '15 хв', isNew: true },
  { id: '3', type: 'import', title: 'Нова партія з Китаю', subtitle: '$450K електроніки', time: '1 год', isNew: false },
  { id: '4', type: 'price', title: 'Ціна знизилась', subtitle: 'Добрива NPK -8%', time: '2 год', isNew: false },
];

// ========================
// Components
// ========================

const QuickStatCard: React.FC<{ stat: QuickStat }> = ({ stat }) => (
  <motion.div
    whileTap={{ scale: 0.95 }}
    className="p-4 bg-slate-900/80 border border-white/5 rounded-2xl"
  >
    <div className="flex items-center justify-between mb-3">
      <div className={`p-2 rounded-xl bg-${stat.color}-500/20`}>
        <stat.icon className={`text-${stat.color}-400`} size={20} />
      </div>
      <div className={`flex items-center gap-1 text-xs ${stat.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
        {stat.change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        {stat.change > 0 ? '+' : ''}{stat.change}%
      </div>
    </div>
    <p className="text-2xl font-black text-white">{stat.value}</p>
    <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
  </motion.div>
);

const RecentItemCard: React.FC<{ item: RecentItem }> = ({ item }) => {
  const typeConfig = {
    import: { icon: Package, color: 'cyan' },
    competitor: { icon: Building2, color: 'purple' },
    alert: { icon: AlertTriangle, color: 'amber' },
    price: { icon: DollarSign, color: 'emerald' }
  };

  const config = typeConfig[item.type];
  const Icon = config.icon;

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      className="flex items-center gap-4 p-4 bg-slate-900/60 border border-white/5 rounded-xl"
    >
      <div className={`p-2 rounded-xl bg-${config.color}-500/20`}>
        <Icon className={`text-${config.color}-400`} size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-bold text-white text-sm truncate">{item.title}</h4>
          {item.isNew && (
            <span className="px-1.5 py-0.5 bg-cyan-500/20 text-cyan-400 text-[10px] font-bold rounded">
              NEW
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500">{item.subtitle}</p>
      </div>
      <div className="text-right">
        <p className="text-xs text-slate-500">{item.time}</p>
      </div>
      <ChevronRight className="text-slate-600" size={16} />
    </motion.div>
  );
};

const QuickAction: React.FC<{ icon: React.ElementType; label: string; color: string; badge?: number }> = ({
  icon: Icon,
  label,
  color,
  badge
}) => (
  <motion.button
    whileTap={{ scale: 0.9 }}
    className="flex flex-col items-center gap-2 py-4"
  >
    <div className={`relative p-4 rounded-2xl bg-${color}-500/20`}>
      <Icon className={`text-${color}-400`} size={24} />
      {badge && badge > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center bg-rose-500 text-white text-xs font-bold rounded-full">
          {badge}
        </span>
      )}
    </div>
    <span className="text-xs text-slate-400">{label}</span>
  </motion.button>
);

// ========================
// Main Component
// ========================

const MobileCommandCenter: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'search' | 'alerts' | 'profile'>('home');

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-xl border-b border-white/5 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-black text-white flex items-center gap-2">
              PREDATOR
              <span className="text-xs px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded-full">Mobile</span>
            </h1>
            <p className="text-xs text-slate-500">Останнє оновлення: 5 хв тому</p>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative p-2">
              <Bell className="text-slate-400" size={22} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />
            </button>
            <button
              onClick={() => setIsMenuOpen(true)}
              className="p-2"
            >
              <Menu className="text-slate-400" size={22} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          {quickStats.map((stat, i) => (
            <QuickStatCard key={i} stat={stat} />
          ))}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-sm font-bold text-slate-400 mb-4">Швидкі дії</h2>
          <div className="grid grid-cols-4 gap-2 bg-slate-900/40 border border-white/5 rounded-2xl p-2">
            <QuickAction icon={Search} label="Пошук" color="cyan" />
            <QuickAction icon={Target} label="Конкуренти" color="purple" />
            <QuickAction icon={Shield} label="Ризики" color="rose" badge={3} />
            <QuickAction icon={BarChart3} label="Графіки" color="amber" />
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-400">Остання активність</h2>
            <button className="text-xs text-cyan-400">Всі</button>
          </div>
          <div className="space-y-3">
            {recentItems.map((item) => (
              <RecentItemCard key={item.id} item={item} />
            ))}
          </div>
        </div>

        {/* AI Insight */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/20 rounded-2xl"
        >
          <div className="flex items-center gap-2 mb-2">
            <Zap className="text-purple-400" size={16} />
            <span className="text-xs font-bold text-purple-400">AI Інсайт</span>
          </div>
          <p className="text-sm text-white font-medium">
            Рекомендуємо закупити LED панелі сьогодні - ціна найнижча за 3 місяці.
          </p>
          <button className="mt-3 w-full py-2 bg-purple-500/20 border border-purple-500/30 text-purple-400 rounded-xl text-sm font-bold">
            Детальніше
          </button>
        </motion.div>

        {/* Premium Banner */}
        <div className="p-4 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-2xl">
          <div className="flex items-center gap-3">
            <Crown className="text-amber-400" size={24} />
            <div className="flex-1">
              <h3 className="font-bold text-white">Premium Features</h3>
              <p className="text-xs text-amber-400/80">Отримайте повний доступ</p>
            </div>
            <ChevronRight className="text-amber-400" size={20} />
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-white/5 px-6 py-2 z-50">
        <div className="flex items-center justify-around">
          {[
            { id: 'home', icon: Home, label: 'Головна' },
            { id: 'search', icon: Search, label: 'Пошук' },
            { id: 'alerts', icon: Bell, label: 'Алерти', badge: 7 },
            { id: 'profile', icon: User, label: 'Профіль' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`relative flex flex-col items-center gap-1 py-2 px-3 ${
                activeTab === tab.id ? 'text-cyan-400' : 'text-slate-500'
              }`}
            >
              <div className="relative">
                <tab.icon size={22} />
                {tab.badge && (
                  <span className="absolute -top-1 -right-2 w-4 h-4 flex items-center justify-center bg-rose-500 text-white text-[10px] font-bold rounded-full">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px]">{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -bottom-2 w-1 h-1 bg-cyan-400 rounded-full"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Side Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50"
              onClick={() => setIsMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed top-0 right-0 bottom-0 w-72 bg-slate-900 z-50 p-6"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-lg font-bold text-white">Меню</h2>
                <button onClick={() => setIsMenuOpen(false)}>
                  <X className="text-slate-400" size={24} />
                </button>
              </div>

              <div className="space-y-2">
                {[
                  { icon: BarChart3, label: 'Аналітика', badge: null },
                  { icon: Target, label: 'Конкуренти', badge: '3' },
                  { icon: Shield, label: 'Ризики', badge: '!' },
                  { icon: Truck, label: 'Постачальники', badge: null },
                  { icon: Globe, label: 'Карта', badge: null },
                  { icon: Settings, label: 'Налаштування', badge: null },
                ].map((item, i) => (
                  <button
                    key={i}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors"
                  >
                    <item.icon className="text-slate-400" size={20} />
                    <span className="flex-1 text-left text-white">{item.label}</span>
                    {item.badge && (
                      <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                        item.badge === '!' ? 'bg-rose-500/20 text-rose-400' : 'bg-cyan-500/20 text-cyan-400'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MobileCommandCenter;
