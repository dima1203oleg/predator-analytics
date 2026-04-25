/**
 * AlertCenterView — консолідований центр алертів PREDATOR Analytics.
 * Системні, аналітичні та AML-алерти з пріоритизацією.
 * Фаза 3 v59.0-NEXUS.
 */

import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Bell,
  CheckCheck,
  ChevronDown,
  Clock,
  Eye,
  Filter,
  Radio,
  Shield,
  ShieldX,
  TrendingUp,
  X,
  Zap,
  Activity,
  Database,
} from 'lucide-react';

// ─── Типи ────────────────────────────────────────────────────────────────────

type AlertSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
type AlertSource = 'AML' | 'SYSTEM' | 'RISK' | 'OSINT' | 'MARKET' | 'INFRA';
type AlertStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';

interface Alert {
  id: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  source: AlertSource;
  status: AlertStatus;
  timestamp: string;
  affectedEntity?: string;
  riskDelta?: number;
}

// ─── Mock-дані ────────────────────────────────────────────────────────────────

const MOCK_ALERTS: Alert[] = [
  {
    id: 'ALT-001',
    title: 'Підозрілі транзакції — структурування',
    description: 'Виявлено 23 перекази в діапазоні 14,800–14,990 UAH протягом 48 годин. Імовірне структурування.',
    severity: 'CRITICAL',
    source: 'AML',
    status: 'ACTIVE',
    timestamp: '2025-04-20T12:45:00Z',
    affectedEntity: 'Рахунок UA213...',
    riskDelta: +35,
  },
  {
    id: 'ALT-002',
    title: 'PEP-зв\'язок 2-го рівня — Марченко Р.Г.',
    description: 'Досліджувана особа ідентифікована як партнер чиновника МММ. Рівень впливу: середній.',
    severity: 'HIGH',
    source: 'OSINT',
    status: 'ACTIVE',
    timestamp: '2025-04-20T11:20:00Z',
    affectedEntity: 'Марченко Р.Г.',
    riskDelta: +18,
  },
  {
    id: 'ALT-003',
    title: 'NVIDIA сервер — перегрів GPU',
    description: 'GPU0 досягла 87°C. VRAM 7.2 GB / 8.0 GB. Перехід на Colab рекомендовано.',
    severity: 'HIGH',
    source: 'INFRA',
    status: 'ACKNOWLEDGED',
    timestamp: '2025-04-20T10:55:00Z',
  },
  {
    id: 'ALT-004',
    title: 'Офшорна структура — BVI реєстрація',
    description: 'BRAVEX TRADING LTD зареєстрована в BVI. KYB-верифікація не завершена (5 днів).',
    severity: 'MEDIUM',
    source: 'RISK',
    status: 'ACTIVE',
    timestamp: '2025-04-20T09:10:00Z',
    affectedEntity: 'BRAVEX TRADING LTD',
    riskDelta: +12,
  },
  {
    id: 'ALT-005',
    title: 'Ринкова аномалія — пальмова олія',
    description: 'Різке зниження ціни на 14.2% за 3 дні. Підозра на демпінг з боку трейдерів РФ.',
    severity: 'MEDIUM',
    source: 'MARKET',
    status: 'ACTIVE',
    timestamp: '2025-04-20T08:30:00Z',
    riskDelta: -8,
  },
  {
    id: 'ALT-006',
    title: 'Kafka consumer — затримка обробки',
    description: 'Lag топіку customs-declarations перевищив 15,000 повідомлень. Перевірте ingestion worker.',
    severity: 'LOW',
    source: 'SYSTEM',
    status: 'RESOLVED',
    timestamp: '2025-04-19T22:15:00Z',
  },
  {
    id: 'ALT-007',
    title: 'Оновлення санкційного списку OFAC',
    description: 'Додано 47 нових суб\'єктів. Перевірка існуючих клієнтів на збіги в процесі.',
    severity: 'INFO',
    source: 'AML',
    status: 'ACKNOWLEDGED',
    timestamp: '2025-04-19T18:00:00Z',
  },
];

