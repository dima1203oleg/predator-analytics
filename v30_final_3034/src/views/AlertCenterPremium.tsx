/**
 * 🔔 Alert Management Center
 *
 * Центр управління сповіщеннями та алертами
 * Налаштування та моніторинг подій
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  BellOff,
  BellRing,
  Settings,
  Trash2,
  Check,
  X,
  Plus,
  Filter,
  Search,
  AlertTriangle,
  AlertCircle,
  Info,
  Crown,
  ChevronRight,
  Clock,
  Mail,
  MessageSquare,
  Smartphone,
  Globe,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Package,
  Building2,
  Shield,
  Eye,
  EyeOff,
  Zap,
  Volume2,
  VolumeX
} from 'lucide-react';

// ========================
// Types
// ========================

type AlertPriority = 'critical' | 'high' | 'medium' | 'low';
type AlertStatus = 'active' | 'acknowledged' | 'resolved' | 'snoozed';
type AlertCategory = 'price' | 'competitor' | 'risk' | 'market' | 'system';

interface Alert {
  id: string;
  title: string;
  description: string;
  priority: AlertPriority;
  status: AlertStatus;
  category: AlertCategory;
  createdAt: string;
  source: string;
  data?: Record<string, string | number>;
}

interface AlertRule {
  id: string;
  name: string;
  category: AlertCategory;
  condition: string;
  threshold: number;
  isEnabled: boolean;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  triggeredCount: number;
}

// ========================
// Mock Data
// ========================

const mockAlerts: Alert[] = [
  {
    id: '1',
    title: 'Критичне падіння цін на LED панелі',
    description: 'Ціни впали на 23% за останні 24 години. Рекомендуємо оперативне рішення.',
    priority: 'critical',
    status: 'active',
    category: 'price',
    createdAt: '2026-02-03T03:45:00',
    source: 'Price Monitor',
    data: { change: -23, current: 12.5, previous: 16.2 }
  },
  {
    id: '2',
    title: 'Новий конкурент у сегменті електроніки',
    description: 'Компанія "ТехноМакс" почала активний імпорт з Китаю.',
    priority: 'high',
    status: 'active',
    category: 'competitor',
    createdAt: '2026-02-03T02:30:00',
    source: 'Competitor Watch',
    data: { company: 'ТехноМакс', volume: 450000 }
  },
  {
    id: '3',
    title: 'Підозріла активність: ТОВ "ТрансСхема"',
    description: 'Виявлено 5 декларацій з ознаками заниження вартості.',
    priority: 'high',
    status: 'acknowledged',
    category: 'risk',
    createdAt: '2026-02-02T18:15:00',
    source: 'Risk Scanner'
  },
  {
    id: '4',
    title: 'Зростання попиту на сонячні панелі',
    description: 'Ринковий тренд: імпорт збільшився на 45% за місяць.',
    priority: 'medium',
    status: 'active',
    category: 'market',
    createdAt: '2026-02-02T14:00:00',
    source: 'Market Analyzer'
  },
  {
    id: '5',
    title: 'Новий постачальник з Польщі верифікований',
    description: 'Grupa Azoty пройшла верифікацію. Рейтинг надійності: 97%',
    priority: 'low',
    status: 'resolved',
    category: 'market',
    createdAt: '2026-02-02T10:00:00',
    source: 'Supplier Discovery'
  },
];

const mockRules: AlertRule[] = [
  {
    id: '1',
    name: 'Падіння цін більше 15%',
    category: 'price',
    condition: 'price_change < -15%',
    threshold: -15,
    isEnabled: true,
    notifications: { email: true, push: true, sms: true },
    triggeredCount: 12
  },
  {
    id: '2',
    name: 'Новий конкурент в сегменті',
    category: 'competitor',
    condition: 'new_competitor_detected',
    threshold: 0,
    isEnabled: true,
    notifications: { email: true, push: true, sms: false },
    triggeredCount: 5
  },
  {
    id: '3',
    name: 'Ризик-скор вище 80',
    category: 'risk',
    condition: 'risk_score > 80',
    threshold: 80,
    isEnabled: true,
    notifications: { email: true, push: true, sms: true },
    triggeredCount: 3
  },
  {
    id: '4',
    name: 'Зростання ринку більше 20%',
    category: 'market',
    condition: 'market_growth > 20%',
    threshold: 20,
    isEnabled: false,
    notifications: { email: true, push: false, sms: false },
    triggeredCount: 8
  },
];

// ========================
// Components
// ========================

const priorityConfig = {
  critical: { color: 'rose', icon: AlertTriangle, label: 'Критичний', bg: 'bg-rose-500/20' },
  high: { color: 'amber', icon: AlertCircle, label: 'Високий', bg: 'bg-amber-500/20' },
  medium: { color: 'cyan', icon: Info, label: 'Середній', bg: 'bg-cyan-500/20' },
  low: { color: 'slate', icon: Info, label: 'Низький', bg: 'bg-slate-500/20' }
};

const categoryConfig = {
  price: { icon: DollarSign, label: 'Ціни', color: 'emerald' },
  competitor: { icon: Building2, label: 'Конкуренти', color: 'blue' },
  risk: { icon: Shield, label: 'Ризики', color: 'rose' },
  market: { icon: TrendingUp, label: 'Ринок', color: 'purple' },
  system: { icon: Settings, label: 'Система', color: 'slate' }
};

const AlertCard: React.FC<{ alert: Alert; onAcknowledge: () => void; onResolve: () => void }> = ({
  alert,
  onAcknowledge,
  onResolve
}) => {
  const priority = priorityConfig[alert.priority];
  const category = categoryConfig[alert.category];
  const PriorityIcon = priority.icon;
  const CategoryIcon = category.icon;

  const timeAgo = useMemo(() => {
    const diff = Date.now() - new Date(alert.createdAt).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Щойно';
    if (hours < 24) return `${hours} год тому`;
    return `${Math.floor(hours / 24)} днів тому`;
  }, [alert.createdAt]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        p-4 rounded-xl border border-l-4 transition-all
        ${alert.status === 'active' ? `border-${priority.color}-500/30 border-l-${priority.color}-500 bg-slate-900/60` :
          'border-white/5 bg-slate-900/40'}
        ${alert.status === 'resolved' ? 'opacity-60' : ''}
      `}
    >
      <div className="flex items-start gap-4">
        {/* Priority Icon */}
        <div className={`p-2 rounded-lg ${priority.bg}`}>
          <PriorityIcon className={`text-${priority.color}-400`} size={20} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 text-xs font-bold rounded-full bg-${category.color}-500/20 text-${category.color}-400`}>
              {category.label}
            </span>
            <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${priority.bg} text-${priority.color}-400`}>
              {priority.label}
            </span>
            {alert.status === 'acknowledged' && (
              <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-cyan-500/20 text-cyan-400">
                Переглянуто
              </span>
            )}
            {alert.status === 'resolved' && (
              <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-emerald-500/20 text-emerald-400">
                Вирішено
              </span>
            )}
          </div>

          <h4 className="font-bold text-white mb-1">{alert.title}</h4>
          <p className="text-sm text-slate-400 mb-2">{alert.description}</p>

          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {timeAgo}
            </span>
            <span>{alert.source}</span>
          </div>
        </div>

        {/* Actions */}
        {alert.status === 'active' && (
          <div className="flex items-center gap-2">
            <button
              onClick={onAcknowledge}
              className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-colors"
              title="Переглянуто"
            >
              <Eye size={16} />
            </button>
            <button
              onClick={onResolve}
              className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
              title="Вирішено"
            >
              <Check size={16} />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const RuleCard: React.FC<{ rule: AlertRule; onToggle: () => void }> = ({ rule, onToggle }) => {
  const category = categoryConfig[rule.category];
  const CategoryIcon = category.icon;

  return (
    <div className={`
      p-4 rounded-xl border transition-all
      ${rule.isEnabled ? 'border-white/10 bg-slate-900/60' : 'border-white/5 bg-slate-900/40 opacity-60'}
    `}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-${category.color}-500/20`}>
            <CategoryIcon className={`text-${category.color}-400`} size={18} />
          </div>
          <div>
            <h4 className="font-bold text-white">{rule.name}</h4>
            <p className="text-xs text-slate-500">{rule.condition}</p>
          </div>
        </div>

        {/* Toggle */}
        <button
          onClick={onToggle}
          className={`
            relative w-12 h-6 rounded-full transition-colors
            ${rule.isEnabled ? 'bg-emerald-500' : 'bg-slate-700'}
          `}
        >
          <motion.div
            animate={{ x: rule.isEnabled ? 24 : 2 }}
            className="absolute top-1 w-4 h-4 bg-white rounded-full"
          />
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {rule.notifications.email && <Mail size={14} className="text-slate-400" />}
          {rule.notifications.push && <Bell size={14} className="text-slate-400" />}
          {rule.notifications.sms && <Smartphone size={14} className="text-slate-400" />}
        </div>
        <span className="text-xs text-slate-500">
          Спрацювань: {rule.triggeredCount}
        </span>
      </div>
    </div>
  );
};

// ========================
// Main Component
// ========================

const AlertCenterPremium: React.FC = () => {
  const [alerts, setAlerts] = useState(mockAlerts);
  const [rules, setRules] = useState(mockRules);
  const [filter, setFilter] = useState<AlertPriority | 'all'>('all');
  const [tab, setTab] = useState<'alerts' | 'rules'>('alerts');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAlerts = useMemo(() => {
    let result = [...alerts];

    if (filter !== 'all') {
      result = result.filter(a => a.priority === filter);
    }

    if (searchQuery) {
      result = result.filter(a =>
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return result;
  }, [alerts, filter, searchQuery]);

  const stats = useMemo(() => ({
    total: alerts.length,
    active: alerts.filter(a => a.status === 'active').length,
    critical: alerts.filter(a => a.priority === 'critical' && a.status === 'active').length,
    high: alerts.filter(a => a.priority === 'high' && a.status === 'active').length
  }), [alerts]);

  const acknowledgeAlert = (id: string) => {
    setAlerts(prev => prev.map(a =>
      a.id === id ? { ...a, status: 'acknowledged' as AlertStatus } : a
    ));
  };

  const resolveAlert = (id: string) => {
    setAlerts(prev => prev.map(a =>
      a.id === id ? { ...a, status: 'resolved' as AlertStatus } : a
    ));
  };

  const toggleRule = (id: string) => {
    setRules(prev => prev.map(r =>
      r.id === id ? { ...r, isEnabled: !r.isEnabled } : r
    ));
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/3 w-[600px] h-[600px] bg-rose-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-3">
              <BellRing className="text-amber-400" />
              Центр Сповіщень
              <span className="ml-2 px-3 py-1 bg-amber-500/20 text-amber-400 text-sm rounded-full flex items-center gap-1">
                <Crown size={14} />
                Premium
              </span>
            </h1>
            <p className="text-slate-500 mt-1">
              Управління алертами та правилами сповіщень
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold text-sm">
              <Plus size={16} />
              Нове правило
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900/60 border border-white/5 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <Bell className="text-slate-400" size={18} />
              <span className="text-2xl font-black text-white">{stats.total}</span>
            </div>
            <p className="text-xs text-slate-500">Всього алертів</p>
          </div>

          <div className="bg-slate-900/60 border border-cyan-500/20 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <Zap className="text-cyan-400" size={18} />
              <span className="text-2xl font-black text-cyan-400">{stats.active}</span>
            </div>
            <p className="text-xs text-slate-500">Активних</p>
          </div>

          <div className="bg-slate-900/60 border border-rose-500/20 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="text-rose-400" size={18} />
              <span className="text-2xl font-black text-rose-400">{stats.critical}</span>
            </div>
            <p className="text-xs text-slate-500">Критичних</p>
          </div>

          <div className="bg-slate-900/60 border border-amber-500/20 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <AlertCircle className="text-amber-400" size={18} />
              <span className="text-2xl font-black text-amber-400">{stats.high}</span>
            </div>
            <p className="text-xs text-slate-500">Високих</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setTab('alerts')}
            className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors ${
              tab === 'alerts' ? 'bg-amber-500/20 text-amber-400' : 'text-slate-500 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2">
              <Bell size={16} />
              Алерти ({stats.active})
            </span>
          </button>
          <button
            onClick={() => setTab('rules')}
            className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors ${
              tab === 'rules' ? 'bg-purple-500/20 text-purple-400' : 'text-slate-500 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2">
              <Settings size={16} />
              Правила ({rules.length})
            </span>
          </button>
        </div>

        {/* Alerts Tab */}
        {tab === 'alerts' && (
          <>
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="text"
                  placeholder="Пошук алертів..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-900/60 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div className="flex gap-2">
                {(['all', 'critical', 'high', 'medium', 'low'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                      filter === f
                        ? f === 'all' ? 'bg-white/10 text-white' :
                          f === 'critical' ? 'bg-rose-500/20 text-rose-400' :
                          f === 'high' ? 'bg-amber-500/20 text-amber-400' :
                          f === 'medium' ? 'bg-cyan-500/20 text-cyan-400' :
                          'bg-slate-700 text-slate-300'
                        : 'text-slate-500 hover:text-white'
                    }`}
                  >
                    {f === 'all' ? 'Всі' : priorityConfig[f].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Alerts List */}
            <div className="space-y-3">
              {filteredAlerts.map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onAcknowledge={() => acknowledgeAlert(alert.id)}
                  onResolve={() => resolveAlert(alert.id)}
                />
              ))}

              {filteredAlerts.length === 0 && (
                <div className="text-center py-12">
                  <Bell className="text-slate-600 mx-auto mb-4" size={48} />
                  <p className="text-slate-500">Немає алертів</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Rules Tab */}
        {tab === 'rules' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rules.map((rule) => (
              <RuleCard
                key={rule.id}
                rule={rule}
                onToggle={() => toggleRule(rule.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertCenterPremium;
