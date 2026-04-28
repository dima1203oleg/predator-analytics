/**
 * PREDATOR Live Intelligence Alerts - Система Алертів реального Часу
 *
 * Персоналізовані сповіщення для кожної цільової аудиторії:
 * - TITAN: конкурентні інсайди, цінові сигнали
 * - INQUISITOR: аномалії, підозрілі схеми
 * - SOVEREIGN: макро-тренди, системні ризики
 *
 * © 2026 PREDATOR Analytics
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, TrendingUp, DollarSign, Shield, Target,
  Crown, Zap, Bell, X, ChevronRight, Eye, Clock, Activity,
  Flame, Star, AlertCircle, CheckCircle, Info, ExternalLink
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { api } from '../../services/api';
import { premiumLocales } from '../../locales/uk/premium';

// Alert Types
export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type AlertCategory = 'competitor' | 'price' | 'anomaly' | 'scheme' | 'trend' | 'risk' | 'opportunity';

export interface IntelligenceAlert {
  id: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  category: AlertCategory;
  persona: 'TITAN' | 'INQUISITOR' | 'SOVEREIGN' | 'ALL';
  timestamp: Date;
  source: string;
  actionUrl?: string;
  metadata?: {
    company?: string;
    hsCode?: string;
    value?: number;
    change?: number;
    confidence?: number;
  };
  isRead: boolean;
  isPinned: boolean;
}

// Severity Config
const SEVERITY_CONFIG: Record<AlertSeverity, { color: string; icon: any; label: string }> = {
  critical: { color: 'rose', icon: Flame, label: premiumLocales.intelligenceAlerts.severity.critical },
  high: { color: 'orange', icon: AlertTriangle, label: premiumLocales.intelligenceAlerts.severity.high },
  medium: { color: 'amber', icon: AlertCircle, label: premiumLocales.intelligenceAlerts.severity.medium },
  low: { color: 'blue', icon: Info, label: premiumLocales.intelligenceAlerts.severity.low },
  info: { color: 'slate', icon: CheckCircle, label: premiumLocales.intelligenceAlerts.severity.info },
};

// Category Config
const CATEGORY_CONFIG: Record<AlertCategory, { icon: any; label: string }> = {
  competitor: { icon: Target, label: premiumLocales.intelligenceAlerts.categories.competitor },
  price: { icon: DollarSign, label: premiumLocales.intelligenceAlerts.categories.price },
  anomaly: { icon: AlertTriangle, label: premiumLocales.intelligenceAlerts.categories.anomaly },
  scheme: { icon: Shield, label: premiumLocales.intelligenceAlerts.categories.scheme },
  trend: { icon: TrendingUp, label: premiumLocales.intelligenceAlerts.categories.trend },
  risk: { icon: AlertCircle, label: premiumLocales.intelligenceAlerts.categories.risk },
  opportunity: { icon: Star, label: premiumLocales.intelligenceAlerts.categories.opportunity },
};

// Завантаження алертів з реального API
const fetchAlertsFromAPI = async (persona: string): Promise<IntelligenceAlert[]> => {
  try {
    const response = await fetch(`/api/v1/alerts?persona=${persona}&limit=50`);
    if (!response.ok) throw new Error('API unavailable');
    const data = await response.json();
    const items = Array.isArray(data) ? data : data.items || data.alerts || [];
    return items.map((item: any) => ({
      ...item,
      timestamp: new Date(item.timestamp || item.created_at),
      isRead: item.isRead ?? item.is_read ?? false,
      isPinned: item.isPinned ?? item.is_pinned ?? false,
    }));
  } catch (err) {
    console.warn('[LiveIntelligenceAlerts] API недоступний:', err);
    return [];
  }
};

// Single Alert Item
const AlertItem: React.FC<{
  alert: IntelligenceAlert;
  onMarkRead: (id: string) => void;
  onPin: (id: string) => void;
  onDismiss: (id: string) => void;
}> = ({ alert, onMarkRead, onPin, onDismiss }) => {
  const severity = SEVERITY_CONFIG[alert.severity];
  const category = CATEGORY_CONFIG[alert.category];
  const SeverityIcon = severity.icon;
  const CategoryIcon = category.icon;

  const timeAgo = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 1) return premiumLocales.intelligenceAlerts.time.justNow;
    if (minutes < 60) return `${minutes} ${premiumLocales.intelligenceAlerts.time.minutesAgo}`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} ${premiumLocales.intelligenceAlerts.time.hoursAgo}`;
    return `${Math.floor(hours / 24)} ${premiumLocales.intelligenceAlerts.time.daysAgo}`;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.95 }}
      className={cn(
        "p-4 rounded-2xl border backdrop-blur-xl transition-all group cursor-pointer",
        !alert.isRead && `bg-${severity.color}-500/10 border-${severity.color}-500/30`,
        alert.isRead && "bg-black/40 border-white/5 opacity-70",
        alert.isPinned && "ring-2 ring-amber-500/30"
      )}
      onClick={() => !alert.isRead && onMarkRead(alert.id)}
    >
      <div className="flex items-start gap-4">
        {/* Severity Icon */}
        <div className={cn(
          "p-2.5 rounded-xl shrink-0",
          `bg-${severity.color}-500/20`
        )}>
          <SeverityIcon className={`text-${severity.color}-400`} size={18} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn(
              "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded",
              `bg-${severity.color}-500/20 text-${severity.color}-400`
            )}>
              {severity.label}
            </span>
            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <CategoryIcon size={10} />
              {category.label}
            </span>
            {alert.isPinned && (
              <Star size={10} className="text-amber-400 fill-amber-400" />
            )}
          </div>

          <h4 className={cn(
            "text-sm font-black leading-tight mb-1",
            !alert.isRead ? "text-white" : "text-slate-400"
          )}>
            {alert.title}
          </h4>

          <p className="text-[10px] text-slate-500 leading-relaxed line-clamp-2 mb-2">
            {alert.description}
          </p>

          {/* Metadata */}
          {alert.metadata && (
            <div className="flex flex-wrap gap-2 mb-2">
              {alert.metadata.company && (
                <span className="text-[9px] font-mono bg-white/5 px-2 py-1 rounded">
                  🏢 {alert.metadata.company}
                </span>
              )}
              {alert.metadata.value && (
                <span className="text-[9px] font-mono bg-white/5 px-2 py-1 rounded">
                  💰 ${alert.metadata.value.toLocaleString()}
                </span>
              )}
              {alert.metadata.change && (
                <span className={cn(
                  "text-[9px] font-mono px-2 py-1 rounded",
                  alert.metadata.change > 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                )}>
                  {alert.metadata.change > 0 ? '↑' : '↓'} {Math.abs(alert.metadata.change)}%
                </span>
              )}
              {alert.metadata.confidence && (
                <span className="text-[9px] font-mono bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded">
                  🎯 {alert.metadata.confidence}%
                </span>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[9px] text-slate-600">
              <Clock size={10} />
              {timeAgo(alert.timestamp)}
              <span className="opacity-50">•</span>
              {alert.source}
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => { e.stopPropagation(); onPin(alert.id); }}
                title={alert.isPinned ? 'Відкріпити' : 'Закріпити'}
                className={cn(
                  "p-1.5 rounded-lg transition-all",
                  alert.isPinned ? "bg-amber-500/20 text-amber-400" : "bg-white/5 text-slate-500 hover:text-amber-400"
                )}
              >
                <Star size={12} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDismiss(alert.id); }}
                title="Відхилити"
                className="p-1.5 rounded-lg bg-white/5 text-slate-500 hover:text-rose-400 transition-all"
              >
                <X size={12} />
              </button>
              {alert.actionUrl && (
                <a
                  href={alert.actionUrl}
                  onClick={(e) => e.stopPropagation()}
                  title="Перейти до деталей"
                  className="p-1.5 rounded-lg bg-white/5 text-slate-500 hover:text-emerald-400 transition-all"
                >
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Main Alerts Panel Component
export const LiveIntelligenceAlerts: React.FC<{
  persona: string;
  maxAlerts?: number;
  compact?: boolean;
}> = ({ persona, maxAlerts = 10, compact = false }) => {
  const [alerts, setAlerts] = useState<IntelligenceAlert[]>([]);
  const [filter, setFilter] = useState<AlertSeverity | 'all'>('all');
  const [isExpanded, setIsExpanded] = useState(!compact);

  useEffect(() => {
    // Початкове завантаження з реального API
    const loadAlerts = async () => {
      const data = await fetchAlertsFromAPI(persona);
      setAlerts(data);
    };
    loadAlerts();

    // Полінг кожні 30 секунд для оновлення
    const interval = setInterval(async () => {
      const newAlerts = await fetchAlertsFromAPI(persona);
      setAlerts(newAlerts);
    }, 30000);

    return () => clearInterval(interval);
  }, [persona]);

  const handleMarkRead = useCallback((id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, isRead: true } : a));
  }, []);

  const handlePin = useCallback((id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, isPinned: !a.isPinned } : a));
  }, []);

  const handleDismiss = useCallback((id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  }, []);

  const filteredAlerts = alerts
    .filter(a => filter === 'all' || a.severity === filter)
    .slice(0, maxAlerts);

  const unreadCount = alerts.filter(a => !a.isRead).length;

  return (
    <div className="bg-slate-950/80 border border-white/10 rounded-[32px] backdrop-blur-xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/20 relative">
              <Bell className="text-rose-400" size={20} />
              {unreadCount > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center text-[10px] font-black text-white"
                >
                  {unreadCount}
                </motion.div>
              )}
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                {premiumLocales.intelligenceAlerts.title}
              </h3>
              <p className="text-[9px] text-slate-500 font-mono">
                {alerts.length} {premiumLocales.intelligenceAlerts.alertsCount} • {unreadCount} {premiumLocales.intelligenceAlerts.unreadCount}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Згорнути' : 'розгорнути'}
            className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-white transition-all"
          >
            <ChevronRight size={16} className={cn("transition-transform", isExpanded && "rotate-90")} />
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {['all', 'critical', 'high', 'medium', 'low'].map(sev => (
            <button
              key={sev}
              onClick={() => setFilter(sev as any)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all whitespace-nowrap",
                filter === sev
                  ? sev === 'all'
                    ? "bg-white/10 text-white"
                    : `bg-${SEVERITY_CONFIG[sev as AlertSeverity]?.color || 'slate'}-500/20 text-${SEVERITY_CONFIG[sev as AlertSeverity]?.color || 'slate'}-400`
                  : "bg-white/5 text-slate-500 hover:text-white"
              )}
            >
              {sev === 'all' ? premiumLocales.intelligenceAlerts.all : SEVERITY_CONFIG[sev as AlertSeverity]?.label}
              {sev !== 'all' && (
                <span className="ml-1 opacity-50">
                  ({alerts.filter(a => a.severity === sev).length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts List */}
      <AnimatePresence mode="popLayout">
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
              <AnimatePresence mode="popLayout">
                {filteredAlerts.map(alert => (
                  <AlertItem
                    key={alert.id}
                    alert={alert}
                    onMarkRead={handleMarkRead}
                    onPin={handlePin}
                    onDismiss={handleDismiss}
                  />
                ))}
              </AnimatePresence>

              {filteredAlerts.length === 0 && (
                <div className="text-center py-12 text-slate-600">
                  <Bell size={32} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">{premiumLocales.intelligenceAlerts.noAlerts}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Floating Alert Notification
export const FloatingAlertBadge: React.FC<{ count: number; onClick: () => void }> = ({ count, onClick }) => {
  if (count === 0) return null;

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className="fixed bottom-6 right-6 z-50 p-4 bg-rose-500 rounded-2xl shadow-2xl shadow-rose-500/40 text-white"
    >
      <Bell size={24} />
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="absolute -top-2 -right-2 w-6 h-6 bg-white text-rose-500 rounded-full flex items-center justify-center text-xs font-black"
      >
        {count}
      </motion.span>
    </motion.button>
  );
};

export default LiveIntelligenceAlerts;
