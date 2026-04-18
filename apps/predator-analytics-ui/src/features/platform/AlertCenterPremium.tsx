/**
 * 🔔 Alert Management Center
 *
 * Центр управління сповіщеннями та алертами
 * Налаштування та моніторинг подій
 */

import React, { useState, useMemo, useEffect } from 'react';
import { api } from '@/services/api';
import { premiumLocales } from '@/locales/uk/premium';
import { motion, AnimatePresence } from 'framer-motion';
import { RiskLevelValue } from '@/types/intelligence';
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

type AlertPriority = RiskLevelValue;
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
// Mock data removed in favor of real API
// ========================

// ========================
// Components
// ========================

const priorityConfig: Record<AlertPriority, { color: string; icon: any; label: string; bg: string }> = {
  critical: { color: 'amber', icon: AlertTriangle, label: premiumLocales.alertCenter.priority.critical, bg: 'bg-amber-500/20' },
  high: { color: 'amber', icon: AlertCircle, label: premiumLocales.alertCenter.priority.high, bg: 'bg-amber-500/20' },
  medium: { color: 'amber', icon: Info, label: premiumLocales.alertCenter.priority.medium, bg: 'bg-amber-500/20' },
  low: { color: 'slate', icon: Info, label: premiumLocales.alertCenter.priority.low, bg: 'bg-slate-500/20' },
  minimal: { color: 'slate', icon: Info, label: 'Мінімальний', bg: 'bg-slate-500/10' },
  stable: { color: 'emerald', icon: Info, label: 'Стабільний', bg: 'bg-emerald-500/10' },
  watchlist: { color: 'purple', icon: Info, label: 'Нагляд', bg: 'bg-purple-500/10' },
  elevated: { color: 'amber', icon: Info, label: 'Підвищений', bg: 'bg-amber-500/10' },
};