// ─── Конфігурація серйозності ─────────────────────────────────────────────────

const SEVERITY_CONFIG: Record<AlertSeverity, { label: string; color: string; dotColor: string; icon: React.ComponentType<{ className?: string }> }> = {
  CRITICAL: { label: 'КРИТИЧНО', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30', dotColor: 'bg-rose-500', icon: ShieldX },
  HIGH: { label: 'ВИСОКИЙ', color: 'text-orange-400 bg-orange-500/10 border-orange-500/25', dotColor: 'bg-orange-500', icon: AlertTriangle },
  MEDIUM: { label: 'СЕРЕДНІЙ', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', dotColor: 'bg-amber-500', icon: TrendingUp },
  LOW: { label: 'НИЗЬКИЙ', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', dotColor: 'bg-blue-500', icon: Shield },
  INFO: { label: 'ІНФО', color: 'text-slate-400 bg-slate-500/10 border-slate-500/15', dotColor: 'bg-slate-400', icon: Bell },
};

const SOURCE_CONFIG: Record<AlertSource, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  AML: { label: 'AML', icon: ShieldX },
  SYSTEM: { label: 'Система', icon: Database },
  RISK: { label: 'Ризик', icon: TrendingUp },
  OSINT: { label: 'OSINT', icon: Eye },
  MARKET: { label: 'Ринок', icon: Activity },
  INFRA: { label: 'Інфра', icon: Zap },
};

const STATUS_STYLE: Record<AlertStatus, string> = {
  ACTIVE: 'opacity-100',
  ACKNOWLEDGED: 'opacity-70',
  RESOLVED: 'opacity-40',
};

// ─── Компонент алерту ─────────────────────────────────────────────────────────

function AlertCard({ alert, onAck }: { alert: Alert; onAck: (id: string) => void }) {
  const severity = SEVERITY_CONFIG[alert.severity];
  const source = SOURCE_CONFIG[alert.source];
  const SeverityIcon = severity.icon;
  const SourceIcon = source.icon;

  const timeAgo = (() => {
    const diff = Date.now() - new Date(alert.timestamp).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} хв тому`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} год тому`;
    return `${Math.floor(hrs / 24)} дн тому`;
  })();

  return (
    <div className={`border border-white/[0.07] rounded-lg p-4 transition-all duration-300 ${STATUS_STYLE[alert.status]}
      ${alert.severity === 'CRITICAL' ? 'border-rose-500/20 bg-rose-500/[0.02]' : 'bg-white/[0.02]'}`}>
      <div className="flex items-start gap-4">
        {/* Іконка серйозності */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border ${severity.color}`}>
          <SeverityIcon className="w-4 h-4" />
        </div>

        {/* Контент */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-semibold text-white/90">{alert.title}</h3>
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border ${severity.color}`}>
                  {severity.label}
                </span>
                {alert.status === 'RESOLVED' && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                    <CheckCheck className="w-2.5 h-2.5" />
                    Вирішено
                  </span>
                )}
              </div>
              <p className="text-xs text-white/50 mt-1 leading-relaxed">{alert.description}</p>

              {alert.affectedEntity && (
                <div className="mt-2 flex items-center gap-2">
                  <Eye className="w-3 h-3 text-white/30" />
                  <span className="text-xs font-mono text-sky-400/70">{alert.affectedEntity}</span>
                  {alert.riskDelta !== undefined && (
                    <span className={`text-[10px] font-bold font-mono ${alert.riskDelta > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {alert.riskDelta > 0 ? '+' : ''}{alert.riskDelta} ризик
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Метадані + дії */}
            <div className="flex-shrink-0 flex flex-col items-end gap-2">
              <div className="flex items-center gap-1.5 text-[10px] text-white/30">
                <SourceIcon className="w-3 h-3" />
                <span>{source.label}</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-white/25 font-mono">
                <Clock className="w-2.5 h-2.5" />
                {timeAgo}
              </div>

              {alert.status === 'ACTIVE' && (
                <button
                  onClick={() => onAck(alert.id)}
                  className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] text-white/50 border border-white/10 hover:text-white/80 hover:border-white/20 transition-colors"
                >
                  <CheckCheck className="w-3 h-3" />
                  ПРИЙНЯТИ (ACK)
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Головний компонент ───────────────────────────────────────────────────────

export const AlertCenterView: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>(MOCK_ALERTS);
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | 'ALL'>('ALL');
  const [sourceFilter, setSourceFilter] = useState<AlertSource | 'ALL'>('ALL');
  const [showResolved, setShowResolved] = useState(false);

  const handleAck = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'ACKNOWLEDGED' as AlertStatus } : a)),
    );
  };

  const filtered = useMemo(() => {
    return alerts.filter((a) => {
      if (!showResolved && a.status === 'RESOLVED') return false;
      if (severityFilter !== 'ALL' && a.severity !== severityFilter) return false;
      if (sourceFilter !== 'ALL' && a.source !== sourceFilter) return false;
      return true;
    });
  }, [alerts, severityFilter, sourceFilter, showResolved]);

  const activeCount = alerts.filter((a) => a.status === 'ACTIVE').length;
  const criticalCount = alerts.filter((a) => a.severity === 'CRITICAL' && a.status === 'ACTIVE').length;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6 space-y-6">
      {/* Заголовок */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Bell className="w-5 h-5 text-amber-400" />
            {activeCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
                {activeCount}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Центр Сповіщень (Alert Center)</h1>
            <div className="flex items-center gap-3 mt-0.5">
              {criticalCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  <span className="text-xs text-rose-400">{criticalCount} критичних</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Radio className="w-3 h-3 text-white/30" />
                <span className="text-[10px] text-white/30 font-mono uppercase">LIVE</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs text-white/50 cursor-pointer">
            <input
              type="checkbox"
              checked={showResolved}
              onChange={(e) => setShowResolved(e.target.checked)}
              className="rounded border-white/20"
            />
            Показати вирішені
          </label>
        </div>
      </div>

      {/* Summary плашка */}
      <div className="grid grid-cols-5 gap-3">
        {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'] as AlertSeverity[]).map((s) => {
          const cfg = SEVERITY_CONFIG[s];
          const count = alerts.filter((a) => a.severity === s && a.status === 'ACTIVE').length;
          return (
            <button
              key={s}
              onClick={() => setSeverityFilter(severityFilter === s ? 'ALL' : s)}
              className={`p-3 rounded-lg border text-center transition-all ${
                severityFilter === s
                  ? `${cfg.color} border-opacity-50`
                  : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]'
              }`}
            >
              <div className={`text-xl font-bold font-mono ${severityFilter === s ? '' : 'text-white/60'}`}>{count}</div>
              <div className={`text-[10px] uppercase tracking-wider mt-1 ${severityFilter === s ? '' : 'text-white/30'}`}>
                {cfg.label}
              </div>
            </button>
          );
        })}
      </div>

      {/* Фільтри джерел */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-white/30" />
        {(['ALL', ...Object.keys(SOURCE_CONFIG)] as (AlertSource | 'ALL')[]).map((src) => (
          <button
            key={src}
            onClick={() => setSourceFilter(src)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              sourceFilter === src
                ? 'bg-sky-500/15 text-sky-400 border-sky-500/25'
                : 'bg-white/[0.03] text-white/40 border-white/[0.06] hover:text-white/60 hover:border-white/[0.12]'
            }`}
          >
            {src === 'ALL' ? 'Всі джерела' : SOURCE_CONFIG[src as AlertSource].label}
          </button>
        ))}

        <div className="ml-auto text-xs text-white/30 font-mono">
          {filtered.length} / {alerts.length} алертів
        </div>
      </div>

      {/* Список алертів */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-white/30">
            <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Немає алертів за вибраними фільтрами</p>
          </div>
        ) : (
          filtered.map((alert) => (
            <AlertCard key={alert.id} alert={alert} onAck={handleAck} />
          ))
        )}
      </div>
    </div>
  );
};

export default AlertCenterView;