const categoryConfig = {
  price: { icon: DollarSign, label: premiumLocales.alertCenter.category.price, color: 'emerald' },
  competitor: { icon: Building2, label: premiumLocales.alertCenter.category.competitor, color: 'blue' },
  risk: { icon: Shield, label: premiumLocales.alertCenter.category.risk, color: 'amber' },
  market: { icon: TrendingUp, label: premiumLocales.alertCenter.category.market, color: 'purple' },
  system: { icon: Settings, label: premiumLocales.alertCenter.category.system, color: 'slate' }
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
    if (hours < 1) return premiumLocales.alertCenter.time.justNow;
    if (hours < 24) return premiumLocales.alertCenter.time.ago.replace('{time}', `${hours} ${premiumLocales.alertCenter.time.hours}`);
    return premiumLocales.alertCenter.time.ago.replace('{time}', `${Math.floor(hours / 24)} ${premiumLocales.alertCenter.time.days}`);
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
                {premiumLocales.alertCenter.status.acknowledged}
              </span>
            )}
            {alert.status === 'resolved' && (
              <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-emerald-500/20 text-emerald-400">
                {premiumLocales.alertCenter.status.resolved}
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
              title={premiumLocales.alertCenter.actions.acknowledge}
            >
              <Eye size={16} />
            </button>
            <button
              onClick={onResolve}
              className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
              title={premiumLocales.alertCenter.actions.resolve}
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
      flex rounded-xl border transition-all overflow-hidden
      ${rule.isEnabled ? 'border-purple-500/20 bg-slate-900/60' : 'border-white/5 bg-slate-900/40 opacity-60'}
    `}>
      <div className="flex-1 p-4 flex flex-col">
        <div className="flex items-center gap-3 mb-3">
          <div className={`p-2 rounded-lg bg-${category.color}-500/20`}>
            <CategoryIcon className={`text-${category.color}-400`} size={18} />
          </div>
          <div className="flex flex-col">
            <span className="text-white font-bold">{rule.name}</span>
            <span className={`px-2 py-0.5 text-[10px] w-fit font-bold rounded-full bg-${category.color}-500/20 text-${category.color}-400 uppercase tracking-wider`}>
              {category.label}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span className="text-slate-500 text-sm">{premiumLocales.alertCenter.rules.condition}:</span>
          <span className="text-slate-300 text-sm font-mono">{rule.condition} ({rule.threshold})</span>
        </div>

        <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
          <div className="flex gap-2">
            {rule.notifications.email && <Mail size={14} className="text-slate-500" />}
            {rule.notifications.push && <Smartphone size={14} className="text-slate-500" />}
            {rule.notifications.sms && <MessageSquare size={14} className="text-slate-500" />}
          </div>
          <div className="text-[10px] text-slate-500 uppercase tracking-tighter">
            {premiumLocales.alertCenter.rules.triggered.replace('{count}', rule.triggeredCount.toString())}
          </div>
        </div>
      </div>

      <button
        onClick={onToggle}
        className={`
          w-12 flex flex-col items-center justify-center border-l border-white/5 transition-colors
          ${rule.isEnabled ? 'bg-purple-500/10 text-purple-400' : 'bg-slate-800/50 text-slate-600'}
        `}
        title={rule.isEnabled ? premiumLocales.alertCenter.rules.status.enabled : premiumLocales.alertCenter.rules.status.disabled}
      >
        {rule.isEnabled ? <Zap size={18} /> : <EyeOff size={18} />}
        <span className="text-[10px] font-bold uppercase mt-1 vertical-text">
          {rule.isEnabled ? 'ON' : 'OFF'}
        </span>
      </button>
    </div>
  );
};

// ========================
// Main Component
// ========================

const AlertCenterPremium: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<AlertPriority | 'all'>('all');
  const [tab, setTab] = useState<'alerts' | 'rules'>('alerts');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [alertsData, rulesData] = await Promise.all([
          api.premium.getIntelligenceAlerts(),
          api.premium.getAlertRules()
        ]);

        // Map API alerts to local Alert type
        const mappedAlerts: Alert[] = alertsData.map((a: any) => ({
          id: a.id,
          title: a.title,
          description: a.description,
          priority: (a.severity === 'critical' || a.severity === 'high' || a.severity === 'medium' || a.severity === 'low') ? a.severity as AlertPriority : 'medium' as AlertPriority,
          status: a.status || 'active',
          category: a.category || 'risk',
          createdAt: a.timestamp || new Date().toISOString(),
          source: a.source || 'Neural Scanner'
        }));

        setAlerts(mappedAlerts);
        setRules(rulesData);
      } catch (err) {
        console.error('Failed to fetch alerts/rules', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
        <div className="absolute bottom-0 right-1/3 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-3">
              <BellRing className="text-amber-400" />
              {premiumLocales.alertCenter.title}
              <span className="ml-2 px-3 py-1 bg-amber-500/20 text-amber-400 text-sm rounded-full flex items-center gap-1">
                <Crown size={14} />
                Premium
              </span>
            </h1>
            <p className="text-slate-500 mt-1">
              {premiumLocales.alertCenter.subtitle}
            </p>
          </div>

          <div className="flex gap-4">
            <div className="hidden md:flex gap-6">
              <div className="text-center">
                <div className="text-2xl font-black text-white">{stats.active}</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-widest">{premiumLocales.alertCenter.stats.active}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black text-amber-500">{stats.critical}</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-widest">{premiumLocales.alertCenter.stats.critical}</div>
              </div>
            </div>
            <button className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-black font-black rounded-xl hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20">
              <Plus size={20} />
              <span className="hidden sm:inline">{premiumLocales.alertCenter.actions.addRule}</span>
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
            <p className="text-xs text-slate-500">{premiumLocales.alertCenter.stats.total}</p>
          </div>

          <div className="bg-slate-900/60 border border-cyan-500/20 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <Zap className="text-cyan-400" size={18} />
              <span className="text-2xl font-black text-cyan-400">{stats.active}</span>
            </div>
            <p className="text-xs text-slate-500">Активних</p>
          </div>

          <div className="bg-slate-900/60 border border-amber-500/20 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="text-amber-400" size={18} />
              <span className="text-2xl font-black text-amber-400">{stats.critical}</span>
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
            className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors ${tab === 'alerts' ? 'bg-amber-500/20 text-amber-400' : 'text-slate-500 hover:text-white'
              }`}
          >
            <span className="flex items-center gap-2">
              <Bell size={16} />
              {premiumLocales.alertCenter.tabs.alerts} ({stats.active})
            </span>
          </button>
          <button
            onClick={() => setTab('rules')}
            className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors ${tab === 'rules' ? 'bg-purple-500/20 text-purple-400' : 'text-slate-500 hover:text-white'
              }`}
          >
            <span className="flex items-center gap-2">
              <Settings size={16} />
              {premiumLocales.alertCenter.tabs.rules} ({rules.length})
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
                  placeholder={premiumLocales.alertCenter.rules.name + '...'}
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
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${filter === f
                      ? f === 'all' ? 'bg-white/10 text-white' :
                        f === 'critical' ? 'bg-amber-500/20 text-amber-400' :
                          f === 'high' ? 'bg-amber-500/20 text-amber-400' :
                            f === 'medium' ? 'bg-cyan-500/20 text-cyan-400' :
                              'bg-slate-700 text-slate-300'
                      : 'text-slate-500 hover:text-white'
                      }`}
                  >
                    {f === 'all' ? premiumLocales.alertCenter.stats.total : priorityConfig[f].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Alerts List */}
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4" />
                  <p className="text-slate-500 font-mono text-sm tracking-widest uppercase">Аналіз подій...</p>
                </div>
              ) : (
                <>
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
                      <p className="text-slate-500">{premiumLocales.alertCenter.empty.alerts}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}

        {/* Rules Tab */}
        {tab === 'rules' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading ? (
              <div className="col-span-full text-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto" />
              </div>
            ) : (
              rules.map((rule) => (
                <RuleCard
                  key={rule.id}
                  rule={rule}
                  onToggle={() => toggleRule(rule.id)}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertCenterPremium;
